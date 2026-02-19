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

  // Crear usuario PRODUCCION
  const productionPassword = 'password123'
  const hashedProductionPassword = await bcrypt.hash(productionPassword, 10)

  const productionUser = await prisma.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      passwordHash: hashedProductionPassword,
      role: UserRole.PRODUCCION,
    },
  })

  console.log('✅ Usuario de producción creado:', productionUser.email)

  // Crear productos de ejemplo
  const productos = [
    {
      name: 'Torta de Chocolate',
      description: 'Deliciosa torta de chocolate con crema y frutos secos',
      priceCLP: 15990,
      stock: 10,
      imageUrl: '/images/categorias/Velvet.JPG', // (si no tienes chocolate aún, usa una temporal)
      active: true,
    },
    {
      name: 'Torta de Fresa',
      description: 'Torta fresca con fresas naturales y crema batida',
      priceCLP: 17990,
      stock: 10,
      imageUrl: '/images/categorias/Manzana.JPG', // temporal si falta fresa
      active: true,
    },
    {
      name: 'Torta de Limón',
      description: 'Torta de limón con merengue italiano',
      priceCLP: 14990,
      stock: 10,
      imageUrl: '/images/categorias/limon.jpg',
      active: true,
    },
    {
      name: 'Torta de Tres Leches',
      description: 'Torta tradicional de tres leches con canela',
      priceCLP: 16990,
      stock: 10,
      imageUrl: '/images/categorias/leches.JPG',
      active: true,
    },
    {
      name: 'Torta de Red Velvet',
      description: 'Torta de terciopelo rojo con queso crema',
      priceCLP: 19990,
      stock: 10,
      imageUrl: '/images/categorias/Velvet.JPG',
      active: true,
    },
    {
      name: 'Torta de Zanahoria',
      description: 'Torta de zanahoria con nueces y crema de queso',
      priceCLP: 13990,
      stock: 10,
      imageUrl: '/images/categorias/Zanahoria.JPG',
      active: true,
    },
    {
      name: 'Torta de Manzana',
      description: 'Torta de manzana con canela y avena',
      priceCLP: 12990,
      stock: 10,
      imageUrl: '/images/categorias/Manzana.JPG',
      active: true,
    },
    {
      name: 'Torta de Coco',
      description: 'Torta de coco con merengue y coco rallado',
      priceCLP: 14990,
      stock: 10,
      imageUrl: '/images/categorias/coco.JPG',
      active: true,
    },
  ]
  

  // Crear o actualizar productos (usar upsert para evitar duplicados)
  for (const producto of productos) {
    // Buscar producto existente por nombre
    const existing = await prisma.product.findFirst({
      where: { name: producto.name },
    })

    if (existing) {
      // Actualizar producto existente
      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          ...producto,
        },
      })
      console.log(`✅ Producto actualizado: ${updated.name} - $${updated.priceCLP.toLocaleString('es-CL')}`)
    } else {
      // Crear nuevo producto
      const created = await prisma.product.create({
        data: producto,
      })
      console.log(`✅ Producto creado: ${created.name} - $${created.priceCLP.toLocaleString('es-CL')}`)
    }
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
