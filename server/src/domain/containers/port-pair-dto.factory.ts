import { Injectable } from '@nestjs/common';
import { PortPairDto } from './port-pair.dto';

@Injectable()
export class PortPairDtoFactory {
  create(claudePort: number, manualPort: number): PortPairDto {
    return new PortPairDto(claudePort, manualPort);
  }
}
