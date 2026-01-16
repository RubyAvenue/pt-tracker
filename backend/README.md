# PT Tracker API

FastAPI backend for the PT Tracker app with multi-trainer support and Postgres.

## Local dev with Docker

1) Copy `backend/.env.example` to `backend/.env` and set secrets.
2) Build and start the stack:

```bash
docker compose up --build
```

3) Run database migrations (first time):

```bash
docker compose exec api alembic revision --autogenerate -m "init"
docker compose exec api alembic upgrade head
```

4) Create the first admin (bootstrap):

```bash
curl -X POST http://localhost:8787/api/v1/admin/bootstrap \
  -H "Content-Type: application/json" \
  -d '{"bootstrap_token":"<ADMIN_BOOTSTRAP_TOKEN>","email":"trainer@example.com","password":"change-me","display_name":"Trainer One"}'
```

5) Login to get a JWT:

```bash
curl -X POST http://localhost:8787/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"trainer@example.com","password":"change-me"}'
```
