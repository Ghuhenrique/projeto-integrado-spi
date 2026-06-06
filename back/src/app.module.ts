import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuarioModule } from './usuario/usuario.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [UsuarioModule, ConfigModule.forRoot( {isGlobal: true,})],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

