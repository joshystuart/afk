import { Injectable } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { SessionIdDto } from './session-id.dto';

@Injectable()
export class SessionIdDtoFactory {
  generate(): SessionIdDto {
    return new SessionIdDto(uuid());
  }

  fromString(value: string): SessionIdDto {
    return new SessionIdDto(value);
  }
}
