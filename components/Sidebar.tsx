import React from 'react';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { AdSenseSlot } from './AdSenseSlot';
import { TrendingUp, User, Sparkles, Tag } from 'lucide-react';

interface SidebarProps {
  trendingArticles?: Article[];
}

export function Sidebar({ trendingArticles = [] }: SidebarProps) {
  const trending = trendingArticles.slice(0, 5);

  return (
    <aside className="space-y-10">
      {/* Mais Lidas (Ranked 1 - 5) */}
      <div className="border-t-2 border-black pt-4">
        <div className="flex items-center gap-2 mb-6">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-black uppercase tracking-wider text-black">
            Mais Lidas da Semana
          </h3>
        </div>

        <div className="space-y-5">
          {trending.map((item, idx) => (
            <div key={item.id || item.slug} className="flex items-start gap-4 group">
              <span className="text-3xl font-black text-neutral-300 group-hover:text-emerald-500 transition-colors shrink-0 font-sans leading-none w-6">
                {idx + 1}
              </span>
              <div className="space-y-1">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  {item.category_name}
                </span>
                <Link href={`/noticia/${item.slug}`} className="block">
                  <h4 className="text-sm font-bold text-black group-hover:text-emerald-600 transition-colors leading-snug line-clamp-2">
                    {item.title}
                  </h4>
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Anúncio AdSense Médio 300x250 */}
      <AdSenseSlot slotId="300x250_sidebar" format="rectangle" label="PUBLICIDADE" />

      {/* Card Autor: Riccardo Malfer */}
      <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5 space-y-3">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-black text-emerald-400 font-bold text-lg flex items-center justify-center border-2 border-emerald-500 shrink-0">
            RM
          </div>
          <div>
            <h4 className="text-sm font-black text-black">Riccardo Malfer</h4>
            <p className="text-xs text-neutral-500">Editor & Especialista em IA</p>
          </div>
        </div>
        <p className="text-xs text-neutral-600 leading-relaxed">
          Acompanhando e analisando a revolução da inteligência artificial generativa, robôs humanoides e as tecnologias que estão redefinindo a sociedade moderna.
        </p>
        <div className="pt-2 border-t border-neutral-200 flex items-center justify-between text-xs font-semibold text-neutral-600">
          <span className="text-emerald-700">Curadoria Independente</span>
          <span>São Paulo, BR</span>
        </div>
      </div>

      {/* Tópicos do Futuro */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Tag className="w-4 h-4 text-emerald-600" />
          <h4 className="text-xs font-black uppercase tracking-wider text-black">
            Tópicos do Futuro
          </h4>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            'Inteligência Artificial',
            'Robôs Humanoides',
            'Ollama & Gemma',
            'Tesla Optimus',
            'BYD Robótica',
            'Modelos Cognitivos',
            'Medicina Preditiva',
            'Deep Tech',
            'Autonomia',
          ].map((topic) => (
            <Link
              key={topic}
              href={`/?q=${encodeURIComponent(topic)}`}
              className="text-xs font-medium px-3 py-1.5 rounded-full bg-neutral-100 text-neutral-700 hover:bg-black hover:text-white transition-colors"
            >
              #{topic}
            </Link>
          ))}
        </div>
      </div>

      {/* Anúncio AdSense Sidebar Inferior (Abaixo de Tópicos do Futuro) */}
      <AdSenseSlot slotId="sidebar_bottom" format="rectangle" label="PUBLICIDADE" />
    </aside>
  );
}
