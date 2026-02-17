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

### 2. Configurar base de datos

Crea un archivo `.env` en la raíz del proyecto:

```env
DATABASE_URL=postgresql://usuario:password@localhost:5432/pasteleria_bella?schema=public
PORT=3001
FRONTEND_URL=http://localhost:3000
```

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
