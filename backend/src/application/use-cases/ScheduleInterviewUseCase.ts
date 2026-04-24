import { randomUUID } from 'crypto';
import { Interview, InterviewPanelMember, InterviewType } from '../../domain/entities/Interview';
import { IInterviewRepository } from '../../domain/repositories/IInterviewRepository';
import { ICandidateRepository } from '../../domain/repositories/ICandidateRepository';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { ICalendarService } from '../../domain/services/ICalendarService';
import { EventEmitter } from '../../infrastructure/events/EventEmitter';
import { Result } from '../../shared/Result';

export interface ScheduleInterviewInput {
  candidateId: string;
  stageId: string;
  title: string;
  type: InterviewType;
  scheduledAt: Date;
  duration: number;
  notes?: string;
  panel: Array<{ userId: string; role: 'lead' | 'shadow' | 'observer' }>;
  tenantId: string;
}

export class ScheduleInterviewUseCase {
  constructor(
    private readonly interviewRepository: IInterviewRepository,
    private readonly candidateRepository: ICandidateRepository,
    private readonly userRepository: IUserRepository,
    private readonly calendarService: ICalendarService,
    private readonly eventEmitter: EventEmitter = EventEmitter.getInstance()
  ) {}

  async execute(input: ScheduleInterviewInput): Promise<Result<Interview>> {
    try {
      // 1. Validate Candidate
      const candidate = await this.candidateRepository.findById(input.candidateId, input.tenantId);
      if (!candidate) return { success: false, error: 'Candidate not found', code: 'CANDIDATE_NOT_FOUND' };

      // 2. Validate Interviewers and get emails
      const interviewerIds = input.panel.map(p => p.userId);
      const interviewers = await Promise.all(interviewerIds.map(id => this.userRepository.findById(id)));
      
      if (interviewers.some(i => !i)) return { success: false, error: 'One or more interviewers not found', code: 'INTERVIEWER_NOT_FOUND' };
      
      const interviewerEmails = interviewers.map(i => i!.getEmail());

      // 3. Check availability (DB check + Calendar service check)
      const endTime = new Date(new Date(input.scheduledAt).getTime() + input.duration * 60000);
      
      const dbConflicts = await this.interviewRepository.findAvailabilityConflicts(interviewerIds, input.scheduledAt, endTime, input.tenantId);
      if (dbConflicts.length > 0) {
        return { success: false, error: 'Conflicts detected in internal schedule', code: 'AVAILABILITY_CONFLICT' };
      }

      const calendarAvailable = await this.calendarService.checkAvailability(interviewerEmails, input.scheduledAt, endTime);
      if (!calendarAvailable) {
        return { success: false, error: 'Conflicts detected in external calendar', code: 'CALENDAR_CONFLICT' };
      }

      // 4. Create Interview Entity
      const interview = new Interview({
        id: randomUUID(),
        tenantId: input.tenantId,
        candidateId: input.candidateId,
        stageId: input.stageId,
        title: input.title,
        type: input.type,
        status: 'scheduled',
        scheduledAt: input.scheduledAt,
        duration: input.duration,
        notes: input.notes,
        panel: input.panel,
        videoLink: input.type === 'video' ? `https://meet.google.com/${randomUUID().slice(0, 8)}` : undefined
      });

      // 5. Save to Repository
      const savedInterview = await this.interviewRepository.save(interview);

      // 6. Create Calendar Event
      const attendees = [
        { email: candidate.getEmail(), name: candidate.getName() },
        ...interviewers.map(i => ({ email: i!.getEmail(), name: i!.getName() }))
      ];

      await this.calendarService.createEvent({
        title: `${input.title}: ${candidate.getName()}`,
        description: input.notes || `Interview for ${candidate.getName()}`,
        startTime: input.scheduledAt,
        endTime: endTime,
        attendees,
        meetingLink: savedInterview.getVideoLink()
      });

      // 7. Emit Domain Event
      await this.eventEmitter.emit({
        eventType: 'InterviewScheduledEvent',
        timestamp: new Date(),
        payload: {
          interviewId: savedInterview.getId(),
          candidateId: savedInterview.getCandidateId(),
          tenantId: savedInterview.getTenantId(),
          scheduledAt: savedInterview.getScheduledAt()
        }
      });

      return { success: true, data: savedInterview };

    } catch (error: any) {
      return { success: false, error: error.message, code: 'INTERNAL_ERROR' };
    }
  }
}
