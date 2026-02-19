import { UserRole } from '@prisma/client'

export class UserResponseDto {
  id: string
  email: string
  role: UserRole
  createdAt: Date
  updatedAt: Date
}

export class AuthResponseDto {
  user: UserResponseDto
  token: string
}
