import { Interview } from '../../domain/entities/Interview';

export class InterviewTransformer {
  public static toDTO(interview: Interview) {
    return {
      id: interview.getId(),
      candidateId: interview.getCandidateId(),
      stageId: interview.getStageId(),
      title: interview.getTitle(),
      type: interview.getType(),
      status: interview.getStatus(),
      scheduledAt: interview.getScheduledAt().toISOString(),
      duration: interview.getDuration(),
      videoLink: interview.getVideoLink(),
      notes: interview.getNotes(),
      panel: interview.getPanel(),
      feedback: interview.getFeedback(),
      feedbackStatus: interview.getFeedback() ? 'SUBMITTED' : 'PENDING'
    };
  }

  public static toCollectionDTO(interviews: Interview[]) {
    return interviews.map(iv => this.toDTO(iv));
  }
}
