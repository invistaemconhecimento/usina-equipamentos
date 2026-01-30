// SISTEMA DE GESTÃO DE EQUIPAMENTOS COM PERMISSÕES
class EquipamentosApp {
    constructor() {
        this.data = null;
        this.equipamentos = [];
        this.filtros = { status: 'all', pendencia: 'all', setor: 'all', busca: '' };
        this.equipamentoSelecionado = null;
        this.viewMode = 'grid';
        this.modals = {};
        this.usuarioAtual = null;
        this.nivelUsuario = null;
        this.init();
    }
    
    async init() {
        try {
            if (!this.verificarSessao()) return;
            this.carregarUsuario();
            this.registrarLogin();
            this.configurarInterfacePorPermissao();
            this.initModals();
            this.initEvents();
            await this.carregarDados();
            this.renderizarEquipamentos();
            this.atualizarEstatisticas();
            this.atualizarStatusSincronizacao(true);
            this.configurarAtualizacoes();
        } catch (error) {
            console.error('Erro na inicialização:', error);
            this.mostrarMensagem('Erro ao inicializar aplicação.', 'error');
        }
    }
    
    // ================== SISTEMA DE SESSÃO ==================
    verificarSessao() {
        const sessao = localStorage.getItem('gestao_equipamentos_sessao');
        if (!sessao) { window.location.href = 'login.html'; return false; }
        try {
            const sessaoData = JSON.parse(sessao);
            if (new Date().getTime() > sessaoData.expira) {
                localStorage.removeItem('gestao_equipamentos_sessao');
                localStorage.removeItem('gestao_equipamentos_usuario');
                localStorage.removeItem('gestao_equipamentos_nivel');
                window.location.href = 'login.html?expired=true';
                return false;
            }
            sessaoData.expira = new Date().getTime() + (8 * 60 * 60 * 1000);
            localStorage.setItem('gestao_equipamentos_sessao', JSON.stringify(sessaoData));
            return true;
        } catch (e) {
            localStorage.removeItem('gestao_equipamentos_sessao');
            window.location.href = 'login.html';
            return false;
        }
    }
    
    carregarUsuario() {
        this.usuarioAtual = localStorage.getItem('gestao_equipamentos_usuario');
        this.nivelUsuario = localStorage.getItem('gestao_equipamentos_nivel');
        this.atualizarDisplayUsuario();
        this.adicionarIndicadorNivel();
    }
    
    registrarLogin() {
        if (window.registrarAtividade) {
            window.registrarAtividade('LOGIN', `Usuário ${this.usuarioAtual} acessou o sistema`);
        }
        localStorage.setItem('gestao_equipamentos_ultimo_acesso', new Date().toISOString());
    }
    
    // ================== PERMISSÕES ==================
    verificarPermissao(permissao) {
        if (!this.nivelUsuario || !window.PERMISSOES) return false;
        const permissoesBasicas = ['visualizar_equipamentos', 'ver_detalhes'];
        if (permissoesBasicas.includes(permissao)) return true;
        return window.PERMISSOES.verificarPermissao(this.nivelUsuario, permissao);
    }
    
    getNomeNivel() { return window.PERMISSOES?.getNomeNivel(this.nivelUsuario) || 'Usuário'; }
    getCorNivel() { return window.PERMISSOES?.getCorNivel(this.nivelUsuario) || '#95a5a6'; }
    getIconeNivel() { return window.PERMISSOES?.getIconeNivel(this.nivelUsuario) || 'fa-user'; }
    
    atualizarDisplayUsuario() {
        const userElement = document.getElementById('current-user');
        if (userElement && this.usuarioAtual) {
            userElement.innerHTML = `<i class="fas ${this.getIconeNivel()}"></i><span>${this.usuarioAtual.charAt(0).toUpperCase() + this.usuarioAtual.slice(1)} <small>(${this.getNomeNivel()})</small></span>`;
        }
    }
    
    adicionarIndicadorNivel() {
        if (!window.APP_CONFIG?.appSettings.mostrarIndicadorNivel) return;
        const indicadorAnterior = document.querySelector('.nivel-indicator');
        if (indicadorAnterior) indicadorAnterior.remove();
        
        const indicador = document.createElement('div');
        indicador.className = 'nivel-indicator';
        indicador.textContent = this.getNomeNivel();
        indicador.title = `Nível de acesso
