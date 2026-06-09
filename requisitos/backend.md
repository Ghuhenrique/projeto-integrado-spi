# Requisitos do Back-End
# Obrigatórios

[x] Ter no mínimo 3 recursos (ex: usuários, posts, comentários)
[] Implementar CRUD completo para pelo menos 2 dos recursos
[x] Ter pelo menos um relacionamento 1:N entre dois recursos
[x] Conexão com banco para persistência de dados
[x] Criar middlewares de validação para as rotas POST e PUT
[x] Implementar middleware de log registrando método, URL, status e tempo
[x] Usar variáveis de ambiente com .env para configurações sensíveis 
[] Implementar autenticação com JWT – rotas de cadastro e login
[] Proteger com middleware de autenticação as rotas que exigem login
[] Armazenar senhas com hash bcrypt

# Requisitos do Front-End

[x] Desenvolvido em HTML, CSS ou JavaScript
[x] Consumir a API
[x] Ter tela de cadastro e login de usuário
[x] Exibir, criar, editar e remover os recursos principais da aplicação
[x] Armazenar o token JWT após o login e enviá-lo nas requisições autenticadas
[x] Tratar e exibir mensagens de erro retornadas pela API
[x] Redirecionar para a tela de login quando o token expirar ou for inválido

# Relatório
[] relatório deve ser entregue em PDF e conter:
[] Capa com nome do projeto, integrantes e data
[] Descrição da aplicação e do problema que resolve
[] Diagrama dos recursos e relacionamentos do banco de dados
[] Listagem dos endpoints com método, rota e descrição de cada um