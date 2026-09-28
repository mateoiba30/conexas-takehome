import { Injectable, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, QueryFailedError } from 'typeorm';
import { Film } from './entities/film.entity';
import { IFilmsRepository } from './interfaces/films.repository.interface';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';

const PG_UNIQUE_VIOLATION = '23505';

@Injectable()
export class FilmsRepository implements IFilmsRepository {
  constructor(
    @InjectRepository(Film)
    private readonly repo: Repository<Film>,
  ) {}

  findAll(): Promise<Film[]> {
    return this.repo.find();
  }

  findById(id: number): Promise<Film | null> {
    return this.repo.findOne({ where: { id } });
  }

  findByEpisodeId(episodeId: number): Promise<Film | null> {
    return this.repo.findOne({ where: { episode_id: episodeId }, withDeleted: true });
  }

  async create(data: CreateFilmDto): Promise<Film> {
    try {
      const film = this.repo.create(data);
      return await this.repo.save(film);
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(`A film with episode_id ${data.episode_id} already exists`);
      }
      throw err;
    }
  }

  async update(id: number, data: UpdateFilmDto): Promise<Film | null> {
    try {
      await this.repo.update(id, data);
    } catch (err) {
      if (err instanceof QueryFailedError && (err as any).code === PG_UNIQUE_VIOLATION) {
        throw new ConflictException(`A film with episode_id ${data.episode_id} already exists`);
      }
      throw err;
    }
    return this.findById(id);
  }

  async delete(id: number): Promise<void> {
    await this.repo.softDelete(id);
  }

  async findAllEpisodeIds(): Promise<number[]> {
    const films = await this.repo.find({
      select: { episode_id: true },
      withDeleted: true,
    });
    return films.map(f => f.episode_id).filter((id): id is number => id != null);
  }

}
