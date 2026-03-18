import { Module } from '@nestjs/common';
import { GitWatcherService } from './git-watcher.service';
import { DockerModule } from '../docker/docker.module';
import { GitModule } from '../git/git.module';

@Module({
  imports: [DockerModule, GitModule],
  providers: [GitWatcherService],
  exports: [GitWatcherService],
})
export class GitWatcherModule {}
