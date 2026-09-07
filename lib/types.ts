export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string;
  category_id?: string | null;
  category_name: string;
  category_slug: string;
  image_url: string | null;
  source_url: string | null;
  author_name: string;
  author_role: string | null;
  status: 'published' | 'draft' | 'archived';
  is_featured: boolean;
  reading_time: string;
  views_count: number;
  sheet_source?: string | null;
  sheet_row?: number | null;
  published_at: string;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  created_at: string;
}

export interface SyncLog {
  id: string;
  source: string;
  started_at: string;
  finished_at: string | null;
  status: string;
  total_read: number;
  total_published: number;
  errors_count: number;
  details?: Record<string, any> | null;
}
