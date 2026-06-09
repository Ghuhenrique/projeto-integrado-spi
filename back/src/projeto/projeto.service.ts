import { Injectable } from '@nestjs/common';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Injectable()
export class ProjetoService {
  constructor(private readonly neo4jService: Neo4jService) { }
  
  create(createProjetoDto: CreateProjetoDto) {
    return 'This action adds a new projeto';
  }

  findAll() {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run('MATCH (n:Professor) RETURN n.id AS id, n.nome AS nome, n.email as email LIMIT 25');
      const alunos = result.records.map(r => {
        console.log(r);
        return {
          email:r.get('email'),
          nome: r.get('nome'),
          id: r.get('id')
        }
      });
      return alunos;
    } catch (error) {
      console.error('Erro Neo4J: ', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} projeto`;
  }

  update(id: number, updateProjetoDto: UpdateProjetoDto) {
    return `This action updates a #${id} projeto`;
  }

  remove(id: number) {
    return `This action removes a #${id} projeto`;
  }
}
