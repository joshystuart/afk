import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Settings } from '../../domain/settings/settings.entity';
import { SettingsRepository } from '../../domain/settings/settings.repository';

@Injectable()
export class SettingsRepositoryImpl
  implements SettingsRepository, OnModuleInit
{
  private static readonly DEFAULT_ID = 'default';
  private cached: Settings | null = null;

  constructor(
    @InjectRepository(Settings)
    private readonly repository: Repository<Settings>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.repository.upsert(
      { id: SettingsRepositoryImpl.DEFAULT_ID },
      { conflictPaths: ['id'] },
    );
  }

  async get(): Promise<Settings> {
    if (this.cached) {
      return this.cached;
    }

    const settings = await this.repository.findOneByOrFail({
      id: SettingsRepositoryImpl.DEFAULT_ID,
    });
    settings.applyDefaults();
    this.cached = settings;
    return settings;
  }

  async save(settings: Settings): Promise<Settings> {
    settings.id = SettingsRepositoryImpl.DEFAULT_ID;
    const saved = await this.repository.save(settings);
    this.cached = null;
    return saved;
  }

  async reset(): Promise<Settings> {
    await this.repository.clear();
    const settings = new Settings();
    settings.id = SettingsRepositoryImpl.DEFAULT_ID;
    const saved = await this.repository.save(settings);
    this.cached = null;
    return saved;
  }
}
