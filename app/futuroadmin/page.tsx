'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Article } from '@/lib/types';
import { formatDate } from '@/lib/utils';
import {
  Shield,
  Plus,
  RefreshCw,
  Edit,
  Trash2,
  Star,
  CheckCircle,
  EyeOff,
  Layers,
  Search,
  ExternalLink,
  Bot,
  Power,
  Sparkles,
  CheckSquare,
  Square,
  ChevronLeft,
  ChevronRight,
  Lock,
  Mail,
} from 'lucide-react';

const PAGE_SIZE = 50;

export default function AdminPage() {
  const [authChecked, setAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [adminEmail, setAdminEmail] = useState('rmalfer@gmail.com');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loggingIn, setLoggingIn] = useState(false);

  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(false);
  const [busyMessage, setBusyMessage] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'inactive'>('all');
  const [filterOrigin, setFilterOrigin] = useState<'all' | 'original' | 'aggregated'>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await fetch('/api/admin/me', { cache: 'no-store' });
      if (res.ok) {
        const data = await res.json();
        setIsAuthenticated(true);
        if (data.email) setAdminEmail(data.email);
        await loadArticles();
      }
    } catch (err) {
      console.error('Erro ao verificar sessão:', err);
    } finally {
      setAuthChecked(true);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoggingIn(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: adminEmail, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setLoginError(data.error || 'Credenciais inválidas.');
        return;
      }
      setIsAuthenticated(true);
      setPassword('');
      await loadArticles();
    } catch {
      setLoginError('Erro de conexão ao autenticar.');
    } finally {
      setLoggingIn(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setIsAuthenticated(false);
    setArticles([]);
    setSelectedIds(new Set());
  };

  const loadArticles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/admin/articles', { cache: 'no-store' });
      if (res.status === 401) {
        setIsAuthenticated(false);
        return;
      }
      const data = await res.json();
      if (res.ok && Array.isArray(data.articles)) {
        setArticles(data.articles as Article[]);
      }
    } catch (err) {
      console.error('Erro ao carregar notícias:', err);
    } finally {
      setLoading(false);
    }
  };

  const showToast = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(null), 5000);
  };

  const toggleStatus = async (article: Article) => {
    const nextStatus = article.status === 'published' ? 'draft' : 'published';
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: article.id, updates: { status: nextStatus } }),
      });
      if (!res.ok) throw new Error('Falha ao atualizar status');
      setArticles((prev) =>
        prev.map((a) => (a.id === article.id ? { ...a, status: nextStatus } : a))
      );
      showToast(
        nextStatus === 'published'
          ? `Ativada no portal: "${article.title.slice(0, 50)}"`
          : `Desativada (link /noticia/${article.slug} preservado no banco).`
      );
    } catch {
      alert('Erro ao alterar status da matéria.');
    }
  };

  const toggleFeatured = async (id: string, current: boolean) => {
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, updates: { is_featured: !current } }),
      });
      if (!res.ok) throw new Error();
      setArticles((prev) =>
        prev.map((a) => (a.id === id ? { ...a, is_featured: !current } : a))
      );
    } catch {
      alert('Erro ao alternar destaque.');
    }
  };

  const bulkUpdateStatus = async (ids: string[], status: 'published' | 'draft', label: string) => {
    if (ids.length === 0) return;
    setBusyMessage(label);
    try {
      const res = await fetch('/api/admin/articles', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids, status }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha na ação em massa');

      const idSet = new Set(ids);
      setArticles((prev) =>
        prev.map((a) => (idSet.has(a.id) ? { ...a, status } : a))
      );
      setSelectedIds(new Set());
      showToast(
        status === 'published'
          ? `${data.updated} matérias ativadas no portal!`
          : `${data.updated} matérias desativadas para leitura (todos os links/slugs foram preservados!).`
      );
    } catch (err: any) {
      alert(err?.message || 'Erro ao executar ação em massa.');
    } finally {
      setBusyMessage(null);
    }
  };

  const activateAdSenseReviewMode = async () => {
    const originalIds = articles.filter((a) => !a.source_url).map((a) => a.id);
    const aggregatedPublishedIds = articles
      .filter((a) => Boolean(a.source_url) && a.status === 'published')
      .map((a) => a.id);

    if (originalIds.length === 0) {
      alert(
        'Não há artigos autorais (sem link externo de fonte) cadastrados. Selecione manualmente os artigos que deseja manter ativos.'
      );
      return;
    }

    if (
      !confirm(
        `MODO REVISÃO ADSENSE:\n\n` +
          `• Manterá ATIVAS as ${originalIds.length} matérias autorais/perenes.\n` +
          `• Desativará temporariamente ${aggregatedPublishedIds.length} notícias agregadas (sem apagar nenhum link/slug).\n\n` +
          `Depois da aprovação do AdSense, você pode reativar todas com 1 clique. Deseja continuar?`
      )
    ) {
      return;
    }

    setBusyMessage('Aplicando Modo Revisão AdSense...');
    try {
      if (aggregatedPublishedIds.length > 0) {
        const res1 = await fetch('/api/admin/articles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: aggregatedPublishedIds, status: 'draft' }),
        });
        if (!res1.ok) throw new Error('Falha ao desativar notícias agregadas');
      }
      const inactiveOriginals = articles
        .filter((a) => !a.source_url && a.status !== 'published')
        .map((a) => a.id);
      if (inactiveOriginals.length > 0) {
        const res2 = await fetch('/api/admin/articles', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: inactiveOriginals, status: 'published' }),
        });
        if (!res2.ok) throw new Error('Falha ao ativar matérias autorais');
      }
      await loadArticles();
      showToast(
        `Modo Revisão AdSense aplicado! ${originalIds.length} artigos autorais ativos e ${aggregatedPublishedIds.length} notícias pausadas com links preservados.`
      );
    } catch (err: any) {
      alert(err?.message || 'Erro ao aplicar Modo Revisão AdSense.');
    } finally {
      setBusyMessage(null);
    }
  };

  const reactivateAllArticles = async () => {
    const inactiveIds = articles.filter((a) => a.status !== 'published').map((a) => a.id);
    if (inactiveIds.length === 0) {
      showToast('Todas as matérias já estão ativas no portal.');
      return;
    }
    if (
      !confirm(
        `Reativar todas as ${inactiveIds.length} matérias inativas? Todos os links originais voltarão imediatamente ao ar e ao sitemap.xml.`
      )
    ) {
      return;
    }
    await bulkUpdateStatus(inactiveIds, 'published', 'Reativando todas as matérias...');
  };

  const deleteArticle = async (id: string, title: string) => {
    if (
      !confirm(
        `Atenção: isso EXCLUI permanentemente "${title}". Se quiser apenas ocultar sem perder o link, use o botão Desativar.\n\nDeseja realmente excluir?`
      )
    ) {
      return;
    }
    try {
      const res = await fetch(`/api/admin/articles?id=${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error();
      setArticles((prev) => prev.filter((a) => a.id !== id));
      setSelectedIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    } catch {
      alert('Erro ao excluir artigo.');
    }
  };

  const filteredArticles = useMemo(() => {
    const q = search.trim().toLowerCase();
    return articles.filter((a) => {
      const matchSearch =
        !q ||
        a.title.toLowerCase().includes(q) ||
        a.slug.toLowerCase().includes(q) ||
        a.category_name.toLowerCase().includes(q);
      const matchCat = filterCat === 'all' || a.category_slug === filterCat;
      const matchStatus =
        filterStatus === 'all' ||
        (filterStatus === 'published' ? a.status === 'published' : a.status !== 'published');
      const matchOrigin =
        filterOrigin === 'all' ||
        (filterOrigin === 'original' ? !a.source_url : Boolean(a.source_url));
      return matchSearch && matchCat && matchStatus && matchOrigin;
    });
  }, [articles, search, filterCat, filterStatus, filterOrigin]);

  const totalPages = Math.max(1, Math.ceil(filteredArticles.length / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);
  const paginatedArticles = filteredArticles.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE
  );

  const toggleSelectOne = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allFilteredSelected =
    filteredArticles.length > 0 && filteredArticles.every((a) => selectedIds.has(a.id));

  const toggleSelectAllFiltered = () => {
    if (allFilteredSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredArticles.map((a) => a.id)));
    }
  };

  if (!authChecked) {
    return (
      <div className="max-w-md mx-auto my-20 text-center text-sm text-neutral-500">
        Verificando sessão administrativa...
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="max-w-md mx-auto my-16 p-8 bg-white border border-neutral-200 rounded-2xl shadow-sm">
        <div className="w-12 h-12 bg-black text-emerald-400 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Shield className="w-6 h-6" />
        </div>
        <h1 className="text-2xl font-black text-black text-center">Acesso Administrativo</h1>
        <p className="text-sm text-neutral-500 mt-1 mb-6 text-center">
          Painel Editorial do Portal Um Futuro Próximo
        </p>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Usuário (E-mail)
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="email"
                placeholder="rmalfer@gmail.com"
                value={adminEmail}
                onChange={(e) => setAdminEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Senha
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-3.5" />
              <input
                type="password"
                placeholder="Digite sua senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 border border-neutral-300 rounded-lg text-sm focus:outline-none focus:border-emerald-500"
                required
                autoFocus
              />
            </div>
          </div>

          {loginError && (
            <div className="p-3 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 rounded-lg">
              {loginError}
            </div>
          )}

          <button
            type="submit"
            disabled={loggingIn}
            className="w-full py-3 bg-black hover:bg-emerald-600 text-white font-extrabold text-sm uppercase rounded-lg transition-colors disabled:opacity-50"
          >
            {loggingIn ? 'Autenticando...' : 'Entrar no Painel'}
          </button>
        </form>
      </div>
    );
  }

  const totalPublished = articles.filter((a) => a.status === 'published').length;
  const totalInactive = articles.length - totalPublished;
  const totalOriginals = articles.filter((a) => !a.source_url).length;
  const totalFeatured = articles.filter((a) => a.is_featured).length;

  return (
    <div className="space-y-6">
      {/* Header Admin */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-neutral-200 pb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-emerald-600 mb-1">
            <Shield className="w-4 h-4" />
            <span>Painel Editorial Seguro</span>
          </div>
          <h1 className="text-3xl font-black text-black tracking-tight">
            Gerenciamento de Publicações
          </h1>
          <p className="text-xs text-neutral-500 mt-0.5">
            Logado como <strong>{adminEmail}</strong> • Desativar oculta a leitura no portal sem apagar links/slugs.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Link
            href="/futuroadmin/sync"
            className="inline-flex items-center gap-2 px-3.5 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-800 text-xs font-bold uppercase rounded-lg transition-colors"
          >
            <Bot className="w-4 h-4 text-emerald-600" />
            <span>Ollama / Sheets</span>
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
            className="text-xs font-bold text-neutral-500 hover:text-red-600 px-3 py-2 border border-neutral-200 rounded-lg"
          >
            Sair
          </button>
        </div>
      </div>

      {feedback && (
        <div className="p-4 bg-emerald-50 border border-emerald-300 text-emerald-900 rounded-xl text-sm font-semibold">
          {feedback}
        </div>
      )}

      {busyMessage && (
        <div className="p-4 bg-amber-50 border border-amber-300 text-amber-900 rounded-xl text-sm font-semibold flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin" />
          <span>{busyMessage}</span>
        </div>
      )}

      {/* Estatísticas Rápidas */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Total no Banco
            </span>
            <Layers className="w-4 h-4 text-neutral-400" />
          </div>
          <div className="text-2xl font-black text-black mt-1.5">{articles.length}</div>
        </div>

        <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">
              Ativas no Portal
            </span>
            <CheckCircle className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-black text-emerald-700 mt-1.5">{totalPublished}</div>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800">
              Inativas (Preservadas)
            </span>
            <EyeOff className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-black text-amber-700 mt-1.5">{totalInactive}</div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Autorais / Perenes
            </span>
            <Sparkles className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-black mt-1.5">{totalOriginals}</div>
        </div>

        <div className="bg-neutral-50 border border-neutral-200 rounded-xl p-4 col-span-2 lg:col-span-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-500">
              Destaques
            </span>
            <Star className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600 mt-1.5">{totalFeatured}</div>
        </div>
      </div>

      {/* Atalhos rápidos AdSense */}
      <div className="bg-neutral-950 text-white rounded-xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-l-4 border-emerald-500">
        <div>
          <div className="text-xs font-black uppercase tracking-wider text-emerald-400">
            Controle Rápido para Aprovação no Google AdSense
          </div>
          <p className="text-xs text-neutral-300 mt-1 max-w-2xl">
            Ative o <strong>Modo Revisão AdSense</strong> para exibir apenas os artigos autorais aprofundados enquanto oculta temporariamente as notícias agregadas — mantendo 100% dos slugs/links salvos no Supabase para reativação em 1 clique depois.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            onClick={activateAdSenseReviewMode}
            disabled={Boolean(busyMessage)}
            className="px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-extrabold uppercase rounded-lg transition-colors disabled:opacity-50"
          >
            Modo Revisão AdSense ({totalOriginals} autorais)
          </button>
          <button
            onClick={reactivateAllArticles}
            disabled={Boolean(busyMessage) || totalInactive === 0}
            className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold uppercase rounded-lg transition-colors disabled:opacity-40"
          >
            Reativar Todas ({totalInactive})
          </button>
        </div>
      </div>

      {/* Barra de Filtros */}
      <div className="flex flex-col lg:flex-row gap-3 justify-between items-stretch lg:items-center bg-neutral-50 p-4 rounded-xl border border-neutral-200">
        <div className="relative flex-1 min-w-[220px]">
          <input
            type="text"
            placeholder="Buscar por título, slug ou categoria..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
          />
          <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            value={filterStatus}
            onChange={(e) => {
              setFilterStatus(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-bold bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todos os status ({articles.length})</option>
            <option value="published">Somente Ativas ({totalPublished})</option>
            <option value="inactive">Somente Inativas ({totalInactive})</option>
          </select>

          <select
            value={filterOrigin}
            onChange={(e) => {
              setFilterOrigin(e.target.value as any);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-bold bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
          >
            <option value="all">Todas as origens</option>
            <option value="original">Autorais / Perenes ({totalOriginals})</option>
            <option value="aggregated">Notícias com fonte ({articles.length - totalOriginals})</option>
          </select>

          <select
            value={filterCat}
            onChange={(e) => {
              setFilterCat(e.target.value);
              setCurrentPage(1);
            }}
            className="px-3 py-2 text-xs font-bold bg-white border border-neutral-300 rounded-lg focus:outline-none focus:border-emerald-500"
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

      {/* Barra de Ações em Massa quando há itens selecionados */}
      {selectedIds.size > 0 && (
        <div className="bg-emerald-50 border border-emerald-300 rounded-xl p-3.5 flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-extrabold text-emerald-950 uppercase tracking-wider">
            {selectedIds.size} {selectedIds.size === 1 ? 'matéria selecionada' : 'matérias selecionadas'}
          </span>
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() =>
                bulkUpdateStatus(
                  Array.from(selectedIds),
                  'published',
                  `Ativando ${selectedIds.size} matérias...`
                )
              }
              disabled={Boolean(busyMessage)}
              className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold uppercase rounded-lg"
            >
              Ativar Selecionadas
            </button>
            <button
              onClick={() =>
                bulkUpdateStatus(
                  Array.from(selectedIds),
                  'draft',
                  `Desativando ${selectedIds.size} matérias...`
                )
              }
              disabled={Boolean(busyMessage)}
              className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold uppercase rounded-lg"
            >
              Desativar Selecionadas
            </button>
            <button
              onClick={() => setSelectedIds(new Set())}
              className="px-3 py-2 text-xs font-bold text-neutral-600 hover:text-black"
            >
              Limpar seleção
            </button>
          </div>
        </div>
      )}

      {/* Tabela de Artigos */}
      <div className="bg-white border border-neutral-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-neutral-100 border-b border-neutral-200 text-xs font-black uppercase tracking-wider text-neutral-600">
              <tr>
                <th className="pl-4 pr-2 py-3.5 w-10">
                  <button
                    type="button"
                    onClick={toggleSelectAllFiltered}
                    title={allFilteredSelected ? 'Desmarcar todas' : 'Selecionar todas filtradas'}
                    className="text-neutral-600 hover:text-black"
                  >
                    {allFilteredSelected ? (
                      <CheckSquare className="w-4 h-4 text-emerald-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </th>
                <th className="px-4 py-3.5">Matéria ({filteredArticles.length})</th>
                <th className="px-3 py-3.5">Categoria</th>
                <th className="px-3 py-3.5">Visibilidade no Portal</th>
                <th className="px-3 py-3.5">Destaque</th>
                <th className="px-3 py-3.5">Data</th>
                <th className="px-4 py-3.5 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              {paginatedArticles.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-neutral-400">
                    {loading
                      ? 'Carregando notícias do Supabase...'
                      : 'Nenhuma matéria encontrada para os filtros selecionados.'}
                  </td>
                </tr>
              ) : (
                paginatedArticles.map((article) => {
                  const isActive = article.status === 'published';
                  const isSelected = selectedIds.has(article.id);
                  const isOriginal = !article.source_url;
                  return (
                    <tr
                      key={article.id}
                      className={`transition-colors ${
                        !isActive ? 'bg-neutral-50/70 opacity-80' : 'hover:bg-neutral-50/80'
                      }`}
                    >
                      <td className="pl-4 pr-2 py-3.5">
                        <button
                          type="button"
                          onClick={() => toggleSelectOne(article.id)}
                          className="text-neutral-500 hover:text-black"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4 text-emerald-600" />
                          ) : (
                            <Square className="w-4 h-4" />
                          )}
                        </button>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-3 max-w-lg">
                          {article.image_url && (
                            <img
                              src={article.image_url}
                              alt=""
                              className="w-12 h-10 object-cover rounded bg-neutral-100 shrink-0"
                              loading="lazy"
                            />
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              {isOriginal && (
                                <span className="text-[10px] font-black uppercase bg-emerald-500 text-black px-1.5 py-0.5 rounded shrink-0">
                                  Autoral
                                </span>
                              )}
                              <div className="font-bold text-black line-clamp-1">{article.title}</div>
                            </div>
                            <div className="text-xs text-neutral-400 font-mono line-clamp-1">
                              /noticia/{article.slug}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                          {article.category_name}
                        </span>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <button
                          type="button"
                          onClick={() => toggleStatus(article)}
                          title={
                            isActive
                              ? 'Clique para desativar (mantém o link salvo)'
                              : 'Clique para reativar no site'
                          }
                          className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full transition-colors ${
                            isActive
                              ? 'bg-emerald-100 text-emerald-800 hover:bg-amber-100 hover:text-amber-900'
                              : 'bg-neutral-200 text-neutral-700 hover:bg-emerald-100 hover:text-emerald-800'
                          }`}
                        >
                          <Power className="w-3.5 h-3.5" />
                          <span>{isActive ? 'Ativa' : 'Inativa'}</span>
                        </button>
                      </td>
                      <td className="px-3 py-3.5 whitespace-nowrap">
                        <button
                          type="button"
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
                      <td className="px-3 py-3.5 whitespace-nowrap text-xs text-neutral-500">
                        {formatDate(article.published_at)}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap text-right space-x-1">
                        {isActive && (
                          <Link
                            href={`/noticia/${article.slug}`}
                            target="_blank"
                            className="inline-block p-1.5 text-neutral-400 hover:text-black rounded"
                            title="Abrir no portal"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                        )}
                        <Link
                          href={`/futuroadmin/editar/${article.id}`}
                          className="inline-block p-1.5 text-neutral-400 hover:text-emerald-600 rounded"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </Link>
                        <button
                          type="button"
                          onClick={() => deleteArticle(article.id, article.title)}
                          className="p-1.5 text-neutral-400 hover:text-red-600 rounded"
                          title="Excluir permanentemente"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Paginação do Admin */}
        {totalPages > 1 && (
          <div className="px-4 py-3 bg-neutral-50 border-t border-neutral-200 flex items-center justify-between text-xs">
            <span className="text-neutral-500 font-semibold">
              Página {safePage} de {totalPages} • Mostrando {paginatedArticles.length} de{' '}
              {filteredArticles.length} matérias
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={safePage <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-300 rounded font-bold disabled:opacity-40"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Anterior
              </button>
              <button
                type="button"
                disabled={safePage >= totalPages}
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                className="inline-flex items-center gap-1 px-3 py-1.5 bg-white border border-neutral-300 rounded font-bold disabled:opacity-40"
              >
                Próxima
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
