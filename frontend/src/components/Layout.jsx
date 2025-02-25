import React from "react";
import { Truck } from "lucide-react";

const Layout = ({ children }) => {
  return (
    <div className="w-full h-full bg-gray-50 flex flex-col">
      <div>
        {/* Cabeçalho fixo */}
        <header
          id="Cabeçalho Fixo"
          className="fixed top-0 left-0 w-full bg-white shadow-md z-50 py-4"
        >
          <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
            <Truck className="h-8 w-8" />
            Sistema de Agendamento de Descarga
          </h1>
        </header>
      </div>
      <div id="Conteúdo Principal" className="w-full flex-1 flex flex-col">
        {/* Conteúdo principal */}
        <main className="w-full h-full">
          <div className="w-full max-w-7xl mx-auto space-y-6 pb-8">
            {children}
          </div>
        </main>
      </div>
      <div>
        {/* Rodapé (opcional) */}
        <footer id="Rodapé" className="bg-gray-800 text-white text-center p-4">
          <p>Rodapé</p>
        </footer>
      </div>
    </div>
  );
};

export default Layout;
