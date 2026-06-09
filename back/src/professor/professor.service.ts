import { Injectable } from '@nestjs/common';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import * as bcrypt from 'bcrypt';


@Injectable()
export class ProfessorService {
  constructor(private readonly neo4jService: Neo4jService) { }
  async create(createDto: CreateProfessorDto) {

    const insertQuery = `
        CREATE (u:Professor {
          id: randomUUID(),
          nome: $nome,
          email: $email,
          senha: $senha,
          createdAt: datetime()
        })
        RETURN u
      `
    let prof;
    const session = this.neo4jService.getWriteSession();
    try {
      const senha = await bcrypt.hash(createDto.senha, 10);
      prof = await session.run(insertQuery, {...createDto, senha})
    } catch (error) {
      console.error('Erro Neo4J: ', error);
      throw error;
    } finally {
      session.close();
    }
  }

  async findAll() {
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

  async findOne(id: string) {
    const session = this.neo4jService.getReadSession();

    try {
      const result = await session.run(
        'MATCH (n:Professor) WHERE n.id = $id RETURN n.nome as nome, n.email as email LIMIT 25',
        { id });
      if (result.records.length == 0) {
        return null
      }

      return {
        nome: result.records[0].get('nome')
      }

    } catch (error) {
      console.error('Erro Neo4J: ', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async update(userId: string, updateData: UpdateProfessorDto) {
    const session = this.neo4jService.getWriteSession();
    try {
      
      const query = `MATCH (u:Professor {id: $userId})
        SET u += $updateData,
            u.updatedAt = datetime()
        RETURN u
      `;
      
      const result = await session.run(query, {
        userId,
        updateData
      });
      return result.records[0]?.get('u').properties;
    } catch (error) {
      console.log('Erro NeoJ: ',error)
      throw error;
    }finally{
      session.close();
    }
  }

  async remove(id: string) {
    const deleteQuery = `MATCH (n:Professor {id: $id}) DELETE n;`
    const session = this.neo4jService.getWriteSession();
    try {
      await session.run(deleteQuery, {id})
    } catch (error) {
      console.log('Neo4J erro: ', error);
      throw error;
    }finally{
      session.close()
    }
  }

  async findByEmail(email: string) {
    const query = `
      MATCH (u:Professor {email: $email})
      RETURN u
    `;

    const records = await this.neo4jService.getReadSession().run(query, { email });
    
    if (records.records.length === 0) return null;
    
    return records.records[0]?.get('u').properties;
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.findByEmail(email);
    
    if(!user) return null;

    if (user && await bcrypt.compare(password, user.senha)) {
      const { password, ...result } = user;
      return result;
    }
    
  }

}
