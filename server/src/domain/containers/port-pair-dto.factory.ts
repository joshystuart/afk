import { Injectable } from '@nestjs/common';
import { PortPairDto } from './port-pair.dto';

@Injectable()
export class PortPairDtoFactory {
  create(port: number): PortPairDto {
    return new PortPairDto(port);
  }
}
