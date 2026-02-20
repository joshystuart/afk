import { Module } from '@nestjs/common';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { ResponseService } from '../response/response.service';
import { SettingsModule } from '../../interactors/settings/settings.module';

@Module({
  imports: [SettingsModule],
  controllers: [GitHubController],
  providers: [GitHubService, ResponseService],
  exports: [GitHubService],
})
export class GitHubModule {}
