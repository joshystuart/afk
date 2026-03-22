import { Module } from '@nestjs/common';
import { GitHubController } from './github.controller';
import { GitHubService } from './github.service';
import { ResponseModule } from '../response/response.module';
import { SettingsPersistenceModule } from '../settings/settings-persistence.module';

@Module({
  imports: [ResponseModule, SettingsPersistenceModule],
  controllers: [GitHubController],
  providers: [GitHubService],
  exports: [GitHubService],
})
export class GitHubModule {}
