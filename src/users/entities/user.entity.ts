import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';

export enum UserRole {
  ADMIN = 'admin',
  REGULAR = 'regular',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Juan' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ example: 'Pérez' })
  @Column({ length: 100 })
  lastname: string;

  @ApiProperty({ example: 'juan@example.com' })
  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.REGULAR })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.REGULAR })
  role: UserRole;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  created_at: Date;
}
