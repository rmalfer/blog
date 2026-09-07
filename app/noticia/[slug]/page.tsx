import React from 'react';
import { notFound } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { getArticleBySlug, getRelatedArticles, getTrendingArticles } from '@/lib/supabase';
import { formatDate, formatDateTime } from '@/lib/utils';
import { ShareButtons } from '@/components/ShareButtons';
import { AdSenseSlot } from '@/components/AdSenseSlot';
import { Sidebar } from '@/components/Sidebar';
import { ArticleCard } from '@/components/ArticleCard';
import { Clock, User, ExternalLink, Sparkles, ChevronRight, Bookmark } from 'lucide-react';

interface ArticlePageProps {
  params: Promise<{ slug: string }>;
}

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://umfuturoproximo.vercel.app';

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    return {
      title: 'Notícia não encontrada | Um Futuro Próximo',
    };
  }

  const title = `${article.title} | Um Futuro Próximo`;
  const description = article.excerpt || article.title;
  const canonicalUrl = `${siteUrl}/noticia/${article.slug}`;

  return {
    title,
    description,
    authors: [{ name: article.author_name || 'Riccardo Malfer' }],
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      type: 'article',
      publishedTime: article.published_at,
      modifiedTime: article.updated_at,
      authors: [article.author_name || 'Riccardo Malfer'],
      images: article.image_url ? [{ url: article.image_url }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: article.image_url ? [article.image_url] : [],
    },
  };
}

export const revalidate = 60;

export default async function ArticlePage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const related = await getRelatedArticles(article.category_slug, article.slug, 3);
  const trending = await getTrendingArticles(5);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'NewsArticle',
    headline: article.title,
    description: article.excerpt,
    image: article.image_url ? [article.image_url] : [],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: {
      '@type': 'Person',
      name: article.author_name || 'Riccardo Malfer',
      jobTitle: 'Editor & Especialista em IA',
      url: siteUrl,
    },
    publisher: {
      '@type': 'NewsMediaOrganization',
      name: 'Um Futuro Próximo',
      logo: {
        '@type': 'ImageObject',
        url: `${siteUrl}/logo.png`,
      },
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteUrl}/noticia/${article.slug}`,
    },
  };

  return (
    <>
      {/* Schema.org NewsArticle JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="flex items-center gap-2 text-xs font-semibold text-neutral-500 mb-6 uppercase tracking-wider overflow-x-auto whitespace-nowrap py-1">
        <Link href="/" className="hover:text-black">
          Início
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <Link href={`/categoria/${article.category_slug}`} className="hover:text-emerald-600 text-emerald-600">
          {article.category_name}
        </Link>
        <ChevronRight className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
        <span className="text-neutral-400 truncate max-w-xs">{article.title}</span>
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Main Article Content (8 cols) */}
        <article className="lg:col-span-8 space-y-8">
          {/* Header */}
          <div className="space-y-4">
            <Link
              href={`/categoria/${article.category_slug}`}
              className="inline-block bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded"
            >
              {article.category_name}
            </Link>

            <h1 className="text-3xl sm:text-5xl font-black text-black tracking-tight leading-[1.12]">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="text-lg sm:text-xl text-neutral-600 font-medium leading-relaxed">
                {article.excerpt}
              </p>
            )}

            {/* Author Meta Card */}
            <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-t border-neutral-200">
              <div className="flex items-center gap-3">
                <div className="w-11 h-11 rounded-full bg-black text-emerald-400 font-bold text-base flex items-center justify-center border-2 border-emerald-500">
                  RM
                </div>
                <div>
                  <div className="text-sm font-black text-black flex items-center gap-1.5">
                    <span>{article.author_name}</span>
                    <span className="text-[10px] bg-neutral-100 text-neutral-600 px-1.5 py-0.5 rounded font-bold uppercase">
                      Autor
                    </span>
                  </div>
                  <div className="text-xs text-neutral-500 flex items-center gap-2 mt-0.5">
                    <span>Publicado em {formatDate(article.published_at)}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-neutral-400" />
                      {article.reading_time || '3 min'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Social Share */}
            <ShareButtons title={article.title} />
          </div>

          {/* Featured Image */}
          {article.image_url && (
            <figure className="space-y-2">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl bg-neutral-100 shadow-sm">
                <img
                  src={article.image_url}
                  alt={article.title}
                  className="w-full h-full object-cover"
                  loading="eager"
                />
              </div>
              <figcaption className="text-xs text-neutral-400 italic text-center">
                Imagem ilustrativa / Reprodução da fonte original
              </figcaption>
            </figure>
          )}

          {/* Takeaways / Pontos Principais */}
          <div className="bg-emerald-50/60 border-l-4 border-emerald-500 rounded-r-xl p-5 my-6">
            <h3 className="text-xs font-black uppercase tracking-wider text-emerald-900 flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-emerald-600" />
              Destaques da Notícia
            </h3>
            <p className="text-sm text-emerald-950 font-medium leading-relaxed">
              {article.excerpt || 'Análise completa dos impactos tecnológicos, contextuais e práticos desta notícia.'}
            </p>
          </div>

          {/* Article HTML Content */}
          <div
            className="article-body"
            dangerouslySetInnerHTML={{ __html: article.content }}
          />

          {/* In-Article AdSense Banner */}
          <AdSenseSlot slotId="article_in_feed" format="fluid" label="PUBLICIDADE RECOMENDADA" />

          {/* Fonte Original Box */}
          {article.source_url && (
            <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-6 my-8 space-y-3">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-neutral-700">
                <ExternalLink className="w-4 h-4 text-emerald-600" />
                <span>Fonte Oficial & Referência</span>
              </div>
              <p className="text-xs text-neutral-600">
                Esta matéria foi elaborada e analisada com base nas informações originais publicadas em:
              </p>
              <a
                href={article.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-bold text-emerald-700 hover:text-emerald-900 bg-emerald-50 hover:bg-emerald-100 px-4 py-2.5 rounded-lg border border-emerald-200 break-all transition-colors"
              >
                <span className="truncate max-w-md">{article.source_url}</span>
                <ExternalLink className="w-4 h-4 shrink-0" />
              </a>
            </div>
          )}

          {/* Author Bio Box */}
          <div className="bg-black text-white rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center gap-6 my-12 border-b-4 border-emerald-500">
            <div className="w-16 h-16 rounded-full bg-emerald-500 text-black font-black text-2xl flex items-center justify-center shrink-0">
              RM
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <h4 className="text-lg font-black text-white">Riccardo Malfer</h4>
                <span className="text-[11px] bg-neutral-800 text-emerald-400 px-2 py-0.5 rounded font-bold uppercase">
                  Editor do Portal
                </span>
              </div>
              <p className="text-xs sm:text-sm text-neutral-300 leading-relaxed">
                Especialista em inteligência artificial, robótica corporificada e arquiteturas cognitivas. Fundador e autor do portal Um Futuro Próximo, com curadoria dedicada à tecnologia de fronteira.
              </p>
            </div>
          </div>

          {/* Related Articles */}
          {related.length > 0 && (
            <section className="pt-8 border-t border-neutral-200 space-y-6">
              <h3 className="text-lg font-black uppercase tracking-tight text-black">
                Leia Também em {article.category_name}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {related.map((item) => (
                  <ArticleCard key={item.id || item.slug} article={item} layout="vertical" />
                ))}
              </div>
            </section>
          )}
        </article>

        {/* Sidebar (4 cols) */}
        <div className="lg:col-span-4">
          <div className="sticky top-24">
            <Sidebar trendingArticles={trending} />
          </div>
        </div>
      </div>
    </>
  );
}
