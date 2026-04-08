import type { ParsedResumeData } from '../entities/Resume';

export interface IResumeParser {
  parse(fileBuffer: Buffer, fileName: string): Promise<ParsedResumeData>;
  supports(fileExtension: string): boolean;
}
