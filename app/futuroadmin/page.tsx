'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';
import { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Shield,
  Plus,
  RefreshCw,
  Eye,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  Clock,
  Layers,
  Search,
  ExternalLink,
  Bot,
} from 'lucide-react';

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');

  useEffect(() => {
    // Verifica se já fez login no browser
    const storedAuth = localStorage.getItem('umfuturo_admin_auth');
    if (storedAuth === 'true') {
      setIsAuthenticated(true);
      loadArticles();
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Senha padrão ou configurada no ambiente
    if (password === 'futuro2026' || password === 'admin123') {
      setIsAuthenticated(true);
      localStorage.setItem('umfuturo_admin_auth', 'true');
      loadArticles();
    } else {
      alert('Senha administrativa incorreta!');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('umfuturo_admin_auth');
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('articles')
        .select('*')
        .order('published_at', { ascending: false });

      if (!error && data) {
        setArticles(data as Article[]);
      }
    } catch (err) {
      console.error('Erro ao carregar notícias:', err);
    } finally {
      setLoading(false);
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      await supabase.from('articles').update({ is_featured: !current }).eq('id', id);
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_featured: !current } : a))
      );
    } catch (err) {
      alert('Erro ao alternar destaque');
    }
  };

  const deleteArticle = async (id: string, title: string) => {
    if (!confirm(`Tem certeza que deseja excluir "${title}"?`)) return;
    try {
      await supabase.from('articles').delete().eq('id', id);
      setArticles((prev) => prev.filter((a) => a.id !== id));
    } catch (err) {
      alert('Erro ao excluir artigo');
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm text-center">
        <div className="w-12 h-12 bg-black text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-black">Acesso Administrativo</h1>
        <p className="text-sm text-neutral-500 mt-1 mb-6">
          Painel de Gerenciamento do Portal Um Futuro Próximo
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <input
            type="password"
            placeholder="Digite a senha de administrador"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
            required
            autoFocus
          />
          <button
            type="submit"
            className="w-full py-3 bg-black hover:bg-emerald-600 text-white font-extrabold text-sm uppercase rounded-lg transition-colors"
          >
            Entrar no Painel
          </button>
        </form>
        <span className="text-[11px] text-neutral-400 block mt-4">
          Senha padrão: <code>futuro2026</code>
        </span>
      </div>
    );
  }

  const filteredArticles = articles.filter((a) => {
    const matchSearch =
      a.title.toLowerCase().includes(search.toLowerCase()) ||
      a.category_name.toLowerCase().includes(search.toLowerCase());
    const matchCat = filterCat === 'all' || a.category_slug === filterCat;
    return matchSearch && matchCat;
  });

  const totalPublished = articles.filter((a) => a.status === 'published').length;
  const totalFeatured = articles.filter((a) => a.is_featured).length;

  return (
    <div className="space-y-8">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 mb-1">
            <Shield className="w-4 h-4" />
            <span>Painel de Controle Editorial</span>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight">
            Gerenciamento de Notícias
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Autor oficial do portal: <strong>Riccardo Malfer</strong>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/futuroadmin/sync"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase rounded-lg transition-colors"
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>Sincronizar Sheets / Ollama</span>
          </Link>
          <Link
            href="/futuroadmin/novo"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold uppercase rounded-lg transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Matéria</span>
          </Link>
          <button
            onClick={handleLogout}
            className="text-xs font-bold text-neutral-400 hover:text-red-600 px-3 py-2"
          >
            Sair
          </button>
        </div>
      </div>

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Total de Notícias
            </span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-3xl font-black text-black mt-2">{articles.length}</div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Publicadas
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-3xl font-black text-emerald-600 mt-2">{totalPublished}</div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-neutral-500">
              Fixadas em Destaque
            </span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-3xl font-black text-amber-600 mt-2">{totalFeatured}</div>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-neutral-50 p-4 rounded-xl border border-neutral-200">
        <div className="relative w-full sm:w-80">
          <input
            type="text"
            placeholder="Buscar por título ou tema..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={filterCat}
            onChange={(e) => setFilterCat(e.target.value)}
            className="px-3 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas as categorias</option>
            <option value="inteligencia-artificial">Inteligência Artificial</option>
            <option value="robos-humanoides">Robôs Humanoides</option>
            <option value="saude-biotec">Saúde & Biotec</option>
            <option value="startups-futuro">Startups & Futuro</option>
          </select>

          <button
            onClick={loadArticles}
            disabled={loading}
            className="p-2 bg-white border border-neutral-300 hover:bg-neutral-100 rounded-lg text-neutral-700 transition-colors"
            title="Recarregar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Tabela de Artigos */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200 text-xs font-black uppercase tracking-wider text-neutral-600">
              <tr>
                <th className="px-6 py-4">Matéria</th>
                <th className="px-4 py-4">Categoria</th>
                <th className="px-4 py-4">Status</th>
                <th className="px-4 py-4">Destaque</th>
                <th className="px-4 py-4">Data</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {filteredArticles.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-neutral-400">
                    {loading
                      ? 'Carregando notícias do Supabase...'
                      : 'Nenhuma matéria encontrada. Execute a sincronização ou crie uma nova.'}
                  </td>
                </tr>
              ) : (
                filteredArticles.map((article) => (
                  <tr key={article.id} className="hover:bg-neutral-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3 max-w-lg">
                        {article.image_url && (
                          <img
                            src={article.image_url}
                            alt=""
                            className="w-12 h-10 object-cover rounded bg-neutral-100 shrink-0"
                          />
                        )}
                        <div>
                          <div className="font-bold text-black line-clamp-1">{article.title}</div>
                          <div className="text-xs text-neutral-400 font-mono line-clamp-1">
                            /noticia/{article.slug}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        {article.category_name}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold px-2 py-0.5 rounded ${
                          article.status === 'published'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {article.status === 'published' ? 'Publicado' : 'Rascunho'}
                      </span>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <button
                        onClick={() => toggleFeatured(article.id, article.is_featured)}
                        title={article.is_featured ? 'Remover destaque' : 'Fixar como destaque'}
                        className={`p-1.5 rounded transition-colors ${
                          article.is_featured
                            ? 'text-amber-500 bg-amber-50'
                            : 'text-neutral-300 hover:text-amber-400'
                        }`}
                      >
                        <Star className="w-4 h-4 fill-current" />
                      </button>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-xs text-neutral-500">
                      {formatDate(article.published_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right space-x-2">
                      <Link
                        href={`/noticia/${article.slug}`}
                        target="_blank"
                        className="inline-block p-1.5 text-neutral-400 hover:text-black rounded"
                        title="Visualizar no site"
                      >
                        <ExternalLink className="w-4 h-4" />
                      </Link>
                      <Link
                        href={`/futuroadmin/editar/${article.id}`}
                        className="inline-block p-1.5 text-neutral-400 hover:text-emerald-600 rounded"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button
                        onClick={() => deleteArticle(article.id, article.title)}
                        className="p-1.5 text-neutral-400 hover:text-red-600 rounded"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
