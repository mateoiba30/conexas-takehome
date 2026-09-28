# Conexa Films API

REST API built with NestJS for Star Wars film management.

## Running with Docker (recommended)

The only requirement is having Docker installed.

```bash
cp .env.example .env && docker-compose up --build
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api`  
Adminer (DB viewer): `http://localhost:8080`

On first boot the app automatically syncs all Star Wars films from SWAPI and creates two seed users. No manual step needed.

**Seed users:**

| Role    | Email             | Password  |
|---------|-------------------|-----------|
| admin   | admin@conexa.com  | admin123  |
| regular | user@conexa.com   | user123   |

**Adminer (DB viewer):** `http://localhost:8080`  
System: `PostgreSQL`, Server: `db`, Username: `postgres`, Password: `postgres`, Database: `conexa`

## Testing the API

1. Go to `http://localhost:3000/api`
2. Execute `POST /auth/login` — credentials are pre-filled as examples
3. Copy the `access_token` from the response
4. Click "Authorize" in the top right and paste the token
5. All protected endpoints will now work automatically

## Running locally (development)

1. Copy `.env.example` to `.env` and fill in the values.
2. Start a PostgreSQL instance.
3. Run:

```bash
npm install
npm run start:dev
```

## Testing

```bash
npm test
```

Unit tests use Jest with mocked repositories and SWAPI client. No running database is required.

---

## Architecture decisions

### Database model: flat TEXT[] instead of relational

Characters, planets, species, starships and vehicles are stored as `TEXT[]` columns with resolved names (e.g. `["Luke Skywalker", "Leia Organa"]`) instead of separate normalized tables.

This is a deliberate tradeoff for this scope: the system manages films, not Star Wars entities. Adding full CRUD and relational tables for every entity type would require endpoints for all of them to be useful, which is out of scope. The downside is that you lose the ability to query a character's full profile or navigate relationships. In a real production system with those requirements the model would be relational.

### Auto-seed on startup via SWAPI sync instead of a seed.sql

When the app starts and the films table is empty, it calls its own SWAPI sync instead of loading a static SQL file. The advantage is that the data is always fresh from the source and there is nothing to maintain manually.

In a real system this decision depends on the size and variability of the external data. If there were millions of records or a strict rate-limited API, the approach would change: a minimal fixed seed would be loaded at startup and the full sync would be a background job or a scheduled task, not something that blocks boot.

### Sync is non-destructive and the DB is the source of truth

The sync endpoint only inserts films that are not already in the database (matched by `episode_id`, including soft-deleted ones). It does not overwrite films that have been manually edited, and it does not restore films that have been soft-deleted.

The rationale is that once data enters the system it belongs to the system. SWAPI is the origin, not the authority. If a new episode is published the sync picks it up on the next run. If something was deleted or edited locally, that decision is preserved.

### Sync on startup instead of a cron job

A new Star Wars film is released every several years. A cron job polling for new content every hour or every day provides no real value for that frequency. Running the sync at startup guarantees the catalog is up to date the moment the system is available, with zero operational overhead. Since the sync is idempotent and cheap when nothing is missing (one `fetchFilms()` call plus one DB query), running it at every boot has negligible cost.

### Lazy fetchNameMap optimization

The SWAPI sync works in two phases. First it fetches the list of films (1 request) and compares their `episode_id` values against the database. Only if at least one film is missing does it proceed to fetch the full name map (roughly 15 parallel requests across 5 entity pages). This avoids the expensive fetch on the common case where everything is already in the database.

### TEXT[] values are validated as string arrays but not checked against entity tables

The `characters`, `planets`, `species`, `starships` and `vehicles` fields accept any array of strings. This means a request could technically pass invented names. Enforcing referential integrity would require entity tables and full CRUD for each entity type, which is outside the scope of a films management system.

### TypeORM over Prisma

TypeORM aligns better with NestJS's object-oriented model. Entities are decorated classes, repositories are injectable services, and the layered architecture maps naturally to TypeORM's abstractions. Prisma's generated client is excellent for many use cases but its design is less idiomatic in a class-based DI system.

### `synchronize: true` in development, migrations in production

TypeORM's `synchronize: true` auto-applies schema changes from entity definitions on every boot. This is convenient during development but unsafe in production because it can silently drop or alter columns. In a production deployment this flag would be disabled and schema changes would be managed with TypeORM migrations.

### Layered architecture: controller, service, repository

The controller handles HTTP concerns (parsing, status codes, guards). The service holds business logic. The repository encapsulates all database access. For a CRUD system this separation pays off immediately because it keeps queries out of business logic and makes both layers independently testable. Adding complex queries later does not require touching the service layer.

### Dependency inversion via interfaces and NestJS DI tokens

Services depend on interfaces (`IFilmsRepository`, `IUsersRepository`, `ISwapiClient`) injected via string tokens, not on concrete implementations. This decouples business logic from infrastructure, makes unit testing trivial (swap the implementation for a mock), and allows changing the underlying technology (database, HTTP client) without modifying service code.

Auth-related libraries (`passport-jwt`, `JwtService`) are used directly without an abstraction layer. The tradeoff is intentional: wrapping a well-established library like `passport-jwt` behind an interface adds indirection without meaningful benefit. The abstraction boundary matters at the DB and external API level, not at the library level.

### Per-module folder structure

Each module owns its `dto/`, `entities/`, `interfaces/`, and `guards/` folders rather than having global shared folders. This keeps each module self-contained: everything a module needs lives next to it. It also makes it easy to delete or extract a module without hunting for scattered files.

### CryptoService in CommonModule

Password hashing is needed in two places: `AuthService` (login) and `UsersService` (registration). Rather than duplicating the bcrypt dependency or creating a circular module dependency, a `CryptoService` lives in `CommonModule` and is exported for both to consume. If the hashing strategy changes in the future there is exactly one place to update.

### Auth libraries: useful but not locking

`@nestjs/jwt` and `passport-jwt` handle JWT issuance and validation without coupling the system to a hosted auth provider like Supabase Auth or Auth0. JWT tokens are stateless, so there is no token blacklist or server-side session. Logout is handled client-side by discarding the token.

### Swagger with persistent JWT

The Swagger UI at `/api` includes a bearer auth button. Once a token is entered it persists across requests in the same session, so the full API can be explored without re-entering credentials on every call.
