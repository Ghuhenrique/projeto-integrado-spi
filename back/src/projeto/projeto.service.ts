import { Injectable } from '@nestjs/common';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';


@Injectable()
export class ProjetoService {
  constructor(private readonly neo4jService: Neo4jService) { }
  
  create(createProjetoDto: CreateProjetoDto) {
    return 'This action adds a new projeto';
  }
  

// Listar todos os projetos
 async findAll() {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run(
         `
      MATCH (p:Projeto {id: $id})
      RETURN
        p.id AS id,
        p.tipo AS tipo,
        p.nome AS nome,
        p.coordenador AS coordenador,
        p.alunos AS alunos,
        p.senhaCoordenador AS senhaCoordenador,
        p.emailCoordenador AS emailCoordenador
      `,
      { },
    );
    if (result.records.length === 0) {
      return {
        message: 'Projeto não encontrado',
      };
    }

    const projeto = result.records[0];

    return {
      id: projeto.get('id'),
      tipo: projeto.get('pesquisa ou extenso') === 'pesquisa' ? 'Pesquisa' : 'Extensão',
      nome: projeto.get('descricao'),
      coordenador: projeto.get('coordenador'),
      alunos: projeto.get('alunos'),
      senhaCoordenador: projeto.get('senhaCoordenador'),
      emailCoordenador: projeto.get('emailCoordenador'),

    };

  } catch (error) {
    console.error('Erro Neo4J:', error);
    throw error;
  } finally {
    await session.close();
  }
  }

  //Buscar projetos por id

  async findOne(id: string) {
  const session = this.neo4jService.getReadSession();

  try {
    const result = await session.run(
      `
      MATCH (p:Projeto {id: $id})
      RETURN
        p.id AS id,
        p.tipo AS tipo,
        p.nome AS nome,
        p.coordenador AS coordenador,
        p.alunos AS alunos,
        p.senhaCoordenador AS senhaCoordenador,
        p.emailCoordenador AS emailCoordenador
      `,
      { id },
    );

    if (result.records.length === 0) {
      return { message: 'Projeto não encontrado' };
    }

    const projeto = result.records[0];

    return {
      id: projeto.get('id'),
      tipo: projeto.get('tipo'),
      nome: projeto.get('nome'),
      coordenador: projeto.get('coordenador'),
      alunos: projeto.get('alunos'),
      senhaCoordenador: projeto.get('senhaCoordenador'),
      emailCoordenador: projeto.get('emailCoordenador'),
    };
  } catch (error) {
    console.error('Erro Neo4J:', error);
    throw error;
  } finally {
    await session.close();
  }
  }
}

//Atualizar projeto
