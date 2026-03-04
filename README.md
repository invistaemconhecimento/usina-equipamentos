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
- [Suporte](#-suporte)

## 🔍 Visão Geral

Sistema web desenvolvido para usinas de beneficiamento, permitindo o gerenciamento eficiente de equipamentos industriais, com foco em:

- **Controle operacional**: Monitoramento de status "Apto" / "Não Apto"
- **Gestão de pendências**: Registro e acompanhamento de ocorrências
- **Rastreabilidade**: Histórico completo de todas as ações
- **Segurança**: Sistema de permissões por níveis hierárquicos
- **Armazenamento em nuvem**: Sincronização automática com JSONBin.io

## ✨ Funcionalidades

### 📦 Equipamentos
- ✅ **Cadastro simplificado**: Apenas nome, descrição e setor (ID gerado automaticamente)
- ✅ **IDs automáticos**: Sistema numérico sequencial (1, 2, 3...)
- ✅ **Status automático**: Determinado pelas pendências críticas
- ✅ **Edição completa**: Atualização de dados a qualquer momento
- ✅ **Exclusão segura**: Apenas administradores, com verificação de pendências ativas
- ✅ **Dupla confirmação**: Para equipamentos com histórico de pendências

### 📝 Pendências
- ✅ **Registro detalhado**: Título, descrição, responsável, prioridade, data
- ✅ **Prioridades**: Crítica, Alta, Média, Baixa (com cores distintas)
- ✅ **Status**: Aberta, Em Andamento, Resolvida, Cancelada
- ✅ **Histórico completo**: Todas as alterações registradas
- ✅ **Comentários**: Adicionar observações a qualquer momento
- ✅ **Edição e exclusão**: Com permissões controladas

### 🔍 Filtros e Busca
- ✅ **Filtros rápidos**: Hoje, Esta Semana, Críticos, Sem Pendências, Minhas Pendências
- ✅ **Filtros por status**: Apto / Não Apto
- ✅ **Filtros por pendência**: Com pendência / Sem pendência / Com críticas
- ✅ **Filtros por setor**: Todos os setores da usina
- ✅ **Filtros por data**: Período personalizado
- ✅ **Filtros por prioridade**: Crítica, Alta, Média, Baixa
- ✅ **Filtros por responsável**: Múltipla seleção
- ✅ **Busca inteligente**: Por nome, descrição ou ID
- ✅ **Sugestões em tempo real**: Auto-complete na busca
- ✅ **Filtros salvos**: Salvar combinações de filtros para uso futuro

### 👥 Sistema de Permissões
- ✅ **5 níveis de acesso**: Operador, Supervisor, Manutenção, Engenharia, Administrador
- ✅ **Controle granular**: Cada ação tem permissão específica
- ✅ **Indicador visual**: Badge colorido mostrando o nível do usuário
- ✅ **Sistema de login**: Autenticação segura com sessão

### 📊 Interface
- ✅ **Visualização dupla**: Lista ou Grade
- ✅ **Cards informativos**: Status, pendências, metadados
- ✅ **Cores intuitivas**: Identificação visual rápida
- ✅ **Tema claro/escuro**: Alternância com atalho Ctrl+T
- ✅ **Design responsivo**: Funciona em desktop, tablet e mobile
- ✅ **Atalhos de teclado**: Ctrl+F (busca), Ctrl+E (novo equipamento), etc.

### 🔄 Sincronização
- ✅ **JSONBin.io**: Armazenamento em nuvem
- ✅ **Sincronização automática**: A cada 5 minutos
- ✅ **Sincronização manual**: Botão dedicado
- ✅ **Indicador de status**: Conectado / Desconectado
- ✅ **Fallback local**: Dados iniciais se offline

### 📈 Estatísticas
- ✅ **Dashboard**: Total de equipamentos, aptos, não aptos, pendências
- ✅ **Contadores**: Por prioridade e status
- ✅ **Progresso**: Percentual de equipamentos aptos
- ✅ **Exportação de dados**: CSV com todos os registros

## 👑 Níveis de Acesso

| Nível | Cor | Ícone | Permissões |
|-------|-----|-------|------------|
| **Operador** | 🔵 Azul | `fa-user` | Visualizar equipamentos, criar pendências, comentar |
| **Supervisor** | 🟡 Amarelo | `fa-user-tie` | + Editar pendências, exportar dados, relatórios |
| **Manutenção** | 🟣 Roxo | `fa-tools` | + Resolver pendências, ver histórico completo |
| **Engenharia** | 🟢 Verde | `fa-user-cog` | + Criar/editar equipamentos, excluir pendências |
| **Administrador** | 🔴 Vermelho | `fa-user-shield` | **ACESSO TOTAL** + Excluir equipamentos, gerenciar usuários |

## 📁 Estrutura do Sistema
