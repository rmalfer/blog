import React from 'react';
import { getPublishedArticles, getFeaturedArticles, getTrendingArticles } from '@/lib/supabase';
import { HeroStory } from '@/components/HeroStory';
import { ArticleCard } from '@/components/ArticleCard';
import { Sidebar } from '@/components/Sidebar';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { Article } from '@/lib/types';
import Link from 'next/link';
import { Bot, Cpu, Sparkles, ArrowRight } from 'lucide-react';

// Amostra editorial inicial caso a base de dados ainda esteja aguardando o primeiro sync
const INITIAL_DEMO_ARTICLES: Article[] = [
  {
    id: 'demo-1',
    title: 'A Nova Fronteira dos Robôs Humanoides: Autonomia Física e Modelos Visão-Linguagem-Ação',
    slug: 'nova-fronteira-robos-humanoides-autonomia-fisica-vla',
    excerpt: 'Como a convergência entre modelos multimodais de ponta e nova geração de atuadores eletromecânicos está viabilizando a produção em massa de robôs bípedes em 2026.',
    content: '<p>A robótica humanoide está vivenciando o momento mais transformador de sua história. Se nos últimos cinco anos o foco principal da inteligência artificial foi a linguagem textual e a geração visual em telas, o ano de 2026 marca a consolidação definitiva da <strong>Inteligência Artificial Corporificada (Embodied AI)</strong>.</p><p>Empresas globais como BYD, Tesla com o Optimus V3, Unitree e AgiBot aceleraram drasticamente suas linhas de montagem, projetando a fabricação de mais de 100 mil unidades até o fim deste ciclo. Essa mudança de paradigma é impulsionada pelos modelos <strong>Vision-Language-Action (VLA)</strong>, que permitem aos robôs compreender o espaço tridimensional, planejar rotas e manipular objetos complexos em ambientes dinâmicos e não-estruturados.</p><p>Além da manufatura pesada, setores como logística hospitalar e assistência residencial começam a receber os primeiros testes em escala real, inaugurando uma nova era para a produtividade humana.</p>',
    category_name: 'Robôs Humanoides',
    category_slug: 'robos-humanoides',
    image_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?auto=format&fit=crop&w=1200&q=80',
    source_url: 'https://umfuturoproximo.vercel.app',
    author_name: 'Riccardo Malfer',
    author_role: 'Editor & Especialista em IA',
    status: 'published',
    is_featured: true,
    reading_time: '4 min de leitura',
    views_count: 1420,
    published_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-2',
    title: 'Modelos de Raciocínio Aberto e a Nova Geração Gemma: Otimização Extrema em Hardware Local',
    slug: 'modelos-raciocinio-aberto-geracao-gemma-hardware-local',
    excerpt: 'Análise detalhada sobre como novos modelos abertos estão superando fronteiras de raciocínio lógico mantendo execução ultra-rápida em máquinas locais.',
    content: '<p>A capacidade de executar inteligência artificial de altíssimo nível diretamente em estações de trabalho locais, sem depender de nuvens externas para tarefas confidenciais, tornou-se prioridade para desenvolvedores e pesquisadores.</p><p>Com os novos lançamentos da família Gemma e ecossistemas como Ollama, a barreira de entrada para automações de alto calibre e análises contextuais densas caiu de forma espetacular. A arquitetura de decodificação eficiente garante tempos de resposta inferiores a 50 milissegundos por token em GPUs convencionais.</p>',
    category_name: 'Inteligência Artificial',
    category_slug: 'inteligencia-artificial',
    image_url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=800&q=80',
    source_url: 'https://umfuturoproximo.vercel.app',
    author_name: 'Riccardo Malfer',
    author_role: 'Editor & Especialista em IA',
    status: 'published',
    is_featured: false,
    reading_time: '3 min de leitura',
    views_count: 980,
    published_at: new Date(Date.now() - 3600000 * 2).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-3',
    title: 'IA e Biologia Sintética: Diagnósticos Moleculares Ultra-Precoces Entram em Fases Clínicas',
    slug: 'ia-biologia-sintetica-diagnosticos-moleculares-fases-clinicas',
    excerpt: 'Plataformas algorítmicas de predição molecular começam a identificar anomalias celulares anos antes dos primeiros sintomas perceptíveis.',
    content: '<p>O casamento entre biotecnologia e aprendizado profundo computacional está redefinindo os fundamentos da medicina preventiva moderna.</p><p>Redes neurais treinadas em dados proteômicos maciços agora conseguem mapear padrões sutis de dobramento e mutações genéticas com precisão cirúrgica, acelerando testes clínicos que antes levavam décadas.</p>',
    category_name: 'Saúde & Biotec',
    category_slug: 'saude-biotec',
    image_url: 'https://images.unsplash.com/photo-1532187863486-abf9dbad1b69?auto=format&fit=crop&w=800&q=80',
    source_url: 'https://umfuturoproximo.vercel.app',
    author_name: 'Riccardo Malfer',
    author_role: 'Editor & Especialista em IA',
    status: 'published',
    is_featured: false,
    reading_time: '3 min de leitura',
    views_count: 750,
    published_at: new Date(Date.now() - 3600000 * 5).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'demo-4',
    title: 'União Europeia Aplica Regras Finais de Transparência para Sistemas Autônomos',
    slug: 'uniao-europeia-aplica-regras-finais-transparencia-sistemas-autonomos',
    excerpt: 'Novos requisitos do Artigo 50 do AI Act entram em vigor em escala global, exigindo rotulagem mandatória para síntese algorítmica.',
    content: '<p>As diretrizes internacionais de governança para tecnologias emergentes ganham força executiva com a implementação prática das medidas regulatórias europeias.</p>',
    category_name: 'Inteligência Artificial',
    category_slug: 'inteligencia-artificial',
    image_url: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=800&q=80',
    source_url: 'https://umfuturoproximo.vercel.app',
    author_name: 'Riccardo Malfer',
    author_role: 'Editor & Especialista em IA',
    status: 'published',
    is_featured: false,
    reading_time: '4 min de leitura',
    views_count: 620,
    published_at: new Date(Date.now() - 3600000 * 10).toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const revalidate = 60; // Revalida a cada 60 segundos no Vercel

export default async function HomePage() {
  const dbArticles = await getPublishedArticles({ limit: 15 });
  const articles = dbArticles.length > 0 ? dbArticles : INITIAL_DEMO_ARTICLES;

  const featured = articles.filter((a) => a.is_featured);
  const heroArticles = featured.length >= 4 ? featured : articles.slice(0, 4);
  const feedArticles = articles.slice(heroArticles.length);
  const trendingArticles = await getTrendingArticles(5);
  const trending = trendingArticles.length > 0 ? trendingArticles : articles.slice(0, 5);

  // Destaques de Robôs Humanoides
  const humanoidArticles = articles.filter(
    (a) => a.category_slug === 'robos-humanoides'
  ).slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Hero Section Estilo TechCrunch */}
      <HeroStory articles={heroArticles} />

      {/* Leaderboard AdSense Top Banner */}
      <AdSenseSlot slotId="728x90_top" format="horizontal" label="PUBLICIDADE" />

      {/* Main Feed + Sidebar Grid (8 cols + 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Coluna Esquerda: Fluxo de Notícias Recentes */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              Últimas Notícias & Análises
            </h2>
            <span className="text-xs font-semibold text-neutral-400">
              Atualizado em tempo real
            </span>
          </div>

          <div className="divide-y divide-neutral-200">
            {feedArticles.length > 0 ? (
              feedArticles.map((article) => (
                <ArticleCard key={article.id || article.slug} article={article} />
              ))
            ) : (
              articles.map((article) => (
                <ArticleCard key={article.id || article.slug} article={article} />
              ))
            )}
          </div>
        </div>

        {/* Coluna Direita: Sidebar TechCrunch */}
        <div className="lg:col-span-4">
          <Sidebar trendingArticles={trending} />
        </div>
      </div>

      {/* Especial: Vitrine de Robôs Humanoides */}
      {humanoidArticles.length > 0 && (
        <section className="bg-neutral-950 text-white rounded-2xl p-8 my-16 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-800 pb-6 mb-8">
            <div>
              <span className="text-emerald-400 text-xs font-black uppercase tracking-widest flex items-center gap-2 mb-1">
                <Cpu className="w-4 h-4" />
                Série Especial
              </span>
              <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                A Era dos Robôs Humanoides
              </h2>
            </div>
            <Link
              href="/categoria/robos-humanoides"
              className="inline-flex items-center gap-2 text-sm font-extrabold text-emerald-400 hover:text-emerald-300 uppercase tracking-wider"
            >
              <span>Ver todas as notícias</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {humanoidArticles.map((item) => (
              <Link
                key={item.id || item.slug}
                href={`/noticia/${item.slug}`}
                className="group flex flex-col bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden hover:border-emerald-500/50 transition-all"
              >
                {item.image_url && (
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-neutral-800">
                    <img
                      src={item.image_url}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-5 flex flex-col flex-1">
                  <span className="text-[10px] font-bold text-emerald-400 uppercase tracking-wider mb-2">
                    Robótica Avançada
                  </span>
                  <h3 className="text-base font-bold text-white group-hover:text-emerald-400 transition-colors line-clamp-2 mb-2 leading-snug">
                    {item.title}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 mt-auto">
                    {item.excerpt}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
