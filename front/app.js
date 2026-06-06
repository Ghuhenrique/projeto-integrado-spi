// ── DADOS INICIAIS ──────────────────────────────────────────────────────────
let listaUsuarios = [
    { login: 'prof1', senha: '1234', nomeCompleto: 'Prof. Dr. João Silva', perfil: 'professor' },
    { login: 'aluno1', senha: '1234', nomeCompleto: 'Lucas Marques', perfil: 'aluno' },
    { login: 'aluno2', senha: '1234', nomeCompleto: 'Fernanda Costa', perfil: 'aluno' },
    { login: 'aluno3', senha: '1234', nomeCompleto: 'Camila Borges', perfil: 'aluno' }
];

let listaProjetos = [
    { nome: 'Biodiversidade do Cerrado Goiano', coordenador: 'Profa. Dra. Ana Faria', alunos: ['Lucas Marques', 'Fernanda Costa', 'Roberto Alves'] },
    { nome: 'TIC na Educação Básica', coordenador: 'Prof. Dr. Márcio Rezende', alunos: ['Camila Borges', 'Thiago Nunes'] },
    { nome: 'Robótica Educacional', coordenador: 'Prof. Dr. João Silva', alunos: ['Lucas Marques', 'Pedro Henrique', 'Sara Lima'] }
];

let usuarioAtual = null;      // usuário logado na sessão
let perfilSelecionado = '';   // perfil escolhido nos cartões do login
let menuDropdownAberto = false;

// ── SELEÇÃO DE PERFIL NO LOGIN ───────────────────────────────────────────────
function selecionarPerfil(perfil) {
    perfilSelecionado = perfil;
    document.getElementById('cartao-professor').classList.toggle('selecionado', perfil === 'professor');
    document.getElementById('cartao-aluno').classList.toggle('selecionado', perfil === 'aluno');
}

// ── NAVEGAÇÃO ENTRE TELAS ────────────────────────────────────────────────────
function irPara(idTela) {
    document.querySelectorAll('.tela').forEach(tela => tela.classList.remove('ativa'));
    document.getElementById(idTela).classList.add('ativa');

    if (idTela === 'tela-pesquisa-professor') atualizarListaDropdown();
    if (idTela === 'tela-dashboard-aluno') renderizarProjetosDoAluno();
    if (idTela === 'tela-cadastro-projeto') inicializarFormularioProjeto();
    fecharMenuDropdown();
}

// ── LOGIN ────────────────────────────────────────────────────────────────────
function realizarLogin() {
    const loginDigitado = document.getElementById('input-login').value.trim();
    const senhaDigitada = document.getElementById('input-senha').value;
    const elementoErro = document.getElementById('erro-login');

    if (!perfilSelecionado) {
        exibirErro(elementoErro, 'Selecione um perfil (Professor ou Aluno).');
        return;
    }

    const usuarioEncontrado = listaUsuarios.find(
        u => u.login === loginDigitado && u.senha === senhaDigitada
    );

    if (!usuarioEncontrado) {
        exibirErro(elementoErro, 'Login ou senha inválidos.');
        return;
    }

    if (usuarioEncontrado.perfil !== perfilSelecionado) {
        exibirErro(elementoErro, 'Este login não corresponde ao perfil selecionado.');
        return;
    }

    elementoErro.classList.remove('visivel');
    usuarioAtual = usuarioEncontrado;

    if (usuarioEncontrado.perfil === 'professor') {
        const iniciaisProfessor = gerarIniciais(usuarioEncontrado.nomeCompleto, true);
        preencherDadosProfessor(iniciaisProfessor, usuarioEncontrado.nomeCompleto);
        irPara('tela-dashboard-professor');
    } else {
        const iniciaisAluno = gerarIniciais(usuarioEncontrado.nomeCompleto, false);
        preencherDadosAluno(iniciaisAluno, usuarioEncontrado.nomeCompleto);
        irPara('tela-dashboard-aluno');
    }
}

function preencherDadosProfessor(iniciais, nomeCompleto) {
    const primeiroNome = nomeCompleto.split(' ')[0];
    ['avatar-professor', 'avatar-cadastro', 'avatar-pesquisa'].forEach(id => {
        document.getElementById(id).textContent = iniciais;
    });
    ['nome-usuario-professor', 'nome-usuario-cadastro', 'nome-usuario-pesquisa'].forEach(id => {
        document.getElementById(id).textContent = nomeCompleto;
    });
    document.getElementById('primeiro-nome-professor').textContent = primeiroNome;
}

function preencherDadosAluno(iniciais, nomeCompleto) {
    ['avatar-aluno', 'avatar-detalhe-aluno'].forEach(id => {
        document.getElementById(id).textContent = iniciais;
    });
    ['nome-usuario-aluno', 'nome-usuario-detalhe-aluno'].forEach(id => {
        document.getElementById(id).textContent = nomeCompleto;
    });
}

function realizarLogout() {
    usuarioAtual = null;
    perfilSelecionado = '';
    document.getElementById('input-login').value = '';
    document.getElementById('input-senha').value = '';
    document.getElementById('cartao-professor').classList.remove('selecionado');
    document.getElementById('cartao-aluno').classList.remove('selecionado');
    irPara('tela-login');
}

// Atalhos de teclado no login
document.getElementById('input-senha').addEventListener('keydown', e => {
    if (e.key === 'Enter') realizarLogin();
});
document.getElementById('input-login').addEventListener('keydown', e => {
    if (e.key === 'Enter') document.getElementById('input-senha').focus();
});

// ── MODAL DE CADASTRO ────────────────────────────────────────────────────────
function abrirModalCadastro() {
    document.getElementById('overlay-modal-cadastro').classList.add('aberto');
    ['input-nome-completo', 'input-login-novo', 'input-senha-nova', 'input-confirmacao-senha'].forEach(id => {
        document.getElementById(id).value = '';
    });
    document.getElementById('select-perfil-cadastro').value = '';
    document.getElementById('erro-modal-cadastro').classList.remove('visivel');
}

function fecharModalCadastro() {
    document.getElementById('overlay-modal-cadastro').classList.remove('aberto');
}

document.getElementById('overlay-modal-cadastro').addEventListener('click', function (evento) {
    if (evento.target === this) fecharModalCadastro();
});

function cadastrarNovoUsuario() {
    const nomeCompleto = document.getElementById('input-nome-completo').value.trim();
    const loginNovo = document.getElementById('input-login-novo').value.trim();
    const senhaNova = document.getElementById('input-senha-nova').value;
    const confirmacaoSenha = document.getElementById('input-confirmacao-senha').value;
    const perfilEscolhido = document.getElementById('select-perfil-cadastro').value;
    const elementoErro = document.getElementById('erro-modal-cadastro');

    if (!nomeCompleto || !loginNovo || !senhaNova || !confirmacaoSenha || !perfilEscolhido) {
        exibirErro(elementoErro, 'Preencha todos os campos!');
        return;
    }
    if (senhaNova !== confirmacaoSenha) {
        exibirErro(elementoErro, 'As senhas não coincidem!');
        return;
    }
    if (listaUsuarios.find(u => u.login === loginNovo)) {
        exibirErro(elementoErro, 'Login já em uso!');
        return;
    }

    listaUsuarios.push({ login: loginNovo, senha: senhaNova, nomeCompleto, perfil: perfilEscolhido });
    fecharModalCadastro();

    // Preenche o login automaticamente após cadastro
    document.getElementById('input-login').value = loginNovo;
    document.getElementById('input-senha').value = senhaNova;
    selecionarPerfil(perfilEscolhido);

    alert('Cadastro realizado! Bem-vindo(a), ' + nomeCompleto + '.');
}

// ── DASHBOARD ALUNO ──────────────────────────────────────────────────────────
function renderizarProjetosDoAluno() {
    const nomeAlunoLogado = usuarioAtual.nomeCompleto.toLowerCase();
    const projetosDoAluno = listaProjetos.filter(
        projeto => projeto.alunos.some(aluno => aluno.toLowerCase() === nomeAlunoLogado)
    );

    const elementoBadge = document.getElementById('badge-contador-projetos');
    elementoBadge.textContent = '📂 ' + projetosDoAluno.length + ' projeto(s)';

    const elementoLista = document.getElementById('lista-projetos-aluno');

    if (projetosDoAluno.length === 0) {
        elementoLista.innerHTML = `
            <div class="mensagem-nenhum-projeto">
                <div class="icone">📭</div>
                <h4>Nenhum projeto encontrado</h4>
                <p>Você ainda não está cadastrado em nenhum projeto. Procure seu professor para mais informações.</p>
            </div>`;
        return;
    }

    elementoLista.innerHTML = projetosDoAluno.map(projeto => {
        const indiceGlobal = listaProjetos.indexOf(projeto);
        return `
            <div class="cartao-projeto-aluno" onclick="verDetalhesProjetoAluno(${indiceGlobal})">
                <h4>${projeto.nome}</h4>
                <div class="linha-coordenador">👨‍🏫 Coordenador: <span>${projeto.coordenador}</span></div>
                <div class="quantidade-alunos">👥 ${projeto.alunos.length} aluno(s) participante(s)</div>
                <button class="btn-ver-detalhes" onclick="verDetalhesProjetoAluno(${indiceGlobal}); event.stopPropagation()">Ver detalhes →</button>
            </div>`;
    }).join('');
}

function verDetalhesProjetoAluno(indiceProjeto) {
    renderizarDetalhesProjeto(indiceProjeto, 'area-detalhe-aluno', true);
    irPara('tela-detalhe-aluno');
}

// ── FORMULÁRIO DE CADASTRO DE PROJETO ───────────────────────────────────────
function inicializarFormularioProjeto() {
    document.getElementById('input-nome-projeto').value = '';
    document.getElementById('input-nome-coordenador').value = '';
    document.getElementById('lista-campos-alunos').innerHTML = `
        <div class="linha-aluno">
            <input type="text" placeholder="Nome completo do aluno">
            <button class="btn-remover-aluno" onclick="removerCampoAluno(this)">×</button>
        </div>`;
}

function adicionarCampoAluno() {
    const containerAlunos = document.getElementById('lista-campos-alunos');
    const novaLinha = document.createElement('div');
    novaLinha.className = 'linha-aluno';
    novaLinha.innerHTML = `
        <input type="text" placeholder="Nome completo do aluno">
        <button class="btn-remover-aluno" onclick="removerCampoAluno(this)">×</button>`;
    containerAlunos.appendChild(novaLinha);
    novaLinha.querySelector('input').focus();
}

function removerCampoAluno(botaoRemover) {
    const todasLinhas = document.querySelectorAll('.linha-aluno');
    if (todasLinhas.length <= 1) {
        botaoRemover.closest('.linha-aluno').querySelector('input').value = '';
        return;
    }
    botaoRemover.closest('.linha-aluno').remove();
}

function salvarProjeto() {
    const nomeProjeto = document.getElementById('input-nome-projeto').value.trim();
    const nomeCoordenador = document.getElementById('input-nome-coordenador').value.trim();
    const alunosDigitados = [...document.querySelectorAll('#lista-campos-alunos .linha-aluno input')]
        .map(campo => campo.value.trim())
        .filter(Boolean);

    if (!nomeProjeto || !nomeCoordenador) {
        alert('Preencha ao menos o nome do projeto e o coordenador.');
        return;
    }

    listaProjetos.push({ nome: nomeProjeto, coordenador: nomeCoordenador, alunos: alunosDigitados });
    inicializarFormularioProjeto();

    const elementoAviso = document.getElementById('aviso-sucesso-cadastro');
    elementoAviso.classList.add('visivel');
    setTimeout(() => elementoAviso.classList.remove('visivel'), 3500);
}

// ── DROPDOWN DE PROJETOS (PROFESSOR) ────────────────────────────────────────
function alternarMenuProjetos() {
    menuDropdownAberto = !menuDropdownAberto;
    document.getElementById('dropdown-projetos').classList.toggle('aberto', menuDropdownAberto);
    if (menuDropdownAberto) atualizarListaDropdown();
}

function fecharMenuDropdown() {
    menuDropdownAberto = false;
    document.getElementById('dropdown-projetos').classList.remove('aberto');
}

// Fecha dropdown ao clicar fora
document.addEventListener('click', evento => {
    const containerMenu = document.querySelector('.container-menu-projetos');
    if (containerMenu && !containerMenu.contains(evento.target)) fecharMenuDropdown();
});

function atualizarListaDropdown() {
    const containerItens = document.getElementById('itens-dropdown-projetos');
    if (listaProjetos.length === 0) {
        containerItens.innerHTML = '<div class="lista-vazia">Nenhum projeto cadastrado.</div>';
        return;
    }
    containerItens.innerHTML = listaProjetos.map((projeto, indice) =>
        `<div class="item-dropdown" onclick="mostrarDetalheProfessor(${indice})">
            <div class="ponto-indicador"></div>${projeto.nome}
        </div>`
    ).join('');
}

function mostrarDetalheProfessor(indiceProjeto) {
    fecharMenuDropdown();
    renderizarDetalhesProjeto(indiceProjeto, 'area-detalhe-professor', false);
}

// ── RENDERIZAÇÃO DO CARTÃO DE DETALHES DO PROJETO ───────────────────────────
function renderizarDetalhesProjeto(indiceProjeto, idAreaDestino, destacarAlunoLogado) {
    const projeto = listaProjetos[indiceProjeto];
    const iniciaisCoordenador = gerarIniciais(projeto.coordenador, true) || 'PR';
    const nomeAlunoLogado = (usuarioAtual && usuarioAtual.perfil === 'aluno')
        ? usuarioAtual.nomeCompleto.toLowerCase()
        : '';

    const htmlAlunos = projeto.alunos.length > 0
        ? projeto.alunos.map(nomeAluno => {
            const iniciais = gerarIniciais(nomeAluno, false);
            const ehLogado = destacarAlunoLogado && nomeAluno.toLowerCase() === nomeAlunoLogado;
            return `
                <div class="chip-aluno${ehLogado ? ' destaque' : ''}">
                    <div class="avatar-chip-aluno">${iniciais}</div>
                    <span>${nomeAluno}${ehLogado ? ' <strong>(você)</strong>' : ''}</span>
                </div>`;
        }).join('')
        : '<span style="color:var(--cor-texto-mudo);font-size:13px;font-style:italic">Nenhum aluno cadastrado</span>';

    document.getElementById(idAreaDestino).innerHTML = `
        <div class="cartao-detalhe">
            <div class="cabecalho-detalhe">
                <div class="badge-tipo-projeto">Projeto Acadêmico</div>
                <div class="nome-projeto-detalhe">${projeto.nome}</div>
            </div>
            <div class="corpo-detalhe">
                <div class="secao-detalhe">
                    <div class="rotulo-secao-detalhe">Coordenador</div>
                    <div class="chip-coordenador">
                        <div class="avatar-coordenador">${iniciaisCoordenador}</div>
                        <span class="nome-coordenador">${projeto.coordenador}</span>
                    </div>
                </div>
                <div class="secao-detalhe">
                    <div class="rotulo-secao-detalhe">Alunos (${projeto.alunos.length})</div>
                    <div class="lista-chips-alunos">${htmlAlunos}</div>
                </div>
            </div>
        </div>`;
}

// ── UTILITÁRIOS ──────────────────────────────────────────────────────────────

/**
 * Gera as iniciais de um nome para uso nos avatares.
 * @param {string} nomeCompleto - O nome de onde extrair as iniciais.
 * @param {boolean} apenasLetrasCapitais - Se true, filtra apenas palavras que começam com maiúscula.
 * @returns {string} Até 2 iniciais em maiúsculas.
 */
function gerarIniciais(nomeCompleto, apenasLetrasCapitais) {
    const palavras = nomeCompleto.split(' ');
    const palavrasFiltradas = apenasLetrasCapitais
        ? palavras.filter(palavra => /^[A-ZÁÉÍÓÚ]/.test(palavra))
        : palavras;
    return palavrasFiltradas
        .slice(0, 2)
        .map(palavra => palavra[0])
        .join('')
        .substring(0, 2)
        .toUpperCase();
}

/**
 * Exibe uma mensagem de erro em um elemento da interface.
 * @param {HTMLElement} elementoErro - O elemento que exibirá o erro.
 * @param {string} mensagem - O texto do erro a exibir.
 */
function exibirErro(elementoErro, mensagem) {
    elementoErro.textContent = mensagem;
    elementoErro.classList.add('visivel');
}