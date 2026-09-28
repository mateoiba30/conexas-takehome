import { Injectable, NotFoundException, Inject, Logger } from '@nestjs/common';
import { IFilmsRepository } from './interfaces/films.repository.interface';
import { ISwapiClient, SwapiFilmProperties } from '../swapi/interfaces/swapi-client.interface';
import { CreateFilmDto } from './dto/create-film.dto';
import { UpdateFilmDto } from './dto/update-film.dto';
import { Film } from './entities/film.entity';
import { randomQuote } from '../common/star-wars.quotes';

@Injectable()
export class FilmsService {
  private readonly logger = new Logger(FilmsService.name);

  constructor(
    @Inject('IFilmsRepository')
    private readonly filmsRepo: IFilmsRepository,
    @Inject('ISwapiClient')
    private readonly swapiClient: ISwapiClient,
  ) {}

  async findAll(): Promise<Film[]> {
    this.logger.debug('FilmsService.findAll: fetching all films');
    return this.filmsRepo.findAll();
  }

  async findById(id: number): Promise<Film> {
    this.logger.debug({ id }, 'FilmsService.findById: entry');
    const film = await this.filmsRepo.findById(id);
    if (!film) {
      this.logger.warn({ id }, 'FilmsService.findById: not found');
      throw new NotFoundException(`Film with id ${id} not found`);
    }
    return film;
  }

  async create(dto: CreateFilmDto): Promise<Film> {
    this.logger.debug({ title: dto.title }, 'FilmsService.create: entry');
    const film = await this.filmsRepo.create(dto);
    this.logger.log({ filmId: film.id, title: film.title }, 'FilmsService.create: film created');
    return film;
  }

  async update(id: number, dto: UpdateFilmDto): Promise<Film> {
    this.logger.debug({ id }, 'FilmsService.update: entry');
    const film = await this.filmsRepo.update(id, dto);
    if (!film) {
      this.logger.warn({ id }, 'FilmsService.update: not found');
      throw new NotFoundException(`Film with id ${id} not found`);
    }
    this.logger.log({ filmId: film.id }, 'FilmsService.update: film updated');
    return film;
  }

  async delete(id: number): Promise<void> {
    this.logger.debug({ id }, 'FilmsService.delete: entry');
    const film = await this.filmsRepo.findById(id);
    if (!film) {
      this.logger.warn({ id }, 'FilmsService.delete: not found');
      throw new NotFoundException(`Film with id ${id} not found`);
    }
    await this.filmsRepo.delete(id);
    this.logger.log({ id }, 'FilmsService.delete: film deleted');
  }

  async syncFromSwapi(): Promise<{ added: number; skipped: number }> {
    this.logger.log('FilmsService.syncFromSwapi: starting sync');

    const swapiFilms = await this.swapiClient.fetchFilms();
    this.logger.debug({ filmCount: swapiFilms.length }, 'FilmsService.syncFromSwapi: films fetched');

    const hasMissing = await this.hasMissingFilms(swapiFilms);
    if (!hasMissing) {
      this.logger.log(
        { skipped: swapiFilms.length },
        'FilmsService.syncFromSwapi: all films already in DB, skipping nameMap fetch',
      );
      return { added: 0, skipped: swapiFilms.length };
    }

    const nameMap = await this.swapiClient.fetchNameMap();
    this.logger.debug({ mapSize: Object.keys(nameMap).length }, 'FilmsService.syncFromSwapi: nameMap fetched');

    const result = await this.updateFilmsData(swapiFilms, nameMap);
    this.logger.log({ ...result, quote: randomQuote() }, 'FilmsService.syncFromSwapi: sync complete');
    return result;
  }

  private async hasMissingFilms(swapiFilms: SwapiFilmProperties[]): Promise<boolean> {
    const existingEpisodeIds = await this.filmsRepo.findAllEpisodeIds();
    const missing = swapiFilms.some(film => !existingEpisodeIds.includes(film.episode_id));
    this.logger.debug(
      { existing: existingEpisodeIds.length, missing },
      'FilmsService.hasMissingFilms: result',
    );
    return missing;
  }

  private async updateFilmsData(
    swapiFilms: SwapiFilmProperties[],
    nameMap: Record<string, string>,
  ): Promise<{ added: number; skipped: number }> {
    let added = 0;
    let skipped = 0;

    for (const film of swapiFilms) {
      const exists = await this.validateExistence(film.episode_id);
      if (exists) {
        skipped++;
        continue;
      }

      await this.createNewFilm(film, nameMap);
      added++;
    }

    return { added, skipped };
  }

  private async validateExistence(episodeId: number): Promise<boolean> {
    const existing = await this.filmsRepo.findByEpisodeId(episodeId);
    if (existing) {
      this.logger.debug(
        { episode_id: episodeId },
        'FilmsService.validateExistence: film exists, skipping',
      );
    }
    return !!existing;
  }

  private async createNewFilm(
    film: SwapiFilmProperties,
    nameMap: Record<string, string>,
  ): Promise<void> {
    const resolveNames = (urls: string[]): string[] =>
      urls
        .map(url => nameMap[url] || nameMap[url.replace(/\/$/, '')] || null)
        .filter(Boolean) as string[];

    await this.filmsRepo.create({
      title: film.title,
      episode_id: film.episode_id,
      opening_crawl: film.opening_crawl,
      director: film.director,
      producer: film.producer,
      release_date: film.release_date,
      characters: resolveNames(film.characters),
      planets: resolveNames(film.planets),
      species: resolveNames(film.species),
      starships: resolveNames(film.starships),
      vehicles: resolveNames(film.vehicles),
    });

    this.logger.log(
      { episode_id: film.episode_id, title: film.title },
      'FilmsService.createNewFilm: film added',
    );
  }

}
