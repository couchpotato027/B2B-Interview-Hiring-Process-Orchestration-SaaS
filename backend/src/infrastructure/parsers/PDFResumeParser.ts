import pdf from 'pdf-parse';
import type { ParsedResumeData } from '../../domain/entities/Resume';
import type { IResumeParser } from '../../domain/services/IResumeParser';

export class PDFResumeParser implements IResumeParser {
  public supports(fileExtension: string): boolean {
    return fileExtension.toLowerCase() === '.pdf';
  }

  public async parse(fileBuffer: Buffer, _fileName: string): Promise<ParsedResumeData> {
    try {
      const parsedPdf = await pdf(fileBuffer);
      // Return the raw text wrapped in the expected structure for the ParsingService to handle via AI
      return {
         rawText: parsedPdf.text,
         name: '',
         email: '',
         skills: [],
         experience: '',
         education: '',
         projects: []
      } as any;
    } catch (error: any) {
      if (error.message && (error.message.includes('Command token too long') || error.message.includes('Invalid PDF structure'))) {
        throw new Error('Invalid or corrupted PDF file. The file might not be a real PDF. Please save as a standard PDF and try again.');
      }
      throw error;
    }
  }
}
