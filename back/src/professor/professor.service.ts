import { Injectable } from '@nestjs/common';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Injectable()
export class ProfessorService {
  constructor(private readonly neo4jService: Neo4jService){}
  create(createUsuarioDto: CreateProfessorDto) {

    const insertQuery = `
        CREATE (u:User {
          id: randomUUID(),
          name: $name,
          email: $email,
          age: $age,
          city: $city,
          createdAt: datetime()
        })
        RETURN u
      `
      const session = this.neo4jService.getWriteSession();
      try {
        session.run(insertQuery, {
          
        })
      } catch (error) {
        
      }

    return 'This action adds a new usuario';
  }

  async findAll() {
    const session =this.neo4jService.getReadSession();
    try {
      const result = await session.run('MATCH (n:Professor) RETURN elementId(n) AS id, n.nome AS nome LIMIT 25');
      const alunos = result.records.map( r => {
        console.log(r);
        return {
          // curso:r.get('curso'),
          // matr:r.get('matr'),
          nome:r.get('nome'),
          id:r.get('id')
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

  async findOne(id: string) {
    const session = this.neo4jService.getReadSession();

    try {
      const result = await session.run(
        'MATCH (n:Professor) WHERE elementId(n) = $id RETURN n.nome as nome LIMIT 25',
        { id });
      if(result.records.length == 0){
        return null
      }
  
      return {
        nome: result.records[0].get('nome')
      }
      
    } catch (error) {
      console.error('Erro Neo4J: ', error);
      throw error;
    }finally{
      await session.close();
    }
  }

  update(id: number, updateUsuarioDto: UpdateProfessorDto) {
    return `This action updates a #${id} usuario`;
  }

  remove(id: number) {
    return `This action removes a #${id} usuario`;
  }
}
