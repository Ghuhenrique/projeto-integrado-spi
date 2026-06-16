import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateProjetoDto } from './dto/create-projeto.dto';
import { Neo4jService } from 'src/neo4j/neo4j.service';
import { UpdateProjetoDto } from './dto/update-projeto.dto';


@Injectable()
export class ProjetoService {
  constructor(private readonly neo4jService: Neo4jService) { }

  async create(createProjetoDto: CreateProjetoDto) {
    const session = this.neo4jService.getWriteSession();
    const createQuery = `CREATE (p:Projeto {
      id: randomUUID(),
      nome: $nomeProjeto,
      tipo: $tipo
    })

    CREATE (pf:Professor{
      id: randomUUID(),
      nome: $nomeCoordenador,
      email: 'emailteste@email.com',
      senha: 'senha123'
    })

    CREATE (pf)-[:CORDENA]->(p)
    
    WITH p
    UNWIND $alunos AS alunoData
    
    MERGE (part:Aluno)
    ON CREATE SET 
      part.nome = alunoData
    
    CREATE (part)-[:PARTICIPA_DE]->(p)
    
    RETURN p, pf, collect(part) AS participantes`;
    try {
      const response = await session.run(createQuery, createProjetoDto);
      return response[0];
    } catch (error) {
      console.error(error);
      throw error;
    } finally {
      session.close();
    }
  }


  // Listar todos os projetos
  async findAll() {
    const session = this.neo4jService.getReadSession();
    try {
      const result = await session.run(`
      MATCH (p:Projeto)
      RETURN
        p.id AS id,
        p.tipo AS tipo,
        p.nome AS nome,
        p.coordenador AS coordenador,
        p.alunos AS alunos,
        p.emailCoordenador AS emailCoordenador
      `);
      if (result.records.length === 0) {
        return { message: 'Projeto não encontrado' };
      }

      const resposta = result.records.map(projeto =>(
        {
          id: projeto.get('id'),
          tipo: projeto.get('tipo') === 'pesquisa' ? 'Pesquisa' : 'Extensão',
          nome: projeto.get('nome'),
          coordenador: projeto.get('coordenador'),
          alunos: projeto.get('alunos'),
          emailCoordenador: projeto.get('emailCoordenador'),
        }
      ));

      return resposta;

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
        throw new NotFoundException("Projeto não encontrado");
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

  //remove Projeto
  async remove(id: number) {
    const deleteQuery = `MATCH (n:Projeto {id: $id}) DELETE n;`
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

  //Atualizar projeto
  async update(id: number, updateDto: UpdateProjetoDto) {
    const session = this.neo4jService.getWriteSession();
    try {
      
      const query = `MATCH (u:Projeto {id: $userId})
        SET u += $updateData,
            u.updatedAt = datetime()
        RETURN u
      `;
      
      const result = await session.run(query, {
        userId:id,
        updateData:updateDto
      });
      return result.records[0]?.get('u').properties;
    } catch (error) {
      console.log('Erro NeoJ: ',error)
      throw error;
    }finally{
      session.close();
    }
  }
}

