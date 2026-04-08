import type { ParsedResumeData } from '../../domain/entities/Resume';
import type { IResumeParser } from '../../domain/services/IResumeParser';
import { extractStructuredResumeData } from './resume-extraction.util';

export class TXTResumeParser implements IResumeParser {
  public supports(fileExtension: string): boolean {
    return fileExtension.toLowerCase() === '.txt';
  }

  public async parse(fileBuffer: Buffer, _fileName: string): Promise<ParsedResumeData> {
    return extractStructuredResumeData(fileBuffer.toString('utf-8'));
  }
}
