import neo4j from "neo4j-driver";
import fs from "fs/promises";

const CONFIG = {
    uri: "bolt://localhost:7687",
    user: "neo4j",
    password: "senha123",
    database: "neo4j",
    arquivo: "./projetos_neo4j.json"
};

const driver = neo4j.driver(
    CONFIG.uri,
    neo4j.auth.basic(
        CONFIG.user,
        CONFIG.password
    )
);

async function aguardarNeo4j() {

    while (true) {

        try {

            const session = driver.session({
                database: CONFIG.database
            });

            await session.run("RETURN 1");

            await session.close();

            console.log("Neo4j conectado.");

            return;

        } catch {

            console.log("Aguardando Neo4j...");

            await new Promise(
                resolve => setTimeout(resolve, 5000)
            );
        }
    }
}

async function criarConstraints(session) {

    await session.run(`
        CREATE CONSTRAINT projeto_nome IF NOT EXISTS
        FOR (p:Projeto)
        REQUIRE p.nome IS UNIQUE
    `);

    await session.run(`
        CREATE CONSTRAINT professor_nome IF NOT EXISTS
        FOR (p:Professor)
        REQUIRE p.nome IS UNIQUE
    `);

    await session.run(`
        CREATE CONSTRAINT aluno_nome IF NOT EXISTS
        FOR (a:Aluno)
        REQUIRE a.nome IS UNIQUE
    `);

    await session.run(`
        CREATE CONSTRAINT professor_email_obrigatorio IF NOT EXISTS
        FOR (p:Professor)
        REQUIRE p.email IS NOT NULL
    `);

    await session.run(`
        CREATE CONSTRAINT professor_senha_obrigatoria IF NOT EXISTS
        FOR (p:Professor)
        REQUIRE p.senha IS NOT NULL
    `);
}

async function bancoJaPopulado(session) {

    const resultado = await session.run(`
        MATCH (p:Projeto)
        RETURN count(p) AS total
    `);

    const total = Number(
        resultado.records[0].get("total")
    );

    return total > 0;
}

async function importarProjeto(session, projeto) {

    // Cria ou atualiza o projeto
    await session.run(
        `
        MERGE (p:Projeto {
            nome: $nome
        })
        SET p.tipo = $tipo
        `,
        {
            nome: projeto.nome,
            tipo: projeto.tipo
        }
    );

    // Cria ou atualiza o professor coordenador
    await session.run(
        `
        MATCH (p:Projeto {
            nome: $nome
        })

        MERGE (prof:Professor {
            nome: $coordenador
        })

        SET prof.email = $email,
            prof.senha = $senha

        MERGE (prof)-[:COORDENA]->(p)
        `,
        {
            nome: projeto.nome,
            coordenador: projeto.coordenador,
            email: projeto.emailCoordenador,
            senha: projeto.senhaCoordenador
        }
    );

    // Cria os alunos e os vincula ao projeto
    for (const aluno of projeto.alunos) {

        await session.run(
            `
            MATCH (p:Projeto {
                nome: $nome
            })

            MERGE (a:Aluno {
                nome: $aluno
            })

            MERGE (a)-[:PARTICIPA_DE]->(p)
            `,
            {
                nome: projeto.nome,
                aluno
            }
        );
    }
}

async function bootstrap() {

    let session;

    try {

        await aguardarNeo4j();

        session = driver.session({
            database: CONFIG.database
        });

        const arquivo = await fs.readFile(
            CONFIG.arquivo,
            "utf8"
        );

        const dados = JSON.parse(arquivo);

        const totalProjetos = dados.projetos.length;

        console.log(
            `Encontrados ${totalProjetos} projetos para importação.`
        );

        for (const projeto of dados.projetos) {

            try {

                console.log(
                    `Importando: ${projeto.nome}`
                );

                await importarProjeto(
                    session,
                    projeto
                );

                console.log(
                    `Projeto importado: ${projeto.nome}`
                );

            } catch (erro) {

                console.error(
                    `Erro ao importar projeto: ${projeto.nome}`
                );

                console.error(erro);
            }
        }

        // Cria as constraints após a importação,
        // garantindo que todos os professores tenham email e senha
        await criarConstraints(session);

        const resultado = await session.run(`
            MATCH (p:Projeto)
            RETURN count(p) AS total
        `);

        const total = Number(
            resultado.records[0].get("total")
        );

        console.log(
            `Total de projetos cadastrados: ${total}`
        );

    } catch (erro) {

        console.error(
            "Erro geral:"
        );

        console.error(erro);

    } finally {

        if (session) {
            await session.close();
        }

        await driver.close();
    }
}

bootstrap();
