const express = require("express");
const multer = require("multer");
const nodemailer = require("nodemailer");
const oracledb = require("oracledb");
const cors = require("cors");
const testarConexaoOracle = require("./testConnection");
const fs = require("fs");
const xml2js = require("xml2js");
require("dotenv").config();

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
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    connectString: `(DESCRIPTION=(ADDRESS=(PROTOCOL=TCP)(HOST=${process.env.DB_HOST})(PORT=${process.env.DB_PORT}))(CONNECT_DATA=(SERVER=DEDICATED)(SERVICE_NAME=${process.env.DB_SERVICE_NAME})))`,
  };

  console.log(dbConfig);

  try {
    connection = await oracledb.getConnection(dbConfig);

    // Simular uma consulta ao banco de dados
    const result = await connection.execute(
      `select STATUS from pcnfentpreent where chavenfe like :chNFE`,
      [chNFE]
    );

    console.log("Resultado da consulta:", result.rows);
    if (result.rows.length > 0) {
      const statusNota = result.rows[0][0];
      return statusNota === "L"
        ? "Liberada para Agendamento"
        : "BLoqueada para Agendamento";
    } else {
      return "não encontrada";
    }
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

    // Extrair informações do destinatáio
    const destinatario = result.nfeProc.NFe[0].infNFe[0].dest[0];
    const destinatarioInfo = {
      CNPJ: destinatario.CNPJ?.[0] || "Não informado",
      xNome: destinatario.xNome?.[0] || "Não informado",
      xMun: destinatario.enderDest?.[0].xMun?.[0] || "Não informado",
      UF: destinatario.enderDest?.[0].UF?.[0] || "Não informado",
    };

    // Extrair chave da NFe
    const chNFe = result.nfeProc.NFe[0].infNFe[0].$.Id.replace(/^NFe/, "");
    console.log("Chave da NFe:", chNFe); // Log da chave da NFe para verificar se está correta

    let statusNota = "não verificado"; // Defina um valor padrão

    try {
      statusNota = await verificarNotaNoBanco(chNFe);
      console.log("Status retornado do banco:", statusNota); // Log do status retornado do banco
    } catch (error) {
      console.error("Erro ao verificar nota no banco:", error);
      statusNota = "erro"; // Defina um valor de fallback em caso de erro
    }

    // Extrair informações dos produtos

    const items =
      result.nfeProc?.NFe?.[0]?.infNFe?.[0]?.det?.map((det) => {
        const prod = det.prod?.[0] || {}; // Se det.prod[0] não existir, define como objeto vazio
        return {
          cProd: prod.cProd?.[0] || "Não informado",
          cEAN: prod.cEAN?.[0] || "Não informado",
          xProd: prod.xProd?.[0] || "Não informado",
          NCM: prod.NCM?.[0] || "Não informado",
          CEST: prod.CEST?.[0] || "Não informado",
          CFOP: prod.CFOP?.[0] || "Não informado",
          uCom: prod.uCom?.[0] || "Não informado",
          qCom: prod.qCom?.[0] || "Não informado",
          vUnCom: prod.vUnCom?.[0] || "Não informado",
          vProd: prod.vProd?.[0] || "Não informado",
          cEANTrib: prod.cEANTrib?.[0] || "Não informado",
          uTrib: prod.uTrib?.[0] || "Não informado",
          qTrib: prod.qTrib?.[0] || "Não informado",
          vUnTrib: prod.vUnTrib?.[0] || "Não informado",
          indTot: prod.indTot?.[0] || "Não informado",
          nItemPed: prod.nItemPed?.[0] || "Não informado",
        };
      }) || []; // Se result.nfeProc?.NFe?.[0]?.infNFe?.[0]?.det for undefined, define items como array vazio

    res.json({
      emitente: emitenteInfo,
      destinatario: destinatarioInfo,
      statusNota,
      items,
    });
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
