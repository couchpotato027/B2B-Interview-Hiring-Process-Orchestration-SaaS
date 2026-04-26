import type { ParsedResumeData } from '../../domain/entities/Resume';
import { ResumeParserFactory } from '../../infrastructure/parsers/ResumeParserFactory';
import type { IAIService } from '../../domain/services/IAIService';

export class ResumeParsingService {
  constructor(
    private readonly parserFactory: ResumeParserFactory = new ResumeParserFactory(),
    private readonly aiService?: IAIService
  ) {}

  public async parseResume(fileBuffer: Buffer, fileName: string): Promise<ParsedResumeData> {
    try {
      const parser = this.parserFactory.getParser(fileName);
      const parsed = await parser.parse(fileBuffer, fileName);
      
      // Fallback if no AI service is configured or if it's already structured well
      if (!this.aiService || this.aiService.constructor.name === 'NoopAIService') {
        return parsed;
      }

      // Step up the quality with AI extraction
      // The parser now returns an object that includes the raw text in its structure
      const rawText = (parsed as any).rawText || JSON.stringify(parsed);
      const aiData = await this.aiService.parseResume(rawText);

      return {
        ...parsed,
        ...aiData,
        skills: Array.isArray(aiData.skills) ? aiData.skills : (parsed.skills || []),
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown resume parsing error.';
      throw new Error(`Failed to parse resume "${fileName}": ${message}`);
    }
  }
}
