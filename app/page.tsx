import React from 'react';
import { getPublishedArticles, getFeaturedArticles, getTrendingArticles } from '@/lib/supabase';
import { HeroStory } from '@/components/HeroStory';
import { ArticleCard } from '@/components/ArticleCard';
import { Sidebar } from '@/components/Sidebar';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import Link from 'next/link';
import { Bot, Cpu, Sparkles, ArrowRight, Search, X } from 'lucide-react';

export const revalidate = 60; // Revalida a cada 60 segundos no Vercel

interface HomePageProps {
  searchParams?: Promise<{ q?: string }>;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const resolvedParams = searchParams ? await searchParams : {};
  const searchQuery = resolvedParams?.q?.trim() || '';

  const dbArticles = await getPublishedArticles({
    limit: searchQuery ? 24 : 24,
    searchQuery: searchQuery || undefined,
  });
  const articles = dbArticles;

  const featured = articles.filter((a) => a.is_featured);
  const heroArticles = featured.length >= 4 ? featured.slice(0, 4) : articles.slice(0, 4);
  const heroIds = new Set(heroArticles.map((a) => a.id || a.slug));
  const feedArticles = searchQuery
    ? articles
    : articles.filter((a) => !heroIds.has(a.id || a.slug));
  const trending = await getTrendingArticles(5);

  // Destaques de Robôs Humanoides
  const humanoidArticles = articles.filter(
    (a) => a.category_slug === 'robos-humanoides'
  ).slice(0, 3);

  return (
    <div className="space-y-12">
      {/* Se estiver em modo busca (?q=...), exibe cabeçalho de resultados; caso contrário, Hero */}
      {searchQuery ? (
        <div className="bg-neutral-950 text-white rounded-2xl p-8 border-b-4 border-emerald-500 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded mb-2">
              <Search className="w-3.5 h-3.5" />
              <span>Pesquisa no Portal</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Resultados para &ldquo;{searchQuery}&rdquo;
            </h1>
            <p className="text-neutral-400 text-sm mt-1">
              {articles.length}{' '}
              {articles.length === 1 ? 'reportagem encontrada' : 'reportagens encontradas'} no acervo editorial
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider bg-neutral-800 hover:bg-neutral-700 text-white px-4 py-2.5 rounded-lg transition-colors self-start sm:self-auto"
          >
            <X className="w-4 h-4 text-emerald-400" />
            <span>Limpar filtro</span>
          </Link>
        </div>
      ) : (
        <HeroStory articles={heroArticles} />
      )}

      {/* Leaderboard AdSense Top Banner */}
      <AdSenseSlot slotId="728x90_top" format="horizontal" label="PUBLICIDADE" />

      {/* Main Feed + Sidebar Grid (8 cols + 4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Coluna Esquerda: Fluxo de Notícias Recentes */}
        <div className="lg:col-span-8 space-y-6">
          <div className="flex items-center justify-between border-b-2 border-black pb-3">
            <h2 className="text-xl font-black uppercase tracking-tight text-black flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-emerald-500" />
              {searchQuery ? `Artigos sobre "${searchQuery}"` : 'Últimas Notícias & Análises'}
            </h2>
            <span className="text-xs font-semibold text-neutral-400">
              {searchQuery ? `${articles.length} itens` : 'Atualizado em tempo real'}
            </span>
          </div>

          <div className="divide-y divide-neutral-200">
            {searchQuery && articles.length === 0 ? (
              <div className="py-12 text-center bg-neutral-50 rounded-xl border border-neutral-200 px-6">
                <p className="text-base font-bold text-neutral-800">
                  Nenhuma notícia encontrada para &ldquo;{searchQuery}&rdquo;.
                </p>
                <p className="text-sm text-neutral-500 mt-1 mb-4">
                  Tente pesquisar por termos como Inteligência Artificial, Robôs Humanoides, OpenAI, Anthropic ou Tesla Optimus.
                </p>
                <Link
                  href="/"
                  className="inline-flex items-center gap-2 bg-black text-white text-xs font-bold uppercase tracking-wider px-4 py-2.5 rounded hover:bg-emerald-600 transition-colors"
                >
                  Ver todas as notícias recentes
                </Link>
              </div>
            ) : feedArticles.length > 0 ? (
              feedArticles.map((article) => (
                <ArticleCard key={article.id || article.slug} article={article} />
              ))
            ) : (
              articles.map((article) => (
                <ArticleCard key={article.id || article.slug} article={article} />
              ))
            )}
          </div>

          {!searchQuery && (
            <div className="pt-6 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4">
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                Explorar acervo completo:
              </span>
              <div className="flex flex-wrap items-center gap-3">
                <Link
                  href="/categoria/inteligencia-artificial"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-neutral-100 hover:bg-black hover:text-white text-neutral-900 px-4 py-2.5 rounded-lg transition-colors"
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mais em Inteligência Artificial</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
                <Link
                  href="/categoria/robos-humanoides"
                  className="inline-flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider bg-neutral-100 hover:bg-black hover:text-white text-neutral-900 px-4 py-2.5 rounded-lg transition-colors"
                >
                  <Cpu className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Mais em Robôs Humanoides</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Coluna Direita: Sidebar TechCrunch */}
        <div className="lg:col-span-4">
          <Sidebar trendingArticles={trending} />
        </div>
      </div>

      {/* Anúncio AdSense Horizontal (Antes de Série Especial) */}
      <AdSenseSlot slotId="mid_banner_special" format="horizontal" label="PUBLICIDADE" />

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
