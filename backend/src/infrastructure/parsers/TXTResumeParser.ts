import type { ParsedResumeData } from '../../domain/entities/Resume';
import type { IResumeParser } from '../../domain/services/IResumeParser';

export class TXTResumeParser implements IResumeParser {
  public supports(fileExtension: string): boolean {
    return fileExtension.toLowerCase() === '.txt';
  }

  public async parse(fileBuffer: Buffer, _fileName: string): Promise<ParsedResumeData> {
    return {
      rawText: fileBuffer.toString('utf-8'),
      name: '',
      email: '',
      skills: [],
      experience: '',
      education: '',
      projects: []
    } as any;
  }
}
