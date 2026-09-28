import { Injectable, Logger } from '@nestjs/common';
import { ISwapiClient, SwapiFilmProperties } from './interfaces/swapi-client.interface';

interface SwapiPage {
  count: number;
  next: string | null;
  previous: string | null;
  results: Array<{ name: string; url: string; [key: string]: unknown }>;
}

interface SwapiFilmsPage {
  count: number;
  results: SwapiFilmProperties[];
}

@Injectable()
export class SwapiClient implements ISwapiClient {
  private readonly logger = new Logger(SwapiClient.name);
  private readonly BASE_URL = 'https://swapi.dev/api';
  private readonly ENTITIES = ['people', 'planets', 'species', 'starships', 'vehicles'] as const;

  async fetchNameMap(): Promise<Record<string, string>> {
    this.logger.debug('SwapiClient.fetchNameMap: start');
    const firstPages = await this.fetchFirstPages();
    const allPages = await this.fetchAllPages(firstPages);
    const nameMap = this.buildNameMap(allPages);
    this.logger.log({ mapSize: Object.keys(nameMap).length }, 'SwapiClient.fetchNameMap: map built');
    return nameMap;
  }

  private fetchFirstPages(): Promise<SwapiPage[]> {
    return Promise.all(this.ENTITIES.map(entity => this.fetchEntityPage(entity, 1)));
  }

  private async fetchAllPages(firstPages: SwapiPage[]): Promise<SwapiPage[]> {
    const remainingRequests: Promise<SwapiPage>[] = [];
    firstPages.forEach((page, index) => {
      if (page.results.length === 0) return;
      const totalPages = Math.ceil(page.count / page.results.length);
      for (let p = 2; p <= totalPages; p++) {
        remainingRequests.push(this.fetchEntityPage(this.ENTITIES[index], p));
      }
    });

    const remainingPages = remainingRequests.length > 0 ? await Promise.all(remainingRequests) : [];
    this.logger.debug(
      { firstPageCount: firstPages.length, remainingPageCount: remainingPages.length },
      'SwapiClient.fetchAllPages: done',
    );
    return [...firstPages, ...remainingPages];
  }

  private buildNameMap(pages: SwapiPage[]): Record<string, string> {
    const nameMap: Record<string, string> = {};
    for (const page of pages) {
      for (const item of page.results) {
        const normalized = item.url.replace(/\/$/, '');
        nameMap[normalized] = item.name;
        nameMap[`${normalized}/`] = item.name;
      }
    }
    return nameMap;
  }

  async fetchFilms(): Promise<SwapiFilmProperties[]> {
    this.logger.debug('SwapiClient.fetchFilms: fetching from SWAPI');
    const response = await fetch(`${this.BASE_URL}/films/`);
    if (!response.ok) {
      throw new Error(`SWAPI films fetch failed: ${response.status}`);
    }
    const data = (await response.json()) as SwapiFilmsPage;
    this.logger.log({ count: data.results.length }, 'SwapiClient.fetchFilms: fetched');
    return data.results;
  }

  private async fetchEntityPage(entity: string, page: number): Promise<SwapiPage> {
    this.logger.debug({ entity, page }, 'SwapiClient.fetchEntityPage: fetching');
    const response = await fetch(`${this.BASE_URL}/${entity}/?page=${page}`);
    if (!response.ok) {
      throw new Error(`SWAPI ${entity} page ${page} fetch failed: ${response.status}`);
    }
    return response.json() as Promise<SwapiPage>;
  }
}
