'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { generateSlug, calculateReadingTime } from '@/lib/utils';
import { ArrowLeft, Save } from 'lucide-react';

const CATEGORIES = [
  { name: 'Inteligência Artificial', slug: 'inteligencia-artificial' },
  { name: 'Robôs Humanoides', slug: 'robos-humanoides' },
  { name: 'Saúde & Biotec', slug: 'saude-biotec' },
  { name: 'Startups & Futuro', slug: 'startups-futuro' },
];

const HOSTED_COVERS = [
  { label: 'Capa IA (Hospedada)', url: '/images/covers/inteligencia-artificial-1.webp' },
  { label: 'Capa IA 2 (Hospedada)', url: '/images/covers/inteligencia-artificial-2.webp' },
  { label: 'Capa Robôs (Hospedada)', url: '/images/covers/robos-humanoides-1.webp' },
  { label: 'Capa Robôs 2 (Hospedada)', url: '/images/covers/robos-humanoides-2.webp' },
  { label: 'Capa Saúde & Biotec (Hospedada)', url: '/images/covers/saude-biotec-1.webp' },
  { label: 'Capa Startups & Futuro (Hospedada)', url: '/images/covers/startups-futuro-1.webp' },
];

export default function NovoArtigoPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [categorySlug, setCategorySlug] = useState('inteligencia-artificial');
  const [imageUrl, setImageUrl] = useState('/images/covers/inteligencia-artificial-1.webp');
  const [sourceUrl, setSourceUrl] = useState('');
  const [isFeatured, setIsFeatured] = useState(false);
  const [status, setStatus] = useState<'published' | 'draft'>('published');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch('/api/admin/me', { cache: 'no-store' }).then((res) => {
      if (!res.ok) {
        router.replace('/futuroadmin');
      } else {
        setAuthorized(true);
      }
    });
  }, [router]);

  const handleTitleChange = (val: string) => {
    setTitle(val);
    setSlug(generateSlug(val));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert('Título e conteúdo são obrigatórios!');
      return;
    }

    setLoading(true);
    try {
      const selectedCategory = CATEGORIES.find((c) => c.slug === categorySlug);
      const readingTime = calculateReadingTime(content);

      const newArticle = {
        title,
        slug: slug || generateSlug(title),
        excerpt,
        content,
        category_name: selectedCategory?.name || 'Inteligência Artificial',
        category_slug: categorySlug,
        image_url: imageUrl || null,
        source_url: sourceUrl || null,
        author_name: 'Riccardo Malfer',
        author_role: 'Editor & Especialista em IA',
        status,
        is_featured: isFeatured,
        reading_time: readingTime,
        published_at: new Date().toISOString(),
      };

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newArticle),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao publicar');

      alert('Artigo salvo com sucesso!');
      router.push('/futuroadmin');
    } catch (err: any) {
      alert(`Erro ao salvar artigo: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  if (!authorized) {
    return (
      <div className="max-w-4xl mx-auto py-16 text-center text-neutral-400">
        Verificando permissão...
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex items-center justify-between border-b border-neutral-200 pb-4">
        <Link
          href="/futuroadmin"
          className="inline-flex items-center gap-2 text-xs font-bold text-neutral-500 hover:text-black uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Voltar ao Painel</span>
        </Link>
        <span className="text-xs font-mono text-neutral-400">Autor: Riccardo Malfer</span>
      </div>

      <div>
        <h1 className="text-3xl font-black text-black tracking-tight">Criar Nova Matéria</h1>
        <p className="text-xs text-neutral-500 mt-1">
          Deixe &ldquo;Link da Fonte Original&rdquo; vazio para marcar como artigo autoral/perene do portal.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
            Título da Matéria *
          </label>
          <input
            type="text"
            required
            value={title}
            onChange={(e) => handleTitleChange(e.target.value)}
            placeholder="Ex: Guia prático para rodar modelos locais com Ollama e Gemma"
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
            Resumo / Subtítulo (Linha Fina)
          </label>
          <textarea
            rows={2}
            value={excerpt}
            onChange={(e) => setExcerpt(e.target.value)}
            placeholder="Breve resumo informativo da matéria (120 a 160 caracteres)..."
            className="w-full px-4 py-2.5 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500 focus:bg-white"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
              Imagem Hospedada / URL da Capa
            </label>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="/images/covers/inteligencia-artificial-1.webp"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
            />
            <select
              value=""
              onChange={(e) => {
                if (e.target.value) setImageUrl(e.target.value);
              }}
              className="w-full px-3 py-1.5 bg-white border border-neutral-200 rounded text-xs text-neutral-600"
            >
              <option value="">Escolher capa hospedada do portal...</option>
              {HOSTED_COVERS.map((c) => (
                <option key={c.url} value={c.url}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-wider text-neutral-700">
              Link da Fonte Original (opcional)
            </label>
            <input
              type="url"
              value={sourceUrl}
              onChange={(e) => setSourceUrl(e.target.value)}
              placeholder="Deixe vazio para artigo autoral"
              className="w-full px-3 py-2 bg-neutral-50 border border-neutral-300 rounded-lg text-xs focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {imageUrl && (
          <div className="p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-2">
              Pré-visualização da Imagem
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
            placeholder="<p>Escreva os parágrafos da matéria aqui...</p>"
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
                Fixar na Capa Principal
              </span>
            </label>

            <label className="flex items-center gap-2 text-xs font-bold text-neutral-700">
              <span>Status:</span>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as any)}
                className="px-2 py-1 bg-white border border-neutral-300 rounded text-xs"
              >
                <option value="published">Ativa (Publicada)</option>
                <option value="draft">Inativa (Oculta)</option>
              </select>
            </label>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-extrabold text-xs uppercase tracking-wider rounded-lg transition-colors shadow-sm disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            <span>{loading ? 'Salvando...' : 'Salvar Artigo'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
