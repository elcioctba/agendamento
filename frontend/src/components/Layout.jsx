import React from "react";
import { Truck } from "lucide-react"; // Importe o ícone Truck

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cabeçalho fixo */}
      <header className="fixed top-0 left-0 w-full bg-white shadow-md z-50 py-4">
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <Truck className="h-8 w-8" />
          Sistema de Agendamento de Descarga
        </h1>
      </header>

      {/* Conteúdo principal */}
      <main className="pt-24 px-4">
        <div className="max-w-7xl mx-auto space-y-6">{children}</div>
      </main>

      {/* Rodapé (opcional) */}
      <footer className="bg-gray-800 text-white text-center p-4 mt-8">
        <p>Rodapé</p>
      </footer>
    </div>
  );
};

export default Layout;
