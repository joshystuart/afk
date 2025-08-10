import { Injectable, Inject } from '@nestjs/common';
import { SettingsRepository } from '../../../domain/settings/settings.repository';
import { Settings } from '../../../domain/settings/settings.entity';
import { SETTINGS_REPOSITORY } from '../../../domain/settings/settings.tokens';

@Injectable()
export class GetSettingsInteractor {
  constructor(
    @Inject(SETTINGS_REPOSITORY)
    private readonly settingsRepository: SettingsRepository,
  ) {}

  async execute(): Promise<Settings> {
    return await this.settingsRepository.get();
  }
}
