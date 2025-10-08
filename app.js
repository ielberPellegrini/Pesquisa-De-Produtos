const XLSX = require('xlsx');
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const config = require('./config');
const db = require('./database');

const app = express();


app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            styleSrc: ["'self'", "'unsafe-inline'"],
            imgSrc: ["'self'", "data:", "https:"],
            fontSrc: ["'self'", "https:", "data:"],
            connectSrc: ["'self'", "http://localhost:201"]
        }
    }
}));
app.use(cors());
app.use(morgan('combined'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(express.static('public'));


app.use((req, res, next) => {
    res.setHeader('X-App-Name', config.app.name);
    res.setHeader('X-App-Version', config.app.version);
    next();
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


app.get('/api/info', (req, res) => {
    res.json({
        message: 'Sistema de Consulta de Produtos - API Backend',
        version: config.app.version,
        status: 'online',
        timestamp: new Date().toISOString(),
        endpoints: {
            produtos: '/api/produtos',
            familias: '/api/familias',
            usuarios: '/api/usuarios',
            estatisticas: '/api/estatisticas',
            xml: '/api/produtos/export/',
            health: '/health'
        }
    });
});



app.get('/api/produtos', async (req, res) => {
    try {
        
        const { codigo_produto, codigo_familia, ean, descricao, nroEmpresa, limit = 100 } = req.query;
        
        
        if (!codigo_produto && !ean && !descricao) {
            return res.status(400).json({
                success: false,
                message: 'Erro: É necessário informar pelo menos um parâmetro de pesquisa (código do produto, EAN ou descrição).'
            });
        }
        
        
        const limitNum = parseInt(limit);
        if (isNaN(limitNum) || limitNum < 1 || limitNum > 1000) {
            return res.status(400).json({
                success: false,
                message: 'Limite deve ser um número entre 1 e 1000'
            });
        }

        let codigoProduto = null;
        if (codigo_produto) {
            codigoProduto = parseInt(codigo_produto);
            if (isNaN(codigoProduto)) {
                return res.status(400).json({
                    success: false,
                    message: 'Código do produto deve ser um número válido'
                });
            }
        }

        let codigoFamilia = null;
        if (codigo_familia) {
            codigoFamilia = parseInt(codigo_familia);
            if (isNaN(codigoFamilia)) {
                return res.status(400).json({
                    success: false,
                    message: 'Código da família deve ser um número válido'
                });
            }
        }

        const eanParam = ean || null;
        const descricaoParam = descricao || null;

        
        const produtos = await db.getProdutosInfo(
            codigoProduto,
            codigoFamilia,
            eanParam,
            descricaoParam,
            nroEmpresa ? parseInt(nroEmpresa) : null,
            limitNum
        );
        
        res.json({
            success: true,
            data: produtos,
            total: produtos.length,
            filtros: {
                codigo_produto: codigoProduto,
                codigo_familia: codigoFamilia,
                ean: eanParam,
                descricao: descricaoParam,
                limit: limitNum
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro na rota /api/produtos:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: config.app.environment === 'development' ? error.message : 'Erro interno'
        });
    }
});


app.get('/api/familias', async (req, res) => {
    try {
        const familias = await db.getFamilias();
        
        res.json({
            success: true,
            data: familias,
            total: familias.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro na rota /api/familias:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: config.app.environment === 'development' ? error.message : 'Erro interno'
        });
    }
});


app.get('/api/usuarios', async (req, res) => {
    try {
        const usuarios = await db.getUsuarios();
        
        res.json({
            success: true,
            data: usuarios,
            total: usuarios.length,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro na rota /api/usuarios:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: config.app.environment === 'development' ? error.message : 'Erro interno'
        });
    }
});


app.get('/api/estatisticas', async (req, res) => {
    try {
        const estatisticas = await db.getEstatisticas();
        
        res.json({
            success: true,
            data: estatisticas,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('❌ Erro na rota /api/estatisticas:', error.message);
        res.status(500).json({
            success: false,
            message: 'Erro interno do servidor',
            error: config.app.environment === 'development' ? error.message : 'Erro interno'
        });
    }
});

app.get('/health', async (req, res) => {
    try {
        const dbStatus = await db.testConnection();
        
        const healthData = {
            status: dbStatus ? 'healthy' : 'unhealthy',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            memory: process.memoryUsage(),
            database: {
                status: dbStatus ? 'connected' : 'disconnected',
                timestamp: new Date().toISOString()
            },
            app: {
                name: config.app.name,
                version: config.app.version,
                environment: config.app.environment
            }
        };

        const statusCode = dbStatus ? 200 : 503;
        res.status(statusCode).json(healthData);

    } catch (error) {
        console.error('❌ Erro na rota /health:', error.message);
        res.status(503).json({
            status: 'error',
            message: 'Erro ao verificar saúde da aplicação',
            timestamp: new Date().toISOString(),
            error: config.app.environment === 'development' ? error.message : 'Erro interno'
        });
    }
});

app.get('/api/produtos/export', async (req, res) => {
    try {
        const { codigo_produto, ean, descricao, nroEmpresa, limit = 2000, visibleColumns } = req.query; // Aumentei o limite para exportação

        // 1. Busca os dados completos do banco, como antes
        const produtos = await db.getProdutosInfo(
            codigo_produto ? parseInt(codigo_produto) : null,
            null, // codigo_familia não é usado na sua interface de busca
            ean || null,
            descricao || null,
            nroEmpresa ? parseInt(nroEmpresa) : null,
            parseInt(limit)
        );

        if (produtos.length === 0) {
            return res.status(404).send('Nenhum dado encontrado para exportar com os filtros fornecidos.');
        }

        // 2. ===== NOVA LÓGICA PARA FILTRAR AS COLUNAS =====

        // Mapeamento entre a classe CSS do frontend e a chave do JSON do banco
        const columnMap = {
            'col-ean': 'EAN',
            'col-cod-prod': 'CODIGO_PRODUTO',
            'col-descricao': 'DESCRICAO',
            'col-estoque': 'ESTOQUE',
            'col-nro-empresa': 'NRO_EMPRESA',
            'col-icms': 'ALIQUOTA_ICMS',
            'col-pis': 'PERCENT_PIS',
            'col-cofins': 'PERCENT_COFINS',
            'col-estado-fatur': 'ESTADO_FATUR',
            'col-embalagem': 'EMBALAGEM',
            'col-fornecedor': 'FORNECEDOR',
            'col-data-inclusao': 'DIA_DA_INCLUSAO',
            'col-pesavel': 'ITEM_PESAVEL',
            'col-quem-cadastrou': 'NOME_DE_QUEM_CADASTROU'
        };

        // As colunas que sempre devem aparecer
        const alwaysVisibleKeys = ['EAN', 'CODIGO_PRODUTO', 'DESCRICAO'];
        
        let dataToExport = produtos;
        let headersToExport;

        if (visibleColumns) {
            const visibleClasses = visibleColumns.split(',');
            // Pega as chaves do JSON correspondentes às classes visíveis
            const visibleKeys = visibleClasses.map(className => columnMap[className]).filter(Boolean);
            
            // Garante que as colunas principais sempre existam, sem duplicatas
            const finalKeys = [...new Set([...alwaysVisibleKeys, ...visibleKeys])];
            
            // Cria um novo array de objetos contendo apenas os dados das colunas selecionadas
            dataToExport = produtos.map(produto => {
                let newRow = {};
                finalKeys.forEach(key => {
                    newRow[key] = produto[key];
                });
                return newRow;
            });

            headersToExport = finalKeys;
        }
        
        // 3. Gera o Excel com os dados já filtrados
        const worksheet = XLSX.utils.json_to_sheet(dataToExport, { header: headersToExport });
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, 'Produtos');
        
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=Relatorio_Produtos.xlsx');
        
        const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });
        res.send(buffer);

    } catch (error) {
        console.error('❌ Erro ao exportar para Excel:', error.message);
        res.status(500).json({ success: false, message: 'Erro ao gerar o arquivo Excel.' });
    }
});


if (config.app.environment === 'development') {
    app.post('/api/query', async (req, res) => {
        try {
            const { sql, params = [] } = req.body;
            
            if (!sql) {
                return res.status(400).json({
                    success: false,
                    message: 'SQL query é obrigatória'
                });
            }

            const result = await db.executeQuery(sql, params);
            
            res.json({
                success: true,
                data: result,
                total: result.length,
                sql: sql,
                params: params,
                timestamp: new Date().toISOString()
            });

        } catch (error) {
            console.error('❌ Erro na rota /api/query:', error.message);
            res.status(500).json({
                success: false,
                message: 'Erro ao executar query personalizada',
                error: error.message
            });
        }
    });
}


app.use('*', (req, res) => {
    res.status(404).json({
        success: false,
        message: 'Rota não encontrada',
        path: req.originalUrl,
        timestamp: new Date().toISOString()
    });
});


app.use((error, req, res, next) => {
    console.error('❌ Erro não tratado:', error);
    
    res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: config.app.environment === 'development' ? error.message : 'Erro interno',
        timestamp: new Date().toISOString()
    });
});


async function startServer() {
    try {
        console.log('🚀 Iniciando sistema de consulta de produtos...');
        console.log(`📊 Conectando ao banco Oracle: ${config.db.connectString}`);
        
        const dbInitialized = await db.initialize();
        if (!dbInitialized) {
            console.error('❌ Falha ao inicializar conexão com banco. Encerrando aplicação.');
            process.exit(1);
        }

        console.log('🔍 Testando conexão com banco de dados...');
        console.log('⏱️ Timeout configurado para 10 segundos por tentativa');
        let retryCount = 0;
        const maxRetries = 3;
        const connectionTimeout = 10000;
        
        const testConnectionWithTimeout = async () => {
            return Promise.race([
                db.testConnection(),
                new Promise((_, reject) => 
                    setTimeout(() => reject(new Error('Timeout na conexão')), connectionTimeout)
                )
            ]);
        };
        
        while (retryCount < maxRetries) {
            try {
                const connectionTest = await testConnectionWithTimeout();
                if (connectionTest) {
                    console.log('✅ Conexão com banco testada e funcionando!');
                    break;
                } else {
                    retryCount++;
                    if (retryCount < maxRetries) {
                        console.log(`⚠️ Tentativa ${retryCount} falhou. Tentando novamente em 2 segundos...`);
                        await new Promise(resolve => setTimeout(resolve, 2000));
                    }
                }
            } catch (error) {
                retryCount++;
                console.error(`❌ Erro na tentativa ${retryCount}:`, error.message);
                if (retryCount < maxRetries) {
                    console.log(`⚠️ Tentando novamente em 2 segundos...`);
                    await new Promise(resolve => setTimeout(resolve, 2000));
                }
            }
        }
        
        if (retryCount >= maxRetries) {
            console.error('❌ Falha no teste de conexão com banco após 3 tentativas. Encerrando aplicação.');
            await db.closePool();
            process.exit(1);
        }

        const server = app.listen(config.port, () => {
            console.log(`✅ Servidor rodando na porta ${config.port}`);
            console.log(`🌐 Acesse: http://localhost:${config.port}`);
            console.log(`📱 Ambiente: ${config.app.environment}`);
            console.log(`🔗 Health Check: http://localhost:${config.port}/health`);
        });

        process.on('SIGINT', async () => {
            console.log('\n🛑 Encerrando servidor...');
            server.close(async () => {
                console.log('✅ Servidor HTTP encerrado.');
                await db.closePool();
                console.log('✅ Conexões com banco encerradas.');
                process.exit(0);
            });
        });

        process.on('SIGTERM', async () => {
            console.log('\n🛑 Encerrando servidor...');
            server.close(async () => {
                console.log('✅ Servidor HTTP encerrado.');
                await db.closePool();
                console.log('✅ Conexões com banco encerradas.');
                process.exit(0);
            });
        });

    } catch (error) {
        console.error('❌ Erro fatal ao iniciar servidor:', error);
        process.exit(1);
    }
}

startServer();

module.exports = app;