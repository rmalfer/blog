import { createClient } from '@supabase/supabase-js';
import { Article, Category } from './types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jupjgvmhjybsztjevsap.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_uDVjtCRetSOA0nBWlscWjA_uNfsiB-j';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseAnonKey;

// Cliente público para queries no browser e componentes server
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Cliente com permissões elevadas para ações de servidor/admin
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Categorias padrão de contingência
export const DEFAULT_CATEGORIES: Category[] = [
  { id: '1', name: 'Inteligência Artificial', slug: 'inteligencia-artificial', description: 'Modelos cognitivos, LLMs e IA generativa', created_at: new Date().toISOString() },
  { id: '2', name: 'Robôs Humanoides', slug: 'robos-humanoides', description: 'Automação corporal, robôs bípedes e IA corporificada', created_at: new Date().toISOString() },
  { id: '3', name: 'Saúde & Biotec', slug: 'saude-biotec', description: 'Medicina diagnóstica e biologia computacional', created_at: new Date().toISOString() },
  { id: '4', name: 'Startups & Futuro', slug: 'startups-futuro', description: 'Novos mercados, tendências e investimentos', created_at: new Date().toISOString() },
];

export async function getPublishedArticles(options: {
  limit?: number;
  categorySlug?: string;
  offset?: number;
} = {}): Promise<Article[]> {
  try {
    let query = supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('published_at', { ascending: false });

    if (options.categorySlug) {
      query = query.eq('category_slug', options.categorySlug);
    }

    if (options.limit) {
      const from = options.offset || 0;
      const to = from + options.limit - 1;
      query = query.range(from, to);
    }

    const { data, error } = await query;
    if (error) {
      console.warn('Supabase getPublishedArticles warning:', error.message);
      return [];
    }
    return (data as Article[]) || [];
  } catch (err) {
    console.error('Failed to fetch articles from Supabase:', err);
    return [];
  }
}

export async function getFeaturedArticles(limit: number = 5): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .eq('is_featured', true)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      // Se não houver marcados como destaque, busca os mais recentes
      return getPublishedArticles({ limit });
    }
    return data as Article[];
  } catch {
    return getPublishedArticles({ limit });
  }
}

export async function getArticleBySlug(slug: string): Promise<Article | null> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.warn('Supabase getArticleBySlug warning:', error.message);
      return null;
    }
    return data as Article;
  } catch (err) {
    console.error('Error in getArticleBySlug:', err);
    return null;
  }
}

export async function getRelatedArticles(categorySlug: string, currentSlug: string, limit: number = 3): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .eq('category_slug', categorySlug)
      .neq('slug', currentSlug)
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error || !data) return [];
    return data as Article[];
  } catch {
    return [];
  }
}

export async function getTrendingArticles(limit: number = 5): Promise<Article[]> {
  try {
    const { data, error } = await supabase
      .from('articles')
      .select('*')
      .eq('status', 'published')
      .order('views_count', { ascending: false })
      .order('published_at', { ascending: false })
      .limit(limit);

    if (error || !data || data.length === 0) {
      return getPublishedArticles({ limit });
    }
    return data as Article[];
  } catch {
    return getPublishedArticles({ limit });
  }
}

export async function getCategories(): Promise<Category[]> {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error || !data || data.length === 0) {
      return DEFAULT_CATEGORIES;
    }
    return data as Category[];
  } catch {
    return DEFAULT_CATEGORIES;
  }
}
