import { Module } from '@nestjs/common';
import { ProjetoService } from './projeto.service';
import { ProjetoController } from './projeto.controller';
import { Neo4jModule } from 'src/neo4j/neo4j.module';

@Module({
  controllers: [ProjetoController],
  providers: [ProjetoService],
  imports:[Neo4jModule]
})
export class ProjetoModule {}
