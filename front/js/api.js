/**
 * api.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Camada de comunicação com o back-end.
 *
 * Todas as chamadas HTTP passam por aqui. O restante da aplicação (app.js)
 * não usa fetch() diretamente — apenas chama as funções exportadas neste
 * módulo. Isso facilita a manutenção: quando o back-end estiver pronto,
 * basta ajustar as rotas aqui, sem tocar na lógica de UI.
 *
 * Convenção de retorno:
 *   { ok: true,  data: <payload> }   — sucesso
 *   { ok: false, erro: <string> }    — falha (HTTP ou rede)
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── CONFIGURAÇÃO BASE ─────────────────────────────────────────────────────────
// Altere apenas esta constante quando o endereço do back-end mudar.
const API_BASE = 'http://localhost:3000';

// ── HELPER INTERNO ────────────────────────────────────────────────────────────

/**
 * Executa um fetch autenticado (ou não) e normaliza a resposta.
 *
 * @param {string}  rota       - Caminho relativo, ex: '/auth/login'
 * @param {string}  metodo     - 'GET' | 'POST' | 'PATCH' | 'DELETE'
 * @param {object}  [corpo]    - Objeto a serializar como JSON no body
 * @param {boolean} [auth]     - Se true, inclui o header Authorization: Bearer <token>
 * @returns {Promise<{ok:boolean, data?:any, erro?:string}>}
 */
async function _requisicao(rota, metodo = 'GET', corpo = null, auth = true) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
        const token = Auth.obterToken();
        if (!token) {
            // Token ausente: força logout sem chamar o back-end
            Auth.limparSessao();
            irPara('tela-login');
            return { ok: false, erro: 'Sessão expirada. Faça login novamente.' };
        }
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const opcoes = { method: metodo, headers };
        if (corpo) opcoes.body = JSON.stringify(corpo);

        const resposta = await fetch(`${API_BASE}${rota}`, opcoes);

        // Token inválido / expirado → back retorna 401
        if (resposta.status === 401) {
            Auth.limparSessao();
            irPara('tela-login');
            return { ok: false, erro: 'Sessão expirada. Faça login novamente.' };
        }

        // Tenta ler o JSON; se o body for vazio (ex: 204 No Content) usa {}
        let dados = {};
        const textoResposta = await resposta.text();
        if (textoResposta) {
            try { dados = JSON.parse(textoResposta); } catch { dados = { mensagem: textoResposta }; }
        }

        if (!resposta.ok) {
            // O back-end pode retornar { message: '...' } ou { error: '...' }
            const mensagem = dados?.message || dados?.error || `Erro ${resposta.status}`;
            return { ok: false, erro: Array.isArray(mensagem) ? mensagem.join('; ') : mensagem };
        }

        return { ok: true, data: dados };

    } catch (erroRede) {
        console.error('[api.js] Erro de rede:', erroRede);
        return { ok: false, erro: 'Não foi possível conectar ao servidor. Verifique sua conexão.' };
    }
}

// ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────────

const ApiAuth = {
    /**
     * POST /auth/login
     * @param {{ login:string, senha:string }} credenciais
     * @returns {Promise<{ok:boolean, data?:{access_token:string, usuario:{nomeCompleto:string, perfil:string}}, erro?:string}>}
     */
    login({ login, senha }) {
        return _requisicao('/auth/login', 'POST', { email: login, password: senha }, false);
    },

    /**
     * POST /auth/cadastro
     * @param {{ nomeCompleto:string, login:string, senha:string, perfil:string }} dados
     */
    cadastrar({ nomeCompleto, login, senha }) {
        return _requisicao('/professor', 'POST', { nome: nomeCompleto, email: login, senha }, false);
    }
};

// ── PROJETOS ──────────────────────────────────────────────────────────────────

const ApiProjetos = {
    /** GET /projetos — lista todos (professor vê todos; aluno vê os seus) */
    listar() {
        return _requisicao('/projeto', 'GET', null, true);
    },

    /**
     * GET /projetos/:id
     * @param {string} id
     */
    buscarPorId(id) {
        return _requisicao(`/projeto/${id}`, 'GET', null, true);
    },

    /**
     * POST /projetos
     * @param {{ nome:string, coordenador:string, campus:string, dataInicio:string,
     *            dataFim:string, cargaHoraria:number, descricao:string,
     *            situacao:string, alunos:string[] }} projeto
     */
    criar(projeto) {
        return _requisicao('/projeto', 'POST', projeto, true);
    },

    /**
     * PATCH /projetos/:id
     * @param {string} id
     * @param {Partial<Projeto>} dadosAtualizados
     */
    atualizar(id, dadosAtualizados) {
        return _requisicao(`/projeto/${id}`, 'PATCH', dadosAtualizados, true);
    },

    /**
     * DELETE /projetos/:id
     * @param {string} id
     */
    remover(id) {
        return _requisicao(`/projeto/${id}`, 'DELETE', null, true);
    },
};

// ── USUÁRIOS ──────────────────────────────────────────────────────────────────

const ApiUsuarios = {
    /** GET /usuario — lista todos os usuários (restrito a professor) */
    listar() {
        return _requisicao('/usuario', 'GET', null, true);
    },

    /** GET /usuario/:id */
    buscarPorId(id) {
        return _requisicao(`/usuario/${id}`, 'GET', null, true);
    },

    /**
     * PATCH /usuario/:id
     * @param {string} id
     * @param {object} dados
     */
    atualizar(id, dados) {
        return _requisicao(`/usuario/${id}`, 'PATCH', dados, true);
    },

    /**
     * DELETE /usuario/:id
     * @param {string} id
     */
    remover(id) {
        return _requisicao(`/usuario/${id}`, 'DELETE', null, true);
    },
};