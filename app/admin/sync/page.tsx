'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Bot, CheckCircle, RefreshCw, Terminal, Layers, FileSpreadsheet } from 'lucide-react';

export default function SyncAdminPage() {
  const [syncing, setSyncing] = useState(false);
  const [output, setOutput] = useState<string | null>(null);

  const triggerLocalSync = () => {
    setOutput(
      `[INFO] O processamento das notícias utiliza o modelo gemma4:12b rodando no seu Ollama local.\n` +
      `Para executar a ingestão completa com inteligência artificial na sua máquina:\n\n` +
      `1. Abra o terminal na pasta c:\\Projetos\\blog\n` +
      `2. Execute o comando:\n   python main_supabase.py\n\n` +
      `Ele lerá as planilhas de IA e Robôs Humanoides, gerará as matérias com o Gemma 4:12b,\n` +
      `extrairá as imagens de capa, subirá no Supabase e marcará as planilhas com a URL do novo portal!`
    );
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel</span>
        </Link>
        <span className="text-xs font-mono text-neutral-400">Pipeline Local Ollama + Sheets</span>
      </div>

      <div>
        <h1 className="text-3xl font-black text-black tracking-tight">
          Central de Sincronização & IA
        </h1>
        <p className="text-xs text-neutral-500 mt-1">
          Monitoramento das fontes do Google Drive (Planilhas) e orquestração do pipeline com Ollama local.
        </p>
      </div>

      {/* Fontes Configuradas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Planilha 1: Inteligência Artificial</span>
          </div>
          <h3 className="font-bold text-black text-sm">
            Notícias de IA, Modelos e Regulação
          </h3>
          <p className="text-xs font-mono text-neutral-500 break-all">
            ID: 1TpSIKlRNKmmGJJmR87q4MH3bIJFTj76lAZCs1iqtloA
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Conectada e autenticada via Google API</span>
          </div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 space-y-3">
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Planilha 2: Robôs Humanoides</span>
          </div>
          <h3 className="font-bold text-black text-sm">
            Robótica Corporificada, Optimus & Autonomia
          </h3>
          <p className="text-xs font-mono text-neutral-500 break-all">
            ID: 1RAiO7u8r9IpOW6B4-5sI5rx2aM5TcN9PrlacRjynD5Y
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs font-semibold text-emerald-700">
            <CheckCircle className="w-3.5 h-3.5" />
            <span>Conectada e autenticada via Google API</span>
          </div>
        </div>
      </div>

      {/* Instruções do Pipeline */}
      <div className="bg-black text-white rounded-xl p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-400">
          <Terminal className="w-4 h-4" />
          <span>Como Rodar a Ingestão Automática Local</span>
        </div>
        <h3 className="text-xl font-black text-white">
          Execução via Linha de Comando (Python + Ollama Gemma)
        </h3>
        <p className="text-xs text-neutral-300 leading-relaxed max-w-2xl">
          Como o modelo de linguagem roda localmente na sua máquina para máxima privacidade e custo zero de API, o pipeline é executado pelo script Python especializado:
        </p>

        <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-4 font-mono text-xs text-emerald-300">
          <div># Execução padrão (lê pendências, resume com Gemma e sobe para o Supabase):</div>
          <div className="text-white font-bold mt-1">python main_supabase.py</div>
          <div className="mt-3 text-neutral-400"># Ou para teste sem publicar (modo de simulação):</div>
          <div className="text-white font-bold mt-1">python main_supabase.py --dry-run</div>
        </div>

        <button
          onClick={triggerLocalSync}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase rounded-lg transition-colors"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Verificar Instruções Detalhadas</span>
        </button>

        {output && (
          <div className="mt-4 p-4 bg-neutral-950 border border-neutral-800 rounded-lg font-mono text-xs text-neutral-300 whitespace-pre-wrap">
            {output}
          </div>
        )}
      </div>
    </div>
  );
}
