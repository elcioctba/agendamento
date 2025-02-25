import React, { useState } from "react";
import Layout from "./components/Layout";
import { Card, CardContent, CardHeader, CardTitle } from "./components/ui/card";
import { AlertCircle, CheckCircle2, Truck, Upload } from "lucide-react";

const App = () => {
  // Estados e funções mantidos
  const [conexaoStatus, setConexaoStatus] = useState("");
  const [statusNota, setNotaStatus] = useState("");
  const [notaXML, setNotaXML] = useState(null);
  const [emitente, setEmitente] = useState(null);
  const [destinatario, setDestinatario] = useState(null);
  const [items, setItems] = useState([]);
  const [dataAgendamento, setDataAgendamento] = useState("");
  const [email, setEmail] = useState("");

  // Funções mantidas
  const testarConexao = async () => {
    try {
      const response = await fetch("http://10.1.1.101:3002/testar-conexao");
      const data = await response.text();
      setConexaoStatus(data);
    } catch (error) {
      setConexaoStatus("Erro ao conectar com o backend");
    }
  };

  const verificarNota = async () => {
    if (!notaXML) {
      alert("Por favor, selecione um arquivo XML primeiro.");
      return;
    }

    const formData = new FormData();
    formData.append("notaXML", notaXML);

    // Variável para verificar se o componente está montado
    let isMounted = true;

    try {
      const response = await fetch("http://10.1.1.101:3002/verificar-nota", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      console.log(data);

      // Só atualiza o estado se o componente ainda estiver montado
      if (isMounted) {
        setNotaStatus(data.status);
        setEmitente(data.emitente);
        setDestinatario(data.destinatario);
        setItems(data.items);
      }
    } catch (error) {
      console.error("Erro na verificação:", error);
      if (isMounted) {
        setNotaStatus(error.message);
      }
    }

    // Cleanup: marca como desmontado quando o componente for desmontado
    return () => {
      isMounted = false;
    };
  };

  const confirmarAgendamento = async () => {
    if (!email || !dataAgendamento) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    try {
      const response = await fetch(
        "http://10.1.1.101:3002/enviar-confirmacao",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(agendamento),
        }
      );

      if (response.ok) {
        alert("Agendamento confirmado e e-mail enviado com sucesso!");
      } else {
        alert("Erro ao confirmar o agendamento.");
      }
    } catch (error) {
      alert("Erro ao confirmar o agendamento.");
    }
  };

  const handleFileChange = (event) => {
    setNotaXML(event.target.files[0]);
  };

  return (
    <Layout>
      {/* Seção de Conexão */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2 ">
            <AlertCircle className="h-5 w-5" />
            Status da Conexão
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="conexaoStatus" className="flex items-center gap-4">
            <button
              onClick={testarConexao}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Testar Conexão
            </button>
            <span
              className={`${
                conexaoStatus.includes("Erro")
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {conexaoStatus}
            </span>
          </div>
        </CardContent>
      </Card>

      {/* Seção de Upload e Verificação da Nota */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload e Verificação da Nota
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div id="Upload de arquivo" className="space-y-4 flex flex-1 w-full">
            <div className="flex items-center gap-4 w-full ">
              <label className="block w-full flelx">
                <span className="sr-only w-full flex">Escolher arquivo</span>
                <input
                  type="file"
                  onChange={handleFileChange}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-lg file:border-0
                    file:text-sm file:font-semibold
                    file:bg-blue-50 file:text-blue-700
                    hover:file:bg-blue-100
                    cursor-pointer
                  "
                />
              </label>
              <button
                onClick={verificarNota}
                className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Verificar Nota
              </button>
              <p
                className={`text-sm font-medium ${
                  statusNota === "erro" ? "text-red-500" : ""
                }`}
              >
                <span className="font-bold">Status da Nota: </span>
                {statusNota === "liberada" ? (
                  <span className="text-green-600">Liberada</span>
                ) : statusNota === "bloqueada" ? (
                  <span className="text-red-600">Bloqueada</span>
                ) : statusNota === "não encontrada" ? (
                  <span className="text-gray-600">Não encontrada</span>
                ) : (
                  <span className="text-orange-600">Erro na verificação</span>
                )}
              </p>
            </div>
            <p
              className={`${
                statusNota.includes("Erro") ? "text-red-500" : "text-red-500"
              }`}
            >
              <span className="font-bold">Status da Nota: </span>
              {statusNota}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Informações do Emitente */}
      {emitente && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Informações do Emitente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">CNPJ</p>
                <p className="font-medium">{emitente.CNPJ}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{emitente.xNome}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Município</p>
                <p className="font-medium">{emitente.xMun}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium">{emitente.UF}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Informações do Destinatario */}
      {destinatario && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">
              Informações do Destinatario
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">CNPJ</p>
                <p className="font-medium">{destinatario.CNPJ}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Nome</p>
                <p className="font-medium">{destinatario.xNome}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Município</p>
                <p className="font-medium">{destinatario.xMun}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm text-gray-500">Estado</p>
                <p className="font-medium">{destinatario.UF}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Seção de Agendamento */}
      <Card>
        <CardHeader>
          <CardTitle className="text-xl flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Agendar Confirmação
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Data do Agendamento
              </label>
              <input
                type="date"
                value={dataAgendamento}
                onChange={(e) => setDataAgendamento(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                E-mail para Confirmação
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="seu@email.com"
              />
            </div>
          </div>
          <div className="mt-6">
            <button
              onClick={confirmarAgendamento}
              disabled={statusNota === "bloqueada"}
              className={
                statusNota === "bloqueada"
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }
            >
              Confirmar Agendamento
            </button>
            {statusNota === "bloqueada" && (
              <p className="text-red-600 text-sm mt-2">
                A nota não está disponível para agendamento, entre em contato
                com o comprador.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tabela de Itens (última seção) */}
      {items.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Itens da Nota</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      "Nº Item",
                      "Produto",
                      "EAN",
                      "Descrição",
                      "NCM",
                      "CFOP",
                      "Qtd",
                      "Valor Unit.",
                      "Total",
                    ].map((header) => (
                      <th
                        key={header}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.nItem}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.cProd}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.cEAN}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.xProd}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.NCM}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.CFOP}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {item.qCom}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(item.vUnCom).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {Number(item.vProd).toLocaleString("pt-BR", {
                          style: "currency",
                          currency: "BRL",
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </Layout>
  );
};

export default App;
