# Pastelería Bella - Backend API

Backend API de Pastelería Bella construido con NestJS.

## Stack Tecnológico

- NestJS 10
- PostgreSQL + Prisma
- TypeScript

## Configuración Inicial

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia el archivo `.env.example` a `.env`:

```bash
cp .env.example .env
```

Edita `.env` y configura los valores según tu entorno:

```env
# URL de conexión a PostgreSQL (OBLIGATORIA)
DATABASE_URL=postgresql://usuario:password@localhost:5432/pasteleria_bella?schema=public

# Puerto del servidor API (opcional, default: 3001)
PORT=3001

# URL del frontend para CORS (opcional, default: http://localhost:3000)
FRONTEND_URL=http://localhost:3000

# Entorno de ejecución (opcional, default: development)
NODE_ENV=development
```

**Variables de entorno:**

- **DATABASE_URL** (OBLIGATORIA): URL de conexión a PostgreSQL. Formato: `postgresql://usuario:password@host:puerto/nombre_db?schema=public`
- **PORT** (opcional): Puerto en el que correrá el servidor. Default: `3001`
- **FRONTEND_URL** (opcional): URL del frontend para configurar CORS. Default: `http://localhost:3000`
- **NODE_ENV** (opcional): Entorno de ejecución. Valores: `development` | `production`. Default: `development`

**Notas importantes:**
- El archivo `.env` está en `.gitignore` y no se subirá a Git
- En desarrollo, algunas variables tienen valores por defecto (con advertencias)
- En producción, `DATABASE_URL` es **obligatoria** y debe estar configurada en tu plataforma de hosting

### 3. Generar cliente Prisma

```bash
npm run db:generate
```

### 4. Ejecutar migraciones

```bash
npm run db:migrate
```

### 5. (Opcional) Ejecutar seed

```bash
npm run db:seed
```

### 6. Iniciar servidor de desarrollo

```bash
npm run dev
```

La API estará disponible en [http://localhost:3001/api](http://localhost:3001/api)

## Scripts Disponibles

- `npm run dev` - Iniciar servidor de desarrollo (watch mode)
- `npm run build` - Construir para producción
- `npm run start` - Iniciar servidor de producción
- `npm run start:prod` - Iniciar servidor compilado
- `npm run db:generate` - Generar cliente Prisma
- `npm run db:migrate` - Ejecutar migraciones
- `npm run db:seed` - Ejecutar seed

## Estructura del Proyecto

```
pasteleria-api/
├── src/
│   ├── products/     # Módulo de productos
│   ├── prisma/       # Servicio y módulo Prisma
│   ├── app.module.ts # Módulo principal
│   └── main.ts       # Punto de entrada
├── prisma/
│   ├── schema.prisma # Esquema de base de datos
│   └── migrations/   # Migraciones
└── [config files]
```

## Endpoints Disponibles

### Products

- `GET /api/products` - Obtener todos los productos activos

## Notas

- El backend usa Prisma como ORM
- CORS está configurado para permitir requests desde `http://localhost:3000`
- Todas las rutas tienen el prefijo `/api`
