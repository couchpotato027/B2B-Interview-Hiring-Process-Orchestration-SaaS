import { CandidateScorer } from '../services/CandidateScorer';
import { Candidate } from '../../domain/entities/Candidate';
import { Job } from '../../domain/entities/Job';
import { ScoringStrategyFactory } from './ScoringStrategyFactory';
import { SkillMatchStrategy } from './SkillMatchStrategy';

export const defaultScoringExample = async () => {
  const candidate = new Candidate({
    id: 'candidate-1',
    name: 'Priya Sharma',
    email: 'priya@example.com',
    phone: '+91-9876543210',
    resumeId: 'resume-1',
    skills: ['TypeScript', 'Node.js', 'PostgreSQL', 'Docker'],
    yearsOfExperience: 4,
    education: 'B.Tech in Computer Science',
    projects: [
      {
        title: 'Hiring Platform',
        description: 'Built a recruitment workflow system.',
        technologies: ['TypeScript', 'Node.js', 'PostgreSQL'],
      },
      {
        title: 'Analytics Dashboard',
        description: 'Created a reporting product for internal teams.',
        technologies: ['React', 'Docker'],
      },
    ],
    tenantId: 'org-123',
    status: 'active',
  });

  const job = new Job({
    id: 'job-1',
    title: 'Backend Engineer',
    department: 'Engineering',
    description: 'Build backend services for HireFlow.',
    requiredSkills: ['TypeScript', 'Node.js', 'PostgreSQL'],
    preferredSkills: ['Docker', 'Redis'],
    requiredExperience: 3,
    tenantId: 'org-123',
    status: 'open',
  });

  const scorer = new CandidateScorer(ScoringStrategyFactory.getDefaultStrategies());

  return scorer.calculateScore(candidate, job);
};

export const customScoringExample = async () => {
  const candidate = new Candidate({
    id: 'candidate-2',
    name: 'Arjun Patel',
    email: 'arjun@example.com',
    phone: '+91-9988776655',
    resumeId: 'resume-2',
    skills: ['TypeScript', 'Express'],
    yearsOfExperience: 2,
    education: 'B.E. in Information Technology',
    projects: [
      {
        title: 'API Gateway',
        description: 'Implemented service routing and auth.',
        technologies: ['TypeScript', 'Express'],
      },
    ],
    tenantId: 'org-123',
    status: 'active',
  });

  const job = new Job({
    id: 'job-2',
    title: 'Platform Engineer',
    department: 'Engineering',
    description: 'Own internal platform tooling.',
    requiredSkills: ['TypeScript', 'Express', 'Docker'],
    preferredSkills: ['Kubernetes'],
    requiredExperience: 3,
    tenantId: 'org-123',
    status: 'open',
  });

  const scorer = new CandidateScorer([
    new SkillMatchStrategy(),
    ...ScoringStrategyFactory.getCustomStrategies({
      includeExperienceMatch: true,
      includeProjectRelevance: false,
    }),
  ]);

  return scorer.calculateScore(candidate, job);
};
