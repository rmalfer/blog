'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Article } from '@/lib/types';
import { calculateReadingTime } from '@/lib/utils';
import { ArrowLeft, Save, Trash2, ExternalLink } from 'lucide-react';

const CATEGORIES = [
  { name: 'Inteligência Artificial', slug: 'inteligencia-artificial' },
  { name: 'Robôs Humanoides', slug: 'robos-humanoides' },
  { name: 'Saúde & Biotec', slug: 'saude-biotec' },
  { name: 'Startups & Futuro', slug: 'startups-futuro' },
];

export default function EditarArtigoPage() {
  const router = useRouter();
  const params = useParams();
  const id = params?.id as string;

  const [article, setArticle] = useState<Article | null>(null);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categorySlug, setCategorySlug] = useState('inteligencia-artificial');
  const [imageUrl, setImageUrl] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>('published');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (id) {
      loadArticle(id);
    }
  }, [id]);

  const loadArticle = async (articleId: string) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .eq('id', articleId)
        .single();

      if (!error && data) {
        const art = data as Article;
        setArticle(art);
        setTitle(art.title);
        setSlug(art.slug);
        setExcerpt(art.excerpt || '');
        setContent(art.content);
        setCategorySlug(art.category_slug);
        setImageUrl(art.image_url || '');
        setSourceUrl(art.source_url || '');
        setIsFeatured(art.is_featured);
        setStatus(art.status);
      }
    } catch (err) {
      console.error('Erro ao carregar artigo:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert('Título e conteúdo são obrigatórios!');
      return;
    }

    setSaving(true);
    try {
      const selectedCategory = CATEGORIES.find((c) => c.slug === categorySlug);
      const readingTime = calculateReadingTime(content);

      const updates = {
        title,
        slug,
        excerpt,
        content,
        category_name: selectedCategory?.name || 'Inteligência Artificial',
        category_slug: categorySlug,
        image_url: imageUrl || null,
        source_url: sourceUrl || null,
        status,
        is_featured: isFeatured,
        reading_time: readingTime,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('articles').update(updates).eq('id', id);

      if (error) throw error;

      alert('Artigo atualizado com sucesso!');
      router.push('/admin');
    } catch (err: any) {
      alert(`Erro ao atualizar: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-neutral-400">
        Carregando dados da matéria...
      </div>
    );
  }

  if (!article) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center">
        <h2 className="text-xl font-bold text-black">Matéria não encontrada</h2>
        <Link href="/admin" className="text-emerald-600 font-bold text-sm mt-4 inline-block">
          Voltar ao painel
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          href="/admin"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel</span>
        </Link>
        <Link
          href={`/noticia/${article.slug}`}
          target="_blank"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:underline"
        >
          <span>Ver no site público</span>
          <ExternalLink className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div>
        <h1 className="text-3xl font-black text-black tracking-tight">Editar Notícia</h1>
        <p className="text-xs text-neutral-500 mt-1 font-mono">ID: {article.id}</p>
      </div>

      <form onSubmit={handleUpdate} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
            Título da Notícia *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-base font-bold focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
              Slug da URL
            </label>
            <input
              type="text"
              required
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
              Categoria *
            </label>
            <select
              value={categorySlug}
              onChange={(e) => setCategorySlug(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-sm font-semibold focus:outline-none focus:border-emerald-500"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat.slug} value={cat.slug}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
            Resumo / Subtítulo
          </label>
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
              URL da Imagem de Destaque
            </label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
              Link da Fonte Original
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {imageUrl && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Pré-visualização
            </span>
            <img
              src={imageUrl}
              alt="Preview"
              className="max-h-48 rounded object-cover border border-neutral-300"
            />
          </div>
        )}

        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
            Conteúdo da Matéria (HTML) *
          </label>
          <textarea
            rows={14}
            required
            value={content}
            onChange={(e) => setContent(e.target.value)}
            className="w-full p-4 font-mono text-sm bg-neutral-50 border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-neutral-50 rounded-xl border border-neutral-200">
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
              <span className="text-xs font-bold text-neutral-800">
                Fixar na Capa Principal (The Big Story)
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-neutral-700">
              <span>Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs"
              >
                <option value="published">Publicado</option>
                <option value="draft">Rascunho</option>
                <option value="archived">Arquivado</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? 'Atualizando...' : 'Salvar Alterações'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
