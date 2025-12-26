import { PrismaClient } from '@prisma/client'

// Create a single Prisma Client instance
const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

const prisma = globalThis.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== 'production') globalThis.prisma = prisma

// Only test connection during runtime, not during build
if (typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  prisma.$connect()
    .then(() => {
      console.log('✅ Database connected successfully')
    })
    .catch((err: Error) => {
      console.error('❌ Database connection failed:', err.message)
    })
}

export default prisma
