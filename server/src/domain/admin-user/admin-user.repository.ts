import { AdminUser } from './admin-user.entity';

export interface AdminUserRepository {
  get(): Promise<AdminUser | null>;
  save(adminUser: AdminUser): Promise<AdminUser>;
  exists(): Promise<boolean>;
}
