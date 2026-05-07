import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TMDbGenero, TMDbMovie, TMDbResponse, TMDbSerie } from '../models';
import { environment } from '../../../environments/environment';

// ─────────────────────────────────────────────────────
// TMDbPeliculasService
// ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TMDbPeliculasService {
  private readonly base = environment.tmdbApiUrl;
  private get params(): HttpParams {
    return new HttpParams()
      .set('api_key', environment.tmdbApiKey)
      .set('language', 'es-MX');
  }

  constructor(private http: HttpClient) {}

  buscar(query: string, page = 1): Observable<TMDbResponse<TMDbMovie>> {
    const params = this.params
      .set('query', query)
      .set('page', page.toString());
    return this.http.get<TMDbResponse<TMDbMovie>>(
      `${this.base}/search/movie`, { params }
    );
  }

  detalle(id: number): Observable<TMDbMovie> {
    return this.http.get<TMDbMovie>(
      `${this.base}/movie/${id}`, { params: this.params }
    );
  }

  populares(page = 1): Observable<TMDbResponse<TMDbMovie>> {
    return this.http.get<TMDbResponse<TMDbMovie>>(
      `${this.base}/movie/popular`,
      { params: this.params.set('page', page.toString()) }
    );
  }

  porGenero(generoId: number, page = 1): Observable<TMDbResponse<TMDbMovie>> {
    const params = this.params
      .set('with_genres', generoId.toString())
      .set('page', page.toString());
    return this.http.get<TMDbResponse<TMDbMovie>>(
      `${this.base}/discover/movie`, { params }
    );
  }
}

// ─────────────────────────────────────────────────────
// TMDbSeriesService
// ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TMDbSeriesService {
  private readonly base = environment.tmdbApiUrl;
  private get params(): HttpParams {
    return new HttpParams()
      .set('api_key', environment.tmdbApiKey)
      .set('language', 'es-MX');
  }

  constructor(private http: HttpClient) {}

  buscar(query: string, page = 1): Observable<TMDbResponse<TMDbSerie>> {
    const params = this.params
      .set('query', query)
      .set('page', page.toString());
    return this.http.get<TMDbResponse<TMDbSerie>>(
      `${this.base}/search/tv`, { params }
    );
  }

  detalle(id: number): Observable<TMDbSerie> {
    return this.http.get<TMDbSerie>(
      `${this.base}/tv/${id}`, { params: this.params }
    );
  }

  populares(page = 1): Observable<TMDbResponse<TMDbSerie>> {
    return this.http.get<TMDbResponse<TMDbSerie>>(
      `${this.base}/tv/popular`,
      { params: this.params.set('page', page.toString()) }
    );
  }

  porGenero(generoId: number, page = 1): Observable<TMDbResponse<TMDbSerie>> {
    const params = this.params
      .set('with_genres', generoId.toString())
      .set('page', page.toString());
    return this.http.get<TMDbResponse<TMDbSerie>>(
      `${this.base}/discover/tv`, { params }
    );
  }
}

// ─────────────────────────────────────────────────────
// TMDbGeneroService
// ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TMDbGeneroService {
  private readonly base = environment.tmdbApiUrl;
  private get params(): HttpParams {
    return new HttpParams()
      .set('api_key', environment.tmdbApiKey)
      .set('language', 'es-MX');
  }

  constructor(private http: HttpClient) {}

  getPeliculas(): Observable<{ genres: TMDbGenero[] }> {
    return this.http.get<{ genres: TMDbGenero[] }>(
      `${this.base}/genre/movie/list`, { params: this.params }
    );
  }

  getSeries(): Observable<{ genres: TMDbGenero[] }> {
    return this.http.get<{ genres: TMDbGenero[] }>(
      `${this.base}/genre/tv/list`, { params: this.params }
    );
  }
}

// ─────────────────────────────────────────────────────
// TMDbFacadeService — punto de entrada único
// ─────────────────────────────────────────────────────
@Injectable({ providedIn: 'root' })
export class TMDbFacadeService {
  readonly imageBase = 'https://image.tmdb.org/t/p/w500';

  constructor(
    public peliculas: TMDbPeliculasService,
    public series:    TMDbSeriesService,
    public generos:   TMDbGeneroService
  ) {}

  getPosterUrl(path: string | null): string {
    return path ? `${this.imageBase}${path}` : 'assets/placeholder.png';
  }
}
