// Configuração do JSONBin.io
const JSONBIN_CONFIG = {
    // ID do bin que você criou no JSONBin.io
    BIN_ID: '696fa19fae596e708fe90a63',
    
    // URL base da API
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    
    // Cabeçalhos para as requisições
    headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': '$2a$10$gHdA8KAK/9HnnagDiMTlHeBUzNo9cWC0lR8EL0IaUpJg5ChpGiz/i'
    }
};

// Estrutura inicial dos dados
const INITIAL_DATA = {
    equipamentos: [
        {
            id: 1,
            codigo: "EQP-001",
            nome: "Turbina Principal",
            descricao: "Turbina de alta pressão para geração de energia",
            setor: "moagem-moagem", // Atualizado
            status: "apto",
            ultimaInspecao: "2023-10-15",
            dataCriacao: "2023-01-10",
            pendencias: [
                {
                    id: 1,
                    titulo: "Vibração acima do normal",
                    descricao: "Detectada vibração 15% acima do normal durante operação em carga máxima",
                    responsavel: "Elétrica",
                    prioridade: "alta",
                    data: "2023-10-10",
                    status: "em-andamento"
                }
            ]
        },
        {
            id: 2,
            codigo: "EQP-042",
            nome: "Transformador T-42",
            descricao: "Transformador de potência 500kV",
            setor: "utilidades-distribuicao-agua", // Atualizado
            status: "nao-apto",
            ultimaInspecao: "2023-09-22",
            dataCriacao: "2022-11-05",
            pendencias: [
                {
                    id: 2,
                    titulo: "Vazamento de óleo isolante",
                    descricao: "Identificado vazamento no tanque principal",
                    responsavel: "Instrumentação",
                    prioridade: "critica",
                    data: "2023-10-05",
                    status: "aberta"
                },
                {
                    id: 3,
                    titulo: "Sistema de refrigeração com ruído",
                    descricao: "Ventiladores apresentando ruído anormal",
                    responsavel: "Mecânica",
                    prioridade: "media",
                    data: "2023-09-30",
                    status: "resolvida"
                }
            ]
        },
        {
            id: 3,
            codigo: "EQP-123",
            nome: "Gerador G-12",
            descricao: "Gerador síncrono de 200MW",
            setor: "flotacao-flot-pirita", // Atualizado
            status: "apto",
            ultimaInspecao: "2023-10-18",
            dataCriacao: "2023-03-20",
            pendencias: []
        }
    ],
    // Contador para IDs únicos
    nextEquipamentoId: 4,
    nextPendenciaId: 4
};

// Configurações da aplicação
const APP_CONFIG = {
    nome: "Gestão de Equipamentos - Usina",
    versao: "1.0.0",
    setores: {
        // Novo: Atualizado com as opções especificadas
        "filtragem-filtragem-concentrado": "FILTRAGEM / FILTRAGEM DE CONCENTRADO",
        "filtragem-filtragem-rejeito": "FILTRAGEM / FILTRAGEM DE REJEITO",
        "flotacao-flot-cleaner-scavenger": "FLOTAÇÃO / FLOT CLEANER-SCAVENGER",
        "flotacao-flot-pirita": "FLOTAÇÃO / FLOT PIRITA",
        "flotacao-flot-rougher": "FLOTAÇÃO / FLOT ROUGHER",
        "moagem-moagem": "MOAGEM / MOAGEM",
        "reagentes-acido-sulfurico": "REAGENTES / ÁCIDO SULFÚRICO",
        "reagentes-dtf": "REAGENTES / DTF",
        "reagentes-espumante": "REAGENTES / ESPUMANTE",
        "reagentes-floculante": "REAGENTES / FLOCULANTE",
        "reagentes-leite-de-cal": "REAGENTES / LEITE DE CAL",
        "reagentes-pax": "REAGENTES / PAX",
        "torre-resfriamento-torre-resfriamento": "TORRE DE RESFRIAMENTO / TORRE DE RESFRIAMENTO",
        "utilidades-distribuicao-agua": "UTILIDADES / DISTRIBUIÇÃO DE ÁGUA"
    },
    statusEquipamento: {
        "apto": "Apto a Operar",
        "nao-apto": "Não Apto"
    },
    statusPendencia: {
        "aberta": "Aberta",
        "em-andamento": "Em Andamento",
        "resolvida": "Resolvida",
        "cancelada": "Cancelada"
    },
    prioridades: {
        "baixa": "Baixa",
        "media": "Média",
        "alta": "Alta",
        "critica": "Crítica"
    },
    // Lista de responsáveis
    responsaveis: [
        "Elétrica",
        "Instrumentação",
        "Mecânica",
        "Preventiva_Engenharia",
        "Automação",
        "Externo"
    ]
};

// Exportar configurações
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { JSONBIN_CONFIG, INITIAL_DATA, APP_CONFIG };
}
