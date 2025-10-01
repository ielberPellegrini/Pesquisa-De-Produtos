require('dotenv').config();

const config = {
   
    port: process.env.PORT || 777,
    
    
    db: {
        user: process.env.DB_USER || 'consinco',
        password: process.env.DB_PASSWORD || 'consinco',
        connectString: process.env.DB_CONNECT_STRING || '10.101.18.8:1521/bdfort_pdb1.subnetskydbfort.vcnrootautoskyo.oraclevcn.com',
        poolMin: 2,
        poolMax: 10,
        poolIncrement: 1
    },
    
   
    app: {
        name: 'Sistema de Consulta de Produtos',
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development'
    }
};

module.exports = config;
