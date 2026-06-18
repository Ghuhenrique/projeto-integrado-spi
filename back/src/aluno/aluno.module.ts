import { Module } from '@nestjs/common';
import { AlunoController } from './aluno.controller';
import { AlunoService } from './aluno.service';
import { Neo4jModule } from 'src/neo4j/neo4j.module';

@Module({
  imports: [Neo4jModule],
  controllers: [AlunoController],
  providers: [AlunoService],
  exports: [AlunoService],
})
export class AlunoModule {}
