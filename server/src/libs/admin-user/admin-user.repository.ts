import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminUser } from '../../domain/admin-user/admin-user.entity';
import { AdminUserRepository } from '../../domain/admin-user/admin-user.repository';

@Injectable()
export class AdminUserRepositoryImpl implements AdminUserRepository {
  private static readonly DEFAULT_ID = 'admin';

  constructor(
    @InjectRepository(AdminUser)
    private readonly repository: Repository<AdminUser>,
  ) {}

  async get(): Promise<AdminUser | null> {
    return this.repository.findOneBy({
      id: AdminUserRepositoryImpl.DEFAULT_ID,
    });
  }

  async save(adminUser: AdminUser): Promise<AdminUser> {
    adminUser.id = AdminUserRepositoryImpl.DEFAULT_ID;
    return this.repository.save(adminUser);
  }

  async exists(): Promise<boolean> {
    const count = await this.repository.countBy({
      id: AdminUserRepositoryImpl.DEFAULT_ID,
    });
    return count > 0;
  }
}
