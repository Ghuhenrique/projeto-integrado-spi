# ADD Campos ID, email e senha no professor

```cypher
MATCH (u:Professor)
WHERE u.email IS NULL
SET u.email = toLower(split(u.name, ' ')[0]) + '@ueg.br',
u.senha = '$2b$10$sOYkNys73GcxoCCc9on45.8Kpbqcu2pKJXVRItHLBLXoHPNiOEQH.',
u.id = randomUUID()
RETURN u.id, u.nome
```


# Add ID no projeto

```cypher
MATCH (u:Projeto)
WHERE u.id IS NULL
SET u.id = randomUUID()
RETURN u.id, u.nome
```