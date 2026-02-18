import { Injectable, OnModuleInit, Logger, OnModuleDestroy } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name)

  async onModuleInit() {
    try {
      this.logger.log('Conectando a la base de datos...')
      await this.$connect()
      this.logger.log('Conexión a la base de datos establecida')
    } catch (error) {
      this.logger.error('Error al conectar con la base de datos:', error)
      this.logger.error('Verifica que DATABASE_URL esté configurado correctamente en .env')
      throw error
    }
  }

  async onModuleDestroy() {
    await this.$disconnect()
    this.logger.log('Desconectado de la base de datos')
  }
}
