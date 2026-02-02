import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
  return bcrypt.compare(password, hashedPassword)
}

export async function createUser(email: string, nombre: string, password: string) {
  const hashedPassword = await hashPassword(password)
  return prisma.usuario.create({
    data: {
      email,
      nombre,
      password: hashedPassword,
    },
  })
}

export async function getUserByEmail(email: string) {
  return prisma.usuario.findUnique({
    where: { email },
  })
}
