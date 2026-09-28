import { Film } from '../entities/film.entity';
import { CreateFilmDto } from '../dto/create-film.dto';
import { UpdateFilmDto } from '../dto/update-film.dto';

export interface IFilmsRepository {
  findAll(): Promise<Film[]>;
  findById(id: number): Promise<Film | null>;
  findByEpisodeId(episodeId: number): Promise<Film | null>;
  findAllEpisodeIds(): Promise<number[]>;
  create(data: CreateFilmDto): Promise<Film>;
  update(id: number, data: UpdateFilmDto): Promise<Film | null>;
  delete(id: number): Promise<void>;
}
