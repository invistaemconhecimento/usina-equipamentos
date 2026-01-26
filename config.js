// ===========================================
// CONFIGURAÇÃO COMPLETA DO SISTEMA DE GESTÃO DE EQUIPAMENTOS
// ===========================================

// Configuração do JSONBin.io
const JSONBIN_CONFIG = {
    // ID do bin principal (mesmo para equipamentos e usuários)
    BIN_ID: '696fa19fae596e708fe90a63',
    
    // URL base da API
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    
    // Cabeçalhos para as requisições
    headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$gHdA8KAK/9HnnagDiMTlHeBUzNo9cWC0lR8EL0IaUpJg5ChpGiz/i',
        'X-Bin-Versioning': 'false'
    },
    
    // Configurações de sincronização
    syncConfig: {
        retryAttempts: 3,
        retryDelay: 2000,
        timeout: 10000,
        syncInterval: 300000 // 5 minutos
    }
};

// Estrutura inicial dos dados COMPLETA com usuários integrados
const INITIAL_DATA = {
    // Seção de equipamentos
    equipamentos: [
        {
            id: 1,
            codigo: "EQP-001",
            nome: "Turbina Principal",
            descricao: "Turbina de alta pressão para geração de energia",
            setor: "moagem-moagem",
            status: "apto",
            ultimaInspecao: "2023-10-15",
            dataCriacao: "2023-01-10",
            criadoPor: "administrador",
            editadoPor: null,
            editadoEm: null,
            pendencias: [
                {
                    id: 1,
                    titulo: "Vibração acima do normal",
                    descricao: "Detectada vibração 15% acima do normal durante operação em carga máxima",
                    responsavel: "Elétrica",
                    prioridade: "alta",
                    data: "2023-10-10",
                    status: "em-andamento",
                    criadoPor: "administrador",
                    criadoEm: "2023-10-10T10:30:00",
                    editadoPor: null,
                    editadoEm: null
                }
            ]
        },
        {
            id: 2,
            codigo: "EQP-042",
            nome: "Transformador T-42",
            descricao: "Transformador de potência 500kV",
            setor: "utilidades-distribuicao-agua",
            status: "nao-apto",
            ultimaInspecao: "2023-09-22",
            dataCriacao: "2022-11-05",
            criadoPor: "administrador",
            editadoPor: null,
            editadoEm: null,
            pendencias: [
                {
                    id: 2,
                    titulo: "Vazamento de óleo isolante",
                    descricao: "Identificado vazamento no tanque principal",
                    responsavel: "Instrumentação",
                    prioridade: "critica",
                    data: "2023-10-05",
                    status: "aberta",
                    criadoPor: "administrador",
                    criadoEm: "2023-10-05T08:15:00",
                    editadoPor: null,
                    editadoEm: null
                },
                {
                    id: 3,
                    titulo: "Sistema de refrigeração com ruído",
                    descricao: "Ventiladores apresentando ruído anormal",
                    responsavel: "Mecânica",
                    prioridade: "media",
                    data: "2023-09-30",
                    status: "resolvida",
                    criadoPor: "administrador",
                    criadoEm: "2023-09-30T14:20:00",
                    editadoPor: null,
                    editadoEm: null,
                    resolvidoPor: "administrador",
                    resolvidoEm: "2023-10-02T09:45:00"
                }
            ]
        },
        {
            id: 3,
            codigo: "EQP-123",
            nome: "Gerador G-12",
            descricao: "Gerador síncrono de 200MW",
            setor: "flotacao-flot-pirita",
            status: "apto",
            ultimaInspecao: "2023-10-18",
            dataCriacao: "2023-03-20",
            criadoPor: "administrador",
            editadoPor: null,
            editadoEm: null,
            pendencias: []
        }
    ],
    
    // Contadores para IDs únicos
    nextEquipamentoId: 4,
    nextPendenciaId: 4,
    
    // SEÇÃO DE USUÁRIOS SINCRONIZADOS
    usuarios: {
        'visitante': { 
            senha: 'visitante123', 
            nivel: 'visitante',
            nome: 'Visitante',
            email: 'visitante@empresa.com',
            departamento: 'Visitante',
            dataCriacao: '2023-01-01',
            criadoPor: 'sistema',
            ativo: true,
            ultimoAcesso: null,
            dataAtualizacao: '2023-01-01',
            atualizadoPor: 'sistema'
        },
        'operador': { 
            senha: 'operador456', 
            nivel: 'operador',
            nome: 'Operador',
            email: 'operador@empresa.com',
            departamento: 'Operações',
            dataCriacao: '2023-01-01',
            criadoPor: 'sistema',
            ativo: true,
            ultimoAcesso: null,
            dataAtualizacao: '2023-01-01',
            atualizadoPor: 'sistema'
        },
        'administrador': { 
            senha: 'admin789', 
            nivel: 'administrador',
            nome: 'Administrador',
            email: 'admin@empresa.com',
            departamento: 'TI',
            dataCriacao: '2023-01-01',
            criadoPor: 'sistema',
            ativo: true,
            ultimoAcesso: null,
            dataAtualizacao: '2023-01-01',
            atualizadoPor: 'sistema'
        }
    },
    
    // Metadados do sistema
    metadata: {
        dataCriacao: '2023-01-01',
        ultimaAtualizacao: new Date().toISOString(),
        versao: '2.2.0',
        totalEquipamentos: 3,
        totalUsuarios: 3,
        criadoPor: 'sistema'
    },
    
    // Logs de auditoria inicial
    logs: [
        {
            id: 1,
            usuario: "sistema",
            nivel: "sistema",
            acao: "CRIAR_SISTEMA",
            detalhes: "Sistema inicializado com dados de exemplo",
            timestamp: "2023-01-01T00:00:00",
            ip: "local",
            equipamentoId: null,
            pendenciaId: null,
            usuarioAlvo: null,
            dataHoraBR: "01/01/2023, 00:00:00"
        },
        {
            id: 2,
            usuario: "administrador",
            nivel: "administrador",
            acao: "LOGIN",
            detalhes: "Primeiro login do administrador",
            timestamp: new Date().toISOString(),
            ip: "local",
            equipamentoId: null,
            pendenciaId: null,
            usuarioAlvo: null,
            dataHoraBR: new Date().toLocaleString('pt-BR')
        }
    ],
    nextLogId: 3
};

// Sistema de Permissões por Nível de Acesso
const PERMISSOES = {
    niveis: {
        "visitante": {
            nome: "Visitante",
            nivel: 1,
            cor: "#95a5a6",
            icone: "fa-eye",
            descricao: "Somente visualização de equipamentos",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "filtrar_equipamentos"
            ],
            restricoes: [
                "nao_pode_criar",
                "nao_pode_editar",
                "nao_pode_excluir",
                "nao_pode_exportar",
                "nao_pode_configurar",
                "nao_pode_gerenciar_usuarios"
            ]
        },
        "operador": {
            nome: "Operador",
            nivel: 2,
            cor: "#3498db",
            icone: "fa-user-cog",
            descricao: "Cria, edita, exclui e exporta dados",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_equipamentos",
                "editar_equipamentos",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias_proprias",
                "exportar_dados",
                "filtrar_equipamentos"
            ],
            restricoes: [
                "nao_pode_excluir_equipamentos",
                "nao_pode_excluir_pendencias_outros",
                "nao_pode_configurar_sistema",
                "nao_pode_gerenciar_usuarios",
                "nao_pode_visualizar_logs"
            ]
        },
        "administrador": {
            nome: "Administrador",
            nivel: 3,
            cor: "#e74c3c",
            icone: "fa-user-shield",
            descricao: "Acesso total ao sistema",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_equipamentos",
                "editar_equipamentos",
                "excluir_equipamentos",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "exportar_dados",
                "configurar_sistema",
                "gerenciar_usuarios",
                "visualizar_logs",
                "backup_dados",
                "restaurar_dados",
                "filtrar_equipamentos",
                "sincronizar_dados"
            ],
            restricoes: []
        }
    },
    
    // Verificar se usuário tem permissão específica
    verificarPermissao: function(usuario, permissao) {
        const nivelUsuario = this.niveis[usuario];
        if (!nivelUsuario) {
            console.warn(`Usuário ${usuario} não encontrado nos níveis de permissão`);
            return false;
        }
        
        // Permissões básicas que todos têm
        const permissoesBasicas = ['visualizar_equipamentos', 'ver_detalhes', 'filtrar_equipamentos'];
        if (permissoesBasicas.includes(permissao)) {
            return true;
        }
        
        return nivelUsuario.permissoes.includes(permissao);
    },
    
    // Obter nome do nível do usuário
    getNomeNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.nome : 'Visitante';
    },
    
    // Obter nível numérico
    getNivelNumerico: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.nivel : 1;
    },
    
    // Obter cor do nível
    getCorNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.cor : '#95a5a6';
    },
    
    // Obter ícone do nível
    getIconeNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.icone : 'fa-eye';
    },
    
    // Obter descrição do nível
    getDescricaoNivel: function(usuario) {
        const nivel = this.niveis[usuario];
        return nivel ? nivel.descricao : 'Nível de acesso desconhecido';
    },
    
    // Listar todos os níveis disponíveis
    getTodosNiveis: function() {
        return Object.keys(this.niveis);
    },
    
    // Obter informações completas de um nível
    getInfoNivel: function(nivel) {
        return this.niveis[nivel] || null;
    },
    
    // Verificar se usuário pode executar ação específica
    podeExecutarAcao: function(usuario, acao, recurso, donoRecurso = null) {
        const nivel = this.niveis[usuario];
        if (!nivel) return false;
        
        switch(acao) {
            case 'criar':
                if (recurso === 'equipamento') {
                    return nivel.permissoes.includes('criar_equipamentos');
                }
                if (recurso === 'pendencia') {
                    return nivel.permissoes.includes('criar_pendencias');
                }
                if (recurso === 'usuario') {
                    return nivel.permissoes.includes('gerenciar_usuarios');
                }
                break;
                
            case 'editar':
                if (recurso === 'equipamento') {
                    return nivel.permissoes.includes('editar_equipamentos');
                }
                if (recurso === 'pendencia') {
                    if (donoRecurso === usuario) {
                        return true; // Dono sempre pode editar
                    }
                    return nivel.permissoes.includes('editar_pendencias');
                }
                if (recurso === 'usuario') {
                    return nivel.permissoes.includes('gerenciar_usuarios');
                }
                break;
                
            case 'excluir':
                if (recurso === 'equipamento') {
                    return nivel.permissoes.includes('excluir_equipamentos');
                }
                if (recurso === 'pendencia') {
                    if (donoRecurso === usuario) {
                        return nivel.permissoes.includes('excluir_pendencias_proprias');
                    }
                    return nivel.permissoes.includes('excluir_pendencias');
                }
                if (recurso === 'usuario') {
                    return nivel.permissoes.includes('gerenciar_usuarios');
                }
                break;
                
            case 'exportar':
                return nivel.permissoes.includes('exportar_dados');
                
            case 'configurar':
                return nivel.permissoes.includes('configurar_sistema');
                
            case 'gerenciar_usuarios':
                return nivel.permissoes.includes('gerenciar_usuarios');
                
            case 'visualizar_logs':
                return nivel.permissoes.includes('visualizar_logs');
                
            case 'backup_dados':
                return nivel.permissoes.includes('backup_dados');
                
            case 'restaurar_dados':
                return nivel.permissoes.includes('restaurar_dados');
                
            case 'sincronizar':
                return nivel.permissoes.includes('sincronizar_dados');
        }
        
        return false;
    },
    
    // Verificar restrições do usuário
    temRestricao: function(usuario, restricao) {
        const nivel = this.niveis[usuario];
        if (!nivel) return false;
        
        return nivel.restricoes.includes(restricao);
    },
    
    // Gerar relatório de permissões
    gerarRelatorioPermissoes: function() {
        let relatorio = "=== RELATÓRIO DE PERMISSÕES DO SISTEMA ===\n\n";
        
        Object.entries(this.niveis).forEach(([key, nivel]) => {
            relatorio += `NÍVEL: ${nivel.nome} (${key})\n`;
            relatorio += `Nível numérico: ${nivel.nivel}\n`;
            relatorio += `Descrição: ${nivel.descricao}\n`;
            relatorio += `Cor: ${nivel.cor}\n`;
            relatorio += `Ícone: ${nivel.icone}\n`;
            relatorio += `Permissões (${nivel.permissoes.length}):\n`;
            
            nivel.permissoes.forEach(permissao => {
                relatorio += `  - ${permissao}\n`;
            });
            
            if (nivel.restricoes.length > 0) {
                relatorio += `Restrições (${nivel.restricoes.length}):\n`;
                nivel.restricoes.forEach(restricao => {
                    relatorio += `  - ${restricao}\n`;
                });
            }
            
            relatorio += "\n" + "=".repeat(50) + "\n\n";
        });
        
        return relatorio;
    },
    
    // Verificar se um usuário tem permissão para visualizar determinado conteúdo
    podeVisualizarConteudo: function(usuario, tipoConteudo) {
        const nivel = this.niveis[usuario];
        if (!nivel) return false;
        
        const mapConteudoPermissao = {
            'equipamentos': 'visualizar_equipamentos',
            'detalhes': 'ver_detalhes',
            'logs': 'visualizar_logs',
            'usuarios': 'gerenciar_usuarios',
            'configuracoes': 'configurar_sistema',
            'exportacoes': 'exportar_dados'
        };
        
        const permissaoRequerida = mapConteudoPermissao[tipoConteudo];
        if (!permissaoRequerida) return true; // Se não está mapeado, permite
        
        return this.verificarPermissao(usuario, permissaoRequerida);
    }
};

// Configurações da aplicação
const APP_CONFIG = {
    nome: "Gestão de Equipamentos - Usina Industrial",
    versao: "2.2.0",
    empresa: "Usina Industrial Ltda.",
    desenvolvedor: "Equipe de TI",
    ano: "2024",
    
    // Setores da usina
    setores: {
        // MOAGEM
        "moagem-moagem": {
            nome: "MOAGEM / MOAGEM",
            cor: "#1abc9c",
            icone: "fas fa-cogs"
        },
        
        // FLOTAÇÃO
        "flotacao-flot-rougher": {
            nome: "FLOTAÇÃO / FLOT ROUGHER",
            cor: "#3498db",
            icone: "fas fa-water"
        },
        "flotacao-flot-cleaner-scavenger": {
            nome: "FLOTAÇÃO / FLOT CLEANER-SCAVENGER",
            cor: "#2980b9",
            icone: "fas fa-filter"
        },
        "flotacao-flot-pirita": {
            nome: "FLOTAÇÃO / FLOT PIRITA",
            cor: "#1f618d",
            icone: "fas fa-gem"
        },
        
        // FILTRAGEM
        "filtragem-filtragem-concentrado": {
            nome: "FILTRAGEM / FILTRAGEM DE CONCENTRADO",
            cor: "#9b59b6",
            icone: "fas fa-filter"
        },
        "filtragem-filtragem-rejeito": {
            nome: "FILTRAGEM / FILTRAGEM DE REJEITO",
            cor: "#8e44ad",
            icone: "fas fa-trash-alt"
        },
        
        // REAGENTES
        "reagentes-pax": {
            nome: "REAGENTES / PAX",
            cor: "#e74c3c",
            icone: "fas fa-flask"
        },
        "reagentes-dtf": {
            nome: "REAGENTES / DTF",
            cor: "#c0392b",
            icone: "fas fa-vial"
        },
        "reagentes-espumante": {
            nome: "REAGENTES / ESPUMANTE",
            cor: "#d35400",
            icone: "fas fa-bubbles"
        },
        "reagentes-leite-de-cal": {
            nome: "REAGENTES / LEITE DE CAL",
            cor: "#e67e22",
            icone: "fas fa-prescription-bottle"
        },
        "reagentes-acido-sulfurico": {
            nome: "REAGENTES / ÁCIDO SULFÚRICO",
            cor: "#f39c12",
            icone: "fas fa-exclamation-triangle"
        },
        "reagentes-floculante": {
            nome: "REAGENTES / FLOCULANTE",
            cor: "#f1c40f",
            icone: "fas fa-snowflake"
        },
        
        // UTILIDADES
        "utilidades-distribuicao-agua": {
            nome: "UTILIDADES / DISTRIBUIÇÃO DE ÁGUA",
            cor: "#27ae60",
            icone: "fas fa-tint"
        },
        
        // TORRE DE RESFRIAMENTO
        "torre-resfriamento-torre-resfriamento": {
            nome: "TORRE DE RESFRIAMENTO / TORRE DE RESFRIAMENTO",
            cor: "#16a085",
            icone: "fas fa-temperature-low"
        }
    },
    
    // Status dos equipamentos
    statusEquipamento: {
        "apto": {
            nome: "Apto a Operar",
            cor: "#2ecc71",
            icone: "fas fa-check-circle",
            descricao: "Equipamento em condições operacionais"
        },
        "nao-apto": {
            nome: "Não Apto",
            cor: "#e74c3c",
            icone: "fas fa-times-circle",
            descricao: "Equipamento com pendências críticas"
        }
    },
    
    // Status das pendências
    statusPendencia: {
        "aberta": {
            nome: "Aberta",
            cor: "#f39c12",
            icone: "fas fa-clock",
            descricao: "Pendência registrada, aguardando ação"
        },
        "em-andamento": {
            nome: "Em Andamento",
            cor: "#3498db",
            icone: "fas fa-tools",
            descricao: "Pendência sendo resolvida"
        },
        "resolvida": {
            nome: "Resolvida",
            cor: "#27ae60",
            icone: "fas fa-check",
            descricao: "Pendência resolvida com sucesso"
        },
        "cancelada": {
            nome: "Cancelada",
            cor: "#95a5a6",
            icone: "fas fa-ban",
            descricao: "Pendência cancelada"
        }
    },
    
    // Prioridades das pendências
    prioridades: {
        "baixa": {
            nome: "Baixa",
            cor: "#27ae60",
            icone: "fas fa-arrow-down",
            descricao: "Baixo impacto na operação"
        },
        "media": {
            nome: "Média",
            cor: "#f39c12",
            icone: "fas fa-equals",
            descricao: "Impacto moderado na operação"
        },
        "alta": {
            nome: "Alta",
            cor: "#e74c3c",
            icone: "fas fa-arrow-up",
            descricao: "Alto impacto na operação"
        },
        "critica": {
            nome: "Crítica",
            cor: "#c0392b",
            icone: "fas fa-exclamation-triangle",
            descricao: "Impacto crítico, pode parar operação"
        }
    },
    
    // Responsáveis pelas pendências
    responsaveis: {
        "Elétrica": {
            icone: "fas fa-bolt",
            cor: "#f1c40f",
            contato: "elétrica@usina.com"
        },
        "Instrumentação": {
            icone: "fas fa-tachometer-alt",
            cor: "#9b59b6",
            contato: "instrumentacao@usina.com"
        },
        "Mecânica": {
            icone: "fas fa-cogs",
            cor: "#34495e",
            contato: "mecanica@usina.com"
        },
        "Preventiva_Engenharia": {
            icone: "fas fa-clipboard-check",
            cor: "#27ae60",
            contato: "preventiva@usina.com"
        },
        "Automação": {
            icone: "fas fa-robot",
            cor: "#3498db",
            contato: "automacao@usina.com"
        },
        "Externo": {
            icone: "fas fa-hard-hat",
            cor: "#e67e22",
            contato: "fornecedor@externo.com"
        }
    },
    
    // Configurações de cores
    coresSistema: {
        primaria: "#3498db",
        secundaria: "#2ecc71",
        terciaria: "#9b59b6",
        destaque: "#e74c3c",
        sucesso: "#27ae60",
        alerta: "#f39c12",
        erro: "#e74c3c",
        informacao: "#3498db",
        texto: "#2c3e50",
        textoSecundario: "#7f8c8d",
        fundo: "#ecf0f1",
        fundoSecundario: "#f8f9fa",
        borda: "#dfe6e9",
        card: "#ffffff",
        sombra: "0 2px 10px rgba(0,0,0,0.1)"
    },
    
    // Configurações da aplicação
    appSettings: {
        // Tempo de expiração da sessão (em horas)
        sessaoExpiracaoHoras: 8,
        
        // Itens por página
        itensPorPagina: 20,
        
        // Atualização automática dos dados (em minutos)
        atualizacaoAutomaticaMinutos: 5,
        
        // Habilitar/desabilitar notificações
        notificacoesAtivas: true,
        
        // Mantém logs de atividades
        manterLogs: true,
        
        // Número máximo de logs a manter
        maxLogs: 1000,
        
        // Mostrar indicador de nível
        mostrarIndicadorNivel: true,
        
        // Configurações de usuários
        permitirCriarUsuarios: true,
        permitirRedefinirSenha: true,
        senhaMinimaCaracteres: 6,
        expiracaoSenhaDias: 90,
        
        // Configurações de sincronização
        sincronizacaoAutomatica: true,
        sincronizacaoForcadaIntervalo: 30, // minutos
        usarCacheOffline: true,
        
        // Configurações de exportação
        formatoExportacaoPadrao: 'csv',
        incluirMetadadosExportacao: true,
        
        // Configurações de segurança
        bloqueioTentativasLogin: 5,
        tempoBloqueioLogin: 15, // minutos
        registrarIPLogin: false,
        
        // Configurações de interface
        temaPadrao: 'claro',
        animacoesAtivas: true,
        compactarCards: false,
        mostrarEstatisticas: true
    },
    
    // Tipos de ações registradas nos logs
    tiposAcao: {
        LOGIN: {
            codigo: "LOGIN",
            nome: "Login no sistema",
            nivel: "info"
        },
        LOGOUT: {
            codigo: "LOGOUT",
            nome: "Logout do sistema",
            nivel: "info"
        },
        CRIAR_EQUIPAMENTO: {
            codigo: "CRIAR_EQUIPAMENTO",
            nome: "Criar equipamento",
            nivel: "success"
        },
        EDITAR_EQUIPAMENTO: {
            codigo: "EDITAR_EQUIPAMENTO",
            nome: "Editar equipamento",
            nivel: "warning"
        },
        EXCLUIR_EQUIPAMENTO: {
            codigo: "EXCLUIR_EQUIPAMENTO",
            nome: "Excluir equipamento",
            nivel: "error"
        },
        CRIAR_PENDENCIA: {
            codigo: "CRIAR_PENDENCIA",
            nome: "Criar pendência",
            nivel: "info"
        },
        EDITAR_PENDENCIA: {
            codigo: "EDITAR_PENDENCIA",
            nome: "Editar pendência",
            nivel: "warning"
        },
        EXCLUIR_PENDENCIA: {
            codigo: "EXCLUIR_PENDENCIA",
            nome: "Excluir pendência",
            nivel: "error"
        },
        EXPORTAR_DADOS: {
            codigo: "EXPORTAR_DADOS",
            nome: "Exportar dados",
            nivel: "info"
        },
        ALTERAR_TEMA: {
            codigo: "ALTERAR_TEMA",
            nome: "Alterar tema",
            nivel: "info"
        },
        CONFIGURAR_SISTEMA: {
            codigo: "CONFIGURAR_SISTEMA",
            nome: "Configurar sistema",
            nivel: "warning"
        },
        VISUALIZAR_DETALHES: {
            codigo: "VISUALIZAR_DETALHES",
            nome: "Visualizar detalhes",
            nivel: "info"
        },
        FILTRAR_EQUIPAMENTOS: {
            codigo: "FILTRAR_EQUIPAMENTOS",
            nome: "Filtrar equipamentos",
            nivel: "info"
        },
        EXPORTAR_LOGS: {
            codigo: "EXPORTAR_LOGS",
            nome: "Exportar logs",
            nivel: "info"
        },
        VISUALIZAR_LOGS: {
            codigo: "VISUALIZAR_LOGS",
            nome: "Visualizar logs",
            nivel: "info"
        },
        SINCRONIZAR_DADOS: {
            codigo: "SINCRONIZAR_DADOS",
            nome: "Sincronizar dados",
            nivel: "info"
        },
        // Ações para gerenciamento de usuários
        CRIAR_USUARIO: {
            codigo: "CRIAR_USUARIO",
            nome: "Criar usuário",
            nivel: "success"
        },
        EDITAR_USUARIO: {
            codigo: "EDITAR_USUARIO",
            nome: "Editar usuário",
            nivel: "warning"
        },
        EXCLUIR_USUARIO: {
            codigo: "EXCLUIR_USUARIO",
            nome: "Excluir usuário",
            nivel: "error"
        },
        REDEFINIR_SENHA: {
            codigo: "REDEFINIR_SENHA",
            nome: "Redefinir senha",
            nivel: "warning"
        },
        ATIVAR_USUARIO: {
            codigo: "ATIVAR_USUARIO",
            nome: "Ativar usuário",
            nivel: "success"
        },
        DESATIVAR_USUARIO: {
            codigo: "DESATIVAR_USUARIO",
            nome: "Desativar usuário",
            nivel: "error"
        },
        SESSAO_EXPIRADA: {
            codigo: "SESSAO_EXPIRADA",
            nome: "Sessão expirada",
            nivel: "warning"
        },
        ERRO_SISTEMA: {
            codigo: "ERRO_SISTEMA",
            nome: "Erro de sistema",
            nivel: "error"
        }
    },
    
    // Mapeamento de códigos de ação para ícones
    iconesAcao: {
        "LOGIN": "fas fa-sign-in-alt",
        "LOGOUT": "fas fa-sign-out-alt",
        "CRIAR": "fas fa-plus-circle",
        "EDITAR": "fas fa-edit",
        "EXCLUIR": "fas fa-trash",
        "EXPORTAR": "fas fa-download",
        "VISUALIZAR": "fas fa-eye",
        "FILTRAR": "fas fa-filter",
        "CONFIGURAR": "fas fa-cog",
        "SINCRONIZAR": "fas fa-sync",
        "BACKUP": "fas fa-database",
        "RESTAURAR": "fas fa-history"
    }
};

// Funções utilitárias para a aplicação
const APP_UTILS = {
    // Formatar data para exibição
    formatarData: function(dataString, incluirHora = false) {
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
    },
    
    // Formatar data e hora completa
    formatarDataHora: function(dataString) {
        return this.formatarData(dataString, true);
    },
    
    // Obter informações completas de um status
    getInfoStatus: function(status, tipo = 'equipamento') {
        if (tipo === 'equipamento') {
            return APP_CONFIG.statusEquipamento[status] || { 
                nome: status, 
                cor: '#95a5a6', 
                icone: 'fas fa-question-circle' 
            };
        } else if (tipo === 'pendencia') {
            return APP_CONFIG.statusPendencia[status] || { 
                nome: status, 
                cor: '#95a5a6', 
                icone: 'fas fa-question-circle' 
            };
        }
        return null;
    },
    
    // Obter informações completas de uma prioridade
    getInfoPrioridade: function(prioridade) {
        return APP_CONFIG.prioridades[prioridade] || { 
            nome: prioridade, 
            cor: '#95a5a6', 
            icone: 'fas fa-question-circle' 
        };
    },
    
    // Obter informações completas de um setor
    getInfoSetor: function(setorId) {
        return APP_CONFIG.setores[setorId] || { 
            nome: setorId, 
            cor: '#95a5a6', 
            icone: 'fas fa-building' 
        };
    },
    
    // Obter informações completas de um responsável
    getInfoResponsavel: function(responsavel) {
        return APP_CONFIG.responsaveis[responsavel] || { 
            icone: 'fas fa-user', 
            cor: '#95a5a6', 
            contato: 'Não informado' 
        };
    },
    
    // Obter informações completas de uma ação
    getInfoAcao: function(codigoAcao) {
        return APP_CONFIG.tiposAcao[codigoAcao] || { 
            codigo: codigoAcao, 
            nome: codigoAcao, 
            nivel: 'info' 
        };
    },
    
    // Obter ícone de uma ação
    getIconeAcao: function(codigoAcao) {
        // Tentar mapeamento específico primeiro
        if (codigoAcao.includes('CRIAR')) return 'fas fa-plus-circle';
        if (codigoAcao.includes('EDITAR')) return 'fas fa-edit';
        if (codigoAcao.includes('EXCLUIR')) return 'fas fa-trash';
        if (codigoAcao.includes('EXPORTAR')) return 'fas fa-download';
        if (codigoAcao.includes('VISUALIZAR')) return 'fas fa-eye';
        if (codigoAcao.includes('LOGIN')) return 'fas fa-sign-in-alt';
        if (codigoAcao.includes('LOGOUT')) return 'fas fa-sign-out-alt';
        
        // Fallback para mapeamento geral
        return APP_CONFIG.iconesAcao[codigoAcao] || 'fas fa-history';
    },
    
    // Gerar código único para equipamentos
    gerarCodigoEquipamento: function(prefixo = "EQP", setor = null) {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substr(2, 4).toUpperCase();
        
        let setorPrefix = '';
        if (setor) {
            // Pegar primeira letra de cada parte do setor
            const partes = setor.split('-');
            setorPrefix = partes.map(p => p.charAt(0).toUpperCase()).join('');
        }
        
        return `${prefixo}-${setorPrefix}${timestamp.slice(-6)}-${random}`;
    },
    
    // Validar e-mail
    validarEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    },
    
    // Validar força da senha
    validarForcaSenha: function(senha) {
        let pontos = 0;
        let feedback = [];
        
        // Comprimento mínimo
        if (senha.length >= 8) pontos++;
        if (senha.length >= 12) pontos++;
        
        // Caracteres especiais
        if (/[A-Z]/.test(senha)) {
            pontos++;
            feedback.push('Contém letra maiúscula');
        }
        if (/[a-z]/.test(senha)) {
            pontos++;
            feedback.push('Contém letra minúscula');
        }
        if (/[0-9]/.test(senha)) {
            pontos++;
            feedback.push('Contém número');
        }
        if (/[^A-Za-z0-9]/.test(senha)) {
            pontos++;
            feedback.push('Contém caractere especial');
        }
        
        // Classificar força
        let forca = 'fraca';
        if (pontos <= 2) forca = 'fraca';
        else if (pontos <= 4) forca = 'média';
        else forca = 'forte';
        
        return { 
            forca: forca, 
            pontos: pontos,
            feedback: feedback
        };
    },
    
    // Gerar senha aleatória
    gerarSenhaAleatoria: function(tamanho = 12) {
        const maiusculas = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const minusculas = 'abcdefghijklmnopqrstuvwxyz';
        const numeros = '0123456789';
        const especiais = '!@#$%^&*()_+-=[]{}|;:,.<>?';
        const todos = maiusculas + minusculas + numeros + especiais;
        
        let senha = '';
        
        // Garantir pelo menos um de cada tipo
        senha += maiusculas.charAt(Math.floor(Math.random() * maiusculas.length));
        senha += minusculas.charAt(Math.floor(Math.random() * minusculas.length));
        senha += numeros.charAt(Math.floor(Math.random() * numeros.length));
        senha += especiais.charAt(Math.floor(Math.random() * especiais.length));
        
        // Completar com caracteres aleatórios
        for (let i = 4; i < tamanho; i++) {
            senha += todos.charAt(Math.floor(Math.random() * todos.length));
        }
        
        // Embaralhar a senha
        senha = senha.split('').sort(() => Math.random() - 0.5).join('');
        
        return senha;
    },
    
    // Calcular diferença entre datas em dias
    diferencaDias: function(data1, data2 = new Date()) {
        try {
            const d1 = new Date(data1);
            const d2 = new Date(data2);
            
            const diffTime = Math.abs(d2 - d1);
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (e) {
            return null;
        }
    },
    
    // Validar data (não pode ser futura)
    validarDataNaoFutura: function(dataString) {
        try {
            const data = new Date(dataString);
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999); // Fim do dia de hoje
            
            return data <= hoje;
        } catch (e) {
            return false;
        }
    },
    
    // Sanitizar entrada de dados
    sanitizarTexto: function(texto) {
        if (typeof texto !== 'string') return texto;
        
        // Remover tags HTML
        const semTags = texto.replace(/<[^>]*>/g, '');
        
        // Escapar caracteres especiais
        return semTags
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    },
    
    // Formatar número de telefone
    formatarTelefone: function(telefone) {
        const cleaned = ('' + telefone).replace(/\D/g, '');
        const match = cleaned.match(/^(\d{2})(\d{5})(\d{4})$/);
        if (match) {
            return `(${match[1]}) ${match[2]}-${match[3]}`;
        }
        return telefone;
    },
    
    // Calcular idade do equipamento (em dias)
    calcularIdadeEquipamento: function(dataCriacao) {
        return this.diferencaDias(dataCriacao) || 0;
    },
    
    // Formatar bytes para tamanho legível
    formatarBytes: function(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    },
    
    // Gerar cor baseada em string (para avatares, etc.)
    gerarCorDeString: function(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            hash = str.charCodeAt(i) + ((hash << 5) - hash);
        }
        
        const h = hash % 360;
        return `hsl(${h}, 70%, 60%)`;
    },
    
    // Obter iniciais de um nome
    obterIniciais: function(nome) {
        if (!nome) return '?';
        
        const partes = nome.split(' ');
        if (partes.length >= 2) {
            return (partes[0][0] + partes[1][0]).toUpperCase();
        } else if (partes.length === 1 && partes[0].length >= 2) {
            return partes[0].substring(0, 2).toUpperCase();
        } else {
            return nome.substring(0, 2).toUpperCase();
        }
    }
};

// Banco de usuários autorizados (para compatibilidade com versões antigas)
const USUARIOS_AUTORIZADOS = {
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

// ===========================================
// SISTEMA DE LOGS DE AUDITORIA
// ===========================================

// Função para registrar logs com mais detalhes
function registrarLogAuditoria(acao, detalhes, equipamentoId = null, pendenciaId = null, usuarioAlvo = null) {
    try {
        const usuario = getUsuarioLogado();
        const nivel = getNivelUsuario();
        const timestamp = new Date().toISOString();
        const ip = 'local';
        const userAgent = navigator.userAgent;
        
        const infoAcao = APP_UTILS.getInfoAcao(acao);
        const iconeAcao = APP_UTILS.getIconeAcao(acao);
        
        const logEntry = {
            id: gerarIdUnico(),
            usuario: usuario || 'sistema',
            nivel: nivel || 'sistema',
            acao: acao,
            nomeAcao: infoAcao.nome || acao,
            nivelAcao: infoAcao.nivel || 'info',
            iconeAcao: iconeAcao,
            detalhes: detalhes,
            equipamentoId: equipamentoId,
            pendenciaId: pendenciaId,
            usuarioAlvo: usuarioAlvo,
            timestamp: timestamp,
            ip: ip,
            userAgent: userAgent,
            dataHoraBR: new Date().toLocaleString('pt-BR'),
            online: navigator.onLine
        };
        
        console.log('LOG DE AUDITORIA:', logEntry);
        
        // Salvar no localStorage
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs_auditoria') || '[]');
        logs.unshift(logEntry);
        
        // Limitar a 1000 logs
        if (logs.length > 1000) {
            logs = logs.slice(0, 1000);
        }
        
        localStorage.setItem('gestao_equipamentos_logs_auditoria', JSON.stringify(logs));
        
        // Também salvar no log geral de atividades
        registrarAtividade(acao, detalhes);
        
        // Se estiver online, tentar salvar no JSONBin em background
        if (navigator.onLine) {
            setTimeout(() => salvarLogsNoJSONBin(), 0);
        }
        
        return logEntry;
        
    } catch (e) {
        console.error('Erro ao salvar log de auditoria:', e);
        return null;
    }
}

// Função para gerar ID único
function gerarIdUnico() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
}

// Função para obter logs de auditoria
function getLogsAuditoria(filtro = {}) {
    try {
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs_auditoria') || '[]');
        
        // Aplicar filtros
        if (filtro.usuario) {
            logs = logs.filter(log => log.usuario === filtro.usuario);
        }
        if (filtro.acao) {
            logs = logs.filter(log => log.acao === filtro.acao);
        }
        if (filtro.nivelAcao) {
            logs = logs.filter(log => log.nivelAcao === filtro.nivelAcao);
        }
        if (filtro.dataInicio) {
            const dataInicio = new Date(filtro.dataInicio);
            logs = logs.filter(log => new Date(log.timestamp) >= dataInicio);
        }
        if (filtro.dataFim) {
            const dataFim = new Date(filtro.dataFim);
            logs = logs.filter(log => new Date(log.timestamp) <= dataFim);
        }
        if (filtro.equipamentoId) {
            logs = logs.filter(log => log.equipamentoId === filtro.equipamentoId);
        }
        if (filtro.limite) {
            logs = logs.slice(0, filtro.limite);
        }
        
        return logs;
    } catch (e) {
        console.error('Erro ao obter logs de auditoria:', e);
        return [];
    }
}

// Função para exportar logs
function exportarLogsAuditoria() {
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'visualizar_logs')) {
        alert('Você não tem permissão para exportar logs.');
        return;
    }
    
    const logs = getLogsAuditoria();
    if (logs.length === 0) {
        alert('Nenhum log encontrado para exportar.');
        return;
    }
    
    // Criar CSV
    let csv = 'ID,Data/Hora,Usuário,Nível,Ação,Detalhes,ID Equipamento,ID Pendência,Usuário Alvo,Nível Ação,Online\n';
    
    logs.forEach(log => {
        const linha = [
            log.id,
            `"${log.dataHoraBR || new Date(log.timestamp).toLocaleString('pt-BR')}"`,
            `"${log.usuario}"`,
            `"${log.nivel}"`,
            `"${log.nomeAcao || log.acao}"`,
            `"${log.detalhes.replace(/"/g, '""')}"`,
            log.equipamentoId || '',
            log.pendenciaId || '',
            log.usuarioAlvo || '',
            log.nivelAcao || 'info',
            log.online ? 'Sim' : 'Não'
        ].join(',');
        csv += linha + '\n';
    });
    
    // Download
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const dataAtual = new Date().toISOString().split('T')[0];
    
    link.href = URL.createObjectURL(blob);
    link.download = `logs_auditoria_${dataAtual}_${usuario}.csv`;
    link.click();
    URL.revokeObjectURL(link.href);
    
    registrarLogAuditoria('EXPORTAR_LOGS', `Exportou ${logs.length} logs de auditoria`);
}

// Função para visualizar logs (interface)
function visualizarLogsAuditoria() {
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'visualizar_logs')) {
        alert('Você não tem permissão para visualizar logs.');
        return;
    }
    
    const logs = getLogsAuditoria({ limite: 100 });
    
    let html = `
        <div class="logs-header">
            <h3><i class="fas fa-clipboard-list"></i> Logs de Auditoria</h3>
            <p>Total de registros: ${logs.length}</p>
            <div class="logs-stats">
                <span class="stat-badge info"><i class="fas fa-info-circle"></i> ${logs.filter(l => l.nivelAcao === 'info').length}</span>
                <span class="stat-badge success"><i class="fas fa-check-circle"></i> ${logs.filter(l => l.nivelAcao === 'success').length}</span>
                <span class="stat-badge warning"><i class="fas fa-exclamation-triangle"></i> ${logs.filter(l => l.nivelAcao === 'warning').length}</span>
                <span class="stat-badge error"><i class="fas fa-times-circle"></i> ${logs.filter(l => l.nivelAcao === 'error').length}</span>
            </div>
        </div>
        
        <div class="logs-filtros">
            <div class="search-box">
                <i class="fas fa-search"></i>
                <input type="text" id="search-logs" placeholder="Buscar nos logs...">
            </div>
            <select id="filter-log-nivel">
                <option value="all">Todos os níveis</option>
                <option value="info">Informação</option>
                <option value="success">Sucesso</option>
                <option value="warning">Aviso</option>
                <option value="error">Erro</option>
            </select>
            <select id="filter-log-usuario">
                <option value="all">Todos os usuários</option>
                ${Array.from(new Set(logs.map(l => l.usuario))).map(u => 
                    `<option value="${u}">${u}</option>`
                ).join('')}
            </select>
            <button onclick="exportarLogsAuditoria()" class="btn-small">
                <i class="fas fa-download"></i> Exportar CSV
            </button>
        </div>
        
        <div class="logs-container">
            <table class="logs-table">
                <thead>
                    <tr>
                        <th>Data/Hora</th>
                        <th>Usuário</th>
                        <th>Ação</th>
                        <th>Detalhes</th>
                        <th>Nível</th>
                    </tr>
                </thead>
                <tbody id="logs-list">
    `;
    
    logs.forEach(log => {
        const dataHora = log.dataHoraBR || new Date(log.timestamp).toLocaleString('pt-BR');
        
        html += `
            <tr class="log-item ${log.nivelAcao}" data-usuario="${log.usuario}" data-nivel="${log.nivelAcao}">
                <td>
                    <div class="log-time">${dataHora}</div>
                    ${log.online === false ? '<small class="offline-badge">Offline</small>' : ''}
                </td>
                <td>
                    <div class="log-usuario">
                        <span class="log-usuario-nome">${log.usuario}</span>
                        <small class="log-usuario-nivel ${log.nivel}">${log.nivel}</small>
                    </div>
                </td>
                <td>
                    <div class="log-acao">
                        <i class="${log.iconeAcao || 'fas fa-history'}"></i>
                        ${log.nomeAcao || log.acao}
                    </div>
                </td>
                <td class="log-detalhes">
                    <div>${log.detalhes}</div>
                    ${log.equipamentoId ? `<small>Equipamento ID: ${log.equipamentoId}</small>` : ''}
                    ${log.pendenciaId ? `<small>Pendência ID: ${log.pendenciaId}</small>` : ''}
                    ${log.usuarioAlvo ? `<small>Usuário alvo: ${log.usuarioAlvo}</small>` : ''}
                </td>
                <td>
                    <span class="log-nivel ${log.nivelAcao}">
                        <i class="fas fa-circle"></i> ${log.nivelAcao}
                    </span>
                </td>
            </tr>
        `;
    });
    
    html += `
                </tbody>
            </table>
        </div>
        
        <style>
            .logs-container {
                max-height: 500px;
                overflow-y: auto;
                margin-top: 15px;
                border: 1px solid var(--cor-borda);
                border-radius: 5px;
            }
            
            .logs-table {
                width: 100%;
                border-collapse: collapse;
            }
            
            .logs-table th {
                position: sticky;
                top: 0;
                background: var(--cor-fundo-secundario);
                z-index: 10;
                padding: 12px;
                text-align: left;
                border-bottom: 2px solid var(--cor-borda);
            }
            
            .logs-table td {
                padding: 10px 12px;
                border-bottom: 1px solid var(--cor-borda);
            }
            
            .log-item:hover {
                background: var(--cor-fundo-secundario);
            }
            
            .log-item.info {
                border-left: 4px solid #3498db;
            }
            
            .log-item.success {
                border-left: 4px solid #27ae60;
            }
            
            .log-item.warning {
                border-left: 4px solid #f39c12;
            }
            
            .log-item.error {
                border-left: 4px solid #e74c3c;
            }
            
            .log-nivel {
                display: inline-block;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 11px;
                font-weight: bold;
                text-transform: uppercase;
            }
            
            .log-nivel.info {
                background: rgba(52, 152, 219, 0.1);
                color: #3498db;
            }
            
            .log-nivel.success {
                background: rgba(46, 204, 113, 0.1);
                color: #27ae60;
            }
            
            .log-nivel.warning {
                background: rgba(243, 156, 18, 0.1);
                color: #f39c12;
            }
            
            .log-nivel.error {
                background: rgba(231, 76, 60, 0.1);
                color: #e74c3c;
            }
            
            .log-usuario {
                display: flex;
                flex-direction: column;
            }
            
            .log-usuario-nivel {
                font-size: 10px;
                padding: 2px 6px;
                border-radius: 8px;
                background: rgba(149, 165, 166, 0.1);
                color: var(--cor-texto-secundario);
                margin-top: 2px;
                display: inline-block;
                width: fit-content;
            }
            
            .log-usuario-nivel.administrador {
                background: rgba(231, 76, 60, 0.1);
                color: #e74c3c;
            }
            
            .log-usuario-nivel.operador {
                background: rgba(52, 152, 219, 0.1);
                color: #3498db;
            }
            
            .log-usuario-nivel.visitante {
                background: rgba(149, 165, 166, 0.1);
                color: #95a5a6;
            }
            
            .log-acao {
                display: flex;
                align-items: center;
                gap: 8px;
                font-weight: 500;
            }
            
            .log-detalhes {
                max-width: 300px;
            }
            
            .log-detalhes small {
                display: block;
                margin-top: 4px;
                color: var(--cor-texto-secundario);
                font-size: 11px;
            }
            
            .offline-badge {
                background: #f39c12;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 10px;
                margin-top: 4px;
                display: inline-block;
            }
            
            .logs-stats {
                display: flex;
                gap: 10px;
                margin-top: 10px;
            }
            
            .stat-badge {
                padding: 4px 10px;
                border-radius: 12px;
                font-size: 12px;
                font-weight: bold;
            }
            
            .stat-badge.info {
                background: rgba(52, 152, 219, 0.1);
                color: #3498db;
            }
            
            .stat-badge.success {
                background: rgba(46, 204, 113, 0.1);
                color: #27ae60;
            }
            
            .stat-badge.warning {
                background: rgba(243, 156, 18, 0.1);
                color: #f39c12;
            }
            
            .stat-badge.error {
                background: rgba(231, 76, 60, 0.1);
                color: #e74c3c;
            }
        </style>
        
        <script>
            // Filtros dinâmicos
            document.getElementById('search-logs').addEventListener('input', function(e) {
                const searchTerm = e.target.value.toLowerCase();
                const rows = document.querySelectorAll('.log-item');
                
                rows.forEach(row => {
                    const detalhes = row.querySelector('.log-detalhes').textContent.toLowerCase();
                    const usuario = row.querySelector('.log-usuario-nome').textContent.toLowerCase();
                    const acao = row.querySelector('.log-acao').textContent.toLowerCase();
                    
                    if (detalhes.includes(searchTerm) || usuario.includes(searchTerm) || acao.includes(searchTerm)) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
            
            document.getElementById('filter-log-nivel').addEventListener('change', function(e) {
                const nivel = e.target.value;
                const rows = document.querySelectorAll('.log-item');
                
                rows.forEach(row => {
                    const rowNivel = row.dataset.nivel;
                    if (nivel === 'all' || rowNivel === nivel) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
            
            document.getElementById('filter-log-usuario').addEventListener('change', function(e) {
                const usuario = e.target.value;
                const rows = document.querySelectorAll('.log-item');
                
                rows.forEach(row => {
                    const rowUsuario = row.dataset.usuario;
                    if (usuario === 'all' || rowUsuario === usuario) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                });
            });
        </script>
    `;
    
    // Criar modal
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content large" style="max-width: 1200px;">
            <div class="modal-header">
                <h3><i class="fas fa-history"></i> Logs de Auditoria do Sistema</h3>
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
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
    
    registrarLogAuditoria('VISUALIZAR_LOGS', 'Visualizou logs de auditoria');
}

// Função para salvar logs no JSONBin (em background)
async function salvarLogsNoJSONBin() {
    try {
        const logs = getLogsAuditoria();
        const usuario = getUsuarioLogado() || 'sistema';
        
        const logsData = {
            logs: logs.slice(0, 100), // Enviar apenas os 100 mais recentes
            metadata: {
                atualizadoEm: new Date().toISOString(),
                atualizadoPor: usuario,
                totalLogs: logs.length,
                origem: 'auditoria'
            }
        };
        
        // Usar um bin separado para logs se necessário
        const logsBinId = JSONBIN_CONFIG.BIN_ID + '_logs';
        
        await fetch(`${JSONBIN_CONFIG.BASE_URL}/${logsBinId}`, {
            method: 'PUT',
            headers: JSONBIN_CONFIG.headers,
            body: JSON.stringify(logsData)
        });
        
    } catch (error) {
        console.warn('Não foi possível salvar logs no JSONBin:', error);
    }
}

// ===========================================
// FUNÇÕES DE SISTEMA
// ===========================================

// Função para logout
function logout() {
    const usuario = getUsuarioLogado();
    const nivel = getNivelUsuario();
    
    // Registrar atividade de logout
    if (usuario) {
        registrarAtividade('LOGOUT', `Usuário ${usuario} (${PERMISSOES.getNomeNivel(nivel)}) saiu do sistema`);
    }
    
    // Limpar dados da sessão
    localStorage.removeItem('gestao_equipamentos_sessao');
    localStorage.removeItem('gestao_equipamentos_usuario');
    localStorage.removeItem('gestao_equipamentos_nivel');
    localStorage.removeItem('gestao_equipamentos_ultimo_acesso');
    
    // Redirecionar para página de login
    window.location.href = 'login.html?logout=true';
}

// Função para verificar sessão ativa
function verificarSessaoAtiva() {
    const sessao = localStorage.getItem('gestao_equipamentos_sessao');
    
    if (!sessao) {
        return false;
    }
    
    try {
        const sessaoData = JSON.parse(sessao);
        const agora = new Date().getTime();
        
        if (agora > sessaoData.expira) {
            // Sessão expirada
            registrarAtividade('SESSAO_EXPIRADA', `Sessão expirou para usuário ${sessaoData.usuario}`);
            
            localStorage.removeItem('gestao_equipamentos_sessao');
            localStorage.removeItem('gestao_equipamentos_usuario');
            localStorage.removeItem('gestao_equipamentos_nivel');
            return false;
        }
        
        return true;
    } catch (e) {
        console.error('Erro ao verificar sessão:', e);
        return false;
    }
}

// Função para obter informações do usuário logado
function getUsuarioLogado() {
    return localStorage.getItem('gestao_equipamentos_usuario');
}

// Função para obter nível do usuário
function getNivelUsuario() {
    return localStorage.getItem('gestao_equipamentos_nivel');
}

// Função para obter informações completas do usuário
function getUsuarioInfo() {
    const usuario = getUsuarioLogado();
    if (!usuario) return null;
    
    // Obter nível e permissões
    const nivel = getNivelUsuario();
    const nivelInfo = PERMISSOES.getInfoNivel(nivel);
    
    // Tentar obter informações adicionais do localStorage
    let usuarioData = null;
    try {
        const usuariosSalvos = localStorage.getItem('gestao_equipamentos_usuarios');
        if (usuariosSalvos) {
            const usuarios = JSON.parse(usuariosSalvos);
            usuarioData = usuarios[usuario];
        }
    } catch (e) {
        console.error('Erro ao carregar dados do usuário:', e);
    }
    
    // Se não encontrar, usar dados padrão
    if (!usuarioData) {
        usuarioData = USUARIOS_AUTORIZADOS[usuario] || {};
    }
    
    return {
        usuario: usuario,
        nivel: nivel,
        nivelNome: PERMISSOES.getNomeNivel(nivel),
        nivelInfo: nivelInfo,
        corNivel: PERMISSOES.getCorNivel(nivel),
        iconeNivel: PERMISSOES.getIconeNivel(nivel),
        nome: usuarioData.nome || usuario,
        email: usuarioData.email || '',
        departamento: usuarioData.departamento || '',
        dataCriacao: usuarioData.dataCriacao || '',
        criadoPor: usuarioData.criadoPor || 'sistema',
        ativo: usuarioData.ativo !== false,
        ultimoAcesso: usuarioData.ultimoAcesso || null,
        dataAtualizacao: usuarioData.dataAtualizacao || usuarioData.dataCriacao || ''
    };
}

// Função para registrar atividade (log de auditoria simplificado)
function registrarAtividade(acao, detalhes) {
    const usuario = getUsuarioLogado();
    const nivel = getNivelUsuario();
    const timestamp = new Date().toISOString();
    
    // Só registra se a configuração permitir
    if (!APP_CONFIG.appSettings.manterLogs) return;
    
    const logEntry = {
        usuario: usuario || 'sistema',
        nivel: nivel || 'sistema',
        acao: acao,
        detalhes: detalhes,
        timestamp: timestamp,
        ip: 'local',
        userAgent: navigator.userAgent,
        online: navigator.onLine
    };
    
    // Em ambiente real, enviaria para um servidor de logs
    console.log('LOG DE ATIVIDADE:', logEntry);
    
    // Salvar no localStorage para histórico local
    try {
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs') || '[]');
        logEntry.id = logs.length > 0 ? Math.max(...logs.map(l => l.id || 0)) + 1 : 1;
        logs.unshift(logEntry); // Adicionar no início
        
        // Limitar número de logs armazenados
        if (logs.length > APP_CONFIG.appSettings.maxLogs) {
            logs = logs.slice(0, APP_CONFIG.appSettings.maxLogs);
        }
        
        localStorage.setItem('gestao_equipamentos_logs', JSON.stringify(logs));
        
    } catch (e) {
        console.error('Erro ao salvar log:', e);
    }
}

// Função para obter logs de atividades
function getLogsAtividades(limite = 50) {
    try {
        const logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs') || '[]');
        return logs.slice(0, limite);
    } catch (e) {
        console.error('Erro ao obter logs:', e);
        return [];
    }
}

// Função para exportar configurações
function exportarConfiguracoes() {
    // Verificar permissão
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'configurar_sistema')) {
        alert('Você não tem permissão para exportar configurações do sistema.');
        return;
    }
    
    const configExport = {
        appConfig: APP_CONFIG,
        permissoes: PERMISSOES.gerarRelatorioPermissoes(),
        jsonBinConfig: {
            BIN_ID: JSONBIN_CONFIG.BIN_ID,
            BASE_URL: JSONBIN_CONFIG.BASE_URL,
            syncConfig: JSONBIN_CONFIG.syncConfig
        },
        usuarioAtual: getUsuarioInfo(),
        exportDate: new Date().toISOString(),
        version: APP_CONFIG.versao,
        exportadoPor: usuario,
        sistema: {
            userAgent: navigator.userAgent,
            online: navigator.onLine,
            platform: navigator.platform,
            language: navigator.language
        }
    };
    
    const dataStr = JSON.stringify(configExport, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', `config_gestao_equipamentos_${new Date().toISOString().split('T')[0]}.json`);
    linkElement.click();
    
    registrarAtividade('EXPORT_CONFIG', 'Configurações exportadas');
}

// Função para gerar relatório de configuração
function gerarRelatorioConfiguracao() {
    const usuario = getUsuarioLogado();
    const nivel = getNivelUsuario();
    const usuarioInfo = getUsuarioInfo();
    
    const relatorio = `
SISTEMA DE GESTÃO DE EQUIPAMENTOS - USINA INDUSTRIAL
====================================================

VERSÃO: ${APP_CONFIG.versao}
DATA DE GERAÇÃO: ${new Date().toLocaleDateString('pt-BR')}
HORA: ${new Date().toLocaleTimeString('pt-BR')}
EMPRESA: ${APP_CONFIG.empresa}

INFORMAÇÕES DO USUÁRIO
----------------------
• Usuário: ${usuarioInfo?.nome || 'Não autenticado'}
• Nome de usuário: ${usuario || 'N/A'}
• Nível de Acesso: ${usuarioInfo?.nivelNome || 'N/A'}
• Departamento: ${usuarioInfo?.departamento || 'N/A'}
• E-mail: ${usuarioInfo?.email || 'N/A'}
• Criado por: ${usuarioInfo?.criadoPor || 'N/A'}
• Data criação: ${APP_UTILS.formatarData(usuarioInfo?.dataCriacao) || 'N/A'}

CONFIGURAÇÕES DO SISTEMA
-------------------------
• Total de Setores Configurados: ${Object.keys(APP_CONFIG.setores).length}
• Status de Equipamentos: ${Object.keys(APP_CONFIG.statusEquipamento).length}
• Status de Pendências: ${Object.keys(APP_CONFIG.statusPendencia).length}
• Prioridades de Pendência: ${Object.keys(APP_CONFIG.prioridades).length}
• Responsáveis: ${Object.keys(APP_CONFIG.responsaveis).length}

SETORES CONFIGURADOS
--------------------
${Object.entries(APP_CONFIG.setores).map(([key, value]) => 
    `• ${value.nome} (${key})`
).join('\n')}

NÍVEIS DE ACESSO CONFIGURADOS
-----------------------------
${Object.entries(PERMISSOES.niveis).map(([key, nivel]) => 
    `• ${nivel.nome} (${key}): Nível ${nivel.nivel}, ${nivel.permissoes.length} permissões, ${nivel.restricoes.length} restrições`
).join('\n')}

CONFIGURAÇÃO DE ARMAZENAMENTO
-----------------------------
• Servidor: JSONBin.io
• Bin ID: ${JSONBIN_CONFIG.BIN_ID}
• URL Base: ${JSONBIN_CONFIG.BASE_URL}
• Status: ${navigator.onLine ? 'Online' : 'Offline'}

CONFIGURAÇÕES DE APLICAÇÃO
--------------------------
• Expiração de Sessão: ${APP_CONFIG.appSettings.sessaoExpiracaoHoras} horas
• Atualização Automática: ${APP_CONFIG.appSettings.atualizacaoAutomaticaMinutos} minutos
• Sincronização Automática: ${APP_CONFIG.appSettings.sincronizacaoAutomatica ? 'Ativa' : 'Inativa'}
• Notificações: ${APP_CONFIG.appSettings.notificacoesAtivas ? 'Ativas' : 'Inativas'}
• Logs de Atividade: ${APP_CONFIG.appSettings.manterLogs ? 'Ativos' : 'Inativos'}
• Criação de Usuários: ${APP_CONFIG.appSettings.permitirCriarUsuarios ? 'Permitida' : 'Restrita'}
• Tema Padrão: ${APP_CONFIG.appSettings.temaPadrao}

ESTATÍSTICAS DE USO
-------------------
• Último Acesso: ${localStorage.getItem('gestao_equipamentos_ultimo_acesso') ? 
    APP_UTILS.formatarDataHora(localStorage.getItem('gestao_equipamentos_ultimo_acesso')) : 'N/A'}
• Total de Logs de Atividade: ${getLogsAtividades().length}
• Total de Logs de Auditoria: ${getLogsAuditoria().length}
• Filtros Salvos: ${localStorage.getItem('gestao_equipamentos_filtros') ? 'Sim' : 'Não'}
• Tema Preferido: ${localStorage.getItem('gestao_equipamentos_tema') || 'claro'}
• Usuários no Cache: ${localStorage.getItem('gestao_equipamentos_usuarios') ? 
    Object.keys(JSON.parse(localStorage.getItem('gestao_equipamentos_usuarios'))).length : 0}

INFORMAÇÕES DO NAVEGADOR
------------------------
• User Agent: ${navigator.userAgent}
• Plataforma: ${navigator.platform}
• Idioma: ${navigator.language}
• Online: ${navigator.onLine ? 'Sim' : 'Não'}
• Cookies Habilitados: ${navigator.cookieEnabled ? 'Sim' : 'Não'}

`;
    
    return relatorio;
}

// Função para mostrar informações do sistema
function mostrarInfoSistema() {
    // Verificar permissão
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'configurar_sistema')) {
        alert('Você não tem permissão para visualizar informações do sistema.');
        return;
    }
    
    const info = gerarRelatorioConfiguracao();
    
    // Criar modal para mostrar informações
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3><i class="fas fa-info-circle"></i> Informações do Sistema</h3>
                <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <pre style="white-space: pre-wrap; font-family: monospace; font-size: 12px; max-height: 500px; overflow-y: auto; background: #f8f9fa; padding: 15px; border-radius: 5px;">${info}</pre>
                <div class="form-actions">
                    <button onclick="copiarInformacoesSistema()" class="btn-secondary">
                        <i class="fas fa-copy"></i> Copiar Informações
                    </button>
                    <button onclick="exportarConfiguracoes()" class="btn-secondary">
                        <i class="fas fa-download"></i> Exportar Configurações
                    </button>
                    <button onclick="this.closest('.modal').remove()" class="btn-primary">
                        <i class="fas fa-times"></i> Fechar
                    </button>
                </div>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Fechar ao clicar fora
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            this.remove();
        }
    });
    
    registrarAtividade('VIEW_SYSTEM_INFO', 'Visualizou informações do sistema');
}

// Função para copiar informações do sistema
function copiarInformacoesSistema() {
    const info = gerarRelatorioConfiguracao();
    
    navigator.clipboard.writeText(info).then(() => {
        alert('Informações copiadas para a área de transferência!');
        registrarAtividade('COPY_SYSTEM_INFO', 'Copiou informações do sistema');
    }).catch(err => {
        console.error('Erro ao copiar:', err);
        
        // Fallback para área de transferência antiga
        const textArea = document.createElement('textarea');
        textArea.value = info;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        alert('Informações copiadas para a área de transferência!');
    });
}

// Inicializar configurações padrão
function inicializarConfiguracoes() {
    console.log('Inicializando configurações do sistema...');
    
    // Configuração de filtros
    if (!localStorage.getItem('gestao_equipamentos_filtros')) {
        localStorage.setItem('gestao_equipamentos_filtros', JSON.stringify({
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: '',
            viewMode: 'grid'
        }));
    }
    
    // Configuração de tema
    if (!localStorage.getItem('gestao_equipamentos_tema')) {
        localStorage.setItem('gestao_equipamentos_tema', APP_CONFIG.appSettings.temaPadrao);
    }
    
    // Inicializar logs se não existirem
    if (!localStorage.getItem('gestao_equipamentos_logs')) {
        localStorage.setItem('gestao_equipamentos_logs', JSON.stringify([]));
    }
    
    // Inicializar logs de auditoria se não existirem
    if (!localStorage.getItem('gestao_equipamentos_logs_auditoria')) {
        localStorage.setItem('gestao_equipamentos_logs_auditoria', JSON.stringify([]));
    }
    
    // Inicializar usuários se não existirem
    if (!localStorage.getItem('gestao_equipamentos_usuarios')) {
        localStorage.setItem('gestao_equipamentos_usuarios', JSON.stringify(USUARIOS_AUTORIZADOS));
    }
    
    // Aplicar tema
    const tema = localStorage.getItem('gestao_equipamentos_tema');
    document.documentElement.setAttribute('data-tema', tema);
    
    console.log('Configurações inicializadas com sucesso');
}

// Função para alternar tema
function alternarTema() {
    const temaAtual = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
    
    localStorage.setItem('gestao_equipamentos_tema', novoTema);
    document.documentElement.setAttribute('data-tema', novoTema);
    
    // Registrar log
    registrarLogAuditoria('ALTERAR_TEMA', `Tema alterado para ${novoTema}`);
    
    return novoTema;
}

// Função para verificar permissão do usuário atual
function temPermissao(permissao) {
    const usuario = getUsuarioLogado();
    return PERMISSOES.verificarPermissao(usuario, permissao);
}

// Função para verificar se pode executar ação
function podeExecutar(acao, recurso, donoRecurso = null) {
    const usuario = getUsuarioLogado();
    return PERMISSOES.podeExecutarAcao(usuario, acao, recurso, donoRecurso);
}

// Função para obter usuários disponíveis (apenas admin)
function getUsuariosDisponiveis() {
    const usuario = getUsuarioLogado();
    if (!PERMISSOES.verificarPermissao(usuario, 'gerenciar_usuarios')) {
        return [];
    }
    
    try {
        const usuariosSalvos = localStorage.getItem('gestao_equipamentos_usuarios');
        if (usuariosSalvos) {
            const usuarios = JSON.parse(usuariosSalvos);
            return Object.entries(usuarios).map(([username, info]) => ({
                username,
                nome: info.nome,
                email: info.email,
                departamento: info.departamento,
                nivel: info.nivel,
                nivelNome: PERMISSOES.getNomeNivel(info.nivel),
                dataCriacao: info.dataCriacao,
                criadoPor: info.criadoPor,
                ativo: info.ativo !== false,
                ultimoAcesso: info.ultimoAcesso,
                dataAtualizacao: info.dataAtualizacao,
                atualizadoPor: info.atualizadoPor
            }));
        }
    } catch (e) {
        console.error('Erro ao carregar usuários:', e);
    }
    
    // Fallback para usuários padrão
    return Object.entries(USUARIOS_AUTORIZADOS).map(([username, info]) => ({
        username,
        nome: info.nome,
        email: info.email,
        departamento: info.departamento,
        nivel: info.nivel,
        nivelNome: PERMISSOES.getNomeNivel(info.nivel)
    }));
}

// Função para obter estatísticas do sistema
function getEstatisticasSistema() {
    try {
        // Tentar carregar dados do JSONBin via localStorage
        const dadosSalvos = localStorage.getItem('gestao_equipamentos_dados');
        let totalEquipamentos = 0;
        let totalPendencias = 0;
        let totalUsuarios = 0;
        
        if (dadosSalvos) {
            const dados = JSON.parse(dadosSalvos);
            totalEquipamentos = dados.equipamentos?.length || 0;
            totalUsuarios = Object.keys(dados.usuarios || {}).length || 0;
            
            // Calcular total de pendências
            if (dados.equipamentos) {
                dados.equipamentos.forEach(equipamento => {
                    totalPendencias += equipamento.pendencias?.length || 0;
                });
            }
        }
        
        // Estatísticas de logs
        const logsAtividades = getLogsAtividades(1000).length;
        const logsAuditoria = getLogsAuditoria().length;
        
        // Informações de armazenamento
        const tamanhoLocalStorage = JSON.stringify(localStorage).length;
        const tamanhoFormatado = APP_UTILS.formatarBytes(tamanhoLocalStorage);
        
        // Tempo de atividade
        const primeiroLog = getLogsAtividades(1)[0];
        const diasAtividade = primeiroLog ? 
            APP_UTILS.diferencaDias(primeiroLog.timestamp) || 0 : 0;
        
        return {
            equipamentos: totalEquipamentos,
            pendencias: totalPendencias,
            usuarios: totalUsuarios,
            logsAtividades: logsAtividades,
            logsAuditoria: logsAuditoria,
            armazenamento: tamanhoFormatado,
            diasAtividade: diasAtividade,
            online: navigator.onLine,
            versao: APP_CONFIG.versao,
            dataGeracao: new Date().toISOString()
        };
        
    } catch (error) {
        console.error('Erro ao obter estatísticas:', error);
        return {
            equipamentos: 0,
            pendencias: 0,
            usuarios: 0,
            logsAtividades: 0,
            logsAuditoria: 0,
            armazenamento: '0 Bytes',
            diasAtividade: 0,
            online: navigator.onLine,
            versao: APP_CONFIG.versao,
            dataGeracao: new Date().toISOString(),
            erro: error.message
        };
    }
}

// ===========================================
// EXPORTAÇÃO PARA USO GLOBAL
// ===========================================

if (typeof window !== 'undefined') {
    // Configurações principais
    window.APP_CONFIG = APP_CONFIG;
    window.JSONBIN_CONFIG = JSONBIN_CONFIG;
    window.INITIAL_DATA = INITIAL_DATA;
    window.PERMISSOES = PERMISSOES;
    window.APP_UTILS = APP_UTILS;
    window.USUARIOS_AUTORIZADOS = USUARIOS_AUTORIZADOS;
    
    // Funções de sistema
    window.logout = logout;
    window.verificarSessaoAtiva = verificarSessaoAtiva;
    window.getUsuarioLogado = getUsuarioLogado;
    window.getNivelUsuario = getNivelUsuario;
    window.getUsuarioInfo = getUsuarioInfo;
    window.registrarAtividade = registrarAtividade;
    window.getLogsAtividades = getLogsAtividades;
    window.exportarConfiguracoes = exportarConfiguracoes;
    window.gerarRelatorioConfiguracao = gerarRelatorioConfiguracao;
    window.mostrarInfoSistema = mostrarInfoSistema;
    window.copiarInformacoesSistema = copiarInformacoesSistema;
    window.inicializarConfiguracoes = inicializarConfiguracoes;
    window.alternarTema = alternarTema;
    window.temPermissao = temPermissao;
    window.podeExecutar = podeExecutar;
    window.getUsuariosDisponiveis = getUsuariosDisponiveis;
    window.getEstatisticasSistema = getEstatisticasSistema;
    
    // Sistema de logs de auditoria
    window.registrarLogAuditoria = registrarLogAuditoria;
    window.getLogsAuditoria = getLogsAuditoria;
    window.exportarLogsAuditoria = exportarLogsAuditoria;
    window.visualizarLogsAuditoria = visualizarLogsAuditoria;
    
    // Funções utilitárias adicionais
    window.gerarIdUnico = gerarIdUnico;
}

// Exportar para módulos (se usando Node.js/CommonJS)
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        JSONBIN_CONFIG,
        INITIAL_DATA,
        APP_CONFIG,
        PERMISSOES,
        APP_UTILS,
        USUARIOS_AUTORIZADOS,
        // Funções de sistema
        logout,
        verificarSessaoAtiva,
        getUsuarioLogado,
        getNivelUsuario,
        getUsuarioInfo,
        registrarAtividade,
        getLogsAtividades,
        exportarConfiguracoes,
        gerarRelatorioConfiguracao,
        mostrarInfoSistema,
        copiarInformacoesSistema,
        inicializarConfiguracoes,
        alternarTema,
        temPermissao,
        podeExecutar,
        getUsuariosDisponiveis,
        getEstatisticasSistema,
        // Sistema de logs de auditoria
        registrarLogAuditoria,
        getLogsAuditoria,
        exportarLogsAuditoria,
        visualizarLogsAuditoria,
        // Funções utilitárias
        gerarIdUnico
    };
}

// Inicializar configurações quando o script carregar
if (typeof window !== 'undefined' && document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', inicializarConfiguracoes);
} else {
    inicializarConfiguracoes();
}

// Registrar inicialização do sistema
setTimeout(() => {
    if (typeof window !== 'undefined') {
        registrarAtividade('SISTEMA_INICIADO', 'Sistema de gestão de equipamentos carregado');
        console.log(`
        ===========================================
        SISTEMA DE GESTÃO DE EQUIPAMENTOS
        Versão: ${APP_CONFIG.versao}
        Desenvolvido por: ${APP_CONFIG.desenvolvedor}
        Ano: ${APP_CONFIG.ano}
        ===========================================
        `);
    }
}, 1000);
// No final do config.js, adicione:
async function testarConexaoJSONBin() {
    try {
        console.log('Testando conexão com JSONBin...');
        const response = await fetch(`${JSONBIN_CONFIG.BASE_URL}/${JSONBIN_CONFIG.BIN_ID}/latest`, {
            headers: JSONBIN_CONFIG.headers
        });
        console.log('Status da resposta:', response.status);
        if (response.ok) {
            console.log('JSONBin acessível!');
        } else {
            console.error('JSONBin retornou erro:', response.status);
        }
    } catch (error) {
        console.error('Erro ao conectar com JSONBin:', error);
    }
}

// Testar quando a página carregar
if (typeof window !== 'undefined') {
    setTimeout(testarConexaoJSONBin, 1000);
}
