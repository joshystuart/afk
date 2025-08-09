import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '../../domain/settings/settings.entity';
import { SettingsRepository } from '../../domain/settings/settings.repository';

@Injectable()
export class SettingsRepositoryImpl implements SettingsRepository {
  constructor(
    @InjectRepository(Settings)
    private readonly repository: Repository<Settings>,
  ) {}

  async get(): Promise<Settings> {
    // Always use the 'default' settings record
    let settings = await this.repository.findOne({ 
      where: { id: 'default' } 
    });

    if (!settings) {
      // Create default settings if none exist
      settings = new Settings();
      settings.id = 'default';
      await this.repository.save(settings);
    }

    return settings;
  }

  async save(settings: Settings): Promise<Settings> {
    // Ensure we always use the 'default' ID
    settings.id = 'default';
    return await this.repository.save(settings);
  }
}
