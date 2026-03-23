import { Module } from '@nestjs/common';
import { DockerModule } from '../docker/docker.module';
import { GitModule } from '../git/git.module';
import { GitWatcherService } from './git-watcher.service';

@Module({
  imports: [DockerModule, GitModule],
  providers: [GitWatcherService],
  exports: [GitWatcherService],
})
export class GitWatcherModule {}
