# TripNow

Plataforma web de planificación de viajes: búsqueda de vuelos baratos, alquiler de coches, atracciones turísticas con horarios, pagos, generador de itinerarios y agentes de IA.

## Tabla de contenidos

- [Stack tecnológico](#stack-tecnológico)
- [Características](#características)
- [Estructura del proyecto](#estructura-del-proyecto)
- [Requisitos](#requisitos)
- [Inicio rápido](#inicio-rápido)
  - [Opción A: Docker Compose](#opción-a-docker-compose-recomendado)
  - [Opción B: instalación local](#opción-b-instalación-local)
- [Variables de entorno](#variables-de-entorno)
- [Scripts disponibles](#scripts-disponibles)
- [API REST](#api-rest)
- [Base de datos](#base-de-datos)
- [Agentes de IA](#agentes-de-ia)
- [Calidad de código](#calidad-de-código)
- [Roadmap](#roadmap)

## Stack tecnológico

| Capa             | Tecnología                                                          |
| ---------------- | ------------------------------------------------------------------- |
| Frontend         | React 18 + TypeScript + Vite + Tailwind CSS + React Query + Zustand |
| Backend          | Node.js 20 + Express + TypeScript + Zod                             |
| Base de datos    | PostgreSQL 16 + Prisma ORM                                          |
| Cache / colas    | Redis 7                                                             |
| Autenticación    | JWT (access + refresh tokens) + bcrypt                              |
| Pagos            | Stripe                                                              |
| IA               | Anthropic Claude / OpenAI                                           |
| APIs de viajes   | Amadeus (vuelos), OpenTripMap / Google Places (atracciones)         |
| Infraestructura  | Docker + Docker Compose                                             |
| Calidad          | ESLint + Prettier + Vitest                                          |

## Características

1. **Búsqueda de vuelos** con integración de Amadeus (extensible a otros proveedores).
2. **Alquiler de coches** con arquitectura de proveedores intercambiables.
3. **Atracciones turísticas** con cache en base de datos y datos de OpenTripMap.
4. **Sistema de pagos** vía Stripe Payment Intents + webhooks.
5. **Generador de itinerarios** que combina destino, duración, ritmo y atracciones cacheadas.
6. **Agentes de IA** especializados:
   - `TRIP_PLANNER` - planificación end-to-end
   - `FLIGHT_HUNTER` - cazador de ofertas de vuelos
   - `LOCAL_GUIDE` - recomendaciones locales
   - `BUDGET_ADVISOR` - asesoría de presupuesto

## Estructura del proyecto

```
TripNow/
├── backend/                  # API Express + TypeScript
│   ├── prisma/
│   │   ├── schema.prisma     # Modelos de base de datos
│   │   └── seed.ts           # Datos semilla (admin user)
│   ├── src/
│   │   ├── config/           # env, logger, database
│   │   ├── middleware/       # auth, validation, error handler
│   │   ├── modules/          # Dominios (auth, flights, cars, attractions, trips, payments, ai)
│   │   │   └── <modulo>/
│   │   │       ├── *.controller.ts
│   │   │       ├── *.service.ts
│   │   │       ├── *.routes.ts
│   │   │       └── *.schema.ts
│   │   ├── routes/           # Router raíz
│   │   ├── utils/            # AppError, asyncHandler
│   │   ├── app.ts            # Configuración de Express
│   │   └── server.ts         # Punto de entrada
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   ├── package.json
│   ├── tsconfig.json
│   └── .eslintrc.cjs
├── frontend/                 # SPA React + TypeScript + Vite
│   ├── src/
│   │   ├── components/       # Layout, ProtectedRoute, etc.
│   │   ├── pages/            # Login, Dashboard, Flights, Cars, ...
│   │   ├── stores/           # Zustand stores
│   │   ├── lib/              # axios client, cn helper
│   │   ├── styles/           # Tailwind base styles
│   │   ├── App.tsx
│   │   └── main.tsx
│   ├── index.html
│   ├── tailwind.config.js
│   ├── vite.config.ts
│   ├── Dockerfile
│   ├── Dockerfile.dev
│   └── package.json
├── docker-compose.yml        # Postgres + Redis + backend + frontend
├── package.json              # npm workspaces + scripts globales
├── .editorconfig
├── .prettierrc
└── README.md
```

## Requisitos

- Node.js **20+**
- npm **10+**
- Docker + Docker Compose (opcional pero recomendado)
- (Opcional) Cuenta de Amadeus, Stripe y Anthropic para usar las integraciones reales

## Inicio rápido

### Opción A: Docker Compose (recomendado)

Levanta todo (Postgres, Redis, backend y frontend) con un único comando:

```bash
# 1. Clona el repo y entra en el directorio
git clone <repo> TripNow && cd TripNow

# 2. Copia las variables de entorno
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Levanta los servicios
docker-compose up -d

# 4. Aplica migraciones y siembra datos
docker-compose exec backend npx prisma migrate dev --name init
docker-compose exec backend npm run prisma:seed
```

- Frontend: <http://localhost:5173>
- Backend API: <http://localhost:4000/api>
- Health check: <http://localhost:4000/api/health>

Usuario demo creado por el seed:

```
admin@tripnow.local / Admin123!
```

### Opción B: instalación local

```bash
# 1. Levanta solo Postgres y Redis
docker-compose up -d postgres redis

# 2. Configura variables
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 3. Instala dependencias (npm workspaces)
npm install

# 4. Migra y siembra la base de datos
npm --workspace backend run prisma:migrate -- --name init
npm --workspace backend run prisma:seed

# 5. Arranca backend + frontend en paralelo
npm run dev
```

## Variables de entorno

### Backend (`backend/.env`)

| Variable                    | Descripción                                        |
| --------------------------- | -------------------------------------------------- |
| `NODE_ENV`                  | `development` \| `test` \| `production`            |
| `PORT`                      | Puerto HTTP (por defecto `4000`)                   |
| `API_PREFIX`                | Prefijo del API (`/api`)                           |
| `CORS_ORIGIN`               | Orígenes permitidos (coma-separados)               |
| `DATABASE_URL`              | URL de PostgreSQL                                  |
| `REDIS_URL`                 | URL de Redis (opcional)                            |
| `JWT_SECRET`                | Secreto para access tokens                         |
| `JWT_REFRESH_SECRET`        | Secreto para refresh tokens                        |
| `JWT_ACCESS_EXPIRES_IN`     | Vida del access token (por defecto `15m`)          |
| `JWT_REFRESH_EXPIRES_IN`    | Vida del refresh token (por defecto `7d`)          |
| `AMADEUS_CLIENT_ID`         | Credenciales Amadeus (vuelos)                      |
| `AMADEUS_CLIENT_SECRET`     |                                                    |
| `CAR_RENTAL_API_KEY`        | Proveedor de alquiler de coches                    |
| `GOOGLE_PLACES_API_KEY`     | Google Places (atracciones)                        |
| `OPENTRIPMAP_API_KEY`       | OpenTripMap (atracciones)                          |
| `STRIPE_SECRET_KEY`         | Stripe                                             |
| `STRIPE_WEBHOOK_SECRET`     |                                                    |
| `ANTHROPIC_API_KEY`         | Para agentes de IA (Claude)                        |
| `OPENAI_API_KEY`            | Para agentes de IA (alternativo)                   |
| `AI_DEFAULT_MODEL`          | Modelo por defecto (`claude-sonnet-4-6`)           |

### Frontend (`frontend/.env`)

| Variable        | Descripción                       |
| --------------- | --------------------------------- |
| `VITE_API_URL`  | URL del backend (`/api` por defecto) |

## Scripts disponibles

### Raíz (workspace)

```bash
npm run dev          # Backend y frontend en paralelo
npm run build        # Build de ambos
npm run lint         # Lint de ambos
npm run format       # Prettier write
npm run docker:up    # docker-compose up -d
npm run docker:down  # docker-compose down
npm run docker:logs  # Sigue los logs de todos los servicios
```

### Backend

```bash
npm run dev              # tsx watch
npm run build            # Compila a dist/
npm start                # Ejecuta dist/server.js
npm run lint             # ESLint
npm run typecheck        # tsc --noEmit
npm test                 # Vitest
npm run prisma:migrate   # Crea/aplica migraciones
npm run prisma:studio    # GUI de Prisma
npm run prisma:seed      # Ejecuta prisma/seed.ts
```

### Frontend

```bash
npm run dev      # Vite dev server (puerto 5173)
npm run build    # Build producción
npm run preview  # Sirve el build localmente
npm run lint     # ESLint
npm run typecheck
```

## API REST

Todas las rutas viven bajo `/api`.

### Auth

- `POST /auth/register` - `{ email, password, firstName, lastName }`
- `POST /auth/login` - `{ email, password }`
- `POST /auth/refresh` - `{ refreshToken }`

Respuesta: `{ accessToken, refreshToken }`. Usa `Authorization: Bearer <accessToken>` para rutas privadas.

### Vuelos

- `GET /flights/search?origin=MAD&destination=BCN&departureDate=2026-06-01&adults=1` (autenticado)

### Coches

- `GET /cars/search?pickupLocation=MAD&pickupDate=...&dropoffDate=...` (autenticado)

### Atracciones

- `GET /attractions?city=Madrid&limit=20` (público)
- `GET /attractions/:id`

### Viajes & itinerarios

- `GET /trips`
- `POST /trips`
- `GET /trips/:id`
- `PATCH /trips/:id`
- `DELETE /trips/:id`
- `POST /trips/:id/itinerary/generate` - `{ interests, pace, travelersCount }`

### Pagos

- `POST /payments/intent` - crea un Payment Intent de Stripe
- `POST /payments/webhook/stripe` - webhook (raw body)

### IA

- `POST /ai/messages` - `{ agentType, conversationId?, message }`
- `GET /ai/conversations`
- `GET /ai/conversations/:id`

## Base de datos

Modelos principales (ver `backend/prisma/schema.prisma`):

- `User` y `RefreshToken`
- `Trip`, `ItineraryItem`
- `Booking`, `Payment`
- `AiConversation`, `AiMessage`
- `Attraction` (cache de proveedores externos)

Comandos útiles:

```bash
# Crear una nueva migración
npm --workspace backend run prisma:migrate -- --name add_x

# Abrir Prisma Studio
npm --workspace backend run prisma:studio
```

## Agentes de IA

Cada agente tiene su propio system prompt (ver `backend/src/modules/ai/agents.ts`).
El servicio por defecto llama a la API de Anthropic con el modelo configurado en `AI_DEFAULT_MODEL`.

Si no configuras `ANTHROPIC_API_KEY`, los endpoints siguen funcionando pero devuelven una respuesta stub. Esto permite desarrollar la UI sin depender de la facturación del proveedor.

## Calidad de código

- **ESLint** y **Prettier** configurados en backend y frontend.
- **TypeScript estricto** (`strict`, `noUnusedLocals`, `noImplicitReturns`).
- **Validación de entrada** con Zod en todas las rutas.
- **Manejo centralizado de errores** con `AppError` y un middleware único.
- **Rate limiting** y **Helmet** activados por defecto.

Recomendado antes de cada commit:

```bash
npm run lint
npm run typecheck   # ejecuta tsc --noEmit en cada workspace
npm test
```

## Roadmap

- [ ] Refresh token rotation con detección de reutilización
- [ ] Soporte multi-divisa y conversión automática
- [ ] Notificaciones por email (cambios de precio en vuelos)
- [ ] Modo offline en la app móvil (PWA)
- [ ] Recomendaciones colaborativas entre viajeros
- [ ] Integración con calendarios (Google / Outlook)

## Licencia

MIT
