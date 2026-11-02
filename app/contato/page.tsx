import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/utils';
import { Mail, MapPin, MessageSquare, Send, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contato e Redação',
  description:
    'Entre em contato com a redação e o editor-chefe Riccardo Malfer do portal Um Futuro Próximo para envio de pautas, sugestões, imprensa, publicidade e solicitações LGPD.',
  alternates: {
    canonical: `${SITE_URL}/contato`,
  },
};

export default function ContatoPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div className="bg-neutral-950 text-white rounded-2xl p-8 sm:p-10 border-b-4 border-emerald-500">
        <div className="inline-flex items-center gap-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded mb-3">
          <MessageSquare className="w-3.5 h-3.5" />
          <span>Atendimento & Redação</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Fale com o Um Futuro Próximo
        </h1>
        <p className="text-neutral-400 text-base sm:text-lg mt-3 max-w-2xl">
          Canal direto com a nossa editoria para sugestões de pauta, comunicados de imprensa, parcerias comerciais, correções ou solicitações de privacidade.
        </p>
      </div>

      {/* Grid de Canais + Informações */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-black">E-mail Direto da Redação</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Para pautas jornalísticas, press releases, solicitações de parceria ou contato direto com o editor-chefe <strong>Riccardo Malfer</strong>:
            </p>
            <a
              href="mailto:contato@umfuturoproximo.com.br"
              className="inline-block text-sm font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 px-4 py-2.5 rounded-lg border border-emerald-200 break-all"
            >
              contato@umfuturoproximo.com.br
            </a>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-black">Localização & Expediente</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              <strong>São Paulo — SP, Brasil</strong><br />
              Atendimento editorial de segunda a sexta-feira, das 9h às 18h (Horário de Brasília — BRT).
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacidade & LGPD</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Consulte nossa <Link href="/privacidade" className="text-emerald-700 font-bold underline">Política de Privacidade</Link> para informações sobre proteção de dados e gerenciamento de cookies.
            </p>
          </div>
        </div>

        {/* Formulário de Contato via mailto estruturado */}
        <div className="md:col-span-7 bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8">
          <h2 className="text-xl font-black text-black mb-2">Envie uma Mensagem</h2>
          <p className="text-sm text-neutral-500 mb-6">
            Preencha os campos abaixo para encaminhar sua mensagem diretamente à nossa caixa editorial.
          </p>

          <form
            action="mailto:contato@umfuturoproximo.com.br"
            method="post"
            encType="text/plain"
            className="space-y-4"
          >
            <div>
              <label htmlFor="nome" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Seu Nome Completo *
              </label>
              <input
                id="nome"
                name="Nome"
                type="text"
                required
                placeholder="Ex: João Silva"
                className="w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Seu E-mail *
              </label>
              <input
                id="email"
                name="Email"
                type="email"
                required
                placeholder="seuemail@exemplo.com.br"
                className="w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <label htmlFor="assunto" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Assunto *
              </label>
              <select
                id="assunto"
                name="Assunto"
                className="w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500 bg-white"
              >
                <option value="Sugestão de Pauta / Imprensa">Sugestão de Pauta / Imprensa</option>
                <option value="Dúvida ou Correção Editorial">Dúvida ou Correção Editorial</option>
                <option value="Publicidade e Parcerias">Publicidade e Parcerias</option>
                <option value="Privacidade e Proteção de Dados (LGPD)">Privacidade e Proteção de Dados (LGPD)</option>
                <option value="Outros Assuntos">Outros Assuntos</option>
              </select>
            </div>

            <div>
              <label htmlFor="mensagem" className="block text-xs font-bold uppercase tracking-wider text-neutral-700 mb-1">
                Mensagem *
              </label>
              <textarea
                id="mensagem"
                name="Mensagem"
                rows={5}
                required
                placeholder="Escreva sua mensagem com detalhes..."
                className="w-full px-4 py-2.5 text-sm border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
              />
            </div>

            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-black hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-3.5 rounded-lg transition-colors"
            >
              <Send className="w-4 h-4 text-emerald-400" />
              <span>Enviar Mensagem para a Redação</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
