const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const oracledb = require("oracledb");
const cors = require("cors");
const testarConexaoOracle = require("./testConnection");
const fs = require("fs");
const xml2js = require("xml2js");

const app = express();
const port = 3002;

// Configuração do multer para lidar com uploads de arquivos
const upload = multer({ dest: "uploads/" });

app.use(cors());
app.use(express.json());

const path = require("path");

// Servir os arquivos estáticos do React
app.use(express.static(path.join(__dirname, "../frontend/build")));

// Testa a conexão com o Oracle ao iniciar o servidor
testarConexaoOracle();

app.get("/testar-conexao", async (req, res) => {
  const resultado = await testarConexaoOracle();
  res.send(resultado);
});

// Qualquer rota que não seja API retorna o index.html do React
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../frontend/build", "index.html"));
});

async function verificarNotaNoBanco(chNFE) {
  let connection;

  const dbConfig = {
    user: "TESTE",
    password: "TS98BOCCHI",
    connectString:
      "(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=192.168.0.42)(PORT=1521))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=TESTE)))",
  };

  try {
    connection = await oracledb.getConnection(dbConfig);

    // Simular uma consulta ao banco de dados
    const result = await connection.execute(
      `select STATUS from pcnfentpreent where chavenfe like :chNFE`,
      [chNFE]
    );

    return result.rows.length > 0 ? result.rows[0][0] : "não encontrada";
  } catch (err) {
    console.error(err);
    return "erro";
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

const util = require("util");
const parseString = util.promisify(xml2js.parseString);
const readFile = util.promisify(fs.readFile);

app.post("/verificar-nota", upload.single("notaXML"), async (req, res) => {
  try {
    const notaXML = req.file;
    if (!notaXML) {
      return res.status(400).json({ message: "Nenhum arquivo enviado" });
    }

    const data = await readFile(notaXML.path);
    const result = await parseString(data);

    // Extrair informações do emitente
    const emitente = result.nfeProc.NFe[0].infNFe[0].emit[0];
    const emitenteInfo = {
      CNPJ: emitente.CNPJ?.[0] || "Não informado",
      xNome: emitente.xNome?.[0] || "Não informado",
      xMun: emitente.enderEmit?.[0].xMun?.[0] || "Não informado",
      UF: emitente.enderEmit?.[0].UF?.[0] || "Não informado",
    };

    // Extrair chave da NFe
    const chNFe = result.nfeProc.NFe[0].infNFe[0].$.Id.replace(/^NFe/, "");
    const status = await verificarNotaNoBanco(chNFe);

    // Extrair informações dos produtos
    const items = result.nfeProc.NFe[0].infNFe[0].det.map((det) => {
      const prod = det.prod[0];
      return {
        nItem: det.$.nItem,
        cProd: prod.cProd?.[0] || "",
        // ... outros campos com verificações similares ...
      };
    });

    res.json({ emitente: emitenteInfo, status, items });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Erro ao processar a nota" });
  } finally {
    // Limpar arquivo temporário
    if (req.file) fs.unlinkSync(req.file.path);
  }
});

app.post("/enviar-confirmacao", async (req, res) => {
  const { email, agendamento } = req.body;

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: "elcio.pereira82@gmail.com",
      pass: "2023@Show",
    },
  });

  const mailOptions = {
    from: "elcio.pereira82@gmail.com",
    to: email,
    subject: "Confirmação de Agendamento",
    text: `Seu agendamento foi confirmado com o código: ${agendamento.codigo}`,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return res.status(500).json({ message: "Erro ao enviar o email" });
    } else {
      res.json({ message: "Email enviado com sucesso" });
    }
  });
});

app.listen(port, () => {
  console.log(`Servidor backend rodando em http://10.1.1.101:${port}`);
});
