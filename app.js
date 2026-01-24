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
        // Primeiro, verificar se há sessão ativa
        await this.verificarSessao();
        
        // Se não houver usuário logado, mostrar tela de login
        if (!this.usuarioLogado) {
            this.mostrarTelaLogin();
            return;
        }
        
        // Se estiver logado, continuar com a inicialização normal
        this.inicializarAplicacao();
    }
    
    async verificarSessao() {
        try {
            // Verificar se há token salvo no localStorage
            const token = localStorage.getItem('equipamentos_token');
            if (!token) {
                return;
            }
            
            // Carregar dados para verificar sessões
            await this.carregarDados(true); // true = carregar sem mostrar loading
            
            // Encontrar sessão válida
            const sessaoAtiva = this.data.sessoesAtivas?.find(s => 
                s.token === token && 
                new Date(s.validade) > new Date()
            );
            
            if (sessaoAtiva) {
                // Encontrar usuário
                const usuario = this.data.usuarios?.find(u => 
                    u.id === sessaoAtiva.usuarioId && 
                    u.ativo === true
                );
                
                if (usuario) {
                    this.usuarioLogado = usuario;
                    this.sessaoAtiva = sessaoAtiva;
                    console.log('Usuário logado automaticamente:', usuario.username);
                } else {
                    // Limpar token inválido
                    localStorage.removeItem('equipamentos_token');
                }
            } else {
                // Limpar token expirado
                localStorage.removeItem('equipamentos_token');
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
    }
    
    adicionarEstilosLogin() {
        const estilos = document.createElement('style');
        estilos.textContent = `
            .login-container {
                display: flex;
                min-height: 100vh;
                background: linear-gradient(135deg, #2c3e50 0%, #3498db 100%);
                font-family: 'Roboto', sans-serif;
            }
            
            .login-card {
                background: white;
                padding: 40px;
                border-radius: 10px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
                width: 400px;
                margin: auto;
            }
            
            .login-header {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .login-header h1 {
                color: #2c3e50;
                margin-bottom: 10px;
                font-size: 24px;
            }
            
            .login-header .subtitle {
                color: #7f8c8d;
                font-size: 14px;
            }
            
            .login-form .form-group {
                margin-bottom: 20px;
            }
            
            .login-form label {
                display: block;
                margin-bottom: 5px;
                color: #2c3e50;
                font-weight: 500;
            }
            
            .login-form input {
                width: 100%;
                padding: 12px;
                border: 1px solid #ddd;
                border-radius: 5px;
                font-size: 14px;
            }
            
            .login-form input:focus {
                outline: none;
                border-color: #3498db;
                box-shadow: 0 0 0 2px rgba(52, 152, 219, 0.2);
            }
            
            .remember-me {
                display: flex;
                align-items: center;
            }
            
            .remember-me input {
                width: auto;
                margin-right: 10px;
            }
            
            .btn-login {
                width: 100%;
                padding: 12px;
                background: #3498db;
                color: white;
                border: none;
                border-radius: 5px;
                font-size: 16px;
                font-weight: 500;
                cursor: pointer;
                transition: background 0.3s;
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 10px;
            }
            
            .btn-login:hover {
                background: #2980b9;
            }
            
            .login-footer {
                margin-top: 20px;
                text-align: center;
                color: #7f8c8d;
                font-size: 12px;
                border-top: 1px solid #eee;
                padding-top: 20px;
            }
            
            .demo-credentials {
                background: #f8f9fa;
                padding: 10px;
                border-radius: 5px;
                margin-top: 10px;
                font-size: 11px;
                text-align: left;
            }
            
            .login-message {
                margin-top: 15px;
                padding: 10px;
                border-radius: 5px;
                display: none;
            }
            
            .login-message.error {
                background: #fef2f2;
                color: #dc2626;
                border: 1px solid #fecaca;
                display: block;
            }
            
            .login-message.success {
                background: #f0fdf4;
                color: #16a34a;
                border: 1px solid #bbf7d0;
                display: block;
            }
            
            .login-info {
                background: rgba(255, 255, 255, 0.1);
                padding: 40px;
                width: 400px;
                color: white;
                backdrop-filter: blur(10px);
            }
            
            .login-info h3 {
                margin-bottom: 20px;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .roles-info {
                margin-top: 30px;
            }
            
            .role-item {
                margin-bottom: 15px;
                padding: 10px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 5px;
            }
            
            .role-badge {
                display: inline-block;
                padding: 3px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: 500;
                margin-bottom: 5px;
            }
            
            .role-badge.administrador {
                background: #dc2626;
                color: white;
            }
            
            .role-badge.supervisor {
                background: #f59e0b;
                color: white;
            }
            
            .role-badge.tecnico {
                background: #3b82f6;
                color: white;
            }
            
            .role-badge.visualizador {
                background: #10b981;
                color: white;
            }
            
            .role-item p {
                font-size: 12px;
                opacity: 0.9;
                margin: 0;
            }
            
            @media (max-width: 768px) {
                .login-container {
                    flex-direction: column;
                }
                
                .login-card, .login-info {
                    width: 90%;
                    margin: 20px auto;
                }
            }
        `;
        
        document.head.appendChild(estilos);
    }
    
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
                            <button id="add-equipamento" class="btn-primary">
                                <i class="fas fa-plus-circle"></i> Novo Equipamento
                            </button>
                            <button id="add-pendencia" class="btn-secondary" disabled>
                                <i class="fas fa-exclamation-circle"></i> Nova Pendência
                            </button>
                            <button id="export-data" class="btn-secondary">
                                <i class="fas fa-file-export"></i> Exportar Dados
                            </button>
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
            this.equipamentos = this.equipamentos.filter(equipamento => {
                // Mapear setor do equipamento para responsável
                const setorEquipamento = equipamento.setor;
                // Simplificação: vamos considerar que o técnico só vê equipamentos
                // onde as pendências são do seu setor
                const temPendenciasDoSetor = equipamento.pendencias.some(p => 
                    p.responsavel === this.usuarioLogado.setor
                );
                
                return temPendenciasDoSetor;
            });
        }
    }
    
    // O restante do código permanece igual, mas com verificação de permissões nos métodos
    
    async salvarEquipamento() {
        if (!this.temPermissao('criarEquipamentos') && !this.temPermissao('editarEquipamentos')) {
            this.mostrarMensagem('Você não tem permissão para esta ação.', 'error');
            return;
        }
        
        // ... resto do código da função salvarEquipamento
    }
    
    async salvarPendencia() {
        if (!this.temPermissao('criarPendencias') && !this.temPermissao('editarPendencias')) {
            this.mostrarMensagem('Você não tem permissão para esta ação.', 'error');
            return;
        }
        
        // ... resto do código da função salvarPendencia
    }
    
    async excluirPendencia(pendenciaId) {
        if (!this.temPermissao('excluirPendencias')) {
            this.mostrarMensagem('Você não tem permissão para excluir pendências.', 'error');
            return;
        }
        
        // ... resto do código da função excluirPendencia
    }
    
    exportarDados() {
        if (!this.temPermissao('exportarDados')) {
            this.mostrarMensagem('Você não tem permissão para exportar dados.', 'error');
            return;
        }
        
        // ... resto do código da função exportarDados
    }
    
    // Adicionar eventos para gerenciamento de usuários
    initEvents() {
        // ... eventos existentes
        
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
    
    abrirModalUsuarios() {
        const modal = document.getElementById('usuarios-modal');
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
        const modal = document.getElementById('usuario-modal');
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
    
    // O restante dos métodos permanecem como antes...
    // ... (todas as outras funções do app.js)
}
