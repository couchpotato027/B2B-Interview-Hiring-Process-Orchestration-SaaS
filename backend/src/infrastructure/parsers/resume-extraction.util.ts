import type { ParsedResumeData, ParsedResumeProject } from '../../domain/entities/Resume';

const EMAIL_REGEX = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i;
const PHONE_REGEX =
  /(?:\+?\d{1,3}[\s.-]?)?(?:\(?\d{3}\)?[\s.-]?)\d{3}[\s.-]?\d{4}\b/;
const NAME_REGEX = /^\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})\s*$/m;

const SECTION_HEADERS = [
  'summary',
  'skills',
  'technical skills',
  'experience',
  'work experience',
  'employment',
  'education',
  'projects',
  'certifications',
  'achievements',
];

const COMMON_SKILLS = [
  'javascript',
  'typescript',
  'node.js',
  'node',
  'react',
  'next.js',
  'next',
  'express',
  'java',
  'python',
  'sql',
  'postgresql',
  'mongodb',
  'redis',
  'docker',
  'kubernetes',
  'aws',
  'azure',
  'git',
  'html',
  'css',
  'tailwind',
  'prisma',
  'graphql',
  'rest',
  'microservices',
];

export const extractStructuredResumeData = (rawText: string): ParsedResumeData => {
  const normalizedText = normalizeText(rawText);

  return {
    name: extractName(normalizedText),
    email: extractEmail(normalizedText),
    phone: extractPhone(normalizedText),
    skills: extractSkills(normalizedText),
    experience: extractSection(normalizedText, ['experience', 'work experience', 'employment']),
    education: extractSection(normalizedText, ['education']),
    projects: extractProjects(normalizedText),
  };
};

const normalizeText = (rawText: string): string =>
  rawText
    .replace(/\r\n/g, '\n')
    .replace(/\u00a0/g, ' ')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

const extractName = (text: string): string | undefined => {
  const firstLines = text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  for (const line of firstLines) {
    if (EMAIL_REGEX.test(line) || PHONE_REGEX.test(line)) {
      continue;
    }

    const match = line.match(NAME_REGEX);
    if (match?.[1]) {
      return match[1].trim();
    }
  }

  return undefined;
};

const extractEmail = (text: string): string | undefined => text.match(EMAIL_REGEX)?.[0];

const extractPhone = (text: string): string | undefined => text.match(PHONE_REGEX)?.[0]?.trim();

const extractSkills = (text: string): string[] | undefined => {
  const skillsSection = extractSection(text, ['skills', 'technical skills']);
  const sourceText = skillsSection ?? text;

  const commaSeparatedSkills = sourceText
    .split(/[\n,|]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => item.length <= 40);

  const matchedSkills = COMMON_SKILLS.filter((skill) =>
    new RegExp(`\\b${escapeRegExp(skill)}\\b`, 'i').test(sourceText),
  );

  const skills = [...commaSeparatedSkills, ...matchedSkills].filter((skill) => !isSectionHeader(skill));

  const uniqueSkills = [...new Set(skills.map((skill) => skill.replace(/^[-•]\s*/, '').trim()))].filter(
    Boolean,
  );

  return uniqueSkills.length > 0 ? uniqueSkills : undefined;
};

const extractSection = (text: string, headerAliases: string[]): string | undefined => {
  const lines = text.split('\n');
  const startIndex = lines.findIndex((line) =>
    headerAliases.some((alias) => normalizeHeader(line) === alias),
  );

  if (startIndex === -1) {
    return undefined;
  }

  const sectionLines: string[] = [];
  for (let index = startIndex + 1; index < lines.length; index += 1) {
    const line = lines[index]?.trim() ?? '';

    if (!line) {
      if (sectionLines.length > 0) {
        break;
      }
      continue;
    }

    if (isSectionHeader(line)) {
      break;
    }

    sectionLines.push(line);
  }

  return sectionLines.length > 0 ? sectionLines.join(' ').trim() : undefined;
};

const extractProjects = (text: string): ParsedResumeProject[] | undefined => {
  const projectSection = extractSection(text, ['projects']);

  if (!projectSection) {
    return undefined;
  }

  const entries = projectSection
    .split(/(?:\n|(?=\s[-•]))/)
    .map((entry) => entry.replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);

  const projects = entries
    .map((entry) => {
      const [titlePart, ...descriptionParts] = entry.split(/[:|-]\s*/);
      const title = titlePart?.trim();
      const description = descriptionParts.join(' - ').trim() || entry.trim();

      if (!title) {
        return null;
      }

      return {
        title,
        description,
      };
    })
    .filter((project): project is ParsedResumeProject => project !== null);

  return projects.length > 0 ? projects : undefined;
};

const normalizeHeader = (value: string): string =>
  value
    .trim()
    .toLowerCase()
    .replace(/[:\s]+$/g, '');

const isSectionHeader = (value: string): boolean => SECTION_HEADERS.includes(normalizeHeader(value));

const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
