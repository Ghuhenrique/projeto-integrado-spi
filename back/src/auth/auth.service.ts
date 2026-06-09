import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ProfessorService } from 'src/professor/professor.service';

@Injectable()
export class AuthService {
  constructor(
    private professorService: ProfessorService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    const user = await this.professorService.validateUser(
      loginDto.email,
      loginDto.password,
    );

    if (!user) {
      throw new UnauthorizedException('login errado: Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    };
  }

  async logout(userId: string) {
    // Por enquanto, apenas retorna sucesso (cliente deve descartar o token)
    return { message: 'Logout realizado com sucesso' };
  }

  async getProfile(userId: string) {
    return this.professorService.findOne(userId);
  }
}