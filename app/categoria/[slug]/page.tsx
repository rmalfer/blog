import React from 'react';
import { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPublishedArticles, getCategories, getTrendingArticles } from '@/lib/supabase';
import { SITE_URL } from '@/lib/utils';
import { ArticleCard } from '@/components/ArticleCard';
import { Sidebar } from '@/components/Sidebar';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { Cpu, Bot, HeartPulse, Rocket, Folder, ChevronLeft, ChevronRight } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
  searchParams?: Promise<{ page?: string }>;
}

const ARTICLES_PER_PAGE = 24;

const CATEGORY_ICONS: Record<string, any> = {
  'inteligencia-artificial': Bot,
  'robos-humanoides': Cpu,
  'saude-biotec': HeartPulse,
  'startups-futuro': Rocket,
};

export async function generateMetadata({
  params,
  searchParams,
}: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const currentPage = Math.max(1, parseInt(resolvedSearch?.page || '1', 10) || 1);

  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return { title: 'Categoria' };
  }

  const baseUrl = `${SITE_URL}/categoria/${category.slug}`;
  const canonicalUrl = currentPage > 1 ? `${baseUrl}?page=${currentPage}` : baseUrl;
  const pageSuffix = currentPage > 1 ? ` (Página ${currentPage})` : '';

  return {
    title: `${category.name} — Notícias e Análises${pageSuffix}`,
    description:
      category.description ||
      `Notícias mais recentes sobre ${category.name} por Riccardo Malfer.${pageSuffix}`,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${category.name}${pageSuffix} | Um Futuro Próximo`,
      description:
        category.description ||
        `Notícias mais recentes sobre ${category.name} por Riccardo Malfer.`,
      url: canonicalUrl,
      type: 'website',
    },
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params, searchParams }: CategoryPageProps) {
  const { slug } = await params;
  const resolvedSearch = searchParams ? await searchParams : {};
  const currentPage = Math.max(1, parseInt(resolvedSearch?.page || '1', 10) || 1);

  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const allCategoryArticles = await getPublishedArticles({ categorySlug: slug, limit: 500 });
  const totalArticles = allCategoryArticles.length;
  const totalPages = Math.max(1, Math.ceil(totalArticles / ARTICLES_PER_PAGE));
  const safePage = Math.min(currentPage, totalPages);
  const startIdx = (safePage - 1) * ARTICLES_PER_PAGE;
  const articles = allCategoryArticles.slice(startIdx, startIdx + ARTICLES_PER_PAGE);

  const trending = await getTrendingArticles(5);
  const IconComponent = CATEGORY_ICONS[slug] || Folder;

  return (
    <div className="space-y-10">
      {/* Category Header */}
      <div className="bg-neutral-950 text-white rounded-2xl p-8 sm:p-10 border-b-4 border-emerald-500">
        <div className="inline-flex items-center gap-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded mb-3">
          <IconComponent className="w-3.5 h-3.5" />
          <span>Categoria • {totalArticles} reportagens</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          {category.name}
          {safePage > 1 && (
            <span className="text-emerald-400 text-xl sm:text-2xl font-bold ml-3">
              (Página {safePage} de {totalPages})
            </span>
          )}
        </h1>
        {category.description && (
          <p className="text-neutral-400 text-base sm:text-lg mt-2 max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Top Banner AdSense (somente quando há conteúdo publicado) */}
      {articles.length > 0 && <AdSenseSlot slotId="cat_top_banner" format="horizontal" />}

      {/* Grid: 8 cols feed + 4 cols sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        <div className="lg:col-span-8 space-y-6">
          {articles.length === 0 ? (
            <div className="text-center py-16 bg-neutral-50 rounded-xl border border-neutral-200">
              <IconComponent className="w-12 h-12 text-neutral-400 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-neutral-800">
                Nenhuma notícia publicada nesta categoria ainda
              </h3>
              <p className="text-sm text-neutral-500 mt-1">
                Execute o pipeline de sincronização para carregar novas matérias.
              </p>
            </div>
          ) : (
            <>
              <div className="divide-y divide-neutral-200">
                {articles.map((article) => (
                  <ArticleCard key={article.id || article.slug} article={article} />
                ))}
              </div>

              {/* Paginação SEO-friendly com links <a href> rastreáveis pelo Googlebot */}
              {totalPages > 1 && (
                <nav
                  aria-label="Paginação da categoria"
                  className="pt-8 border-t border-neutral-200 flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    {safePage > 1 ? (
                      <Link
                        href={
                          safePage === 2
                            ? `/categoria/${slug}`
                            : `/categoria/${slug}?page=${safePage - 1}`
                        }
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold uppercase tracking-wider bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 rounded-lg transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-neutral-50 text-neutral-300 rounded-lg cursor-not-allowed">
                        <ChevronLeft className="w-4 h-4" />
                        <span>Anterior</span>
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-1.5">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => {
                      const isCurrent = pageNum === safePage;
                      const href =
                        pageNum === 1 ? `/categoria/${slug}` : `/categoria/${slug}?page=${pageNum}`;
                      return (
                        <Link
                          key={pageNum}
                          href={href}
                          aria-current={isCurrent ? 'page' : undefined}
                          className={`w-9 h-9 inline-flex items-center justify-center rounded-lg text-xs font-black transition-colors ${
                            isCurrent
                              ? 'bg-emerald-500 text-black'
                              : 'bg-neutral-100 hover:bg-neutral-900 hover:text-white text-neutral-700'
                          }`}
                        >
                          {pageNum}
                        </Link>
                      );
                    })}
                  </div>

                  <div>
                    {safePage < totalPages ? (
                      <Link
                        href={`/categoria/${slug}?page=${safePage + 1}`}
                        className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-extrabold uppercase tracking-wider bg-neutral-100 hover:bg-black hover:text-white text-neutral-800 rounded-lg transition-colors"
                      >
                        <span>Próxima</span>
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider bg-neutral-50 text-neutral-300 rounded-lg cursor-not-allowed">
                        <span>Próxima</span>
                        <ChevronRight className="w-4 h-4" />
                      </span>
                    )}
                  </div>
                </nav>
              )}
            </>
          )}
        </div>

        <div className="lg:col-span-4">
          <Sidebar trendingArticles={trending} />
        </div>
      </div>
    </div>
  );
}
