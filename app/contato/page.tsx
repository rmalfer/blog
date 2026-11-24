import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/utils';
import { Mail, MapPin, MessageSquare, ArrowUpRight, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contato e Redação',
  description:
    'Entre em contato com a redação e o editor-chefe Riccardo Malfer do portal Um Futuro Próximo pelo e-mail rmalfer@gmail.com.',
  alternates: {
    canonical: `${SITE_URL}/contato`,
  },
};

const CONTACT_TOPICS = [
  {
    title: 'Sugestões de Pauta & Imprensa',
    description: 'Envie comunicados oficiais, pesquisas acadêmicas ou sugestões de cobertura editorial.',
    subject: 'Sugestão de Pauta — Um Futuro Próximo',
  },
  {
    title: 'Correções & Feedback Editorial',
    description: 'Encontrou alguma imprecisão técnica ou quer contribuir com dados adicionais?',
    subject: 'Feedback Editorial — Um Futuro Próximo',
  },
  {
    title: 'Parcerias & Publicidade',
    description: 'Propostas comerciais, projetos especiais e colaborações com o portal.',
    subject: 'Parcerias e Publicidade — Um Futuro Próximo',
  },
  {
    title: 'Privacidade & Solicitações LGPD',
    description: 'Dúvidas sobre dados pessoais, cookies ou exercício de direitos previstos na LGPD.',
    subject: 'Solicitação LGPD — Um Futuro Próximo',
  },
];

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
          Canal direto com o editor-chefe Riccardo Malfer para sugestões de pauta, imprensa, correções, parcerias ou solicitações de privacidade.
        </p>
      </div>

      {/* Contato Direto */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        <div className="md:col-span-5 space-y-6">
          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <Mail className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-black">E-mail Direto da Redação</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              Para falar diretamente com <strong>Riccardo Malfer</strong>, clique no endereço abaixo para abrir seu aplicativo de e-mail:
            </p>
            <a
              href="mailto:rmalfer@gmail.com?subject=Contato%20—%20Um%20Futuro%20Pr%C3%B3ximo"
              className="inline-flex items-center gap-2 text-sm font-black text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-4 py-3 rounded-lg border border-emerald-200 break-all transition-colors"
            >
              <span>rmalfer@gmail.com</span>
              <ArrowUpRight className="w-4 h-4 shrink-0" />
            </a>
          </div>

          <div className="bg-white border border-neutral-200 rounded-2xl p-6 space-y-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
              <MapPin className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-black text-black">Localização & Expediente</h2>
            <p className="text-sm text-neutral-600 leading-relaxed">
              <strong>São Paulo — SP, Brasil</strong>
              <br />
              Atendimento editorial de segunda a sexta-feira, das 9h às 18h (Horário de Brasília — BRT).
            </p>
          </div>

          <div className="bg-neutral-50 border border-neutral-200 rounded-2xl p-6 space-y-2">
            <div className="flex items-center gap-2 text-emerald-700 font-bold text-xs uppercase tracking-wider">
              <ShieldCheck className="w-4 h-4" />
              <span>Privacidade & LGPD</span>
            </div>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Consulte nossa{' '}
              <Link href="/privacidade" className="text-emerald-700 font-bold underline">
                Política de Privacidade
              </Link>{' '}
              para informações sobre proteção de dados e gerenciamento de cookies.
            </p>
          </div>
        </div>

        {/* Atalhos diretos por assunto (links mailto limpos) */}
        <div className="md:col-span-7 bg-white border border-neutral-200 rounded-2xl p-6 sm:p-8 flex flex-col justify-between space-y-6">
          <div>
            <h2 className="text-xl font-black text-black mb-2">Escolha o assunto e envie um e-mail</h2>
            <p className="text-sm text-neutral-500 mb-6">
              Nosso atendimento é feito exclusivamente por e-mail direto para garantir agilidade e privacidade sem armazenar formulários de terceiros.
            </p>

            <div className="space-y-3">
              {CONTACT_TOPICS.map((topic) => (
                <a
                  key={topic.title}
                  href={`mailto:rmalfer@gmail.com?subject=${encodeURIComponent(topic.subject)}`}
                  className="group block p-4 rounded-xl border border-neutral-200 hover:border-emerald-500 hover:bg-emerald-50/40 transition-all"
                >
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-black text-black group-hover:text-emerald-700 transition-colors">
                      {topic.title}
                    </h3>
                    <ArrowUpRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 shrink-0" />
                  </div>
                  <p className="text-xs text-neutral-600 mt-1 leading-relaxed">
                    {topic.description}
                  </p>
                </a>
              ))}
            </div>
          </div>

          <div className="pt-4 border-t border-neutral-200">
            <a
              href="mailto:rmalfer@gmail.com?subject=Contato%20—%20Um%20Futuro%20Pr%C3%B3ximo"
              className="w-full inline-flex items-center justify-center gap-2 bg-black hover:bg-emerald-600 text-white font-extrabold text-xs uppercase tracking-wider px-6 py-4 rounded-xl transition-colors"
            >
              <Mail className="w-4 h-4 text-emerald-400" />
              <span>Escrever agora para rmalfer@gmail.com</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
