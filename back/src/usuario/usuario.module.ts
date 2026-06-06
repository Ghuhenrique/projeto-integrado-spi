import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { Neo4jModule } from 'src/neo4j/neo4j.module';

@Module({
  controllers: [UsuarioController],
  providers: [UsuarioService],
  imports:[
    Neo4jModule
  ]
})
export class UsuarioModule {}
