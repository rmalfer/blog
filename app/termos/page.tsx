import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/utils';
import { Scale } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Termos e Condições de Uso',
  description:
    'Termos e Condições de Uso, direitos de propriedade intelectual e limites de responsabilidade do portal de notícias Um Futuro Próximo.',
  alternates: {
    canonical: `${SITE_URL}/termos`,
  },
};

export default function TermosPage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div className="bg-neutral-950 text-white rounded-2xl p-8 sm:p-10 border-b-4 border-emerald-500">
        <div className="inline-flex items-center gap-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded mb-3">
          <Scale className="w-3.5 h-3.5" />
          <span>Diretrizes Legais</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Termos e Condições de Uso
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base mt-3">
          Regras de acesso, utilização do conteúdo editorial, direitos autorais e responsabilidades aplicáveis ao portal Um Futuro Próximo.
        </p>
        <p className="text-xs text-neutral-500 mt-4">
          Vigência: 1 de novembro de 2026
        </p>
      </div>

      {/* Content */}
      <div className="article-body bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 space-y-6">
        <p>
          Bem-vindo ao portal <strong>Um Futuro Próximo</strong> (<a href="https://umfuturoproximo.com.br">https://umfuturoproximo.com.br</a>). Ao acessar e navegar pelas nossas páginas, reportagens e serviços informativos, você concorda integralmente com os presentes Termos e Condições de Uso e com a nossa <Link href="/privacidade">Política de Privacidade</Link>.
        </p>

        <h2>1. Objeto e Natureza do Portal</h2>
        <p>
          O <strong>Um Futuro Próximo</strong> é um veículo independente de jornalismo digital e análise tecnológica dedicado à cobertura de Inteligência Artificial, Robôs Humanoides, Saúde & Biotecnologia e Startups. Todo o conteúdo disponibilizado tem caráter estritamente informativo, jornalístico e educacional.
        </p>

        <h2>2. Propriedade Intelectual e Citações</h2>
        <p>
          Os textos analíticos, estrutura editorial, identidade visual, logotipos e organização de conteúdo publicados neste portal são protegidos pela Lei de Direitos Autorais brasileira (Lei nº 9.610/1998) e tratados internacionais.
        </p>
        <ul>
          <li>
            É permitida a citação de trechos curtos de nossas matérias para fins jornalísticos, acadêmicos ou informativos, desde que acompanhada de <strong>atribuição clara de autoria ao portal &ldquo;Um Futuro Próximo&rdquo;</strong> e de um link direto (hyperlink ativo) para a URL original da reportagem.
          </li>
          <li>
            É expressamente proibida a cópia integral automatizada (scraping comercial não autorizado para republicação integral) ou reprodução com finalidade comercial sem autorização prévia por escrito da editoria.
          </li>
          <li>
            Marcas registradas, nomes de produtos e imagens de divulgação citados nas reportagens pertencem aos seus respectivos proprietários e fontes originais devidamente creditadas.
          </li>
        </ul>

        <h2>3. Isenção de Responsabilidade Financeira, Médica e Técnica</h2>
        <p>
          Nossas reportagens abordam frequentemente empresas de capital aberto, rodadas de investimento, ofertas públicas iniciais (IPOs), bem como avanços científicos em biotecnologia e medicina diagnóstica:
        </p>
        <ul>
          <li>
            <strong>Não constitui recomendação de investimento:</strong> Nenhuma matéria ou análise publicada no portal deve ser interpretada como recomendação de compra, venda ou manutenção de ativos financeiros, ações ou valores mobiliários.
          </li>
          <li>
            <strong>Não substitui orientação médica:</strong> Artigos na editoria de <Link href="/categoria/saude-biotec">Saúde & Biotec</Link> relatam pesquisas científicas e inovações tecnológicas, não substituindo em nenhuma hipótese o diagnóstico ou acompanhamento por médicos e profissionais de saúde habilitados.
          </li>
        </ul>

        <h2>4. Links Externos e Publicidade de Terceiros</h2>
        <p>
          Nossas páginas exibem links para fontes externas de referência e anúncios publicitários gerenciados por redes parceiras como o <strong>Google AdSense</strong>. O portal não endossa nem se responsabiliza por produtos, serviços ou políticas de sites de terceiros acessados a partir de links ou banners publicitários.
        </p>

        <h2>5. Alterações dos Termos e Foro Aplicável</h2>
        <p>
          Estes Termos de Uso podem ser atualizados periodicamente para refletir melhorias no portal ou alterações legislativas. Os presentes Termos são regidos pelas leis da República Federativa do Brasil, ficando eleito o Foro da Comarca da Capital do Estado de São Paulo (SP) para dirimir eventuais controvérsias.
        </p>
      </div>
    </div>
  );
}
