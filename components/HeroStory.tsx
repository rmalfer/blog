import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import { Clock, User } from 'lucide-react';

interface HeroStoryProps {
  articles: Article[];
}

export function HeroStory({ articles }: HeroStoryProps) {
  if (!articles || articles.length === 0) return null;

  const mainStory = articles[0];
  const secondaryStories = articles.slice(1, 4);

  return (
    <section className="border-b border-neutral-200 pb-12 mb-12">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* The Big Story (Main Column - 8 cols) */}
        <div className="lg:col-span-8 group">
          <Link href={`/noticia/${mainStory.slug}`} className="block">
            <div className="relative aspect-[16/9] w-full overflow-hidden rounded-lg bg-neutral-900 mb-5">
              {mainStory.image_url ? (
                <img
                  src={mainStory.image_url}
                  alt={mainStory.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  loading="eager"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neutral-900 to-black text-neutral-600">
                  <span className="text-xl font-mono">Um Futuro Próximo</span>
                </div>
              )}
              <div className="absolute top-4 left-4 bg-emerald-500 text-black text-xs font-black uppercase tracking-wider px-3 py-1 rounded shadow-md">
                {mainStory.category_name}
              </div>
            </div>

            <div className="space-y-3">
              <h1 className="text-2xl sm:text-4xl font-black text-black tracking-tight leading-[1.15] group-hover:text-emerald-600 transition-colors">
                {mainStory.title}
              </h1>

              {mainStory.excerpt && (
                <p className="text-neutral-600 text-base sm:text-lg leading-relaxed line-clamp-3">
                  {mainStory.excerpt}
                </p>
              )}

              <div className="flex items-center gap-4 text-xs font-semibold text-neutral-500 pt-1">
                <span className="flex items-center gap-1.5 text-neutral-900">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  {mainStory.author_name}
                </span>
                <span>•</span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-neutral-400" />
                  {mainStory.reading_time || '3 min'}
                </span>
                <span>•</span>
                <span>{formatDate(mainStory.published_at)}</span>
              </div>
            </div>
          </Link>
        </div>

        {/* Secondary Stories (Side Column - 4 cols) */}
        <div className="lg:col-span-4 flex flex-col divide-y divide-neutral-200">
          <div className="pb-3 mb-2 flex items-center justify-between">
            <span className="text-xs font-black uppercase tracking-widest text-neutral-900 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
              Em Alta Agora
            </span>
          </div>

          {secondaryStories.map((story) => (
            <article key={story.id || story.slug} className="py-4 first:pt-0 last:pb-0 group">
              <Link href={`/noticia/${story.slug}`} className="flex gap-4 items-start">
                <div className="flex-1 space-y-1.5">
                  <span className="inline-block text-[11px] font-bold text-emerald-600 uppercase tracking-wider">
                    {story.category_name}
                  </span>
                  <h3 className="text-sm sm:text-base font-extrabold text-black group-hover:text-emerald-600 transition-colors leading-snug line-clamp-3">
                    {story.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[11px] text-neutral-400 pt-1">
                    <span>{formatDate(story.published_at)}</span>
                    <span>•</span>
                    <span>{story.reading_time || '3 min'}</span>
                  </div>
                </div>

                {story.image_url && (
                  <div className="w-24 h-20 shrink-0 overflow-hidden rounded bg-neutral-100 relative">
                    <img
                      src={story.image_url}
                      alt={story.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>
                )}
              </Link>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
