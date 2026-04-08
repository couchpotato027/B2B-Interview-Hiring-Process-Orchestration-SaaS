import type { ParsedResumeData } from '../../domain/entities/Resume';
import { ResumeParserFactory } from '../../infrastructure/parsers/ResumeParserFactory';

export class ResumeParsingService {
  constructor(private readonly parserFactory: ResumeParserFactory = new ResumeParserFactory()) {}

  public async parseResume(fileBuffer: Buffer, fileName: string): Promise<ParsedResumeData> {
    try {
      const parser = this.parserFactory.getParser(fileName);
      return await parser.parse(fileBuffer, fileName);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown resume parsing error.';
      throw new Error(`Failed to parse resume "${fileName}": ${message}`);
    }
  }
}
