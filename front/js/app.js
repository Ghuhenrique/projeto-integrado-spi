/**
 * app.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Lógica principal de UI da aplicação.
 *
 * Este arquivo NÃO faz chamadas HTTP diretamente — usa ApiAuth, ApiProjetos e
 * ApiUsuarios (definidos em api.js) e gerencia a sessão via Auth (auth.js).
 *
 * Dados em memória (listaProjetos, etc.) são apenas cache local da última
 * resposta da API; não há mais dados hard-coded.
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── CACHE LOCAL ───────────────────────────────────────────────────────────────
// Populados após cada chamada à API. Nunca editados diretamente pelo usuário.
let listaProjetos = [];

// Alunos selecionados no formulário de cadastro/edição de projeto
// Cada item: { id, nome, matricula }
let alunosSelecionados = [];

// Contexto de onde o modal de busca foi aberto: 'cadastro' | 'edicao'
let _modalBuscaAlunoContexto = 'cadastro';

// Estado dos filtros da tela de pesquisa
let filtroSituacaoAtivo = 'todos';

// Estado da modal de detalhes
let projetoAtualModal = null;   // objeto completo do projeto aberto na modal
let idProjetoModal = null;   // id retornado pelo back-end

let menuDropdownAberto = false;

// ── INICIALIZAÇÃO ────────────────────────────────────────────────────────────
async function iniciarAplicacao() {
    // Tenta restaurar sessão salva (ex: F5 na página)
    if (Auth.restaurarSessao()) {
        await _navegarParaDashboard();
    } else {
        await carregarTela('tela-login');
        preCarregarTelas(['modal-cadastro-usuario']);
    }
}

document.addEventListener('DOMContentLoaded', iniciarAplicacao);

// ── NAVEGAÇÃO ────────────────────────────────────────────────────────────────
async function irPara(idTela) {
    await carregarTela(idTela);

    document.querySelectorAll('.tela').forEach(t => t.classList.remove('ativa'));
    document.getElementById(idTela).classList.add('ativa');

    const acoesPosNavegacao = {
        'tela-pesquisa-professor': () => inicializarTelaPesquisa(),
        'tela-dashboard-aluno': () => renderizarProjetosDoAluno(),
        'tela-cadastro-projeto': () => inicializarFormularioProjeto(),
    };

    acoesPosNavegacao[idTela]?.();
    fecharMenuDropdown();
}

async function _navegarParaDashboard() {
    const perfil = Auth.obterPerfil();
    const usuario = Auth.usuarioAtual;

    if (perfil === 'professor') {
        await preCarregarTelas([
            'tela-dashboard-professor',
            'tela-cadastro-projeto',
            'tela-pesquisa-professor',
        ]);
        _preencherBarraProfessor(usuario.nomeCompleto);
        irPara('tela-dashboard-professor');
    } else {
        await preCarregarTelas(['tela-dashboard-aluno', 'tela-detalhe-aluno']);
        _preencherBarraAluno(usuario.nomeCompleto);
        irPara('tela-dashboard-aluno');
    }
}


// ── LOGIN ────────────────────────────────────────────────────────────────────
async function realizarLogin() {
    const login = document.getElementById('input-login').value.trim();
    const senha = document.getElementById('input-senha').value;
    const elementoErro = document.getElementById('erro-login');

    if (!login || !senha) {
        exibirErro(elementoErro, 'Preencha o login e a senha.');
        return;
    }

    _definirCarregando('btn-login', true, 'Entrando...');

    // ── Chamada real ao back-end ──────────────────────────────────────────────
    // TODO: quando o back-end implementar JWT, este retorno incluirá
    //       { access_token, usuario: { nomeCompleto, perfil, id } }
    const resultado = await ApiAuth.login({ login, senha });
    // ─────────────────────────────────────────────────────────────────────────

    _definirCarregando('btn-login', false, 'Acessar o sistema');

    if (!resultado.ok) {
        exibirErro(elementoErro, resultado.erro);
        return;
    }

    elementoErro.classList.remove('visivel');

    const { access_token, user } = resultado.data;
    const usuario = {
        id: user.id,
        nomeCompleto: user.name,
        email: user.email,
        perfil: user.perfil,
    };
    Auth.iniciarSessao(access_token, usuario);

    await _navegarParaDashboard();
}

// ── LOGOUT ────────────────────────────────────────────────────────────────────
// ── MODAL DE PERFIL DO USUÁRIO ────────────────────────────────────────────────

async function abrirModalPerfil() {
    // Garante que o HTML do modal foi injetado no DOM antes de acessar seus elementos
    await carregarTela('modal-perfil-usuario');

    // Aguarda um tick para o DOM processar o HTML recém-injetado
    await new Promise(r => setTimeout(r, 0));

    const usuario = Auth.usuarioAtual;
    if (!usuario) return;

    const perfil = usuario.perfil ?? 'professor';
    const iniciais = gerarIniciais(usuario.nomeCompleto, true) || '?';
    const isProfessor = perfil === 'professor';

    const avatarEl = document.getElementById('modal-perfil-avatar');
    if (!avatarEl) { console.error('modal-perfil-avatar não encontrado no DOM'); return; }
    avatarEl.textContent = iniciais;
    avatarEl.className = `modal-perfil-avatar ${isProfessor ? 'prof' : 'aluno'}`;

    const badgeEl = document.getElementById('modal-perfil-badge');
    badgeEl.textContent = isProfessor ? 'Professor' : 'Aluno';
    badgeEl.className = `badge-perfil ${isProfessor ? 'prof' : 'aluno'}`;

    document.getElementById('modal-perfil-nome').textContent = usuario.nomeCompleto || '—';
    document.getElementById('modal-perfil-email').textContent = usuario.email || '—';

    _mostrarSecaoPerfil('visualizacao');
    document.getElementById('overlay-modal-perfil').classList.add('aberto');
}

function fecharModalPerfil() {
    document.getElementById('overlay-modal-perfil').classList.remove('aberto');
}

function _mostrarSecaoPerfil(secao) {
    // secao: 'visualizacao' | 'edicao' | 'senha' | 'exclusao'
    ['visualizacao', 'edicao', 'senha', 'exclusao'].forEach(s => {
        document.getElementById(`modal-perfil-${s}`).style.display = s === secao ? '' : 'none';
    });
    // Limpa erros ao trocar de seção
    ['vis', 'edit', 'senha', 'excl'].forEach(id => {
        const el = document.getElementById(`modal-perfil-erro-${id}`);
        if (el) el.classList.remove('visivel');
    });
}

function voltarVisualizacaoPerfil() {
    _mostrarSecaoPerfil('visualizacao');
}

// ── EDITAR PERFIL ─────────────────────────────────────────────────────────────
function abrirEdicaoPerfil() {
    const usuario = Auth.usuarioAtual;
    document.getElementById('edit-perfil-nome').value = usuario.nomeCompleto || '';
    document.getElementById('edit-perfil-email').value = usuario.email || '';
    _mostrarSecaoPerfil('edicao');
    document.getElementById('edit-perfil-nome').focus();
}

async function salvarEdicaoPerfil() {
    const nome = document.getElementById('edit-perfil-nome').value.trim();
    const email = document.getElementById('edit-perfil-email').value.trim();
    const erroEl = document.getElementById('modal-perfil-erro-edit');

    if (!nome || !email) {
        erroEl.textContent = 'Preencha nome e e-mail.';
        erroEl.classList.add('visivel'); return;
    }

    _definirCarregando('btn-salvar-perfil', true, 'Salvando...');

    const ehAluno = Auth.obterPerfil() === 'aluno';
    const resultado = ehAluno
        ? await ApiAlunos.atualizar(Auth.usuarioAtual.id, { nome, email })
        : await ApiUsuarios.atualizar(Auth.usuarioAtual.id, { nome, email });

    _definirCarregando('btn-salvar-perfil', false, 'Salvar');

    if (!resultado.ok) {
        erroEl.textContent = resultado.erro;
        erroEl.classList.add('visivel'); return;
    }

    // Atualiza a sessão local
    Auth.usuarioAtual.nomeCompleto = nome;
    Auth.usuarioAtual.email = email;
    sessionStorage.setItem('spi_usuario', JSON.stringify(Auth.usuarioAtual));

    // Atualiza os nomes exibidos na barra de topo
    if (Auth.obterPerfil() === 'professor') _preencherBarraProfessor(nome);
    else _preencherBarraAluno(nome);

    // Volta para visualização com dados atualizados
    document.getElementById('modal-perfil-nome').textContent = nome;
    document.getElementById('modal-perfil-email').textContent = email;
    const iniciais = gerarIniciais(nome, true);
    document.getElementById('modal-perfil-avatar').textContent = iniciais;

    _mostrarSecaoPerfil('visualizacao');
    _exibirToast('Perfil atualizado com sucesso!');
}

// ── ALTERAR SENHA ─────────────────────────────────────────────────────────────
function abrirAlteracaoSenha() {
    ['edit-senha-atual', 'edit-senha-nova', 'edit-senha-confirm'].forEach(id => {
        document.getElementById(id).value = '';
    });
    _mostrarSecaoPerfil('senha');
    document.getElementById('edit-senha-atual').focus();
}

async function salvarAlteracaoSenha() {
    const senhaAtual = document.getElementById('edit-senha-atual').value;
    const senhaNova = document.getElementById('edit-senha-nova').value;
    const senhaConfirm = document.getElementById('edit-senha-confirm').value;
    const erroEl = document.getElementById('modal-perfil-erro-senha');

    if (!senhaAtual || !senhaNova || !senhaConfirm) {
        erroEl.textContent = 'Preencha todos os campos.';
        erroEl.classList.add('visivel'); return;
    }
    if (senhaNova.length < 6) {
        erroEl.textContent = 'A nova senha deve ter no mínimo 6 caracteres.';
        erroEl.classList.add('visivel'); return;
    }
    if (senhaNova !== senhaConfirm) {
        erroEl.textContent = 'A confirmação não coincide com a nova senha.';
        erroEl.classList.add('visivel'); return;
    }

    _definirCarregando('btn-salvar-senha', true, 'Salvando...');

    const ehAlunoSenha = Auth.obterPerfil() === 'aluno';
    const resultado = ehAlunoSenha
        ? await ApiAlunos.atualizar(Auth.usuarioAtual.id, { senhaAtual, senhaNova })
        : await ApiUsuarios.atualizar(Auth.usuarioAtual.id, { senhaAtual, senhaNova });

    _definirCarregando('btn-salvar-senha', false, 'Salvar');

    if (!resultado.ok) {
        erroEl.textContent = resultado.erro;
        erroEl.classList.add('visivel'); return;
    }

    _mostrarSecaoPerfil('visualizacao');
    _exibirToast('Senha alterada com sucesso!');
}

// ── EXCLUIR CONTA ─────────────────────────────────────────────────────────────
function confirmarExclusaoPerfil() {
    _mostrarSecaoPerfil('exclusao');
}

async function excluirContaConfirmado() {
    const erroEl = document.getElementById('modal-perfil-erro-excl');
    _definirCarregando('btn-confirmar-exclusao', true, 'Excluindo...');

    const ehAlunoExcl = Auth.obterPerfil() === 'aluno';
    const resultado = ehAlunoExcl
        ? await ApiAlunos.remover(Auth.usuarioAtual.id)
        : await ApiUsuarios.remover(Auth.usuarioAtual.id);

    _definirCarregando('btn-confirmar-exclusao', false, 'Sim, excluir minha conta');

    if (!resultado.ok) {
        erroEl.textContent = resultado.erro;
        erroEl.classList.add('visivel'); return;
    }

    fecharModalPerfil();
    Auth.limparSessao();
    listaProjetos = [];
    _exibirToast('Conta excluída. Até logo!');
    setTimeout(() => irPara('tela-login'), 1500);
}

function realizarLogout() {
    Auth.limparSessao();
    listaProjetos = [];
    perfilSelecionado = '';

    const inputLogin = document.getElementById('input-login');
    const inputSenha = document.getElementById('input-senha');
    if (inputLogin) inputLogin.value = '';
    if (inputSenha) inputSenha.value = '';

    const cProf = document.getElementById('cartao-professor');
    const cAluno = document.getElementById('cartao-aluno');
    if (cProf) cProf.classList.remove('selecionado');
    if (cAluno) cAluno.classList.remove('selecionado');

    irPara('tela-login');
}

// ── MODAL DE CADASTRO DE USUÁRIO ─────────────────────────────────────────────
async function abrirModalCadastro() {
    await carregarTela('modal-cadastro-usuario');

    ['input-nome-completo', 'input-matricula', 'input-login-novo', 'input-senha-nova', 'input-confirmacao-senha'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.value = '';
    });
    document.getElementById('select-perfil-cadastro').value = '';
    document.getElementById('campo-matricula').style.display = 'none';
    document.getElementById('erro-modal-cadastro').classList.remove('visivel');
    document.getElementById('overlay-modal-cadastro').classList.add('aberto');

    const overlay = document.getElementById('overlay-modal-cadastro');
    if (!overlay.dataset.listenerRegistrado) {
        overlay.addEventListener('click', e => { if (e.target === overlay) fecharModalCadastro(); });
        overlay.dataset.listenerRegistrado = 'true';
    }
}

function fecharModalCadastro() {
    document.getElementById('overlay-modal-cadastro').classList.remove('aberto');
}

async function cadastrarNovoUsuario() {
    const nomeCompleto = document.getElementById('input-nome-completo').value.trim();
    const loginNovo = document.getElementById('input-login-novo').value.trim();
    const senhaNova = document.getElementById('input-senha-nova').value;
    const confirmacaoSenha = document.getElementById('input-confirmacao-senha').value;
    const perfilEscolhido = document.getElementById('select-perfil-cadastro').value;
    const matricula = document.getElementById('input-matricula')?.value.trim();
    const elementoErro = document.getElementById('erro-modal-cadastro');

    if (!nomeCompleto || !loginNovo || !senhaNova || !confirmacaoSenha || !perfilEscolhido) {
        exibirErro(elementoErro, 'Preencha todos os campos!'); return;
    }
    if (perfilEscolhido === 'aluno' && !matricula) {
        exibirErro(elementoErro, 'Informe o número de matrícula!'); return;
    }
    if (senhaNova !== confirmacaoSenha) {
        exibirErro(elementoErro, 'As senhas não coincidem!'); return;
    }

    _definirCarregando('btn-cadastrar-usuario', true, 'Cadastrando...');

    const resultado = await ApiAuth.cadastrar({
        nomeCompleto,
        matricula,
        login: loginNovo,
        senha: senhaNova,
        perfil: perfilEscolhido,
    });

    _definirCarregando('btn-cadastrar-usuario', false, 'Cadastrar');

    if (!resultado.ok) {
        exibirErro(elementoErro, resultado.erro); return;
    }

    fecharModalCadastro();
    document.getElementById('input-login').value = loginNovo;
    document.getElementById('input-senha').value = senhaNova;
    selecionarPerfil(perfilEscolhido);

    _exibirToast(`Cadastro realizado! Bem-vindo(a), ${nomeCompleto}.`);
}

// ── DASHBOARD ALUNO ──────────────────────────────────────────────────────────
async function renderizarProjetosDoAluno() {
    const elementoLista = document.getElementById('lista-projetos-aluno');
    elementoLista.innerHTML = '<div class="carregando">Carregando projetos...</div>';

    // Busca apenas os projetos do aluno logado via JWT
    const resultado = await ApiProjetos.meusProjetosAluno();
    // ─────────────────────────────────────────────────────────────────────────

    if (!resultado.ok) {
        elementoLista.innerHTML = `<div class="mensagem-erro-tela">⚠️ ${resultado.erro}</div>`;
        return;
    }

    listaProjetos = resultado.data;

    document.getElementById('badge-contador-projetos').textContent =
        `📂 ${listaProjetos.length} projeto(s)`;

    if (listaProjetos.length === 0) {
        elementoLista.innerHTML = `
            <div class="mensagem-nenhum-projeto">
                <div class="icone">📭</div>
                <h4>Nenhum projeto encontrado</h4>
                <p>Você ainda não está cadastrado em nenhum projeto. Procure seu professor para mais informações.</p>
            </div>`;
        return;
    }

    elementoLista.innerHTML = listaProjetos.map((projeto, idx) => `
        <div class="cartao-projeto-aluno" onclick="verDetalhesProjetoAluno(${idx})">
            <h4>${projeto.nome}</h4>
            <div class="linha-coordenador">👨‍🏫 Coordenador: <span>${projeto.coordenador}</span></div>
            <div class="quantidade-alunos">👥 ${projeto.alunos?.length ?? 0} aluno(s) participante(s)</div>
            <div class="linha-campus">🏛 Campus: ${projeto.campus || '—'}    |     📚 Projeto de ${projeto.tipo || '—'}</div>
            <button class="btn-ver-detalhes"
                onclick="verDetalhesProjetoAluno(${idx}); event.stopPropagation()">
                Ver detalhes →
            </button>
        </div>`).join('');
}

async function verDetalhesProjetoAluno(indiceProjeto) {
    await carregarTela('tela-detalhe-aluno');
    renderizarDetalhesProjeto(listaProjetos[indiceProjeto], 'area-detalhe-aluno', true);
    irPara('tela-detalhe-aluno');
}

// ── MODAL DE PROJETOS ATIVOS (ALUNO) ─────────────────────────────────────────
async function abrirProjetosAtivos() {
    // Cria overlay se ainda não existir
    let overlay = document.getElementById('overlay-projetos-ativos');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.id = 'overlay-projetos-ativos';
        overlay.className = 'overlay-modal';
        overlay.innerHTML = `
            <div class="modal-projeto" style="max-width:720px">
                <div class="modal-projeto-header">
                    <strong style="font-size:1.05rem">📋 Projetos Ativos</strong>
                    <button class="btn-fechar-modal" onclick="fecharProjetosAtivos()">✕</button>
                </div>
                <div id="conteudo-projetos-ativos" class="modal-projeto-conteudo"></div>
            </div>`;
        overlay.addEventListener('click', e => { if (e.target === overlay) fecharProjetosAtivos(); });
        document.body.appendChild(overlay);
    }

    overlay.classList.add('aberto');
    const conteudo = document.getElementById('conteudo-projetos-ativos');
    conteudo.innerHTML = '<div class="carregando">Carregando projetos ativos...</div>';

    const resultado = await ApiProjetos.projetosAtivos();

    if (!resultado.ok) {
        conteudo.innerHTML = `<div class="mensagem-erro-tela">⚠️ ${resultado.erro}</div>`;
        return;
    }

    // IDs dos projetos que o aluno já participa (listaProjetos contém os projetos do aluno)
    const idsDoAluno = new Set((listaProjetos ?? []).map(p => p.id));
    const projetosOutros = resultado.data.filter(p => !idsDoAluno.has(p.id));

    if (projetosOutros.length === 0) {
        conteudo.innerHTML = `
            <div class="mensagem-nenhum-projeto">
                <div class="icone">🎉</div>
                <h4>Você já participa de todos os projetos ativos!</h4>
            </div>`;
        return;
    }

    conteudo.innerHTML = projetosOutros.map(p => {
        const tipoLabel = p.tipo === 'Pesquisa' ? 'Pesquisa' : 'Extensão';
        return `
            <div class="cartao-resultado-pesquisa">
                <div class="resultado-cabecalho">
                    <div class="resultado-nome">${p.nome}</div>
                    <span class="badge-situacao ativo">🟢 Ativo</span>
                </div>
                <div class="resultado-meta">
                    <span>👨‍🏫 ${p.coordenador || '—'}</span>
                    <span>🏛 ${p.campus || '—'}</span>
                    <span>📚 ${tipoLabel}</span>
                    <span>👥 ${p.alunos?.length ?? 0} aluno(s)</span>
                </div>
                ${p.descricao ? `<div class="resultado-descricao">${p.descricao}</div>` : ''}
            </div>`;
    }).join('');
}

function fecharProjetosAtivos() {
    document.getElementById('overlay-projetos-ativos')?.classList.remove('aberto');
}

// ── FORMULÁRIO DE CADASTRO DE PROJETO ────────────────────────────────────────
function inicializarFormularioProjeto() {
    ['input-nome-projeto', 'input-data-inicio',
        'input-data-fim', 'input-carga-horaria', 'input-descricao'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.value = '';
        });
    document.getElementById('select-campus').value = '';
    document.getElementById('select-tipo-projeto').value = '';
    document.getElementById('radio-ativo').checked = true;

    // Limpa alunos selecionados
    alunosSelecionados = [];
    _renderizarAlunosSelecionados('lista-alunos-selecionados');

    document.getElementById('aviso-sucesso-cadastro')?.classList.remove('visivel');
    document.getElementById('erro-cadastro-projeto')?.classList.remove('visivel');
}

// Renderiza os chips de alunos já adicionados em um container
function _renderizarAlunosSelecionados(containerId) {
    const container = document.getElementById(containerId);
    if (!container) return;
    if (alunosSelecionados.length === 0) {
        container.innerHTML = '<p class="texto-vazio" style="margin:4px 0 8px">Nenhum aluno adicionado</p>';
        return;
    }
    container.innerHTML = alunosSelecionados.map(a => `
        <div class="chip-aluno-selecionado">
            <span>${a.nome} <small>(${a.matricula})</small></span>
            <button onclick="removerAlunoSelecionado('${a.id}')" class="btn-remover-chip">×</button>
        </div>`).join('');
}

function removerAlunoSelecionado(id) {
    alunosSelecionados = alunosSelecionados.filter(a => a.id !== id);
    _renderizarAlunosSelecionados('lista-alunos-selecionados');
    // Atualiza também se modal de edição estiver aberto
    _renderizarAlunosSelecionados('lista-alunos-selecionados-modal');
}

// ── MODAL DE BUSCA DE ALUNO ───────────────────────────────────────────────────
async function abrirModalBuscaAluno(contexto = 'cadastro') {
    _modalBuscaAlunoContexto = contexto;
    await carregarTela('modal-busca-aluno');
    document.getElementById('input-busca-aluno').value = '';
    document.getElementById('resultado-busca-aluno').innerHTML =
        '<div class="busca-placeholder">Digite para pesquisar...</div>';
    document.getElementById('overlay-modal-busca-aluno').classList.add('aberto');
    setTimeout(() => document.getElementById('input-busca-aluno').focus(), 100);
}

function fecharModalBuscaAluno() {
    document.getElementById('overlay-modal-busca-aluno').classList.remove('aberto');
}

let _buscaAlunoTimeout = null;
async function buscarAlunoModal(termo) {
    clearTimeout(_buscaAlunoTimeout);
    const container = document.getElementById('resultado-busca-aluno');

    if (!termo || termo.length < 2) {
        container.innerHTML = '<div class="busca-placeholder">Digite ao menos 2 caracteres...</div>';
        return;
    }

    container.innerHTML = '<div class="busca-placeholder">Buscando...</div>';

    _buscaAlunoTimeout = setTimeout(async () => {
        const resultado = await ApiAlunos.buscar(termo);
        if (!resultado.ok) {
            container.innerHTML = `<div class="busca-placeholder">Erro: ${resultado.erro}</div>`;
            return;
        }
        const alunos = resultado.data;
        if (alunos.length === 0) {
            container.innerHTML = '<div class="busca-placeholder">Nenhum aluno encontrado.</div>';
            return;
        }
        container.innerHTML = alunos.map(a => {
            const jaSelecionado = alunosSelecionados.some(s => s.id === a.id);
            return `
            <div class="item-resultado-busca ${jaSelecionado ? 'ja-adicionado' : ''}"
                 onclick="${jaSelecionado ? '' : `selecionarAlunoModal('${a.id}','${a.nome.replace(/'/g, "\\'")}','${a.matricula}')`}">
                <div class="item-busca-nome">${a.nome}</div>
                <div class="item-busca-meta">Matrícula: ${a.matricula} · ${a.email}</div>
                ${jaSelecionado ? '<span class="tag-adicionado">✓ Adicionado</span>' : ''}
            </div>`;
        }).join('');
    }, 350);
}

function selecionarAlunoModal(id, nome, matricula) {
    if (alunosSelecionados.some(a => a.id === id)) return;
    alunosSelecionados.push({ id, nome, matricula });

    const containerId = _modalBuscaAlunoContexto === 'edicao'
        ? 'lista-alunos-selecionados-modal'
        : 'lista-alunos-selecionados';
    _renderizarAlunosSelecionados(containerId);

    fecharModalBuscaAluno();
}

async function salvarProjeto() {
    const nomeProjeto = document.getElementById('input-nome-projeto').value.trim();
    const campus = document.getElementById('select-campus').value;
    const tipo = document.getElementById('select-tipo-projeto').value;
    const dataInicio = document.getElementById('input-data-inicio').value;
    const dataFim = document.getElementById('input-data-fim').value;
    const cargaHoraria = parseInt(document.getElementById('input-carga-horaria').value) || 0;
    const descricao = document.getElementById('input-descricao').value.trim();
    const situacao = document.querySelector('input[name="situacao-projeto"]:checked').value;
    const alunos = alunosSelecionados.map(a => a.id);

    const erroForm = document.getElementById('erro-cadastro-projeto');

    if (!nomeProjeto || !campus || !tipo) {
        exibirErro(erroForm, 'Preencha ao menos o nome do projeto, o campus e o tipo.');
        return;
    }
    if (dataInicio && dataFim && dataFim < dataInicio) {
        exibirErro(erroForm, 'A data de fim não pode ser anterior à data de início.');
        return;
    }

    erroForm?.classList.remove('visivel');
    _definirCarregando('btn-finalizar-cadastro', true, 'Salvando...');

    const resultado = await ApiProjetos.criar({
        nome: nomeProjeto, campus, tipo,
        dataInicio, dataFim, cargaHoraria, descricao, situacao, alunos,
    });

    _definirCarregando('btn-finalizar-cadastro', false, '✓ Finalizar Cadastro');

    if (!resultado.ok) {
        exibirErro(erroForm, resultado.erro);
        return;
    }

    inicializarFormularioProjeto();
    const aviso = document.getElementById('aviso-sucesso-cadastro');
    aviso.classList.add('visivel');
    setTimeout(() => aviso.classList.remove('visivel'), 3500);
}

// ── TELA DE PESQUISA ─────────────────────────────────────────────────────────
async function inicializarTelaPesquisa() {
    filtroSituacaoAtivo = 'todos';

    document.querySelectorAll('.aba-filtro').forEach(aba => {
        aba.classList.toggle('ativa', aba.dataset.filtroSituacao === 'todos');
    });
    document.getElementById('select-filtro-campus').value = '';

    await _carregarProjetosParaPesquisa();
}

async function _carregarProjetosParaPesquisa() {
    const lista = document.getElementById('lista-projetos-pesquisa');
    lista.innerHTML = '<div class="carregando">Carregando projetos...</div>';

    // ── Chamada real ao back-end ──────────────────────────────────────────────
    const resultado = await ApiProjetos.listar();
    // ─────────────────────────────────────────────────────────────────────────

    if (!resultado.ok) {
        lista.innerHTML = `<div class="mensagem-erro-tela">⚠️ ${resultado.erro}</div>`;
        return;
    }

    listaProjetos = resultado.data;
    popularSelectCoordenadores();
    renderizarListaProjetos();
}

function popularSelectCoordenadores() {
    const coordenadoresUnicos = [...new Set(listaProjetos.map(p => p.coordenador))].sort();
    const select = document.getElementById('select-filtro-coordenador');
    select.innerHTML = '<option value="">Todos os coordenadores</option>'
        + coordenadoresUnicos.map(c => `<option value="${c}">${c}</option>`).join('');
}

function aplicarFiltroSituacao(situacao, abaClicada) {
    filtroSituacaoAtivo = situacao;
    document.querySelectorAll('.aba-filtro').forEach(a => a.classList.remove('ativa'));
    abaClicada.classList.add('ativa');
    renderizarListaProjetos();
}

function renderizarListaProjetos() {
    const campusFiltrado = document.getElementById('select-filtro-campus').value;
    const coordenadorFiltrado = document.getElementById('select-filtro-coordenador').value;
    const tipoFiltrado = document.getElementById('select-filtro-tipo').value;

    const projetosFiltrados = listaProjetos.filter(p => {
        const passaSituacao = filtroSituacaoAtivo === 'todos' || p.situacao === filtroSituacaoAtivo;
        const passaCampus = !campusFiltrado || p.campus === campusFiltrado;
        const passaCoordenador = !coordenadorFiltrado || p.coordenador === coordenadorFiltrado;
        const passaTipo = !tipoFiltrado || p.tipo === tipoFiltrado;
        return passaSituacao && passaCampus && passaCoordenador && passaTipo;
    });

    document.getElementById('contador-resultados').textContent =
        `${projetosFiltrados.length} projeto(s) encontrado(s)`;

    const lista = document.getElementById('lista-projetos-pesquisa');

    if (projetosFiltrados.length === 0) {
        lista.innerHTML = `
            <div class="mensagem-sem-projeto">
                <div class="icone">🔍</div>
                <h4>Nenhum projeto encontrado</h4>
                <p>Tente ajustar os filtros para ver mais resultados.</p>
            </div>`;
        return;
    }

    lista.innerHTML = projetosFiltrados.map(projeto => {
        const badgeSituacao = projeto.situacao === 'ativo'
            ? '<span class="badge-situacao ativo">🟢 Ativo</span>'
            : '<span class="badge-situacao finalizado">⚫ Finalizado</span>';
        const periodoTexto = projeto.dataInicio
            ? `📅 ${formatarData(projeto.dataInicio)}${projeto.dataFim ? ' → ' + formatarData(projeto.dataFim) : ''}`
            : '';
        const cargaTexto = projeto.cargaHoraria ? `⏱ ${projeto.cargaHoraria}h` : '';
        // Usa o id retornado pelo back-end; fallback para índice local
        const idOuIndice = projeto.id ?? listaProjetos.indexOf(projeto);

        return `
            <div class="cartao-resultado-pesquisa">
                <div class="resultado-cabecalho">
                    <div class="resultado-nome">${projeto.nome}</div>
                    ${badgeSituacao}
                </div>
                <div class="resultado-meta">
                    <span>👨‍🏫 ${projeto.coordenador}</span>
                    <span>🏛 ${projeto.campus || '—'}</span>
                    <span>📚 ${projeto.tipo || '—'}</span>
                    ${periodoTexto ? `<span>${periodoTexto}</span>` : ''}
                    ${cargaTexto ? `<span>${cargaTexto}</span>` : ''}
                </div>
                ${projeto.descricao ? `<div class="resultado-descricao">${projeto.descricao}</div>` : ''}
                <div class="resultado-rodape">
                    <span>👥 ${projeto.alunos?.length ?? 0} aluno(s)</span>
                    <span class="link-detalhes" onclick="abrirModalDetalheProjeto('${idOuIndice}')">Ver detalhes →</span>
                </div>
            </div>`;
    }).join('');
}

// ── MODAL DE DETALHES DO PROJETO ─────────────────────────────────────────────
async function abrirModalDetalheProjeto(idOuIndice) {
    // Tenta buscar o projeto atualizado do back-end;
    // se não tiver id real, usa o cache local
    let projeto;
    if (typeof idOuIndice === 'string' && isNaN(Number(idOuIndice))) {
        // É um id real (string neo4j / uuid)
        const resultado = await ApiProjetos.buscarPorId(idOuIndice);
        projeto = resultado.ok ? resultado.data : listaProjetos.find(p => p.id === idOuIndice);
        idProjetoModal = idOuIndice;
    } else {
        // É índice local (modo offline / sem id do back ainda)
        projeto = listaProjetos[Number(idOuIndice)];
        idProjetoModal = projeto?.id ?? idOuIndice;
    }

    if (!projeto) return;

    projetoAtualModal = projeto;
    renderizarModalDetalhe(projeto);

    // Botões de edição apenas visíveis para o coordenador do projeto (professor logado)
    const perfil = Auth.obterPerfil();
    const ehCoordenador = perfil === 'professor' &&
        (projeto.coordenadorId === Auth.usuarioAtual.id);
    document.getElementById('btn-editar-modal').style.display = ehCoordenador ? '' : 'none';
    document.getElementById('btn-excluir-modal').style.display = ehCoordenador ? '' : 'none';
    document.getElementById('btn-salvar-modal').style.display = 'none';
    document.getElementById('btn-cancelar-edicao-modal').style.display = 'none';
    document.getElementById('overlay-modal-projeto').classList.add('aberto');
}

function fecharModalDetalheProjeto() {
    document.getElementById('overlay-modal-projeto').classList.remove('aberto');
    projetoAtualModal = null;
    idProjetoModal = null;
}

function renderizarModalDetalhe(projeto) {
    const badgeSituacao = projeto.situacao === 'ativo'
        ? '<span class="badge-situacao ativo">🟢 Ativo</span>'
        : '<span class="badge-situacao finalizado">⚫ Finalizado</span>';

    const alunosValidos = (projeto.alunos ?? []).filter(a => a && (a.nome || typeof a === 'string'));
    const htmlAlunos = alunosValidos.length > 0
        ? alunosValidos.map(a => {
            // Suporta tanto objeto { id, nome, matricula } quanto string legada
            const nomeAluno = typeof a === 'string' ? a : a.nome;
            const matricula = typeof a === 'object' && a.matricula ? ` <small>(${a.matricula})</small>` : '';
            const iniciais = gerarIniciais(nomeAluno, false);
            return `<div class="chip-aluno"><div class="avatar-chip-aluno">${iniciais}</div><span>${nomeAluno}${matricula}</span></div>`;
        }).join('')
        : '<span class="texto-vazio">Nenhum aluno cadastrado</span>';

    document.getElementById('modal-projeto-conteudo').innerHTML = `
        <div class="modal-proj-cabecalho">
            <div class="nome-projeto-detalhe">${projeto.nome}</div>
            <div class="info-superior">
                ${projeto.campus ? `<div class="campus-detalhe">🏛 ${projeto.campus}</div>` : ''}
                ${badgeSituacao}
            </div>
            <div class="secao-detalhe">
                <div class="rotulo-secao-detalhe">Coordenador</div>
                <div class="chip-coordenador">
                    <div class="avatar-coordenador">${gerarIniciais(projeto.coordenador, true) || 'PR'}</div>
                    <span class="nome-coordenador">${projeto.coordenador}</span>
                </div>
            </div>
        </div>
        <div class="modal-proj-corpo">
            <div class="grade-info-detalhe">
                ${(projeto.dataInicio || projeto.dataFim) ? `
                <div class="secao-detalhe">
                    <div class="rotulo-secao-detalhe">Período</div>
                    <div class="info-periodo">
                        <span>${projeto.dataInicio ? formatarData(projeto.dataInicio) : '—'}</span>
                        <span class="seta-periodo">→</span>
                        <span>${projeto.dataFim ? formatarData(projeto.dataFim) : '—'}</span>
                    </div>
                </div>` : ''}
                ${projeto.cargaHoraria ? `
                <div class="secao-detalhe">
                    <div class="rotulo-secao-detalhe">Carga Horária</div>
                    <div class="valor-destaque">${projeto.cargaHoraria} horas</div>
                </div>` : ''}
            </div>
            ${projeto.descricao ? `
            <div class="secao-detalhe secao-descricao">
                <div class="rotulo-secao-detalhe">Descrição</div>
                <p class="texto-descricao">${projeto.descricao}</p>
            </div>` : ''}
            <div class="secao-detalhe">
                <div class="rotulo-secao-detalhe">Alunos (${projeto.alunos?.length ?? 0})</div>
                <div class="lista-chips-alunos">${htmlAlunos}</div>
            </div>
        </div>`;
}

async function excluirProjetoModal() {
    if (!projetoAtualModal) return;

    const confirmado = confirm(`Tem certeza que deseja excluir o projeto "${projetoAtualModal.nome}"? Esta ação não pode ser desfeita.`);
    if (!confirmado) return;

    _definirCarregando('btn-excluir-modal', true, 'Excluindo...');

    // ── Chamada real ao back-end ──────────────────────────────────────────────
    // TODO: o back-end deve excluir o projeto e retornar 200/204
    const resultado = await ApiProjetos.remover(idProjetoModal);
    // ─────────────────────────────────────────────────────────────────────────

    _definirCarregando('btn-excluir-modal', false, '🗑️ Excluir');

    if (!resultado.ok) {
        // Exibe o erro dentro do conteúdo da modal
        const conteudo = document.getElementById('modal-projeto-conteudo');
        conteudo.insertAdjacentHTML('afterbegin',
            `<div class="mensagem-erro-tela">⚠️ ${resultado.erro}</div>`);
        return;
    }

    fecharModalDetalheProjeto();
    _exibirToast('Projeto excluído com sucesso.');
    await _carregarProjetosParaPesquisa();
}

function ativarModoEdicaoModal() {
    const projeto = projetoAtualModal;
    if (!projeto) return;

    // Carrega alunos atuais do projeto no cache de seleção
    alunosSelecionados = (projeto.alunos ?? [])
        .filter(a => a.id)
        .map(a => ({ id: a.id, nome: a.nome, matricula: a.matricula }));

    const opcoesStatus = ['ativo', 'finalizado'].map(s =>
        `<option value="${s}" ${projeto.situacao === s ? 'selected' : ''}>${s === 'ativo' ? '🟢 Ativo' : '⚫ Finalizado'}</option>`
    ).join('');

    const listaCampus = ['Anápolis', 'Ceres', 'Goianésia', 'Goiânia'];

    const opcoesTipo = ['Pesquisa', 'Extensao'].map(t =>
        `<option value="${t}" ${projeto.tipo === t ? 'selected' : ''}>${t === 'Pesquisa' ? 'Projeto de Pesquisa' : 'Projeto de Extensão'}</option>`
    ).join('');

    document.getElementById('modal-projeto-conteudo').innerHTML = `
        <div class="modal-proj-cabecalho">
            <div class="nome-projeto-detalhe">✏️ Editar Projeto</div>
        </div>
        <div class="modal-proj-corpo modal-form-edicao">
            <div class="campo-form">
                <label>Nome do Projeto</label>
                <input type="text" id="edit-nome" value="${projeto.nome}" placeholder="Nome do projeto">
            </div>
            <div class="campo-form">
                <label>Campus</label>
                <div class="container-select">
                    <select id="edit-campus">
                        <option value="">Selecione o campus</option>
                        ${listaCampus.map(c => `<option value="${c}" ${projeto.campus === c ? 'selected' : ''}>${c}</option>`).join('')}
                    </select>
                </div>
            </div>
            <div class="campo-form">
                <label>Tipo do Projeto</label>
                <div class="container-select">
                    <select id="edit-tipo">${opcoesTipo}</select>
                </div>
            </div>
            <div class="linha-dupla">
                <div class="campo-form">
                    <label>Data de Início</label>
                    <input type="date" id="edit-data-inicio" value="${projeto.dataInicio || ''}">
                </div>
                <div class="campo-form">
                    <label>Data de Fim</label>
                    <input type="date" id="edit-data-fim" value="${projeto.dataFim || ''}">
                </div>
            </div>
            <div class="linha-dupla">
                <div class="campo-form">
                    <label>Carga Horária (h)</label>
                    <input type="number" id="edit-carga" value="${projeto.cargaHoraria || ''}" placeholder="Ex: 120">
                </div>
                <div class="campo-form">
                    <label>Situação</label>
                    <div class="container-select">
                        <select id="edit-situacao">${opcoesStatus}</select>
                    </div>
                </div>
            </div>
            <div class="campo-form">
                <label>Descrição</label>
                <textarea id="edit-descricao" rows="3" placeholder="Descrição do projeto">${projeto.descricao || ''}</textarea>
            </div>
            <div class="campo-form">
                <label>Alunos</label>
                <div id="lista-alunos-selecionados-modal"></div>
                <button class="btn-adicionar-aluno" onclick="abrirModalBuscaAluno('edicao')">+ Adicionar aluno</button>
            </div>
            <div id="erro-edicao-modal" class="mensagem-erro"></div>
        </div>`;

    _renderizarAlunosSelecionados('lista-alunos-selecionados-modal');

    document.getElementById('btn-excluir-modal').style.display = 'none';
    document.getElementById('btn-editar-modal').style.display = 'none';
    document.getElementById('btn-salvar-modal').style.display = '';
    document.getElementById('btn-cancelar-edicao-modal').style.display = '';
}

function cancelarEdicaoModal() {
    alunosSelecionados = [];
    renderizarModalDetalhe(projetoAtualModal);
    const ehCoordenador = Auth.obterPerfil() === 'professor' &&
        projetoAtualModal?.coordenadorId === Auth.usuarioAtual.id;
    document.getElementById('btn-excluir-modal').style.display = ehCoordenador ? '' : 'none';
    document.getElementById('btn-editar-modal').style.display = ehCoordenador ? '' : 'none';
    document.getElementById('btn-salvar-modal').style.display = 'none';
    document.getElementById('btn-cancelar-edicao-modal').style.display = 'none';
}

async function salvarEdicaoModal() {
    const nome = document.getElementById('edit-nome').value.trim();
    const campus = document.getElementById('edit-campus').value;
    const tipo = document.getElementById('edit-tipo').value;
    const dataInicio = document.getElementById('edit-data-inicio').value;
    const dataFim = document.getElementById('edit-data-fim').value;
    const cargaHoraria = parseInt(document.getElementById('edit-carga').value) || 0;
    const situacao = document.getElementById('edit-situacao').value;
    const descricao = document.getElementById('edit-descricao').value.trim();
    const alunos = alunosSelecionados.map(a => a.id);
    const elementoErro = document.getElementById('erro-edicao-modal');

    if (!nome || !campus || !tipo) {
        elementoErro.textContent = 'Preencha ao menos o nome, o campus e o tipo.';
        elementoErro.classList.add('visivel'); return;
    }
    if (dataInicio && dataFim && dataFim < dataInicio) {
        elementoErro.textContent = 'A data de fim não pode ser anterior à data de início.';
        elementoErro.classList.add('visivel'); return;
    }

    _definirCarregando('btn-salvar-modal', true, 'Salvando...');

    const dadosAtualizados = { nome, campus, tipo, dataInicio, dataFim, cargaHoraria, descricao, situacao, alunos };
    const resultado = await ApiProjetos.atualizar(idProjetoModal, dadosAtualizados);

    _definirCarregando('btn-salvar-modal', false, '💾 Salvar alterações');

    if (!resultado.ok) {
        elementoErro.textContent = resultado.erro;
        elementoErro.classList.add('visivel'); return;
    }

    projetoAtualModal = resultado.data ?? dadosAtualizados;
    alunosSelecionados = [];

    renderizarModalDetalhe(projetoAtualModal);
    const ehCoordenadorPos = Auth.obterPerfil() === 'professor' &&
        projetoAtualModal?.coordenadorId === Auth.usuarioAtual.id;
    document.getElementById('btn-excluir-modal').style.display = ehCoordenadorPos ? '' : 'none';
    document.getElementById('btn-editar-modal').style.display = ehCoordenadorPos ? '' : 'none';
    document.getElementById('btn-salvar-modal').style.display = 'none';
    document.getElementById('btn-cancelar-edicao-modal').style.display = 'none';

    await _carregarProjetosParaPesquisa();
}

// ── RENDERIZAÇÃO DO CARTÃO DE DETALHE (ALUNO) ────────────────────────────────
function renderizarDetalhesProjeto(projeto, idAreaDestino, destacarAlunoLogado) {
    if (!projeto) return;
    const iniciaisCoordenador = gerarIniciais(projeto.coordenador, true) || 'PR';
    const nomeAlunoLogado = (Auth.obterPerfil() === 'aluno')
        ? Auth.usuarioAtual.nomeCompleto.toLowerCase() : '';

    const alunosValidos = (projeto.alunos ?? []).filter(a => a && (a.nome || typeof a === 'string'));
    const htmlAlunos = alunosValidos.length > 0
        ? alunosValidos.map(a => {
            const nomeAluno = typeof a === 'string' ? a : a.nome;
            const iniciais = gerarIniciais(nomeAluno, false);
            const ehLogado = destacarAlunoLogado && nomeAluno.toLowerCase() === nomeAlunoLogado;
            return `
                <div class="chip-aluno${ehLogado ? ' destaque' : ''}">
                    <div class="avatar-chip-aluno">${iniciais}</div>
                    <span>${nomeAluno}${ehLogado ? ' <strong>(você)</strong>' : ''}</span>
                </div>`;
        }).join('')
        : '<span class="texto-vazio">Nenhum aluno cadastrado</span>';

    const badgeSituacao = projeto.situacao === 'ativo'
        ? '<span class="badge-situacao ativo">🟢 Ativo</span>'
        : '<span class="badge-situacao finalizado">⚫ Finalizado</span>';

    document.getElementById(idAreaDestino).innerHTML = `
        <div class="cartao-detalhe">
            <div class="cabecalho-detalhe">
                <div class="cabecalho-detalhe-topo">
                    <div class="badge-tipo-projeto">Projeto Acadêmico</div>
                    ${badgeSituacao}
                </div>
                <div class="nome-projeto-detalhe">${projeto.nome}</div>
                ${projeto.campus ? `<div class="campus-detalhe">🏛 ${projeto.campus}</div>` : ''}
            </div>
            <div class="corpo-detalhe">
                <div class="grade-info-detalhe">
                    <div class="secao-detalhe">
                        <div class="rotulo-secao-detalhe">Coordenador</div>
                        <div class="chip-coordenador">
                            <div class="avatar-coordenador">${iniciaisCoordenador}</div>
                            <span class="nome-coordenador">${projeto.coordenador}</span>
                        </div>
                    </div>
                    ${(projeto.dataInicio || projeto.dataFim) ? `
                    <div class="secao-detalhe">
                        <div class="rotulo-secao-detalhe">Período</div>
                        <div class="info-periodo">
                            <span>${projeto.dataInicio ? formatarData(projeto.dataInicio) : '—'}</span>
                            <span class="seta-periodo">→</span>
                            <span>${projeto.dataFim ? formatarData(projeto.dataFim) : '—'}</span>
                        </div>
                    </div>` : ''}
                    ${projeto.cargaHoraria ? `
                    <div class="secao-detalhe">
                        <div class="rotulo-secao-detalhe">Carga Horária</div>
                        <div class="valor-destaque">${projeto.cargaHoraria} horas</div>
                    </div>` : ''}
                </div>
                ${projeto.descricao ? `
                <div class="secao-detalhe secao-descricao">
                    <div class="rotulo-secao-detalhe">Descrição</div>
                    <p class="texto-descricao">${projeto.descricao}</p>
                </div>` : ''}
                <div class="secao-detalhe">
                    <div class="rotulo-secao-detalhe">Alunos (${projeto.alunos?.length ?? 0})</div>
                    <div class="lista-chips-alunos">${htmlAlunos}</div>
                </div>
            </div>
        </div>`;
}

// ── HELPERS DE UI ─────────────────────────────────────────────────────────────

function _preencherBarraProfessor(nomeCompleto) {
    const iniciais = gerarIniciais(nomeCompleto, true);
    ['avatar-professor', 'avatar-cadastro', 'avatar-pesquisa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = iniciais;
    });
    ['nome-usuario-professor', 'nome-usuario-cadastro', 'nome-usuario-pesquisa'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = nomeCompleto;
    });
    const pnp = document.getElementById('primeiro-nome-professor');
    if (pnp) pnp.textContent = nomeCompleto.split(' ')[0];
}

function _preencherBarraAluno(nomeCompleto) {
    const iniciais = gerarIniciais(nomeCompleto, false);
    ['avatar-aluno', 'avatar-detalhe-aluno'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = iniciais;
    });
    ['nome-usuario-aluno', 'nome-usuario-detalhe-aluno'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = nomeCompleto;
    });
}

/**
 * Desabilita/habilita um botão e altera seu texto durante chamadas assíncronas.
 */
function _definirCarregando(idBotao, carregando, textoNormal) {
    const btn = document.getElementById(idBotao);
    if (!btn) return;
    btn.disabled = carregando;
    btn.textContent = carregando ? '⏳ Aguarde...' : textoNormal;
}

/**
 * Exibe um toast de sucesso temporário.
 */
function _exibirToast(mensagem) {
    let toast = document.getElementById('toast-global');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'toast-global';
        toast.className = 'toast-sucesso';
        document.body.appendChild(toast);
    }
    toast.textContent = mensagem;
    toast.classList.add('visivel');
    setTimeout(() => toast.classList.remove('visivel'), 3500);
}

// ── DROPDOWN (legado — mantido para compatibilidade) ──────────────────────────
function alternarMenuProjetos() { }
function fecharMenuDropdown() {
    menuDropdownAberto = false;
    document.getElementById('dropdown-projetos')?.classList.remove('aberto');
}
document.addEventListener('click', evento => {
    const c = document.querySelector('.container-menu-projetos');
    if (c && !c.contains(evento.target)) fecharMenuDropdown();
});
function atualizarListaDropdown() { }

// ── UTILITÁRIOS ───────────────────────────────────────────────────────────────
function formatarData(dataISO) {
    if (!dataISO) return '—';
    const [ano, mes, dia] = dataISO.split('-');
    return `${dia}/${mes}/${ano}`;
}

function gerarIniciais(nomeCompleto, apenasLetrasCapitais) {
    if (!nomeCompleto) return '?';
    const palavras = nomeCompleto.split(' ');
    const filtradas = apenasLetrasCapitais
        ? palavras.filter(p => /^[A-ZÁÉÍÓÚ]/.test(p))
        : palavras;
    return filtradas.slice(0, 2).map(p => p[0]).join('').substring(0, 2).toUpperCase();
}

function exibirErro(elementoErro, mensagem) {
    if (!elementoErro) return;
    elementoErro.textContent = mensagem;
    elementoErro.classList.add('visivel');
}

// ── FUNÇÕES LEGADAS (compatibilidade) ────────────────────────────────────────
// Mantidas para não quebrar chamadas que possam existir em outros lugares
function preencherDadosProfessor(iniciais, nomeCompleto) { _preencherBarraProfessor(nomeCompleto); }

// Mostra/esconde o campo de matrícula no modal de cadastro conforme o perfil
function alternarCampoMatricula(perfil) {
    const campo = document.getElementById('campo-matricula');
    if (campo) campo.style.display = perfil === 'aluno' ? '' : 'none';
}
function preencherDadosAluno(iniciais, nomeCompleto) { _preencherBarraAluno(nomeCompleto); }
function mostrarDetalheProfessor(indiceProjeto) { abrirModalDetalheProjeto(indiceProjeto); }
function abrirDetalhePesquisa(indiceProjeto) { abrirModalDetalheProjeto(indiceProjeto); }