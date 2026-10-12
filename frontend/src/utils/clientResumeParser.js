// Client-Side Heuristic Resume Parser
// Provides immediate parsing fallback if remote server hasn't updated its routes yet

const TECH_SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'React Native', 'Next.js', 'Vue.js', 'Angular',
  'Node.js', 'Express', 'NestJS', 'Python', 'Django', 'FastAPI', 'Flask',
  'Java', 'Spring', 'Spring Boot', 'C++', 'C#', '.NET', 'Go', 'Golang',
  'Rust', 'Ruby', 'Ruby on Rails', 'PHP', 'Laravel', 'Swift', 'Kotlin',
  'HTML', 'CSS', 'Tailwind CSS', 'Bootstrap', 'Sass',
  'PostgreSQL', 'MySQL', 'MongoDB', 'Redis', 'SQLite',
  'GraphQL', 'REST APIs', 'RESTful', 'WebSockets', 'Microservices',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP',
  'Git', 'GitHub', 'CI/CD', 'Linux',
  'Redux', 'Zustand', 'Jest', 'Figma'
];

export const parseResumeClientSide = (rawText = '', fileName = '') => {
  const clean = (rawText || '')
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/[\t ]+/g, ' ')
    .trim();

  const lines = clean.split('\n').map((l) => l.trim()).filter(Boolean);

  // Email & Phone
  const emailMatch = clean.match(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);
  const phoneMatch = clean.match(/(?:\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/);
  const linkedinMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/([a-zA-Z0-9_-]+)/i);
  const githubMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)/i);
  const websiteMatch = clean.match(/(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.(?:dev|io|me|app|com|org))(?:\/[^\s]*)?/i);

  // Name & Headline
  let fullName = '';
  let headline = '';
  let location = '';

  const firstFew = lines.slice(0, 10);
  for (const line of firstFew) {
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
      line.length <= 70
    ) {
      headline = line;
      continue;
    }

    if (!location && /([A-Za-z\s]+,\s*[A-Z]{2}|remote|india|usa|united states|canada|germany|uk)/i.test(line) && line.length < 50) {
      location = line;
    }
  }

  if (!fullName && fileName) {
    fullName = fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').replace(/resume/i, '').trim();
  }

  // Skills
  const extractedSkills = new Set();
  for (const s of TECH_SKILLS) {
    const escaped = s.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&');
    const regex = new RegExp(`(^|[\\s,;•/|()])${escaped}([\\s,;•/|()]|$)`, 'i');
    if (regex.test(clean)) {
      extractedSkills.add(s);
    }
  }

  // Experience extraction
  const experience = [];
  const expIndex = lines.findIndex((l) => /^(experience|work experience|employment history)/i.test(l));
  if (expIndex !== -1) {
    const expLines = lines.slice(expIndex + 1, expIndex + 25);
    for (let i = 0; i < expLines.length; i++) {
      const line = expLines[i];
      if (/^(education|projects|skills|certifications)/i.test(line)) break;
      if (line.includes(' at ') || line.includes(' - ') || /engineer|developer|lead|manager|consultant/i.test(line)) {
        const parts = line.split(/at|[-–|]/);
        experience.push({
          id: `exp-${Date.now()}-${experience.length}`,
          title: (parts[0] || line).trim().slice(0, 80),
          company: (parts[1] || 'Company').trim().slice(0, 80),
          location: '',
          startDate: '2022',
          endDate: '',
          current: true,
          description: expLines[i + 1] && !expLines[i + 1].includes(' - ') ? expLines[i + 1].slice(0, 300) : '',
        });
        i++;
      }
    }
  }

  // Education extraction
  const education = [];
  const eduIndex = lines.findIndex((l) => /^(education|academic)/i.test(l));
  if (eduIndex !== -1) {
    const eduLines = lines.slice(eduIndex + 1, eduIndex + 15);
    for (const line of eduLines) {
      if (/^(projects|skills|certifications|experience)/i.test(line)) break;
      if (/university|college|institute|bachelor|master|b\.s|b\.tech|m\.s/i.test(line)) {
        education.push({
          id: `edu-${Date.now()}-${education.length}`,
          institution: line.slice(0, 80),
          degree: 'B.S. in Computer Science',
          fieldOfStudy: 'Computer Science',
          startDate: '2018',
          endDate: '2022',
          current: false,
          description: '',
        });
      }
    }
  }

  return {
    fullName: fullName || 'Candidate',
    headline: headline || 'Software Engineer',
    phone: phoneMatch ? phoneMatch[0] : '',
    location: location || '',
    bio: clean.slice(0, 300),
    website: websiteMatch ? websiteMatch[0] : '',
    githubUrl: githubMatch ? (githubMatch[0].startsWith('http') ? githubMatch[0] : `https://${githubMatch[0]}`) : '',
    linkedinUrl: linkedinMatch ? (linkedinMatch[0].startsWith('http') ? linkedinMatch[0] : `https://${linkedinMatch[0]}`) : '',
    skills: Array.from(extractedSkills),
    experience,
    education,
    projects: [],
    certifications: [],
  };
};
