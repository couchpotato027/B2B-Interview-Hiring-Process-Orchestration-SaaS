import { PipelineStageType } from '../entities/PipelineStage';

export interface StageTemplate {
  name: string;
  type: PipelineStageType;
}

export interface PipelineTemplate {
  name: string;
  stages: StageTemplate[];
}

export const SOFTWARE_ENGINEERING_PIPELINE: PipelineTemplate = {
  name: 'Software Engineering',
  stages: [
    { name: 'Initial Screening', type: 'screening' },
    { name: 'Technical Phone Screen', type: 'interview' },
    { name: 'Coding Challenge', type: 'assessment' },
    { name: 'System Design Interview', type: 'interview' },
    { name: 'Values Fit Interview', type: 'interview' },
    { name: 'Reference Check', type: 'screening' },
    { name: 'Offer', type: 'offer' },
  ],
};

export const SALES_PIPELINE: PipelineTemplate = {
  name: 'Sales',
  stages: [
    { name: 'Lead Qualification', type: 'screening' },
    { name: 'Discovery Call', type: 'interview' },
    { name: 'Product Demo', type: 'interview' },
    { name: 'Commercial Negotiation', type: 'interview' },
    { name: 'Offer', type: 'offer' },
  ],
};

export const INTERNSHIP_PIPELINE: PipelineTemplate = {
  name: 'Internship',
  stages: [
    { name: 'Application Review', type: 'screening' },
    { name: 'Online Assessment', type: 'assessment' },
    { name: 'Panel Interview', type: 'interview' },
    { name: 'Offer', type: 'offer' },
  ],
};

export const PipelineTemplates = {
  SoftwareEngineering: SOFTWARE_ENGINEERING_PIPELINE,
  Sales: SALES_PIPELINE,
  Internship: INTERNSHIP_PIPELINE,
  getAll: () => [SOFTWARE_ENGINEERING_PIPELINE, SALES_PIPELINE, INTERNSHIP_PIPELINE],
};
