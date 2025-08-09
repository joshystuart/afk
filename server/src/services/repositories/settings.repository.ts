import { Injectable } from '@nestjs/common';
import { Settings } from '../../domain/settings/settings.entity';
import { SettingsRepository } from '../../domain/settings/settings.repository';

@Injectable()
export class SettingsRepositoryImpl implements SettingsRepository {
  private settings: Settings = new Settings();

  async get(): Promise<Settings> {
    return this.settings;
  }

  async save(settings: Settings): Promise<Settings> {
    this.settings = settings;
    return this.settings;
  }
}