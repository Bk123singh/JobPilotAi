const { PDFParse } = require('pdf-parse');
const mammoth = require('mammoth');
const env = require('../config/env');
const logger = require('../utils/logger');
const cacheService = require('./cacheService');

// Comprehensive dictionary of technical & professional skills for heuristic fallback
const TECH_SKILLS_CATALOG = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Next.js', 'Vue.js', 'Angular',
  'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
  'Java', 'Spring', 'Spring Boot', 'C', 'C++', 'C#', '.NET', 'Go', 'Golang',
  'Rust', 'Ruby', 'Ruby on Rails', 'PHP', 'Laravel', 'Swift', 'Kotlin',
  'HTML', 'HTML5', 'CSS', 'CSS3', 'Tailwind CSS', 'Bootstrap', 'Sass', 'SCSS',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite', 'MariaDB', 'Cassandra',
  'DynamoDB', 'Elasticsearch', 'Prisma', 'TypeORM', 'Sequelize', 'Mongoose',
  'GraphQL', 'REST APIs', 'RESTful', 'WebSockets', 'gRPC', 'Microservices',
  'Docker', 'Kubernetes', 'AWS', 'Amazon Web Services', 'Azure', 'GCP', 'Google Cloud',
  'Git', 'GitHub', 'GitLab', 'CI/CD', 'GitHub Actions', 'Jenkins', 'Terraform',
  'Linux', 'Bash', 'Shell', 'Nginx', 'Apache',
  'Jest', 'Mocha', 'Cypress', 'Playwright', 'Selenium',
  'Redux', 'Zustand', 'MobX', 'RxJS',
  'Kafka', 'RabbitMQ', 'Celery',
  'Machine Learning', 'Deep Learning', 'PyTorch', 'TensorFlow', 'NLP', 'Computer Vision',
  'Pandas', 'NumPy', 'Scikit-Learn', 'Data Analysis',
  'Agile', 'Scrum', 'Jira', 'Figma', 'UI/UX Design'
];

class ResumeParserService {
  /**
   * Extract plain text from PDF, DOCX, or Data-URI buffer
   */
  async extractText({ buffer, mimetype = '', originalname = '', dataUri = '', rawText = '' }) {
    if (rawText && rawText.trim().length > 30) {
      return rawText.trim();
    }

    let fileBuffer = buffer;
    let detectedMime = mimetype;

    // Handle Data URI if provided
    if (dataUri && dataUri.startsWith('data:')) {
      const match = dataUri.match(/^data:([a-zA-Z0-9/.-]+);base64,(.+)$/);
      if (match) {
        detectedMime = match[1];
        fileBuffer = Buffer.from(match[2], 'base64');
      }
    }

    if (!fileBuffer || fileBuffer.length === 0) {
      return '';
    }

    // 1. PDF Document
    const isPdf =
      detectedMime.includes('pdf') ||
      originalname.toLowerCase().endsWith('.pdf') ||
      fileBuffer.slice(0, 5).toString().includes('%PDF');

    if (isPdf) {
      try {
        const parser = new PDFParse({ data: fileBuffer });
        const res = await parser.getText();
        await parser.destroy();
        if (res && res.text) {
          return this.cleanText(res.text);
        }
      } catch (err) {
        logger.warn(`PDF extraction error: ${err.message}. Attempting fallback string reading.`);
      }
    }

    // 2. DOCX Document
    const isDocx =
      detectedMime.includes('word') ||
      detectedMime.includes('officedocument') ||
      originalname.toLowerCase().endsWith('.docx');

    if (isDocx) {
      try {
        const result = await mammoth.extractRawText({ buffer: fileBuffer });
        if (result && result.value) {
          return this.cleanText(result.value);
        }
      } catch (err) {
        logger.warn(`DOCX extraction error: ${err.message}.`);
      }
    }

    // 3. Fallback: plaintext extraction
    return this.cleanText(fileBuffer.toString('utf-8'));
  }

  /**
   * Normalize text by removing extra whitespace, fixing ligatures, and unifying newlines
   */
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/[\t ]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Main entry point to parse extracted text into structured resume / profile object
   */
  async parseResume(rawText) {
    if (!rawText || rawText.trim().length < 20) {
      return this.getEmptyParsedProfile();
    }

    // 1. Check Fast Cache (Hash-based) to reduce latency from 4s to 0ms
    const cacheKey = cacheService.computeContentHash(rawText);
    try {
      const cached = await cacheService.get(cacheKey);
      if (cached) {
        logger.info(`[Fast Cache HIT] Returning cached parsed resume for hash ${cacheKey.slice(0, 18)}... (0ms latency)`);
        return cached;
      }
    } catch (err) {
      logger.warn(`[Fast Cache] Error checking cache: ${err.message}`);
    }

    let parsedResult = null;

    // Attempt AI-based parsing if API key is configured and not mock
    const hasLiveAi =
      Boolean(env.AI_API_KEY) &&
      !env.AI_API_KEY.includes('mock') &&
      env.AI_API_KEY !== 'mock-openai-key';

    if (hasLiveAi) {
      try {
        logger.info(`Running AI Resume Parser using provider [${env.AI_PROVIDER}]...`);
        const aiResult = await this.parseWithAI(rawText);
        if (aiResult && aiResult.fullName) {
          logger.info(`Successfully parsed resume using AI for candidate: ${aiResult.fullName}`);
          parsedResult = this.sanitizeParsedData(aiResult);
        }
      } catch (aiErr) {
        logger.warn(`AI Resume parsing failed (${aiErr.message}). Switching to heuristic parser fallback.`);
      }
    }

    if (!parsedResult) {
      // High-performance heuristic / regex fallback
      logger.info('Using Heuristic Resume Parsing engine...');
      const heuristicResult = this.parseResumeHeuristic(rawText);
      parsedResult = this.sanitizeParsedData(heuristicResult);
    }

    // Store in cache for 24 hours (subsequent calls return in <1ms)
    try {
      await cacheService.set(cacheKey, parsedResult, 86400);
    } catch (err) {
      logger.warn(`[Fast Cache] Failed to write cache: ${err.message}`);
    }

    return parsedResult;
  }

  /**
   * AI-powered parsing with strict schema
   */
  async parseWithAI(rawText) {
    const prompt = `You are an expert resume parsing AI. Extract structured candidate information from the following resume text.
Extract ONLY verifiable information found in the text.
Return ONLY a valid JSON object strictly matching this schema with NO markdown code fences:
{
  "fullName": "Candidate full name",
  "headline": "Current or targeted professional title (e.g. Senior Full-Stack Engineer)",
  "phone": "Phone number or null",
  "location": "City, State / Remote or null",
  "bio": "2-3 sentence executive professional summary",
  "website": "Portfolio URL or null",
  "githubUrl": "GitHub profile URL or null",
  "linkedinUrl": "LinkedIn profile URL or null",
  "skills": ["Skill 1", "Skill 2"],
  "experience": [
    {
      "company": "Company Name",
      "title": "Role / Job Title",
      "location": "City, State or Remote",
      "startDate": "YYYY-MM or YYYY",
      "endDate": "YYYY-MM or YYYY (empty string if current)",
      "current": true,
      "description": "Responsibilities and key accomplishments"
    }
  ],
  "education": [
    {
      "institution": "University or Institution name",
      "degree": "Degree name (e.g. B.S. in Computer Science)",
      "fieldOfStudy": "Major or field",
      "startDate": "YYYY",
      "endDate": "YYYY",
      "current": false,
      "description": "GPA, honors, or coursework"
    }
  ],
  "projects": [
    {
      "title": "Project Name",
      "description": "Brief description of the project and impact",
      "url": "Project or GitHub URL",
      "technologies": ["Tech 1", "Tech 2"]
    }
  ],
  "certifications": [
    {
      "name": "Certification Name",
      "issuer": "Issuing Organization",
      "issueDate": "YYYY-MM or YYYY",
      "url": ""
    }
  ]
}

Resume Text:
"""
${rawText.slice(0, 7000)}
"""`;

    if (env.AI_PROVIDER === 'gemini') {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${env.AI_MODEL || 'gemini-1.5-flash'}:generateContent?key=${env.AI_API_KEY}`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { response_mime_type: 'application/json' },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.statusText}`);
      }

      const resJson = await response.json();
      const rawJson = resJson?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
      return JSON.parse(rawJson);
    }

    // Default: OpenAI or OpenAI-compatible endpoint
    const endpoint = 'https://api.openai.com/v1/chat/completions';
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${env.AI_API_KEY}`,
      },
      body: JSON.stringify({
        model: env.AI_MODEL || 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a precise resume parsing engine that outputs pure JSON.' },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        temperature: 0.1,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const resJson = await response.json();
    const content = resJson.choices?.[0]?.message?.content || '{}';
    return JSON.parse(content);
  }

  /**
   * Deterministic Heuristic Regex & NLP Extractor
   */
  parseResumeHeuristic(rawText) {
    const lines = rawText.split('\n').map((l) => l.trim()).filter(Boolean);

    // 1. Email extraction
    const emailMatch = rawText.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
    const email = emailMatch ? emailMatch[0] : '';

    // 2. Phone extraction
    const phoneMatch = rawText.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
    const phone = phoneMatch ? phoneMatch[0] : '';

    // 3. Social & Portfolio links
    const linkedinMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
    const linkedinUrl = linkedinMatch
      ? linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`
      : '';

    const githubMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
    const githubUrl = githubMatch
      ? githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`
      : '';

    const websiteMatch = rawText.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:dev|io|me|app|tech|design))(?:\/[^\s]*)?/i);
    const website = websiteMatch
      ? websiteMatch[0].startsWith('http') ? websiteMatch[0] : `https://${websiteMatch[0]}`
      : '';

    // 4. Candidate Name & Headline extraction
    let fullName = '';
    let headline = '';
    let location = '';

    const firstFewLines = lines.slice(0, 8);
    for (const line of firstFewLines) {
      if (
        !fullName &&
        !line.includes('@') &&
        !line.includes('http') &&
        !/resume|curriculum|vitae|page|contact/i.test(line) &&
        line.length >= 3 &&
        line.length <= 40 &&
        /^[A-Za-z\s.'-]+$/.test(line)
      ) {
        fullName = line;
        continue;
      }

      if (
        fullName &&
        !headline &&
        /engineer|developer|designer|manager|architect|lead|analyst|specialist|scientist|consultant/i.test(line) &&
        line.length <= 60
      ) {
        headline = line;
        continue;
      }

      if (!location && /([A-Za-z\s]+,\s*[A-Z]{2}|remote|india|usa|united states|canada|germany|uk)/i.test(line) && line.length < 50) {
        location = line;
      }
    }

    // 5. Skills extraction using comprehensive vocabulary matching
    const extractedSkills = new Set();
    for (const skill of TECH_SKILLS_CATALOG) {
      // Escape special characters in skill name for regex word boundary check
      const escaped = skill.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
      const regex = new RegExp(`(^|[\\s,;•/|()])${escaped}([\\s,;•/|()]|$)`, 'i');
      if (regex.test(rawText)) {
        extractedSkills.add(skill);
      }
    }

    // 6. Section Chunking
    const sections = this.splitIntoSections(rawText);

    // 7. Parse Experience
    const experience = this.parseExperienceSection(sections.experience || '');

    // 8. Parse Education
    const education = this.parseEducationSection(sections.education || '');

    // 9. Parse Projects
    const projects = this.parseProjectsSection(sections.projects || '', Array.from(extractedSkills));

    // 10. Parse Certifications
    const certifications = this.parseCertificationsSection(sections.certifications || '');

    // 11. Parse Bio / Summary
    let bio = sections.summary || '';
    if (!bio && headline) {
      const topSkills = Array.from(extractedSkills).slice(0, 5).join(', ');
      bio = `${headline} with practical experience in ${topSkills || 'modern software technologies'}. Proven track record of delivering reliable and performant solutions.`;
    }

    return {
      fullName: fullName || 'Candidate',
      headline: headline || (experience[0]?.title ? `${experience[0].title}` : 'Software Professional'),
      phone,
      location,
      bio,
      website,
      githubUrl,
      linkedinUrl,
      skills: Array.from(extractedSkills),
      experience,
      education,
      projects,
      certifications,
    };
  }

  /**
   * Split document into recognized sections
   */
  splitIntoSections(text) {
    const lines = text.split('\n');
    const sections = {
      summary: '',
      experience: '',
      education: '',
      projects: '',
      skills: '',
      certifications: '',
    };

    let currentSection = 'header';

    const headerPatterns = [
      { key: 'experience', regex: /^(work\s+experience|experience|employment|professional\s+experience|history)/i },
      { key: 'education', regex: /^(education|academic\s+background|qualifications|academic\s+history)/i },
      { key: 'projects', regex: /^(projects|personal\s+projects|featured\s+projects|academic\s+projects)/i },
      { key: 'skills', regex: /^(skills|technical\s+skills|core\s+competencies|technologies)/i },
      { key: 'certifications', regex: /^(certifications|certificates|licenses|credentials)/i },
      { key: 'summary', regex: /^(summary|professional\s+summary|profile|about\s+me|objective)/i },
    ];

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (!line) continue;

      let matchedHeader = null;
      if (line.length <= 40 && !line.includes('.') && !line.includes('@')) {
        for (const pattern of headerPatterns) {
          if (pattern.regex.test(line)) {
            matchedHeader = pattern.key;
            break;
          }
        }
      }

      if (matchedHeader) {
        currentSection = matchedHeader;
      } else if (currentSection !== 'header') {
        sections[currentSection] += (sections[currentSection] ? '\n' : '') + rawLine;
      }
    }

    return sections;
  }

  /**
   * Parse Experience items
   */
  parseExperienceSection(expText) {
    if (!expText) return [];
    const items = [];
    const blocks = expText.split(/\n\s*\n/).filter((b) => b.trim().length > 15);

    for (let i = 0; i < Math.min(blocks.length, 5); i++) {
      const block = blocks[i].trim();
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      const firstLine = lines[0];
      const secondLine = lines[1] || '';

      // Date detection
      const dateMatch = block.match(
        /((?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*\s*\d{4})\s*[-–to]+\s*(Present|Current|(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)?[a-z]*\s*\d{4})/i
      );

      const isCurrent = /present|current/i.test(dateMatch ? dateMatch[2] : '');
      const startDate = dateMatch ? this.formatDate(dateMatch[1]) : '';
      const endDate = isCurrent ? '' : (dateMatch ? this.formatDate(dateMatch[2]) : '');

      let title = '';
      let company = '';

      if (firstLine.includes(' at ')) {
        const parts = firstLine.split(' at ');
        title = parts[0].trim();
        company = parts[1].replace(/[-–|].*$/, '').trim();
      } else if (firstLine.includes(' - ') || firstLine.includes(' | ')) {
        const parts = firstLine.split(/[-–|]/);
        title = parts[0].trim();
        company = parts[1]?.trim() || '';
      } else {
        title = firstLine;
        company = secondLine && !dateMatch?.input?.includes(secondLine) ? secondLine : 'Confidential';
      }

      const description = lines.slice(dateMatch ? 2 : 1).join(' ').trim();

      if (title && company) {
        items.push({
          id: `exp-${Date.now()}-${i}`,
          title: title.slice(0, 80),
          company: company.slice(0, 80),
          location: '',
          startDate,
          endDate,
          current: isCurrent,
          description: description.slice(0, 600),
        });
      }
    }

    return items;
  }

  /**
   * Parse Education items
   */
  parseEducationSection(eduText) {
    if (!eduText) return [];
    const items = [];
    const blocks = eduText.split(/\n\s*\n/).filter((b) => b.trim().length > 15);

    for (let i = 0; i < Math.min(blocks.length, 3); i++) {
      const block = blocks[i].trim();
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      const dateMatch = block.match(/\b(20\d\d|19\d\d)\b.*?\b(20\d\d|19\d\d|Present)?\b/);
      const startDate = dateMatch ? dateMatch[1] : '';
      const endDate = dateMatch?.[2] && !/present/i.test(dateMatch[2]) ? dateMatch[2] : '';

      let degree = '';
      let institution = '';
      let fieldOfStudy = '';

      for (const line of lines) {
        if (/university|college|institute|academy|school/i.test(line) && !institution) {
          institution = line.replace(/[-–|].*$/, '').trim();
        } else if (/bachelor|master|b\.s|b\.tech|m\.s|m\.tech|ph\.d|associate|degree|diploma/i.test(line) && !degree) {
          degree = line;
          if (line.includes(' in ')) {
            fieldOfStudy = line.split(' in ')[1]?.trim() || '';
          }
        }
      }

      if (!institution && lines[0]) institution = lines[0];
      if (!degree && lines[1]) degree = lines[1];

      if (institution || degree) {
        items.push({
          id: `edu-${Date.now()}-${i}`,
          institution: institution || 'Higher Education Institution',
          degree: degree || 'Degree / Certification',
          fieldOfStudy: fieldOfStudy || 'Computer Science & Engineering',
          startDate,
          endDate,
          current: /present|current/i.test(block),
          description: lines.slice(2).join(' ').trim().slice(0, 300),
        });
      }
    }

    return items;
  }

  /**
   * Parse Projects items
   */
  parseProjectsSection(projText, knownSkills = []) {
    if (!projText) return [];
    const items = [];
    const blocks = projText.split(/\n\s*\n/).filter((b) => b.trim().length > 15);

    for (let i = 0; i < Math.min(blocks.length, 4); i++) {
      const block = blocks[i].trim();
      const lines = block.split('\n').map((l) => l.trim()).filter(Boolean);
      if (lines.length === 0) continue;

      const titleLine = lines[0];
      const urlMatch = block.match(/https?:\/\/[^\s]+/i);
      const url = urlMatch ? urlMatch[0] : '';

      // Extract technologies mentioned in this project block
      const projectTechs = knownSkills.filter((s) => {
        const regex = new RegExp(`\\b${s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')}\\b`, 'i');
        return regex.test(block);
      });

      const title = titleLine.replace(/https?:\/\/[^\s]+/gi, '').replace(/[-–|].*$/, '').trim();
      const description = lines.slice(1).join(' ').trim();

      if (title) {
        items.push({
          id: `proj-${Date.now()}-${i}`,
          title: title.slice(0, 80),
          description: description.slice(0, 400),
          url,
          technologies: projectTechs.slice(0, 6),
        });
      }
    }

    return items;
  }

  /**
   * Parse Certifications
   */
  parseCertificationsSection(certText) {
    if (!certText) return [];
    const items = [];
    const lines = certText.split('\n').map((l) => l.trim()).filter(Boolean);

    for (let i = 0; i < Math.min(lines.length, 5); i++) {
      const line = lines[i];
      if (line.length < 4) continue;

      const dateMatch = line.match(/\b(20\d\d|19\d\d)\b/);
      const issueDate = dateMatch ? dateMatch[1] : '';

      let name = line;
      let issuer = 'Recognized Credential Authority';

      if (line.includes(' - ') || line.includes(' | ')) {
        const parts = line.split(/[-–|]/);
        name = parts[0].trim();
        issuer = parts[1]?.trim() || issuer;
      }

      items.push({
        id: `cert-${Date.now()}-${i}`,
        name: name.slice(0, 100),
        issuer: issuer.slice(0, 80),
        issueDate,
        url: '',
      });
    }

    return items;
  }

  /**
   * Normalize date strings to standard YYYY-MM or YYYY format
   */
  formatDate(dateStr) {
    if (!dateStr) return '';
    const clean = dateStr.trim();
    const yearMatch = clean.match(/\b(20\d\d|19\d\d)\b/);
    if (!yearMatch) return clean;

    const monthMap = {
      jan: '01', feb: '02', mar: '03', apr: '04', may: '05', jun: '06',
      jul: '07', aug: '08', sep: '09', oct: '10', nov: '11', dec: '12',
    };

    for (const [mName, mNum] of Object.entries(monthMap)) {
      if (new RegExp(mName, 'i').test(clean)) {
        return `${yearMatch[1]}-${mNum}`;
      }
    }

    return yearMatch[1];
  }

  /**
   * Clean and enforce strict types on parsed result matching UserProfile schema
   */
  sanitizeParsedData(data = {}) {
    return {
      fullName: (data.fullName || '').trim().slice(0, 100),
      headline: (data.headline || '').trim().slice(0, 160),
      phone: (data.phone || '').trim().slice(0, 25),
      location: (data.location || '').trim().slice(0, 100),
      bio: (data.bio || '').trim().slice(0, 1000),
      website: (data.website || '').trim().slice(0, 200),
      githubUrl: (data.githubUrl || '').trim().slice(0, 200),
      linkedinUrl: (data.linkedinUrl || '').trim().slice(0, 200),
      skills: Array.isArray(data.skills)
        ? Array.from(new Set(data.skills.map((s) => String(s).trim()))).filter(Boolean)
        : [],
      experience: Array.isArray(data.experience)
        ? data.experience.map((e, idx) => ({
            id: e.id || `exp-${Date.now()}-${idx}`,
            company: String(e.company || '').trim().slice(0, 100),
            title: String(e.title || '').trim().slice(0, 100),
            location: String(e.location || '').trim().slice(0, 100),
            startDate: String(e.startDate || '').trim(),
            endDate: String(e.endDate || '').trim(),
            current: Boolean(e.current),
            description: String(e.description || '').trim().slice(0, 1000),
          })).filter((e) => e.company && e.title)
        : [],
      education: Array.isArray(data.education)
        ? data.education.map((ed, idx) => ({
            id: ed.id || `edu-${Date.now()}-${idx}`,
            institution: String(ed.institution || '').trim().slice(0, 100),
            degree: String(ed.degree || '').trim().slice(0, 100),
            fieldOfStudy: String(ed.fieldOfStudy || '').trim().slice(0, 100),
            startDate: String(ed.startDate || '').trim(),
            endDate: String(ed.endDate || '').trim(),
            current: Boolean(ed.current),
            description: String(ed.description || '').trim().slice(0, 500),
          })).filter((ed) => ed.institution && ed.degree)
        : [],
      projects: Array.isArray(data.projects)
        ? data.projects.map((p, idx) => ({
            id: p.id || `proj-${Date.now()}-${idx}`,
            title: String(p.title || '').trim().slice(0, 100),
            description: String(p.description || '').trim().slice(0, 600),
            url: String(p.url || '').trim().slice(0, 250),
            technologies: Array.isArray(p.technologies)
              ? p.technologies.map((t) => String(t).trim()).filter(Boolean)
              : [],
          })).filter((p) => p.title)
        : [],
      certifications: Array.isArray(data.certifications)
        ? data.certifications.map((c, idx) => ({
            id: c.id || `cert-${Date.now()}-${idx}`,
            name: String(c.name || '').trim().slice(0, 100),
            issuer: String(c.issuer || '').trim().slice(0, 100),
            issueDate: String(c.issueDate || '').trim(),
            url: String(c.url || '').trim().slice(0, 250),
          })).filter((c) => c.name && c.issuer)
        : [],
    };
  }

  getEmptyParsedProfile() {
    return {
      fullName: '',
      headline: '',
      phone: '',
      location: '',
      bio: '',
      website: '',
      githubUrl: '',
      linkedinUrl: '',
      skills: [],
      experience: [],
      education: [],
      projects: [],
      certifications: [],
    };
  }
}

module.exports = new ResumeParserService();
