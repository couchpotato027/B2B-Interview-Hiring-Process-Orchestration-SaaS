import { DOCXResumeParser } from '../../../../src/infrastructure/parsers/DOCXResumeParser';
import { PDFResumeParser } from '../../../../src/infrastructure/parsers/PDFResumeParser';
import { ResumeParserFactory } from '../../../../src/infrastructure/parsers/ResumeParserFactory';

describe('ResumeParserFactory', () => {
  it('selects the PDF parser for pdf files', () => {
    const parser = new ResumeParserFactory().getParser('resume.pdf');

    expect(parser).toBeInstanceOf(PDFResumeParser);
  });

  it('selects the DOCX parser for docx files', () => {
    const parser = new ResumeParserFactory().getParser('resume.docx');

    expect(parser).toBeInstanceOf(DOCXResumeParser);
  });

  it('throws for unsupported file types', () => {
    expect(() => new ResumeParserFactory().getParser('resume.png')).toThrow(
      'No resume parser available for file type ".png".',
    );
  });
});
