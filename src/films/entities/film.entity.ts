import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

@Entity('films')
export class Film {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  title: string;

  @Column({ nullable: true })
  episode_id: number;

  @Column({ type: 'text', nullable: true })
  opening_crawl: string;

  @Column({ length: 255, nullable: true })
  director: string;

  @Column({ length: 255, nullable: true })
  producer: string;

  @Column({ type: 'date', nullable: true })
  release_date: string;

  @Column('text', { array: true, nullable: true, default: [] })
  characters: string[];

  @Column('text', { array: true, nullable: true, default: [] })
  planets: string[];

  @Column('text', { array: true, nullable: true, default: [] })
  species: string[];

  @Column('text', { array: true, nullable: true, default: [] })
  starships: string[];

  @Column('text', { array: true, nullable: true, default: [] })
  vehicles: string[];

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @DeleteDateColumn()
  deleted_at: Date | null;
}
