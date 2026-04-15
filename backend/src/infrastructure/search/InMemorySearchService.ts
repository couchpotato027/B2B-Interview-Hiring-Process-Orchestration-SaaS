import Fuse from 'fuse.js';
import { Candidate } from '../../domain/entities/Candidate';
import { Resume } from '../../domain/entities/Resume';
import { CandidatePipelineStatus } from '../../domain/entities/CandidatePipelineStatus';
import { ISearchService } from '../../domain/services/ISearchService';
import { SearchQuery, SearchResults, SearchFacets } from '../../domain/types/SearchTypes';

interface SearchDocument {
  id: string;
  name: string;
  email: string;
  skills: string[];
  experienceYears: number;
  education: string;
  stageId: string;
  jobId: string;
  pipelineId: string;
  rawText: string;
  entity: Candidate;
  searchScore?: number;
}

export class InMemorySearchService implements ISearchService {
  private readonly indexes = new Map<string, Fuse<SearchDocument>>();
  private readonly data = new Map<string, SearchDocument[]>();

  private readonly fuseOptions: any = {
    keys: [
      { name: 'name', weight: 1.0 },
      { name: 'skills', weight: 0.8 },
      { name: 'experience', weight: 0.6 },
      { name: 'education', weight: 0.4 },
      { name: 'rawText', weight: 0.2 },
    ],
    threshold: 0.3,
    includeScore: true,
    useExtendedSearch: true,
  };

  public async indexCandidate(
    candidate: Candidate, 
    resume?: Resume, 
    pipelineStatus?: CandidatePipelineStatus
  ): Promise<void> {
    const orgId = candidate.getOrganizationId();
    const doc = this.mapToDoc(candidate, resume, pipelineStatus);

    if (!this.data.has(orgId)) {
      this.data.set(orgId, []);
    }

    const orgData = this.data.get(orgId)!;
    const index = orgData.findIndex((d) => d.id === candidate.getId());

    if (index >= 0) {
      orgData[index] = doc;
    } else {
      orgData.push(doc);
    }

    this.indexes.set(orgId, new Fuse(orgData, this.fuseOptions));
  }

  public async searchCandidates(query: SearchQuery): Promise<SearchResults> {
    const orgId = query.organizationId;
    const orgData = this.data.get(orgId) || [];
    const fuse = this.indexes.get(orgId);

    let filteredDocs: SearchDocument[] = [...orgData];

    // 1. Text Search (Fuzzy)
    if (query.textQuery && fuse) {
      const fuseResults = fuse.search(query.textQuery);
      filteredDocs = fuseResults.map((r) => ({ ...r.item, searchScore: r.score }));
    }

    // 2. Advanced Filtering
    filteredDocs = filteredDocs.filter((doc) => {
      if (query.skills && !query.skills.every((s) => doc.skills.includes(s))) return false;
      if (query.minExperience !== undefined && doc.experienceYears < query.minExperience) return false;
      if (query.maxExperience !== undefined && doc.experienceYears > query.maxExperience) return false;
      if (query.jobId && doc.jobId !== query.jobId && doc.pipelineId !== query.jobId) return false;
      if (query.currentStage && doc.stageId && !query.currentStage.includes(doc.stageId)) return false;
      return true;
    });

    // 3. Sorting
    this.sortResults(filteredDocs, query);

    // 4. Faceting
    const facets = this.calculateFacets(filteredDocs);

    // 5. Pagination
    const page = query.page || 1;
    const limit = query.limit || 10;
    const total = filteredDocs.length;
    const totalPages = Math.ceil(total / limit);
    const paginatedDocs = filteredDocs.slice((page - 1) * limit, page * limit);

    return {
      items: paginatedDocs.map(d => d.entity),
      total,
      page,
      limit,
      totalPages,
      facets,
    };
  }

  public async deleteFromIndex(candidateId: string, organizationId: string): Promise<void> {
    const orgData = this.data.get(organizationId);
    if (!orgData) return;

    const index = orgData.findIndex((d) => d.id === candidateId);
    if (index >= 0) {
      orgData.splice(index, 1);
      this.indexes.set(organizationId, new Fuse(orgData, this.fuseOptions));
    }
  }

  public async updateIndex(candidateId: string, updates: Partial<SearchDocument>, organizationId: string): Promise<void> {
    const orgData = this.data.get(organizationId);
    if (!orgData) return;

    const index = orgData.findIndex((d) => d.id === candidateId);
    if (index >= 0) {
      const existing = orgData[index];
      if (existing) {
        orgData[index] = { ...existing, ...updates, id: existing.id } as SearchDocument;
        this.indexes.set(organizationId, new Fuse(orgData, this.fuseOptions));
      }
    }
  }

  public async rebuildIndex(
    organizationId: string, 
    candidates: Candidate[], 
    resumes: Resume[],
    pipelineStatuses: CandidatePipelineStatus[]
  ): Promise<void> {
    const docs = candidates.map((candidate) => {
      const resume = resumes.find((r) => r.getCandidateId() === candidate.getId());
      const status = pipelineStatuses.find((s) => s.getCandidateId() === candidate.getId());
      return this.mapToDoc(candidate, resume, status);
    });

    this.data.set(organizationId, docs);
    this.indexes.set(organizationId, new Fuse(docs, this.fuseOptions));
  }

  private mapToDoc(
    candidate: Candidate, 
    resume?: Resume, 
    pipelineStatus?: CandidatePipelineStatus
  ): SearchDocument {
    return {
      id: candidate.getId(),
      name: candidate.getName(),
      email: candidate.getEmail(),
      skills: candidate.getSkills(),
      experienceYears: candidate.getYearsOfExperience(),
      education: candidate.getEducation(),
      stageId: pipelineStatus?.getCurrentStageId() || '',
      jobId: '', 
      pipelineId: pipelineStatus?.getPipelineId() || '',
      rawText: resume?.getRawText() || '',
      entity: candidate,
    };
  }

  private sortResults(docs: SearchDocument[], query: SearchQuery): void {
    const order = query.sortOrder === 'desc' ? -1 : 1;
    
    docs.sort((a, b) => {
      if (query.sortBy === 'experience') return (a.experienceYears - b.experienceYears) * order;
      if (query.sortBy === 'date') {
        const dateA = a.entity.getCreatedAt().getTime();
        const dateB = b.entity.getCreatedAt().getTime();
        return (dateA - dateB) * order;
      }
      if (query.sortBy === 'relevance' && a.searchScore !== undefined && b.searchScore !== undefined) {
          return (a.searchScore - b.searchScore); 
      }
      return 0;
    });
  }

  private calculateFacets(docs: SearchDocument[]): SearchFacets {
    const skillCounts = new Map<string, number>();
    const eduCounts = new Map<string, number>();
    const expRanges = { '0-2': 0, '3-5': 0, '6-10': 0, '10+': 0 };

    for (const doc of docs) {
      doc.skills.forEach((s: string) => skillCounts.set(s, (skillCounts.get(s) || 0) + 1));
      eduCounts.set(doc.education, (eduCounts.get(doc.education) || 0) + 1);
      
      const years = doc.experienceYears;
      if (years <= 2) expRanges['0-2']++;
      else if (years <= 5) expRanges['3-5']++;
      else if (years <= 10) expRanges['6-10']++;
      else expRanges['10+']++;
    }

    return {
      skills: Array.from(skillCounts.entries()).map(([skill, count]) => ({ skill, count })).sort((a, b) => b.count - a.count).slice(0, 10),
      educationLevels: Array.from(eduCounts.entries()).map(([level, count]) => ({ level, count })),
      experienceRanges: Object.entries(expRanges).map(([range, count]) => ({ range, count })),
    };
  }
}
