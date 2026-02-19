import { Injectable, Logger, UnauthorizedException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { LoginDto } from './dto/login.dto'
import { AuthResponseDto, UserResponseDto } from './dto/auth-response.dto'
import * as bcrypt from 'bcryptjs'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name)

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto): Promise<AuthResponseDto> {
    this.logger.log(`Intento de login para: ${loginDto.email}`)

    const user = await this.validateUser(loginDto.email, loginDto.password)

    if (!user) {
      this.logger.warn(`Credenciales inválidas para: ${loginDto.email}`)
      throw new UnauthorizedException('Credenciales inválidas')
    }

    const payload = { email: user.email, sub: user.id, role: user.role }
    const token = this.jwtService.sign(payload)

    this.logger.log(`Login exitoso para: ${user.email}`)

    return {
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token,
    }
  }

  async validateUser(email: string, password: string): Promise<UserResponseDto | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return null
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)

    if (!isPasswordValid) {
      return null
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }

  async getUserProfile(userId: string): Promise<UserResponseDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      throw new UnauthorizedException('Usuario no encontrado')
    }

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    }
  }
}
