const oracledb = require('oracledb');
const config = require('./config');

class DatabaseConnection {
    constructor() {
        this.pool = null;
        this.isInitialized = false;
    }

    async initialize() {
        try {
            
            try {
                oracledb.initOracleClient({ libDir: 'C:\\oracle\\instantclient_23_8' });
                console.log('✅ Oracle Client configurado com sucesso!');
            } catch (clientError) {
                console.log('⚠️  Oracle Client já configurado ou não necessário');
            }
            
            // Configurar o pool de conexões
            await oracledb.createPool(config.db);
            this.pool = oracledb.getPool();
            this.isInitialized = true;
            
            console.log('✅ Pool de conexões Oracle criado com sucesso!');
            return true;
        } catch (error) {
            console.error('❌ Erro ao inicializar pool Oracle:', error.message);
            return false;
        }
    }

    async getConnection() {
        try {
            if (!this.isInitialized) {
                await this.initialize();
            }
            
            const connection = await this.pool.getConnection();
            return connection;
        } catch (error) {
            console.error('❌ Erro ao obter conexão:', error.message);
            throw error;
        }
    }

    async closePool() {
        try {
            if (this.pool) {
                await this.pool.close();
                this.isInitialized = false;
                console.log('✅ Pool de conexões Oracle fechado.');
            }
        } catch (error) {
            console.error('❌ Erro ao fechar pool:', error.message);
        }
    }

    async executeQuery(query, params = [], options = {}) {
        let connection;
        try {
            connection = await this.getConnection();
            
            const defaultOptions = {
                outFormat: oracledb.OUT_FORMAT_OBJECT,
                maxRows: options.maxRows || 1000
            };

            const result = await connection.execute(query, params, defaultOptions);
            return result.rows || [];
            
        } catch (error) {
            console.error('❌ Erro ao executar consulta:', error.message);
            throw error;
        } finally {
            if (connection) {
                try {
                    await connection.close();
                } catch (err) {
                    console.error('❌ Erro ao fechar conexão:', err.message);
                }
            }
        }
    }

    async getProdutosInfo(codigoProduto = null, codigoFamilia = null, ean = null, descricao = null, limit = 200) {
        let query = `
            SELECT DISTINCT
                e.codacesso AS EAN,
                a.seqproduto AS CODIGO_PRODUTO,
                a.seqfamilia AS CODIGO_FAMILIA,
                a.descreduzida AS DESCRICAO,
                i.estqloja AS ESTOQUE,
                i.nroempresa AS NRO_EMPRESA,
                h.aliquotaicms AS ALIQUOTA_ICMS,
                h.perpis AS PERCENT_PIS,
                h.percofins AS PERCENT_COFINS,
                h.uffaturamento AS ESTADO_FATUR,
                g.qtdembalagem AS EMBALAGEM,
                g.nomerazao AS FORNECEDOR,
                a.dtahorinclusao AS DIA_DA_INCLUSAO,
                d.pesavel AS ITEM_PESAVEL,
                a.usuarioinclusao AS QUEM_CADASTROU,
                b.sequsuario AS NUMERO_USUARIO,
                b.nome AS NOME_DE_QUEM_CADASTROU
            FROM map_produto a
            JOIN ge_usuario b ON a.usuarioinclusao = b.codusuario
            JOIN map_produto c ON a.seqproduto = c.seqproduto
            JOIN map_familia d ON a.seqfamilia = d.seqfamilia
            JOIN map_prodcodigo e ON e.seqfamilia = a.seqfamilia
            JOIN MAP_FAMDIVCATEG f ON f.seqfamilia = a.seqfamilia
            JOIN mlo_prodcodfornec g ON a.seqproduto = g.seqproduto
            JOIN macv_custocomprauf h ON h.SEQFAMILIA = a.seqfamilia AND g.SEQPESSOA = h.SEQFORNECEDOR
            JOIN mrl_produtoempresa i on a.seqproduto = i.seqproduto
            WHERE e.indutilvenda = 'S'
              AND e.tipcodigo IN ('B','E')
              AND i.nroempresa NOT IN (1,4,22,33,34,38)
        `;

       
        const params = [];
        let paramCount = 1;

        if (codigoProduto) {
            query += ` AND a.seqproduto = :${paramCount++}`;
            params.push(codigoProduto);
        }
        if (codigoFamilia) {
            query += ` AND a.seqfamilia = :${paramCount++}`;
            params.push(codigoFamilia);
        }
        if (ean) {
            query += ` AND e.codacesso = :${paramCount++}`;
            params.push(ean);
        }
       
        if (descricao) {
            query += ` AND UPPER(a.descreduzida) LIKE UPPER(:${paramCount++})`;
            params.push(`%${descricao}%`); // Adiciona os wildcards '%'
        }

        query += ` ORDER BY a.dtahorinclusao DESC FETCH FIRST :${paramCount++} ROWS ONLY`;
        params.push(limit);

        
        try {
            const connection = await this.getConnection();
            const result = await connection.execute(
                query,
                params,
                { outFormat: oracledb.OUT_FORMAT_OBJECT }
            );
            await connection.close();
            return result.rows;
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
            return [];
        }
    }

    async getFamilias() {
        const query = `
            SELECT DISTINCT seqfamilia as CODIGO_FAMILIA, descricao as DESCRICAO 
            FROM map_familia 
            ORDER BY descricao
        `;
        return await this.executeQuery(query);
    }

    async getUsuarios() {
        const query = `
            SELECT DISTINCT codusuario, nome 
            FROM ge_usuario 
            ORDER BY nome
        `;
        return await this.executeQuery(query);
    }

    async getEstatisticas() {
        try {
            const [totalProdutos, totalFamilias, totalUsuarios, ultimaAtualizacao] = await Promise.all([
                this.executeQuery('SELECT COUNT(*) as total FROM map_produto'),
                this.executeQuery('SELECT COUNT(*) as total FROM map_familia'),
                this.executeQuery('SELECT COUNT(*) as total FROM ge_usuario'),
                this.executeQuery(`
                    SELECT MAX(dtahorinclusao) as ultima_atualizacao 
                    FROM map_produto
                `)
            ]);

            return {
                totalProdutos: totalProdutos[0]?.TOTAL || 0,
                totalFamilias: totalFamilias[0]?.TOTAL || 0,
                totalUsuarios: totalUsuarios[0]?.TOTAL || 0,
                ultimaAtualizacao: ultimaAtualizacao[0]?.ULTIMA_ATUALIZACAO || null
            };
        } catch (error) {
            console.error('❌ Erro ao buscar estatísticas:', error.message);
            throw error;
        }
    }

    async testConnection() {
        try {
            if (!this.pool || !this.isInitialized) {
                console.error('❌ Pool de conexões não está inicializado');
                return false;
            }

            const connection = await this.getConnection();
            
            const result = await connection.execute('SELECT 1 as test FROM DUAL');
            await connection.close();
            
            return result && result.rows && result.rows.length > 0;
        } catch (error) {
            console.error('❌ Erro no teste de conexão:', error.message);
            return false;
        }
    }
}



const db = new DatabaseConnection();

module.exports = db;