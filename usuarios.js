// ===========================================
// SISTEMA DE GERENCIAMENTO DE USUÁRIOS COM SINCRONIZAÇÃO JSONBIN
// ===========================================

class GerenciadorUsuarios {
    constructor() {
        this.usuarios = {};
        this.usuariosBinId = '696fa19fae596e708fe90a63'; // Mesmo bin dos equipamentos ou criar um específico
        this.carregando = false;
        this.ultimaSincronizacao = null;
    }
    
    async carregarUsuarios() {
        try {
            if (this.carregando) return false;
            
            this.carregando = true;
            
            // Tentar carregar do JSONBin primeiro (sincronização entre dispositivos)
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${this.usuariosBinId}/latest`, {
                headers: JSONBIN_CONFIG.headers
            });
            
            if (response.ok) {
                const result = await response.json();
                
                // Verificar diferentes estruturas possíveis
                if (result.record && result.record.usuarios) {
                    // Estrutura: { usuarios: { ... } }
                    this.usuarios = result.record.usuarios;
                    console.log('Usuários carregados do JSONBin (estrutura usuarios):', Object.keys(this.usuarios).length);
                } else if (result.record) {
                    // Verificar se é o objeto direto de usuários
                    const record = result.record;
                    
                    // Verificar se tem estrutura de usuários
                    if (record.visitante || record.administrador || record.operador) {
                        this.usuarios = record;
                        console.log('Usuários carregados do JSONBin (objeto direto):', Object.keys(this.usuarios).length);
                    } else if (record.equipamentos && record.usuarios) {
                        // É a estrutura completa com equipamentos e usuários
                        this.usuarios = record.usuarios || {};
                        console.log('Usuários carregados do JSONBin (estrutura completa):', Object.keys(this.usuarios).length);
                    } else {
                        // Estrutura desconhecida, usar fallback
                        console.warn('Estrutura desconhecida no JSONBin, usando fallback');
                        this.carregarFallback();
                    }
                } else {
                    // Nenhum dado válido, usar fallback
                    this.carregarFallback();
                }
                
                this.ultimaSincronizacao = new Date().toISOString();
                localStorage.setItem('gestao_equipamentos_usuarios_ultima_sinc', this.ultimaSincronizacao);
                return true;
            } else {
                console.warn('JSONBin não acessível, usando cache local');
                this.carregarFallback();
                return false;
            }
            
        } catch (error) {
            console.error('Erro ao carregar usuários do JSONBin:', error);
            this.carregarFallback();
            return false;
        } finally {
            this.carregando = false;
        }
    }
    
    carregarFallback() {
        try {
            // Tentar carregar do localStorage
            const usuariosSalvos = localStorage.getItem('gestao_equipamentos_usuarios');
            if (usuariosSalvos) {
                this.usuarios = JSON.parse(usuariosSalvos);
                console.log('Usuários carregados do localStorage:', Object.keys(this.usuarios).length);
                
                // Se não tiver os usuários padrão, adicionar
                this.inicializarUsuariosPadrao();
                return;
            }
            
            // Usar usuários padrão
            this.inicializarUsuariosPadrao();
            
        } catch (error) {
            console.error('Erro ao carregar fallback:', error);
            this.inicializarUsuariosPadrao();
        }
    }
    
    inicializarUsuariosPadrao() {
        // Usar usuários padrão do config.js se disponível
        if (window.USUARIOS_AUTORIZADOS) {
            this.usuarios = JSON.parse(JSON.stringify(window.USUARIOS_AUTORIZADOS));
            console.log('Usando usuários padrão do config.js:', Object.keys(this.usuarios).length);
        } else {
            // Fallback hardcoded
            this.usuarios = {
                'visitante': { 
                    senha: 'visitante123', 
                    nivel: 'visitante',
                    nome: 'Visitante',
                    email: 'visitante@empresa.com',
                    departamento: 'Visitante',
                    dataCriacao: '2023-01-01',
                    criadoPor: 'sistema',
                    ativo: true
                },
                'operador': { 
                    senha: 'operador456', 
                    nivel: 'operador',
                    nome: 'Operador',
                    email: 'operador@empresa.com',
                    departamento: 'Operações',
                    dataCriacao: '2023-01-01',
                    criadoPor: 'sistema',
                    ativo: true
                },
                'administrador': { 
                    senha: 'admin789', 
                    nivel: 'administrador',
                    nome: 'Administrador',
                    email: 'admin@empresa.com',
                    departamento: 'TI',
                    dataCriacao: '2023-01-01',
                    criadoPor: 'sistema',
                    ativo: true
                }
            };
            console.log('Usando usuários padrão hardcoded:', Object.keys(this.usuarios).length);
        }
        
        // Salvar localmente para cache
        localStorage.setItem('gestao_equipamentos_usuarios', JSON.stringify(this.usuarios));
    }
    
    async salvarUsuariosNoJSONBin() {
        try {
            const usuarioLogado = window.getUsuarioLogado ? window.getUsuarioLogado() : 'sistema';
            
            // Criar estrutura de dados para o JSONBin
            const usuariosData = {
                usuarios: this.usuarios,
                metadata: {
                    atualizadoEm: new Date().toISOString(),
                    atualizadoPor: usuarioLogado,
                    totalUsuarios: Object.keys(this.usuarios).length,
                    versao: '1.0'
                }
            };
            
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${this.usuariosBinId}`, {
                method: 'PUT',
                headers: JSONBIN_CONFIG.headers,
                body: JSON.stringify(usuariosData)
            });
            
            if (response.ok) {
                console.log('Usuários salvos no JSONBin com sucesso');
                this.ultimaSincronizacao = new Date().toISOString();
                localStorage.setItem('gestao_equipamentos_usuarios_ultima_sinc', this.ultimaSincronizacao);
                
                // Também salvar localmente para cache
                localStorage.setItem('gestao_equipamentos_usuarios', JSON.stringify(this.usuarios));
                return true;
            } else {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }
        } catch (error) {
            console.error('Erro ao salvar usuários no JSONBin:', error);
            
            // Fallback: salvar apenas localmente
            localStorage.setItem('gestao_equipamentos_usuarios', JSON.stringify(this.usuarios));
            
            // Tentar novamente em background
            setTimeout(() => this.tentarSincronizacaoEmBackground(), 30000);
            
            return false;
        }
    }
    
    async tentarSincronizacaoEmBackground() {
        try {
            const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${this.usuariosBinId}/latest`, {
                headers: JSONBIN_CONFIG.headers
            });
            
            if (response.ok) {
                await this.salvarUsuariosNoJSONBin();
            }
        } catch (error) {
            // Silencioso em background
        }
    }
    
    async salvarUsuarios() {
        return await this.salvarUsuariosNoJSONBin();
    }
    
    async listarUsuarios() {
        if (Object.keys(this.usuarios).length === 0) {
            await this.carregarUsuarios();
        }
        
        return Object.entries(this.usuarios).map(([username, info]) => ({
            username,
            nome: info.nome || username,
            email: info.email || '',
            nivel: info.nivel || 'visitante',
            departamento: info.departamento || '',
            dataCriacao: info.dataCriacao || new Date().toISOString(),
            criadoPor: info.criadoPor || 'sistema',
            ativo: info.ativo !== false,
            ultimoAcesso: info.ultimoAcesso || null,
            dataAtualizacao: info.dataAtualizacao || info.dataCriacao || new Date().toISOString(),
            atualizadoPor: info.atualizadoPor || info.criadoPor || 'sistema'
        }));
    }
    
    obterUsuario(username) {
        return this.usuarios[username];
    }
    
    async verificarLogin(username, senha) {
        // Carregar usuários se necessário
        if (Object.keys(this.usuarios).length === 0) {
            await this.carregarUsuarios();
        }
        
        const usuario = this.usuarios[username];
        
        if (!usuario) {
            return { sucesso: false, mensagem: 'Usuário não encontrado' };
        }
        
        if (usuario.ativo === false) {
            return { sucesso: false, mensagem: 'Usuário desativado' };
        }
        
        if (usuario.senha !== senha) {
            return { sucesso: false, mensagem: 'Senha incorreta' };
        }
        
        // Atualizar último acesso
        usuario.ultimoAcesso = new Date().toISOString();
        
        // Salvar a atualização em background
        setTimeout(() => {
            localStorage.setItem('gestao_equipamentos_usuarios', JSON.stringify(this.usuarios));
            this.tentarSincronizacaoEmBackground();
        }, 0);
        
        return { 
            sucesso: true, 
            usuario: {
                username,
                nome: usuario.nome || username,
                nivel: usuario.nivel || 'visitante',
                email: usuario.email || '',
                departamento: usuario.departamento || '',
                dataCriacao: usuario.dataCriacao || new Date().toISOString()
            }
        };
    }
    
    async criarUsuario(usuario, senha, infoAdicional = {}) {
        // Carregar usuários se necessário
        if (Object.keys(this.usuarios).length === 0) {
            await this.carregarUsuarios();
        }
        
        if (this.usuarios[usuario]) {
            throw new Error('Usuário já existe');
        }
        
        const usuarioLogado = window.getUsuarioLogado ? window.getUsuarioLogado() : 'sistema';
        const nivelUsuario = window.getNivelUsuario ? window.getNivelUsuario() : 'visitante';
        
        // Verificar permissão
        if (nivelUsuario !== 'administrador') {
            throw new Error('Apenas administradores podem criar usuários');
        }
        
        // Validar senha
        if (!senha || senha.length < 6) {
            throw new Error('A senha deve ter no mínimo 6 caracteres');
        }
        
        // Validar nível
        const nivel = infoAdicional.nivel || 'visitante';
        if (!['visitante', 'operador', 'administrador'].includes(nivel)) {
            throw new Error('Nível de acesso inválido');
        }
        
        // Criar novo usuário
        this.usuarios[usuario] = {
            senha: senha,
            nivel: nivel,
            nome: infoAdicional.nome || usuario,
            email: infoAdicional.email || '',
            departamento: infoAdicional.departamento || '',
            dataCriacao: new Date().toISOString(),
            criadoPor: usuarioLogado,
            ativo: infoAdicional.ativo !== false,
            dataAtualizacao: new Date().toISOString(),
            atualizadoPor: usuarioLogado
        };
        
        // Salvar no JSONBin
        const salvou = await this.salvarUsuariosNoJSONBin();
        
        if (salvou) {
            // Registrar log de auditoria
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria(
                    'CRIAR_USUARIO',
                    `Criou usuário: ${usuario} (${nivel})`,
                    null,
                    null,
                    usuario
                );
            }
            
            return this.usuarios[usuario];
        } else {
            // Reverter se não salvou
            delete this.usuarios[usuario];
            throw new Error('Erro ao salvar usuário no servidor. Tente novamente.');
        }
    }
    
    async atualizarUsuario(username, dados) {
        // Carregar usuários se necessário
        if (Object.keys(this.usuarios).length === 0) {
            await this.carregarUsuarios();
        }
        
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado ? window.getUsuarioLogado() : 'sistema';
        const nivelUsuario = window.getNivelUsuario ? window.getNivelUsuario() : 'visitante';
        
        // Verificar permissão
        if (nivelUsuario !== 'administrador' && usuarioLogado !== username) {
            throw new Error('Sem permissão para atualizar este usuário');
        }
        
        // Atualizar dados permitidos
        const usuario = this.usuarios[username];
        const mudancas = [];
        
        if (dados.nome !== undefined && dados.nome !== usuario.nome) {
            usuario.nome = dados.nome;
            mudancas.push('nome');
        }
        
        if (dados.email !== undefined && dados.email !== usuario.email) {
            usuario.email = dados.email;
            mudancas.push('email');
        }
        
        if (dados.departamento !== undefined && dados.departamento !== usuario.departamento) {
            usuario.departamento = dados.departamento;
            mudancas.push('departamento');
        }
        
        // Apenas admin pode alterar nível
        if (dados.nivel !== undefined && nivelUsuario === 'administrador') {
            if (!['visitante', 'operador', 'administrador'].includes(dados.nivel)) {
                throw new Error('Nível de acesso inválido');
            }
            if (dados.nivel !== usuario.nivel) {
                usuario.nivel = dados.nivel;
                mudancas.push('nível');
            }
        }
        
        // Apenas admin pode ativar/desativar
        if (dados.ativo !== undefined && nivelUsuario === 'administrador') {
            if (dados.ativo !== (usuario.ativo !== false)) {
                usuario.ativo = dados.ativo;
                mudancas.push(dados.ativo ? 'ativado' : 'desativado');
            }
        }
        
        // Se não houver mudanças, não salvar
        if (mudancas.length === 0) {
            return usuario;
        }
        
        usuario.dataAtualizacao = new Date().toISOString();
        usuario.atualizadoPor = usuarioLogado;
        
        // Salvar no JSONBin
        const salvou = await this.salvarUsuariosNoJSONBin();
        
        if (salvou) {
            // Registrar log de auditoria
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria(
                    'EDITAR_USUARIO',
                    `Editou usuário ${username}: ${mudancas.join(', ')}`,
                    null,
                    null,
                    username
                );
            }
            
            return usuario;
        } else {
            throw new Error('Erro ao salvar alterações no servidor');
        }
    }
    
    async redefinirSenha(username, novaSenha) {
        // Carregar usuários se necessário
        if (Object.keys(this.usuarios).length === 0) {
            await this.carregarUsuarios();
        }
        
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado ? window.getUsuarioLogado() : 'sistema';
        const nivelUsuario = window.getNivelUsuario ? window.getNivelUsuario() : 'visitante';
        
        // Verificar permissão (apenas admin ou o próprio usuário)
        if (nivelUsuario !== 'administrador' && usuarioLogado !== username) {
            throw new Error('Sem permissão para redefinir senha');
        }
        
        // Validar nova senha
        if (!novaSenha || novaSenha.length < 6) {
            throw new Error('A senha deve ter no mínimo 6 caracteres');
        }
        
        this.usuarios[username].senha = novaSenha;
        this.usuarios[username].senhaRedefinidaEm = new Date().toISOString();
        this.usuarios[username].senhaRedefinidaPor = usuarioLogado;
        this.usuarios[username].dataAtualizacao = new Date().toISOString();
        this.usuarios[username].atualizadoPor = usuarioLogado;
        
        // Salvar no JSONBin
        const salvou = await this.salvarUsuariosNoJSONBin();
        
        if (salvou) {
            // Registrar log de auditoria
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria(
                    'REDEFINIR_SENHA',
                    `Redefiniu senha do usuário: ${username}`,
                    null,
                    null,
                    username
                );
            }
            
            return true;
        } else {
            throw new Error('Erro ao salvar senha no servidor');
        }
    }
    
    async desativarUsuario(username) {
        // Carregar usuários se necessário
        if (Object.keys(this.usuarios).length === 0) {
            await this.carregarUsuarios();
        }
        
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado ? window.getUsuarioLogado() : 'sistema';
        const nivelUsuario = window.getNivelUsuario ? window.getNivelUsuario() : 'visitante';
        
        // Apenas administrador pode desativar usuários
        if (nivelUsuario !== 'administrador') {
            throw new Error('Apenas administradores podem desativar usuários');
        }
        
        // Não permitir desativar a si mesmo
        if (usuarioLogado === username) {
            throw new Error('Não é permitido desativar seu próprio usuário');
        }
        
        this.usuarios[username].ativo = false;
        this.usuarios[username].desativadoEm = new Date().toISOString();
        this.usuarios[username].desativadoPor = usuarioLogado;
        this.usuarios[username].dataAtualizacao = new Date().toISOString();
        this.usuarios[username].atualizadoPor = usuarioLogado;
        
        // Salvar no JSONBin
        const salvou = await this.salvarUsuariosNoJSONBin();
        
        if (salvou) {
            // Registrar log de auditoria
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria(
                    'DESATIVAR_USUARIO',
                    `Desativou usuário: ${username}`,
                    null,
                    null,
                    username
                );
            }
            
            return true;
        } else {
            throw new Error('Erro ao salvar alteração no servidor');
        }
    }
    
    async ativarUsuario(username) {
        // Carregar usuários se necessário
        if (Object.keys(this.usuarios).length === 0) {
            await this.carregarUsuarios();
        }
        
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado ? window.getUsuarioLogado() : 'sistema';
        const nivelUsuario = window.getNivelUsuario ? window.getNivelUsuario() : 'visitante';
        
        // Apenas administrador pode ativar usuários
        if (nivelUsuario !== 'administrador') {
            throw new Error('Apenas administradores podem ativar usuários');
        }
        
        this.usuarios[username].ativo = true;
        this.usuarios[username].ativadoEm = new Date().toISOString();
        this.usuarios[username].ativadoPor = usuarioLogado;
        this.usuarios[username].dataAtualizacao = new Date().toISOString();
        this.usuarios[username].atualizadoPor = usuarioLogado;
        
        // Salvar no JSONBin
        const salvou = await this.salvarUsuariosNoJSONBin();
        
        if (salvou) {
            // Registrar log de auditoria
            if (window.registrarLogAuditoria) {
                window.registrarLogAuditoria(
                    'ATIVAR_USUARIO',
                    `Ativou usuário: ${username}`,
                    null,
                    null,
                    username
                );
            }
            
            return true;
        } else {
            throw new Error('Erro ao salvar alteração no servidor');
        }
    }
    
    async excluirUsuario(username) {
        // Carregar usuários se necessário
        if (Object.keys(this.usuarios).length === 0) {
            await this.carregarUsuarios();
        }
        
        if (!this.usuarios[username]) {
            throw new Error('Usuário não encontrado');
        }
        
        const usuarioLogado = window.getUsuarioLogado ? window.getUsuarioLogado() : 'sistema';
        const nivelUsuario = window.getNivelUsuario ? window.getNivelUsuario() : 'visitante';
        
        // Apenas administrador pode excluir usuários
        if (nivelUsuario !== 'administrador') {
            throw new Error('Apenas administradores podem excluir usuários');
        }
        
        // Não permitir excluir a si mesmo
        if (usuarioLogado === username) {
            throw new Error('Não é permitido excluir seu próprio usuário');
        }
        
        // Não permitir excluir usuários padrão
        const usuariosPadrao = ['visitante', 'operador', 'administrador'];
        if (usuariosPadrao.includes(username)) {
            throw new Error('Não é permitido excluir usuários padrão do sistema');
        }
        
        // Registrar log antes de excluir
        if (window.registrarLogAuditoria) {
            window.registrarLogAuditoria(
                'EXCLUIR_USUARIO',
                `Excluiu usuário: ${username}`,
                null,
                null,
                username
            );
        }
        
        // Remover usuário
        delete this.usuarios[username];
        
        // Salvar no JSONBin
        const salvou = await this.salvarUsuariosNoJSONBin();
        
        if (!salvou) {
            throw new Error('Erro ao excluir usuário do servidor');
        }
        
        return true;
    }
    
    async gerarRelatorioUsuarios() {
        const usuarios = await this.listarUsuarios();
        const agora = new Date();
        
        let relatorio = `RELATÓRIO DE USUÁRIOS - SISTEMA DE GESTÃO DE EQUIPAMENTOS\n`;
        relatorio += `==========================================================\n\n`;
        relatorio += `Gerado em: ${agora.toLocaleDateString('pt-BR')} ${agora.toLocaleTimeString('pt-BR')}\n`;
        relatorio += `Total de usuários: ${usuarios.length}\n`;
        relatorio += `Última sincronização: ${this.ultimaSincronizacao ? new Date(this.ultimaSincronizacao).toLocaleString('pt-BR') : 'Nunca'}\n\n`;
        
        relatorio += `=== USUÁRIOS ATIVOS ===\n`;
        usuarios.filter(u => u.ativo).forEach(usuario => {
            relatorio += `\nUsuário: ${usuario.username}\n`;
            relatorio += `Nome: ${usuario.nome}\n`;
            relatorio += `Nível: ${usuario.nivel}\n`;
            relatorio += `E-mail: ${usuario.email || 'Não informado'}\n`;
            relatorio += `Departamento: ${usuario.departamento || 'Não informado'}\n`;
            relatorio += `Criado por: ${usuario.criadoPor}\n`;
            relatorio += `Data criação: ${new Date(usuario.dataCriacao).toLocaleDateString('pt-BR')}\n`;
            relatorio += `Última atualização: ${new Date(usuario.dataAtualizacao).toLocaleDateString('pt-BR')}\n`;
            relatorio += `----------------------------------------\n`;
        });
        
        const usuariosInativos = usuarios.filter(u => !u.ativo);
        if (usuariosInativos.length > 0) {
            relatorio += `\n=== USUÁRIOS DESATIVADOS ===\n`;
            usuariosInativos.forEach(usuario => {
                relatorio += `\nUsuário: ${usuario.username} (DESATIVADO)\n`;
                relatorio += `Nome: ${usuario.nome}\n`;
                relatorio += `Nível: ${usuario.nivel}\n`;
                relatorio += `Criado por: ${usuario.criadoPor}\n`;
                relatorio += `----------------------------------------\n`;
            });
        }
        
        // Estatísticas
        relatorio += `\n=== ESTATÍSTICAS ===\n`;
        relatorio += `Administradores: ${usuarios.filter(u => u.nivel === 'administrador').length}\n`;
        relatorio += `Operadores: ${usuarios.filter(u => u.nivel === 'operador').length}\n`;
        relatorio += `Visitantes: ${usuarios.filter(u => u.nivel === 'visitante').length}\n`;
        relatorio += `Ativos: ${usuarios.filter(u => u.ativo).length}\n`;
        relatorio += `Inativos: ${usuariosInativos.length}\n`;
        
        return relatorio;
    }
    
    getStatusSincronizacao() {
        return {
            sincronizado: !!this.ultimaSincronizacao,
            ultimaSincronizacao: this.ultimaSincronizacao,
            totalUsuarios: Object.keys(this.usuarios).length,
            carregando: this.carregando
        };
    }
    
    async sincronizarForcadamente() {
        console.log('Iniciando sincronização forçada de usuários...');
        const sucesso = await this.carregarUsuarios();
        
        if (sucesso) {
            // Também salvar localmente qualquer alteração
            await this.salvarUsuariosNoJSONBin();
        }
        
        return sucesso;
    }
}

// ===========================================
// FUNÇÕES DE INTERFACE PARA GERENCIAR USUÁRIOS
// ===========================================

async function abrirGerenciadorUsuarios() {
    // Verificar permissão
    const usuario = window.getUsuarioLogado ? window.getUsuarioLogado() : null;
    const nivelUsuario = window.getNivelUsuario ? window.getNivelUsuario() : null;
    
    if (!usuario || !nivelUsuario || nivelUsuario !== 'administrador') {
        if (window.app && window.app.mostrarMensagem) {
            window.app.mostrarMensagem('Você não tem permissão para gerenciar usuários', 'error');
        } else {
            alert('Apenas administradores podem gerenciar usuários.');
        }
        return;
    }
    
    try {
        const gerenciador = new GerenciadorUsuarios();
        await gerenciador.carregarUsuarios();
        const usuarios = await gerenciador.listarUsuarios();
        
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
                        <button id="btn-sincronizar-usuarios" class="btn-secondary">
                            <i class="fas fa-sync"></i> Sincronizar
                        </button>
                    </div>
                </div>
                
                <div class="usuarios-info">
                    <div class="sync-info">
                        <i class="fas fa-database"></i>
                        <span>Última sincronização: ${gerenciador.ultimaSincronizacao ? 
                            new Date(gerenciador.ultimaSincronizacao).toLocaleString('pt-BR') : 
                            'Nunca sincronizado'}</span>
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
                                const nivelInfo = window.PERMISSOES && window.PERMISSOES.niveis ? 
                                    window.PERMISSOES.niveis[usuario.nivel] : 
                                    { nome: usuario.nivel, cor: '#95a5a6' };
                                
                                // Não mostrar botão de exclusão para usuários padrão
                                const usuariosPadrao = ['visitante', 'operador', 'administrador'];
                                const podeExcluir = !usuariosPadrao.includes(usuario.username);
                                
                                return `
                                    <tr class="usuario-item ${!usuario.ativo ? 'inativo' : ''}">
                                        <td>
                                            <div class="usuario-username">
                                                <i class="fas fa-user"></i> ${usuario.username}
                                                ${usuariosPadrao.includes(usuario.username) ? 
                                                    '<span class="usuario-padrao" title="Usuário padrão do sistema">(padrão)</span>' : ''}
                                            </div>
                                        </td>
                                        <td>${usuario.nome}</td>
                                        <td>
                                            <span class="nivel-badge" style="background: ${nivelInfo.cor || '#95a5a6'}">
                                                ${nivelInfo.nome || usuario.nivel}
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
                                                <button class="btn-editar-usuario" data-username="${usuario.username}" title="Editar usuário">
                                                    <i class="fas fa-edit"></i>
                                                </button>
                                                <button class="btn-redefinir-senha" data-username="${usuario.username}" title="Redefinir senha">
                                                    <i class="fas fa-key"></i>
                                                </button>
                                                ${usuario.ativo ? 
                                                    `<button class="btn-desativar-usuario" data-username="${usuario.username}" title="Desativar usuário">
                                                        <i class="fas fa-user-slash"></i>
                                                    </button>` :
                                                    `<button class="btn-ativar-usuario" data-username="${usuario.username}" title="Ativar usuário">
                                                        <i class="fas fa-user-check"></i>
                                                    </button>`
                                                }
                                                ${podeExcluir ? 
                                                    `<button class="btn-excluir-usuario" data-username="${usuario.username}" title="Excluir usuário">
                                                        <i class="fas fa-trash"></i>
                                                    </button>` : ''
                                                }
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
                    <div class="stat">
                        <span class="stat-value">${gerenciador.ultimaSincronizacao ? 'Online' : 'Offline'}</span>
                        <span class="stat-label">Status Sinc.</span>
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
                
                .usuarios-info {
                    margin-bottom: 15px;
                    padding: 10px;
                    background: var(--cor-fundo-secundario);
                    border-radius: 5px;
                    font-size: 14px;
                }
                
                .sync-info {
                    display: flex;
                    align-items: center;
                    gap: 10px;
                }
                
                .sync-info i {
                    color: var(--cor-destaque);
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
                
                .usuario-padrao {
                    font-size: 11px;
                    color: var(--cor-texto-secundario);
                    font-style: italic;
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
        
    } catch (error) {
        console.error('Erro ao abrir gerenciador de usuários:', error);
        
        if (window.app && window.app.mostrarMensagem) {
            window.app.mostrarMensagem('Erro ao carregar usuários: ' + error.message, 'error');
        } else {
            alert('Erro ao carregar usuários: ' + error.message);
        }
    }
}

// ... (o restante das funções de interface permanece igual ao código anterior)

// ===========================================
// INICIALIZAÇÃO E EXPORTAÇÃO
// ===========================================

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.GerenciadorUsuarios = GerenciadorUsuarios;
    window.abrirGerenciadorUsuarios = abrirGerenciadorUsuarios;
    window.gerenciarUsuarios = abrirGerenciadorUsuarios; // Alias
}

console.log('Gerenciador de Usuários carregado com sucesso');
