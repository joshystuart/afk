import { Module } from '@nestjs/common';
import { GitWatcherService } from './git-watcher.service';
import { DockerModule } from '../docker/docker.module';

@Module({
  imports: [DockerModule],
  providers: [GitWatcherService],
  exports: [GitWatcherService],
})
export class GitWatcherModule {}
