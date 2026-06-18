import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { ProfessorService } from 'src/professor/professor.service';
import { AlunoService } from 'src/aluno/aluno.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private profService: ProfessorService,
    private alunoService: AlunoService,
  ) {
    const jwtSecret = configService.get<string>('JWT_SECRET');
    if (!jwtSecret) throw new Error('JWT_SECRET não está definido no arquivo .env');
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: jwtSecret,
    });
  }

  async validate(payload: any) {
    let user: any = null;

    if (payload.perfil === 'aluno') {
      user = await this.alunoService.findOne(payload.sub);
    } else {
      user = await this.profService.findOne(payload.sub);
    }

    if (!user) throw new UnauthorizedException('Usuário não encontrado');

    return { id: user.id, nome: user.nome, email: user.email, perfil: payload.perfil };
  }
}
