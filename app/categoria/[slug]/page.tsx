import React from 'react';
import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPublishedArticles, getCategories, getTrendingArticles } from '@/lib/supabase';
import { ArticleCard } from '@/components/ArticleCard';
import { Sidebar } from '@/components/Sidebar';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { Cpu, Bot, HeartPulse, Rocket, Folder } from 'lucide-react';

interface CategoryPageProps {
  params: Promise<{ slug: string }>;
}

const CATEGORY_ICONS: Record<string, any> = {
  'inteligencia-artificial': Bot,
  'robos-humanoides': Cpu,
  'saude-biotec': HeartPulse,
  'startups-futuro': Rocket,
};

export async function generateMetadata({ params }: CategoryPageProps): Promise<Metadata> {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    return { title: 'Categoria | Um Futuro Próximo' };
  }

  return {
    title: `${category.name} | Notícias e Análises`,
    description: category.description || `Notícias mais recentes sobre ${category.name} por Riccardo Malfer.`,
  };
}

export const revalidate = 60;

export default async function CategoryPage({ params }: CategoryPageProps) {
  const { slug } = await params;
  const categories = await getCategories();
  const category = categories.find((c) => c.slug === slug);

  if (!category) {
    notFound();
  }

  const articles = await getPublishedArticles({ categorySlug: slug, limit: 20 });
  const trending = await getTrendingArticles(5);
  const IconComponent = CATEGORY_ICONS[slug] || Folder;

  return (
    <div className="space-y-10">
      {/* Category Header */}
      <div className="bg-neutral-950 text-white rounded-2xl p-8 sm:p-10 border-b-4 border-emerald-500">
        <div className="inline-flex items-center gap-2 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded mb-3">
          <IconComponent className="w-3.5 h-3.5" />
          <span>Categoria</span>
        </div>
        <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
          {category.name}
        </h1>
        {category.description && (
          <p className="text-neutral-400 text-base sm:text-lg mt-2 max-w-2xl">
            {category.description}
          </p>
        )}
      </div>

      {/* Top Banner AdSense */}
      <AdSenseSlot slotId="cat_top_banner" format="horizontal" />

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
            <div className="divide-y divide-neutral-200">
              {articles.map((article) => (
                <ArticleCard key={article.id || article.slug} article={article} />
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-4">
          <Sidebar trendingArticles={trending} />
        </div>
      </div>
    </div>
  );
}
