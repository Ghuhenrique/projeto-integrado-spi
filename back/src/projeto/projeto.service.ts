import { Injectable } from '@nestjs/common';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { UpdateProjetoDto } from './dto/update-projeto.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';

@Injectable()
export class ProjetoService {
  constructor(private readonly neo4jService: Neo4jService) { }

  async create(createProjetoDto: CreateProjetoDto, professorId: string) {
    const session = this.neo4jService.getWriteSession();
    try {
      // Cria o projeto e vincula ao professor
      const result = await session.run(
        `MATCH (prof:Professor {id: $professorId})
         CREATE (p:Projeto {
           id: randomUUID(),
           nome: $nome,
           campus: $campus,
           tipo: $tipo,
           situacao: $situacao,
           dataInicio: $dataInicio,
           dataFim: $dataFim,
           cargaHoraria: $cargaHoraria,
           descricao: $descricao,
           createdAt: datetime()
         })
         CREATE (prof)-[:COORDENA]->(p)
         RETURN p.id AS id, p.nome AS nome, p.campus AS campus, p.tipo AS tipo,
                p.situacao AS situacao, p.dataInicio AS dataInicio,
                p.dataFim AS dataFim, p.cargaHoraria AS cargaHoraria,
                p.descricao AS descricao, prof.nome AS coordenador`,
        {
          professorId,
          nome: createProjetoDto.nome,
          campus: createProjetoDto.campus,
          tipo: createProjetoDto.tipo,
          situacao: createProjetoDto.situacao,
          dataInicio: createProjetoDto.dataInicio ?? '',
          dataFim: createProjetoDto.dataFim ?? '',
          cargaHoraria: createProjetoDto.cargaHoraria ?? 0,
          descricao: createProjetoDto.descricao ?? '',
        },
      );

      if (result.records.length === 0) {
        throw new Error('Professor não encontrado para vincular ao projeto');
      }

      const projetoId = result.records[0].get('id');

      // Vincula os alunos enviados (array de ids)
      if (createProjetoDto.alunos && createProjetoDto.alunos.length > 0) {
        await this._vincularAlunos(session, projetoId, createProjetoDto.alunos);
      }

      return this._buscarComAlunos(projetoId);
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
        `MATCH (prof:Professor)-[:COORDENA]->(p:Projeto)
         OPTIONAL MATCH (a:Aluno)-[:PARTICIPA]->(p)
         RETURN p.id AS id, p.nome AS nome, p.campus AS campus, p.tipo AS tipo,
                p.situacao AS situacao, p.dataInicio AS dataInicio,
                p.dataFim AS dataFim, p.cargaHoraria AS cargaHoraria,
                p.descricao AS descricao, prof.nome AS coordenador,
                prof.id AS coordenadorId,
                collect({ id: a.id, nome: a.nome, matricula: a.matricula }) AS alunos`,
      );
      return result.records.map(r => this._mapRecord(r));
    } finally {
      await session.close();
    }
  }

  async findOne(id: string) {
    return this._buscarComAlunos(id);
  }

  async update(id: string, dto: UpdateProjetoDto, professorId: string) {
    const session = this.neo4jService.getWriteSession();
    try {
      const { alunos, ...campos } = dto as any;
      const dados: any = { ...campos };

      const validacao = await session.run(
        `MATCH (prof:Professor {id: $professorId})-[:COORDENA]->(p:Projeto {id: $id})
        RETURN p`,
        {
          id,
          professorId,
        },
      );

      if (validacao.records.length === 0) {
        throw new Error(
          'Você não possui permissão para editar este projeto',
        );
      }

      const result = await session.run(
        `MATCH (p:Projeto {id: $id})
         SET p += $dados, p.updatedAt = datetime()
         RETURN p.id AS id`,
        { id, dados },
      );

      if (result.records.length === 0) return null;

      // Se vieram alunos, recria os vínculos
      if (alunos !== undefined) {
        // Remove todos os vínculos atuais
        await session.run(
          'MATCH (a:Aluno)-[r:PARTICIPA]->(p:Projeto {id: $id}) DELETE r',
          { id },
        );
        if (alunos.length > 0) {
          await this._vincularAlunos(session, id, alunos);
        }
      }

      return this._buscarComAlunos(id);
    } finally {
      await session.close();
    }
  }

  async remove(id: string, professorId: string,) {
    const session = this.neo4jService.getWriteSession();
    try {
      const validacao = await session.run(
        `MATCH (prof:Professor {id: $professorId})-[:COORDENA]->(p:Projeto {id: $id})
        RETURN p`,
        {
          id,
          professorId,
        },
      );

      if (validacao.records.length === 0) {
        throw new Error(
          'Você não possui permissão para excluir este projeto',
        );
      }
      await session.run('MATCH (p:Projeto {id: $id}) DETACH DELETE p', { id });
      return { message: 'Projeto removido com sucesso' };
    } finally {
      await session.close();
    }
  }

  async buscarProjetosAluno(alunoId: string) {
    const session = this.neo4jService.getReadSession();

    try {
      const result = await session.run(
        `
      MATCH (a:Aluno {id: $alunoId})-[:PARTICIPA]->(p:Projeto)
      OPTIONAL MATCH (prof:Professor)-[:COORDENA]->(p)
      OPTIONAL MATCH (membro:Aluno)-[:PARTICIPA]->(p)

      RETURN
        p.id AS id,
        p.nome AS nome,
        p.campus AS campus,
        p.tipo AS tipo,
        p.situacao AS situacao,
        p.dataInicio AS dataInicio,
        p.dataFim AS dataFim,
        p.cargaHoraria AS cargaHoraria,
        p.descricao AS descricao,
        prof.nome AS coordenador,
        prof.id AS coordenadorId,
        collect({ id: membro.id, nome: membro.nome, matricula: membro.matricula }) AS alunos
      `,
        { alunoId },
      );

      return result.records.map((record) =>
        this._mapRecord(record),
      );
    } finally {
      await session.close();
    }
  }

  async buscarProjetosAtivos() {
    const session = this.neo4jService.getReadSession();

    try {
      const result = await session.run(
        `
      MATCH (p:Projeto)
      WHERE p.situacao = 'ativo'

      OPTIONAL MATCH (prof:Professor)-[:COORDENA]->(p)
      OPTIONAL MATCH (membro:Aluno)-[:PARTICIPA]->(p)

      RETURN
        p.id AS id,
        p.nome AS nome,
        p.campus AS campus,
        p.tipo AS tipo,
        p.situacao AS situacao,
        p.dataInicio AS dataInicio,
        p.dataFim AS dataFim,
        p.cargaHoraria AS cargaHoraria,
        p.descricao AS descricao,
        prof.nome AS coordenador,
        prof.id AS coordenadorId,
        collect({ id: membro.id, nome: membro.nome, matricula: membro.matricula }) AS alunos
      `,
      );

      return result.records.map((record) =>
        this._mapRecord(record),
      );
    } finally {
      await session.close();
    }
  }

  private async _vincularAlunos(session: any, projetoId: string, alunoIds: string[]) {
    await session.run(
      `MATCH (p:Projeto {id: $projetoId})
       UNWIND $alunoIds AS alunoId
       MATCH (a:Aluno {id: alunoId})
       MERGE (a)-[:PARTICIPA]->(p)`,
      { projetoId, alunoIds },
    );
  }

  private async _buscarComAlunos(id: string) {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run(
        `MATCH (prof:Professor)-[:COORDENA]->(p:Projeto {id: $id})
         OPTIONAL MATCH (a:Aluno)-[:PARTICIPA]->(p)
         RETURN p.id AS id, p.nome AS nome, p.campus AS campus, p.tipo AS tipo,
                p.situacao AS situacao, p.dataInicio AS dataInicio,
                p.dataFim AS dataFim, p.cargaHoraria AS cargaHoraria,
                p.descricao AS descricao, prof.nome AS coordenador,
                prof.id AS coordenadorId,
                collect({ id: a.id, nome: a.nome, matricula: a.matricula }) AS alunos`,
        { id },
      );
      if (result.records.length === 0) return null;
      return this._mapRecord(result.records[0]);
    } finally {
      await session.close();
    }
  }

  private _mapRecord(r: any) {
    const alunosRaw: any[] = r.get('alunos') ?? [];
    // Filtra entradas vazias (OPTIONAL MATCH sem alunos gera { id: null })
    const alunos = alunosRaw.filter(a => a.id !== null);
    return {
      id: r.get('id'),
      nome: r.get('nome'),
      campus: r.get('campus'),
      tipo: r.get('tipo'),
      situacao: r.get('situacao'),
      dataInicio: r.get('dataInicio'),
      dataFim: r.get('dataFim'),
      cargaHoraria: r.get('cargaHoraria'),
      descricao: r.get('descricao'),
      coordenador: r.get('coordenador'),
      coordenadorId: r.get('coordenadorId') ?? null,
      alunos,
    };
  }
}