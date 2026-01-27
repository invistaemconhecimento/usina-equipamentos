// ===========================================
// SISTEMA DE GERENCIAMENTO DE USUÁRIOS
// ===========================================

class GerenciadorUsuarios {
    constructor() {
        this.usuarios = {};
        this.carregarUsuarios();
    }
    
    carregarUsuarios() {
        // Carregar do localStorage ou usar padrão
        const usuariosSalvos = localStorage.getItem('gestao_equipamentos_usuarios');
        
        if (usuariosSalvos) {
            this.usuarios = JSON.parse(usuariosSalvos);
        } else {
            // Usar usuários padrão do config.js
            this.usuarios = window.USUARIOS_AUTORIZADOS || {};
            this.salvarUsuarios();
        }
    }
    
    salvarUsuarios() {
        localStorage.setItem('gestao_equipamentos_usuarios', JSON.stringify(this.usuarios));
    }
    
    listarUsuarios() {
        return Object.entries(this.usuarios).map(([username, info]) => ({
            username,
            nome: info.nome,
            email: info.email || '',
            nivel: info.nivel,
            departamento: info.departamento || '',
            dataCriacao: info.dataCriacao || new Date().toISOString(),
            criadoPor: info.criadoPor || 'sistema',
            ativo: info.ativo !== false
        }));
    }
    
    obterUsuario(username) {
        return this.usuarios[username];
    }
    
    criarUsuario(usuario, senha, infoAdicional = {}) {
        if (this.usuarios[usuario]) {
            throw new Error('Usuário já existe');
        }
        
        const usuarioLogado = window.getUsuarioLogado();
        const nivelUsuario = window.getNivelUsuario();
        
        // Verificar permissão
        if (nivelUsuario !== 'administrador') {
            throw new Error('Apenas administradores podem criar usuários');
        }
        
        this.usuarios[usuario] = {
            senha: senha,
            nivel: infoAdicional.nivel || 'visitante',
            nome: infoAdicional.nome || usuario,
            email: infoAdicional.email || '',
            departamento: infoAdicional.departamento || '',
            dataCriacao: new Date().toISOString(),
            criadoPor: usuarioLogado,
            ativo: true
        };
        
        this.salvarUsuarios();
        
        // Registrar log
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'CRIAR_USUARIO',
                `Criou usuário: ${usuario} (${infoAdicional.nivel || 'visitante'})`,
                null,
                null,
                usuarioLogado
            );
        }
        
        return this.usuarios[usuario];
    }
    
    atualizarUsuario(username, dados) {
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado();
        const nivelUsuario = window.getNivelUsuario();
        
        // Verificar permissão
        if (nivelUsuario !== 'administrador' && usuarioLogado !== username) {
            throw new Error('Sem permissão para atualizar este usuário');
        }
        
        // Atualizar dados permitidos
        const usuario = this.usuarios[username];
        
        if (dados.nome !== undefined) usuario.nome = dados.nome;
        if (dados.email !== undefined) usuario.email = dados.email;
        if (dados.departamento !== undefined) usuario.departamento = dados.departamento;
        
        // Apenas admin pode alterar nível
        if (dados.nivel !== undefined && nivelUsuario === 'administrador') {
            usuario.nivel = dados.nivel;
        }
        
        // Apenas admin pode ativar/desativar
        if (dados.ativo !== undefined && nivelUsuario === 'administrador') {
            usuario.ativo = dados.ativo;
        }
        
        usuario.atualizadoEm = new Date().toISOString();
        usuario.atualizadoPor = usuarioLogado;
        
        this.salvarUsuarios();
        
        // Registrar log
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'ATUALIZAR_USUARIO',
                `Atualizou usuário: ${username}`,
                null,
                null,
                usuarioLogado
            );
        }
        
        return usuario;
    }
    
    redefinirSenha(username, novaSenha) {
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado();
        const nivelUsuario = window.getNivelUsuario();
        
        // Verificar permissão (apenas admin ou o próprio usuário)
        if (nivelUsuario !== 'administrador' && usuarioLogado !== username) {
            throw new Error('Sem permissão para redefinir senha');
        }
        
        this.usuarios[username].senha = novaSenha;
        this.usuarios[username].senhaRedefinidaEm = new Date().toISOString();
        this.usuarios[username].senhaRedefinidaPor = usuarioLogado;
        
        this.salvarUsuarios();
        
        // Registrar log
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'REDEFINIR_SENHA',
                `Redefiniu senha do usuário: ${username}`,
                null,
                null,
                usuarioLogado
            );
        }
        
        return true;
    }
    
    desativarUsuario(username) {
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado();
        const nivelUsuario = window.getNivelUsuario();
        
        // Apenas administrador pode desativar usuários
        if (nivelUsuario !== 'administrador') {
            throw new Error('Apenas administradores podem desativar usuários');
        }
        
        this.usuarios[username].ativo = false;
        this.usuarios[username].desativadoEm = new Date().toISOString();
        this.usuarios[username].desativadoPor = usuarioLogado;
        
        this.salvarUsuarios();
        
        // Registrar log
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'DESATIVAR_USUARIO',
                `Desativou usuário: ${username}`,
                null,
                null,
                usuarioLogado
            );
        }
        
        return true;
    }
    
    ativarUsuario(username) {
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado();
        const nivelUsuario = window.getNivelUsuario();
        
        // Apenas administrador pode ativar usuários
        if (nivelUsuario !== 'administrador') {
            throw new Error('Apenas administradores podem ativar usuários');
        }
        
        this.usuarios[username].ativo = true;
        this.usuarios[username].ativadoEm = new Date().toISOString();
        this.usuarios[username].ativadoPor = usuarioLogado;
        
        this.salvarUsuarios();
        
        // Registrar log
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'ATIVAR_USUARIO',
                `Ativou usuário: ${username}`,
                null,
                null,
                usuarioLogado
            );
        }
        
        return true;
    }
    
    excluirUsuario(username) {
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado();
        const nivelUsuario = window.getNivelUsuario();
        
        // Apenas administrador pode excluir usuários
        if (nivelUsuario !== 'administrador') {
            throw new Error('Apenas administradores podem excluir usuários');
        }
        
        // Não permitir excluir a si mesmo
        if (usuarioLogado === username) {
            throw new Error('Não é permitido excluir seu próprio usuário');
        }
        
        // Registrar log antes de excluir
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'EXCLUIR_USUARIO',
                `Excluiu usuário: ${username}`,
                null,
                null,
                usuarioLogado
            );
        }
        
        delete this.usuarios[username];
        this.salvarUsuarios();
        
        return true;
    }
    
    verificarLogin(username, senha) {
        const usuario = this.usuarios[username];
        
        if (!usuario) {
            return { sucesso: false, mensagem: 'Usuário não encontrado' };
        }
        
        if (!usuario.ativo) {
            return { sucesso: false, mensagem: 'Usuário desativado' };
        }
        
        if (usuario.senha !== senha) {
            return { sucesso: false, mensagem: 'Senha incorreta' };
        }
        
        return { 
            sucesso: true, 
            usuario: {
                username,
                nome: usuario.nome,
                nivel: usuario.nivel,
                email: usuario.email,
                departamento: usuario.departamento
            }
        };
    }
    
    gerarRelatorioUsuarios() {
        const usuarios = this.listarUsuarios();
        const agora = new Date();
        
        let relatorio = `RELATÓRIO DE USUÁRIOS\n`;
        relatorio += `Gerado em: ${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}\n`;
        relatorio += `Total de usuários: ${usuarios.length}\n\n`;
        
        relatorio += `=== USUÁRIOS ATIVOS ===\n`;
        usuarios.filter(u => u.ativo).forEach(usuario => {
            relatorio += `\nUsuário: ${usuario.username}\n`;
            relatorio += `Nome: ${usuario.nome}\n`;
            relatorio += `Nível: ${usuario.nivel}\n`;
            relatorio += `E-mail: ${usuario.email || 'Não informado'}\n`;
            relatorio += `Departamento: ${usuario.departamento || 'Não informado'}\n`;
            relatorio += `Criado por: ${usuario.criadoPor}\n`;
            relatorio += `Data criação: ${new Date(usuario.dataCriacao).toLocaleDateString('pt-BR')}\n`;
            relatorio += `----------------------------------------\n`;
        });
        
        relatorio += `\n=== USUÁRIOS DESATIVADOS ===\n`;
        usuarios.filter(u => !u.ativo).forEach(usuario => {
            relatorio += `\nUsuário: ${usuario.username} (DESATIVADO)\n`;
            relatorio += `Nome: ${usuario.nome}\n`;
            relatorio += `Nível: ${usuario.nivel}\n`;
            relatorio += `----------------------------------------\n`;
        });
        
        return relatorio;
    }
}

// ===========================================
// FUNÇÕES DE INTERFACE PARA GERENCIAR USUÁRIOS
// ===========================================

function abrirGerenciadorUsuarios() {
    // Verificar permissão
    const usuario = window.getUsuarioLogado();
    if (!window.PERMISSOES.verificarPermissao(usuario, 'gerenciar_usuarios')) {
        window.app.mostrarMensagem('Você não tem permissão para gerenciar usuários', 'error');
        return;
    }
    
    const gerenciador = new GerenciadorUsuarios();
    const usuarios = gerenciador.listarUsuarios();
    
    // Criar HTML do modal
    const html = `
        <div class="gerenciador-usuarios">
            <div class="usuarios-header">
                <h3><i class="fas fa-users-cog"></i> Gerenciar Usuários</h3>
                <div class="usuarios-acoes">
                    <button id="btn-novo-usuario" class="btn-primary">
                        <i class="fas fa-user-plus"></i> Novo Usuário
                    </button>
                    <button id="btn-exportar-usuarios" class="btn-secondary">
                        <i class="fas fa-file-export"></i> Exportar Relatório
                    </button>
                </div>
            </div>
            
            <div class="usuarios-filtros">
                <div class="search-box">
                    <i class="fas fa-search"></i>
                    <input type="text" id="search-usuarios" placeholder="Buscar usuários...">
                </div>
                <select id="filter-nivel">
                    <option value="all">Todos os níveis</option>
                    <option value="visitante">Visitante</option>
                    <option value="operador">Operador</option>
                    <option value="administrador">Administrador</option>
                </select>
                <select id="filter-status">
                    <option value="all">Todos os status</option>
                    <option value="ativo">Ativos</option>
                    <option value="inativo">Inativos</option>
                </select>
            </div>
            
            <div class="usuarios-container">
                <table class="usuarios-table">
                    <thead>
                        <tr>
                            <th>Usuário</th>
                            <th>Nome</th>
                            <th>Nível</th>
                            <th>E-mail</th>
                            <th>Departamento</th>
                            <th>Status</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody id="usuarios-list">
                        ${usuarios.map(usuario => {
                            const nivelInfo = window.PERMISSOES.niveis[usuario.nivel] || { nome: 'Desconhecido', cor: '#95a5a6' };
                            return `
                                <tr class="usuario-item ${!usuario.ativo ? 'inativo' : ''}">
                                    <td>
                                        <div class="usuario-username">
                                            <i class="fas fa-user"></i> ${usuario.username}
                                        </div>
                                    </td>
                                    <td>${usuario.nome}</td>
                                    <td>
                                        <span class="nivel-badge" style="background: ${nivelInfo.cor}">
                                            ${nivelInfo.nome}
                                        </span>
                                    </td>
                                    <td>${usuario.email || '-'}</td>
                                    <td>${usuario.departamento || '-'}</td>
                                    <td>
                                        <span class="status-usuario ${usuario.ativo ? 'ativo' : 'inativo'}">
                                            <i class="fas fa-circle"></i> ${usuario.ativo ? 'Ativo' : 'Inativo'}
                                        </span>
                                    </td>
                                    <td>
                                        <div class="usuario-actions">
                                            <button class="btn-editar-usuario" data-username="${usuario.username}">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button class="btn-redefinir-senha" data-username="${usuario.username}">
                                                <i class="fas fa-key"></i>
                                            </button>
                                            ${usuario.ativo ? 
                                                `<button class="btn-desativar-usuario" data-username="${usuario.username}">
                                                    <i class="fas fa-user-slash"></i>
                                                </button>` :
                                                `<button class="btn-ativar-usuario" data-username="${usuario.username}">
                                                    <i class="fas fa-user-check"></i>
                                                </button>`
                                            }
                                            <button class="btn-excluir-usuario" data-username="${usuario.username}">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>
            </div>
            
            <div class="usuarios-stats">
                <div class="stat">
                    <span class="stat-value">${usuarios.length}</span>
                    <span class="stat-label">Total de Usuários</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${usuarios.filter(u => u.ativo).length}</span>
                    <span class="stat-label">Usuários Ativos</span>
                </div>
                <div class="stat">
                    <span class="stat-value">${usuarios.filter(u => u.nivel === 'administrador').length}</span>
                    <span class="stat-label">Administradores</span>
                </div>
            </div>
        </div>
        
        <style>
            .gerenciador-usuarios {
                max-width: 1200px;
                margin: 0 auto;
            }
            
            .usuarios-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid var(--cor-borda);
            }
            
            .usuarios-acoes {
                display: flex;
                gap: 10px;
            }
            
            .usuarios-filtros {
                display: flex;
                gap: 10px;
                margin-bottom: 20px;
                flex-wrap: wrap;
            }
            
            .search-box {
                flex: 1;
                position: relative;
                min-width: 250px;
            }
            
            .search-box i {
                position: absolute;
                left: 12px;
                top: 50%;
                transform: translateY(-50%);
                color: var(--cor-texto-secundario);
            }
            
            .search-box input {
                width: 100%;
                padding: 10px 10px 10px 35px;
                border: 1px solid var(--cor-borda);
                border-radius: 5px;
                background: var(--cor-card);
                color: var(--cor-texto);
            }
            
            .usuarios-filtros select {
                padding: 10px;
                border: 1px solid var(--cor-borda);
                border-radius: 5px;
                background: var(--cor-card);
                color: var(--cor-texto);
                min-width: 150px;
            }
            
            .usuarios-container {
                max-height: 400px;
                overflow-y: auto;
                margin-bottom: 20px;
                border: 1px solid var(--cor-borda);
                border-radius: 5px;
            }
            
            .usuarios-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .usuarios-table th {
                position: sticky;
                top: 0;
                background: var(--cor-fundo-secundario);
                padding: 12px;
                text-align: left;
                border-bottom: 2px solid var(--cor-borda);
                font-weight: 600;
                color: var(--cor-texto);
                z-index: 10;
            }
            
            .usuarios-table td {
                padding: 12px;
                border-bottom: 1px solid var(--cor-borda);
            }
            
            .usuario-item:hover {
                background: var(--cor-fundo-secundario);
            }
            
            .usuario-item.inativo {
                opacity: 0.6;
                background: rgba(149, 165, 166, 0.1);
            }
            
            .usuario-username {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }
            
            .nivel-badge {
                display: inline-block;
                padding: 4px 10px;
                border-radius: 12px;
                color: white;
                font-size: 12px;
                font-weight: 500;
                text-transform: uppercase;
            }
            
            .status-usuario {
                display: flex;
                align-items: center;
                gap: 5px;
                font-size: 12px;
                font-weight: 500;
            }
            
            .status-usuario.ativo {
                color: var(--cor-sucesso);
            }
            
            .status-usuario.inativo {
                color: var(--cor-texto-secundario);
            }
            
            .status-usuario i {
                font-size: 8px;
            }
            
            .usuario-actions {
                display: flex;
                gap: 5px;
            }
            
            .usuario-actions button {
                padding: 6px 8px;
                border: none;
                border-radius: 4px;
                background: var(--cor-fundo-secundario);
                color: var(--cor-texto);
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .usuario-actions button:hover {
                transform: translateY(-2px);
                box-shadow: var(--sombra);
            }
            
            .usuario-actions .btn-editar-usuario:hover {
                background: var(--cor-destaque);
                color: white;
            }
            
            .usuario-actions .btn-redefinir-senha:hover {
                background: var(--cor-alerta);
                color: white;
            }
            
            .usuario-actions .btn-desativar-usuario:hover {
                background: var(--cor-erro);
                color: white;
            }
            
            .usuario-actions .btn-ativar-usuario:hover {
                background: var(--cor-sucesso);
                color: white;
            }
            
            .usuario-actions .btn-excluir-usuario:hover {
                background: var(--cor-erro);
                color: white;
            }
            
            .usuarios-stats {
                display: flex;
                gap: 20px;
                padding-top: 20px;
                border-top: 1px solid var(--cor-borda);
            }
            
            .usuarios-stats .stat {
                flex: 1;
                text-align: center;
                background: var(--cor-fundo-secundario);
                padding: 15px;
                border-radius: 8px;
            }
            
            .usuarios-stats .stat-value {
                display: block;
                font-size: 24px;
                font-weight: 700;
                color: var(--cor-destaque);
            }
            
            .usuarios-stats .stat-label {
                font-size: 12px;
                color: var(--cor-texto-secundario);
                text-transform: uppercase;
                letter-spacing: 1px;
            }
        </style>
    `;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content large" style="max-width: 1300px;">
            <div class="modal-header">
                <h3><i class="fas fa-users"></i> Gerenciamento de Usuários</h3>
                <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                ${html}
                <div class="form-actions">
                    <button onclick="this.closest('.modal').remove()" class="btn-primary">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    configurarEventosGerenciadorUsuarios(modal, gerenciador);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

function configurarEventosGerenciadorUsuarios(modal, gerenciador) {
    // Botão novo usuário
    modal.querySelector('#btn-novo-usuario').addEventListener('click', function() {
        abrirModalNovoUsuario(gerenciador, modal);
    });
    
    // Botão exportar
    modal.querySelector('#btn-exportar-usuarios').addEventListener('click', function() {
        exportarRelatorioUsuarios(gerenciador);
    });
    
    // Filtros
    modal.querySelector('#search-usuarios').addEventListener('input', function(e) {
        filtrarUsuarios(modal, gerenciador);
    });
    
    modal.querySelector('#filter-nivel').addEventListener('change', function() {
        filtrarUsuarios(modal, gerenciador);
    });
    
    modal.querySelector('#filter-status').addEventListener('change', function() {
        filtrarUsuarios(modal, gerenciador);
    });
    
    // Ações dos usuários
    modal.addEventListener('click', function(e) {
        const target = e.target.closest('button');
        if (!target) return;
        
        const username = target.dataset.username;
        if (!username) return;
        
        if (target.classList.contains('btn-editar-usuario')) {
            abrirModalEditarUsuario(username, gerenciador, modal);
        } else if (target.classList.contains('btn-redefinir-senha')) {
            redefinirSenhaUsuario(username, gerenciador, modal);
        } else if (target.classList.contains('btn-desativar-usuario')) {
            desativarUsuario(username, gerenciador, modal);
        } else if (target.classList.contains('btn-ativar-usuario')) {
            ativarUsuario(username, gerenciador, modal);
        } else if (target.classList.contains('btn-excluir-usuario')) {
            excluirUsuario(username, gerenciador, modal);
        }
    });
}

function filtrarUsuarios(modal, gerenciador) {
    const searchTerm = modal.querySelector('#search-usuarios').value.toLowerCase();
    const nivelFilter = modal.querySelector('#filter-nivel').value;
    const statusFilter = modal.querySelector('#filter-status').value;
    
    const usuarios = gerenciador.listarUsuarios();
    
    const usuariosFiltrados = usuarios.filter(usuario => {
        // Filtrar por busca
        if (searchTerm) {
            const busca = searchTerm.toLowerCase();
            const usernameMatch = usuario.username.toLowerCase().includes(busca);
            const nomeMatch = usuario.nome.toLowerCase().includes(busca);
            const emailMatch = (usuario.email || '').toLowerCase().includes(busca);
            const deptoMatch = (usuario.departamento || '').toLowerCase().includes(busca);
            
            if (!usernameMatch && !nomeMatch && !emailMatch && !deptoMatch) {
                return false;
            }
        }
        
        // Filtrar por nível
        if (nivelFilter !== 'all' && usuario.nivel !== nivelFilter) {
            return false;
        }
        
        // Filtrar por status
        if (statusFilter !== 'all') {
            const isAtivo = usuario.ativo;
            if (statusFilter === 'ativo' && !isAtivo) return false;
            if (statusFilter === 'inativo' && isAtivo) return false;
        }
        
        return true;
    });
    
    // Atualizar lista
    atualizarListaUsuarios(modal, usuariosFiltrados);
    
    // Atualizar estatísticas
    const statsContainer = modal.querySelector('.usuarios-stats');
    if (statsContainer) {
        const totalAtivos = usuariosFiltrados.filter(u => u.ativo).length;
        const totalAdmins = usuariosFiltrados.filter(u => u.nivel === 'administrador').length;
        
        statsContainer.innerHTML = `
            <div class="stat">
                <span class="stat-value">${usuariosFiltrados.length}</span>
                <span class="stat-label">Total de Usuários</span>
            </div>
            <div class="stat">
                <span class="stat-value">${totalAtivos}</span>
                <span class="stat-label">Usuários Ativos</span>
            </div>
            <div class="stat">
                <span class="stat-value">${totalAdmins}</span>
                <span class="stat-label">Administradores</span>
            </div>
        `;
    }
}

function atualizarListaUsuarios(modal, usuarios) {
    const tbody = modal.querySelector('#usuarios-list');
    
    tbody.innerHTML = usuarios.map(usuario => {
        const nivelInfo = window.PERMISSOES.niveis[usuario.nivel] || { nome: 'Desconhecido', cor: '#95a5a6' };
        return `
            <tr class="usuario-item ${!usuario.ativo ? 'inativo' : ''}">
                <td>
                    <div class="usuario-username">
                        <i class="fas fa-user"></i> ${usuario.username}
                    </div>
                </td>
                <td>${usuario.nome}</td>
                <td>
                    <span class="nivel-badge" style="background: ${nivelInfo.cor}">
                        ${nivelInfo.nome}
                    </span>
                </td>
                <td>${usuario.email || '-'}</td>
                <td>${usuario.departamento || '-'}</td>
                <td>
                    <span class="status-usuario ${usuario.ativo ? 'ativo' : 'inativo'}">
                        <i class="fas fa-circle"></i> ${usuario.ativo ? 'Ativo' : 'Inativo'}
                    </span>
                </td>
                <td>
                    <div class="usuario-actions">
                        <button class="btn-editar-usuario" data-username="${usuario.username}">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button class="btn-redefinir-senha" data-username="${usuario.username}">
                            <i class="fas fa-key"></i>
                        </button>
                        ${usuario.ativo ? 
                            `<button class="btn-desativar-usuario" data-username="${usuario.username}">
                                <i class="fas fa-user-slash"></i>
                            </button>` :
                            `<button class="btn-ativar-usuario" data-username="${usuario.username}">
                                <i class="fas fa-user-check"></i>
                            </button>`
                        }
                        <button class="btn-excluir-usuario" data-username="${usuario.username}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    }).join('');
}

function abrirModalNovoUsuario(gerenciador, modalPrincipal) {
    const modalHTML = `
        <div class="modal-usuario-form">
            <h4><i class="fas fa-user-plus"></i> Novo Usuário</h4>
            <form id="form-novo-usuario">
                <div class="form-row">
                    <div class="form-group">
                        <label for="novo-username">Usuário *</label>
                        <input type="text" id="novo-username" required 
                               placeholder="nome.usuario" 
                               pattern="[a-zA-Z0-9._-]+"
                               title="Apenas letras, números, ponto, hífen e sublinhado">
                    </div>
                    <div class="form-group">
                        <label for="novo-senha">Senha *</label>
                        <input type="password" id="novo-senha" required 
                               placeholder="Mínimo 6 caracteres" minlength="6">
                    </div>
                </div>
                
                <div class="form-group">
                    <label for="novo-confirmar-senha">Confirmar Senha *</label>
                    <input type="password" id="novo-confirmar-senha" required 
                           placeholder="Digite a senha novamente">
                    <div class="password-match" id="password-match" style="display: none;">
                        <i class="fas fa-check-circle"></i> Senhas coincidem
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="novo-nome">Nome Completo *</label>
                        <input type="text" id="novo-nome" required 
                               placeholder="Nome do usuário">
                    </div>
                    <div class="form-group">
                        <label for="novo-email">E-mail</label>
                        <input type="email" id="novo-email" 
                               placeholder="usuario@empresa.com">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="novo-departamento">Departamento</label>
                        <input type="text" id="novo-departamento" 
                               placeholder="Departamento do usuário">
                    </div>
                    <div class="form-group">
                        <label for="novo-nivel">Nível de Acesso *</label>
                        <select id="novo-nivel" required>
                            <option value="visitante">Visitante</option>
                            <option value="operador">Operador</option>
                            <option value="administrador">Administrador</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>
                        <input type="checkbox" id="novo-ativo" checked>
                        Usuário ativo
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> Criar Usuário
                    </button>
                </div>
            </form>
        </div>
        
        <style>
            .modal-usuario-form {
                max-width: 600px;
            }
            
            .password-match {
                margin-top: 5px;
                padding: 5px 10px;
                background: rgba(46, 204, 113, 0.1);
                color: var(--cor-sucesso);
                border-radius: 4px;
                font-size: 12px;
                display: flex;
                align-items: center;
                gap: 5px;
            }
            
            .password-match i {
                font-size: 14px;
            }
        </style>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            ${modalHTML}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    const form = modal.querySelector('#form-novo-usuario');
    const senhaInput = modal.querySelector('#novo-senha');
    const confirmarSenhaInput = modal.querySelector('#novo-confirmar-senha');
    const matchDiv = modal.querySelector('#password-match');
    
    // Verificar correspondência de senhas
    function verificarSenhas() {
        const senha = senhaInput.value;
        const confirmar = confirmarSenhaInput.value;
        
        if (confirmar && senha === confirmar) {
            matchDiv.style.display = 'flex';
            confirmarSenhaInput.style.borderColor = 'var(--cor-sucesso)';
        } else if (confirmar) {
            matchDiv.style.display = 'none';
            confirmarSenhaInput.style.borderColor = 'var(--cor-erro)';
        } else {
            matchDiv.style.display = 'none';
            confirmarSenhaInput.style.borderColor = '';
        }
    }
    
    senhaInput.addEventListener('input', verificarSenhas);
    confirmarSenhaInput.addEventListener('input', verificarSenhas);
    
    // Enviar formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = modal.querySelector('#novo-username').value;
        const senha = modal.querySelector('#novo-senha').value;
        const confirmarSenha = modal.querySelector('#novo-confirmar-senha').value;
        const nome = modal.querySelector('#novo-nome').value;
        const email = modal.querySelector('#novo-email').value;
        const departamento = modal.querySelector('#novo-departamento').value;
        const nivel = modal.querySelector('#novo-nivel').value;
        const ativo = modal.querySelector('#novo-ativo').checked;
        
        // Validar senhas
        if (senha !== confirmarSenha) {
            window.app.mostrarMensagem('As senhas não coincidem', 'error');
            return;
        }
        
        if (senha.length < 6) {
            window.app.mostrarMensagem('A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }
        
        try {
            // Criar usuário
            const usuario = gerenciador.criarUsuario(username, senha, {
                nome,
                email,
                departamento,
                nivel,
                ativo
            });
            
            window.app.mostrarMensagem(`Usuário ${username} criado com sucesso`, 'success');
            
            // Fechar modal
            modal.remove();
            
            // Atualizar lista no modal principal
            if (modalPrincipal) {
                filtrarUsuarios(modalPrincipal, gerenciador);
            }
            
        } catch (error) {
            window.app.mostrarMensagem(`Erro ao criar usuário: ${error.message}`, 'error');
        }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

function abrirModalEditarUsuario(username, gerenciador, modalPrincipal) {
    const usuario = gerenciador.obterUsuario(username);
    if (!usuario) {
        window.app.mostrarMensagem('Usuário não encontrado', 'error');
        return;
    }
    
    const modalHTML = `
        <div class="modal-usuario-form">
            <h4><i class="fas fa-user-edit"></i> Editar Usuário: ${username}</h4>
            <form id="form-editar-usuario">
                <div class="form-row">
                    <div class="form-group">
                        <label for="editar-nome">Nome Completo *</label>
                        <input type="text" id="editar-nome" required 
                               value="${usuario.nome || ''}"
                               placeholder="Nome do usuário">
                    </div>
                    <div class="form-group">
                        <label for="editar-email">E-mail</label>
                        <input type="email" id="editar-email" 
                               value="${usuario.email || ''}"
                               placeholder="usuario@empresa.com">
                    </div>
                </div>
                
                <div class="form-row">
                    <div class="form-group">
                        <label for="editar-departamento">Departamento</label>
                        <input type="text" id="editar-departamento" 
                               value="${usuario.departamento || ''}"
                               placeholder="Departamento do usuário">
                    </div>
                    <div class="form-group">
                        <label for="editar-nivel">Nível de Acesso *</label>
                        <select id="editar-nivel" required>
                            <option value="visitante" ${usuario.nivel === 'visitante' ? 'selected' : ''}>Visitante</option>
                            <option value="operador" ${usuario.nivel === 'operador' ? 'selected' : ''}>Operador</option>
                            <option value="administrador" ${usuario.nivel === 'administrador' ? 'selected' : ''}>Administrador</option>
                        </select>
                    </div>
                </div>
                
                <div class="form-group" style="margin-top: 20px;">
                    <label>
                        <input type="checkbox" id="editar-ativo" ${usuario.ativo !== false ? 'checked' : ''}>
                        Usuário ativo
                    </label>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> Salvar Alterações
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            ${modalHTML}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Enviar formulário
    const form = modal.querySelector('#form-editar-usuario');
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const nome = modal.querySelector('#editar-nome').value;
        const email = modal.querySelector('#editar-email').value;
        const departamento = modal.querySelector('#editar-departamento').value;
        const nivel = modal.querySelector('#editar-nivel').value;
        const ativo = modal.querySelector('#editar-ativo').checked;
        
        try {
            // Atualizar usuário
            const usuarioAtualizado = gerenciador.atualizarUsuario(username, {
                nome,
                email,
                departamento,
                nivel,
                ativo
            });
            
            window.app.mostrarMensagem(`Usuário ${username} atualizado com sucesso`, 'success');
            
            // Fechar modal
            modal.remove();
            
            // Atualizar lista no modal principal
            if (modalPrincipal) {
                filtrarUsuarios(modalPrincipal, gerenciador);
            }
            
        } catch (error) {
            window.app.mostrarMensagem(`Erro ao atualizar usuário: ${error.message}`, 'error');
        }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

function redefinirSenhaUsuario(username, gerenciador, modalPrincipal) {
    const modalHTML = `
        <div class="modal-usuario-form">
            <h4><i class="fas fa-key"></i> Redefinir Senha: ${username}</h4>
            <form id="form-redefinir-senha">
                <div class="form-group">
                    <label for="nova-senha">Nova Senha *</label>
                    <input type="password" id="nova-senha" required 
                           placeholder="Mínimo 6 caracteres" minlength="6">
                </div>
                
                <div class="form-group">
                    <label for="confirmar-nova-senha">Confirmar Nova Senha *</label>
                    <input type="password" id="confirmar-nova-senha" required 
                           placeholder="Digite a senha novamente">
                    <div class="password-match" id="password-match-senha" style="display: none;">
                        <i class="fas fa-check-circle"></i> Senhas coincidem
                    </div>
                </div>
                
                <div class="form-actions">
                    <button type="button" class="btn-secondary" onclick="this.closest('.modal').remove()">
                        <i class="fas fa-times"></i> Cancelar
                    </button>
                    <button type="submit" class="btn-primary">
                        <i class="fas fa-save"></i> Redefinir Senha
                    </button>
                </div>
            </form>
        </div>
    `;
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content">
            ${modalHTML}
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Configurar eventos
    const form = modal.querySelector('#form-redefinir-senha');
    const senhaInput = modal.querySelector('#nova-senha');
    const confirmarSenhaInput = modal.querySelector('#confirmar-nova-senha');
    const matchDiv = modal.querySelector('#password-match-senha');
    
    // Verificar correspondência de senhas
    function verificarSenhas() {
        const senha = senhaInput.value;
        const confirmar = confirmarSenhaInput.value;
        
        if (confirmar && senha === confirmar) {
            matchDiv.style.display = 'flex';
            confirmarSenhaInput.style.borderColor = 'var(--cor-sucesso)';
        } else if (confirmar) {
            matchDiv.style.display = 'none';
            confirmarSenhaInput.style.borderColor = 'var(--cor-erro)';
        } else {
            matchDiv.style.display = 'none';
            confirmarSenhaInput.style.borderColor = '';
        }
    }
    
    senhaInput.addEventListener('input', verificarSenhas);
    confirmarSenhaInput.addEventListener('input', verificarSenhas);
    
    // Enviar formulário
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const novaSenha = senhaInput.value;
        const confirmarNovaSenha = confirmarSenhaInput.value;
        
        // Validar senhas
        if (novaSenha !== confirmarNovaSenha) {
            window.app.mostrarMensagem('As senhas não coincidem', 'error');
            return;
        }
        
        if (novaSenha.length < 6) {
            window.app.mostrarMensagem('A senha deve ter no mínimo 6 caracteres', 'error');
            return;
        }
        
        try {
            // Redefinir senha
            gerenciador.redefinirSenha(username, novaSenha);
            
            window.app.mostrarMensagem(`Senha do usuário ${username} redefinida com sucesso`, 'success');
            
            // Fechar modal
            modal.remove();
            
        } catch (error) {
            window.app.mostrarMensagem(`Erro ao redefinir senha: ${error.message}`, 'error');
        }
    });
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
}

function desativarUsuario(username, gerenciador, modalPrincipal) {
    if (!confirm(`Tem certeza que deseja desativar o usuário ${username}?`)) {
        return;
    }
    
    try {
        gerenciador.desativarUsuario(username);
        window.app.mostrarMensagem(`Usuário ${username} desativado com sucesso`, 'success');
        
        // Atualizar lista no modal principal
        if (modalPrincipal) {
            filtrarUsuarios(modalPrincipal, gerenciador);
        }
        
    } catch (error) {
        window.app.mostrarMensagem(`Erro ao desativar usuário: ${error.message}`, 'error');
    }
}

function ativarUsuario(username, gerenciador, modalPrincipal) {
    if (!confirm(`Tem certeza que deseja ativar o usuário ${username}?`)) {
        return;
    }
    
    try {
        gerenciador.ativarUsuario(username);
        window.app.mostrarMensagem(`Usuário ${username} ativado com sucesso`, 'success');
        
        // Atualizar lista no modal principal
        if (modalPrincipal) {
            filtrarUsuarios(modalPrincipal, gerenciador);
        }
        
    } catch (error) {
        window.app.mostrarMensagem(`Erro ao ativar usuário: ${error.message}`, 'error');
    }
}

function excluirUsuario(username, gerenciador, modalPrincipal) {
    if (!confirm(`ATENÇÃO: Tem certeza que deseja EXCLUIR permanentemente o usuário ${username}?\n\nEsta ação não pode ser desfeita.`)) {
        return;
    }
    
    try {
        gerenciador.excluirUsuario(username);
        window.app.mostrarMensagem(`Usuário ${username} excluído com sucesso`, 'success');
        
        // Atualizar lista no modal principal
        if (modalPrincipal) {
            filtrarUsuarios(modalPrincipal, gerenciador);
        }
        
    } catch (error) {
        window.app.mostrarMensagem(`Erro ao excluir usuário: ${error.message}`, 'error');
    }
}

function exportarRelatorioUsuarios(gerenciador) {
    const relatorio = gerenciador.gerarRelatorioUsuarios();
    const dataAtual = new Date().toISOString().split('T')[0];
    const usuario = window.getUsuarioLogado();
    
    const blob = new Blob([relatorio], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    
    link.href = URL.createObjectURL(blob);
    link.download = `relatorio_usuarios_${dataAtual}_${usuario}.txt`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    // Registrar log
    if (window.registrarLogAuditoria) {
        window.registrarLogAuditoria(
            'EXPORTAR_RELATORIO_USUARIOS',
            'Exportou relatório de usuários'
        );
    }
    
    window.app.mostrarMensagem('Relatório de usuários exportado com sucesso', 'success');
}

// ===========================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ===========================================

// Inicializar gerenciador de usuários quando o script carregar
document.addEventListener('DOMContentLoaded', function() {
    // Verificar se o usuário atual é administrador
    const usuario = window.getUsuarioLogado();
    const nivel = window.getNivelUsuario();
    
    // Adicionar botão de gerenciar usuários na interface se for administrador
    if (usuario && nivel === 'administrador') {
        setTimeout(() => {
            adicionarBotaoGerenciarUsuarios();
        }, 1000);
    }
});

function adicionarBotaoGerenciarUsuarios() {
    // Verificar se o botão já existe
    if (document.getElementById('gerenciar-usuarios-btn')) {
        return;
    }
    
    // Adicionar botão na barra de ações
    const actionsContainer = document.querySelector('.actions');
    if (actionsContainer) {
        const botaoHtml = `
            <button id="gerenciar-usuarios-btn" class="btn-secondary">
                <i class="fas fa-users-cog"></i> Gerenciar Usuários
            </button>
        `;
        
        // Inserir antes do botão de exportar configurações
        const exportConfigBtn = actionsContainer.querySelector('#export-config');
        if (exportConfigBtn) {
            exportConfigBtn.insertAdjacentHTML('beforebegin', botaoHtml);
        } else {
            actionsContainer.insertAdjacentHTML('beforeend', botaoHtml);
        }
        
        // Adicionar evento
        document.getElementById('gerenciar-usuarios-btn').addEventListener('click', abrirGerenciadorUsuarios);
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.GerenciadorUsuarios = GerenciadorUsuarios;
    window.abrirGerenciadorUsuarios = abrirGerenciadorUsuarios;
    window.gerenciarUsuarios = abrirGerenciadorUsuarios; // Alias
}
