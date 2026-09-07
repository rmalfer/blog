import React from 'react';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Clock, User } from 'lucide-react';

interface ArticleCardProps {
  article: Article;
  layout?: 'horizontal' | 'vertical';
}

export function ArticleCard({ article, layout = 'horizontal' }: ArticleCardProps) {
  if (layout === 'vertical') {
    return (
      <article className="group flex flex-col bg-white border border-neutral-200 rounded-lg overflow-hidden hover:shadow-md transition-all">
        {article.image_url && (
          <Link href={`/noticia/${article.slug}`} className="block relative aspect-[16/9] w-full overflow-hidden bg-neutral-100">
            <img
              src={article.image_url}
              alt={article.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
            <span className="absolute top-3 left-3 bg-black text-emerald-400 text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded">
              {article.category_name}
            </span>
          </Link>
        )}

        <div className="p-5 flex flex-col flex-1">
          {!article.image_url && (
            <span className="inline-block text-xs font-bold text-emerald-600 uppercase tracking-wider mb-2">
              {article.category_name}
            </span>
          )}

          <Link href={`/noticia/${article.slug}`}>
            <h3 className="text-lg font-black text-black group-hover:text-emerald-600 transition-colors leading-snug line-clamp-2">
              {article.title}
            </h3>
          </Link>

          {article.excerpt && (
            <p className="text-sm text-neutral-600 mt-2 line-clamp-2 leading-relaxed flex-1">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center justify-between text-xs text-neutral-400 font-medium pt-4 mt-4 border-t border-neutral-100">
            <span className="flex items-center gap-1 text-neutral-700">
              <User className="w-3 h-3 text-emerald-600" />
              {article.author_name}
            </span>
            <span>{formatDate(article.published_at)}</span>
          </div>
        </div>
      </article>
    );
  }

  // Horizontal Layout (TechCrunch Feed Style)
  return (
    <article className="group py-6 border-b border-neutral-200 last:border-b-0">
      <div className="grid grid-cols-1 sm:grid-cols-12 gap-5 items-start">
        {article.image_url && (
          <div className="sm:col-span-4 order-1 sm:order-2">
            <Link href={`/noticia/${article.slug}`} className="block relative aspect-[16/10] w-full overflow-hidden rounded-lg bg-neutral-100">
              <img
                src={article.image_url}
                alt={article.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
              />
            </Link>
          </div>
        )}

        <div className={`${article.image_url ? 'sm:col-span-8' : 'sm:col-span-12'} order-2 sm:order-1 space-y-2`}>
          <div className="flex items-center gap-2">
            <Link
              href={`/categoria/${article.category_slug}`}
              className="text-[11px] font-black text-emerald-600 uppercase tracking-wider hover:underline"
            >
              {article.category_name}
            </Link>
          </div>

          <Link href={`/noticia/${article.slug}`} className="block">
            <h2 className="text-xl sm:text-2xl font-black text-black group-hover:text-emerald-600 transition-colors leading-snug">
              {article.title}
            </h2>
          </Link>

          {article.excerpt && (
            <p className="text-sm sm:text-base text-neutral-600 line-clamp-2 leading-relaxed">
              {article.excerpt}
            </p>
          )}

          <div className="flex items-center gap-3 text-xs font-semibold text-neutral-500 pt-2">
            <span className="flex items-center gap-1 text-neutral-900">
              <User className="w-3 h-3 text-emerald-600" />
              {article.author_name}
            </span>
            <span>•</span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-neutral-400" />
              {article.reading_time || '3 min'}
            </span>
            <span>•</span>
            <span>{formatDate(article.published_at)}</span>
          </div>
        </div>
      </div>
    </article>
  );
}
