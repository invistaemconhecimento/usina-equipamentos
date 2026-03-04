# 🏭 Sistema de Gestão de Equipamentos - Usina de Beneficiamento

![Versão](https://img.shields.io/badge/versão-2.2.0-blue)
![Licença](https://img.shields.io/badge/licença-MIT-green)
![Status](https://img.shields.io/badge/status-produção-brightgreen)
![Equipamentos](https://img.shields.io/badge/equipamentos-300%2B-orange)

Sistema completo para gerenciamento de equipamentos industriais, com capacidade para gerenciar **300+ equipamentos**, controle de status operacional, registro detalhado de pendências e sistema de permissões por níveis de acesso.

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Funcionalidades](#-funcionalidades)
- [Níveis de Acesso](#-níveis-de-acesso)
- [Estrutura do Sistema](#-estrutura-do-sistema)
- [Tecnologias Utilizadas](#-tecnologias-utilizadas)
- [Configuração](#-configuração)
- [Hospedagem](#-hospedagem)
- [Como Usar](#-como-usar)
- [Estrutura dos Dados](#-estrutura-dos-dados)
- [Manutenção](#-manutenção)
- [Perguntas Frequentes](#-perguntas-frequentes)
- [Suporte](#-suporte)

## 🔍 Visão Geral

Sistema web desenvolvido para usinas de beneficiamento, permitindo o gerenciamento eficiente de equipamentos industriais, com foco em:

- **Controle operacional**: Monitoramento de status "Apto" / "Não Apto" baseado em pendências críticas
- **Gestão de pendências**: Registro e acompanhamento de ocorrências com prioridades
- **Rastreabilidade**: Histórico completo de todas as alterações em pendências
- **Segurança**: Sistema de permissões por níveis hierárquicos (5 níveis)
- **Armazenamento em nuvem**: Sincronização automática com JSONBin.io
- **Interface intuitiva**: Visualização em grade ou lista com temas claro/escuro

## ✨ Funcionalidades

### 📦 Equipamentos
| Funcionalidade | Descrição |
|----------------|-----------|
| **Cadastro simplificado** | Apenas nome, descrição e setor (ID gerado automaticamente) |
| **IDs automáticos** | Sistema numérico sequencial (1, 2, 3...) |
| **Status automático** | Determinado pelas pendências críticas (Apto/ Não Apto) |
| **Edição completa** | Atualização de dados a qualquer momento |
| **Exclusão segura** | Apenas administradores, com verificação de pendências ativas |
| **Dupla confirmação** | Para equipamentos com histórico de pendências |

### 📝 Pendências
| Funcionalidade | Descrição |
|----------------|-----------|
| **Registro detalhado** | Título, descrição, responsável, prioridade, data |
| **Prioridades** | Crítica (🔴), Alta (🟠), Média (🟡), Baixa (🟢) |
| **Status** | Aberta, Em Andamento, Resolvida, Cancelada |
| **Histórico completo** | Todas as alterações registradas com timestamp e usuário |
| **Comentários** | Adicionar observações a qualquer momento |
| **Edição e exclusão** | Com permissões controladas por nível |

### 🔍 Filtros e Busca
| Funcionalidade | Descrição |
|----------------|-----------|
| **Filtros rápidos** | Hoje, Esta Semana, Críticos, Sem Pendências, Minhas Pendências |
| **Filtros por status** | Apto / Não Apto |
| **Filtros por pendência** | Com pendência / Sem pendência / Com críticas |
| **Filtros por setor** | Todos os setores da usina (britagem, moagem, flotação, etc.) |
| **Filtros por data** | Período personalizado |
| **Filtros por prioridade** | Crítica, Alta, Média, Baixa |
| **Filtros por responsável** | Múltipla seleção (Elétrica, Mecânica, Operação, etc.) |
| **Busca inteligente** | Por nome, descrição ou ID |
| **Sugestões em tempo real** | Auto-complete na busca |
| **Filtros salvos** | Salvar combinações de filtros para uso futuro |

### 👥 Sistema de Permissões
| Nível | Cor | Ícone | Permissões Principais |
|-------|-----|-------|----------------------|
| **Operador** | 🔵 Azul | `fa-user` | Visualizar equipamentos, criar pendências, comentar |
| **Supervisor** | 🟡 Amarelo | `fa-user-tie` | + Editar pendências, exportar dados, relatórios |
| **Manutenção** | 🟣 Roxo | `fa-tools` | + Resolver pendências, ver histórico completo |
| **Engenharia** | 🟢 Verde | `fa-user-cog` | + Criar/editar equipamentos, excluir pendências |
| **Administrador** | 🔴 Vermelho | `fa-user-shield` | **ACESSO TOTAL** + Excluir equipamentos, gerenciar usuários |

### 📊 Interface
| Funcionalidade | Descrição |
|----------------|-----------|
| **Visualização dupla** | Lista ou Grade |
| **Cards informativos** | Status, pendências, metadados |
| **Cores intuitivas** | Identificação visual rápida (vermelho = crítico, verde = apto) |
| **Tema claro/escuro** | Alternância com atalho Ctrl+T |
| **Design responsivo** | Funciona em desktop, tablet e mobile |
| **Atalhos de teclado** | Ctrl+F (busca), Ctrl+E (novo equipamento), etc. |

### 🔄 Sincronização
| Funcionalidade | Descrição |
|----------------|-----------|
| **JSONBin.io** | Armazenamento em nuvem |
| **Sincronização automática** | A cada 5 minutos |
| **Sincronização manual** | Botão dedicado na sidebar |
| **Indicador de status** | Conectado / Desconectado |
| **Fallback local** | Dados iniciais se offline |

### 📈 Estatísticas e Exportação
| Funcionalidade | Descrição |
|----------------|-----------|
| **Dashboard** | Total de equipamentos, aptos, não aptos, pendências |
| **Contadores** | Por prioridade e status |
| **Progresso** | Percentual de equipamentos aptos |
| **Exportação de dados** | CSV com todos os registros (equipamentos e pendências) |

## 📁 Estrutura do Sistema
gestao-equipamentos-usina/
│
├── 📄 index.html # Interface principal
├── 📄 style.css # Estilos e temas (claro/escuro)
├── 📄 app.js # Lógica da aplicação (classes, métodos)
├── 📄 config.js # Configurações, usuários e dados iniciais
├── 📄 login.html # Página de autenticação
├── 📄 admin-usuarios.html # Painel administrativo (opcional)
└── 📄 README.md # Documentação completa

## 🛠️ Tecnologias Utilizadas

| Tecnologia | Versão | Uso |
|------------|--------|-----|
| HTML5 | - | Estrutura da aplicação |
| CSS3 | - | Estilização e temas (claro/escuro) |
| JavaScript | ES6+ | Lógica da aplicação |
| Font Awesome | 6.4.0 | Ícones profissionais |
| Google Fonts | Roboto | Tipografia |
| JSONBin.io | API v3 | Armazenamento em nuvem |
| LocalStorage | - | Cache local e persistência |

## ⚙️ Configuração

### 1. Configurar JSONBin.io

1. Acesse [JSONBin.io](https://jsonbin.io/) e crie uma conta gratuita
2. Obtenha sua API Key e Master Key no painel
3. Crie um novo "bin" (repositório de dados)
4. No arquivo `config.js`, localize e configure:

```javascript
const JSONBIN_CONFIG = {
    BIN_ID: 'SEU_BIN_ID_AQUI',              // ID do bin principal
    BIN_USUARIOS: {
        ID: 'SEU_BIN_USUARIOS_ID_AQUI'      // ID do bin de usuários
    },
    BASE_URL: 'https://api.jsonbin.io/v3/b',
    headers: {
        'Content-Type': 'application/json',
        'X-Master-Key': 'SUA_MASTER_KEY_AQUI',
        'X-Access-Key': 'SUA_API_KEY_AQUI',
        'X-Bin-Versioning': 'false'
    }
};
