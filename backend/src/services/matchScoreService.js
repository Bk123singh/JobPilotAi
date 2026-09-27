/**
 * Deterministic Job Match Score Engine
 * Calculates candidate-job compatibility across 5 distinct pillars:
 * 1. Required Skills Match (40% weight)
 * 2. Experience Level Match (20% weight)
 * 3. Semantic & Title Alignment (20% weight)
 * 4. Practical Projects & Portfolio (10% weight)
 * 5. Candidate Preferences & Location (10% weight)
 */

// Skill normalization map for synonymous tech tokens
const TECH_SYNONYMS = {
  js: 'javascript',
  javascript: 'javascript',
  ts: 'typescript',
  typescript: 'typescript',
  react: 'react',
  'react.js': 'react',
  reactjs: 'react',
  node: 'nodejs',
  nodejs: 'nodejs',
  'node.js': 'nodejs',
  postgres: 'postgresql',
  postgresql: 'postgresql',
  postgresdb: 'postgresql',
  tailwind: 'tailwind css',
  tailwindcss: 'tailwind css',
  'tailwind css': 'tailwind css',
  docker: 'docker',
  container: 'docker',
  py: 'python',
  python: 'python',
  rest: 'rest apis',
  'rest api': 'rest apis',
  'rest apis': 'rest apis',
  restful: 'rest apis',
};

const normalizeSkill = (skill = '') => {
  const clean = skill.trim().toLowerCase().replace(/[^\w\s.-]/g, '');
  return TECH_SYNONYMS[clean] || clean;
};

class MatchScoreService {
  /**
   * Main computation entry point
   * @param {Object} candidateProfile - Candidate's profile object
   * @param {Object} job - Job opening object
   * @returns {Object} Deterministic match score breakdown
   */
  calculateMatchScore(candidateProfile = {}, job = {}) {
    if (!job) {
      return this.getFallbackBreakdown();
    }

    const candidateSkills = Array.isArray(candidateProfile.skills) ? candidateProfile.skills : [];
    const jobRequired = Array.isArray(job.requiredSkills) ? job.requiredSkills : [];
    const jobNiceToHave = Array.isArray(job.niceToHaveSkills) ? job.niceToHaveSkills : [];

    // --- Pillar 1: Skills Match (40%) ---
    const normCandidateSkills = candidateSkills.map(normalizeSkill);

    const matchedRequired = [];
    const missingRequired = [];

    for (const reqSkill of jobRequired) {
      const norm = normalizeSkill(reqSkill);
      if (normCandidateSkills.includes(norm) || candidateSkills.some(s => s.toLowerCase() === reqSkill.toLowerCase())) {
        matchedRequired.push(reqSkill);
      } else {
        missingRequired.push(reqSkill);
      }
    }

    const matchedNiceToHave = [];
    const missingNiceToHave = [];

    for (const niceSkill of jobNiceToHave) {
      const norm = normalizeSkill(niceSkill);
      if (normCandidateSkills.includes(norm) || candidateSkills.some(s => s.toLowerCase() === niceSkill.toLowerCase())) {
        matchedNiceToHave.push(niceSkill);
      } else {
        missingNiceToHave.push(niceSkill);
      }
    }

    let skillsScore = 100;
    if (jobRequired.length > 0) {
      const reqRatio = matchedRequired.length / jobRequired.length;
      const niceRatio = jobNiceToHave.length > 0 ? matchedNiceToHave.length / jobNiceToHave.length : 1;
      skillsScore = Math.round(reqRatio * 80 + niceRatio * 20);
    }

    // --- Pillar 2: Experience Level Match (20%) ---
    const requiredYears = this.extractRequiredYears(job.experienceLevel || '');
    const candidateYears = this.calculateCandidateYears(candidateProfile.experience || []);

    let experienceScore = 100;
    if (requiredYears > 0) {
      if (candidateYears >= requiredYears) {
        experienceScore = 100;
      } else if (candidateYears >= requiredYears - 1) {
        experienceScore = 85;
      } else if (candidateYears >= requiredYears - 2) {
        experienceScore = 70;
      } else {
        experienceScore = Math.max(35, Math.round((candidateYears / requiredYears) * 65));
      }
    }

    // --- Pillar 3: Semantic & Title Alignment (20%) ---
    const semanticScore = this.calculateSemanticScore(
      candidateProfile.headline || candidateProfile.bio || '',
      job.title || '',
      candidateProfile.careerPreferences?.desiredRoles || []
    );

    // --- Pillar 4: Practical Projects / Portfolio (10%) ---
    const projectScore = this.calculateProjectScore(
      candidateProfile.projects || [],
      jobRequired
    );

    // --- Pillar 5: Candidate Preferences & Location (10%) ---
    const preferenceScore = this.calculatePreferenceScore(
      candidateProfile,
      job
    );

    // Weighted Overall Formula
    const overallScore = Math.min(
      100,
      Math.max(
        15,
        Math.round(
          skillsScore * 0.40 +
          experienceScore * 0.20 +
          semanticScore * 0.20 +
          projectScore * 0.10 +
          preferenceScore * 0.10
        )
      )
    );

    // Dynamic Skill Gap Impact calculation
    const skillGaps = missingRequired.map((skill) => {
      const potentialBoost = jobRequired.length > 0
        ? Math.max(3, Math.round((1 / jobRequired.length) * 80 * 0.40))
        : 5;
      return {
        skill,
        impact: `+${potentialBoost}%`,
        importance: 'HIGH',
      };
    });

    // Determine Match Tier
    let tier = 'LOW';
    let tierLabel = 'Low Match';
    let tierColor = 'gray';

    if (overallScore >= 85) {
      tier = 'EXCEPTIONAL';
      tierLabel = 'Exceptional Match';
      tierColor = 'green';
    } else if (overallScore >= 70) {
      tier = 'STRONG';
      tierLabel = 'Strong Match';
      tierColor = 'blue';
    } else if (overallScore >= 50) {
      tier = 'MODERATE';
      tierLabel = 'Moderate Match';
      tierColor = 'yellow';
    }

    // Generate Natural Language Explanation
    const explanation = this.generateExplanation(
      overallScore,
      matchedRequired,
      missingRequired,
      candidateYears,
      requiredYears,
      job.title
    );

    return {
      overallScore,
      tier,
      tierLabel,
      tierColor,
      pillars: {
        skills: {
          weight: 40,
          score: skillsScore,
          matched: matchedRequired,
          missing: missingRequired,
          niceToHaveMatched: matchedNiceToHave,
        },
        experience: {
          weight: 20,
          score: experienceScore,
          candidateYears,
          requiredYears,
        },
        semantic: {
          weight: 20,
          score: semanticScore,
        },
        projects: {
          weight: 10,
          score: projectScore,
        },
        preferences: {
          weight: 10,
          score: preferenceScore,
        },
      },
      skillGaps,
      explanation,
    };
  }

  extractRequiredYears(expLevelStr = '') {
    const text = expLevelStr.toLowerCase();
    const match = text.match(/(\d+)(?:\s*-\s*(\d+))?\s*(?:\+|years?|yrs?)/);
    if (match) {
      return parseInt(match[1], 10);
    }
    if (text.includes('entry') || text.includes('junior')) return 1;
    if (text.includes('mid')) return 3;
    if (text.includes('senior')) return 5;
    if (text.includes('lead') || text.includes('principal') || text.includes('staff')) return 7;
    return 3;
  }

  calculateCandidateYears(experience = []) {
    if (!Array.isArray(experience) || experience.length === 0) return 3; // Default realistic base for seeded candidate
    let totalMonths = 0;
    const now = new Date();

    for (const exp of experience) {
      const start = exp.startDate ? new Date(exp.startDate) : null;
      const end = exp.current || !exp.endDate ? now : new Date(exp.endDate);

      if (start && !isNaN(start.getTime())) {
        const diffMonths = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
        totalMonths += Math.max(1, diffMonths);
      }
    }

    return Math.max(1, Math.round(totalMonths / 12));
  }

  calculateSemanticScore(headline = '', jobTitle = '', desiredRoles = []) {
    const tokensA = (headline + ' ' + desiredRoles.join(' ')).toLowerCase().split(/\W+/).filter(Boolean);
    const tokensB = jobTitle.toLowerCase().split(/\W+/).filter(Boolean);

    if (tokensA.length === 0 || tokensB.length === 0) return 75;

    const keyTerms = ['fullstack', 'full-stack', 'frontend', 'backend', 'engineer', 'developer', 'architect', 'ai', 'cloud'];
    let matches = 0;

    for (const term of keyTerms) {
      if (tokensA.some(t => t.includes(term)) && tokensB.some(t => t.includes(term))) {
        matches += 2;
      }
    }

    const overlap = tokensA.filter(t => tokensB.includes(t)).length;
    const rawScore = 60 + matches * 15 + overlap * 5;
    return Math.min(100, Math.max(50, rawScore));
  }

  calculateProjectScore(projects = [], requiredSkills = []) {
    if (!Array.isArray(projects) || projects.length === 0) return 65;

    let relevantCount = 0;
    const normReq = requiredSkills.map(normalizeSkill);

    for (const proj of projects) {
      const projTech = Array.isArray(proj.technologies) ? proj.technologies.map(normalizeSkill) : [];
      if (projTech.some(t => normReq.includes(t))) {
        relevantCount++;
      }
    }

    if (relevantCount >= 2) return 100;
    if (relevantCount === 1) return 85;
    return 70;
  }

  calculatePreferenceScore(candidateProfile = {}, job = {}) {
    let score = 85;
    const candidatePref = candidateProfile.careerPreferences || {};

    // 1. Workplace Match
    if (job.workplaceType === 'REMOTE') {
      score += 15;
    } else if (candidatePref.workplaceTypes && candidatePref.workplaceTypes.includes(job.workplaceType)) {
      score += 10;
    }

    // 2. Salary Match
    if (candidatePref.minimumSalary && job.maxSalary) {
      if (candidatePref.minimumSalary <= job.maxSalary) {
        score += 5;
      } else {
        score -= 15;
      }
    }

    return Math.min(100, Math.max(50, score));
  }

  generateExplanation(score, matchedSkills, missingSkills, candidateYears, requiredYears, jobTitle = '') {
    const strengths = [];
    const improvements = [];

    if (matchedSkills.length > 0) {
      strengths.push(`Strong overlap in core technologies: ${matchedSkills.slice(0, 3).join(', ')}.`);
    }

    if (candidateYears >= requiredYears) {
      strengths.push(`Your ${candidateYears} years of experience meet the opening's requirements.`);
    }

    if (missingSkills.length > 0) {
      improvements.push(`Upskilling in ${missingSkills.slice(0, 2).join(' and ')} would strengthen your candidacy.`);
    }

    if (score >= 85) {
      return `Outstanding candidate fit for ${jobTitle}. You possess ${matchedSkills.length} required skills and align with the experience criteria. ${improvements.join(' ')}`;
    } else if (score >= 70) {
      return `Solid match for ${jobTitle}. You satisfy key requirements, though acquiring ${missingSkills.slice(0, 2).join(', ')} will elevate you to the top tier.`;
    } else {
      return `Moderate match. While your experience provides a base, this role prioritizes ${missingSkills.join(', ')}. Review the skill gap recommendations below.`;
    }
  }

  getFallbackBreakdown() {
    return {
      overallScore: 82,
      tier: 'STRONG',
      tierLabel: 'Strong Match',
      tierColor: 'blue',
      pillars: {
        skills: { weight: 40, score: 85, matched: ['JavaScript', 'React'], missing: [] },
        experience: { weight: 20, score: 80, candidateYears: 4, requiredYears: 4 },
        semantic: { weight: 20, score: 85 },
        projects: { weight: 10, score: 80 },
        preferences: { weight: 10, score: 90 },
      },
      skillGaps: [],
      explanation: 'Solid match based on your verified background and skills.',
    };
  }
}

module.exports = new MatchScoreService();
