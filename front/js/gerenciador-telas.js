/**
 * gerenciador-telas.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Responsável por carregar os arquivos HTML de cada tela/modal sob demanda
 * e injetá-los no contêiner principal do DOM.
 *
 * Cada arquivo é baixado apenas UMA VEZ: depois da primeira carga ele fica
 * registrado em `telasCarregadas` e futuras chamadas apenas exibem/ocultam
 * o elemento que já está no DOM, sem novas requisições de rede.
 *
 * Estrutura esperada de pastas:
 *   telas/
 *     login.html
 *     dashboard-professor.html
 *     dashboard-aluno.html
 *     cadastro-projeto.html
 *     pesquisa-professor.html
 *     detalhe-aluno.html
 *     modal-cadastro-usuario.html
 * ─────────────────────────────────────────────────────────────────────────────
 */

// ── REGISTRO DE TELAS JÁ CARREGADAS ─────────────────────────────────────────
// Guarda os nomes dos arquivos que já foram buscados e injetados no DOM.
// Evita requisições duplicadas ao servidor.
const telasCarregadas = new Set();

// ── MAPEAMENTO: nome lógico → arquivo HTML ───────────────────────────────────
// Centraliza todos os nomes de arquivo em um único lugar.
// Para adicionar uma nova tela basta incluir uma entrada aqui.
const mapaArquivosDeTelas = {
    'tela-login':                 'login.html',
    'tela-dashboard-professor':   'dashboard-professor.html',
    'tela-dashboard-aluno':       'dashboard-aluno.html',
    'tela-cadastro-projeto':      'cadastro-projeto.html',
    'tela-perfil-usuario':        'modal-perfil-usuario.html',
    'tela-pesquisa-professor':    'pesquisa-professor.html',
    'tela-detalhe-aluno':         'detalhe-aluno.html',
    'modal-cadastro-usuario':     'modal-cadastro-usuario.html',
};

/**
 * Carrega o HTML de uma tela ou modal e o injeta no contêiner principal.
 * Se a tela já foi carregada anteriormente, retorna imediatamente sem
 * fazer nenhuma requisição nova.
 *
 * @param {string} nomeTela - Chave do mapa `mapaArquivosDeTelas`
 *                            (ex: 'tela-login', 'modal-cadastro-usuario').
 * @returns {Promise<void>}
 * @throws {Error} Se o arquivo não for encontrado ou a requisição falhar.
 */
async function carregarTela(nomeTela) {
    // Já carregada: nada a fazer
    if (telasCarregadas.has(nomeTela)) return;

    const nomeArquivo = mapaArquivosDeTelas[nomeTela];

    if (!nomeArquivo) {
        console.error(`[gerenciador-telas] Tela desconhecida: "${nomeTela}"`);
        return;
    }

    try {
        const resposta = await fetch(`telas/${nomeArquivo}`);

        if (!resposta.ok) {
            throw new Error(`Falha ao carregar "${nomeArquivo}": HTTP ${resposta.status}`);
        }

        const htmlRecebido = await resposta.text();

        // Injeta o HTML no final do contêiner, sem apagar o que já existe
        document
            .getElementById('conteiner-telas')
            .insertAdjacentHTML('beforeend', htmlRecebido);

        telasCarregadas.add(nomeTela);

        // Registra listeners de teclado que dependem dos inputs recém-injetados
        if (nomeTela === 'tela-login') {
            registrarAtalhosTecladoLogin();
        }

    } catch (erro) {
        console.error('[gerenciador-telas]', erro);
        throw erro; // Re-lança para que o chamador possa tratar se necessário
    }
}

/**
 * Garante que um conjunto de telas esteja carregado antes de prosseguir.
 * Útil para pré-carregar telas relacionadas em segundo plano.
 *
 * @param {string[]} nomesDeTelas - Lista de chaves do mapa de telas.
 * @returns {Promise<void>}
 */
async function preCarregarTelas(nomesDeTelas) {
    await Promise.all(nomesDeTelas.map(nome => carregarTela(nome)));
}

/**
 * Registra os atalhos de teclado do formulário de login.
 * Chamado uma única vez, logo após o HTML do login ser injetado no DOM.
 */
function registrarAtalhosTecladoLogin() {
    const inputLogin = document.getElementById('input-login');
    const inputSenha = document.getElementById('input-senha');

    inputLogin?.addEventListener('keydown', evento => {
        if (evento.key === 'Enter') inputSenha?.focus();
    });

    inputSenha?.addEventListener('keydown', evento => {
        if (evento.key === 'Enter') realizarLogin();
    });
}
