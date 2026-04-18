import { Module } from '@nestjs/common';
import { DockerModule } from '../../../libs/docker/docker.module';
import { DomainModule } from '../../../domain/domain.module';
import { ResponseModule } from '../../../libs/response/response.module';
import { SessionPersistenceModule } from '../../../libs/sessions/session-persistence.module';
import { WorkspaceController } from './workspace.controller';
import { WorkspaceInteractor } from './workspace.interactor';
import { WorkspaceFileListingService } from './workspace-file-listing.service';
import { WorkspaceFileIndexService } from './workspace-file-index.service';

@Module({
  imports: [
    DockerModule,
    DomainModule,
    ResponseModule,
    SessionPersistenceModule,
  ],
  controllers: [WorkspaceController],
  providers: [
    WorkspaceInteractor,
    WorkspaceFileListingService,
    WorkspaceFileIndexService,
  ],
  exports: [WorkspaceFileIndexService],
})
export class WorkspaceModule {}
