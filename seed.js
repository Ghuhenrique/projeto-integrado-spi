/**
 * seed.js
 * Popula o banco via API REST do back-end.
 * Rode com: node seed.js
 */

const API = 'http://localhost:3000';

const dados = {
  "projetos": [
    {
      "tipo": "Extensao",
      "nome": "Interlocução entre a universidade e a educação de jovens e adultos",
      "coordenador": "Nilda Gonçalves Vieira Santiago",
      "alunos": ["Ana Cristina Miguel da Silva","Anna Clara Cardoso Lima","Byanka Lívia Ferreira Santos","Carla Patrícia Elias Silva","Elaine Martins da Silva","Evelen Lorrana Pinheiro Costa","Franciely Silva da Costa Santana","Gabriella Lauany Gondim de Castro","Geovanna Rosa","Igor Cipriano Gomes","Izabella Lauane Messias de Jesus","Kaique Maciel Brito Cabral","Kelly Cristina dos Santos Raposo","Maria Clara Aparecida da Silva Soares","Maria Clara Souza","Maria Eduarda de Faria Silva","Nayra Gonçalves Campos","Tainá Pereira Lira Kuster","Tatianne Isabela Leandro e Silva","Thainara Morais Silva","Zyon Ferraz Salgado"],
      "emailCoordenador": "nilda@ueg.br",
      "senhaCoordenador": "senha123"
    },
    {
      "tipo": "Pesquisa",
      "nome": "Lei nº 14.945/2024: avanços e desafios para o Ensino Médio ofertado nas redes estaduais de ensino",
      "coordenador": "Luís Duarte Vieira",
      "alunos": ["Keyde Taisa da Silva","Carla Patrícia Elias Silva","Felipe da Silva Rabelo","Higor Gabriel de Siqueira Mendes","Fernanda Campos Oliveira"],
      "emailCoordenador": "luis.duarte@ueg.br",
      "senhaCoordenador": "senha123"
    },
    {
      "tipo": "Extensao",
      "nome": "Cirandas em defesa da democracia, da proteção, do projeto de vida, da ecologia e da vida das mulheres",
      "coordenador": "Luís Duarte Vieira",
      "alunos": ["Anna Luisa Mayer Silva Borges","Daniele Candido Ribeiro","Felipe Da Silva Rabelo","Francisca Maria Teixeira Da Silva","Giulia Vitoria Pereira","Isabelle Lemes Fernandes","Jaqueline Campelo Da Silva Passos","Luciene Alves Da Silva Ribeiro","Pabline Cristina Souza Siqueira","Vitoria Maria Diniz Pereira"],
      "emailCoordenador": "luis.duarte@ueg.br",
      "senhaCoordenador": "senha123"
    },
    {
      "tipo": "Extensao",
      "nome": "Capacitação em desenvolvimento",
      "coordenador": "Natan de Souza Rodrigues",
      "alunos": ["Andreia Aparecida Ribeiro Mendes","Caio Campos Justino","Jhonatan Leite Malaquias","Josélia Mendes Almeida","Keyde Taisa Da Silva","Loiane De Souza Vicente","Samuel Gomes Dos Santos"],
      "emailCoordenador": "natan.rodrigues@ueg.br",
      "senhaCoordenador": "senha123"
    },
    {
      "tipo": "Extensao",
      "nome": "Inteligência Artificial Generativa",
      "coordenador": "Natan de Souza Rodrigues",
      "alunos": ["Caio Campos Justino","Eliesio Xavier Junior","Gustavo Borges Sousa","Gustavo Henrique Costa Pinto","Izaque Gabriel Monteiro","Jhonatan Leite Malaquias","Keyde Taisa Da Silva","Luan Santos Cavalcante","Luis Felipe Morais","Maria Alice Santos Sousa","Matheus Henrique Do Couto","Peterson Silva Ribeiro","Samuel Gomes Dos Santos","Victor Acacio Camargo Pacheco","Ygor Emanoel B De Sousa"],
      "emailCoordenador": "natan.rodrigues@ueg.br",
      "senhaCoordenador": "senha123"
    },
    {
      "tipo": "Pesquisa",
      "nome": "Avaliação de Avatars no processo de validação de requisitos para crianças surdas",
      "coordenador": "Lucas Rodrigues de Oliveira",
      "alunos": ["Victor Hugo Ribeiro Barro","Luis Felipe Morais","Eliesio Xavier Júnior","Jhonatan Leite Malaquias","Pablo Dias Delmondes","Diego Rodrigues Inocencio","Pedro Henrique Quixabeira de Oliveira Teles","Vitória Maria Diniz Pereira","Gustavo Henrique Costa Pinto","Isabelle Lemes Fernandes","Danielle Candido Ribeiro"],
      "emailCoordenador": "lucas.rodrigues@ueg.br",
      "senhaCoordenador": "senha123"
    },
    {
      "tipo": "Extensao",
      "nome": "Educação e tecnologia: caminhos para a programação web",
      "coordenador": "Ricardo Bruno Oses de Oliveira",
      "alunos": ["Bartolomeu Spegiorin Gusella","Caio Campos Justino","Guilherme Pereira De Morais","Gustavo Henrique Costa Pinto","Keyde Taisa Da Silva","Luis Felipe Morais","Victor Acacio Camargo Pacheco"],
      "emailCoordenador": "ricardo.oliveira@ueg.br",
      "senhaCoordenador": "senha123"
    }
  ]
};

// ── Helpers ───────────────────────────────────────────────────────────────────

async function post(rota, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${rota}`, { method: 'POST', headers, body: JSON.stringify(body) });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

async function get(rota, token) {
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  const res = await fetch(`${API}${rota}`, { headers });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

// Gera matrícula: primeiros 6 chars do nome sem espaço + 4 dígitos aleatórios
function gerarMatricula(nome) {
  const base = nome.replace(/\s/g, '').substring(0, 6).toUpperCase();
  const num = String(Math.floor(1000 + Math.random() * 9000));
  return `${base}${num}`;
}

// Email: primeiro nome em lowercase + @gmail.com
function gerarEmail(nomeCompleto) {
  const partes = nomeCompleto.trim().split(/\s+/);

  return `${partes[0]}.${partes[partes.length - 1]}`
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    + '@gmail.com';
}

// ── Seed ──────────────────────────────────────────────────────────────────────

async function seed() {
  console.log('🚀 Iniciando seed do banco de dados...\n');

  // Cache para não duplicar professores e alunos
  const professoresCadastrados = {}; // email → token
  const alunosCadastrados = {};      // nomeNormalizado → id

  // Normaliza nome para comparação (ignora capitalização e acentos)
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();

  for (const projeto of dados.projetos) {

    // ── 1. Cadastrar professor (se ainda não existir) ──────────────────────
    let tokenProfessor = professoresCadastrados[projeto.emailCoordenador];

    if (!tokenProfessor) {
      const resCad = await post('/professor', {
        nome: projeto.coordenador,
        email: projeto.emailCoordenador,
        senha: projeto.senhaCoordenador,
      });

      if (resCad.status === 201 || resCad.status === 200) {
        console.log(`✅ Professor criado: ${projeto.coordenador}`);
      } else {
        console.log(`⚠️  Professor já existe ou erro: ${projeto.coordenador} (${resCad.status})`);
      }

      // Login para obter token
      const resLogin = await post('/auth/login', {
        email: projeto.emailCoordenador,
        password: projeto.senhaCoordenador,
      });

      if (!resLogin.data.access_token) {
        console.error(`❌ Falha no login do professor ${projeto.coordenador}`);
        continue;
      }

      tokenProfessor = resLogin.data.access_token;
      professoresCadastrados[projeto.emailCoordenador] = tokenProfessor;
    }

    // ── 2. Cadastrar alunos (se ainda não existir) e coletar IDs ──────────
    const idsAlunos = [];

    for (const nomeAluno of projeto.alunos) {
      const chave = norm(nomeAluno);

      if (alunosCadastrados[chave]) {
        idsAlunos.push(alunosCadastrados[chave]);
        continue;
      }

      const email = gerarEmail(nomeAluno);
      const matricula = gerarMatricula(nomeAluno);

      const resCad = await post('/aluno', {
        nome: nomeAluno,
        matricula,
        email,
        senha: '123456',
      });

      if (resCad.status === 201 || resCad.status === 200) {
        const id = resCad.data.id;
        alunosCadastrados[chave] = id;
        idsAlunos.push(id);
        console.log(`  👤 Aluno criado: ${nomeAluno} (mat: ${matricula}, email: ${email})`);
      } else if (resCad.status === 409) {
        // Já existe — busca pelo email
        const resBusca = await get(`/aluno/buscar?q=${encodeURIComponent(nomeAluno.split(' ')[0])}`, tokenProfessor);
        const encontrado = resBusca.data?.find(a => norm(a.nome) === chave);
        if (encontrado) {
          alunosCadastrados[chave] = encontrado.id;
          idsAlunos.push(encontrado.id);
          console.log(`  ♻️  Aluno já existe: ${nomeAluno}`);
        }
      } else {
        console.log(`  ❌ Erro ao criar aluno ${nomeAluno}: ${JSON.stringify(resCad.data)}`);
      }
    }

    // ── 3. Criar o projeto vinculado ao professor ──────────────────────────
    const resProjeto = await post('/projeto', {
      nome: projeto.nome,
      campus: 'Goianésia',
      situacao: 'ativo',
      descricao: ``,
      tipo: `${projeto.tipo}`,
      alunos: idsAlunos,
    }, tokenProfessor);

    if (resProjeto.status === 201 || resProjeto.status === 200) {
      console.log(`\n📁 Projeto criado: "${projeto.nome}"`);
      console.log(`   Coordenador: ${projeto.coordenador}`);
      console.log(`   Alunos vinculados: ${idsAlunos.length}\n`);
    } else {
      console.error(`\n❌ Erro ao criar projeto "${projeto.nome}":`, resProjeto.data);
    }
  }

  console.log('\n✅ Seed concluído!');
  console.log('\n📋 Resumo de acesso:');
  for (const [email] of Object.entries(professoresCadastrados)) {
    console.log(`   Professor: ${email} / senha: senha123`);
  }
  console.log(`   Alunos: email = primeiroNome@gmail.com / senha: 123456`);
}

seed().catch(console.error);
