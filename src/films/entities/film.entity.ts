import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

@Entity('films')
export class Film {
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn()
  id: number;

  @ApiProperty({ example: 'A New Hope' })
  @Column({ length: 255 })
  title: string;

  @ApiProperty({ example: 4 })
  @Column({ nullable: false, unique: true })
  episode_id: number;

  @ApiPropertyOptional({ example: 'It is a period of civil war...' })
  @Column({ type: 'text', nullable: true })
  opening_crawl: string;

  @ApiPropertyOptional({ example: 'George Lucas' })
  @Column({ length: 255, nullable: true })
  director: string;

  @ApiPropertyOptional({ example: 'Gary Kurtz' })
  @Column({ length: 255, nullable: true })
  producer: string;

  @ApiPropertyOptional({ example: '1977-05-25' })
  @Column({ type: 'date', nullable: true })
  release_date: string;

  @ApiProperty({ type: [String], example: ['Luke Skywalker', 'C-3PO'] })
  @Column('text', { array: true, nullable: true, default: [] })
  characters: string[];

  @ApiProperty({ type: [String], example: ['Tatooine', 'Alderaan'] })
  @Column('text', { array: true, nullable: true, default: [] })
  planets: string[];

  @ApiProperty({ type: [String], example: ['Human', 'Droid'] })
  @Column('text', { array: true, nullable: true, default: [] })
  species: string[];

  @ApiProperty({ type: [String], example: ['Millennium Falcon', 'X-wing'] })
  @Column('text', { array: true, nullable: true, default: [] })
  starships: string[];

  @ApiProperty({ type: [String], example: ['Sandcrawler'] })
  @Column('text', { array: true, nullable: true, default: [] })
  vehicles: string[];

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @CreateDateColumn()
  created_at: Date;

  @ApiProperty({ example: '2024-01-01T00:00:00.000Z' })
  @UpdateDateColumn()
  updated_at: Date;

  @ApiPropertyOptional({ example: null, nullable: true })
  @DeleteDateColumn()
  deleted_at: Date | null;
}
