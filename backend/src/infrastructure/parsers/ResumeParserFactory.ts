import path from 'path';
import type { IResumeParser } from '../../domain/services/IResumeParser';
import { DOCXResumeParser } from './DOCXResumeParser';
import { PDFResumeParser } from './PDFResumeParser';
import { TXTResumeParser } from './TXTResumeParser';

export class ResumeParserFactory {
  private readonly parsers: IResumeParser[];

  constructor(parsers?: IResumeParser[]) {
    this.parsers = parsers ?? [
      new PDFResumeParser(),
      new DOCXResumeParser(),
      new TXTResumeParser(),
    ];
  }

  public registerParser(parser: IResumeParser): void {
    this.parsers.push(parser);
  }

  public getParser(fileName: string): IResumeParser {
    const fileExtension = path.extname(fileName).toLowerCase();
    const parser = this.parsers.find((candidateParser) => candidateParser.supports(fileExtension));

    if (!parser) {
      throw new Error(`No resume parser available for file type "${fileExtension || 'unknown'}".`);
    }

    return parser;
  }
}
