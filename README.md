# Sistema de Consulta de Produtos - Backend Node.js

Sistema backend desenvolvido em Node.js/Express para consulta e extração de informações de produtos cadastrados em banco de dados Oracle.

## 🚀 Funcionalidades

- **API RESTful**: Endpoints para consulta de produtos, famílias e usuários
- **Conexão Oracle**: Pool de conexões otimizado com banco Oracle
- **Validação**: Validação de parâmetros e tratamento de erros
- **Monitoramento**: Health check e logs detalhados
- **Segurança**: Middlewares de segurança (Helmet, CORS)
- **Performance**: Pool de conexões e consultas otimizadas

## 📋 Requisitos

- Node.js 16.0.0 ou superior
- Oracle Client (para conexão com banco Oracle)
- Acesso ao banco de dados Oracle

## 🛠️ Instalação

### 1. Clone o repositório
```bash
git clone <url-do-repositorio>
cd "Pesquisa de cadastro de produtos"
```

### 2. Instale as dependências
```bash
npm install
```

### 3. Configure as variáveis de ambiente
Crie um arquivo `.env` na raiz do projeto com as seguintes configurações:

```env
# Configuração do Servidor
PORT=201

# Credenciais do Banco de Dados Oracle
DB_USER=consinco
DB_PASSWORD=consinco
DB_CONNECT_STRING=10.101.18.8:1521/bdfort_pdb1.subnetskydbfort.vcnrootautoskyo.oraclevcn.com

# Configuração da aplicação
NODE_ENV=development
```

### 4. Configure o Oracle Client (se necessário)
Se você não tiver o Oracle Client instalado, descomente e configure a linha no arquivo `database.js`:

```javascript
// oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_19_19' });
```

## 🚀 Executando a Aplicação

### Modo Desenvolvimento (com auto-reload)
```bash
npm run dev
```

### Modo Produção
```bash
npm start
```

A aplicação estará disponível em: `http://localhost:201`

## 📊 Estrutura do Projeto

```
Pesquisa de cadastro de produtos/
├── app.js                 # Aplicação Express principal
├── config.js             # Configurações da aplicação
├── database.js           # Módulo de conexão com banco Oracle
├── package.json          # Dependências e scripts
├── test-api.js           # Script de teste da API
└── README.md            # Este arquivo
```

## 🔌 Endpoints da API

### 1. Informações da Aplicação
- **GET /** - Status e informações da API

### 2. Consulta de Produtos
- **GET /api/produtos** - Listar produtos
- **GET /api/produtos?codigo_produto=123** - Buscar produto específico
- **GET /api/produtos?limit=50** - Limitar resultados

### 3. Consultas Auxiliares
- **GET /api/familias** - Listar famílias de produtos
- **GET /api/usuarios** - Listar usuários do sistema
- **GET /api/estatisticas** - Estatísticas do sistema

### 4. Monitoramento
- **GET /health** - Status de saúde da aplicação

### 5. Desenvolvimento (apenas em dev)
- **POST /api/query** - Executar consulta SQL personalizada

## 🔍 Exemplos de Uso

### Buscar todos os produtos (limite 100)
```bash
curl "http://localhost:201/api/produtos"
```

### Buscar produto específico
```bash
curl "http://localhost:201/api/produtos?codigo_produto=624"
```

### Buscar com limite personalizado
```bash
curl "http://localhost:201/api/produtos?limit=50"
```

### Verificar saúde da aplicação
```bash
curl "http://localhost:201/health"
```

## 🧪 Testando a API

### Instalar dependência de teste
```bash
npm install axios
```

### Executar testes
```bash
node test-api.js
```

## 📊 Estrutura das Respostas

### Resposta de Sucesso
```json
{
  "success": true,
  "data": [...],
  "total": 100,
  "filtros": {
    "codigo_produto": null,
    "limit": 100
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Resposta de Erro
```json
{
  "success": false,
  "message": "Mensagem de erro",
  "error": "Detalhes do erro (apenas em desenvolvimento)"
}
```

## 🗄️ Estrutura do Banco de Dados

A aplicação utiliza as seguintes tabelas:
- `map_produto`: Informações principais dos produtos
- `ge_usuario`: Dados dos usuários do sistema
- `map_familia`: Famílias de produtos
- `map_prodcodigo`: Códigos de acesso (EAN)

### Consulta Principal
```sql
SELECT 
    e.codacesso as EAN, 
    a.seqproduto as Codigo_Produto, 
    a.seqfamilia as Codigo_Familia, 
    a.descreduzida as Descricao,
    a.dtahorinclusao as Dia_Da_Inclusao, 
    d.pesavel as Item_Pesavel, 
    a.usuarioinclusao as Quem_Cadastrou, 
    b.sequsuario as Numero_Usuario, 
    b.nome as Nome_De_Quem_Cadastrou 
FROM map_produto a, ge_usuario b, map_produto c, map_familia d, map_prodcodigo e
WHERE a.usuarioinclusao = b.codusuario
    AND a.seqproduto = c.seqproduto
    AND a.seqfamilia = d.seqfamilia
    AND e.seqfamilia = a.seqfamilia
    AND d.pesavel = 'N'
ORDER BY a.dtahorinclusao DESC
```

## 🔧 Configurações Avançadas

### Pool de Conexões
```javascript
// config.js
db: {
    poolMin: 2,        // Conexões mínimas
    poolMax: 10,       // Conexões máximas
    poolIncrement: 1   // Incremento de conexões
}
```

### Logs
Os logs são configurados automaticamente com Morgan para requisições HTTP e console para operações do banco.

### Segurança
- **Helmet**: Headers de segurança
- **CORS**: Controle de acesso cross-origin
- **Validação**: Validação de parâmetros de entrada

## 🚨 Solução de Problemas

### Erro de Conexão com Oracle
1. Verifique se o Oracle Client está instalado
2. Confirme as credenciais no arquivo `.env`
3. Teste a conectividade com o banco

### Erro de Dependências
```bash
npm install
npm audit fix
```

### Porta em Uso
Altere a porta no arquivo `.env` ou encerre o processo que está usando a porta 201

### Erro de Oracle Client
```bash
# Windows
npm install oracledb --build-from-source

# Linux/Mac
export LD_LIBRARY_PATH=/path/to/oracle/instantclient
npm install oracledb
```

## 📱 Integração com Frontend

### Exemplo com JavaScript
```javascript
// Buscar produtos
fetch('http://localhost:201/api/produtos?limit=50')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Produtos:', data.data);
        }
    });

// Buscar produto específico
fetch('http://localhost:201/api/produtos?codigo_produto=624')
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('Produto:', data.data[0]);
        }
    });
```

### Exemplo com Axios
```javascript
import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:201'
});

// Buscar produtos
const produtos = await api.get('/api/produtos', {
    params: { limit: 100 }
});

// Buscar estatísticas
const estatisticas = await api.get('/api/estatisticas');
```

## 🔒 Segurança

- Credenciais do banco carregadas de variáveis de ambiente
- Validação de parâmetros de entrada
- Middlewares de segurança (Helmet, CORS)
- Tratamento de erros sem exposição de informações sensíveis

## 📈 Monitoramento

### Health Check
- **Endpoint**: `/health`
- **Status**: 200 (healthy) ou 503 (unhealthy)
- **Informações**: Status do banco, uptime, uso de memória

### Logs
- Requisições HTTP com Morgan
- Operações do banco de dados
- Erros e exceções

## 🚀 Deploy

### Variáveis de Ambiente para Produção
```env
NODE_ENV=production
PORT=201
DB_USER=consinco
DB_PASSWORD=consinco
DB_CONNECT_STRING=10.101.18.8:1521/bdfort_pdb1.subnetskydbfort.vcnrootautoskyo.oraclevcn.com
```

### Process Manager (PM2)
```bash
npm install -g pm2
pm2 start app.js --name "consulta-produtos"
pm2 startup
pm2 save
```

## 🤝 Contribuição

Para contribuir com o projeto:
1. Faça um fork do repositório
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Abra um Pull Request

## 📄 Licença

Este projeto é desenvolvido para uso interno da empresa.

## 📞 Suporte

Para suporte técnico ou dúvidas, entre em contato com a equipe de desenvolvimento.

---

**Desenvolvido com ❤️ em Node.js para facilitar a consulta de produtos cadastrados no sistema.**
