import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Session } from '../../domain/sessions/session.entity';
import { SessionIdDto } from '../../domain/sessions/session-id.dto';
import { SessionStatus } from '../../domain/sessions/session-status.enum';

export interface SessionFilters {
  status?: SessionStatus;
  userId?: string;
}

@Injectable()
export class SessionRepository {
  constructor(
    @InjectRepository(Session)
    private readonly repository: Repository<Session>,
  ) {}

  async save(session: Session): Promise<void> {
    await this.repository.save(session);
  }

  async findById(id: SessionIdDto): Promise<Session | null> {
    return await this.repository.findOne({
      where: { id: id.toString() },
    });
  }

  async findAll(filters?: SessionFilters): Promise<Session[]> {
    const queryBuilder = this.repository.createQueryBuilder('session');

    if (filters) {
      if (filters.status) {
        queryBuilder.where('session.status = :status', {
          status: filters.status,
        });
      }
      // Note: userId filtering would need to be implemented when user system is added
    }

    return await queryBuilder.orderBy('session.createdAt', 'DESC').getMany();
  }

  async delete(id: SessionIdDto): Promise<void> {
    await this.repository.delete({ id: id.toString() });
  }

  async exists(id: SessionIdDto): Promise<boolean> {
    const count = await this.repository.count({
      where: { id: id.toString() },
    });
    return count > 0;
  }

  async count(filters?: SessionFilters): Promise<number> {
    const queryBuilder = this.repository.createQueryBuilder('session');

    if (filters) {
      if (filters.status) {
        queryBuilder.where('session.status = :status', {
          status: filters.status,
        });
      }
    }

    return await queryBuilder.getCount();
  }

  async findByContainerId(containerId: string): Promise<Session | null> {
    return await this.repository.findOne({
      where: { containerId },
    });
  }

  async findExpiredSessions(timeoutMinutes: number): Promise<Session[]> {
    const cutoffTime = new Date(Date.now() - timeoutMinutes * 60 * 1000);

    return await this.repository
      .createQueryBuilder('session')
      .where('session.status = :status', { status: SessionStatus.RUNNING })
      .andWhere('session.lastAccessedAt < :cutoffTime', { cutoffTime })
      .andWhere('session.lastAccessedAt IS NOT NULL')
      .getMany();
  }
}
