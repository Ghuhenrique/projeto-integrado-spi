import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { LoginDto } from './dto/login.dto';
import { ProfessorService } from 'src/professor/professor.service';
import { AlunoService } from 'src/aluno/aluno.service';

@Injectable()
export class AuthService {
  constructor(
    private professorService: ProfessorService,
    private alunoService: AlunoService,
    private jwtService: JwtService,
  ) {}

  async login(loginDto: LoginDto) {
    // Tenta professor primeiro, depois aluno
    let user = await this.professorService.validateUser(loginDto.email, loginDto.password);
    let perfil = 'professor';

    if (!user) {
      user = await this.alunoService.validateUser(loginDto.email, loginDto.password);
      perfil = 'aluno';
    }

    if (!user) {
      throw new UnauthorizedException('Credenciais inválidas');
    }

    const payload = { sub: user.id, email: user.email, perfil };

    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.nome,
        email: user.email,
        perfil,
        // matrícula só existe para aluno
        matricula: user.matricula ?? undefined,
      },
    };
  }

  async logout(userId: string) {
    return { message: 'Logout realizado com sucesso' };
  }

  async getProfile(userId: string) {
    return this.professorService.findOne(userId);
  }
}
