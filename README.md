# Conexa Films API

REST API built with NestJS for Star Wars film management.

## Running with Docker

```bash
docker-compose up --build
```

API: `http://localhost:3000`
Swagger: `http://localhost:3000/api`

On first boot, if the films table is empty, the app automatically syncs all Star Wars films from SWAPI. No manual step needed.

## Running locally

1. Copy `.env.example` to `.env` and fill in the values.
2. Start a PostgreSQL instance.
3. Run:

```bash
npm install
npm run start:dev
```

## Architecture decisions

- `synchronize: true` is enabled in all environments. In a production system, TypeORM migrations would be used instead.
- Admin users must be created directly in the database. The registration endpoint (`POST /users`) always creates users with role `regular`.
- JWT tokens are stateless. Logout must be handled client-side by discarding the token.
- `TEXT[]` columns (`characters`, `planets`, `species`, `starships`, `vehicles`) store arrays of names. Values are validated as `string[]` but are not checked against external entity tables — the system manages films, not Star Wars entities. Note: `@Column('text', { array: true })` maps to a native PostgreSQL `TEXT[]` column. Do not use `simple-array`, which stores a comma-separated string instead.

## Testing

```bash
npm test
```

Unit tests use Vitest with mocked repositories and SWAPI client. No running database is required for unit tests.
