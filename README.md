# Sistema de Gerenciamento de Equipamentos de Usina

Aplicação web para gerenciar 300 equipamentos de usina, com controle de status operacional e registro de pendências.

## Funcionalidades

- **Cadastro de equipamentos** com código, nome, descrição, setor e status operacional
- **Controle de status**: Apto a operar / Não apto
- **Registro de pendências** para cada equipamento
- **Histórico de pendências** com responsável, data, prioridade e status
- **Filtros avançados** por status operacional e existência de pendências
- **Busca por equipamentos**
- **Visualização em lista ou grade**
- **Sincronização com JSONBin.io** para armazenamento em nuvem
- **Exportação de dados** para backup

## Configuração

### 1. Configurar JSONBin.io

1. Acesse [JSONBin.io](https://jsonbin.io/) e crie uma conta gratuita
2. Obtenha sua API Key e Master Key
3. Crie um novo "bin" (repositório de dados)
4. No arquivo `config.js`, substitua as seguintes informações:
   - `API_KEY`: Sua chave de API
   - `BIN_ID`: O ID do bin criado
   - `X-Master-Key`: Sua master key no cabeçalho

### 2. Hospedagem no GitHub Pages

1. Crie um repositório no GitHub
2. Faça upload dos arquivos:
   - `index.html`
   - `style.css`
   - `app.js`
   - `config.js`
   - `README.md`
3. Ative o GitHub Pages nas configurações do repositório

## Como Usar

### Adicionar um Equipamento

1. Clique em "Novo Equipamento"
2. Preencha os dados obrigatórios (código, nome, status)
3. Clique em "Salvar Equipamento"

### Registrar uma Pendência

1. Selecione um equipamento na lista
2. Clique em "Pendência" no card do equipamento
3. Preencha os detalhes da pendência
4. Clique em "Salvar Pendência"

### Visualizar Detalhes

1. Clique em "Detalhes" em qualquer equipamento
2. Veja todas as informações do equipamento
3. Acesse o histórico completo de pendências
4. Edite ou exclua pendências diretamente

### Filtros e Busca

- Use o filtro de status para ver apenas equipamentos aptos ou não aptos
- Use o filtro de pendência para ver equipamentos com ou sem pendências
- Utilize a busca para encontrar equipamentos por nome, código ou descrição

## Estrutura dos Dados

### Equipamento
```json
{
  "id": 1,
  "codigo": "EQP-001",
  "nome": "Turbina Principal",
  "descricao": "Turbina de alta pressão",
  "setor": "geracao",
  "status": "apto",
  "ultimaInspecao": "2023-10-15",
  "dataCriacao": "2023-01-10",
  "pendencias": []
}
