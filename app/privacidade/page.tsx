import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { SITE_URL } from '@/lib/utils';
import { Shield, Lock, Cookie, FileText, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Política de Privacidade e Cookies (LGPD)',
  description:
    'Política de Privacidade, Proteção de Dados Pessoais (LGPD) e Uso de Cookies e Publicidade (Google AdSense) do portal Um Futuro Próximo.',
  alternates: {
    canonical: `${SITE_URL}/privacidade`,
  },
};

export default function PrivacidadePage() {
  return (
    <div className="max-w-4xl mx-auto space-y-10 py-4">
      {/* Header */}
      <div className="bg-neutral-950 text-white rounded-2xl p-8 sm:p-10 border-b-4 border-emerald-500">
        <div className="inline-flex items-center gap-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded mb-3">
          <Shield className="w-3.5 h-3.5" />
          <span>Transparência & Conformidade Legal</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          Política de Privacidade e Cookies
        </h1>
        <p className="text-neutral-400 text-sm sm:text-base mt-3">
          Em conformidade com a Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018 — LGPD), Marco Civil da Internet (Lei nº 12.965/2014) e Políticas do Programa Google AdSense.
        </p>
        <p className="text-xs text-neutral-500 mt-4">
          Última atualização: 1 de novembro de 2026
        </p>
      </div>

      {/* Content */}
      <div className="article-body bg-white border border-neutral-200 rounded-2xl p-6 sm:p-10 space-y-6">
        <p>
          A sua privacidade e a proteção dos seus dados pessoais são prioridades fundamentais para o portal <strong>Um Futuro Próximo</strong> (<a href="https://umfuturoproximo.com.br">https://umfuturoproximo.com.br</a>), editado sob a responsabilidade de <strong>Riccardo Malfer</strong>. Esta Política de Privacidade descreve de maneira clara e transparente quais informações coletamos, como as utilizamos, armazenamos e protegemos, bem como os seus direitos como titular de dados.
        </p>

        <h2>1. Coleta de Dados e Informações de Navegação</h2>
        <p>
          Durante a sua visita ao portal <strong>Um Futuro Próximo</strong>, podemos coletar dois tipos de informações:
        </p>
        <ul>
          <li>
            <strong>Dados fornecidos voluntariamente pelo usuário:</strong> Nome e endereço de e-mail quando você opta por assinar nossa newsletter informativa (&ldquo;Boletim Semanal de Tecnologia&rdquo;) ou quando entra em contato diretamente com nossa equipe editorial por meio da página de <Link href="/contato">Contato</Link>.
          </li>
          <li>
            <strong>Dados coletados automaticamente (Logs e Telemetria):</strong> Como ocorre na maioria dos portais jornalísticos, nossos servidores e ferramentas analíticas registram automaticamente informações técnicas não identificáveis individualmente, incluindo endereço de protocolo de Internet (IP) anonimizado, tipo de navegador (browser), provedor de serviços de Internet (ISP), páginas de referência/saída, sistema operacional, data/hora de acesso e métricas de desempenho da página.
          </li>
        </ul>

        <h2>2. Uso de Cookies e Publicidade do Google AdSense</h2>
        <p>
          O portal <strong>Um Futuro Próximo</strong> utiliza cookies e tecnologias semelhantes para melhorar a experiência de leitura, analisar o tráfego do site e financiar a produção jornalística independente por meio de publicidade digital.
        </p>
        <p>
          Especificamente em relação à veiculação de anúncios pelo <strong>Google AdSense</strong>, informamos que:
        </p>
        <ul>
          <li>
            Fornecedores de terceiros, incluindo o <strong>Google</strong>, utilizam cookies para veicular anúncios com base nas visitas anteriores do usuário ao nosso website ou a outros websites na Internet.
          </li>
          <li>
            Com o uso de cookies de publicidade (como o cookie <em>DoubleClick DART</em>), o Google e os seus parceiros podem veicular anúncios relevantes para os usuários com base nas visitas feitas ao <strong>Um Futuro Próximo</strong> e/ou a outros sites na Internet.
          </li>
          <li>
            Os usuários podem desativar a publicidade personalizada a qualquer momento acessando as <strong>Configurações de Anúncios do Google</strong> em <a href="https://adssettings.google.com" target="_blank" rel="noopener noreferrer">https://adssettings.google.com</a> ou na Central de Privacidade e Termos do Google em <a href="https://policies.google.com/technologies/ads" target="_blank" rel="noopener noreferrer">https://policies.google.com/technologies/ads</a>.
          </li>
          <li>
            Alternativamente, você também pode desativar o uso de cookies de fornecedores terceiros para publicidade personalizada acessando o portal <a href="https://www.aboutads.info/choices/" target="_blank" rel="noopener noreferrer">www.aboutads.info</a> ou gerenciando as permissões de cookies diretamente nas configurações do seu navegador.
          </li>
        </ul>

        <h2>3. Ferramentas de Análise de Tráfego (Google Analytics e Tag Manager)</h2>
        <p>
          Utilizamos o <strong>Google Analytics 4 (GA4)</strong> e o <strong>Google Tag Manager (GTM)</strong> para compreender de forma agregada e estatística como os leitores interagem com nossas reportagens, quais temas de Inteligência Artificial e Robótica despertam maior interesse e como otimizar a velocidade e a acessibilidade do site. Os dados coletados pelo Google Analytics são processados de maneira agregada, sem identificar pessoalmente o leitor.
        </p>

        <h2>4. Finalidade do Tratamento de Dados e Bases Legais (LGPD)</h2>
        <p>
          Nos termos da <strong>Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018)</strong>, o tratamento de dados realizado pelo portal fundamenta-se nas seguintes hipóteses legais:
        </p>
        <ul>
          <li><strong>Consentimento do titular (Art. 7º, I da LGPD):</strong> Para envio de boletins informativos por e-mail e personalização de preferências de cookies.</li>
          <li><strong>Legítimo interesse (Art. 7º, IX da LGPD):</strong> Para análise de desempenho editorial, segurança cibernética do portal, prevenção a fraudes e manutenção da infraestrutura técnica.</li>
          <li><strong>Cumprimento de obrigação legal ou regulatória (Art. 7º, II da LGPD):</strong> Guarda de registros de conexão conforme exigido pelo Marco Civil da Internet.</li>
        </ul>

        <h2>5. Seus Direitos como Titular de Dados</h2>
        <p>
          Você possui pleno controle sobre seus dados pessoais e pode, a qualquer momento e gratuitamente, solicitar ao nosso Encarregado de Proteção de Dados:
        </p>
        <ul>
          <li>Confirmação da existência de tratamento e acesso aos seus dados;</li>
          <li>Correção de dados incompletos, inexatos ou desatualizados;</li>
          <li>Anonimização, bloqueio ou eliminação de dados desnecessários ou tratados em desconformidade com a LGPD;</li>
          <li>Revogação do consentimento e descadastramento imediato da nossa newsletter.</li>
        </ul>

        <h2>6. Segurança e Links para Sites Externos</h2>
        <p>
          Todas as conexões com o portal <strong>Um Futuro Próximo</strong> são protegidas por criptografia SSL/TLS (HTTPS). Nossas matérias jornalísticas frequentemente citam e incluem links para fontes primárias oficiais (como artigos científicos, órgãos reguladores, universidades e comunicados de imprensa). Não nos responsabilizamos pelas práticas de privacidade de sites externos, recomendando que o leitor consulte a política de privacidade de cada domínio visitado.
        </p>

        <h2>7. Contato do Controlador e Encarregado (DPO)</h2>
        <p>
          Para esclarecer dúvidas sobre esta Política de Privacidade, exercer seus direitos previstos na LGPD ou tratar de questões relacionadas a dados e publicidade, entre em contato diretamente com nossa editoria:
        </p>
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 my-4 text-sm space-y-1">
          <p className="mb-1"><strong>Portal:</strong> Um Futuro Próximo (<a href="https://umfuturoproximo.com.br">umfuturoproximo.com.br</a>)</p>
          <p className="mb-1"><strong>Responsável Editorial e Encarregado de Dados:</strong> Riccardo Malfer</p>
          <p className="mb-1"><strong>E-mail de Contato:</strong> <a href="mailto:contato@umfuturoproximo.com.br">contato@umfuturoproximo.com.br</a></p>
          <p className="mb-0"><strong>Localização:</strong> São Paulo — SP, Brasil</p>
        </div>
      </div>
    </div>
  );
}
