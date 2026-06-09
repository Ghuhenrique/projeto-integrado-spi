/**
 * auth.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Gerenciamento da sessão do usuário e do token JWT.
 *
 * O token é salvo em sessionStorage (dura apenas a aba/guia atual).
 * Os dados do usuário logado ficam em memória em `Auth.usuarioAtual`.
 *
 * Fluxo esperado:
 *   1. Login bem-sucedido → ApiAuth.login() → Auth.iniciarSessao(token, usuario)
 *   2. Requisições autenticadas → api.js lê Auth.obterToken() automaticamente
 *   3. Logout ou 401 → Auth.limparSessao() → redireciona para tela-login
 * ─────────────────────────────────────────────────────────────────────────────
 */

const CHAVE_TOKEN = 'spi_token';
const CHAVE_USUARIO = 'spi_usuario';

const Auth = {
    // Objeto do usuário logado (populado após login bem-sucedido)
    usuarioAtual: null,

    // ── Persistência ─────────────────────────────────────────────────────────

    /**
     * Persiste o token e os dados do usuário após login bem-sucedido.
     * @param {string} token
     * @param {{ nomeCompleto:string, perfil:'professor'|'aluno', id?:string }} usuario
     */
    iniciarSessao(token, usuario) {
        sessionStorage.setItem(CHAVE_TOKEN, token);
        sessionStorage.setItem(CHAVE_USUARIO, JSON.stringify(usuario));
        this.usuarioAtual = usuario;
    },

    /**
     * Remove token e dados da sessão.
     * Deve ser chamado no logout e ao receber 401 do back-end.
     */
    limparSessao() {
        sessionStorage.removeItem(CHAVE_TOKEN);
        sessionStorage.removeItem(CHAVE_USUARIO);
        this.usuarioAtual = null;
    },

    /**
     * Retorna o token JWT salvo, ou null se não houver sessão.
     * @returns {string|null}
     */
    obterToken() {
        return sessionStorage.getItem(CHAVE_TOKEN);
    },

    /**
     * Restaura `usuarioAtual` a partir do sessionStorage.
     * Útil para recarregar a página sem perder a sessão.
     * @returns {boolean} true se havia sessão salva
     */
    restaurarSessao() {
        const token = sessionStorage.getItem(CHAVE_TOKEN);
        const usuarioJ = sessionStorage.getItem(CHAVE_USUARIO);
        if (token && usuarioJ) {
            try {
                this.usuarioAtual = JSON.parse(usuarioJ);
                return true;
            } catch {
                this.limparSessao();
            }
        }
        return false;
    },

    // ── Conveniências ─────────────────────────────────────────────────────────

    /** Retorna true se há token salvo (não valida a assinatura). */
    estaLogado() {
        return !!this.obterToken();
    },

    /** Atalho para o perfil do usuário atual. */
    obterPerfil() {
        return this.usuarioAtual?.perfil ?? null;
    },
};