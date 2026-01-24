// Aplicação de Gestão de Equipamentos
class EquipamentosApp {
    constructor() {
        this.data = null;
        this.equipamentos = [];
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            busca: ''
        };
        this.equipamentoSelecionado = null;
        this.viewMode = 'grid'; // 'grid' ou 'list'
        this.modals = {};
        
        // Novo: Sistema de autenticação
        this.usuarioLogado = null;
        this.sessaoAtiva = null;
        
        this.init();
    }
    
async init() {
    try {
        // Primeiro, carregar os dados (incluindo usuários)
        await this.carregarDados(true);
        
        // Depois, verificar se há sessão ativa
        await this.verificarSessao();
        
        // Se não houver usuário logado, mostrar tela de login
        if (!this.usuarioLogado) {
            this.mostrarTelaLogin();
            return;
        }
        
        // Se estiver logado, continuar com a inicialização normal
        this.inicializarAplicacao();
    } catch (error) {
        console.error('Erro na inicialização:', error);
        // Mostrar tela de login mesmo com erro
        this.mostrarTelaLogin();
    }
}  

    async verificarSessao() {
    try {
        // Verificar se há token no localStorage
        const token = localStorage.getItem('equipamentos_token');
        if (!token) {
            return;
        }
        
        // Verificar se há sessão ativa nos dados
        if (this.data.sessoesAtivas && this.data.sessoesAtivas.length > 0) {
            const sessao = this.data.sessoesAtivas.find(s => s.token === token);
            
            if (sessao) {
                // Verificar se a sessão ainda é válida
                const validade = new Date(sessao.validade);
                const agora = new Date();
                
                if (agora < validade) {
                    // Encontrar o usuário correspondente
                    const usuario = this.data.usuarios.find(u => u.id === sessao.usuarioId);
                    
                    if (usuario && usuario.ativo) {
                        this.usuarioLogado = usuario;
                        this.sessaoAtiva = sessao;
                        console.log('Sessão restaurada para:', usuario.nome);
                        return;
                    }
                } else {
                    // Sessão expirada - remover
                    this.data.sessoesAtivas = this.data.sessoesAtivas.filter(s => s.token !== token);
                    await this.salvarDados();
                    localStorage.removeItem('equipamentos_token');
                }
            }
        }
    } catch (error) {
        console.error('Erro ao verificar sessão:', error);
    }
}
    
    mostrarTelaLogin() {
        // Limpar conteúdo do container principal
        document.body.innerHTML = `
            <div class="login-container">
                <div class="login-card">
                    <div class="login-header">
                        <h1><i class="fas fa-industry"></i> Gestão de Equipamentos</h1>
                        <p class="subtitle">Sistema de Gestão - Usina</p>
                    </div>
                    
                    <form id="login-form" class="login-form">
                        <div class="form-group">
                            <label for="login-username"><i class="fas fa-user"></i> Usuário</label>
                            <input type="text" id="login-username" placeholder="Digite seu usuário" required>
                        </div>
                        
                        <div class="form-group">
                            <label for="login-password"><i class="fas fa-lock"></i> Senha</label>
                            <input type="password" id="login-password" placeholder="Digite sua senha" required>
                        </div>
                        
                        <div class="form-group remember-me">
                            <input type="checkbox" id="remember-me">
                            <label for="remember-me">Manter conectado</label>
                        </div>
                        
                        <button type="submit" class="btn-login">
                            <i class="fas fa-sign-in-alt"></i> Entrar
                        </button>
                        
                        <div class="login-footer">
                            <p>Entre com suas credenciais para acessar o sistema</p>
                            <p class="demo-credentials">
                                <strong>Credenciais de demonstração:</strong><br>
                                admin / admin123<br>
                                supervisor / sup123<br>
                                tecnico / tec123<br>
                                visualizador / vis123
                            </p>
                        </div>
                    </form>
                    
                    <div class="login-message" id="login-message"></div>
                </div>
                
                <div class="login-info">
                    <h3><i class="fas fa-info-circle"></i> Sobre o Sistema</h3>
                    <p>Sistema de gestão de equipamentos da usina, com controle de status operacional e registro de pendências.</p>
                    
                    <div class="roles-info">
                        <h4>Níveis de Acesso:</h4>
                        <div class="role-item">
                            <span class="role-badge administrador">Administrador</span>
                            <p>Acesso completo a todas as funcionalidades</p>
                        </div>
                        <div class="role-item">
                            <span class="role-badge supervisor">Supervisor</span>
                            <p>Pode criar e editar, mas não excluir registros</p>
                        </div>
                        <div class="role-item">
                            <span class="role-badge tecnico">Técnico</span>
                            <p>Pode criar pendências apenas em seu setor</p>
                        </div>
                        <div class="role-item">
                            <span class="role-badge visualizador">Visualizador</span>
                            <p>Apenas visualização dos dados</p>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        // Adicionar estilos para a tela de login
        this.adicionarEstilosLogin();
        
        // Adicionar evento ao formulário de login
        document.getElementById('login-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            await this.realizarLogin();
        });
    
    
    
    
    async realizarLogin() {
        const username = document.getElementById('login-username').value.trim();
        const password = document.getElementById('login-password').value.trim();
        const rememberMe = document.getElementById('remember-me').checked;
        
        const messageDiv = document.getElementById('login-message');
        messageDiv.className = 'login-message';
        
        if (!username || !password) {
            messageDiv.textContent = 'Por favor, preencha todos os campos.';
            messageDiv.classList.add('error');
            return;
        }
        
        try {
            // Encontrar usuário
            const usuario = this.data.usuarios?.find(u => 
                u.username === username && 
                u.password === password && 
                u.ativo === true
            );
            
            if (!usuario) {
                messageDiv.textContent = 'Usuário ou senha inválidos.';
                messageDiv.classList.add('error');
                return;
            }
            
            // Criar sessão
            const token = this.gerarToken();
            const validade = new Date();
            validade.setHours(validade.getHours() + 24); // Sessão de 24 horas
            
            const sessao = {
                id: Date.now(),
                usuarioId: usuario.id,
                token: token,
                dataLogin: new Date().toISOString(),
                validade: validade.toISOString(),
                rememberMe: rememberMe
            };
            
            // Adicionar sessão
            if (!this.data.sessoesAtivas) {
                this.data.sessoesAtivas = [];
            }
            this.data.sessoesAtivas.push(sessao);
            
            // Salvar dados
            await this.salvarDados();
            
            // Salvar token no localStorage
            if (rememberMe) {
                localStorage.setItem('equipamentos_token', token);
            }
            
            // Atualizar estado da aplicação
            this.usuarioLogado = usuario;
            this.sessaoAtiva = sessao;
            
            // Mostrar mensagem de sucesso
            messageDiv.textContent = `Bem-vindo, ${usuario.nome}! Redirecionando...`;
            messageDiv.classList.add('success');
            
            // Redirecionar para a aplicação
            setTimeout(() => {
                this.inicializarAplicacao();
            }, 1000);
            
        } catch (error) {
            console.error('Erro no login:', error);
            messageDiv.textContent = 'Erro ao realizar login. Tente novamente.';
            messageDiv.classList.add('error');
        }
    }
    
    gerarToken() {
        return 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    inicializarAplicacao() {
    // Atualizar interface com informações do usuário
    this.atualizarInterfaceUsuario();
    
    // Carregar CSS principal
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = 'style.css';
    document.head.appendChild(link);
    
    // Inicializar modais
    this.initModals();
    
    // Inicializar eventos
    this.initEvents();
    
    // Renderizar equipamentos
    this.renderizarEquipamentos();
    
    // Atualizar estatísticas
    this.atualizarEstatisticas();
    
    // Atualizar status da sincronização
    this.atualizarStatusSincronizacao(true);
}
    
    atualizarInterfaceUsuario() {
        // Recarregar a página com a aplicação completa
        document.body.innerHTML = `
            <div class="container">
                <header>
                    <div class="header-top">
                        <div class="app-title">
                            <h1><i class="fas fa-industry"></i> Gestão de Equipamentos - Usina</h1>
                            <p class="subtitle">Controle de 300 equipamentos | Status operacional e pendências</p>
                        </div>
                        <div class="user-info" id="user-info">
                            <!-- Será preenchido dinamicamente -->
                        </div>
                    </div>
                    
                    <div class="stats-bar">
                        <div class="stat">
                            <span class="stat-value" id="total-equipamentos">0</span>
                            <span class="stat-label">Total de Equipamentos</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value apto" id="aptos-operar">0</span>
                            <span class="stat-label">Aptos a Operar</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value nao-apto" id="nao-aptos">0</span>
                            <span class="stat-label">Não Aptos</span>
                        </div>
                        <div class="stat">
                            <span class="stat-value pendente" id="total-pendencias">0</span>
                            <span class="stat-label">Pendências Ativas</span>
                        </div>
                    </div>
                </header>

                <div class="main-content">
                    <div class="sidebar">
                        <div class="filters">
                            <h3><i class="fas fa-filter"></i> Filtros</h3>
                            <div class="filter-group">
                                <label for="status-filter">Status Operacional:</label>
                                <select id="status-filter">
                                    <option value="all">Todos</option>
                                    <option value="apto">Apto a Operar</option>
                                    <option value="nao-apto">Não Apto</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="pendencia-filter">Status de Pendência:</label>
                                <select id="pendencia-filter">
                                    <option value="all">Todas</option>
                                    <option value="com-pendencia">Com Pendência</option>
                                    <option value="sem-pendencia">Sem Pendência</option>
                                </select>
                            </div>
                            <div class="filter-group">
                                <label for="search">Buscar Equipamento:</label>
                                <input type="text" id="search" placeholder="Nome ou código...">
                            </div>
                            <button id="reset-filters" class="btn-secondary">
                                <i class="fas fa-redo"></i> Limpar Filtros
                            </button>
                        </div>

                        <div class="actions">
                            <h3><i class="fas fa-tools"></i> Ações</h3>
                            ${this.temPermissao('criarEquipamentos') ? `
                                <button id="add-equipamento" class="btn-primary">
                                    <i class="fas fa-plus-circle"></i> Novo Equipamento
                                </button>
                            ` : ''}
                            <button id="add-pendencia" class="btn-secondary" ${this.temPermissao('criarPendencias') ? '' : 'disabled'}>
                                <i class="fas fa-exclamation-circle"></i> Nova Pendência
                            </button>
                            ${this.temPermissao('exportarDados') ? `
                                <button id="export-data" class="btn-secondary">
                                    <i class="fas fa-file-export"></i> Exportar Dados
                                </button>
                            ` : ''}
                            ${this.temPermissao('gerenciarUsuarios') ? `
                                <button id="gerenciar-usuarios" class="btn-secondary">
                                    <i class="fas fa-users"></i> Gerenciar Usuários
                                </button>
                            ` : ''}
                            <div class="sync-status">
                                <p><i class="fas fa-database"></i> Status da Conexão:</p>
                                <div class="status-indicator" id="sync-status">
                                    <span class="status-dot"></span>
                                    <span class="status-text">Conectando...</span>
                                </div>
                                <button id="manual-sync" class="btn-small">
                                    <i class="fas fa-sync"></i> Sincronizar
                                </button>
                            </div>
                        </div>
                    </div>

                    <div class="content">
                        <div class="content-header">
                            <h2><i class="fas fa-list"></i> Equipamentos</h2>
                            <div class="view-controls">
                                <button id="view-list" class="view-btn active"><i class="fas fa-list"></i></button>
                                <button id="view-grid" class="view-btn"><i class="fas fa-th-large"></i></button>
                            </div>
                        </div>

                        <div class="equipamentos-container" id="equipamentos-container">
                            <!-- Lista de equipamentos será carregada aqui -->
                            <div class="loading">
                                <i class="fas fa-cog fa-spin"></i>
                                <p>Carregando equipamentos...</p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Modal para adicionar/editar equipamento -->
                <div id="equipamento-modal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="modal-title">Novo Equipamento</h3>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            <form id="equipamento-form">
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="equipamento-codigo">Código *</label>
                                        <input type="text" id="equipamento-codigo" required>
                                    </div>
                                    <div class="form-group">
                                        <label for="equipamento-nome">Nome *</label>
                                        <input type="text" id="equipamento-nome" required>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="equipamento-descricao">Descrição</label>
                                    <textarea id="equipamento-descricao" rows="3"></textarea>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="equipamento-setor">Setor</label>
                                        <select id="equipamento-setor">
                                            <option value="filtragem-filtragem-concentrado">FILTRAGEM / FILTRAGEM DE CONCENTRADO</option>
                                            <option value="filtragem-filtragem-rejeito">FILTRAGEM / FILTRAGEM DE REJEITO</option>
                                            <option value="flotacao-flot-cleaner-scavenger">FLOTAÇÃO / FLOT CLEANER-SCAVENGER</option>
                                            <option value="flotacao-flot-pirita">FLOTAÇÃO / FLOT PIRITA</option>
                                            <option value="flotacao-flot-rougher">FLOTAÇÃO / FLOT ROUGHER</option>
                                            <option value="moagem-moagem" selected>MOAGEM / MOAGEM</option>
                                            <option value="reagentes-acido-sulfurico">REAGENTES / ÁCIDO SULFÚRICO</option>
                                            <option value="reagentes-dtf">REAGENTES / DTF</option>
                                            <option value="reagentes-espumante">REAGENTES / ESPUMANTE</option>
                                            <option value="reagentes-floculante">REAGENTES / FLOCULANTE</option>
                                            <option value="reagentes-leite-de-cal">REAGENTES / LEITE DE CAL</option>
                                            <option value="reagentes-pax">REAGENTES / PAX</option>
                                            <option value="torre-resfriamento-torre-resfriamento">TORRE DE RESFRIAMENTO / TORRE DE RESFRIAMENTO</option>
                                            <option value="utilidades-distribuicao-agua">UTILIDADES / DISTRIBUIÇÃO DE ÁGUA</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label>Status Operacional</label>
                                        <div class="status-display" id="equipamento-status-display">
                                            <span class="status-chip apto">Apto a Operar</span>
                                        </div>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label for="equipamento-ultima-inspecao">Última Inspeção</label>
                                    <input type="date" id="equipamento-ultima-inspecao">
                                </div>
                                <div class="form-actions">
                                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                                    <button type="submit" class="btn-primary">Salvar Equipamento</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Modal para adicionar/editar pendência -->
                <div id="pendencia-modal" class="modal">
                    <div class="modal-content">
                        <div class="modal-header">
                            <h3 id="pendencia-modal-title">Nova Pendência</h3>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            <form id="pendencia-form">
                                <input type="hidden" id="pendencia-equipamento-id">
                                <input type="hidden" id="pendencia-id">
                                
                                <div class="form-group">
                                    <label for="pendencia-titulo">Título da Pendência *</label>
                                    <input type="text" id="pendencia-titulo" required>
                                </div>
                                <div class="form-group">
                                    <label for="pendencia-descricao">Descrição Detalhada *</label>
                                    <textarea id="pendencia-descricao" rows="4" required></textarea>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="pendencia-responsavel">Responsável *</label>
                                        <select id="pendencia-responsavel" required>
                                            <option value="">Selecione um responsável</option>
                                            <option value="Elétrica">Elétrica</option>
                                            <option value="Instrumentação">Instrumentação</option>
                                            <option value="Mecânica">Mecânica</option>
                                            <option value="Preventiva_Engenharia">Preventiva Engenharia</option>
                                            <option value="Automação">Automação</option>
                                            <option value="Externo">Externo</option>
                                        </select>
                                    </div>
                                    <div class="form-group">
                                        <label for="pendencia-prioridade">Prioridade</label>
                                        <select id="pendencia-prioridade">
                                            <option value="baixa">Baixa</option>
                                            <option value="media" selected>Média</option>
                                            <option value="alta">Alta</option>
                                            <option value="critica">Crítica</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-row">
                                    <div class="form-group">
                                        <label for="pendencia-data">Data da Ocorrência</label>
                                        <input type="date" id="pendencia-data">
                                    </div>
                                    <div class="form-group">
                                        <label for="pendencia-status">Status da Pendência</label>
                                        <select id="pendencia-status">
                                            <option value="aberta">Aberta</option>
                                            <option value="em-andamento">Em Andamento</option>
                                            <option value="resolvida">Resolvida</option>
                                            <option value="cancelada">Cancelada</option>
                                        </select>
                                    </div>
                                </div>
                                <div class="form-actions">
                                    <button type="button" class="btn-secondary close-modal">Cancelar</button>
                                    <button type="submit" class="btn-primary">Salvar Pendência</button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>

                <!-- Modal para visualizar detalhes do equipamento -->
                <div id="detalhes-modal" class="modal">
                    <div class="modal-content large">
                        <div class="modal-header">
                            <h3 id="detalhes-titulo">Detalhes do Equipamento</h3>
                            <span class="close-modal">&times;</span>
                        </div>
                        <div class="modal-body">
                            <div class="detalhes-header">
                                <div class="detalhes-info">
                                    <h4 id="detalhes-nome"></h4>
                                    <div class="status-chip" id="detalhes-status"></div>
                                    <p id="detalhes-codigo"></p>
                                    <p id="detalhes-descricao"></p>
                                    <div class="detalhes-metadata">
                                        <p><i class="fas fa-building"></i> <span id="detalhes-setor"></span></p>
                                        <p><i class="fas fa-calendar"></i> Última inspeção: <span id="detalhes-inspecao"></span></p>
                                    </div>
                                </div>
                                <div class="detalhes-actions">
                                    ${this.temPermissao('editarEquipamentos') ? `
                                        <button id="editar-equipamento" class="btn-secondary">
                                            <i class="fas fa-edit"></i> Editar
                                        </button>
                                    ` : ''}
                                    ${this.temPermissao('criarPendencias') ? `
                                        <button id="nova-pendencia-detalhes" class="btn-primary">
                                            <i class="fas fa-plus-circle"></i> Nova Pendência
                                        </button>
                                    ` : ''}
                                </div>
                            </div>
                            
                            <div class="pendencias-section">
                                <h4><i class="fas fa-exclamation-triangle"></i> Histórico de Pendências</h4>
                                <div class="pendencias-container" id="detalhes-pendencias">
                                    <!-- Pendencias serão carregadas aqui -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <!-- Modal para gerenciar usuários (apenas administradores) -->
                ${this.temPermissao('gerenciarUsuarios') ? `
                    <div id="usuarios-modal" class="modal">
                        <div class="modal-content large">
                            <div class="modal-header">
                                <h3>Gerenciar Usuários</h3>
                                <span class="close-modal">&times;</span>
                            </div>
                            <div class="modal-body">
                                <div class="usuarios-header">
                                    <button id="novo-usuario" class="btn-primary">
                                        <i class="fas fa-user-plus"></i> Novo Usuário
                                    </button>
                                </div>
                                
                                <div class="usuarios-list" id="usuarios-list">
                                    <!-- Lista de usuários será carregada aqui -->
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Modal para adicionar/editar usuário -->
                    <div id="usuario-modal" class="modal">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h3 id="usuario-modal-title">Novo Usuário</h3>
                                <span class="close-modal">&times;</span>
                            </div>
                            <div class="modal-body">
                                <form id="usuario-form">
                                    <input type="hidden" id="usuario-id">
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="usuario-username">Usuário *</label>
                                            <input type="text" id="usuario-username" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="usuario-nome">Nome Completo *</label>
                                            <input type="text" id="usuario-nome" required>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label for="usuario-email">E-mail</label>
                                        <input type="email" id="usuario-email">
                                    </div>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="usuario-password">Senha *</label>
                                            <input type="password" id="usuario-password" required>
                                        </div>
                                        <div class="form-group">
                                            <label for="usuario-confirm-password">Confirmar Senha *</label>
                                            <input type="password" id="usuario-confirm-password" required>
                                        </div>
                                    </div>
                                    
                                    <div class="form-row">
                                        <div class="form-group">
                                            <label for="usuario-role">Nível de Acesso *</label>
                                            <select id="usuario-role" required>
                                                <option value="">Selecione</option>
                                                <option value="administrador">Administrador</option>
                                                <option value="supervisor">Supervisor</option>
                                                <option value="tecnico">Técnico</option>
                                                <option value="visualizador">Visualizador</option>
                                            </select>
                                        </div>
                                        <div class="form-group">
                                            <label for="usuario-setor">Setor</label>
                                            <select id="usuario-setor">
                                                <option value="todos">Todos os Setores</option>
                                                <option value="Elétrica">Elétrica</option>
                                                <option value="Instrumentação">Instrumentação</option>
                                                <option value="Mecânica">Mecânica</option>
                                            </select>
                                        </div>
                                    </div>
                                    
                                    <div class="form-group">
                                        <label>
                                            <input type="checkbox" id="usuario-ativo" checked>
                                            Usuário Ativo
                                        </label>
                                    </div>
                                    
                                    <div class="form-actions">
                                        <button type="button" class="btn-secondary close-modal">Cancelar</button>
                                        <button type="submit" class="btn-primary">Salvar Usuário</button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Inserir informações do usuário
        this.atualizarInfoUsuario();
        
        // Carregar CSS
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'style.css';
        document.head.appendChild(link);
    }
    
    atualizarInfoUsuario() {
        const userInfoDiv = document.getElementById('user-info');
        if (!userInfoDiv || !this.usuarioLogado) return;
        
        userInfoDiv.innerHTML = `
            <div class="user-details">
                <div class="user-name">${this.usuarioLogado.nome}</div>
                <div class="user-role">${APP_CONFIG.roles[this.usuarioLogado.role]}</div>
                ${this.usuarioLogado.setor !== 'todos' ? `<div class="user-setor">Setor: ${this.usuarioLogado.setor}</div>` : ''}
            </div>
            <button id="logout-btn" class="btn-logout" title="Sair">
                <i class="fas fa-sign-out-alt"></i>
            </button>
        `;
        
        // Adicionar evento ao botão de logout
        document.getElementById('logout-btn').addEventListener('click', () => {
            this.realizarLogout();
        });
        
        // Adicionar estilos para a área do usuário
        const estilos = document.createElement('style');
        estilos.textContent = `
            .header-top {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin-bottom: 20px;
            }
            
            .user-info {
                background: rgba(255, 255, 255, 0.1);
                padding: 15px;
                border-radius: 8px;
                display: flex;
                align-items: center;
                gap: 15px;
                min-width: 250px;
            }
            
            .user-details {
                flex: 1;
            }
            
            .user-name {
                font-weight: 500;
                color: white;
                margin-bottom: 3px;
            }
            
            .user-role {
                font-size: 14px;
                color: rgba(255, 255, 255, 0.9);
                background: rgba(255, 255, 255, 0.2);
                padding: 2px 8px;
                border-radius: 12px;
                display: inline-block;
            }
            
            .user-setor {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.8);
                margin-top: 3px;
            }
            
            .btn-logout {
                background: rgba(255, 255, 255, 0.2);
                color: white;
                border: none;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;
                transition: background 0.3s;
            }
            
            .btn-logout:hover {
                background: rgba(231, 76, 60, 0.8);
            }
            
            .usuarios-header {
                margin-bottom: 20px;
            }
            
            .usuarios-list {
                max-height: 400px;
                overflow-y: auto;
            }
            
            .usuario-item {
                background: #f8f9fa;
                border-radius: 8px;
                padding: 15px;
                margin-bottom: 10px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .usuario-info h4 {
                margin-bottom: 5px;
                color: #2c3e50;
            }
            
            .usuario-meta {
                display: flex;
                gap: 15px;
                font-size: 13px;
                color: #7f8c8d;
            }
            
            .usuario-actions {
                display: flex;
                gap: 10px;
            }
            
            .usuario-status {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-left: 10px;
            }
            
            .usuario-status.ativo {
                background: #d5f4e6;
                color: #27ae60;
            }
            
            .usuario-status.inativo {
                background: #fde8e8;
                color: #e74c3c;
            }
        `;
        
        document.head.appendChild(estilos);
    }
    
    temPermissao(permissao) {
        if (!this.usuarioLogado) return false;
        const rolePermissoes = APP_CONFIG.permissoes[this.usuarioLogado.role];
        return rolePermissoes ? rolePermissoes[permissao] : false;
    }
    
    async realizarLogout() {
        if (confirm('Deseja realmente sair do sistema?')) {
            // Remover sessão
            if (this.sessaoAtiva && this.data.sessoesAtivas) {
                this.data.sessoesAtivas = this.data.sessoesAtivas.filter(
                    s => s.token !== this.sessaoAtiva.token
                );
                
                try {
                    await this.salvarDados();
                } catch (error) {
                    console.error('Erro ao salvar dados do logout:', error);
                }
            }
            
            // Limpar localStorage
            localStorage.removeItem('equipamentos_token');
            
            // Resetar estado
            this.usuarioLogado = null;
            this.sessaoAtiva = null;
            
            // Mostrar tela de login
            this.mostrarTelaLogin();
        }
    }
    
    async carregarDados(silent = false) {
        try {
            if (!silent) {
                this.mostrarLoading(true);
            }
            
            // Tentar carregar dados do JSONBin.io
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}/latest`, {
                headers: JSONBIN_CONFIG.headers
            });
            
            if (!response.ok) {
                throw new Error('Erro ao carregar dados do servidor');
            }
            
            const result = await response.json();
            
            if (result.record) {
                this.data = result.record;
                
                // Garantir que as estruturas existam
                if (!this.data.equipamentos) this.data.equipamentos = [];
                if (!this.data.usuarios) this.data.usuarios = [];
                if (!this.data.sessoesAtivas) this.data.sessoesAtivas = [];
                
                this.equipamentos = this.data.equipamentos;
                
                // Filtrar equipamentos baseado nas permissões do usuário
                this.filtrarEquipamentosPorPermissao();
                
                // Atualizar status dos equipamentos baseado nas pendências críticas
                this.equipamentos.forEach((equipamento, index) => {
                    this.atualizarStatusEquipamentoPorPendencias(index);
                });
                
                console.log('Dados carregados:', this.equipamentos.length, 'equipamentos');
            } else {
                // Usar dados iniciais
                this.data = INITIAL_DATA;
                this.equipamentos = this.data.equipamentos;
                console.log('Usando dados iniciais');
            }
            
            if (!silent) {
                this.atualizarStatusSincronizacao(true);
            }
        } catch (error) {
            console.error('Erro ao carregar dados:', error);
            
            // Usar dados iniciais em caso de erro
            this.data = INITIAL_DATA;
            this.equipamentos = this.data.equipamentos;
            console.log('Usando dados iniciais devido a erro de conexão');
            
            if (!silent) {
                this.atualizarStatusSincronizacao(false);
                this.mostrarMensagem('Erro ao conectar com o servidor. Usando dados locais.', 'error');
            }
        } finally {
            if (!silent) {
                this.mostrarLoading(false);
            }
        }
    }
    
    filtrarEquipamentosPorPermissao() {
        if (!this.usuarioLogado) {
            this.equipamentos = [];
            return;
        }
        
        // Se o usuário pode ver todos os setores, não precisa filtrar
        if (this.temPermissao('verTodosSetores')) {
            return;
        }
        
        // Técnicos só veem equipamentos do seu setor
        if (this.usuarioLogado.setor !== 'todos') {
            const setorUsuario = this.usuarioLogado.setor;
            this.equipamentos = this.equipamentos.filter(equipamento => {
                // Verificar se o equipamento tem pendências do setor do usuário
                const temPendenciasDoSetor = equipamento.pendencias.some(p => 
                    p.responsavel === setorUsuario
                );
                
                return temPendenciasDoSetor;
            });
        }
    }
    
    initModals() {
        // Obter referências aos modais
        this.modals.equipamento = document.getElementById('equipamento-modal');
        this.modals.pendencia = document.getElementById('pendencia-modal');
        this.modals.detalhes = document.getElementById('detalhes-modal');
        if (this.temPermissao('gerenciarUsuarios')) {
            this.modals.usuarios = document.getElementById('usuarios-modal');
            this.modals.usuario = document.getElementById('usuario-modal');
        }
        
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
    }
    
    initEvents() {
        // Filtros
        document.getElementById('status-filter').addEventListener('change', (e) => {
            this.filtros.status = e.target.value;
            this.renderizarEquipamentos();
        });
        
        document.getElementById('pendencia-filter').addEventListener('change', (e) => {
            this.filtros.pendencia = e.target.value;
            this.renderizarEquipamentos();
        });
        
        document.getElementById('search').addEventListener('input', (e) => {
            this.filtros.busca = e.target.value.toLowerCase();
            this.renderizarEquipamentos();
        });
        
        document.getElementById('reset-filters').addEventListener('click', () => {
            this.resetarFiltros();
        });
        
        // Botões de ação
        const addEquipamentoBtn = document.getElementById('add-equipamento');
        if (addEquipamentoBtn) {
            addEquipamentoBtn.addEventListener('click', () => {
                this.abrirModalEquipamento();
            });
        }
        
        document.getElementById('add-pendencia').addEventListener('click', () => {
            if (this.temPermissao('criarPendencias')) {
                this.abrirModalPendencia();
            } else {
                this.mostrarMensagem('Você não tem permissão para criar pendências.', 'error');
            }
        });
        
        const exportDataBtn = document.getElementById('export-data');
        if (exportDataBtn) {
            exportDataBtn.addEventListener('click', () => {
                this.exportarDados();
            });
        }
        
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
        
        // Botão de editar no modal de detalhes
        const editarEquipamentoBtn = document.getElementById('editar-equipamento');
        if (editarEquipamentoBtn) {
            editarEquipamentoBtn.addEventListener('click', () => {
                this.fecharModal(this.modals.detalhes);
                this.abrirModalEquipamento(this.equipamentoSelecionado);
            });
        }
        
        // Botão de nova pendência no modal de detalhes
        const novaPendenciaDetalhesBtn = document.getElementById('nova-pendencia-detalhes');
        if (novaPendenciaDetalhesBtn) {
            novaPendenciaDetalhesBtn.addEventListener('click', () => {
                this.fecharModal(this.modals.detalhes);
                this.abrirModalPendencia(this.equipamentoSelecionado);
            });
        }
        
        // Novo: Botão de gerenciar usuários
        const gerenciarUsuariosBtn = document.getElementById('gerenciar-usuarios');
        if (gerenciarUsuariosBtn) {
            gerenciarUsuariosBtn.addEventListener('click', () => {
                this.abrirModalUsuarios();
            });
        }
        
        // Novo: Eventos do modal de usuários
        const novoUsuarioBtn = document.getElementById('novo-usuario');
        if (novoUsuarioBtn) {
            novoUsuarioBtn.addEventListener('click', () => {
                this.abrirModalUsuario();
            });
        }
        
        const usuarioForm = document.getElementById('usuario-form');
        if (usuarioForm) {
            usuarioForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.salvarUsuario();
            });
        }
    }
    
    async salvarDados() {
        try {
            // Garantir que os próximos IDs estejam atualizados
            this.atualizarNextIds();
            
            // Atualizar dados no JSONBin.io
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}`, {
                method: 'PUT',
                headers: JSONBIN_CONFIG.headers,
                body: JSON.stringify(this.data)
            });
            
            if (!response.ok) {
                throw new Error('Erro ao salvar dados');
            }
            
            console.log('Dados salvos com sucesso no JSONBin.io');
            this.atualizarStatusSincronizacao(true);
            
            return true;
        } catch (error) {
            console.error('Erro ao salvar dados:', error);
            this.atualizarStatusSincronizacao(false);
            
            // Mostrar mensagem de erro
            this.mostrarMensagem('Erro ao salvar dados no servidor. Alterações podem ser perdidas.', 'error');
            return false;
        }
    }
    
    atualizarNextIds() {
        // Encontrar o maior ID de equipamento
        let maxEquipamentoId = 0;
        this.equipamentos.forEach(eqp => {
            if (eqp.id > maxEquipamentoId) maxEquipamentoId = eqp.id;
        });
        this.data.nextEquipamentoId = maxEquipamentoId + 1;
        
        // Encontrar o maior ID de pendência
        let maxPendenciaId = 0;
        this.equipamentos.forEach(eqp => {
            eqp.pendencias.forEach(pend => {
                if (pend.id > maxPendenciaId) maxPendenciaId = pend.id;
            });
        });
        this.data.nextPendenciaId = maxPendenciaId + 1;
        
        // Encontrar o maior ID de usuário
        let maxUsuarioId = 0;
        this.data.usuarios.forEach(usuario => {
            if (usuario.id > maxUsuarioId) maxUsuarioId = usuario.id;
        });
        this.data.nextUsuarioId = maxUsuarioId + 1;
    }
    
    resetarFiltros() {
        document.getElementById('status-filter').value = 'all';
        document.getElementById('pendencia-filter').value = 'all';
        document.getElementById('search').value = '';
        
        this.filtros = {
            status: 'all',
            pendencia: 'all',
            busca: ''
        };
        
        this.renderizarEquipamentos();
    }
    
    filtrarEquipamentos() {
        return this.equipamentos.filter(equipamento => {
            // Filtrar por status operacional
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
            
            // Filtrar por busca
            if (this.filtros.busca) {
                const busca = this.filtros.busca.toLowerCase();
                const nomeMatch = equipamento.nome.toLowerCase().includes(busca);
                const codigoMatch = equipamento.codigo.toLowerCase().includes(busca);
                const descricaoMatch = equipamento.descricao.toLowerCase().includes(busca);
                
                if (!nomeMatch && !codigoMatch && !descricaoMatch) {
                    return false;
                }
            }
            
            return true;
        });
    }
    
    renderizarEquipamentos() {
        const container = document.getElementById('equipamentos-container');
        const equipamentosFiltrados = this.filtrarEquipamentos();
        
        if (equipamentosFiltrados.length === 0) {
            container.innerHTML = `
                <div class="no-results">
                    <i class="fas fa-search"></i>
                    <h3>Nenhum equipamento encontrado</h3>
                    <p>Tente ajustar os filtros de busca</p>
                </div>
            `;
            return;
        }
        
        // Aplicar classe de modo de visualização
        container.className = `equipamentos-container ${this.viewMode}-view`;
        
        // Gerar HTML dos equipamentos
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
            
            // Formatar data de inspeção
            const dataInspecao = equipamento.ultimaInspecao ? 
                new Date(equipamento.ultimaInspecao).toLocaleDateString('pt-BR') : 
                'Não registrada';
            
            // Obter nome do setor formatado
            const setorFormatado = APP_CONFIG.setores[equipamento.setor] || equipamento.setor;
            
            // Contar pendencias por status
            const pendenciasAbertas = equipamento.pendencias.filter(p => p.status === 'aberta').length;
            const pendenciasAndamento = equipamento.pendencias.filter(p => p.status === 'em-andamento').length;
            const pendenciasResolvidas = equipamento.pendencias.filter(p => p.status === 'resolvida').length;
            
            // Contar pendências críticas
            const pendenciasCriticas = equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
            
            return `
                <div class="${classesCard}" data-id="${equipamento.id}">
                    <div class="equipamento-header">
                        <div class="equipamento-info">
                            <h4>${equipamento.nome}</h4>
                            <div class="equipamento-codigo">${equipamento.codigo}</div>
                        </div>
                        <div class="status-chip ${equipamento.status}">
                            ${APP_CONFIG.statusEquipamento[equipamento.status]}
                            ${temPendenciasCriticasAbertas ? ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>` : ''}
                        </div>
                    </div>
                    
                    <p class="equipamento-descricao">${equipamento.descricao}</p>
                    
                    <div class="equipamento-metadata">
                        <div><i class="fas fa-building"></i> ${setorFormatado}</div>
                        <div><i class="fas fa-calendar"></i> ${dataInspecao}</div>
                    </div>
                    
                    ${equipamento.pendencias.length > 0 ? `
                        <div class="equipamento-pendencias">
                            <strong>Pendências:</strong>
                            ${pendenciasAbertas > 0 ? `<span class="pendencia-badge aberta">${pendenciasAbertas} Aberta(s)</span>` : ''}
                            ${pendenciasAndamento > 0 ? `<span class="pendencia-badge em-andamento">${pendenciasAndamento} Em Andamento</span>` : ''}
                            ${pendenciasResolvidas > 0 ? `<span class="pendencia-badge resolvida">${pendenciasResolvidas} Resolvida(s)</span>` : ''}
                            ${pendenciasCriticas > 0 ? `<span class="pendencia-badge critica">${pendenciasCriticas} Crítica(s)</span>` : ''}
                        </div>
                    ` : ''}
                    
                    <div class="equipamento-actions">
                        <button class="action-btn secondary btn-detalhes" data-id="${equipamento.id}">
                            <i class="fas fa-eye"></i> Detalhes
                        </button>
                        ${this.temPermissao('criarPendencias') ? `
                            <button class="action-btn primary btn-pendencia" data-id="${equipamento.id}">
                                <i class="fas fa-plus-circle"></i> Pendência
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar eventos aos botões dos equipamentos
        container.querySelectorAll('.btn-detalhes').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.btn-detalhes').dataset.id);
                this.verDetalhesEquipamento(id);
            });
        });
        
        container.querySelectorAll('.btn-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const id = parseInt(e.target.closest('.btn-pendencia').dataset.id);
                this.abrirModalPendencia(id);
            });
        });
    }
    
    atualizarEstatisticas() {
        const totalEquipamentos = this.equipamentos.length;
        const aptosOperar = this.equipamentos.filter(e => e.status === 'apto').length;
        const naoAptos = this.equipamentos.filter(e => e.status === 'nao-apto').length;
        
        // Contar pendencias ativas (abertas ou em andamento)
        let totalPendenciasAtivas = 0;
        let totalPendenciasCriticas = 0;
        this.equipamentos.forEach(equipamento => {
            totalPendenciasAtivas += equipamento.pendencias.filter(p => 
                p.status === 'aberta' || p.status === 'em-andamento'
            ).length;
            
            totalPendenciasCriticas += equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
        });
        
        document.getElementById('total-equipamentos').textContent = totalEquipamentos;
        document.getElementById('aptos-operar').textContent = aptosOperar;
        document.getElementById('nao-aptos').textContent = naoAptos;
        document.getElementById('total-pendencias').textContent = totalPendenciasAtivas;
    }
    
    atualizarStatusSincronizacao(conectado) {
        const statusIndicator = document.getElementById('sync-status');
        const statusDot = statusIndicator.querySelector('.status-dot');
        const statusText = statusIndicator.querySelector('.status-text');
        
        if (conectado) {
            statusDot.className = 'status-dot connected';
            statusText.textContent = 'Conectado';
        } else {
            statusDot.className = 'status-dot disconnected';
            statusText.textContent = 'Desconectado';
        }
    }
    
    setViewMode(mode) {
        this.viewMode = mode;
        
        // Atualizar botões de visualização
        document.getElementById('view-list').classList.toggle('active', mode === 'list');
        document.getElementById('view-grid').classList.toggle('active', mode === 'grid');
        
        // Re-renderizar equipamentos
        this.renderizarEquipamentos();
    }
    
    abrirModalEquipamento(equipamentoId = null) {
        if (!this.temPermissao('criarEquipamentos') && !this.temPermissao('editarEquipamentos')) {
            this.mostrarMensagem('Você não tem permissão para esta ação.', 'error');
            return;
        }
        
        const modal = this.modals.equipamento;
        const form = document.getElementById('equipamento-form');
        const titulo = document.getElementById('modal-title');
        
        if (equipamentoId) {
            // Modo edição
            const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
            if (!equipamento) return;
            
            titulo.textContent = 'Editar Equipamento';
            
            // Preencher formulário
            document.getElementById('equipamento-codigo').value = equipamento.codigo;
            document.getElementById('equipamento-nome').value = equipamento.nome;
            document.getElementById('equipamento-descricao').value = equipamento.descricao;
            document.getElementById('equipamento-setor').value = equipamento.setor;
            document.getElementById('equipamento-ultima-inspecao').value = equipamento.ultimaInspecao || '';
            
            // Atualizar display de status
            this.atualizarDisplayStatusEquipamento(equipamento);
            
            // Armazenar ID para referência
            form.dataset.editId = equipamentoId;
        } else {
            // Modo criação
            titulo.textContent = 'Novo Equipamento';
            form.reset();
            
            // Definir "MOAGEM / MOAGEM" como padrão
            document.getElementById('equipamento-setor').value = 'moagem-moagem';
            
            // Mostrar status inicial como apto
            this.atualizarDisplayStatusEquipamento();
            
            delete form.dataset.editId;
        }
        
        modal.classList.add('active');
    }
    
    abrirModalPendencia(equipamentoId = null) {
        if (!this.temPermissao('criarPendencias') && !this.temPermissao('editarPendencias')) {
            this.mostrarMensagem('Você não tem permissão para esta ação.', 'error');
            return;
        }
        
        const modal = this.modals.pendencia;
        const form = document.getElementById('pendencia-form');
        const titulo = document.getElementById('pendencia-modal-title');
        
        // Se equipamentoId não foi fornecido, usar o selecionado
        if (!equipamentoId && this.equipamentoSelecionado) {
            equipamentoId = this.equipamentoSelecionado.id;
        }
        
        if (!equipamentoId) {
            this.mostrarMensagem('Selecione um equipamento primeiro', 'error');
            return;
        }
        
        titulo.textContent = 'Nova Pendência';
        form.reset();
        
        // Definir data atual como padrão
        const hoje = new Date().toISOString().split('T')[0];
        document.getElementById('pendencia-data').value = hoje;
        
        // Resetar o dropdown de responsável para vazio
        document.getElementById('pendencia-responsavel').value = '';
        
        // Armazenar ID do equipamento
        document.getElementById('pendencia-equipamento-id').value = equipamentoId;
        delete form.dataset.editId;
        
        modal.classList.add('active');
    }
    
    atualizarDisplayStatusEquipamento(equipamento = null) {
        const statusDisplay = document.getElementById('equipamento-status-display');
        
        if (statusDisplay) {
            if (equipamento) {
                // Verificar pendências críticas
                const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                );
                
                const status = temPendenciasCriticasAbertas ? 'nao-apto' : 'apto';
                const statusTexto = status === 'apto' ? 'Apto a Operar' : 'Não Apto';
                const classeStatus = status === 'apto' ? 'status-chip apto' : 'status-chip nao-apto';
                
                statusDisplay.innerHTML = `<span class="${classeStatus}">${statusTexto}</span>`;
                
                // Adicionar mensagem informativa se houver pendências críticas
                if (temPendenciasCriticasAbertas) {
                    const pendenciasCriticas = equipamento.pendencias.filter(p => 
                        p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                    );
                    
                    statusDisplay.innerHTML += `
                        <div class="status-info">
                            <small><i class="fas fa-exclamation-triangle"></i> 
                            ${pendenciasCriticas.length} pendência(s) crítica(s) aberta(s)</small>
                        </div>
                    `;
                }
            } else {
                statusDisplay.innerHTML = '<span class="status-chip apto">Apto a Operar</span>';
            }
        }
    }
    
    atualizarStatusEquipamentoPorPendencias(equipamentoIndex) {
        const equipamento = this.equipamentos[equipamentoIndex];
        
        // Verificar se há pendências críticas abertas
        const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        );
        
        // Atualizar status do equipamento
        if (temPendenciasCriticasAbertas) {
            equipamento.status = 'nao-apto';
        } else {
            // Se não há pendências críticas abertas, o equipamento pode ser apto
            // (mantemos o status atual se já for apto, ou mudamos para apto se estava como não apto)
            equipamento.status = 'apto';
        }
    }
    
    async salvarEquipamento() {
        if (!this.temPermissao('criarEquipamentos') && !this.temPermissao('editarEquipamentos')) {
            this.mostrarMensagem('Você não tem permissão para esta ação.', 'error');
            return;
        }
        
        const form = document.getElementById('equipamento-form');
        const isEdit = form.dataset.editId;
        
        const equipamento = {
            codigo: document.getElementById('equipamento-codigo').value.trim(),
            nome: document.getElementById('equipamento-nome').value.trim(),
            descricao: document.getElementById('equipamento-descricao').value.trim(),
            setor: document.getElementById('equipamento-setor').value,
            status: 'apto', // Sempre começa como apto
            ultimaInspecao: document.getElementById('equipamento-ultima-inspecao').value || null,
            pendencias: []
        };
        
        // Validação básica
        if (!equipamento.codigo || !equipamento.nome) {
            this.mostrarMensagem('Código e nome são obrigatórios', 'error');
            return;
        }
        
        if (isEdit) {
            // Atualizar equipamento existente
            const id = parseInt(isEdit);
            const index = this.equipamentos.findIndex(e => e.id === id);
            
            if (index !== -1) {
                // Manter o ID, pendencias existentes e status atual
                equipamento.id = id;
                equipamento.pendencias = this.equipamentos[index].pendencias;
                equipamento.dataCriacao = this.equipamentos[index].dataCriacao;
                
                // Verificar pendências críticas para determinar status
                const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
                    p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
                );
                
                // Atualizar status baseado nas pendências
                equipamento.status = temPendenciasCriticasAbertas ? 'nao-apto' : 'apto';
                
                this.equipamentos[index] = equipamento;
                
                this.mostrarMensagem('Equipamento atualizado com sucesso', 'success');
            }
        } else {
            // Criar novo equipamento
            equipamento.id = this.data.nextEquipamentoId++;
            equipamento.dataCriacao = new Date().toISOString().split('T')[0];
            
            this.equipamentos.push(equipamento);
            
            this.mostrarMensagem('Equipamento criado com sucesso', 'success');
        }
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Fechar modal e atualizar interface
        this.fecharModal(this.modals.equipamento);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        
        // Habilitar/desabilitar botão de pendência
        this.atualizarEstadoBotaoPendencia();
    }
    
    async salvarPendencia() {
        if (!this.temPermissao('criarPendencias') && !this.temPermissao('editarPendencias')) {
            this.mostrarMensagem('Você não tem permissão para esta ação.', 'error');
            return;
        }
        
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
        
        // Validação básica
        if (!pendencia.titulo || !pendencia.descricao || !pendencia.responsavel) {
            this.mostrarMensagem('Título, descrição e responsável são obrigatórios', 'error');
            return;
        }
        
        // Para técnicos: verificar se pode criar pendência neste equipamento
        if (this.usuarioLogado.role === 'tecnico' && this.usuarioLogado.setor !== 'todos') {
            const equipamento = this.equipamentos.find(e => e.id === equipamentoId);
            if (equipamento && pendencia.responsavel !== this.usuarioLogado.setor) {
                this.mostrarMensagem(`Você só pode criar pendências para o setor ${this.usuarioLogado.setor}`, 'error');
                return;
            }
        }
        
        // Encontrar equipamento
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === equipamentoId);
        if (equipamentoIndex === -1) {
            this.mostrarMensagem('Equipamento não encontrado', 'error');
            return;
        }
        
        if (isEdit) {
            // Atualizar pendência existente
            const pendenciaId = parseInt(isEdit);
            const pendenciaIndex = this.equipamentos[equipamentoIndex].pendencias.findIndex(p => p.id === pendenciaId);
            
            if (pendenciaIndex !== -1) {
                pendencia.id = pendenciaId;
                this.equipamentos[equipamentoIndex].pendencias[pendenciaIndex] = pendencia;
                
                this.mostrarMensagem('Pendência atualizada com sucesso', 'success');
            }
        } else {
            // Criar nova pendência
            pendencia.id = this.data.nextPendenciaId++;
            this.equipamentos[equipamentoIndex].pendencias.push(pendencia);
            
            this.mostrarMensagem('Pendência registrada com sucesso', 'success');
        }
        
        // Atualizar status do equipamento baseado nas pendências críticas
        this.atualizarStatusEquipamentoPorPendencias(equipamentoIndex);
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Fechar modal e atualizar interface
        this.fecharModal(this.modals.pendencia);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
    }
    
    verDetalhesEquipamento(id) {
        const equipamento = this.equipamentos.find(e => e.id === id);
        if (!equipamento) return;
        
        this.equipamentoSelecionado = equipamento;
        
        // Preencher informações do equipamento
        document.getElementById('detalhes-titulo').textContent = `Detalhes: ${equipamento.nome}`;
        document.getElementById('detalhes-nome').textContent = equipamento.nome;
        document.getElementById('detalhes-codigo').textContent = `Código: ${equipamento.codigo}`;
        document.getElementById('detalhes-descricao').textContent = equipamento.descricao;
        document.getElementById('detalhes-setor').textContent = APP_CONFIG.setores[equipamento.setor] || equipamento.setor;
        
        // Status
        const statusChip = document.getElementById('detalhes-status');
        statusChip.textContent = APP_CONFIG.statusEquipamento[equipamento.status];
        statusChip.className = `status-chip ${equipamento.status}`;
        
        // Adicionar ícone de alerta se houver pendências críticas
        const temPendenciasCriticasAbertas = equipamento.pendencias.some(p => 
            p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
        );
        if (temPendenciasCriticasAbertas) {
            const pendenciasCriticas = equipamento.pendencias.filter(p => 
                p.prioridade === 'critica' && (p.status === 'aberta' || p.status === 'em-andamento')
            ).length;
            statusChip.innerHTML += ` <i class="fas fa-exclamation-triangle" title="${pendenciasCriticas} pendência(s) crítica(s)"></i>`;
        }
        
        // Data de inspeção
        const dataInspecao = equipamento.ultimaInspecao ? 
            new Date(equipamento.ultimaInspecao).toLocaleDateString('pt-BR') : 
            'Não registrada';
        document.getElementById('detalhes-inspecao').textContent = dataInspecao;
        
        // Renderizar pendencias
        this.renderizarPendenciasDetalhes(equipamento.pendencias);
        
        // Abrir modal
        this.modals.detalhes.classList.add('active');
    }
    
    renderizarPendenciasDetalhes(pendencias) {
        const container = document.getElementById('detalhes-pendencias');
        
        if (pendencias.length === 0) {
            container.innerHTML = `
                <div class="no-pendencias">
                    <i class="fas fa-check-circle"></i>
                    <p>Nenhuma pendência registrada para este equipamento.</p>
                </div>
            `;
            return;
        }
        
        // Ordenar pendencias: abertas primeiro, depois por prioridade (crítica primeiro), depois por data (mais recente primeiro)
        const pendenciasOrdenadas = [...pendencias].sort((a, b) => {
            // Primeiro por status (abertas primeiro)
            const statusOrder = { 'aberta': 0, 'em-andamento': 1, 'resolvida': 2, 'cancelada': 3 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
                return statusOrder[a.status] - statusOrder[b.status];
            }
            
            // Depois por prioridade (crítica primeiro)
            const prioridadeOrder = { 'critica': 0, 'alta': 1, 'media': 2, 'baixa': 3 };
            if (prioridadeOrder[a.prioridade] !== prioridadeOrder[b.prioridade]) {
                return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
            }
            
            // Depois por data (mais recente primeiro)
            return new Date(b.data) - new Date(a.data);
        });
        
        container.innerHTML = pendenciasOrdenadas.map(pendencia => {
            const dataFormatada = new Date(pendencia.data).toLocaleDateString('pt-BR');
            const isCritica = pendencia.prioridade === 'critica';
            
            return `
                <div class="pendencia-item ${pendencia.status} ${isCritica ? 'critica' : ''}">
                    <div class="pendencia-header">
                        <div>
                            <div class="pendencia-titulo">
                                ${isCritica ? '<i class="fas fa-exclamation-triangle"></i> ' : ''}
                                ${pendencia.titulo}
                            </div>
                            <div class="pendencia-data">
                                <i class="far fa-calendar"></i> ${dataFormatada} 
                                | Prioridade: ${APP_CONFIG.prioridades[pendencia.prioridade]}
                            </div>
                        </div>
                        <div class="pendencia-badge ${pendencia.status}">
                            ${APP_CONFIG.statusPendencia[pendencia.status]}
                        </div>
                    </div>
                    <p class="pendencia-descricao">${pendencia.descricao}</p>
                    <div class="pendencia-footer">
                        <div class="pendencia-responsavel">
                            <i class="fas fa-user"></i> Responsável: ${pendencia.responsavel}
                        </div>
                        <div class="pendencia-acoes">
                            ${this.temPermissao('editarPendencias') ? `
                                <button class="btn-editar-pendencia" data-id="${pendencia.id}">
                                    <i class="fas fa-edit"></i> Editar
                                </button>
                            ` : ''}
                            ${this.temPermissao('excluirPendencias') ? `
                                <button class="btn-excluir-pendencia" data-id="${pendencia.id}">
                                    <i class="fas fa-trash"></i> Excluir
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar eventos aos botões de pendências
        container.querySelectorAll('.btn-editar-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-editar-pendencia').dataset.id);
                this.editarPendencia(pendenciaId);
            });
        });
        
        container.querySelectorAll('.btn-excluir-pendencia').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const pendenciaId = parseInt(e.target.closest('.btn-excluir-pendencia').dataset.id);
                this.excluirPendencia(pendenciaId);
            });
        });
    }
    
    editarPendencia(pendenciaId) {
        if (!this.temPermissao('editarPendencias')) {
            this.mostrarMensagem('Você não tem permissão para editar pendências.', 'error');
            return;
        }
        
        if (!this.equipamentoSelecionado) return;
        
        const pendencia = this.equipamentoSelecionado.pendencias.find(p => p.id === pendenciaId);
        if (!pendencia) return;
        
        const modal = this.modals.pendencia;
        const form = document.getElementById('pendencia-form');
        const titulo = document.getElementById('pendencia-modal-title');
        
        titulo.textContent = 'Editar Pendência';
        
        // Preencher formulário
        document.getElementById('pendencia-titulo').value = pendencia.titulo;
        document.getElementById('pendencia-descricao').value = pendencia.descricao;
        
        // Selecionar o responsável no dropdown
        const responsavelSelect = document.getElementById('pendencia-responsavel');
        responsavelSelect.value = pendencia.responsavel;
        
        document.getElementById('pendencia-prioridade').value = pendencia.prioridade;
        document.getElementById('pendencia-data').value = pendencia.data;
        document.getElementById('pendencia-status').value = pendencia.status;
        
        // Armazenar IDs
        document.getElementById('pendencia-equipamento-id').value = this.equipamentoSelecionado.id;
        document.getElementById('pendencia-id').value = pendenciaId;
        form.dataset.editId = pendenciaId;
        
        // Fechar modal atual e abrir modal de pendência
        this.fecharModal(this.modals.detalhes);
        modal.classList.add('active');
    }
    
    async excluirPendencia(pendenciaId) {
        if (!this.temPermissao('excluirPendencias')) {
            this.mostrarMensagem('Você não tem permissão para excluir pendências.', 'error');
            return;
        }
        
        if (!this.equipamentoSelecionado) return;
        
        if (!confirm('Tem certeza que deseja excluir esta pendência?')) {
            return;
        }
        
        const equipamentoIndex = this.equipamentos.findIndex(e => e.id === this.equipamentoSelecionado.id);
        if (equipamentoIndex === -1) return;
        
        // Remover pendência
        this.equipamentos[equipamentoIndex].pendencias = this.equipamentos[equipamentoIndex].pendencias.filter(p => p.id !== pendenciaId);
        
        // Atualizar status do equipamento baseado nas pendências restantes
        this.atualizarStatusEquipamentoPorPendencias(equipamentoIndex);
        
        // Atualizar equipamento selecionado
        this.equipamentoSelecionado = this.equipamentos[equipamentoIndex];
        
        // Salvar dados
        await this.salvarDados();
        
        // Atualizar interface
        this.renderizarPendenciasDetalhes(this.equipamentoSelecionado.pendencias);
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        
        this.mostrarMensagem('Pendência excluída com sucesso', 'success');
    }
    
    fecharModal(modal) {
        if (modal) {
            modal.classList.remove('active');
        }
    }
    
    fecharTodosModais() {
        Object.values(this.modals).forEach(modal => {
            if (modal) {
                modal.classList.remove('active');
            }
        });
    }
    
    atualizarEstadoBotaoPendencia() {
        const btnPendencia = document.getElementById('add-pendencia');
        if (btnPendencia) {
            btnPendencia.disabled = this.equipamentos.length === 0 || !this.temPermissao('criarPendencias');
        }
    }
    
    async sincronizarDados() {
        this.mostrarMensagem('Sincronizando dados...', 'info');
        await this.carregarDados();
        this.renderizarEquipamentos();
        this.atualizarEstatisticas();
        this.mostrarMensagem('Dados sincronizados com sucesso', 'success');
    }
    
    exportarDados() {
        if (!this.temPermissao('exportarDados')) {
            this.mostrarMensagem('Você não tem permissão para exportar dados.', 'error');
            return;
        }
        
        const dataStr = JSON.stringify(this.data, null, 2);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        
        const exportFileDefaultName = `equipamentos-usina-${new Date().toISOString().split('T')[0]}.json`;
        
        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
        
        this.mostrarMensagem('Dados exportados com sucesso', 'success');
    }
    
    mostrarLoading(mostrar) {
        const container = document.getElementById('equipamentos-container');
        if (mostrar) {
            container.innerHTML = `
                <div class="loading">
                    <i class="fas fa-cog fa-spin"></i>
                    <p>Carregando equipamentos...</p>
                </div>
            `;
        }
    }
    
    mostrarMensagem(texto, tipo) {
        // Remover mensagem anterior se existir
        const mensagemAnterior = document.querySelector('.mensagem-flutuante');
        if (mensagemAnterior) {
            mensagemAnterior.remove();
        }
        
        // Criar nova mensagem
        const mensagem = document.createElement('div');
        mensagem.className = `mensagem-flutuante ${tipo}`;
        mensagem.innerHTML = `
            <div class="mensagem-conteudo">
                <i class="fas fa-${tipo === 'success' ? 'check-circle' : tipo === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
                <span>${texto}</span>
            </div>
        `;
        
        // Adicionar ao corpo
        document.body.appendChild(mensagem);
        
        // Mostrar
        setTimeout(() => {
            mensagem.classList.add('show');
        }, 10);
        
        // Remover após 5 segundos
        setTimeout(() => {
            mensagem.classList.remove('show');
            setTimeout(() => {
                if (mensagem.parentNode) {
                    mensagem.remove();
                }
            }, 300);
        }, 5000);
        
        // Adicionar estilos para a mensagem se não existirem
        if (!document.querySelector('#mensagem-estilos')) {
            const estilos = document.createElement('style');
            estilos.id = 'mensagem-estilos';
            estilos.textContent = `
                .mensagem-flutuante {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background: white;
                    padding: 15px 20px;
                    border-radius: 8px;
                    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.2);
                    z-index: 10000;
                    transform: translateX(100%);
                    opacity: 0;
                    transition: transform 0.3s ease, opacity 0.3s ease;
                    max-width: 400px;
                    border-left: 4px solid #3498db;
                }
                .mensagem-flutuante.show {
                    transform: translateX(0);
                    opacity: 1;
                }
                .mensagem-flutuante.success {
                    border-left-color: #2ecc71;
                }
                .mensagem-flutuante.error {
                    border-left-color: #e74c3c;
                }
                .mensagem-flutuante.info {
                    border-left-color: #3498db;
                }
                .mensagem-conteudo {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                .mensagem-conteudo i {
                    font-size: 20px;
                }
                .mensagem-flutuante.success .mensagem-conteudo i {
                    color: #2ecc71;
                }
                .mensagem-flutuante.error .mensagem-conteudo i {
                    color: #e74c3c;
                }
                .mensagem-flutuante.info .mensagem-conteudo i {
                    color: #3498db;
                }
            `;
            document.head.appendChild(estilos);
        }
    }
    
    abrirModalUsuarios() {
        const modal = this.modals.usuarios;
        if (!modal) return;
        
        this.renderizarListaUsuarios();
        modal.classList.add('active');
    }
    
    renderizarListaUsuarios() {
        const container = document.getElementById('usuarios-list');
        if (!container || !this.data.usuarios) return;
        
        container.innerHTML = this.data.usuarios.map(usuario => {
            const isCurrentUser = usuario.id === this.usuarioLogado.id;
            
            return `
                <div class="usuario-item">
                    <div class="usuario-info">
                        <h4>${usuario.nome} ${isCurrentUser ? '(Você)' : ''}</h4>
                        <div class="usuario-meta">
                            <span><i class="fas fa-user"></i> ${usuario.username}</span>
                            <span><i class="fas fa-envelope"></i> ${usuario.email || 'N/A'}</span>
                            <span><i class="fas fa-shield-alt"></i> ${APP_CONFIG.roles[usuario.role]}</span>
                            ${usuario.setor !== 'todos' ? `<span><i class="fas fa-building"></i> ${usuario.setor}</span>` : ''}
                            <span class="usuario-status ${usuario.ativo ? 'ativo' : 'inativo'}">
                                ${usuario.ativo ? 'Ativo' : 'Inativo'}
                            </span>
                        </div>
                    </div>
                    <div class="usuario-actions">
                        ${!isCurrentUser ? `
                            <button class="btn-editar-usuario" data-id="${usuario.id}">
                                <i class="fas fa-edit"></i> Editar
                            </button>
                            <button class="btn-excluir-usuario" data-id="${usuario.id}">
                                <i class="fas fa-trash"></i> Excluir
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
        
        // Adicionar eventos aos botões
        container.querySelectorAll('.btn-editar-usuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const usuarioId = parseInt(e.target.closest('.btn-editar-usuario').dataset.id);
                this.abrirModalUsuario(usuarioId);
            });
        });
        
        container.querySelectorAll('.btn-excluir-usuario').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const usuarioId = parseInt(e.target.closest('.btn-excluir-usuario').dataset.id);
                this.excluirUsuario(usuarioId);
            });
        });
    }
    
    abrirModalUsuario(usuarioId = null) {
        const modal = this.modals.usuario;
        const form = document.getElementById('usuario-form');
        const titulo = document.getElementById('usuario-modal-title');
        
        if (!modal || !form || !titulo) return;
        
        if (usuarioId) {
            // Modo edição
            const usuario = this.data.usuarios.find(u => u.id === usuarioId);
            if (!usuario) return;
            
            titulo.textContent = 'Editar Usuário';
            
            // Preencher formulário
            document.getElementById('usuario-id').value = usuario.id;
            document.getElementById('usuario-username').value = usuario.username;
            document.getElementById('usuario-nome').value = usuario.nome;
            document.getElementById('usuario-email').value = usuario.email || '';
            document.getElementById('usuario-role').value = usuario.role;
            document.getElementById('usuario-setor').value = usuario.setor || 'todos';
            document.getElementById('usuario-ativo').checked = usuario.ativo;
            
            // Manter campos de senha vazios para edição
            document.getElementById('usuario-password').required = false;
            document.getElementById('usuario-confirm-password').required = false;
        } else {
            // Modo criação
            titulo.textContent = 'Novo Usuário';
            form.reset();
            
            // Limpar ID
            document.getElementById('usuario-id').value = '';
            
            // Senha obrigatória para novo usuário
            document.getElementById('usuario-password').required = true;
            document.getElementById('usuario-confirm-password').required = true;
        }
        
        // Fechar modal de lista se estiver aberto
        const usuariosModal = document.getElementById('usuarios-modal');
        if (usuariosModal) {
            usuariosModal.classList.remove('active');
        }
        
        modal.classList.add('active');
    }
    
    async salvarUsuario() {
        const form = document.getElementById('usuario-form');
        const usuarioId = document.getElementById('usuario-id').value;
        const isEdit = usuarioId && usuarioId !== '';
        
        const usuario = {
            username: document.getElementById('usuario-username').value.trim(),
            nome: document.getElementById('usuario-nome').value.trim(),
            email: document.getElementById('usuario-email').value.trim() || null,
            role: document.getElementById('usuario-role').value,
            setor: document.getElementById('usuario-setor').value,
            ativo: document.getElementById('usuario-ativo').checked
        };
        
        // Validação
        if (!usuario.username || !usuario.nome || !usuario.role) {
            this.mostrarMensagem('Preencha todos os campos obrigatórios.', 'error');
            return;
        }
        
        // Verificar se username já existe (em modo criação)
        if (!isEdit) {
            const usernameExists = this.data.usuarios.some(u => 
                u.username.toLowerCase() === usuario.username.toLowerCase()
            );
            
            if (usernameExists) {
                this.mostrarMensagem('Este nome de usuário já está em uso.', 'error');
                return;
            }
        }
        
        // Senha
        const password = document.getElementById('usuario-password').value;
        const confirmPassword = document.getElementById('usuario-confirm-password').value;
        
        if (!isEdit) {
            if (!password) {
                this.mostrarMensagem('A senha é obrigatória para novo usuário.', 'error');
                return;
            }
            
            if (password !== confirmPassword) {
                this.mostrarMensagem('As senhas não coincidem.', 'error');
                return;
            }
            
            usuario.password = password;
        } else if (password) {
            // Se está editando e digitou nova senha
            if (password !== confirmPassword) {
                this.mostrarMensagem('As senhas não coincidem.', 'error');
                return;
            }
            usuario.password = password;
        } else {
            // Se está editando e não digitou senha, manter a atual
            const usuarioExistente = this.data.usuarios.find(u => u.id === parseInt(usuarioId));
            if (usuarioExistente) {
                usuario.password = usuarioExistente.password;
            }
        }
        
        if (isEdit) {
            // Atualizar usuário existente
            const id = parseInt(usuarioId);
            const index = this.data.usuarios.findIndex(u => u.id === id);
            
            if (index !== -1) {
                usuario.id = id;
                usuario.dataCriacao = this.data.usuarios[index].dataCriacao;
                this.data.usuarios[index] = usuario;
                
                this.mostrarMensagem('Usuário atualizado com sucesso', 'success');
            }
        } else {
            // Criar novo usuário
            usuario.id = this.data.nextUsuarioId++;
            usuario.dataCriacao = new Date().toISOString().split('T')[0];
            
            this.data.usuarios.push(usuario);
            
            this.mostrarMensagem('Usuário criado com sucesso', 'success');
        }
        
        // Salvar dados
        const salvou = await this.salvarDados();
        
        // Fechar modal e atualizar lista
        this.fecharModal(document.getElementById('usuario-modal'));
        this.renderizarListaUsuarios();
    }
    
    async excluirUsuario(usuarioId) {
        if (usuarioId === this.usuarioLogado.id) {
            this.mostrarMensagem('Você não pode excluir seu próprio usuário.', 'error');
            return;
        }
        
        if (!confirm('Tem certeza que deseja excluir este usuário?')) {
            return;
        }
        
        const usuario = this.data.usuarios.find(u => u.id === usuarioId);
        if (!usuario) return;
        
        // Não permitir excluir o último administrador
        if (usuario.role === 'administrador') {
            const totalAdministradores = this.data.usuarios.filter(u => 
                u.role === 'administrador' && u.ativo === true
            ).length;
            
            if (totalAdministradores <= 1) {
                this.mostrarMensagem('Não é possível excluir o único administrador ativo.', 'error');
                return;
            }
        }
        
        // Remover usuário
        this.data.usuarios = this.data.usuarios.filter(u => u.id !== usuarioId);
        
        // Remover sessões do usuário excluído
        if (this.data.sessoesAtivas) {
            this.data.sessoesAtivas = this.data.sessoesAtivas.filter(s => s.usuarioId !== usuarioId);
        }
        
        // Salvar dados
        await this.salvarDados();
        
        // Atualizar lista
        this.renderizarListaUsuarios();
        
        this.mostrarMensagem('Usuário excluído com sucesso', 'success');
    }
}

// Inicializar a aplicação quando o DOM estiver carregado
document.addEventListener('DOMContentLoaded', () => {
    const app = new EquipamentosApp();
    window.app = app; // Para depuração
});
