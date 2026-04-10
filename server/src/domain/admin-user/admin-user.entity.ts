import {
  Entity,
  Column,
  PrimaryColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('admin_user')
export class AdminUser {
  @PrimaryColumn('varchar', { length: 10, default: 'admin' })
  id: string = 'admin';

  @Column('varchar', { length: 255, unique: true })
  username!: string;

  @Column('varchar', { length: 255 })
  passwordHash!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
