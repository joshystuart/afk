import { ApiProperty } from '@nestjs/swagger';
import { Settings } from '../../../domain/settings/settings.entity';

export class GetSettingsResponseDto {
  @ApiProperty({ required: false })
  sshPrivateKey?: string;

  @ApiProperty({ required: false })
  claudeToken?: string;

  @ApiProperty({ required: false })
  gitUserName?: string;

  @ApiProperty({ required: false })
  gitUserEmail?: string;

  @ApiProperty()
  updatedAt!: string;

  static fromDomain(settings: Settings): GetSettingsResponseDto {
    const dto = new GetSettingsResponseDto();
    dto.sshPrivateKey = settings.sshPrivateKey;
    dto.claudeToken = settings.claudeToken;
    dto.gitUserName = settings.gitUserName;
    dto.gitUserEmail = settings.gitUserEmail;
    dto.updatedAt = settings.updatedAt.toISOString();
    return dto;
  }
}
