import { ApiProperty } from '@nestjs/swagger';

export class SkillDto {
  @ApiProperty({ description: 'Skill command name (directory name)' })
  name: string;

  @ApiProperty({ description: 'Skill description from SKILL.md first line' })
  description: string;
}

export class ListSkillsResponseDto {
  @ApiProperty({ type: [SkillDto], description: 'Available skills' })
  skills: SkillDto[];
}
