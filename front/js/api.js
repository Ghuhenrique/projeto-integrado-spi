/**
 * api.js — Camada de comunicação com o back-end.
 * Retorno padrão: { ok: true, data } | { ok: false, erro }
 */

const API_BASE = 'http://localhost:3000';

async function _requisicao(rota, metodo = 'GET', corpo = null, auth = true) {
    const headers = { 'Content-Type': 'application/json' };

    if (auth) {
        const token = Auth.obterToken();
        if (!token) {
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

        if (resposta.status === 401) {
            Auth.limparSessao();
            irPara('tela-login');
            return { ok: false, erro: 'Sessão expirada. Faça login novamente.' };
        }

        let dados = {};
        const texto = await resposta.text();
        if (texto) {
            try { dados = JSON.parse(texto); } catch { dados = { mensagem: texto }; }
        }

        if (!resposta.ok) {
            const mensagem = dados?.message || dados?.error || `Erro ${resposta.status}`;
            return { ok: false, erro: Array.isArray(mensagem) ? mensagem.join('; ') : mensagem };
        }

        return { ok: true, data: dados };

    } catch (erroRede) {
        console.error('[api.js] Erro de rede:', erroRede);
        return { ok: false, erro: 'Não foi possível conectar ao servidor.' };
    }
}

// ── AUTENTICAÇÃO ──────────────────────────────────────────────────────────────

const ApiAuth = {
    login({ login, senha }) {
        return _requisicao('/auth/login', 'POST', { email: login, password: senha }, false);
    },
    // Cadastro de professor (sem matrícula)
    cadastrarProfessor({ nomeCompleto, login, senha }) {
        return _requisicao('/professor', 'POST', { nome: nomeCompleto, email: login, senha }, false);
    },
    // Cadastro de aluno (com matrícula)
    cadastrarAluno({ nomeCompleto, matricula, login, senha }) {
        return _requisicao('/aluno', 'POST', { nome: nomeCompleto, matricula, email: login, senha }, false);
    },
    // Mantido para compatibilidade com chamadas existentes no app.js
    cadastrar(dados) {
        if (dados.perfil === 'aluno') {
            return ApiAuth.cadastrarAluno(dados);
        }
        return ApiAuth.cadastrarProfessor(dados);
    },
};

// ── PROJETOS ──────────────────────────────────────────────────────────────────

const ApiProjetos = {
    listar() {
        return _requisicao('/projeto', 'GET', null, true);
    },
    buscarPorId(id) {
        return _requisicao(`/projeto/${id}`, 'GET', null, true);
    },
    meusProjetosAluno() {
        return _requisicao('/projeto/aluno/meus-projetos', 'GET', null, true);
    },
    projetosAtivos() {
        return _requisicao('/projeto/ativos', 'GET', null, true);
    },
    criar(projeto) {
        return _requisicao('/projeto', 'POST', projeto, true);
    },
    atualizar(id, dados) {
        return _requisicao(`/projeto/${id}`, 'PATCH', dados, true);
    },
    remover(id) {
        return _requisicao(`/projeto/${id}`, 'DELETE', null, true);
    },
};

// ── ALUNOS ────────────────────────────────────────────────────────────────────

const ApiAlunos = {
    // Busca por nome parcial ou matrícula exata — usado no modal de busca
    buscar(termo) {
        return _requisicao(`/aluno/buscar?q=${encodeURIComponent(termo)}`, 'GET', null, true);
    },
    listar() {
        return _requisicao('/aluno', 'GET', null, true);
    },
    buscarPorId(id) {
        return _requisicao(`/aluno/${id}`, 'GET', null, true);
    },
    atualizar(id, dados) {
        return _requisicao(`/aluno/${id}`, 'PATCH', dados, true);
    },
    remover(id) {
        return _requisicao(`/aluno/${id}`, 'DELETE', null, true);
    },
};

// ── USUÁRIOS (professor) ──────────────────────────────────────────────────────

const ApiUsuarios = {
    listar() {
        return _requisicao('/professor', 'GET', null, true);
    },
    buscarPorId(id) {
        return _requisicao(`/professor/${id}`, 'GET', null, true);
    },
    atualizar(id, dados) {
        return _requisicao(`/professor/${id}`, 'PATCH', dados, true);
    },
    remover(id) {
        return _requisicao(`/professor/${id}`, 'DELETE', null, true);
    },
};