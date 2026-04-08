import { PDFParse } from 'pdf-parse';
import type { ParsedResumeData } from '../../domain/entities/Resume';
import type { IResumeParser } from '../../domain/services/IResumeParser';
import { extractStructuredResumeData } from './resume-extraction.util';

export class PDFResumeParser implements IResumeParser {
  public supports(fileExtension: string): boolean {
    return fileExtension.toLowerCase() === '.pdf';
  }

  public async parse(fileBuffer: Buffer, _fileName: string): Promise<ParsedResumeData> {
    const parser = new PDFParse({ data: fileBuffer });

    try {
      const parsedPdf = await parser.getText();
      return extractStructuredResumeData(parsedPdf.text);
    } finally {
      await parser.destroy();
    }
  }
}
