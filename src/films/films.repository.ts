import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Film } from './entities/film.entity';
import { IFilmsRepository } from './interfaces/films.repository.interface';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';

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
    const film = this.repo.create(data);
    return this.repo.save(film);
  }

  async update(id: number, data: UpdateFilmDto): Promise<Film | null> {
    await this.repo.update(id, data);
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
