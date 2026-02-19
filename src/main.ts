import { NestFactory } from '@nestjs/core'
import { ValidationPipe } from '@nestjs/common'
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger'
import { AppModule } from './app.module'

const isDevelopment = process.env.NODE_ENV !== 'production'
const isProduction = process.env.NODE_ENV === 'production'

/**
 * Valida que una URL tenga el formato correcto
 */
function isValidUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    return parsed.protocol === 'http:' || parsed.protocol === 'https:'
  } catch {
    return false
  }
}

/**
 * Obtiene y valida una variable de entorno
 */
function getEnvVar(name: string, fallback?: string, required = false): string {
  const value = process.env[name]

  if (!value) {
    if (required && isProduction) {
      throw new Error(
        `${name} no está configurada. ` +
        `Esta variable es obligatoria en producción. ` +
        `Configúrala en las variables de entorno.`
      )
    }
    if (fallback) {
      if (isDevelopment) {
        console.warn(
          `⚠️  ${name} no está configurada. ` +
          `Usando fallback: ${fallback}\n` +
          `Configura esta variable en el archivo .env`
        )
      }
      return fallback
    }
    if (required) {
      throw new Error(`${name} no está configurada y es obligatoria`)
    }
  }

  return value || ''
}

async function bootstrap() {
  // Validar variables críticas
  const databaseUrl = getEnvVar('DATABASE_URL', undefined, true)
  if (!databaseUrl.startsWith('postgresql://')) {
    throw new Error(
      `DATABASE_URL tiene un formato inválido. ` +
      `Debe comenzar con postgresql://`
    )
  }

  const port = parseInt(getEnvVar('PORT', '3001'), 10)
  if (isNaN(port) || port < 1 || port > 65535) {
    throw new Error(`PORT debe ser un número válido entre 1 y 65535`)
  }

  const frontendUrl = getEnvVar('FRONTEND_URL', 'http://localhost:3000')
  if (!isValidUrl(frontendUrl)) {
    throw new Error(
      `FRONTEND_URL tiene un formato inválido: "${frontendUrl}". ` +
      `Debe ser una URL válida que comience con http:// o https://`
    )
  }

  const app = await NestFactory.create(AppModule)
  
  // Validación global con class-validator
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // Elimina propiedades que no están en el DTO
      forbidNonWhitelisted: true, // Lanza error si hay propiedades no permitidas
      transform: true, // Transforma automáticamente los tipos
      transformOptions: {
        enableImplicitConversion: true, // Convierte strings a números automáticamente
      },
    }),
  )
  
  // CORS para permitir requests del frontend
  app.enableCors({
    origin: frontendUrl,
    credentials: true,
  })
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api')
  
  // Configuración de Swagger
  const config = new DocumentBuilder()
    .setTitle('Pastelería Bella API')
    .setDescription('API REST para Pastelería Bella - Sistema de gestión de pastelería')
    .setVersion('1.0')
    .addTag('products', 'Endpoints de productos')
    .addTag('orders', 'Endpoints de pedidos')
    .addTag('auth', 'Endpoints de autenticación')
    .addTag('inventory', 'Endpoints de inventario')
    .addTag('reports', 'Endpoints de reportes')
    .build()
  
  const document = SwaggerModule.createDocument(app, config)
  SwaggerModule.setup('api/docs', app, document)
  
  await app.listen(port)
  console.log(`🚀 API corriendo en http://localhost:${port}/api`)
  console.log(`📡 CORS habilitado para: ${frontendUrl}`)
  console.log(`📚 Swagger disponible en: http://localhost:${port}/api/docs`)
  if (isDevelopment) {
    console.log(`🔧 Entorno: Desarrollo`)
  } else {
    console.log(`🚀 Entorno: Producción`)
  }
}
bootstrap()
