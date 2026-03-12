// ===========================================
// CONFIGURAÇÃO DO SISTEMA DE GESTÃO DE EQUIPAMENTOS - USINA
// Versão 2.3.0 - Com Controle de Linha e Histórico de Acionamentos
// ===========================================

// Configuração do JSONBin.io para armazenamento em nuvem
const JSONBIN_CONFIG = {
    BIN_ID: '696fa19fae596e708fe90a63',
    BIN_USUARIOS: {
        ID: '6978e17b43b1c97be94efa1b',
        BASE_URL: 'https://api.jsonbin.io/v3/b'
    },
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$gHdA8KAK/9HnnagDiMTlHeBUzNo9cWC0lR8EL0IaUpJg5ChpGiz/i',
        'X-Bin-Versioning': 'false',
        'X-Bin-Name': 'GestaoEquipamentosUsina'
    }
};

// Estrutura inicial dos dados com exemplos e controle de linha
const INITIAL_DATA = {
    equipamentos: [
        {
            id: 1,
            nome: "Turbina Principal",
            descricao: "Turbina de alta pressão para geração de energia - Setor Moagem",
            setor: "moagem-moagem",
            status: "apto",
            // Controle de linha de produção
            emLinha: {
                ativo: false,
                ultimoAcionamento: null,
                ultimoDesligamento: "2024-01-19T18:30:00.000Z",
                tempoTotalOperacao: 1250, // em minutos
                operadorAtual: null
            },
            // Histórico de acionamentos
            historicoAcionamentos: [
                {
                    tipo: 'LIGADO',
                    timestamp: "2024-01-19T06:15:00.000Z",
                    operador: "operador",
                    turno: "TURNO_A",
                    observacao: "Início da operação diária"
                },
                {
                    tipo: 'DESLIGADO',
                    timestamp: "2024-01-19T18:30:00.000Z",
                    operador: "supervisor",
                    tempoOperacao: 735,
                    turno: "TURNO_B",
                    observacao: "Fim do turno"
                },
                {
                    tipo: 'MARCO_OPERACAO',
                    timestamp: "2024-01-19T12:00:00.000Z",
                    operador: "sistema",
                    tempoTotal: 345,
                    observacao: "6 horas de operação contínua"
                }
            ],
            ultimaInspecao: "2024-01-15",
            dataCriacao: "2024-01-10",
            criadoPor: "administrador",
            pendencias: [
                {
                    id: 1,
                    titulo: "Vibração acima do normal",
                    descricao: "Detectada vibração 15% acima do limite durante operação em carga máxima",
                    responsavel: "Elétrica",
                    prioridade: "alta",
                    data: "2024-01-10",
                    status: "em-andamento",
                    criadoPor: "supervisor",
                    criadoEm: "2024-01-10T10:30:00",
                    atualizadoPor: "supervisor",
                    ultimaAtualizacao: "2024-01-10T10:30:00",
                    historico: [
                        {
                            timestamp: "2024-01-10T10:30:00",
                            usuario: "supervisor",
                            acao: "CRIAR_PENDENCIA",
                            alteracoes: {},
                            comentario: "Pendência criada - Vibração detectada durante inspeção de rotina"
                        }
                    ],
                    historicoStatus: [
                        {
                            timestamp: "2024-01-10T10:30:00",
                            usuario: "supervisor",
                            acao: "CRIAR_PENDENCIA",
                            de: null,
                            para: "aberta",
                            comentario: "Status inicial: Aberta"
                        },
                        {
                            timestamp: "2024-01-12T14:20:00",
                            usuario: "manutencao",
                            acao: "ALTERAR_STATUS",
                            de: "aberta",
                            para: "em-andamento",
                            comentario: "Em análise pela equipe de elétrica"
                        }
                    ]
                }
            ]
        },
        {
            id: 2,
            nome: "Transformador T-42",
            descricao: "Transformador de potência 500kV - Distribuição de Energia",
            setor: "utilidades-distribuicao-agua",
            status: "nao-apto",
            emLinha: {
                ativo: false,
                ultimoAcionamento: null,
                ultimoDesligamento: "2024-01-18T22:15:00.000Z",
                tempoTotalOperacao: 8450,
                operadorAtual: null
            },
            historicoAcionamentos: [
                {
                    tipo: 'LIGADO',
                    timestamp: "2024-01-18T06:00:00.000Z",
                    operador: "operador",
                    turno: "TURNO_A",
                    observacao: "Operação normal"
                },
                {
                    tipo: 'DESLIGADO',
                    timestamp: "2024-01-18T22:15:00.000Z",
                    operador: "supervisor",
                    tempoOperacao: 975,
                    turno: "TURNO_C",
                    observacao: "Desligado para manutenção - vazamento detectado"
                }
            ],
            ultimaInspecao: "2023-12-22",
            dataCriacao: "2023-11-05",
            criadoPor: "administrador",
            pendencias: [
                {
                    id: 2,
                    titulo: "Vazamento de óleo isolante",
                    descricao: "Identificado vazamento no tanque principal - Requer atenção imediata",
                    responsavel: "Instrumentação",
                    prioridade: "critica",
                    data: "2024-01-05",
                    status: "aberta",
                    criadoPor: "operador",
                    criadoEm: "2024-01-05T08:15:00",
                    atualizadoPor: "operador",
                    ultimaAtualizacao: "2024-01-05T08:15:00",
                    historico: [
                        {
                            timestamp: "2024-01-05T08:15:00",
                            usuario: "operador",
                            acao: "CRIAR_PENDENCIA",
                            alteracoes: {},
                            comentario: "Vazamento observado durante ronda matinal"
                        },
                        {
                            timestamp: "2024-01-05T14:30:00",
                            usuario: "supervisor",
                            acao: "ATUALIZAR_PENDENCIA",
                            alteracoes: {
                                responsavel: {
                                    anterior: "Elétrica",
                                    novo: "Instrumentação"
                                }
                            },
                            comentario: "Reatribuída para equipe de instrumentação especializada"
                        }
                    ],
                    historicoStatus: [
                        {
                            timestamp: "2024-01-05T08:15:00",
                            usuario: "operador",
                            acao: "CRIAR_PENDENCIA",
                            de: null,
                            para: "aberta",
                            comentario: "Status inicial: Aberta - Prioridade Crítica"
                        }
                    ]
                }
            ]
        },
        {
            id: 3,
            nome: "Gerador G-12",
            descricao: "Gerador síncrono de 200MW - Flotação Pirita",
            setor: "flotacao-flot-pirita",
            status: "apto",
            emLinha: {
                ativo: true,
                ultimoAcionamento: "2024-01-20T05:45:00.000Z",
                ultimoDesligamento: "2024-01-19T23:30:00.000Z",
                tempoTotalOperacao: 45,
                operadorAtual: "operador"
            },
            historicoAcionamentos: [
                {
                    tipo: 'LIGADO',
                    timestamp: "2024-01-20T05:45:00.000Z",
                    operador: "operador",
                    turno: "TURNO_A",
                    observacao: "Início da operação"
                }
            ],
            ultimaInspecao: "2024-01-18",
            dataCriacao: "2024-01-20",
            criadoPor: "engenharia",
            pendencias: []
        }
    ],
    
    // Contadores para IDs únicos
    nextEquipamentoId: 4,
    nextPendenciaId: 3,
    
    // Logs de auditoria do sistema
    logs: [
        {
            id: 1,
            timestamp: "2024-01-01T00:00:00",
            usuario: "sistema",
            nivel: "sistema",
            acao: "INICIALIZAR_SISTEMA",
            detalhes: "Sistema inicializado com dados de exemplo",
            ip: "local",
            userAgent: "Sistema de Gestão v2.3.0"
        }
    ],
    nextLogId: 2,
    
    // Configuração de versão
    versao: "2.3.0",
    dataAtualizacao: "2024-01-20",
    criadoPor: "Alexandre Oliveira"
};

// ===========================================
// USUÁRIOS DO SISTEMA
// ===========================================

const USUARIOS_AUTORIZADOS = [
    {
        id: 1,
        username: 'administrador',
        senha: 'admin789',
        nivel: 'administrador',
        nome: 'Administrador Sistema',
        email: 'admin@empresa.com',
        departamento: 'TI',
        ativo: true,
        isSystemAdmin: true,
        dataCriacao: '2024-01-01',
        criadoPor: 'sistema',
        ultimoAcesso: null
    },
    {
        id: 2,
        username: 'supervisor',
        senha: 'supervisor456',
        nivel: 'supervisor',
        nome: 'Maria Santos',
        email: 'maria.santos@empresa.com',
        departamento: 'Supervisão',
        ativo: true,
        isSystemAdmin: false,
        dataCriacao: '2024-01-01',
        criadoPor: 'sistema',
        ultimoAcesso: null
    },
    {
        id: 3,
        username: 'operador',
        senha: 'operador123',
        nivel: 'operador',
        nome: 'João Silva',
        email: 'joao.silva@empresa.com',
        departamento: 'Operações',
        ativo: true,
        isSystemAdmin: false,
        dataCriacao: '2024-01-01',
        criadoPor: 'sistema',
        ultimoAcesso: null
    },
    {
        id: 4,
        username: 'manutencao',
        senha: 'manutencao2024',
        nivel: 'manutencao',
        nome: 'Pedro Costa',
        email: 'pedro.costa@empresa.com',
        departamento: 'Manutenção',
        ativo: true,
        isSystemAdmin: false,
        dataCriacao: '2024-01-01',
        criadoPor: 'sistema',
        ultimoAcesso: null
    },
    {
        id: 5,
        username: 'engenharia',
        senha: 'engenharia789',
        nivel: 'engenharia',
        nome: 'Ana Rodrigues',
        email: 'ana.rodrigues@empresa.com',
        departamento: 'Engenharia',
        ativo: true,
        isSystemAdmin: false,
        dataCriacao: '2024-01-01',
        criadoPor: 'sistema',
        ultimoAcesso: null
    }
];

const NEXT_USER_ID = 6;

// ===========================================
// SISTEMA DE PERMISSÕES HIERÁRQUICO
// ===========================================

const PERMISSOES = {
    niveis: {
        "operador": {
            nome: "Operador de Produção",
            nivel: 1,
            cor: "#3498db",
            icone: "fa-user",
            descricao: "Visualiza equipamentos, registra ocorrências e opera equipamentos",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias_proprias",
                "adicionar_comentarios",
                "operar_equipamentos"
            ],
            restricoes: [
                "nao_pode_criar_equipamentos",
                "nao_pode_excluir_pendencias_outros",
                "nao_pode_exportar_dados",
                "nao_pode_editar_equipamentos"
            ]
        },
        
        "supervisor": {
            nome: "Supervisor de Turno",
            nivel: 2,
            cor: "#f39c12",
            icone: "fa-user-tie",
            descricao: "Gerencia pendências, acompanha indicadores e opera equipamentos",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "exportar_dados",
                "gerar_relatorios",
                "adicionar_comentarios",
                "alterar_status_pendencias",
                "operar_equipamentos"
            ],
            restricoes: [
                "nao_pode_criar_equipamentos",
                "nao_pode_editar_equipamentos",
                "nao_pode_configurar_sistema",
                "nao_pode_gerenciar_usuarios"
            ]
        },
        
        "manutencao": {
            nome: "Técnico de Manutenção",
            nivel: 2,
            cor: "#9b59b6",
            icone: "fa-tools",
            descricao: "Especialista técnico, resolve pendências e opera equipamentos",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "exportar_dados",
                "marcar_pendencias_resolvidas",
                "adicionar_comentarios",
                "ver_historico_completo",
                "operar_equipamentos"
            ],
            restricoes: [
                "nao_pode_criar_equipamentos",
                "nao_pode_editar_equipamentos",
                "nao_pode_configurar_sistema",
                "nao_pode_gerenciar_usuarios"
            ]
        },
        
        "engenharia": {
            nome: "Engenheiro de Processos",
            nivel: 3,
            cor: "#2ecc71",
            icone: "fa-user-cog",
            descricao: "Projetos, melhorias e configuração técnica",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "criar_equipamentos",
                "editar_equipamentos",
                "exportar_dados",
                "gerar_relatorios",
                "configurar_setores",
                "adicionar_comentarios",
                "ver_historico_completo",
                "gerenciar_tipos_equipamentos",
                "operar_equipamentos"
            ],
            restricoes: [
                "nao_pode_gerenciar_usuarios",
                "nao_pode_configurar_sistema_completo",
                "nao_pode_visualizar_logs_sistema"
            ]
        },
        
        "administrador": {
            nome: "Administrador do Sistema",
            nivel: 4,
            cor: "#e74c3c",
            icone: "fa-user-shield",
            descricao: "Acesso total e gestão do sistema",
            permissoes: [
                "visualizar_equipamentos",
                "ver_detalhes",
                "criar_pendencias",
                "editar_pendencias",
                "excluir_pendencias",
                "criar_equipamentos",
                "editar_equipamentos",
                "exportar_dados",
                "gerar_relatorios",
                "configurar_sistema",
                "gerenciar_usuarios",
                "visualizar_logs",
                "backup_dados",
                "restaurar_dados",
                "adicionar_comentarios",
                "ver_historico_completo",
                "gerenciar_todos_setores",
                "configurar_permissoes",
                "auditar_sistema",
                "operar_equipamentos"
            ],
            restricoes: []
        }
    },
    
    verificarPermissao: function(usuario, permissao) {
        if (!usuario || !this.niveis[usuario]) {
            return false;
        }
        
        const nivelUsuario = this.niveis[usuario];
        
        const permissoesBasicas = [
            'visualizar_equipamentos', 
            'ver_detalhes',
            'adicionar_comentarios'
        ];
        
        if (permissoesBasicas.includes(permissao)) {
            return true;
        }
        
        return nivelUsuario.permissoes.includes(permissao);
    },
    
    podeExecutarAcao: function(usuario, acao, recurso, donoRecurso = null) {
        if (!usuario) return false;
        
        const nivel = this.niveis[usuario];
        if (!nivel) return false;
        
        switch(acao) {
            case 'criar':
                if (recurso === 'equipamento') return nivel.permissoes.includes('criar_equipamentos');
                if (recurso === 'pendencia') return nivel.permissoes.includes('criar_pendencias');
                break;
                
            case 'editar':
                if (recurso === 'equipamento') return nivel.permissoes.includes('editar_equipamentos');
                if (recurso === 'pendencia') {
                    if (donoRecurso === usuario) return true;
                    return nivel.permissoes.includes('editar_pendencias');
                }
                break;
                
            case 'excluir':
                if (recurso === 'pendencia') {
                    if (donoRecurso === usuario) return true;
                    return nivel.permissoes.includes('excluir_pendencias');
                }
                break;
                
            case 'operar':
                return nivel.permissoes.includes('operar_equipamentos');
                
            case 'exportar':
                return nivel.permissoes.includes('exportar_dados');
                
            case 'configurar':
                return nivel.permissoes.includes('configurar_sistema');
                
            case 'comentar':
                return nivel.permissoes.includes('adicionar_comentarios');
                
            case 'ver_historico':
                return nivel.permissoes.includes('ver_historico_completo');
        }
        
        return false;
    },
    
    getNomeNivel: function(nivelKey) {
        return this.niveis[nivelKey]?.nome || 'Usuário';
    },
    
    getNivelNumerico: function(nivelKey) {
        return this.niveis[nivelKey]?.nivel || 0;
    },
    
    getCorNivel: function(nivelKey) {
        return this.niveis[nivelKey]?.cor || '#95a5a6';
    },
    
    getIconeNivel: function(nivelKey) {
        return this.niveis[nivelKey]?.icone || 'fa-user';
    },
    
    getDescricaoNivel: function(nivelKey) {
        return this.niveis[nivelKey]?.descricao || 'Usuário do sistema';
    },
    
    getTodosNiveis: function() {
        return Object.keys(this.niveis);
    },
    
    getInfoNivel: function(nivelKey) {
        return this.niveis[nivelKey] || null;
    },
    
    gerarRelatorioPermissoes: function() {
        let relatorio = "=== RELATÓRIO DE PERMISSÕES POR NÍVEL ===\n\n";
        
        Object.entries(this.niveis).forEach(([key, nivel]) => {
            relatorio += `NÍVEL: ${nivel.nome} (${key})\n`;
            relatorio += `Número: ${nivel.nivel} | Cor: ${nivel.cor}\n`;
            relatorio += `Descrição: ${nivel.descricao}\n\n`;
            relatorio += `PERMISSÕES (${nivel.permissoes.length}):\n`;
            nivel.permissoes.forEach(permissao => {
                relatorio += `  • ${permissao}\n`;
            });
            
            if (nivel.restricoes.length > 0) {
                relatorio += `\nRESTRIÇÕES (${nivel.restricoes.length}):\n`;
                nivel.restricoes.forEach(restricao => {
                    relatorio += `  • ${restricao}\n`;
                });
            }
            
            relatorio += "\n" + "=".repeat(50) + "\n\n";
        });
        
        return relatorio;
    },
    
    temNivelMinimo: function(usuario, nivelMinimo) {
        const nivelUsuario = this.getNivelNumerico(usuario);
        const nivelRequerido = this.getNivelNumerico(nivelMinimo);
        return nivelUsuario >= nivelRequerido;
    }
};

// ===========================================
// CONFIGURAÇÕES DA APLICAÇÃO
// ===========================================

const APP_CONFIG = {
    nome: "Gestão de Equipamentos - Usina de Beneficiamento",
    versao: "2.3.0",
    empresa: "Empresa de Mineração ERO",
    ambiente: "Produção",
    ano: 2024,
    
    criacao: {
        idealizacao: "Aline Suene",
        programacao: "Alexandre Oliveira",
        design: "Equipe de Desenvolvimento",
        dataCriacao: "2024-01-01"
    },
    
    // Configuração de setores
    setores: {
        "britagem-britagem": {
            nome: "BRITAGEM / BRITAGEM",
            codigo: "BRT",
            responsavelPadrao: "Mecânica",
            cor: "#e67e22"
        },
        "moagem-moagem": {
            nome: "MOAGEM / MOAGEM",
            codigo: "MOG",
            responsavelPadrao: "Mecânica",
            cor: "#d35400"
        },
        "flotacao-flot-rougher": {
            nome: "FLOTAÇÃO / FLOT ROUGHER",
            codigo: "FLR",
            responsavelPadrao: "Instrumentação",
            cor: "#2980b9"
        },
        "flotacao-flot-cleaner-scavenger": {
            nome: "FLOTAÇÃO / FLOT CLEANER-SCAVENGER",
            codigo: "FLC",
            responsavelPadrao: "Instrumentação",
            cor: "#3498db"
        },
        "flotacao-flot-pirita": {
            nome: "FLOTAÇÃO / FLOT PIRITA",
            codigo: "FLP",
            responsavelPadrao: "Instrumentação",
            cor: "#1abc9c"
        },
        "filtragem-filtragem-concentrado": {
            nome: "FILTRAGEM / FILTRAGEM DE CONCENTRADO",
            codigo: "FIC",
            responsavelPadrao: "Automação",
            cor: "#8e44ad"
        },
        "filtragem-filtragem-rejeito": {
            nome: "FILTRAGEM / FILTRAGEM DE REJEITO",
            codigo: "FIR",
            responsavelPadrao: "Automação",
            cor: "#9b59b6"
        },
        "reagentes-pax": {
            nome: "REAGENTES / PAX",
            codigo: "RGX",
            responsavelPadrao: "Engenharia",
            cor: "#c0392b"
        },
        "reagentes-dtf": {
            nome: "REAGENTES / DTF",
            codigo: "RGD",
            responsavelPadrao: "Engenharia",
            cor: "#e74c3c"
        },
        "reagentes-espumante": {
            nome: "REAGENTES / ESPUMANTE",
            codigo: "RGE",
            responsavelPadrao: "Engenharia",
            cor: "#e67e22"
        },
        "reagentes-leite-de-cal": {
            nome: "REAGENTES / LEITE DE CAL",
            codigo: "RGC",
            responsavelPadrao: "Engenharia",
            cor: "#f39c12"
        },
        "reagentes-acido-sulfurico": {
            nome: "REAGENTES / ÁCIDO SULFÚRICO",
            codigo: "RGA",
            responsavelPadrao: "Engenharia",
            cor: "#d35400"
        },
        "reagentes-floculante": {
            nome: "REAGENTES / FLOCULANTE",
            codigo: "RGF",
            responsavelPadrao: "Engenharia",
            cor: "#16a085"
        },
        "utilidades-distribuicao-agua": {
            nome: "UTILIDADES / DISTRIBUIÇÃO DE ÁGUA",
            codigo: "UTD",
            responsavelPadrao: "Elétrica",
            cor: "#27ae60"
        },
        "torre-resfriamento-torre-resfriamento": {
            nome: "TORRE DE RESFRIAMENTO / TORRE DE RESFRIAMENTO",
            codigo: "TRR",
            responsavelPadrao: "Mecânica",
            cor: "#2c3e50"
        }
    },
    
    // Configuração de status
    statusEquipamento: {
        "apto": {
            nome: "Apto",
            cor: "#27ae60",
            icone: "fa-check-circle",
            descricao: "Equipamento em condições operacionais normais"
        },
        "nao-apto": {
            nome: "Inapto",
            cor: "#e74c3c",
            icone: "fa-times-circle",
            descricao: "Equipamento com pendências críticas em aberto"
        }
    },
    
    statusPendencia: {
        "aberta": {
            nome: "Aberta",
            cor: "#f39c12",
            icone: "fa-clock",
            descricao: "Pendência registrada, aguardando ação",
            ordem: 1
        },
        "em-andamento": {
            nome: "Em Andamento",
            cor: "#3498db",
            icone: "fa-tools",
            descricao: "Pendência sendo tratada",
            ordem: 2
        },
        "resolvida": {
            nome: "Resolvida",
            cor: "#2ecc71",
            icone: "fa-check-circle",
            descricao: "Pendência solucionada",
            ordem: 3
        },
        "cancelada": {
            nome: "Cancelada",
            cor: "#95a5a6",
            icone: "fa-ban",
            descricao: "Pendência cancelada sem resolução",
            ordem: 4
        }
    },
    
    prioridades: {
        "baixa": {
            nome: "Baixa",
            cor: "#27ae60",
            icone: "fa-arrow-down",
            prazoDias: 30,
            descricao: "Baixo impacto operacional"
        },
        "media": {
            nome: "Média",
            cor: "#f39c12",
            icone: "fa-minus",
            prazoDias: 15,
            descricao: "Impacto moderado na operação"
        },
        "alta": {
            nome: "Alta",
            cor: "#e74c3c",
            icone: "fa-arrow-up",
            prazoDias: 7,
            descricao: "Alto impacto operacional"
        },
        "critica": {
            nome: "Crítica",
            cor: "#8b0000",
            icone: "fa-exclamation-triangle",
            prazoDias: 1,
            descricao: "Impacto imediato na segurança ou produção"
        }
    },
    
    // Configuração de responsáveis
    responsaveis: {
        "Elétrica": {
            cor: "#3498db",
            icone: "fa-bolt",
            contato: "ramal-201"
        },
        "Instrumentação": {
            cor: "#9b59b6",
            icone: "fa-tachometer-alt",
            contato: "ramal-202"
        },
        "Mecânica": {
            cor: "#e67e22",
            icone: "fa-cogs",
            contato: "ramal-203"
        },
        "Preventiva_Engenharia": {
            cor: "#2ecc71",
            icone: "fa-user-cog",
            contato: "ramal-204"
        },
        "Automação": {
            cor: "#1abc9c",
            icone: "fa-robot",
            contato: "ramal-205"
        },
        "Externo": {
            cor: "#95a5a6",
            icone: "fa-building",
            contato: "fornecedor"
        },
        "Engenharia": {
            cor: "#c0392b",
            icone: "fa-flask",
            contato: "ramal-206"
        },
        "Operação": {
            cor: "#f1c40f",
            icone: "fa-hard-hat",
            contato: "ramal-207"
        }
    },
    
    // Tipos de ações para logs
    tiposAcao: {
        LOGIN: "LOGIN",
        LOGOUT: "LOGOUT",
        SESSAO_EXPIRADA: "SESSAO_EXPIRADA",
        CRIAR_EQUIPAMENTO: "CRIAR_EQUIPAMENTO",
        EDITAR_EQUIPAMENTO: "EDITAR_EQUIPAMENTO",
        VISUALIZAR_EQUIPAMENTO: "VISUALIZAR_EQUIPAMENTO",
        CRIAR_PENDENCIA: "CRIAR_PENDENCIA",
        EDITAR_PENDENCIA: "EDITAR_PENDENCIA",
        EXCLUIR_PENDENCIA: "EXCLUIR_PENDENCIA",
        ATUALIZAR_PENDENCIA: "ATUALIZAR_PENDENCIA",
        ALTERAR_STATUS_PENDENCIA: "ALTERAR_STATUS_PENDENCIA",
        RESOLVER_PENDENCIA: "RESOLVER_PENDENCIA",
        ADICIONAR_COMENTARIO: "ADICIONAR_COMENTARIO",
        VISUALIZAR_HISTORICO: "VISUALIZAR_HISTORICO",
        EXPORTAR_DADOS: "EXPORTAR_DADOS",
        GERAR_RELATORIO: "GERAR_RELATORIO",
        EXPORTAR_CONFIG: "EXPORTAR_CONFIG",
        ALTERAR_TEMA: "ALTERAR_TEMA",
        CONFIGURAR_SISTEMA: "CONFIGURAR_SISTEMA",
        SINCRONIZAR_DADOS: "SINCRONIZAR_DADOS",
        BACKUP_DADOS: "BACKUP_DADOS",
        CRIAR_USUARIO: "CRIAR_USUARIO",
        EDITAR_USUARIO: "EDITAR_USUARIO",
        EXCLUIR_USUARIO: "EXCLUIR_USUARIO",
        ALTERAR_STATUS_USUARIO: "ALTERAR_STATUS_USUARIO",
        // NOVAS AÇÕES PARA CONTROLE DE LINHA
        EQUIPAMENTO_LIGADO: "EQUIPAMENTO_LIGADO",
        EQUIPAMENTO_DESLIGADO: "EQUIPAMENTO_DESLIGADO",
        GERAR_RELATORIO_OPERACAO: "GERAR_RELATORIO_OPERACAO",
        ALERTA_TEMPO_EXCESSIVO: "ALERTA_TEMPO_EXCESSIVO"
    },
    
    // NOVA CONFIGURAÇÃO PARA CONTROLE DE LINHA
    controleLinha: {
        alertaTempoMaximo: 480, // 8 horas em minutos
        notificarTrocaTurno: true,
        exigirJustificativaDesligamento: true,
        permitirLigacaoAutomatica: false,
        tempoMinimoEntreAcionamentos: 5, // minutos
        cores: {
            emLinha: "#27ae60",
            foraDeLinha: "#95a5a6",
            alertaTempo: "#e67e22"
        }
    },
    
    // Configurações de aplicação
    appSettings: {
        sessaoExpiracaoHoras: 8,
        renovarSessaoAutomaticamente: true,
        itensPorPagina: 20,
        mostrarIndicadorNivel: true,
        animacoesAtivas: true,
        atualizacaoAutomaticaMinutos: 5,
        verificarConexaoSegundos: 30,
        notificacoesAtivas: true,
        notificarPendenciasCriticas: true,
        notificarExpiracaoSessao: true,
        manterLogs: true,
        maxLogs: 1000,
        manterHistoricoCompleto: true,
        diasRetencaoHistorico: 365,
        maxAlteracoesPorPendencia: 100,
        forcarSenhaForte: true,
        tentativasLoginMax: 5,
        tempoBloqueioMinutos: 15,
        formatoExportacaoPadrao: "csv",
        incluirHistoricoExportacao: true
    },
    
    cores: {
        primaria: "#2c3e50",
        secundaria: "#3498db",
        sucesso: "#27ae60",
        erro: "#e74c3c",
        alerta: "#f39c12",
        info: "#3498db",
        fundo: "#ecf0f1",
        texto: "#2c3e50",
        textoSecundario: "#7f8c8d",
        borda: "#bdc3c7"
    },
    
    constantes: {
        DIAS_SEMANA: ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"],
        MESES: ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"],
        HORAS_DIA: 24,
        MINUTOS_HORA: 60,
        DIAS_ANO: 365
    }
};

// ===========================================
// UTILITÁRIOS DA APLICAÇÃO
// ===========================================

const APP_UTILS = {
    formatarData: function(dataString, formato = 'padrao') {
        if (!dataString) return 'Não informada';
        
        try {
            const data = new Date(dataString);
            if (isNaN(data.getTime())) return dataString;
            
            const formatos = {
                'padrao': () => data.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                }),
                'extenso': () => data.toLocaleDateString('pt-BR', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                }),
                'hora': () => data.toLocaleTimeString('pt-BR', {
                    hour: '2-digit',
                    minute: '2-digit'
                }),
                'completo': () => data.toLocaleDateString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit'
                }),
                'banco': () => data.toISOString().split('T')[0]
            };
            
            return formatos[formato] ? formatos[formato]() : formatos['padrao']();
        } catch (e) {
            console.warn('Erro ao formatar data:', dataString, e);
            return dataString;
        }
    },
    
    formatarDataHora: function(dataString) {
        return this.formatarData(dataString, 'completo');
    },
    
    formatarHora: function(dataString) {
        return this.formatarData(dataString, 'hora');
    },
    
    validarEmail: function(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(String(email).toLowerCase());
    },
    
    validarDataNaoFutura: function(dataString) {
        try {
            const data = new Date(dataString);
            const hoje = new Date();
            hoje.setHours(23, 59, 59, 999);
            return data <= hoje;
        } catch (e) {
            return false;
        }
    },
    
    validarForcaSenha: function(senha) {
        const forca = {
            pontos: 0,
            nivel: 'fraca',
            criterios: []
        };
        
        if (senha.length >= 8) {
            forca.pontos++;
            forca.criterios.push('Mínimo 8 caracteres ✓');
        }
        
        if (/[A-Z]/.test(senha) && /[a-z]/.test(senha)) {
            forca.pontos++;
            forca.criterios.push('Letras maiúsculas e minúsculas ✓');
        }
        
        if (/[0-9]/.test(senha)) {
            forca.pontos++;
            forca.criterios.push('Contém números ✓');
        }
        
        if (/[^A-Za-z0-9]/.test(senha)) {
            forca.pontos++;
            forca.criterios.push('Caracteres especiais ✓');
        }
        
        if (senha.length >= 12) {
            forca.pontos++;
            forca.criterios.push('12+ caracteres ✓');
        }
        
        if (forca.pontos <= 2) forca.nivel = 'fraca';
        else if (forca.pontos <= 3) forca.nivel = 'média';
        else if (forca.pontos <= 4) forca.nivel = 'forte';
        else forca.nivel = 'muito forte';
        
        return forca;
    },
    
    gerarCodigoEquipamento: function(setorCodigo = "EQP") {
        const timestamp = Date.now().toString(36).toUpperCase();
        const random = Math.random().toString(36).substring(2, 6).toUpperCase();
        const sequencial = Math.floor(Math.random() * 999).toString().padStart(3, '0');
        return `${setorCodigo}-${timestamp.substring(0, 4)}-${random}-${sequencial}`;
    },
    
    gerarIDUnico: function(prefixo = '') {
        const timestamp = Date.now();
        const random = Math.random().toString(36).substring(2, 15);
        return `${prefixo}${timestamp.toString(36)}${random}`.toUpperCase();
    },
    
    sanitizarTexto: function(texto, permitirHTMLBasico = false) {
        if (typeof texto !== 'string') return texto;
        
        let resultado = texto;
        if (!permitirHTMLBasico) {
            resultado = resultado.replace(/<[^>]*>/g, '');
        } else {
            resultado = resultado.replace(/<(?!\/?(b|i|u|strong|em|br|p|span)(\s[^>]*)?>)[^>]*>/gi, '');
        }
        
        resultado = resultado
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
        
        resultado = resultado.replace(/\s+/g, ' ').trim();
        
        return resultado;
    },
    
    truncarTexto: function(texto, limite = 100, sufixo = '...') {
        if (texto.length <= limite) return texto;
        return texto.substring(0, limite).trim() + sufixo;
    },
    
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
    
    calcularIdade: function(dataNascimento) {
        const hoje = new Date();
        const nascimento = new Date(dataNascimento);
        let idade = hoje.getFullYear() - nascimento.getFullYear();
        const mes = hoje.getMonth() - nascimento.getMonth();
        
        if (mes < 0 || (mes === 0 && hoje.getDate() < nascimento.getDate())) {
            idade--;
        }
        
        return idade;
    },
    
    compararObjetos: function(obj1, obj2, camposIgnorar = []) {
        const alteracoes = {};
        
        for (const key in obj2) {
            if (camposIgnorar.includes(key)) continue;
            
            if (obj1[key] !== obj2[key]) {
                alteracoes[key] = {
                    anterior: obj1[key] !== undefined ? obj1[key] : null,
                    novo: obj2[key] !== undefined ? obj2[key] : null,
                    tipo: typeof obj2[key]
                };
            }
        }
        
        for (const key in obj1) {
            if (camposIgnorar.includes(key)) continue;
            
            if (!(key in obj2)) {
                alteracoes[key] = {
                    anterior: obj1[key],
                    novo: null,
                    tipo: 'removido'
                };
            }
        }
        
        return alteracoes;
    },
    
    clonarObjeto: function(obj) {
        return JSON.parse(JSON.stringify(obj));
    },
    
    criarEntradaHistorico: function(acao, usuario, alteracoes = {}, comentario = '') {
        return {
            timestamp: new Date().toISOString(),
            usuario: usuario,
            acao: acao,
            alteracoes: this.clonarObjeto(alteracoes),
            comentario: this.sanitizarTexto(comentario),
            ip: this.obterIPCliente() || 'local',
            userAgent: navigator.userAgent.substring(0, 100)
        };
    },
    
    obterIPCliente: function() {
        return 'local';
    },
    
    copiarParaAreaTransferencia: function(texto) {
        return navigator.clipboard.writeText(texto)
            .then(() => true)
            .catch(() => false);
    },
    
    bytesParaTamanhoLegivel: function(bytes) {
        const unidades = ['B', 'KB', 'MB', 'GB', 'TB'];
        let tamanho = bytes;
        let unidadeIndex = 0;
        
        while (tamanho >= 1024 && unidadeIndex < unidades.length - 1) {
            tamanho /= 1024;
            unidadeIndex++;
        }
        
        return `${tamanho.toFixed(2)} ${unidades[unidadeIndex]}`;
    },
    
    formatarNumero: function(numero, casasDecimais = 2) {
        return parseFloat(numero).toLocaleString('pt-BR', {
            minimumFractionDigits: casasDecimais,
            maximumFractionDigits: casasDecimais
        });
    },
    
    formatarPorcentagem: function(valor, total) {
        if (total === 0) return '0%';
        const porcentagem = (valor / total) * 100;
        return `${porcentagem.toFixed(1)}%`;
    },
    
    // NOVO: Obter turno atual
    obterTurnoAtual: function() {
        const hora = new Date().getHours();
        if (hora >= 6 && hora < 14) return 'TURNO_A';
        if (hora >= 14 && hora < 22) return 'TURNO_B';
        return 'TURNO_C';
    }
};

// ===========================================
// FUNÇÕES DE SEGURANÇA
// ===========================================

function hashSenha(senha) {
    let hash = 0;
    for (let i = 0; i < senha.length; i++) {
        const char = senha.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
    }
    return 'hash_' + Math.abs(hash).toString(16) + '_' + senha.length;
}

function verificarSenha(senha, hash) {
    return hashSenha(senha) === hash;
}

// ===========================================
// FUNÇÕES DE SISTEMA
// ===========================================

function logout() {
    const usuario = getUsuarioLogado();
    const nivel = getNivelUsuario();
    
    registrarAtividade('LOGOUT', `Usuário ${usuario} (${PERMISSOES.getNomeNivel(nivel)}) saiu do sistema`);
    
    ['gestao_equipamentos_sessao', 'gestao_equipamentos_usuario', 
     'gestao_equipamentos_nivel', 'gestao_equipamentos_ultimo_acesso',
     'gestao_equipamentos_user_id', 'gestao_equipamentos_is_system_admin']
        .forEach(item => localStorage.removeItem(item));
    
    window.location.href = 'login.html?logout=true';
}

function verificarSessaoAtiva() {
    const sessao = localStorage.getItem('gestao_equipamentos_sessao');
    
    if (!sessao) {
        registrarAtividade('SEM_SESSAO', 'Tentativa de acesso sem sessão válida');
        return false;
    }
    
    try {
        const sessaoData = JSON.parse(sessao);
        const agora = new Date().getTime();
        
        if (agora > sessaoData.expira) {
            registrarAtividade('SESSAO_EXPIRADA', `Sessão expirou para usuário ${sessaoData.usuario}`);
            
            localStorage.removeItem('gestao_equipamentos_sessao');
            localStorage.removeItem('gestao_equipamentos_usuario');
            localStorage.removeItem('gestao_equipamentos_nivel');
            localStorage.removeItem('gestao_equipamentos_user_id');
            localStorage.removeItem('gestao_equipamentos_is_system_admin');
            
            return false;
        }
        
        if (APP_CONFIG.appSettings.renovarSessaoAutomaticamente) {
            sessaoData.expira = agora + (APP_CONFIG.appSettings.sessaoExpiracaoHoras * 60 * 60 * 1000);
            localStorage.setItem('gestao_equipamentos_sessao', JSON.stringify(sessaoData));
        }
        
        return true;
    } catch (e) {
        console.error('Erro ao verificar sessão:', e);
        return false;
    }
}

function getUsuarioLogado() {
    return localStorage.getItem('gestao_equipamentos_usuario');
}

function getNivelUsuario() {
    return localStorage.getItem('gestao_equipamentos_nivel');
}

function getUsuarioId() {
    return localStorage.getItem('gestao_equipamentos_user_id');
}

function isSystemAdmin() {
    return localStorage.getItem('gestao_equipamentos_is_system_admin') === 'true';
}

function getUsuarioInfo() {
    const usuarioKey = getUsuarioLogado();
    if (!usuarioKey) return null;
    
    let usuarioData = USUARIOS_AUTORIZADOS.find(u => u.username === usuarioKey);
    const nivelKey = getNivelUsuario();
    
    return usuarioData ? {
        id: usuarioData.id,
        username: usuarioKey,
        nome: usuarioData.nome,
        email: usuarioData.email,
        departamento: usuarioData.departamento,
        nivel: nivelKey,
        nivelNome: PERMISSOES.getNomeNivel(nivelKey),
        corNivel: PERMISSOES.getCorNivel(nivelKey),
        iconeNivel: PERMISSOES.getIconeNivel(nivelKey),
        dataCadastro: usuarioData.dataCriacao,
        ativo: usuarioData.ativo,
        isSystemAdmin: usuarioData.isSystemAdmin || false
    } : null;
}

function registrarAtividade(acao, detalhes, nivelUsuario = null) {
    if (!APP_CONFIG.appSettings.manterLogs) return;
    
    const usuario = getUsuarioLogado() || 'sistema';
    const nivel = nivelUsuario || getNivelUsuario() || 'sistema';
    const timestamp = new Date().toISOString();
    
    const logEntry = {
        id: Date.now(),
        timestamp: timestamp,
        usuario: usuario,
        nivel: nivel,
        acao: acao,
        detalhes: detalhes,
        ip: APP_UTILS.obterIPCliente(),
        userAgent: navigator.userAgent.substring(0, 200),
        pagina: window.location.pathname.split('/').pop()
    };
    
    try {
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs') || '[]');
        logs.unshift(logEntry);
        
        if (logs.length > APP_CONFIG.appSettings.maxLogs) {
            logs = logs.slice(0, APP_CONFIG.appSettings.maxLogs);
        }
        
        localStorage.setItem('gestao_equipamentos_logs', JSON.stringify(logs));
        
        if (APP_CONFIG.ambiente === 'Desenvolvimento') {
            console.log('LOG:', logEntry);
        }
        
    } catch (e) {
        console.error('Erro ao salvar log:', e);
    }
}

function getLogsAtividades(limite = 50, filtroUsuario = null) {
    try {
        let logs = JSON.parse(localStorage.getItem('gestao_equipamentos_logs') || '[]');
        
        if (filtroUsuario) {
            logs = logs.filter(log => log.usuario === filtroUsuario);
        }
        
        return logs.slice(0, limite);
    } catch (e) {
        console.error('Erro ao obter logs:', e);
        return [];
    }
}

function exportarConfiguracoes() {
    const usuario = getUsuarioLogado();
    
    if (!PERMISSOES.verificarPermissao(usuario, 'configurar_sistema')) {
        alert('Acesso negado. Apenas administradores podem exportar configurações.');
        return;
    }
    
    const configExport = {
        metadata: {
            sistema: APP_CONFIG.nome,
            versao: APP_CONFIG.versao,
            empresa: APP_CONFIG.empresa,
            dataExportacao: new Date().toISOString(),
            exportadoPor: usuario,
            totalUsuarios: USUARIOS_AUTORIZADOS.length,
            usuariosAtivos: USUARIOS_AUTORIZADOS.filter(u => u.ativo !== false).length
        },
        
        configuracoes: {
            appConfig: {
                ...APP_CONFIG,
                cores: undefined
            },
            jsonBinConfig: {
                BIN_ID: JSONBIN_CONFIG.BIN_ID,
                BIN_USUARIOS_ID: JSONBIN_CONFIG.BIN_USUARIOS.ID,
                ultimaSincronizacao: localStorage.getItem('gestao_equipamentos_ultima_sinc')
            }
        },
        
        usuarios: USUARIOS_AUTORIZADOS.map(u => ({
            id: u.id,
            username: u.username,
            nome: u.nome,
            email: u.email,
            nivel: u.nivel,
            departamento: u.departamento,
            ativo: u.ativo,
            isSystemAdmin: u.isSystemAdmin || false,
            dataCriacao: u.dataCriacao,
            criadoPor: u.criadoPor
        })),
        
        permissoes: PERMISSOES.gerarRelatorioPermissoes(),
        
        estatisticas: {
            totalLogs: getLogsAtividades().length,
            temaAtual: localStorage.getItem('gestao_equipamentos_tema') || 'claro',
            filtrosSalvos: localStorage.getItem('gestao_equipamentos_filtros') ? true : false,
            ultimoAcesso: localStorage.getItem('gestao_equipamentos_ultimo_acesso')
        }
    };
    
    const dataStr = JSON.stringify(configExport, null, 2);
    const nomeArquivo = `backup_config_${APP_CONFIG.versao}_${new Date().toISOString().split('T')[0]}.json`;
    
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    
    link.href = url;
    link.download = nomeArquivo;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    registrarAtividade('EXPORTAR_CONFIG', `Configurações do sistema exportadas (${USUARIOS_AUTORIZADOS.length} usuários)`);
    
    alert(`Configurações exportadas com sucesso!\nArquivo: ${nomeArquivo}\nTotal de usuários: ${USUARIOS_AUTORIZADOS.length}`);
}

function gerarRelatorioConfiguracao() {
    const usuarioInfo = getUsuarioInfo();
    const logs = getLogsAtividades(10);
    const tema = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    const ultimoAcesso = localStorage.getItem('gestao_equipamentos_ultimo_acesso');
    
    return `
RELATÓRIO DE CONFIGURAÇÃO DO SISTEMA
=====================================

SISTEMA
-------
Nome: ${APP_CONFIG.nome}
Versão: ${APP_CONFIG.versao}
Empresa: ${APP_CONFIG.empresa}
Ambiente: ${APP_CONFIG.ambiente}
Data de Criação: ${APP_CONFIG.criacao.dataCriacao}

DESENVOLVIMENTO
---------------
Idealização: ${APP_CONFIG.criacao.idealizacao}
Programação: ${APP_CONFIG.criacao.programacao}
Design: ${APP_CONFIG.criacao.design}

USUÁRIO ATUAL
-------------
Nome: ${usuarioInfo?.nome || 'Não autenticado'}
Usuário: ${usuarioInfo?.username || 'N/A'}
Nível: ${usuarioInfo?.nivelNome || 'N/A'}
Departamento: ${usuarioInfo?.departamento || 'N/A'}
E-mail: ${usuarioInfo?.email || 'N/A'}
Admin Sistema: ${usuarioInfo?.isSystemAdmin ? 'Sim' : 'Não'}

CONFIGURAÇÕES
-------------
Setores Configurados: ${Object.keys(APP_CONFIG.setores).length}
Responsáveis: ${Object.keys(APP_CONFIG.responsaveis).length}
Status de Equipamentos: ${Object.keys(APP_CONFIG.statusEquipamento).length}
Níveis de Permissão: ${Object.keys(PERMISSOES.niveis).length}
Usuários Cadastrados: ${USUARIOS_AUTORIZADOS.length}
Usuários Ativos: ${USUARIOS_AUTORIZADOS.filter(u => u.ativo !== false).length}

CONTROLE DE LINHA
-----------------
Alerta Tempo Máximo: ${APP_CONFIG.controleLinha.alertaTempoMaximo} minutos (${Math.floor(APP_CONFIG.controleLinha.alertaTempoMaximo/60)} horas)
Exigir Justificativa Desligamento: ${APP_CONFIG.controleLinha.exigirJustificativaDesligamento ? 'Sim' : 'Não'}
Notificar Troca de Turno: ${APP_CONFIG.controleLinha.notificarTrocaTurno ? 'Sim' : 'Não'}

ARMAZENAMENTO
-------------
Servidor: JSONBin.io
Bin Equipamentos: ${JSONBIN_CONFIG.BIN_ID}
Bin Usuários: ${JSONBIN_CONFIG.BIN_USUARIOS.ID}
Status Conexão: ${navigator.onLine ? 'Online' : 'Offline'}

PREFERÊNCIAS
------------
Tema: ${tema}
Último Acesso: ${ultimoAcesso ? APP_UTILS.formatarDataHora(ultimoAcesso) : 'N/A'}
Filtros Salvos: ${localStorage.getItem('gestao_equipamentos_filtros') ? 'Sim' : 'Não'}

LOGS RECENTES (Últimos 10)
--------------------------
${logs.map(log => `[${APP_UTILS.formatarHora(log.timestamp)}] ${log.usuario}: ${log.acao} - ${log.detalhes}`).join('\n')}

ESTATÍSTICAS
------------
Total de Logs: ${getLogsAtividades().length}
Versão do Sistema: ${APP_CONFIG.versao}
Data de Geração: ${new Date().toLocaleString('pt-BR')}

=====================================
RELATÓRIO GERADO AUTOMATICAMENTE
SISTEMA DE GESTÃO DE EQUIPAMENTOS
=====================================
`;
}

function mostrarInfoSistema() {
    const usuario = getUsuarioLogado();
    
    if (!PERMISSOES.verificarPermissao(usuario, 'configurar_sistema')) {
        alert('Acesso restrito. Apenas administradores podem visualizar estas informações.');
        return;
    }
    
    const info = gerarRelatorioConfiguracao();
    
    const modal = document.createElement('div');
    modal.className = 'modal active';
    modal.innerHTML = `
        <div class="modal-content" style="max-width: 800px;">
            <div class="modal-header">
                <h3><i class="fas fa-info-circle"></i> Informações do Sistema</h3>
                <span class="close-modal" onclick="this.closest('.modal').remove()">&times;</span>
            </div>
            <div class="modal-body">
                <div class="info-grid">
                    <div class="info-item">
                        <i class="fas fa-cube"></i>
                        <div>
                            <strong>Versão</strong>
                            <p>${APP_CONFIG.versao}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-building"></i>
                        <div>
                            <strong>Empresa</strong>
                            <p>${APP_CONFIG.empresa}</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        <div>
                            <strong>Usuários</strong>
                            <p>${USUARIOS_AUTORIZADOS.length} cadastrados</p>
                        </div>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-database"></i>
                        <div>
                            <strong>Storage</strong>
                            <p>JSONBin.io</p>
                        </div>
                    </div>
                </div>
                
                <pre style="white-space: pre-wrap; font-family: 'Courier New', monospace; font-size: 12px; 
                     max-height: 400px; overflow-y: auto; background: #f8f9fa; padding: 15px; 
                     border-radius: 5px; margin-top: 20px;">${info}</pre>
                
                <div class="form-actions" style="margin-top: 20px;">
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
    
    modal.addEventListener('click', function(e) {
        if (e.target === this) this.remove();
    });
    
    registrarAtividade('VIEW_SYSTEM_INFO', 'Visualizou informações do sistema');
}

function copiarInformacoesSistema() {
    const info = gerarRelatorioConfiguracao();
    
    APP_UTILS.copiarParaAreaTransferencia(info).then(sucesso => {
        if (sucesso) {
            alert('Informações copiadas para a área de transferência!');
            registrarAtividade('COPY_SYSTEM_INFO', 'Copiou informações do sistema');
        } else {
            alert('Erro ao copiar informações. Tente manualmente.');
        }
    });
}

function aplicarTema() {
    const tema = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    document.documentElement.setAttribute('data-tema', tema);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = tema === 'escuro' ? 'fas fa-sun' : 'fas fa-moon';
            themeToggle.title = tema === 'escuro' ? 'Alternar para tema claro' : 'Alternar para tema escuro';
        }
    }
}

function alternarTema() {
    const temaAtual = localStorage.getItem('gestao_equipamentos_tema') || 'claro';
    const novoTema = temaAtual === 'claro' ? 'escuro' : 'claro';
    
    localStorage.setItem('gestao_equipamentos_tema', novoTema);
    document.documentElement.setAttribute('data-tema', novoTema);
    
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        const icon = themeToggle.querySelector('i');
        if (icon) {
            icon.className = novoTema === 'escuro' ? 'fas fa-sun' : 'fas fa-moon';
            themeToggle.title = novoTema === 'escuro' ? 'Alternar para tema claro' : 'Alternar para tema escuro';
        }
    }
    
    registrarAtividade('ALTERAR_TEMA', `Tema alterado para ${novoTema}`);
    return novoTema;
}

function temPermissao(permissao) {
    const usuario = getUsuarioLogado();
    return PERMISSOES.verificarPermissao(usuario, permissao);
}

function podeExecutar(acao, recurso, donoRecurso = null) {
    const usuario = getUsuarioLogado();
    return PERMISSOES.podeExecutarAcao(usuario, acao, recurso, donoRecurso);
}

function inicializarConfiguracoes() {
    if (!localStorage.getItem('gestao_equipamentos_filtros')) {
        localStorage.setItem('gestao_equipamentos_filtros', JSON.stringify({
            status: 'all',
            pendencia: 'all',
            setor: 'all',
            busca: '',
            viewMode: 'grid',
            ordenacao: 'codigo'
        }));
    }
    
    if (!localStorage.getItem('gestao_equipamentos_tema')) {
        localStorage.setItem('gestao_equipamentos_tema', 'claro');
    }
    
    if (!localStorage.getItem('gestao_equipamentos_logs')) {
        localStorage.setItem('gestao_equipamentos_logs', JSON.stringify([]));
    }
    
    aplicarTema();
}

// ===========================================
// EXPORTAÇÃO PARA ESCOPO GLOBAL
// ===========================================

if (typeof window !== 'undefined') {
    window.JSONBIN_CONFIG = JSONBIN_CONFIG;
    window.INITIAL_DATA = INITIAL_DATA;
    window.APP_CONFIG = APP_CONFIG;
    window.PERMISSOES = PERMISSOES;
    window.APP_UTILS = APP_UTILS;
    window.USUARIOS_AUTORIZADOS = USUARIOS_AUTORIZADOS;
    window.NEXT_USER_ID = NEXT_USER_ID;
    
    window.hashSenha = hashSenha;
    window.verificarSenha = verificarSenha;
    
    window.logout = logout;
    window.verificarSessaoAtiva = verificarSessaoAtiva;
    window.getUsuarioLogado = getUsuarioLogado;
    window.getNivelUsuario = getNivelUsuario;
    window.getUsuarioId = getUsuarioId;
    window.isSystemAdmin = isSystemAdmin;
    window.getUsuarioInfo = getUsuarioInfo;
    window.registrarAtividade = registrarAtividade;
    window.getLogsAtividades = getLogsAtividades;
    window.exportarConfiguracoes = exportarConfiguracoes;
    window.gerarRelatorioConfiguracao = gerarRelatorioConfiguracao;
    window.mostrarInfoSistema = mostrarInfoSistema;
    window.copiarInformacoesSistema = copiarInformacoesSistema;
    window.aplicarTema = aplicarTema;
    window.alternarTema = alternarTema;
    window.temPermissao = temPermissao;
    window.podeExecutar = podeExecutar;
    window.inicializarConfiguracoes = inicializarConfiguracoes;
    
    console.log(`%c${APP_CONFIG.nome} v${APP_CONFIG.versao}`, 
                'color: #2c3e50; font-size: 14px; font-weight: bold;');
    console.log(`%cConfigurações carregadas com sucesso | ${new Date().toLocaleString('pt-BR')}`, 
                'color: #27ae60;');
    console.log(`%cUsuários disponíveis: ${USUARIOS_AUTORIZADOS.length}`, 
                'color: #3498db;');
    console.log(`%cControle de Linha: Ativado | Alerta: ${APP_CONFIG.controleLinha.alertaTempoMaximo}min`, 
                'color: #e67e22;');
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        JSONBIN_CONFIG,
        INITIAL_DATA,
        APP_CONFIG,
        PERMISSOES,
        APP_UTILS,
        USUARIOS_AUTORIZADOS,
        NEXT_USER_ID,
        hashSenha,
        verificarSenha,
        logout,
        verificarSessaoAtiva,
        getUsuarioLogado,
        getNivelUsuario,
        getUsuarioId,
        isSystemAdmin,
        getUsuarioInfo,
        registrarAtividade,
        getLogsAtividades,
        exportarConfiguracoes,
        gerarRelatorioConfiguracao,
        mostrarInfoSistema,
        copiarInformacoesSistema,
        aplicarTema,
        alternarTema,
        temPermissao,
        podeExecutar,
        inicializarConfiguracoes
    };
}

document.addEventListener('DOMContentLoaded', function() {
    inicializarConfiguracoes();
    
    if (getUsuarioLogado()) {
        registrarAtividade('SISTEMA_INICIADO', 'Sistema carregado com sucesso');
    }
});
