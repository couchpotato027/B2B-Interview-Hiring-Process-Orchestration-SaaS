import mammoth from 'mammoth';
import type { ParsedResumeData } from '../../domain/entities/Resume';
import type { IResumeParser } from '../../domain/services/IResumeParser';

export class DOCXResumeParser implements IResumeParser {
  public supports(fileExtension: string): boolean {
    return fileExtension.toLowerCase() === '.docx';
  }

  public async parse(fileBuffer: Buffer, _fileName: string): Promise<ParsedResumeData> {
    const result = await mammoth.extractRawText({ buffer: fileBuffer });
    return {
      rawText: result.value,
      name: '',
      email: '',
      skills: [],
      experience: '',
      education: '',
      projects: []
    } as any;
  }
}
