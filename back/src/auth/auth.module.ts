// auth/auth.module.ts
import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { ProfessorModule } from '../professor/professor.module';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    ProfessorModule,
    PassportModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('JWT_SECRET');
        const expiresIn = configService.get<string>('JWT_EXPIRES_IN') || '7d';
        
        if (!secret) {
          throw new Error('JWT_SECRET não configurado no ambiente');
        }
        
        return {
          secret,
          signOptions: {
            expiresIn: expiresIn as any, // Type assertion para resolver o tipo
          },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy],
  exports: [AuthService],
})
export class AuthModule {}