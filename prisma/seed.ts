import { PrismaClient, UserRole } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.log('🌱 Iniciando seed...')

  // Crear usuario SUPER_ADMIN
  const adminPassword = 'admin123' // Cambiar en producción
  const hashedPassword = await bcrypt.hash(adminPassword, 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@pasteleriabella.cl' },
    update: {},
    create: {
      email: 'admin@pasteleriabella.cl',
      passwordHash: hashedPassword,
      role: UserRole.SUPER_ADMIN,
    },
  })

  console.log('✅ Usuario admin creado:', admin.email)

  // Crear productos de ejemplo
  const productos = [
    {
      name: 'Torta de Chocolate',
      description: 'Deliciosa torta de chocolate con crema y frutos secos',
      priceCLP: 15990,
      stock: 10,
      imageUrl: null,
      active: true,
    },
    {
      name: 'Torta de Fresa',
      description: 'Torta fresca con fresas naturales y crema batida',
      priceCLP: 17990,
      stock: 8,
      imageUrl: null,
      active: true,
    },
    {
      name: 'Torta de Limón',
      description: 'Torta de limón con merengue italiano',
      priceCLP: 14990,
      stock: 12,
      imageUrl: null,
      active: true,
    },
    {
      name: 'Torta de Tres Leches',
      description: 'Torta tradicional de tres leches con canela',
      priceCLP: 16990,
      stock: 15,
      imageUrl: null,
      active: true,
    },
    {
      name: 'Torta de Red Velvet',
      description: 'Torta de terciopelo rojo con queso crema',
      priceCLP: 19990,
      stock: 6,
      imageUrl: null,
      active: true,
    },
    {
      name: 'Torta de Zanahoria',
      description: 'Torta de zanahoria con nueces y crema de queso',
      priceCLP: 13990,
      stock: 9,
      imageUrl: null,
      active: true,
    },
    {
      name: 'Torta de Manzana',
      description: 'Torta de manzana con canela y avena',
      priceCLP: 12990,
      stock: 11,
      imageUrl: null,
      active: true,
    },
    {
      name: 'Torta de Coco',
      description: 'Torta de coco con merengue y coco rallado',
      priceCLP: 14990,
      stock: 7,
      imageUrl: null,
      active: true,
    },
  ]

  // Eliminar productos existentes para evitar duplicados
  await prisma.product.deleteMany({})

  for (const producto of productos) {
    const created = await prisma.product.create({
      data: producto,
    })
    console.log(`✅ Producto creado: ${created.name} - $${created.priceCLP.toLocaleString('es-CL')}`)
  }

  console.log('🎉 Seed completado!')
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
