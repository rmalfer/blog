import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/utils';
import { Bot, Cpu, Award, CheckCircle2, Globe, BookOpen, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Sobre Nós e Expediente Editorial',
  description:
    'Conheça a missão jornalística, a metodologia de apuração, os princípios editoriais e o editor-chefe Riccardo Malfer do portal Um Futuro Próximo.',
  alternates: {
    canonical: `${SITE_URL}/sobre`,
  },
};

export default function SobrePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div className="bg-neutral-950 text-white rounded-2xl p-8 sm:p-10 border-b-4 border-emerald-500">
        <div className="inline-flex items-center gap-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded mb-3">
          <BookOpen className="w-3.5 h-3.5" />
          <span>Quem Somos & Expediente</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Sobre o Portal Um Futuro Próximo
        </h1>
        <p className="text-neutral-400 text-base sm:text-lg mt-3 max-w-2xl">
          Jornalismo especializado, análise técnica aprofundada e acompanhamento diário da revolução da Inteligência Artificial e da Robótica Corporificada.
        </p>
      </div>

      {/* Main Content */}
      <div className="article-body bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 space-y-6">
        <h2>Nossa Missão Editorial</h2>
        <p>
          O <strong>Um Futuro Próximo</strong> (<a href="https://umfuturoproximo.com.br">umfuturoproximo.com.br</a>) nasceu com um propósito claro: oferecer ao público de língua portuguesa uma cobertura jornalística rigorosa, analítica e livre de sensacionalismo sobre as tecnologias que estão redesenhando a economia, a ciência e a vida humana no século XXI.
        </p>
        <p>
          Enquanto o noticiário generalista frequentemente aborda a tecnologia apenas de forma superficial, nosso portal aprofunda-se nos aspectos arquiteturais, estratégicos, regulatórios e práticos de quatro grandes eixos transformadores:
        </p>
        <ul>
          <li>
            <strong><Link href="/categoria/inteligencia-artificial">Inteligência Artificial</Link>:</strong> Modelos de linguagem e raciocínio de fronteira (LLMs), agentes autônomos, arquiteturas abertas (como Gemma e Ollama), infraestrutura de semicondutores e governança algorítmica global.
          </li>
          <li>
            <strong><Link href="/categoria/robos-humanoides">Robôs Humanoides</Link>:</strong> A transição histórica da IA digital para a <em>Inteligência Artificial Corporificada (Embodied AI)</em>, modelos Visão-Linguagem-Ação (VLA), atuadores eletromecânicos e a implantação industrial e doméstica de robôs bípedes.
          </li>
          <li>
            <strong><Link href="/categoria/saude-biotec">Saúde & Biotecnologia</Link>:</strong> Descoberta computacional de fármacos, design de proteínas por IA, robótica cirúrgica autônoma, medicina diagnóstica preditiva e tecnologias para longevidade.
          </li>
          <li>
            <strong><Link href="/categoria/startups-futuro">Startups & Futuro</Link>:</strong> Movimentações de capital de risco (Venture Capital), IPOs de empresas de Deep Tech, fusões e aquisições estratégicas e projeções macroeconômicas.
          </li>
        </ul>

        <h2>Sobre o Fundador e Editor-Chefe</h2>
        <div className="bg-neutral-950 text-white rounded-2xl p-6 sm:p-8 my-6 border-l-4 border-emerald-500 flex flex-col sm:flex-row gap-6 items-start sm:items-center">
          <div className="w-20 h-20 rounded-full bg-emerald-500 text-black font-black text-3xl flex items-center justify-center shrink-0">
            RM
          </div>
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h3 className="text-xl font-black text-white m-0">Riccardo Malfer</h3>
              <span className="text-xs bg-neutral-800 text-emerald-400 px-2.5 py-1 rounded font-bold uppercase">
                Fundador & Editor-Chefe
              </span>
            </div>
            <p className="text-sm text-neutral-300 leading-relaxed m-0">
              Especialista em Inteligência Artificial, arquiteturas cognitivas, automação avançada e robótica humanoide. Com atuação em São Paulo (SP), conduz a curadoria, verificação técnica e edição das análises publicadas no portal <strong>Um Futuro Próximo</strong>, traduzindo avanços científicos e corporativos complexos em informação clara e acionável para profissionais, pesquisadores e entusiastas.
            </p>
          </div>
        </div>

        <h2>Princípios Editoriais, Fontes e Metodologia</h2>
        <p>
          Nosso trabalho segue padrões estritos de integridade editorial e transparência:
        </p>
        <ul>
          <li>
            <strong>Verificação em Fontes Primárias:</strong> Todas as matérias publicadas trazem a referência direta à fonte original do fato (comunicados técnicos oficiais, relatórios regulatórios, papers científicos no arXiv/Nature ou agências internacionais de notícias como Reuters, Bloomberg e TechCrunch).
          </li>
          <li>
            <strong>Contextualização e Valor Analítico:</strong> Não reproduzimos comunicados de imprensa de forma mecânica. Cada reportagem é estruturada para explicar o contexto técnico, como a tecnologia funciona na prática, suas implicações competitivas no mercado global e os desdobramentos futuros.
          </li>
          <li>
            <strong>Independência e Distinção Publicitária:</strong> O conteúdo editorial é financeiramente sustentado por publicidade programática (Google AdSense) devidamente identificada. Nenhuma decisão editorial ou análise crítica é influenciada por anunciantes.
          </li>
          <li>
            <strong>Política de Correções:</strong> Caso seja identificada qualquer imprecisão técnica ou factual em nossas publicações, realizamos a atualização imediata do texto mantendo total transparência com o leitor.
          </li>
        </ul>

        <h2>Expediente e Informações Institucionais</h2>
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 text-sm space-y-2">
          <p className="m-0"><strong>Nome do Portal:</strong> Um Futuro Próximo</p>
          <p className="m-0"><strong>Domínio Oficial:</strong> <a href="https://umfuturoproximo.com.br">https://umfuturoproximo.com.br</a></p>
          <p className="m-0"><strong>Direção Editorial e Curadoria:</strong> Riccardo Malfer</p>
          <p className="m-0"><strong>Sede Editorial:</strong> São Paulo — SP, Brasil</p>
          <p className="m-0"><strong>E-mail da Redação:</strong> <a href="mailto:contato@umfuturoproximo.com.br">contato@umfuturoproximo.com.br</a></p>
          <p className="m-0"><strong>Canal de Atendimento:</strong> <Link href="/contato">Página de Contato</Link></p>
        </div>
      </div>
    </div>
  );
}
