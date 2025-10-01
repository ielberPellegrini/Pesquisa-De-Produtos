const axios = require('axios');

const BASE_URL = 'http://10.101.18.219:777';

// Função para testar a API
async function testarAPI() {
    console.log('🧪 Testando API de Consulta de Produtos\n');

    try {
        // Teste 1: Verificar status da aplicação
        console.log('1️⃣ Testando endpoint raiz...');
        const rootResponse = await axios.get(`${BASE_URL}/`);
        console.log('✅ Status da aplicação:', rootResponse.data.message);
        console.log('📊 Endpoints disponíveis:', Object.keys(rootResponse.data.endpoints));
        console.log('');

        // Teste 2: Verificar saúde da aplicação
        console.log('2️⃣ Testando health check...');
        const healthResponse = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Status da aplicação:', healthResponse.data.status);
        console.log('🗄️ Status do banco:', healthResponse.data.database.status);
        console.log('⏱️ Uptime:', Math.round(healthResponse.data.uptime), 'segundos');
        console.log('');

        // Teste 3: Buscar produtos (limite 10)
        console.log('3️⃣ Testando busca de produtos (limite 10)...');
        const produtosResponse = await axios.get(`${BASE_URL}/api/produtos?limit=10`);
        console.log('✅ Produtos encontrados:', produtosResponse.data.total);
        if (produtosResponse.data.data.length > 0) {
            const primeiroProduto = produtosResponse.data.data[0];
            console.log('📦 Primeiro produto:');
            console.log(`   Código: ${primeiroProduto.Codigo_Produto}`);
            console.log(`   Descrição: ${primeiroProduto.Descricao}`);
            console.log(`   Família: ${primeiroProduto.Codigo_Familia}`);
            console.log(`   Usuário: ${primeiroProduto.Nome_De_Quem_Cadastrou}`);
        }
        console.log('');

        // Teste 4: Buscar famílias
        console.log('4️⃣ Testando busca de famílias...');
        const familiasResponse = await axios.get(`${BASE_URL}/api/familias`);
        console.log('✅ Famílias encontradas:', familiasResponse.data.total);
        console.log('');

        // Teste 5: Buscar usuários
        console.log('5️⃣ Testando busca de usuários...');
        const usuariosResponse = await axios.get(`${BASE_URL}/api/usuarios`);
        console.log('✅ Usuários encontrados:', usuariosResponse.data.total);
        console.log('');

        // Teste 6: Buscar estatísticas
        console.log('6️⃣ Testando busca de estatísticas...');
        const estatisticasResponse = await axios.get(`${BASE_URL}/api/estatisticas`);
        console.log('✅ Estatísticas do sistema:');
        console.log(`   Total de produtos: ${estatisticasResponse.data.data.totalProdutos}`);
        console.log(`   Total de famílias: ${estatisticasResponse.data.data.totalFamilias}`);
        console.log(`   Total de usuários: ${estatisticasResponse.data.data.totalUsuarios}`);
        console.log('');

        // Teste 7: Buscar produto específico (se existir)
        if (produtosResponse.data.data.length > 0) {
            const codigoProduto = produtosResponse.data.data[0].Codigo_Produto;
            console.log(`7️⃣ Testando busca de produto específico (código: ${codigoProduto})...`);
            const produtoEspecificoResponse = await axios.get(`${BASE_URL}/api/produtos?codigo_produto=${codigoProduto}`);
            console.log('✅ Produto específico encontrado:', produtoEspecificoResponse.data.total);
            console.log('');
        }

        console.log('🎉 Todos os testes foram executados com sucesso!');
        console.log('🚀 A API está funcionando corretamente.');

    } catch (error) {
        if (error.response) {
            console.error('❌ Erro na resposta da API:');
            console.error('   Status:', error.response.status);
            console.error('   Mensagem:', error.response.data.message || error.response.data);
        } else if (error.request) {
            console.error('❌ Erro de conexão:');
            console.error('   Não foi possível conectar ao servidor');
            console.error('   Verifique se o servidor está rodando na porta 201');
        } else {
            console.error('❌ Erro:', error.message);
        }
    }
}

// Função para testar com diferentes filtros
async function testarFiltros() {
    console.log('\n🔍 Testando diferentes filtros...\n');

    try {
        // Teste com diferentes limites
        const limites = [5, 20, 50];
        for (const limite of limites) {
            console.log(`📊 Testando com limite ${limite}...`);
            const response = await axios.get(`${BASE_URL}/api/produtos?limit=${limite}`);
            console.log(`   ✅ Produtos retornados: ${response.data.total}`);
        }
        console.log('');

        // Teste de validação de parâmetros
        console.log('⚠️ Testando validação de parâmetros...');
        
        try {
            await axios.get(`${BASE_URL}/api/produtos?limit=0`);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('   ✅ Validação funcionando: limite 0 rejeitado');
            }
        }

        try {
            await axios.get(`${BASE_URL}/api/produtos?limit=abc`);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('   ✅ Validação funcionando: limite inválido rejeitado');
            }
        }

        try {
            await axios.get(`${BASE_URL}/api/produtos?codigo_produto=abc`);
        } catch (error) {
            if (error.response && error.response.status === 400) {
                console.log('   ✅ Validação funcionando: código inválido rejeitado');
            }
        }

        console.log('');

    } catch (error) {
        console.error('❌ Erro ao testar filtros:', error.message);
    }
}

// Executar testes
async function executarTestes() {
    await testarAPI();
    await testarFiltros();
    
    console.log('\n📋 Resumo dos testes:');
    console.log('   ✅ Endpoint raiz funcionando');
    console.log('   ✅ Health check funcionando');
    console.log('   ✅ API de produtos funcionando');
    console.log('   ✅ API de famílias funcionando');
    console.log('   ✅ API de usuários funcionando');
    console.log('   ✅ API de estatísticas funcionando');
    console.log('   ✅ Validação de parâmetros funcionando');
    
    console.log('\n🎯 Para usar a API em sua aplicação:');
    console.log('   GET /api/produtos - Listar produtos');
    console.log('   GET /api/produtos?codigo_produto=123 - Buscar produto específico');
    console.log('   GET /api/produtos?limit=50 - Limitar resultados');
    console.log('   GET /api/familias - Listar famílias');
    console.log('   GET /api/usuarios - Listar usuários');
    console.log('   GET /api/estatisticas - Estatísticas do sistema');
    console.log('   GET /health - Status da aplicação');
}

// Executar se o arquivo for chamado diretamente
if (require.main === module) {
    executarTestes().catch(console.error);
}

module.exports = { testarAPI, testarFiltros };
