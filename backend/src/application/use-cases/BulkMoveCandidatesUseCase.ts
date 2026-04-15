import { MoveCandidateThroughPipelineUseCase } from './MoveCandidateThroughPipelineUseCase';

export interface BulkMoveInput {
  candidateIds: string[];
  pipelineId: string;
  newStageId: string;
  organizationId: string;
  movedBy: string;
  reason?: string;
}

export class BulkMoveCandidatesUseCase {
  constructor(
    private readonly moveCandidateUseCase: MoveCandidateThroughPipelineUseCase
  ) {}

  async execute(input: BulkMoveInput): Promise<{ successful: string[]; failed: Array<{ id: string; error: string }> }> {
    const successful: string[] = [];
    const failed: Array<{ id: string; error: string }> = [];

    await Promise.all(
      input.candidateIds.map(async (candidateId) => {
        try {
          await this.moveCandidateUseCase.execute({
            candidateId,
            pipelineId: input.pipelineId,
            newStageId: input.newStageId,
            organizationId: input.organizationId,
            movedBy: input.movedBy,
            reason: input.reason,
          });
          successful.push(candidateId);
        } catch (error: any) {
          failed.push({ id: candidateId, error: error.message });
        }
      })
    );

    return { successful, failed };
  }
}
