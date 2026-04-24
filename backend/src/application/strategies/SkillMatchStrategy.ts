import type { Candidate } from '../../domain/entities/Candidate';
import type { Job } from '../../domain/entities/Job';
import type { IScoringStrategy } from '../../domain/strategies/IScoringStrategy';

export class SkillMatchStrategy implements IScoringStrategy {
  private static readonly WEIGHT = 0.4;
  private static readonly PREFERRED_SKILL_BONUS = 15;

  private static readonly SYNONYMS: Record<string, string[]> = {
    'javascript': ['js', 'ecmascript', 'es6', 'esnext'],
    'typescript': ['ts'],
    'nodejs': ['node', 'node.js'],
    'react': ['reactjs', 'react.js', 'preact'],
    'mongodb': ['mongo', 'mongoose'],
    'postgresql': ['postgres', 'psql'],
    'aws': ['amazon web services', 's3', 'ec2', 'lambda'],
    'docker': ['containerization', 'kubernetes', 'k8s'],
  };

  private static readonly GROUPS: Record<string, string[]> = {
    'mern': ['mongodb', 'express', 'react', 'nodejs'],
    'mean': ['mongodb', 'express', 'angular', 'nodejs'],
    'lamp': ['linux', 'apache', 'mysql', 'php'],
  };

  public async calculate(candidate: Candidate, job: Job): Promise<number> {
    const candidateSkills = new Set(candidate.getSkills().map((skill) => this.normalizeSkill(skill)));
    const requiredSkills = job.getRequiredSkills().map((skill) => this.normalizeSkill(skill));
    const preferredSkills = job.getPreferredSkills().map((skill) => this.normalizeSkill(skill));

    if (requiredSkills.length === 0) return 0;

    const calculateMatch = (skills: string[]) => {
      let matches = 0;
      for (const skill of skills) {
        if (candidateSkills.has(skill)) {
          matches++;
          continue;
        }

        // Check synonyms
        const synonyms = SkillMatchStrategy.SYNONYMS[skill] || [];
        if (synonyms.some(syn => candidateSkills.has(syn))) {
          matches++;
          continue;
        }

        // Check groups (if candidate has a group that includes the skill)
        // OR if job requires a group and candidate has all individual skills
        if (this.isSkillInGroup(skill, Array.from(candidateSkills))) {
           matches++;
        }
      }
      return matches;
    };

    const matchingRequired = calculateMatch(requiredSkills);
    const matchingPreferred = calculateMatch(preferredSkills);

    const baseScore = (matchingRequired / requiredSkills.length) * 100;
    const preferredBonus = preferredSkills.length > 0
        ? (matchingPreferred / preferredSkills.length) * SkillMatchStrategy.PREFERRED_SKILL_BONUS
        : 0;

    return clampScore(baseScore + preferredBonus);
  }

  private normalizeSkill(skill: string): string {
    return skill.toLowerCase().replace(/[^a-z0-9]/g, '');
  }

  private isSkillInGroup(skill: string, candidateSkills: string[]): boolean {
    // Check if the required skill is a group name
    const groupMembers = SkillMatchStrategy.GROUPS[skill];
    if (groupMembers) {
      // If job requires 'MERN', candidate needs most of them
      const matches = groupMembers.filter(m => candidateSkills.includes(m)).length;
      return (matches / groupMembers.length) >= 0.75;
    }
    return false;
  }

  public getName(): string {
    return 'Skill Match';
  }

  public getWeight(job?: Job): number {
    return job?.getScoringWeights()?.skillMatch ?? SkillMatchStrategy.WEIGHT;
  }
}

const clampScore = (score: number): number => Math.min(100, Math.max(0, Number(score.toFixed(2))));
