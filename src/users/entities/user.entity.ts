import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';
import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';

export enum UserRole {
  ADMIN = 'admin',
  REGULAR = 'regular',
}

@Entity('users')
export class User {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'Luke' })
  @Column({ length: 100 })
  name: string;

  @ApiProperty({ example: 'Skywalker' })
  @Column({ length: 100 })
  lastname: string;

  @ApiProperty({ example: 'luke@rebellion.com' })
  @Column({ length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ length: 255 })
  password: string;

  @ApiProperty({ enum: UserRole, example: UserRole.REGULAR })
  @Column({ type: 'enum', enum: UserRole, default: UserRole.REGULAR })
  role: UserRole;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  created_at: Date;
}
