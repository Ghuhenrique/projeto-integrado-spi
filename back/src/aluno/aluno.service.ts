import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { CreateAlunoDto } from './dto/create-aluno.dto';
import { UpdateAlunoDto } from './dto/update-aluno.dto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AlunoService {
  constructor(private readonly neo4jService: Neo4jService) {}

  async create(dto: CreateAlunoDto) {
    // Verifica se matrícula já existe
    const existing = await this.findByMatricula(dto.matricula);
    if (existing) {
      throw new ConflictException('Matrícula já cadastrada no sistema');
    }

    const session = this.neo4jService.getWriteSession();
    try {
      const senha = await bcrypt.hash(dto.senha, 10);
      const result = await session.run(
        `CREATE (a:Aluno {
          id: randomUUID(),
          nome: $nome,
          matricula: $matricula,
          email: $email,
          senha: $senha,
          createdAt: datetime()
        })
        RETURN a.id AS id, a.nome AS nome, a.matricula AS matricula, a.email AS email`,
        { ...dto, senha },
      );
      const r = result.records[0];
      return { id: r.get('id'), nome: r.get('nome'), matricula: r.get('matricula'), email: r.get('email') };
    } catch (error) {
      console.error('Erro Neo4J:', error);
      throw error;
    } finally {
      await session.close();
    }
  }

  async findAll() {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run(
        'MATCH (a:Aluno) RETURN a.id AS id, a.nome AS nome, a.matricula AS matricula, a.email AS email',
      );
      return result.records.map(r => ({
        id: r.get('id'),
        nome: r.get('nome'),
        matricula: r.get('matricula'),
        email: r.get('email'),
      }));
    } finally {
      await session.close();
    }
  }

  async findOne(id: string) {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run(
        'MATCH (a:Aluno {id: $id}) RETURN a.id AS id, a.nome AS nome, a.matricula AS matricula, a.email AS email',
        { id },
      );
      if (result.records.length === 0) return null;
      const r = result.records[0];
      return { id: r.get('id'), nome: r.get('nome'), matricula: r.get('matricula'), email: r.get('email') };
    } finally {
      await session.close();
    }
  }

  // Busca por nome (parcial) ou matrícula exata — usado no modal de busca
  async search(termo: string) {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run(
        `MATCH (a:Aluno)
         WHERE toLower(a.nome) CONTAINS toLower($termo)
            OR a.matricula = $termo
         RETURN a.id AS id, a.nome AS nome, a.matricula AS matricula, a.email AS email
         LIMIT 20`,
        { termo },
      );
      return result.records.map(r => ({
        id: r.get('id'),
        nome: r.get('nome'),
        matricula: r.get('matricula'),
        email: r.get('email'),
      }));
    } finally {
      await session.close();
    }
  }

  async update(id: string, dto: UpdateAlunoDto) {
    const session = this.neo4jService.getWriteSession();
    try {
      const dados: any = { ...dto };
      if (dados.senha) {
        dados.senha = await bcrypt.hash(dados.senha, 10);
      }
      const result = await session.run(
        `MATCH (a:Aluno {id: $id})
         SET a += $dados, a.updatedAt = datetime()
         RETURN a.id AS id, a.nome AS nome, a.matricula AS matricula, a.email AS email`,
        { id, dados },
      );
      if (result.records.length === 0) throw new NotFoundException('Aluno não encontrado');
      const r = result.records[0];
      return { id: r.get('id'), nome: r.get('nome'), matricula: r.get('matricula'), email: r.get('email') };
    } finally {
      await session.close();
    }
  }

  async remove(id: string) {
    const session = this.neo4jService.getWriteSession();
    try {
      await session.run('MATCH (a:Aluno {id: $id}) DETACH DELETE a', { id });
      return { message: 'Aluno removido com sucesso' };
    } finally {
      await session.close();
    }
  }

  async findByEmail(email: string) {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run('MATCH (a:Aluno {email: $email}) RETURN a', { email });
      if (result.records.length === 0) return null;
      return result.records[0].get('a').properties;
    } finally {
      await session.close();
    }
  }

  async findByMatricula(matricula: string) {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run('MATCH (a:Aluno {matricula: $matricula}) RETURN a', { matricula });
      if (result.records.length === 0) return null;
      return result.records[0].get('a').properties;
    } finally {
      await session.close();
    }
  }

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.findByEmail(email);
    if (!user) return null;
    const ok = await bcrypt.compare(password, user.senha);
    if (!ok) return null;
    const { senha, ...result } = user;
    return result;
  }
}
