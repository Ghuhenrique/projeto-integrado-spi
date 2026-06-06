import { Injectable } from '@nestjs/common';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Injectable()
export class UsuarioService {
  constructor(private readonly neo4jService: Neo4jService){}
  create(createUsuarioDto: CreateUsuarioDto) {
    return 'This action adds a new usuario';
  }

  async findAll() {
    const session =this.neo4jService.getSession();
    try {
      const result = await session.run('MATCH (n:Aluno) RETURN n.curso as curso, n.matr as matr, n.nome as nome LIMIT 25');
      const alunos = result.records.map( r => {
        console.log(r);
        return {
          curso:r.get('curso'),
          matr:r.get('matr'),
          nome:r.get('nome')
        }
      });
      return alunos;
    } catch (error) {
      console.error('Erro Neo4J: ', error);
      throw error;
    }finally{
      await session.close();
    }
  }

  findOne(id: number) {
    return `This action returns a #${id} usuario`;
  }

  update(id: number, updateUsuarioDto: UpdateUsuarioDto) {
    return `This action updates a #${id} usuario`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }
}
