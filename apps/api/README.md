# CCPF API

Backend oficial da CCPF Platform.

---

## Stack

- NestJS
- Prisma
- PostgreSQL
- JWT
- Swagger

---

## Estrutura

```
src/

application/
domain/
infrastructure/
presentation/
```

---

## Executar

```bash
npm install

npm run start:dev
```

---

## Docker

```bash
docker compose up api
```

---

## Prisma

```bash
npx prisma migrate dev

npx prisma generate

npx prisma studio
```