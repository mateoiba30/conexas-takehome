export interface SwapiFilmProperties {
  title: string;
  episode_id: number;
  opening_crawl: string;
  director: string;
  producer: string;
  release_date: string;
  characters: string[];
  planets: string[];
  species: string[];
  starships: string[];
  vehicles: string[];
}

export interface ISwapiClient {
  fetchNameMap(): Promise<Record<string, string>>;
  fetchFilms(): Promise<SwapiFilmProperties[]>;
}
