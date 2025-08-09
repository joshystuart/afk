import { Settings } from './settings.entity';

export interface SettingsRepository {
  get(): Promise<Settings>;
  save(settings: Settings): Promise<Settings>;
}