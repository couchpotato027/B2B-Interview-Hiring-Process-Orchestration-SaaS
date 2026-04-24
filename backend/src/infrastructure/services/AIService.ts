import { GoogleGenerativeAI } from '@google/generative-ai';
import { logger } from '../logging/logger';

export interface ParsedResume {
    name: string;
    email: string;
    phone: string;
    skills: Array<{ name: string; proficiency: 'Beginner' | 'Intermediate' | 'Expert' }>;
    experience: Array<{ role: string; company: string; duration: string; description: string }>;
    education: Array<{ degree: string; school: string; year: string }>;
    score: number;
    feedback: string[];
}

export class AIService {
    private genAI: GoogleGenerativeAI;

    constructor(apiKey: string) {
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    async parseResume(text: string): Promise<ParsedResume> {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
            Extract the following information from this resume text into a clean JSON format:
            - Fully qualified Name
            - Professional Email
            - Primary Phone Number
            - Skills with Proficiency (Expert, Intermediate, Beginner based on context/years)
            - Work Experience (Role, Company, Duration, and a brief description)
            - Education (Degree, School, Year)
            - A Resume Quality Score from 0 to 100 based on formatting, clarity, and impact
            - 3 specific pieces of feedback to improve the resume
            
            Resume Text:
            ${text}
            
            Return ONLY the JSON.
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();
            
            // Basic extraction of JSON block from markdown if present
            const jsonStr = content.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error: any) {
            logger.error(`[AI Parser] Gemini failure: ${error.message}`);
            throw new Error('AI Parsing Protocol Failed');
        }
    }

    async matchCandidateToJob(resume: ParsedResume, jobRequirement: string): Promise<{ score: number; rationale: string }> {
        const model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        
        const prompt = `
            Compare this parsed resume data to the following job requirement.
            Resume: ${JSON.stringify(resume)}
            Job Requirement: ${jobRequirement}
            
            Calculate a match score (0-100) and provide a 2-sentence rationale.
            Return JSON: { "score": number, "rationale": string }
        `;

        try {
            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();
            const jsonStr = content.replace(/```json|```/g, '').trim();
            return JSON.parse(jsonStr);
        } catch (error: any) {
            logger.error(`[AI Matcher] Gemini failure: ${error.message}`);
            return { score: 0, rationale: 'Matching logic unavailable' };
        }
    }
}
