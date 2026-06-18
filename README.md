# Projeto Neo4j

Banco de dados Neo4j executando via Docker Compose.

## Como executar

```bash
docker compose up -d
```

## Carregar informaçoes da seed(dados)
```bash
node seed.js 
```

## Como acessar

http://localhost:7474

Usuário: neo4j
Senha: senha123

## Aapagando dados antigos do neo4j (APAGA TODOS OS DADOS)
## Caso o neo4j esteja com dados antigos, utilize:

MATCH (n)
DETACH DELETE n;


