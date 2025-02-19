const oracledb = require("oracledb");

// Configuração do banco de dados Oracle
const dbConfig = {
  user: "TESTE",
  password: "TS98BOCCHI",
  connectString:
    "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.0.42)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=TESTE)))",
};

async function testarConexaoOracle() {
  let connection;
  try {
    connection = await oracledb.getConnection(dbConfig);
    console.log("Conexão com o Oracle bem-sucedida");
    return "Conexão bem-sucedida";
  } catch (err) {
    console.error("Erro ao conectar com o Oracle:", err);
    return "Erro ao conectar com o Oracle";
  } finally {
    if (connection) {
      try {
        await connection.close();
      } catch (err) {
        console.error(err);
      }
    }
  }
}

module.exports = testarConexaoOracle;
