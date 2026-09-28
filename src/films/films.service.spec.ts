import { jest } from '@jest/globals';
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { FilmsService } from './films.service';
import { IFilmsRepository } from './interfaces/films.repository.interface';
import { ISwapiClient, SwapiFilmProperties } from '../swapi/interfaces/swapi-client.interface';
import { Film } from './entities/film.entity';
import { CreateFilmDto } from './dto/create-film.dto';

const mockFilm: Film = {
  id: 1,
  title: 'A New Hope',
  episode_id: 4,
  opening_crawl: 'It is a period...',
  director: 'George Lucas',
  producer: 'Gary Kurtz',
  release_date: '1977-05-25',
  characters: ['Luke Skywalker'],
  planets: ['Tatooine'],
  species: [],
  starships: [],
  vehicles: [],
  created_at: new Date(),
  updated_at: new Date(),
  deleted_at: null,
};

const mockSwapiFilm: SwapiFilmProperties = {
  title: 'A New Hope',
  episode_id: 4,
  opening_crawl: 'It is a period...',
  director: 'George Lucas',
  producer: 'Gary Kurtz',
  release_date: '1977-05-25',
  characters: ['https://www.swapi.tech/api/people/1/'],
  planets: ['https://www.swapi.tech/api/planets/1/'],
  species: [],
  starships: [],
  vehicles: [],
};

const mockNameMap: Record<string, string> = {
  'https://www.swapi.tech/api/people/1': 'Luke Skywalker',
  'https://www.swapi.tech/api/people/1/': 'Luke Skywalker',
  'https://www.swapi.tech/api/planets/1': 'Tatooine',
  'https://www.swapi.tech/api/planets/1/': 'Tatooine',
};

describe('FilmsService', () => {
  let service: FilmsService;
  let filmsRepo: jest.Mocked<IFilmsRepository>;
  let swapiClient: jest.Mocked<ISwapiClient>;

  beforeEach(async () => {
    filmsRepo = {
      findAll: jest.fn(),
      findById: jest.fn(),
      findByEpisodeId: jest.fn(),
      findAllEpisodeIds: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    swapiClient = {
      fetchNameMap: jest.fn(),
      fetchFilms: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FilmsService,
        { provide: 'IFilmsRepository', useValue: filmsRepo },
        { provide: 'ISwapiClient', useValue: swapiClient },
      ],
    }).compile();

    service = module.get<FilmsService>(FilmsService);
  });

  describe('findAll', () => {
    it('returns the list of films from the repository', async () => {
      filmsRepo.findAll.mockResolvedValue([mockFilm]);
      expect(await service.findAll()).toEqual([mockFilm]);
    });
  });

  describe('findById', () => {
    it('returns the film when it exists', async () => {
      filmsRepo.findById.mockResolvedValue(mockFilm);
      expect(await service.findById(1)).toEqual(mockFilm);
    });

    it('throws NotFoundException when film does not exist', async () => {
      filmsRepo.findById.mockResolvedValue(null);
      await expect(service.findById(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('create', () => {
    it('creates a film and returns it', async () => {
      const dto: CreateFilmDto = { title: 'A New Hope', episode_id: 4 };
      filmsRepo.create.mockResolvedValue(mockFilm);

      const result = await service.create(dto);

      expect(filmsRepo.create).toHaveBeenCalledWith(dto);
      expect(result).toEqual(mockFilm);
    });
  });

  describe('update', () => {
    it('updates a film and returns the updated film', async () => {
      filmsRepo.update.mockResolvedValue({ ...mockFilm, title: 'Updated Title' });

      const result = await service.update(1, { title: 'Updated Title' });

      expect(result.title).toBe('Updated Title');
    });

    it('throws NotFoundException when film does not exist', async () => {
      filmsRepo.update.mockResolvedValue(null);
      await expect(service.update(999, { title: 'X' })).rejects.toThrow(NotFoundException);
    });
  });

  describe('delete', () => {
    it('deletes the film when it exists', async () => {
      filmsRepo.findById.mockResolvedValue(mockFilm);
      await service.delete(1);
      expect(filmsRepo.delete).toHaveBeenCalledWith(1);
    });

    it('throws NotFoundException when film does not exist', async () => {
      filmsRepo.findById.mockResolvedValue(null);
      await expect(service.delete(999)).rejects.toThrow(NotFoundException);
    });
  });

  describe('syncFromSwapi', () => {
    describe('hasMissingFilms', () => {
      it('skips nameMap fetch when all films already exist in DB', async () => {
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([4]);

        const result = await service.syncFromSwapi();

        expect(swapiClient.fetchNameMap).not.toHaveBeenCalled();
        expect(result).toEqual({ added: 0, skipped: 1 });
      });

      it('fetches nameMap when at least one film is missing', async () => {
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([]);
        swapiClient.fetchNameMap.mockResolvedValue(mockNameMap);
        filmsRepo.findByEpisodeId.mockResolvedValue(null);
        filmsRepo.create.mockResolvedValue(mockFilm);

        await service.syncFromSwapi();

        expect(swapiClient.fetchNameMap).toHaveBeenCalledTimes(1);
      });

      it('treats soft-deleted films as existing (does not re-insert them)', async () => {
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([4]);

        const result = await service.syncFromSwapi();

        expect(swapiClient.fetchNameMap).not.toHaveBeenCalled();
        expect(filmsRepo.create).not.toHaveBeenCalled();
        expect(result).toEqual({ added: 0, skipped: 1 });
      });
    });

    describe('validateExistence', () => {
      it('skips a film that already exists in DB', async () => {
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([]);
        swapiClient.fetchNameMap.mockResolvedValue(mockNameMap);
        filmsRepo.findByEpisodeId.mockResolvedValue(mockFilm);

        const result = await service.syncFromSwapi();

        expect(filmsRepo.create).not.toHaveBeenCalled();
        expect(result).toEqual({ added: 0, skipped: 1 });
      });

      it('does not re-insert a soft-deleted film', async () => {
        const deletedFilm: Film = { ...mockFilm, deleted_at: new Date() };
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([]);
        swapiClient.fetchNameMap.mockResolvedValue(mockNameMap);
        filmsRepo.findByEpisodeId.mockResolvedValue(deletedFilm);

        const result = await service.syncFromSwapi();

        expect(filmsRepo.create).not.toHaveBeenCalled();
        expect(result).toEqual({ added: 0, skipped: 1 });
      });

      it('processes a film that does not exist in DB', async () => {
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([]);
        swapiClient.fetchNameMap.mockResolvedValue(mockNameMap);
        filmsRepo.findByEpisodeId.mockResolvedValue(null);
        filmsRepo.create.mockResolvedValue(mockFilm);

        const result = await service.syncFromSwapi();

        expect(filmsRepo.create).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ added: 1, skipped: 0 });
      });
    });

    describe('createNewFilm', () => {
      it('resolves character and planet URLs to names via the nameMap', async () => {
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([]);
        swapiClient.fetchNameMap.mockResolvedValue(mockNameMap);
        filmsRepo.findByEpisodeId.mockResolvedValue(null);
        filmsRepo.create.mockResolvedValue(mockFilm);

        await service.syncFromSwapi();

        const createArg = filmsRepo.create.mock.calls[0][0] as CreateFilmDto;
        expect(createArg.characters).toContain('Luke Skywalker');
        expect(createArg.planets).toContain('Tatooine');
      });

      it('resolves URLs with or without trailing slash', async () => {
        const nameMapWithoutSlash: Record<string, string> = {
          'https://swapi.dev/api/people/1': 'Luke Skywalker',
          'https://swapi.dev/api/people/1/': 'Luke Skywalker',
        };
        const filmWithTrailingSlash: SwapiFilmProperties = {
          ...mockSwapiFilm,
          characters: ['https://swapi.dev/api/people/1/'],
          planets: [],
        };

        swapiClient.fetchFilms.mockResolvedValue([filmWithTrailingSlash]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([]);
        swapiClient.fetchNameMap.mockResolvedValue(nameMapWithoutSlash);
        filmsRepo.findByEpisodeId.mockResolvedValue(null);
        filmsRepo.create.mockResolvedValue(mockFilm);

        await service.syncFromSwapi();

        const createArg = filmsRepo.create.mock.calls[0][0] as CreateFilmDto;
        expect(createArg.characters).toContain('Luke Skywalker');
      });
    });

    describe('updateFilmsData', () => {
      it('returns { added: 1, skipped: 0 } when all films are new', async () => {
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([]);
        swapiClient.fetchNameMap.mockResolvedValue(mockNameMap);
        filmsRepo.findByEpisodeId.mockResolvedValue(null);
        filmsRepo.create.mockResolvedValue(mockFilm);

        expect(await service.syncFromSwapi()).toEqual({ added: 1, skipped: 0 });
      });

      it('returns { added: 0, skipped: 1 } when all films already exist', async () => {
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([4]);

        expect(await service.syncFromSwapi()).toEqual({ added: 0, skipped: 1 });
      });

      it('returns correct counts for a mix of new and existing films', async () => {
        const film5: SwapiFilmProperties = {
          ...mockSwapiFilm,
          title: 'The Empire Strikes Back',
          episode_id: 5,
        };
        swapiClient.fetchFilms.mockResolvedValue([mockSwapiFilm, film5]);
        filmsRepo.findAllEpisodeIds.mockResolvedValue([4]);
        swapiClient.fetchNameMap.mockResolvedValue(mockNameMap);
        filmsRepo.findByEpisodeId
          .mockResolvedValueOnce(mockFilm)
          .mockResolvedValueOnce(null);
        filmsRepo.create.mockResolvedValue({ ...mockFilm, ...film5 });

        const result = await service.syncFromSwapi();

        expect(filmsRepo.create).toHaveBeenCalledTimes(1);
        expect(result).toEqual({ added: 1, skipped: 1 });
      });
    });
  });

});
