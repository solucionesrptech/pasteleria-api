import { NestFactory } from '@nestjs/core'
import { AppModule } from './app.module'

async function bootstrap() {
  const app = await NestFactory.create(AppModule)
  
  // CORS para permitir requests del frontend
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
  
  // Prefijo global para todas las rutas
  app.setGlobalPrefix('api')
  
  const port = process.env.PORT || 3001
  await app.listen(port)
  console.log(`🚀 API corriendo en http://localhost:${port}/api`)
}
bootstrap()
