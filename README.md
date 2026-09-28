# Conexa Films API

REST API built with NestJS for Star Wars film management.

---

## Getting started

### Option 1: Live deploy (no setup required)

The API is deployed at:

```
https://conexas-takehome-production.up.railway.app
```

Swagger: `https://conexas-takehome-production.up.railway.app/api`

Nothing to install or run. Go directly to the [Testing the API](#testing-the-api) section.

---

### Option 2: Docker (recommended for local)

The only requirement is having Docker installed.

```bash
cp .env.example .env && docker-compose up --build
```

API: `http://localhost:3000`  
Swagger: `http://localhost:3000/api`

On first boot the app automatically syncs all Star Wars films from SWAPI and creates two seed users. No manual step needed.

**Seed users:**

| Role    | Email             | Password   |
|---------|-------------------|------------|
| admin   | admin@conexa.com  | Admin1234  |
| regular | user@conexa.com   | User1234   |

---

### Option 3: Local without Docker

1. Copy `.env.example` to `.env` and fill in your database connection values.
2. Start a PostgreSQL instance.
3. Run:

```bash
npm install
npm run start:dev
```

---

## Testing the API

### Swagger

1. Go to `<base-url>/api` (e.g. `https://conexas-takehome-production.up.railway.app/api`)
2. Execute `POST /auth/login` — credentials are pre-filled as examples
3. Copy the `access_token` from the response
4. Click "Authorize" in the top right and paste the token
5. All protected endpoints will now work automatically

### Adminer (DB viewer) — local only

Available when running with Docker at `http://localhost:8080`.

| Field    | Value      |
|----------|------------|
| System   | PostgreSQL |
| Server   | db         |
| Username | postgres   |
| Password | postgres   |
| Database | conexa     |

Adminer is not available on the live deploy.

### Unit tests — local only

```bash
npm test
```

Unit tests use Jest with mocked repositories and SWAPI client. No running database is required.

---

## Architecture decisions

### Database model: flat TEXT[] instead of relational

Characters, planets, species, starships and vehicles are stored as `TEXT[]` columns with resolved names (e.g. `["Luke Skywalker", "Leia Organa"]`) instead of separate normalized tables.

This is a deliberate tradeoff for this scope: the system manages films, not Star Wars entities. Adding full CRUD and relational tables for every entity type would require endpoints for all of them to be useful, which is out of scope. The downside is that you lose the ability to query a character's full profile or navigate relationships. In a real production system with those requirements the model would be relational.

### SWAPI sync design

On first boot, if the films table is empty, the app syncs from SWAPI automatically. After that, the sync endpoint can be called manually to pick up new films.

The sync is non-destructive: it only inserts films missing from the database (matched by `episode_id`, including soft-deleted ones). It does not overwrite manually edited films or restore soft-deleted ones. Once data enters the system it belongs to the system; SWAPI is the origin, not the authority.

The sync runs on startup instead of on a cron job because a new Star Wars film is released every several years. A periodic job polling for new content provides no real value at that frequency. Running at startup guarantees the catalog is up to date the moment the system is available, with negligible cost since the sync is idempotent.

Internally the sync works in two phases: first it fetches the film list (1 request) and compares `episode_id` values against the database. Only if at least one film is missing does it proceed to fetch the full name map (roughly 15 parallel requests across 5 entity types). This avoids the expensive fetch on the common case where everything is already loaded.

### TEXT[] values are validated as string arrays but not checked against entity tables

The `characters`, `planets`, `species`, `starships` and `vehicles` fields accept any array of strings. This means a request could technically pass invented names. Enforcing referential integrity would require entity tables and full CRUD for each entity type, which is outside the scope of a films management system.

### TypeORM over Prisma

TypeORM aligns better with NestJS's object-oriented model. Entities are decorated classes, repositories are injectable services, and the layered architecture maps naturally to TypeORM's abstractions. Prisma's generated client is excellent for many use cases but its design is less idiomatic in a class-based DI system.

### Layered architecture: controller, service, repository

The controller handles HTTP concerns (parsing, status codes, guards). The service holds business logic. The repository encapsulates all database access. For a CRUD system this separation pays off immediately because it keeps queries out of business logic and makes both layers independently testable. Adding complex queries later does not require touching the service layer.

### Dependency inversion via interfaces and NestJS DI tokens

Services depend on interfaces (`IFilmsRepository`, `IUsersRepository`, `ISwapiClient`) injected via string tokens, not on concrete implementations. This decouples business logic from infrastructure, makes unit testing trivial (swap the implementation for a mock), and allows changing the underlying technology (database, HTTP client) without modifying service code.

Auth-related libraries (`passport-jwt`, `JwtService`) are used directly without an abstraction layer. The tradeoff is intentional: wrapping a well-established library like `passport-jwt` behind an interface adds indirection without meaningful benefit. The abstraction boundary matters at the DB and external API level, not at the library level.

### CryptoService in CommonModule

Password hashing is needed in two places: `AuthService` (login) and `UsersService` (registration). Rather than duplicating the bcrypt dependency or creating a circular module dependency, a `CryptoService` lives in `CommonModule` and is exported for both to consume. If the hashing strategy changes in the future there is exactly one place to update.

### Auth libraries: useful but not locking

`@nestjs/jwt` and `passport-jwt` handle JWT issuance and validation without coupling the system to a hosted auth provider like Supabase Auth or Auth0. JWT tokens are stateless, so there is no token blacklist or server-side session. Logout is handled client-side by discarding the token.

