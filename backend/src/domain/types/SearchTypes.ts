import { Candidate } from '../entities/Candidate';

export interface SearchQuery {
  textQuery?: string;
  skills?: string[];
  minExperience?: number;
  maxExperience?: number;
  education?: string[];
  location?: string;
  jobId?: string;
  currentStage?: string[];
  scoreLimits?: { min?: number; max?: number };
  dateRange?: { from: Date; to: Date };
  sortBy?: 'relevance' | 'experience' | 'score' | 'date';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
  organizationId: string;
}

export interface SearchFacets {
  skills: Array<{ skill: string; count: number }>;
  experienceRanges: Array<{ range: string; count: number }>;
  educationLevels: Array<{ level: string; count: number }>;
}

export interface SearchResults {
  items: Candidate[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  facets: SearchFacets;
}
