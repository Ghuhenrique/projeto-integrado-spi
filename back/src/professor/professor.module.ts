import { Module } from '@nestjs/common';
import { Neo4jModule } from 'src/neo4j/neo4j.module';
import { ProfessorController } from './professor.controller';
import { ProfessorService } from './professor.service';

@Module({
  controllers: [ProfessorController],
  providers: [ProfessorService],
  imports:[
    Neo4jModule
  ]
})
export class ProfessorModule {}
