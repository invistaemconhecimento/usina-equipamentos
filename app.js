// ===========================================
// SISTEMA DE GESTÃO DE EQUIPAMENTOS COM USUÁRIOS SINCRONIZADOS
// ===========================================

class EquipamentosApp {
    constructor() {
        this.data = null;
        this.equipamentos = [];
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: ''
        };
        this.equipamentoSelecionado = null;
        this.viewMode = 'grid';
        this.modals = {};
        this.usuarioAtual = null;
        this.nivelUsuario = null;
        this.gerenciadorUsuarios = null;
        this.sincronizando = false;
        this.ultimaSincronizacao = null;
        this.searchTimeout = null;
        this.offlineMode = false;
        
        this.init();
    }
    
    async init() {
        console.log('Inicializando Sistema de Gestão de Equipamentos...');
        
        // 1. Verificar sessão
        if (!this.verificarSessao()) {
            console.log('Sessão inválida ou expirada');
            return;
        }
        
        // 2. Carregar informações do usuário
        this.carregarUsuario();
        
        // 3. Registrar login no sistema
        this.registrarLogin();
        
        // 4. Configurar interface baseada nas permissões
        this.configurarInterfacePorPermissao();
        
        // 5. Inicializar componentes
        this.initModals();
        this.initEvents();
        
        // 6. Inicializar gerenciador de usuários (se admin)
        if (this.nivelUsuario === 'administrador') {
            this.inicializarGerenciadorUsuarios();
        }
        
        // 7. Verificar conexão
        this.verificarConexao();
        
        // 8. Carregar dados
        await this.carregarDados();
        
        // 9. Inicializar interface
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        this.atualizarStatusSincronizacao(true);
        
        // 10. Configurar atualizações automáticas
        this.configurarAtualizacoes();
        
        console.log('Sistema inicializado com sucesso');
    }
    
    // ================== SISTEMA DE SESSÃO E PERMISSÕES ==================
    
    verificarSessao() {
        const sessao = localStorage.getItem('gestao_equipamentos_sessao');
        
        if (!sessao) {
            console.warn('Nenhuma sessão encontrada, redirecionando para login');
            window.location.href = 'login.html';
            return false;
        }
        
        try {
            const sessaoData = JSON.parse(sessao);
            const agora = new Date().getTime();
            
            // Verificar expiração
            if (agora > sessaoData.expira) {
                console.warn('Sessão expirada');
                localStorage.removeItem('gestao_equipamentos_sessao');
                localStorage.removeItem('gestao_equipamentos_usuario');
                localStorage.removeItem('gestao_equipamentos_nivel');
                window.location.href = 'login.html?expired=true';
                return false;
            }
            
            // Renovar sessão (extender por mais 8 horas)
            sessaoData.expira = agora + (8 * 60 * 60 * 1000);
            localStorage.setItem('gestao_equipamentos_sessao', JSON.stringify(sessaoData));
            
            console.log('Sessão válida, usuário:', sessaoData.usuario);
            return true;
        } catch (e) {
            console.error('Erro ao verificar sessão:', e);
            localStorage.removeItem('gestao_equipamentos_sessao');
            localStorage.removeItem('gestao_equipamentos_usuario');
            localStorage.removeItem('gestao_equipamentos_nivel');
            window.location.href = 'login.html';
            return false;
        }
    }
    
    carregarUsuario() {
        this.usuarioAtual = localStorage.getItem('gestao_equipamentos_usuario');
        this.nivelUsuario = localStorage.getItem('gestao_equipamentos_nivel');
        
        console.log('Usuário carregado:', this.usuarioAtual, 'Nível:', this.nivelUsuario);
        
        // Atualizar display do usuário
        this.atualizarDisplayUsuario();
        
        // Adicionar indicador visual do nível
        this.adicionarIndicadorNivel();
    }
    
    registrarLogin() {
        console.log('Registrando login do usuário:', this.usuarioAtual);
        
        // Registrar atividade de login
        if (window.registrarAtividade) {
            window.registrarAtividade('LOGIN', `Usuário ${this.usuarioAtual} (${this.getNomeNivel()}) acessou o sistema`);
        }
        
        // Registrar log de auditoria
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'LOGIN', 
                `Usuário ${this.usuarioAtual} (${this.getNomeNivel()}) acessou o sistema`
            );
        }
        
        // Atualizar último acesso
        localStorage.setItem('gestao_equipamentos_ultimo_acesso', new Date().toISOString());
        
        // Atualizar último acesso no gerenciador de usuários
        this.atualizarUltimoAcessoUsuario();
    }
    
    async atualizarUltimoAcessoUsuario() {
        try {
            // Carregar usuários do localStorage
            const usuariosSalvos = localStorage.getItem('gestao_equipamentos_usuarios');
            if (usuariosSalvos) {
                const usuarios = JSON.parse(usuariosSalvos);
                if (usuarios[this.usuarioAtual]) {
                    usuarios[this.usuarioAtual].ultimoAcesso = new Date().toISOString();
                    localStorage.setItem('gestao_equipamentos_usuarios', JSON.stringify(usuarios));
                    
                    // Se estiver online, tentar sincronizar
                    if (navigator.onLine) {
                        setTimeout(() => this.sincronizarUsuariosEmBackground(), 0);
                    }
                }
            }
        } catch (error) {
            console.warn('Erro ao atualizar último acesso:', error);
        }
    }
    
    // ================== INICIALIZAÇÃO DO GERENCIADOR DE USUÁRIOS ==================
    
    inicializarGerenciadorUsuarios() {
        if (typeof GerenciadorUsuarios !== 'undefined') {
            this.gerenciadorUsuarios = new GerenciadorUsuarios();
            console.log('Gerenciador de usuários inicializado');
            
            // Carregar usuários em background
            setTimeout(() => {
                this.gerenciadorUsuarios.carregarUsuarios().then(() => {
                    console.log('Usuários carregados para gerenciamento');
                });
            }, 1000);
        }
    }
    
    // ================== SISTEMA DE PERMISSÕES ==================
    
    verificarPermissao(permissao) {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            console.warn('Permissões não disponíveis para verificação');
            return false;
        }
        
        // Permissões básicas que todos têm
        const permissoesBasicas = ['visualizar_equipamentos', 'ver_detalhes', 'filtrar_equipamentos'];
        if (permissoesBasicas.includes(permissao)) {
            return true;
        }
        
        const temPermissao = window.PERMISSOES.verificarPermissao(this.nivelUsuario, permissao);
        console.log(`Verificando permissão ${permissao} para ${this.nivelUsuario}: ${temPermissao}`);
        return temPermissao;
    }
    
    podeExecutar(acao, recurso, donoRecurso = null) {
        if (!this.nivelUsuario || !window.podeExecutar) {
            return false;
        }
        
        const pode = window.podeExecutar(acao, recurso, donoRecurso);
        console.log(`Pode executar ${acao} em ${recurso} (dono: ${donoRecurso}): ${pode}`);
        return pode;
    }
    
    getNomeNivel() {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            return 'Visitante';
        }
        
        return window.PERMISSOES.getNomeNivel(this.nivelUsuario);
    }
    
    getCorNivel() {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            return '#95a5a6';
        }
        
        return window.PERMISSOES.getCorNivel(this.nivelUsuario);
    }
    
    getIconeNivel() {
        if (!this.nivelUsuario || !window.PERMISSOES) {
            return 'fa-eye';
        }
        
        return window.PERMISSOES.getIconeNivel(this.nivelUsuario);
    }
    
    atualizarDisplayUsuario() {
        const userElement = document.getElementById('current-user');
        if (userElement && this.usuarioAtual) {
            const nomeFormatado = this.usuarioAtual.charAt(0).toUpperCase() + this.usuarioAtual.slice(1);
            const nivelNome = this.getNomeNivel();
            userElement.innerHTML = `
                <i class="fas ${this.getIconeNivel()}"></i>
                <span>${nomeFormatado} <small>(${nivelNome})</small></span>
            `;
        }
    }
    
    adicionarIndicadorNivel() {
        // Remover indicador anterior se existir
        const indicadorAnterior = document.querySelector('.nivel-indicator');
        if (indicadorAnterior) {
            indicadorAnterior.remove();
        }
        
        // Verificar se deve mostrar indicador
        if (!window.APP_CONFIG || !window.APP_CONFIG.appSettings.mostrarIndicadorNivel) {
            return;
        }
        
        const cor = this.getCorNivel();
        const nomeNivel = this.getNomeNivel();
        
        // Criar indicador
        const indicador = document.createElement('div');
        indicador.className = 'nivel-indicator';
        indicador.style.cssText = `
            position: fixed;
            top: 10px;
            left: 10px;
            background: ${cor};
            color: white;
            padding: 5px 10px;
            border-radius: 4px;
            font-size: 11px;
            font-weight: bold;
            z-index: 9999;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2);
            text-transform: uppercase;
            letter-spacing: 1px;
            opacity: 0.9;
            transition: opacity 0.3s;
            cursor: help;
        `;
        indicador.textContent = nomeNivel;
        indicador.title = `Nível de acesso: ${nomeNivel}\nUsuário: ${this.usuarioAtual}`;
        
        // Adicionar hover effect
        indicador.addEventListener('mouseenter', () => {
            indicador.style.opacity = '1';
            indicador.style.transform = 'scale(1.05)';
        });
        
        indicador.addEventListener('mouseleave', () => {
            indicador.style.opacity = '0.9';
            indicador.style.transform = 'scale(1)';
        });
        
        document.body.appendChild(indicador);
    }
    
    configurarInterfacePorPermissao() {
        const nivel = this.nivelUsuario;
        console.log('Configurando interface para nível:', nivel);
        
        // Botões por nível
        const addEquipamentoBtn = document.getElementById('add-equipamento');
        const exportDataBtn = document.getElementById('export-data');
        const viewLogsBtn = document.getElementById('view-logs');
        const systemInfoBtn = document.getElementById('system-info');
        const exportConfigBtn = document.getElementById('export-config');
        const addPendenciaBtn = document.getElementById('add-pendencia');
        const gerenciarUsuariosBtn = document.getElementById('gerenciar-usuarios-btn');
        
        // Resetar todos os botões primeiro
        [addEquipamentoBtn, exportDataBtn, viewLogsBtn, systemInfoBtn, exportConfigBtn, addPendenciaBtn, gerenciarUsuariosBtn].forEach(btn => {
            if (btn) {
                btn.style.display = 'none';
                btn.disabled = true;
            }
        });
        
        // Visitante - apenas visualização
        if (nivel === 'visitante') {
            console.log('Configurando interface para visitante');
            // Visitante não vê botões de ação
        }
        
        // Operador - pode criar, editar, excluir, exportar
        if (nivel === 'operador') {
            console.log('Configurando interface para operador');
            
            if (addEquipamentoBtn && this.verificarPermissao('criar_equipamentos')) {
                addEquipamentoBtn.style.display = 'flex';
                addEquipamentoBtn.disabled = false;
                addEquipamentoBtn.title = 'Adicionar novo equipamento';
            }
            
            if (exportDataBtn && this.verificarPermissao('exportar_dados')) {
                exportDataBtn.style.display = 'flex';
                exportDataBtn.disabled = false;
                exportDataBtn.title = 'Exportar dados para Excel';
            }
            
            if (addPendenciaBtn && this.verificarPermissao('criar_pendencias')) {
                addPendenciaBtn.style.display = 'flex';
                addPendenciaBtn.disabled = false;
                addPendenciaBtn.title = 'Adicionar nova pendência';
            }
        }
        
        // Administrador - tudo
        if (nivel === 'administrador') {
            console.log('Configurando interface para administrador');
            
            if (addEquipamentoBtn && this.verificarPermissao('criar_equipamentos')) {
                addEquipamentoBtn.style.display = 'flex';
                addEquipamentoBtn.disabled = false;
                addEquipamentoBtn.title = 'Adicionar novo equipamento';
            }
            
            if (exportDataBtn && this.verificarPermissao('exportar_dados')) {
                exportDataBtn.style.display = 'flex';
                exportDataBtn.disabled = false;
                exportDataBtn.title = 'Exportar dados para Excel';
            }
            
            if (viewLogsBtn && this.verificarPermissao('visualizar_logs')) {
                viewLogsBtn.style.display = 'flex';
                viewLogsBtn.disabled = false;
                viewLogsBtn.title = 'Visualizar logs de auditoria';
            }
            
            if (systemInfoBtn && this.verificarPermissao('configurar_sistema')) {
                systemInfoBtn.style.display = 'flex';
                systemInfoBtn.disabled = false;
                systemInfoBtn.title = 'Informações do sistema';
            }
            
            if (exportConfigBtn && this.verificarPermissao('configurar_sistema')) {
                exportConfigBtn.style.display = 'flex';
                exportConfigBtn.disabled = false;
                exportConfigBtn.title = 'Exportar configurações';
            }
            
            if (addPendenciaBtn && this.verificarPermissao('criar_pendencias')) {
                addPendenciaBtn.style.display = 'flex';
                addPendenciaBtn.disabled = false;
                addPendenciaBtn.title = 'Adicionar nova pendência';
            }
            
            // Botão de gerenciar usuários
            if (gerenciarUsuariosBtn && this.verificarPermissao('gerenciar_usuarios')) {
                gerenciarUsuariosBtn.style.display = 'flex';
                gerenciarUsuariosBtn.disabled = false;
                gerenciarUsuariosBtn.title = 'Gerenciar usuários do sistema';
            } else {
                // Criar botão se não existir
                this.criarBotaoGerenciarUsuarios();
            }
        }
        
        // Adicionar badge de nível no cabeçalho
        this.adicionarBadgeNivel();
        
        // Atualizar estado do botão de pendência
        this.atualizarEstadoBotaoPendencia();
    }
    
    criarBotaoGerenciarUsuarios() {
        // Verificar se já existe
        if (document.getElementById('gerenciar-usuarios-btn')) {
            return;
        }
        
        const actionsContainer = document.querySelector('.actions');
        if (!actionsContainer) return;
        
        // Criar botão
        const botaoHtml = `
            <button id="gerenciar-usuarios-btn" class="btn-secondary" title="Gerenciar usuários do sistema">
                <i class="fas fa-users-cog"></i> Gerenciar Usuários
            </button>
        `;
        
        // Inserir na posição correta
        const exportConfigBtn = actionsContainer.querySelector('#export-config');
        if (exportConfigBtn) {
            exportConfigBtn.insertAdjacentHTML('beforebegin', botaoHtml);
        } else {
            const viewLogsBtn = actionsContainer.querySelector('#view-logs');
            if (viewLogsBtn) {
                viewLogsBtn.insertAdjacentHTML('afterend', botaoHtml);
            } else {
                actionsContainer.insertAdjacentHTML('beforeend', botaoHtml);
            }
        }
        
        // Adicionar evento
        const gerenciarUsuariosBtn = document.getElementById('gerenciar-usuarios-btn');
        if (gerenciarUsuariosBtn) {
            gerenciarUsuariosBtn.addEventListener('click', () => {
                this.abrirGerenciadorUsuarios();
            });
        }
    }
    
    abrirGerenciadorUsuarios() {
        if (!this.verificarPermissao('gerenciar_usuarios')) {
            this.mostrarMensagem('Você não tem permissão para gerenciar usuários', 'error');
            return;
        }
        
        if (window.abrirGerenciadorUsuarios) {
            window.abrirGerenciadorUsuarios();
        } else if (this.gerenciadorUsuarios) {
            // Usar implementação local se disponível
            this.mostrarMensagem('Funcionalidade em desenvolvimento', 'info');
        } else {
            this.mostrarMensagem('Módulo de gerenciamento de usuários não carregado', 'error');
        }
    }
    
    adicionarBadgeNivel() {
        const userInfo = document.querySelector('.user-info');
        if (userInfo) {
            // Remover badge anterior se existir
            const badgeAnterior = userInfo.querySelector('.user-level-badge');
            if (badgeAnterior) {
                badgeAnterior.remove();
            }
            
            const badge = document.createElement('span');
            badge.className = 'user-level-badge';
            badge.style.cssText = `
                display: inline-block;
                background: ${this.getCorNivel()};
                color: white;
                padding: 2px 8px;
                border-radius: 10px;
                font-size: 11px;
                font-weight: bold;
                margin-left: 8px;
                text-transform: uppercase;
                letter-spacing: 0.5px;
                cursor: help;
            `;
            badge.textContent = this.getNomeNivel().substring(0, 3);
            badge.title = `Nível: ${this.getNomeNivel()}\nUsuário: ${this.usuarioAtual}`;
            
            userInfo.appendChild(badge);
        }
    }
    
    // ================== VERIFICAÇÃO DE CONEXÃO ==================
    
    verificarConexao() {
        this.offlineMode = !navigator.onLine;
        
        if (this.offlineMode) {
            console.warn('Modo offline detectado');
            this.mostrarMensagem('Você está offline. Algumas funcionalidades podem estar limitadas.', 'warning');
        }
        
        // Configurar listeners para mudanças de conexão
        window.addEventListener('online', () => {
            console.log('Conexão restabelecida');
            this.offlineMode = false;
            this.atualizarStatusSincronizacao(true);
            this.mostrarMensagem('Conexão restabelecida. Sincronizando dados...', 'success');
            
            // Tentar sincronizar automaticamente
            setTimeout(() => this.sincronizarDados(), 2000);
        });
        
        window.addEventListener('offline', () => {
            console.warn('Conexão perdida');
            this.offlineMode = true;
            this.atualizarStatusSincronizacao(false);
            this.mostrarMensagem('Conexão perdida. Modo offline ativado.', 'warning');
        });
    }
    
    // ================== FUNÇÕES ORIGINAIS ATUALIZADAS ==================
    
    initModals() {
        console.log('Inicializando modais...');
        
        this.modals.equipamento = document.getElementById('equipamento-modal');
        this.modals.pendencia = document.getElementById('pendencia-modal');
        this.modals.detalhes = document.getElementById('detalhes-modal');
        
        // Fechar modais ao clicar no X
        document.querySelectorAll('.close-modal').forEach(closeBtn => {
            closeBtn.addEventListener('click', () => {
                this.fecharTodosModais();
            });
        });
        
        // Fechar modais ao clicar fora
        window.addEventListener('click', (event) => {
            if (event.target.classList.contains('modal')) {
                this.fecharTodosModais();
            }
        });
        
        console.log('Modais inicializados:', Object.keys(this.modals));
    }
    
    initEvents() {
        console.log('Inicializando eventos...');
        
        // Filtros
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filtros.status = e.target.value;
            this.renderizarEquipamentos();
            
            // Registrar log de filtro
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria(
                    'FILTRAR_EQUIPAMENTOS',
                    `Filtrou equipamentos por status: ${e.target.value}`
                );
            }
        });
        
        document.getElementById('pendencia-filter').addEventListener('change', (e) => {
            this.filtros.pendencia = e.target.value;
            this.renderizarEquipamentos();
            
            // Registrar log de filtro
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria(
                    'FILTRAR_EQUIPAMENTOS',
                    `Filtrou equipamentos por pendência: ${e.target.value}`
                );
            }
        });
        
        document.getElementById('setor-filter').addEventListener('change', (e) => {
            this.filtros.setor = e.target.value;
            this.renderizarEquipamentos();
            
            // Registrar log de filtro
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria(
                    'FILTRAR_EQUIPAMENTOS',
                    `Filtrou equipamentos por setor: ${e.target.value}`
                );
            }
        });
        
        document.getElementById('search').addEventListener('input', (e) => {
            this.filtros.busca = e.target.value.toLowerCase();
            this.renderizarEquipamentos();
            
            // Registrar log de busca (após um delay para evitar muitos logs)
            clearTimeout(this.searchTimeout);
            this.searchTimeout = setTimeout(() => {
                if (window.registrarLogAuditoria && e.target.value) {
                    window.registrarLogAuditoria(
                        'FILTRAR_EQUIPAMENTOS',
                        `Buscou equipamentos por: "${e.target.value}"`
                    );
                }
            }, 1000);
        });
        
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetarFiltros();
            
            // Registrar log
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria('FILTRAR_EQUIPAMENTOS', 'Resetou todos os filtros');
            }
        });
        
        // Botões de ação (com verificação de permissão)
        document.getElementById('add-equipamento').addEventListener('click', () => {
            if (this.verificarPermissao('criar_equipamentos')) {
                this.abrirModalEquipamento();
            } else {
                this.mostrarMensagem('Você não tem permissão para criar equipamentos', 'error');
            }
        });
        
        document.getElementById('add-pendencia').addEventListener('click', () => {
            if (this.verificarPermissao('criar_pendencias')) {
                this.abrirModalPendencia();
            } else {
                this.mostrarMensagem('Você não tem permissão para criar pendências', 'error');
            }
        });
        
        document.getElementById('export-data').addEventListener('click', () => {
            if (this.verificarPermissao('exportar_dados')) {
                this.exportarDadosExcel();
            } else {
                this.mostrarMensagem('Você não tem permissão para exportar dados', 'error');
            }
        });
        
        document.getElementById('manual-sync').addEventListener('click', () => {
            this.sincronizarDados();
        });
        
        // Controles de visualização
        document.getElementById('view-list').addEventListener('click', () => {
            this.setViewMode('list');
        });
        
        document.getElementById('view-grid').addEventListener('click', () => {
            this.setViewMode('grid');
        });
        
        // Formulários
        document.getElementById('equipamento-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarEquipamento();
        });
        
        document.getElementById('pendencia-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.salvarPendencia();
        });
        
        // Botões no modal de detalhes
        document.getElementById('editar-equipamento').addEventListener('click', () => {
            if (this.equipamentoSelecionado) {
                const podeEditar = this.podeExecutar('editar', 'equipamento');
                if (podeEditar) {
                    this.fecharModal(this.modals.detalhes);
                    this.abrirModalEquipamento(this.equipamentoSelecionado.id);
                } else {
                    this.mostrarMensagem('Você não tem permissão para editar equipamentos', 'error');
                }
            }
        });
        
        document.getElementById('nova-pendencia-detalhes').addEventListener('click', () => {
            if (this.equipamentoSelecionado && this.verificarPermissao('criar_pendencias')) {
                this.fecharModal(this.modals.detalhes);
                this.abrirModalPendencia(this.equipamentoSelecionado.id);
            } else {
                this.mostrarMensagem('Selecione um equipamento e tenha permissão para criar pendências', 'error');
            }
        });
        
        // Botões de sistema
        document.getElementById('system-info').addEventListener('click', () => {
            if (window.mostrarInfoSistema) {
                window.mostrarInfoSistema();
            }
        });
        
        document.getElementById('export-config').addEventListener('click', () => {
            if (window.exportarConfiguracoes) {
                window.exportarConfiguracoes();
            }
        });
        
        // Botão para visualizar logs
        const viewLogsBtn = document.getElementById('view-logs');
        if (viewLogsBtn) {
            viewLogsBtn.addEventListener('click', () => {
                if (this.verificarPermissao('visualizar_logs')) {
                    if (window.visualizarLogsAuditoria) {
                        window.visualizarLogsAuditoria();
                    } else {
                        this.mostrarMensagem('Função de logs não disponível', 'error');
                    }
                } else {
                    this.mostrarMensagem('Você não tem permissão para visualizar logs', 'error');
                }
            });
        }
        
        // Botão para gerenciar usuários (se existir)
        const gerenciarUsuariosBtn = document.getElementById('gerenciar-usuarios-btn');
        if (gerenciarUsuariosBtn) {
            gerenciarUsuariosBtn.addEventListener('click', () => {
                if (this.verificarPermissao('gerenciar_usuarios')) {
                    if (window.abrirGerenciadorUsuarios) {
                        window.abrirGerenciadorUsuarios();
                    } else {
                        this.mostrarMensagem('Função de gerenciamento de usuários não disponível', 'error');
                    }
                } else {
                    this.mostrarMensagem('Você não tem permissão para gerenciar usuários', 'error');
                }
            });
        }
        
        // Botão para excluir equipamento (será adicionado dinamicamente)
        this.setupExcluirEquipamentoEvent();
        
        console.log('Eventos inicializados com sucesso');
    }
    
    setupExcluirEquipamentoEvent() {
        // Este evento será configurado dinamicamente quando o botão for criado
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('btn-excluir-equipamento')) {
                const equipamentoId = parseInt(e.target.closest('.btn-excluir-equipamento').dataset.id);
                this.excluirEquipamento(equipamentoId);
            }
        });
    }
    
    async carregarDados() {
        console.log('Carregando dados...');
        this.mostrarLoading(true);
        
        try {
            // Verificar se estamos offline
            if (this.offlineMode) {
                console.log('Modo offline, carregando do localStorage');
                await this.carregarDadosLocais();
                return;
            }
            
            // Tentar carregar do servidor
            console.log('Tentando carregar dados do servidor...');
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}/latest`, {
                headers: JSONBIN_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao carregar dados do servidor: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.record && result.record.equipamentos) {
                console.log('Dados carregados do servidor com sucesso');
                this.data = result.record;
                this.equipamentos = this.data.equipamentos;
                
                // Atualizar status baseado nas pendências
                this.equipamentos.forEach((equipamento, index) => {
                    this.atualizarStatusEquipamentoPorPendencias(index);
                });
                
                // Salvar localmente para cache
                localStorage.setItem('gestao_equipamentos_dados', JSON.stringify(this.data));
                
                // Registrar atividade
                if (window.registrarAtividade) {
                    window.registrarAtividade('CARREGAR_DADOS', `Carregou ${this.equipamentos.length} equipamentos do servidor`);
                }
            } else {
                console.warn('Estrutura de dados inválida do servidor, usando dados locais');
                await this.carregarDadosLocais();
            }
            
            this.atualizarStatusSincronizacao(true);
            this.ultimaSincronizacao = new Date().toISOString();
            
            // Atualizar última sincronização
            localStorage.setItem('gestao_equipamentos_ultima_sinc', this.ultimaSincronizacao);
            
            console.log('Dados carregados com sucesso. Total de equipamentos:', this.equipamentos.length);
            
        } catch (error) {
            console.error('Erro ao carregar dados do servidor:', error);
            
            // Fallback para dados locais
            await this.carregarDadosLocais();
            
            this.atualizarStatusSincronizacao(false);
            
            if (!this.offlineMode) {
                this.mostrarMensagem('Erro ao conectar com o servidor. Usando dados locais.', 'error');
            }
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('ERRO_CARREGAR', `Erro ao carregar dados: ${error.message}`);
            }
        } finally {
            this.mostrarLoading(false);
        }
    }
    
    async carregarDadosLocais() {
        try {
            // Tentar carregar do localStorage
            const dadosSalvos = localStorage.getItem('gestao_equipamentos_dados');
            
            if (dadosSalvos) {
                const dados = JSON.parse(dadosSalvos);
                this.data = dados;
                this.equipamentos = dados.equipamentos || [];
                
                console.log('Dados carregados do localStorage. Equipamentos:', this.equipamentos.length);
                
                // Registrar atividade
                if (window.registrarAtividade) {
                    window.registrarAtividade('CARREGAR_DADOS', `Carregou ${this.equipamentos.length} equipamentos do cache local`);
                }
            } else {
                // Usar dados iniciais
                this.data = INITIAL_DATA;
                this.equipamentos = INITIAL_DATA.equipamentos;
                
                console.log('Usando dados iniciais do sistema. Equipamentos:', this.equipamentos.length);
                
                // Registrar atividade
                if (window.registrarAtividade) {
                    window.registrarAtividade('CARREGAR_DADOS', 'Usando dados iniciais do sistema');
                }
            }
            
            // Atualizar status baseado nas pendências
            this.equipamentos.forEach((equipamento, index) => {
                this.atualizarStatusEquipamentoPorPendencias(index);
            });
            
        } catch (error) {
            console.error('Erro ao carregar dados locais:', error);
            
            // Fallback final para dados iniciais
            this.data = INITIAL_DATA;
            this.equipamentos = INITIAL_DATA.equipamentos;
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('ERRO_CARREGAR', 'Erro crítico ao carregar dados. Usando dados iniciais.');
            }
        }
    }
    
    async salvarDados() {
        console.log('Salvando dados...');
        
        // Se estiver offline, salvar apenas localmente
        if (this.offlineMode) {
            console.log('Modo offline, salvando apenas localmente');
            return this.salvarDadosLocais();
        }
        
        try {
            this.atualizarNextIds();
            
            console.log('Enviando dados para o servidor...');
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: JSONBIN_CONFIG.headers,
                body: JSON.stringify(this.data)
            });
            
            if (!response.ok) {
                throw new Error(`Erro ao salvar dados: ${response.status}`);
            }
            
            console.log('Dados salvos no servidor com sucesso');
            this.atualizarStatusSincronizacao(true);
            this.ultimaSincronizacao = new Date().toISOString();
            
            // Atualizar última sincronização
            localStorage.setItem('gestao_equipamentos_ultima_sinc', this.ultimaSincronizacao);
            
            // Salvar localmente também
            this.salvarDadosLocais();
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados no servidor:', error);
            
            // Fallback: salvar localmente
            const salvouLocal = this.salvarDadosLocais();
            
            this.atualizarStatusSincronizacao(false);
            
            if (!this.offlineMode) {
                this.mostrarMensagem('Erro ao salvar dados no servidor. Alterações salvas localmente.', 'error');
            }
            
            // Registrar atividade
            if (window.registrarAtividade) {
                window.registrarAtividade('ERRO_SALVAR', `Erro ao salvar dados: ${error.message}`);
            }
            
            return salvouLocal;
        }
    }
    
    salvarDadosLocais() {
        try {
            this.atualizarNextIds();
            
            // Salvar no localStorage
            localStorage.setItem('gestao_equipamentos_dados', JSON.stringify(this.data));
            
            console.log('Dados salvos localmente com sucesso');
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados localmente:', error);
            return false;
        }
    }
    
    atualizarNextIds() {
        let maxEquipamentoId = 0;
        this.equipamentos.forEach(eqp => {
            if (eqp.id > maxEquipamentoId) maxEquipamentoId = eqp.id;
        });
        this.data.nextEquipamentoId = maxEquipamentoId + 1;
        
        let maxPendenciaId = 0;
        this.equipamentos.forEach(eqp => {
            eqp.pendencias.forEach(pend => {
                if (pend.id > maxPendenciaId) maxPendenciaId = pend.id;
            });
        });
        this.data.nextPendenciaId = maxPendenciaId + 1;
        
        // Atualizar também nextLogId se necessário
        if (this.data.logs) {
            let maxLogId = 0;
            this.data.logs.forEach(log => {
                if (log.id > maxLogId) maxLogId = log.id;
            });
            this.data.nextLogId = maxLogId + 1;
        }
    }
    
    resetarFiltros() {
        document.getElementById('status-filter').value = 'all';
        document.getElementById('pendencia-filter').value = 'all';
        document.getElementById('setor-filter').value = 'all';
        document.getElementById('search').value = '';
        
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: ''
        };
        
        this.renderizarEquipamentos();
    }
    
    filtrarEquipamentos() {
        return this.equipamentos.filter(equipamento => {
            // Filtrar por status
            if (this.filtros.status !== 'all' && equipamento.status !== this.filtros.status) {
                return false;
            }
            
            // Filtrar por pendência
            if (this.filtros.pendencia !== 'all') {
                const temPendenciasAtivas = equipamento.pendencias.some(p => 
                    p.status === 'aberta' || p.status === 'em-andamento'
                );
                
                if (this.filtros.pendencia === 'com-pendencia' && !temPendenciasAtivas) {
                    return false;
                }
                
                if (this.filtros.pendencia === 'sem-pendencia' && temPendenciasAtivas) {
                    return false;
                }
            }
            
            // Filtrar por setor
            if (this.filtros.setor !== 'all' && equipamento.setor !== this.filtros.setor) {
                return false;
            }
            
            // Filtrar por busca
            if (this.filtros.busca) {
                const busca = this.filtros.busca.toLowerCase();
                const nomeMatch = equipamento.nome.toLowerCase().includes(busca);
                const codigoMatch = equipamento.codigo.toLowerCase().includes(busca);
                const descricaoMatch = equipamento.descricao.toLowerCase().includes(busca);
                const setorMatch = (APP_CONFIG.setores[equipamento.setor]?.nome || '').toLowerCase().includes(busca);
                
                if (!nomeMatch && !codigoMatch && !descricaoMatch && !setorMatch) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    renderizarEquipamentos() {
        const container = document.getElementById('equipamentos-container');
        const equipamentosFiltrados = this.filtrarEquipamentos();
        
        console.log(`Renderizando ${equipamentosFiltrados.length} equipamentos (filtrados de ${this.equipamentos.length} total)`);
        
        // Atualizar contador
        const totalElement = document.getElementById('total-filtrado');
        if (totalElement) {
            totalElement.textContent = `(${equipamentosFiltrados.length})`;
        }
        
        if (equipamentosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum equipamento encontrado</h3>
                    <p>Tente ajustar os filtros de busca</p>
                    ${this.equipamentos.length === 0 ? 
                        `<button class="btn-primary" onclick="app.abrirModalEquipamento()">
                            <i class="fas fa-plus"></i> Criar primeiro equipamento
                        </button>` : ''
                    }
                </div>
            `;
            return;
        }
        
        container.className = `equipamentos-container ${this.viewMode}-view`;
        
        container.innerHTML = equipamentosFiltrados.map(equipamento => {
            const temPendenciasAtivas = equipamento.pendencias.some(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            );
            
            const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            );
            
            let classesCard = 'equipamento-card';
            if (equipamento.status === 'nao-apto') classesCard += ' nao-apto';
            if (temPendenciasAtivas) classesCard += ' com-pendencia';
            if (temPendenciasCriticasAbertas) classesCard += ' critica';
            
            const dataInspecao = equipamento.ultimaInspecao ? 
                this.formatarData(equipamento.ultimaInspecao) : 
                'Não registrada';
            
            const setorInfo = APP_CONFIG.setores[equipamento.setor] || { nome: equipamento.setor };
            const setorFormatado = setorInfo.nome || equipamento.setor;
            
            // Contar pendencias
            const pendenciasAbertas = equipamento.pendencias.filter(p => p.status === 'aberta').length;
            const pendenciasAndamento = equipamento.pendencias.filter(p => p.status === 'em-andamento').length;
            const pendenciasResolvidas = equipamento.pendencias.filter(p => p.status === 'resolvida').length;
            const pendenciasCriticas = equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
            
            // Verificar permissões para ações
            const podeCriarPendencia = this.verificarPermissao('criar_pendencias');
            const podeExcluirEquipamento = this.verificarPermissao('excluir_equipamentos');
            const podeEditarEquipamento = this.verificarPermissao('editar_equipamentos');
            
            // Informações de criação/edição
            const criadoPor = equipamento.criadoPor ? 
                `<div class="criado-por" title="Criado por ${equipamento.criadoPor} em ${this.formatarData(equipamento.dataCriacao)}">
                    <small><i class="fas fa-user-plus"></i> ${equipamento.criadoPor}</small>
                </div>` : '';
            
            const editadoPor = equipamento.editadoPor ? 
                `<div class="editado-por" title="Editado por ${equipamento.editadoPor} em ${this.formatarData(equipamento.editadoEm)}">
                    <small><i class="fas fa-user-edit"></i> ${equipamento.editadoPor}</small>
                </div>` : '';
            
            return `
                <div class="${classesCard}" data-id="${equipamento.id}">
                    <div class="equipamento-header">
                        <div class="equipamento-info">
                            <h4>${equipamento.nome}</h4>
                            <div class="equipamento-codigo">${equipamento.codigo}</div>
                        </div>
                        <div class="status-chip ${equipamento.status}" title="${APP_CONFIG.statusEquipamento[equipamento.status]?.descricao || ''}">
                            ${APP_CONFIG.statusEquipamento[equipamento.status]?.nome || equipamento.status}
                            ${temPendenciasCriticasAbertas ? 
                                ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>` : 
                                ''
                            }
                        </div>
                    </div>
                    
                    <p class="equipamento-descricao">${equipamento.descricao}</p>
                    
                    <div class="equipamento-metadata">
                        <div title="${setorFormatado}"><i class="fas fa-building"></i> ${setorFormatado}</div>
                        <div title="Última inspeção: ${dataInspecao}"><i class="fas fa-calendar"></i> ${dataInspecao}</div>
                    </div>
                    
                    ${criadoPor}
                    ${editadoPor}
                    
                    ${equipamento.pendencias.length > 0 ? `
                        <div class="equipamento-pendencias">
                            <strong>Pendências:</strong>
                            ${pendenciasAbertas > 0 ? 
                                `<span class="pendencia-badge aberta" title="${pendenciasAbertas} pendência(s) aberta(s)">${pendenciasAbertas} Aberta(s)</span>` : 
                                ''
                            }
                            ${pendenciasAndamento > 0 ? 
                                `<span class="pendencia-badge em-andamento" title="${pendenciasAndamento} pendência(s) em andamento">${pendenciasAndamento} Em Andamento</span>` : 
                                ''
                            }
                            ${pendenciasResolvidas > 0 ? 
                                `<span class="pendencia-badge resolvida" title="${pendenciasResolvidas} pendência(s) resolvida(s)">${pendenciasResolvidas} Resolvida(s)</span>` : 
                                ''
                            }
                            ${pendenciasCriticas > 0 ? 
                                `<span class="pendencia-badge critica" title="${pendenciasCriticas} pendência(s) crítica(s)">${pendenciasCriticas} Crítica(s)</span>` : 
                                ''
                            }
                        </div>
                    ` : ''}
                    
                    <div class="equipamento-actions">
                        <button class="action-btn secondary btn-detalhes" data-id="${equipamento.id}" title="Ver detalhes do equipamento">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                        ${podeEditarEquipamento || podeCriarPendencia ? `
                            <button class="action-btn primary btn-pendencia" data-id="${equipamento.id}" 
                                    ${!podeCriarPendencia ? 'disabled title="Sem permissão para criar pendências"' : 'title="Adicionar nova pendência"'}>
                                <i class="fas fa-plus-circle"></i> Pendência
                            </button>
                        ` : ''}
                        ${podeExcluirEquipamento ? `
                            <button class="action-btn danger btn-excluir-equipamento" data-id="${equipamento.id}" 
                                    title="Excluir equipamento">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar estilos para botão de excluir
        const styleId = 'estilos-dinamicos-equipamentos';
        if (!document.querySelector(`#${styleId}`)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .action-btn.danger {
                    background-color: var(--cor-erro);
                    color: white;
                    border: 1px solid var(--cor-erro);
                }
                
                .action-btn.danger:hover {
                    background-color: #c0392b;
                    transform: translateY(-2px);
                }
                
                .criado-por, .editado-por {
                    margin-top: 8px;
                    font-size: 12px;
                    color: var(--cor-texto-secundario);
                }
                
                .criado-por i, .editado-por i {
                    margin-right: 5px;
                }
                
                .equipamento-pendencias {
                    margin-top: 10px;
                    display: flex;
                    flex-wrap: wrap;
                    gap: 5px;
                }
                
                .pendencia-badge {
                    padding: 2px 8px;
                    border-radius: 10px;
                    font-size: 11px;
                    font-weight: bold;
                }
                
                .pendencia-badge.aberta {
                    background-color: rgba(243, 156, 18, 0.1);
                    color: #f39c12;
                    border: 1px solid rgba(243, 156, 18, 0.2);
                }
                
                .pendencia-badge.em-andamento {
                    background-color: rgba(52, 152, 219, 0.1);
                    color: #3498db;
                    border: 1px solid rgba(52, 152, 219, 0.2);
                }
                
                .pendencia-badge.resolvida {
                    background-color: rgba(46, 204, 113, 0.1);
                    color: #27ae60;
                    border: 1px solid rgba(46, 204, 113, 0.2);
                }
                
                .pendencia-badge.critica {
                    background-color: rgba(231, 76, 60, 0.1);
                    color: #e74c3c;
                    border: 1px solid rgba(231, 76, 60, 0.2);
                    animation: pulse 2s infinite;
                }
                
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.7; }
                    100% { opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }
        
        // Adicionar eventos
        container.querySelectorAll('.btn-detalhes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.btn-detalhes').dataset.id);
                this.verDetalhesEquipamento(id);
            });
        });
        
        container.querySelectorAll('.btn-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                if (btn.disabled) return;
                
                const id = parseInt(e.target.closest('.btn-pendencia').dataset.id);
                this.abrirModalPendencia(id);
            });
        });
        
        container.querySelectorAll('.btn-excluir-equipamento').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.btn-excluir-equipamento').dataset.id);
                this.excluirEquipamento(id);
            });
        });
    }
    
    atualizarEstatisticas() {
        const totalEquipamentos = this.equipamentos.length;
        const aptosOperar = this.equipamentos.filter(e => e.status === 'apto').length;
        const naoAptos = this.equipamentos.filter(e => e.status === 'nao-apto').length;
        
        let totalPendenciasAtivas = 0;
        let totalPendenciasCriticas = 0;
        let totalPendencias = 0;
        
        this.equipamentos.forEach(equipamento => {
            const pendenciasAtivas = equipamento.pendencias.filter(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            );
            const pendenciasCriticas = equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            );
            
            totalPendenciasAtivas += pendenciasAtivas.length;
            totalPendenciasCriticas += pendenciasCriticas.length;
            totalPendencias += equipamento.pendencias.length;
        });
        
        // Atualizar elementos da interface
        document.getElementById('total-equipamentos').textContent = totalEquipamentos;
        document.getElementById('aptos-operar').textContent = aptosOperar;
        document.getElementById('nao-aptos').textContent = naoAptos;
        document.getElementById('total-pendencias').textContent = totalPendenciasAtivas;
        
        // Destacar se houver pendências críticas
        const pendenciasElement = document.getElementById('total-pendencias');
        if (totalPendenciasCriticas > 0) {
            pendenciasElement.style.color = 'var(--cor-erro)';
            pendenciasElement.style.fontWeight = 'bold';
            pendenciasElement.title = `${totalPendenciasAtivas} pendências ativas (${totalPendenciasCriticas} críticas)`;
            
            // Adicionar ícone de alerta
            if (!pendenciasElement.querySelector('.fa-exclamation-triangle')) {
                const icon = document.createElement('i');
                icon.className = 'fas fa-exclamation-triangle';
                icon.style.marginLeft = '5px';
                pendenciasElement.appendChild(icon);
            }
        } else {
            pendenciasElement.style.color = '';
            pendenciasElement.style.fontWeight = '';
            pendenciasElement.title = `${totalPendenciasAtivas} pendências ativas`;
            
            // Remover ícone de alerta se existir
            const icon = pendenciasElement.querySelector('.fa-exclamation-triangle');
            if (icon) {
                icon.remove();
            }
        }
        
        console.log(`Estatísticas atualizadas: ${totalEquipamentos} equipamentos, ${aptosOperar} aptos, ${naoAptos} não aptos, ${totalPendenciasAtivas} pendencias ativas (${totalPendenciasCriticas} críticas)`);
    }
    
    atualizarStatusSincronizacao(conectado) {
        const statusIndicator = document.getElementById('sync-status');
        if (!statusIndicator) return;
        
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (conectado) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Conectado';
            statusText.style.color = 'var(--cor-sucesso)';
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = this.offlineMode ? 'Offline' : 'Desconectado';
            statusText.style.color = this.offlineMode ? 'var(--cor-alerta)' : 'var(--cor-erro)';
        }
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        document.getElementById('view-list').classList.toggle('active', mode === 'list');
        document.getElementById('view-grid').classList.toggle('active', mode === 'grid');
        
        this.renderizarEquipamentos();
        
        // Salvar preferência
        localStorage.setItem('gestao_equipamentos_view_mode', mode);
    }
    
    abrirModalEquipamento(equipamentoId = null) {
        const modal = this.modals.equipamento;
        const form = document.getElementById('equipamento-form');
        const titulo = document.getElementById('modal-title');
        
        if (equipamentoId) {
            // Modo edição
            const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
            if (!equipamento) return;
            
            titulo.textContent = 'Editar Equipamento';
            
            document.getElementById('equipamento-codigo').value = equipamento.codigo;
            document.getElementById('equipamento-nome').value = equipamento.nome;
            document.getElementById('equipamento-descricao').value = equipamento.descricao;
            document.getElementById('equipamento-setor').value = equipamento.setor;
            document.getElementById('equipamento-ultima-inspecao').value = equipamento.ultimaInspecao || '';
            
            // Status será determinado automaticamente
            this.atualizarDisplayStatusEquipamento(equipamento);
            
            form.dataset.editId = equipamentoId;
        } else {
            // Modo criação
            titulo.textContent = 'Novo Equipamento';
            form.reset();
            
            // Definir valores padrão
            document.getElementById('equipamento-setor').value = 'moagem-moagem';
            
            // Data padrão para hoje
            const hoje = new Date().toISOString().split('T')[0];
            document.getElementById('equipamento-ultima-inspecao').value = hoje;
            
            this.atualizarDisplayStatusEquipamento();
            
            delete form.dataset.editId;
        }
        
        modal.classList.add('active');
        
        // Focar no primeiro campo
        setTimeout(() => {
            document.getElementById('equipamento-codigo').focus();
        }, 100);
    }
    
    abrirModalPendencia(equipamentoId = null) {
        const modal = this.modals.pendencia;
        const form = document.getElementById('pendencia-form');
        const titulo = document.getElementById('pendencia-modal-title');
        
        if (!equipamentoId && this.equipamentoSelecionado) {
            equipamentoId = this.equipamentoSelecionado.id;
        }
        
        if (!equipamentoId) {
            this.mostrarMensagem('Selecione um equipamento primeiro', 'error');
            return;
        }
        
        titulo.textContent = 'Nova Pendência';
        form.reset();
        
        // Definir valores padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('pendencia-data').value = hoje;
        document.getElementById('pendencia-responsavel').value = 'Elétrica';
        document.getElementById('pendencia-prioridade').value = 'media';
        document.getElementById('pendencia-status').value = 'aberta';
        document.getElementById('pendencia-equipamento-id').value = equipamentoId;
        
        // Limpar ID de edição se existir
        delete form.dataset.editId;
        
        modal.classList.add('active');
        
        // Focar no primeiro campo
        setTimeout(() => {
            document.getElementById('pendencia-titulo').focus();
        }, 100);
    }
    
    atualizarDisplayStatusEquipamento(equipamento = null) {
        const statusDisplay = document.getElementById('equipamento-status-display');
        if (!statusDisplay) return;
        
        if (equipamento) {
            const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            );
            
            const status = temPendenciasCriticasAbertas ? 'nao-apto' : 'apto';
            const statusInfo = APP_CONFIG.statusEquipamento[status] || { nome: status, cor: '#95a5a6' };
            const classeStatus = status === 'apto' ? 'status-chip apto' : 'status-chip nao-apto';
            
            statusDisplay.innerHTML = `<span class="${classeStatus}">${statusInfo.nome}</span>`;
            
            if (temPendenciasCriticasAbertas) {
                const pendenciasCriticas = equipamento.pendencias.filter(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                ).length;
                
                statusDisplay.innerHTML += `
                    <div class="status-info">
                        <small><i class="fas fa-exclamation-triangle"></i> 
                        ${pendenciasCriticas} pendência(s) crítica(s) aberta(s)</small>
                    </div>
                `;
            }
        } else {
            const statusInfo = APP_CONFIG.statusEquipamento['apto'] || { nome: 'Apto a Operar', cor: '#2ecc71' };
            statusDisplay.innerHTML = `<span class="status-chip apto">${statusInfo.nome}</span>`;
        }
    }
    
    atualizarStatusEquipamentoPorPendencias(equipamentoIndex) {
        const equipamento = this.equipamentos[equipamentoIndex];
        
        const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        );
        
        if (temPendenciasCriticasAbertas) {
            equipamento.status = 'nao-apto';
        } else {
            equipamento.status = 'apto';
        }
    }
    
    async salvarEquipamento() {
        const form = document.getElementById('equipamento-form');
        const isEdit = form.dataset.editId;
        
        const equipamento = {
            codigo: document.getElementById('equipamento-codigo').value.trim(),
            nome: document.getElementById('equipamento-nome').value.trim(),
            descricao: document.getElementById('equipamento-descricao').value.trim(),
            setor: document.getElementById('equipamento-setor').value,
            status: 'apto',
            ultimaInspecao: document.getElementById('equipamento-ultima-inspecao').value || null,
            pendencias: []
        };
        
        console.log('Salvando equipamento:', equipamento);
        
        // Validação
        if (!equipamento.codigo || !equipamento.nome) {
            this.mostrarMensagem('Código e nome são obrigatórios', 'error');
            return;
        }
        
        if (!equipamento.setor) {
            this.mostrarMensagem('Selecione um setor', 'error');
            return;
        }
        
        let acaoLog = '';
        let detalhesLog = '';
        
        if (isEdit) {
            // Atualizar equipamento existente
            const id = parseInt(isEdit);
            const index = this.equipamentos.findIndex(e => e.id === id);
            
            if (index !== -1) {
                // Registrar quem editou
                equipamento.editadoPor = this.usuarioAtual;
                equipamento.editadoEm = new Date().toISOString();
                
                // Manter dados existentes
                equipamento.id = id;
                equipamento.pendencias = this.equipamentos[index].pendencias;
                equipamento.dataCriacao = this.equipamentos[index].dataCriacao;
                equipamento.criadoPor = this.equipamentos[index].criadoPor || this.usuarioAtual;
                
                // Atualizar status baseado nas pendências
                const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                );
                equipamento.status = temPendenciasCriticasAbertas ? 'nao-apto' : 'apto';
                
                this.equipamentos[index] = equipamento;
                
                // Registrar log
                acaoLog = 'EDITAR_EQUIPAMENTO';
                detalhesLog = `Editou equipamento: ${equipamento.codigo} - ${equipamento.nome}`;
                
                this.mostrarMensagem('Equipamento atualizado com sucesso', 'success');
                console.log('Equipamento editado:', equipamento);
            }
        } else {
            // Criar novo equipamento
            equipamento.id = this.data.nextEquipamentoId++;
            equipamento.dataCriacao = new Date().toISOString().split('T')[0];
            equipamento.criadoPor = this.usuarioAtual;
            
            this.equipamentos.push(equipamento);
            
            // Registrar log
            acaoLog = 'CRIAR_EQUIPAMENTO';
            detalhesLog = `Criou equipamento: ${equipamento.codigo} - ${equipamento.nome}`;
            
            this.mostrarMensagem('Equipamento criado com sucesso', 'success');
            console.log('Novo equipamento criado:', equipamento);
        }
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Registrar log de auditoria
        if (acaoLog && window.registrarLogAuditoria) {
            window.registrarLogAuditoria(acaoLog, detalhesLog, equipamento.id);
        }
        
        // Fechar modal e atualizar
        this.fecharModal(this.modals.equipamento);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        this.atualizarEstadoBotaoPendencia();
    }
    
    async excluirEquipamento(id) {
        const equipamento = this.equipamentos.find(e => e.id === id);
        if (!equipamento) return;
        
        // Verificar permissão
        const podeExcluir = this.verificarPermissao('excluir_equipamentos');
        if (!podeExcluir) {
            this.mostrarMensagem('Você não tem permissão para excluir equipamentos', 'error');
            return;
        }
        
        if (!confirm(`Tem certeza que deseja excluir o equipamento "${equipamento.nome}" (${equipamento.codigo})?\n\nEsta ação não pode ser desfeita.`)) {
            return;
        }
        
        // Remover equipamento
        const index = this.equipamentos.findIndex(e => e.id === id);
        this.equipamentos.splice(index, 1);
        
        // Registrar log de auditoria
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'EXCLUIR_EQUIPAMENTO',
                `Excluiu equipamento: ${equipamento.codigo} - ${equipamento.nome}`,
                id
            );
        }
        
        // Salvar dados
        await this.salvarDados();
        
        // Atualizar interface
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        
        // Fechar modal de detalhes se estiver aberto
        if (this.equipamentoSelecionado && this.equipamentoSelecionado.id === id) {
            this.fecharModal(this.modals.detalhes);
            this.equipamentoSelecionado = null;
        }
        
        this.mostrarMensagem('Equipamento excluído com sucesso', 'success');
        console.log('Equipamento excluído:', equipamento);
    }
    
    async salvarPendencia() {
        const form = document.getElementById('pendencia-form');
        const equipamentoId = parseInt(document.getElementById('pendencia-equipamento-id').value);
        const isEdit = form.dataset.editId;
        
        const pendencia = {
            titulo: document.getElementById('pendencia-titulo').value.trim(),
            descricao: document.getElementById('pendencia-descricao').value.trim(),
            responsavel: document.getElementById('pendencia-responsavel').value,
            prioridade: document.getElementById('pendencia-prioridade').value,
            data: document.getElementById('pendencia-data').value || new Date().toISOString().split('T')[0],
            status: document.getElementById('pendencia-status').value
        };
        
        console.log('Salvando pendência:', pendencia);
        
        // Validação
        if (!pendencia.titulo || !pendencia.descricao || !pendencia.responsavel) {
            this.mostrarMensagem('Título, descrição e responsável são obrigatórios', 'error');
            return;
        }
        
        // Encontrar equipamento
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === equipamentoId);
        if (equipamentoIndex === -1) {
            this.mostrarMensagem('Equipamento não encontrado', 'error');
            return;
        }
        
        let acaoLog = '';
        let detalhesLog = '';
        
        if (isEdit) {
            // Atualizar pendência existente
            const pendenciaId = parseInt(isEdit);
            const pendenciaIndex = this.equipamentos[equipamentoIndex].pendencias.findIndex(p => p.id === pendenciaId);
            
            if (pendenciaIndex !== -1) {
                // Registrar quem editou
                pendencia.editadoPor = this.usuarioAtual;
                pendencia.editadoEm = new Date().toISOString();
                
                pendencia.id = pendenciaId;
                pendencia.criadoPor = this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex].criadoPor || this.usuarioAtual;
                pendencia.criadoEm = this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex].criadoEm;
                
                this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex] = pendencia;
                
                // Registrar log
                acaoLog = 'EDITAR_PENDENCIA';
                detalhesLog = `Editou pendência: "${pendencia.titulo}" no equipamento ${this.equipamentos[equipamentoIndex].codigo}`;
                
                this.mostrarMensagem('Pendência atualizada com sucesso', 'success');
                console.log('Pendência editada:', pendencia);
            }
        } else {
            // Criar nova pendência
            pendencia.id = this.data.nextPendenciaId++;
            pendencia.criadoPor = this.usuarioAtual;
            pendencia.criadoEm = new Date().toISOString();
            
            this.equipamentos[equipamentoIndex].pendencias.push(pendencia);
            
            // Registrar log
            acaoLog = 'CRIAR_PENDENCIA';
            detalhesLog = `Criou pendência: "${pendencia.titulo}" no equipamento ${this.equipamentos[equipamentoIndex].codigo}`;
            
            this.mostrarMensagem('Pendência registrada com sucesso', 'success');
            console.log('Nova pendência criada:', pendencia);
        }
        
        // Atualizar status do equipamento
        this.atualizarStatusEquipamentoPorPendencias(equipamentoIndex);
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Registrar log de auditoria
        if (acaoLog && window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                acaoLog, 
                detalhesLog, 
                equipamentoId,
                pendencia.id
            );
        }
        
        // Fechar modal e atualizar
        this.fecharModal(this.modals.pendencia);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        
        // Atualizar modal de detalhes se estiver aberto
        if (this.equipamentoSelecionado && this.equipamentoSelecionado.id === equipamentoId) {
            this.renderizarPendenciasDetalhes(this.equipamentoSelecionado.pendencias);
        }
    }
    
   // ===========================================
// ADICIONE ESTE CÓDIGO NO FINAL DO app.js
// (Após o trecho incompleto da função verDetalhesEquipamento)
// ===========================================

    verDetalhesEquipamento(id) {
        const equipamento = this.equipamentos.find(e => e.id === id);
        if (!equipamento) return;
        
        this.equipamentoSelecionado = equipamento;
        
        // Preencher informações
        document.getElementById('detalhes-titulo').textContent = `Detalhes: ${equipamento.nome}`;
        document.getElementById('detalhes-nome').textContent = equipamento.nome;
        document.getElementById('detalhes-codigo').textContent = `Código: ${equipamento.codigo}`;
        document.getElementById('detalhes-descricao').textContent = equipamento.descricao;
        
        const setorInfo = APP_CONFIG.setores[equipamento.setor] || { nome: equipamento.setor };
        document.getElementById('detalhes-setor').textContent = setorInfo.nome;
        
        document.getElementById('detalhes-inspecao').textContent = equipamento.ultimaInspecao ? 
            this.formatarData(equipamento.ultimaInspecao) : 'Não registrada';
        
        // Informações de criação
        const criadoPor = equipamento.criadoPor ? 
            `Criado por ${equipamento.criadoPor} em ${this.formatarData(equipamento.dataCriacao)}` : 
            'Data de criação não disponível';
        document.getElementById('detalhes-criacao').innerHTML = `<small><i class="fas fa-info-circle"></i> ${criadoPor}</small>`;
        
        // Atualizar status
        const statusInfo = APP_CONFIG.statusEquipamento[equipamento.status] || { nome: equipamento.status, cor: '#95a5a6' };
        const statusElement = document.getElementById('detalhes-status');
        statusElement.textContent = statusInfo.nome;
        statusElement.className = `status-chip ${equipamento.status}`;
        statusElement.style.backgroundColor = statusInfo.cor;
        
        // Renderizar pendencias
        this.renderizarPendenciasDetalhes(equipamento.pendencias);
        
        // Abrir modal
        this.modals.detalhes.classList.add('active');
    }
    
    renderizarPendenciasDetalhes(pendencias) {
        const container = document.getElementById('detalhes-pendencias');
        
        if (!pendencias || pendencias.length === 0) {
            container.innerHTML = `
                <div class="no-pendencias">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhuma pendência registrada para este equipamento</p>
                </div>
            `;
            return;
        }
        
        container.innerHTML = pendencias.map(pendencia => {
            const prioridadeInfo = APP_CONFIG.prioridades[pendencia.prioridade] || { nome: pendencia.prioridade, cor: '#95a5a6' };
            const statusInfo = APP_CONFIG.statusPendencia[pendencia.status] || { nome: pendencia.status, cor: '#95a5a6' };
            
            return `
                <div class="pendencia-detalhes ${pendencia.prioridade}">
                    <div class="pendencia-header">
                        <h5>${pendencia.titulo}</h5>
                        <div class="pendencia-status ${pendencia.status}">
                            ${statusInfo.nome}
                        </div>
                    </div>
                    <p class="pendencia-descricao">${pendencia.descricao}</p>
                    <div class="pendencia-metadata">
                        <div><i class="fas fa-user"></i> Responsável: ${pendencia.responsavel}</div>
                        <div><i class="fas fa-calendar"></i> Data: ${this.formatarData(pendencia.data)}</div>
                        <div><i class="fas fa-exclamation-circle" style="color: ${prioridadeInfo.cor}"></i> 
                            Prioridade: ${prioridadeInfo.nome}
                        </div>
                        <div><i class="fas fa-user-clock"></i> Criado por: ${pendencia.criadoPor || 'Sistema'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    exportarDadosExcel() {
        // Verificar permissão
        if (!this.verificarPermissao('exportar_dados')) {
            this.mostrarMensagem('Você não tem permissão para exportar dados', 'error');
            return;
        }
        
        try {
            let csv = 'Código,Nome,Descrição,Setor,Status,Última Inspeção,Pendências Ativas\n';
            
            this.equipamentos.forEach(equipamento => {
                const pendenciasAtivas = equipamento.pendencias.filter(p => 
                    p.status === 'aberta' || p.status === 'em-andamento'
                ).length;
                
                csv += `"${equipamento.codigo}","${equipamento.nome}","${equipamento.descricao}",`;
                csv += `"${APP_CONFIG.setores[equipamento.setor]?.nome || equipamento.setor}","${equipamento.status}",`;
                csv += `"${equipamento.ultimaInspecao || 'N/A'}","${pendenciasAtivas}"\n`;
            });
            
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const dataAtual = new Date().toISOString().split('T')[0];
            
            link.href = URL.createObjectURL(blob);
            link.download = `equipamentos_${dataAtual}_${this.usuarioAtual}.csv`;
            link.click();
            URL.revokeObjectURL(link.href);
            
            this.mostrarMensagem('Dados exportados com sucesso', 'success');
            
            // Registrar log
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria('EXPORTAR_DADOS', 'Exportou dados para CSV');
            }
        } catch (error) {
            console.error('Erro ao exportar dados:', error);
            this.mostrarMensagem('Erro ao exportar dados', 'error');
        }
    }
    
    async sincronizarDados() {
        if (this.sincronizando) return;
        
        this.sincronizando = true;
        this.mostrarMensagem('Sincronizando dados...', 'info');
        
        try {
            // Se offline, apenas salvar localmente
            if (this.offlineMode) {
                this.salvarDadosLocais();
                this.mostrarMensagem('Modo offline: dados salvos localmente', 'warning');
                return;
            }
            
            // Sincronizar com o servidor
            const salvou = await this.salvarDados();
            
            if (salvou) {
                this.mostrarMensagem('Dados sincronizados com sucesso', 'success');
                
                // Registrar log
                if (window.registrarLogAuditoria) {
                    window.registrarLogAuditoria('SINCRONIZAR_DADOS', 'Sincronizou dados com o servidor');
                }
            }
        } catch (error) {
            console.error('Erro na sincronização:', error);
            this.mostrarMensagem('Erro ao sincronizar dados', 'error');
        } finally {
            this.sincronizando = false;
        }
    }
    
    sincronizarUsuariosEmBackground() {
        if (!this.verificarPermissao('gerenciar_usuarios') || this.offlineMode) {
            return;
        }
        
        console.log('Sincronizando usuários em background...');
    }
    
    fecharModal(modal) {
        modal.classList.remove('active');
    }
    
    fecharTodosModais() {
        Object.values(this.modals).forEach(modal => {
            modal.classList.remove('active');
        });
    }
    
    mostrarLoading(mostrar) {
        const loadingElement = document.querySelector('.loading');
        if (loadingElement) {
            if (mostrar) {
                loadingElement.style.display = 'flex';
            } else {
                loadingElement.style.display = 'none';
            }
        }
    }
    
    mostrarMensagem(texto, tipo = 'info') {
        // Remover mensagens anteriores
        const mensagensAntigas = document.querySelectorAll('.mensagem-flutuante');
        mensagensAntigas.forEach(msg => msg.remove());
        
        const cores = {
            success: '#2ecc71',
            error: '#e74c3c',
            warning: '#f39c12',
            info: '#3498db'
        };
        
        const icones = {
            success: 'fas fa-check-circle',
            error: 'fas fa-exclamation-circle',
            warning: 'fas fa-exclamation-triangle',
            info: 'fas fa-info-circle'
        };
        
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-flutuante ${tipo}`;
        mensagem.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${cores[tipo] || '#3498db'};
            color: white;
            padding: 15px 20px;
            border-radius: 5px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
            z-index: 10000;
            display: flex;
            align-items: center;
            gap: 10px;
            min-width: 300px;
            max-width: 500px;
            transform: translateX(100%);
            opacity: 0;
            transition: all 0.3s ease-out;
        `;
        
        mensagem.innerHTML = `
            <i class="${icones[tipo] || 'fas fa-info-circle'}"></i>
            <span>${texto}</span>
        `;
        
        document.body.appendChild(mensagem);
        
        // Animar entrada
        setTimeout(() => {
            mensagem.style.transform = 'translateX(0)';
            mensagem.style.opacity = '1';
        }, 10);
        
        // Remover após 5 segundos
        setTimeout(() => {
            mensagem.style.transform = 'translateX(100%)';
            mensagem.style.opacity = '0';
            
            setTimeout(() => {
                if (mensagem.parentNode) {
                    mensagem.remove();
                }
            }, 300);
        }, 5000);
    }
    
    atualizarEstadoBotaoPendencia() {
        const btnPendencia = document.getElementById('add-pendencia');
        if (!btnPendencia) return;
        
        if (this.equipamentos.length === 0) {
            btnPendencia.disabled = true;
            btnPendencia.title = 'Crie um equipamento primeiro';
        } else if (!this.verificarPermissao('criar_pendencias')) {
            btnPendencia.disabled = true;
            btnPendencia.title = 'Você não tem permissão para criar pendências';
        } else {
            btnPendencia.disabled = false;
            btnPendencia.title = 'Adicionar nova pendência';
        }
    }
    
    configurarAtualizacoes() {
        // Atualizar estatísticas periodicamente
        setInterval(() => {
            this.atualizarEstatisticas();
        }, 60000); // A cada minuto
        
        // Sincronização automática se online
        if (APP_CONFIG.appSettings.sincronizacaoAutomatica) {
            setInterval(() => {
                if (navigator.onLine && !this.sincronizando) {
                    this.sincronizarDados();
                }
            }, APP_CONFIG.appSettings.sincronizacaoForcadaIntervalo * 60 * 1000);
        }
    }
    
    formatarData(dataString, incluirHora = false) {
        if (!dataString) return 'Não informada';
        
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) return dataString;
            
            if (incluirHora) {
                return data.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                });
            } else {
                return data.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                });
            }
        } catch (e) {
            console.warn('Erro ao formatar data:', dataString, e);
            return dataString;
        }
    }
}

// ===========================================
// INICIALIZAÇÃO DA APLICAÇÃO
// ===========================================

// Criar instância global da aplicação
let app;

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', async function() {
    try {
        console.log('DOM carregado, inicializando aplicação...');
        app = new EquipamentosApp();
        window.app = app; // Torna acessível globalmente
        
        // Salvar referência para uso no console
        console.log('Aplicação inicializada. Use "app" no console para acessar.');
    } catch (error) {
        console.error('Erro crítico ao inicializar a aplicação:', error);
        alert('Erro ao inicializar o sistema. Por favor, recarregue a página.');
    }
});
