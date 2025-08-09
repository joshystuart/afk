import { IsOptional, IsEnum } from 'class-validator';
import { SessionStatus } from '../../../domain/sessions/session-status.enum';

export class ListSessionsRequest {
  @IsOptional()
  @IsEnum(SessionStatus)
  status?: SessionStatus;

  // This would be populated from authentication context
  userId?: string;
}
