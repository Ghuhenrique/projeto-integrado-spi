import { Injectable } from '@nestjs/common';
import { CreateProfessorDto } from './dto/create-professor.dto';
import { UpdateProfessorDto } from './dto/update-professor.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ProfessorService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(createDto: CreateProfessorDto) {
    const session = this.neo4jService.getWriteSession();
    try {
      const senha = await bcrypt.hash(createDto.senha, 10);
      const result = await session.run(
        `CREATE (u:Professor {
          id: randomUUID(),
          nome: $nome,
          email: $email,
          senha: $senha,
          createdAt: datetime()
        })
        RETURN u.id AS id, u.nome AS nome, u.email AS email`,
        { ...createDto, senha },
      );
      const r = result.records[0];
      return { id: r.get('id'), nome: r.get('nome'), email: r.get('email') };
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
      const result = await session.run(
        'MATCH (n:Professor) RETURN n.id AS id, n.nome AS nome, n.email AS email LIMIT 25',
      );
      return result.records.map(r => ({
        id: r.get('id'),
        nome: r.get('nome'),
        email: r.get('email'),
      }));
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
        'MATCH (n:Professor) WHERE n.id = $id RETURN n.id AS id, n.nome AS nome, n.email AS email',
        { id },
      );
      if (result.records.length === 0) return null;
      const r = result.records[0];
      return { id: r.get('id'), nome: r.get('nome'), email: r.get('email') };
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
      const dados: any = { ...updateData };
      // Hash da nova senha antes de salvar
      if (dados.senha) {
        dados.senha = await bcrypt.hash(dados.senha, 10);
      }
      const result = await session.run(
        `MATCH (u:Professor {id: $userId})
         SET u += $dados, u.updatedAt = datetime()
         RETURN u.id AS id, u.nome AS nome, u.email AS email`,
        { userId, dados },
      );
      const r = result.records[0];
      if (!r) return null;
      return { id: r.get('id'), nome: r.get('nome'), email: r.get('email') };
    } catch (error) {
      console.log('Erro Neo4J: ', error);
      throw error;
    } finally {
      session.close();
    }
  }

  async remove(id: string) {
    const session = this.neo4jService.getWriteSession();
    try {
      await session.run('MATCH (n:Professor {id: $id}) DELETE n', { id });
      return { message: 'Professor removido com sucesso' };
    } catch (error) {
      console.log('Neo4J erro: ', error);
      throw error;
    } finally {
      session.close();
    }
  }

  async findByEmail(email: string) {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run(
        'MATCH (u:Professor {email: $email}) RETURN u',
        { email },
      );
      if (result.records.length === 0) return null;
      return result.records[0].get('u').properties;
    } finally {
      await session.close();
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const senhaCorreta = await bcrypt.compare(password, user.senha);
    if (!senhaCorreta) return null;
    const { senha, ...result } = user;
    return result;
  }
}
