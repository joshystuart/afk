import { Module } from '@nestjs/common';
import { DockerModule } from '../docker/docker.module';
import { GitService } from './git.service';

@Module({
  imports: [DockerModule],
  providers: [GitService],
  exports: [GitService],
})
export class GitModule {}
