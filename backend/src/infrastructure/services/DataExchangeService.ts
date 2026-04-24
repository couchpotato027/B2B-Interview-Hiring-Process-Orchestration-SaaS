import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { Candidate } from '../../domain/entities/Candidate';

export class DataExchangeService {
  constructor(private candidateRepository: ICandidateRepository) {}

  async exportCandidates(filters: any, organizationId: string, format: 'csv' | 'json'): Promise<{ data: string; contentType: string }> {
    // Note: If no filters are provided, we should use findWithFilters with empty filters
    const results = await this.candidateRepository.findWithFilters(filters, organizationId);
    const candidates = results.items;
    
    if (format === 'json') {
      return { 
        data: JSON.stringify(candidates, null, 2), 
        contentType: 'application/json' 
      };
    }

    // Manual CSV Generation
    const headers = ['ID', 'Name', 'Email', 'Phone', 'Status', 'CreatedAt'];
    const rows = candidates.map(c => [
      c.getId(),
      c.getName(),
      c.getEmail(),
      c.getPhone(),
      c.getStatus(),
      c.getCreatedAt().toISOString()
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    return { data: csvContent, contentType: 'text/csv' };
  }

  async importCandidates(csvBuffer: Buffer, organizationId: string): Promise<{ success: number; errors: any[] }> {
    const csvString = csvBuffer.toString();
    const rows = csvString.split('\n').map(row => row.trim()).filter(Boolean);
    
    if (rows.length < 2) return { success: 0, errors: [] };

    const headers = rows[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const dataRows = rows.slice(1);

    let successCount = 0;
    const errors: any[] = [];

    for (const row of dataRows) {
      try {
        const values = row.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
        const record: any = {};
        headers.forEach((h, i) => record[h] = values[i]);

        // Basic validation
        if (!record.Email || !record.Name) {
          throw new Error('Missing required fields: Email or Name');
        }

        // Check for duplicates
        const existing = await this.candidateRepository.findByEmail(record.Email, organizationId);
        if (existing) {
          errors.push({ email: record.Email, error: 'Candidate already exists in this organization' });
          continue;
        }

        // Create candidate
         await this.candidateRepository.save(new Candidate({
          id: Math.random().toString(36).substring(7),
          name: record.Name,
          email: record.Email,
          phone: record.Phone || '000-000-0000',
          organizationId: organizationId,
          pipelineId: 'default-pipeline', // Needs actual pipeline ID in production
          resumeId: 'pending-upload',
          skills: [],
          yearsOfExperience: 0,
          education: [{ institution: 'Legacy Import', degree: 'Unknown', fieldOfStudy: 'Unknown' }],
          projects: [],
          status: 'active',
        }));

        successCount++;
      } catch (err: any) {
        errors.push({ email: 'unknown', error: err.message });
      }
    }

    return { success: successCount, errors };
  }

  getImportTemplate(): string {
    return 'Name,Email,Phone\nJohn Doe,john@example.com,+15550123';
  }
}
