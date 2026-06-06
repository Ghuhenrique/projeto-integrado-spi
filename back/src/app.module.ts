import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { UsuarioModule } from './usuario/usuario.module';
import { ConfigModule } from '@nestjs/config';
import { Neo4jModule } from './neo4j/neo4j.module';

@Module({
  imports: [
    UsuarioModule, 
    ConfigModule.forRoot( {isGlobal: true,}),
    Neo4jModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}

