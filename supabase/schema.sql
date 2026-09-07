-- ==============================================================================
-- SCHEMA DO PORTAL 'UM FUTURO PRÓXIMO' (SUPABASE POSTGRESQL)
-- Autor: Riccardo Malfer
-- ==============================================================================

-- 1. Habilita extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Tabela de Categorias
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Artigos / Notícias
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    category_name TEXT NOT NULL,
    category_slug TEXT NOT NULL,
    image_url TEXT,
    source_url TEXT,
    author_name TEXT NOT NULL DEFAULT 'Riccardo Malfer',
    author_role TEXT DEFAULT 'Editor & Especialista em IA',
    status TEXT NOT NULL DEFAULT 'published' CHECK (status IN ('published', 'draft', 'archived')),
    is_featured BOOLEAN DEFAULT FALSE,
    reading_time TEXT DEFAULT '3 min de leitura',
    views_count INTEGER DEFAULT 0,
    sheet_source TEXT,
    sheet_row INTEGER,
    published_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Tabela de Logs de Sincronização
CREATE TABLE IF NOT EXISTS public.sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source TEXT NOT NULL,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    finished_at TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'running',
    total_read INTEGER DEFAULT 0,
    total_published INTEGER DEFAULT 0,
    errors_count INTEGER DEFAULT 0,
    details JSONB
);

-- 5. Índices de alta performance para o feed e rotas do Next.js
CREATE INDEX IF NOT EXISTS idx_articles_slug ON public.articles(slug);
CREATE INDEX IF NOT EXISTS idx_articles_status_pub ON public.articles(status, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_articles_category ON public.articles(category_slug);
CREATE INDEX IF NOT EXISTS idx_articles_featured ON public.articles(is_featured);
CREATE INDEX IF NOT EXISTS idx_articles_source_url ON public.articles(source_url);

-- 6. Categorias Pré-definidas do Portal
INSERT INTO public.categories (name, slug, description) VALUES
('Inteligência Artificial', 'inteligencia-artificial', 'Notícias, avanços e pesquisas sobre LLMs, modelos cognitivos e agentes autônomos'),
('Robôs Humanoides', 'robos-humanoides', 'Robótica corporal, humanoides bípedes e automação industrial e doméstica'),
('Saúde & Biotec', 'saude-biotec', 'Inovações em medicina diagnóstica, biotecnologia e IA aplicada à longevidade'),
('Startups & Futuro', 'startups-futuro', 'Novos investimentos, tendências emergentes e ecossistema global de tecnologia')
ON CONFLICT (slug) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description;

-- 7. Configuração de RLS (Row Level Security)
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;

-- Políticas de Leitura Pública
DROP POLICY IF EXISTS "Public Read Categories" ON public.categories;
CREATE POLICY "Public Read Categories" ON public.categories
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public Read Published Articles" ON public.articles;
CREATE POLICY "Public Read Published Articles" ON public.articles
    FOR SELECT USING (status = 'published');

-- Políticas de Escrita / Modificação (Permite service_role e anon se necessário)
DROP POLICY IF EXISTS "Enable all access for service role on articles" ON public.articles;
CREATE POLICY "Enable all access for service role on articles" ON public.articles
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for service role on categories" ON public.categories;
CREATE POLICY "Enable all access for service role on categories" ON public.categories
    FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Enable all access for service role on sync_logs" ON public.sync_logs;
CREATE POLICY "Enable all access for service role on sync_logs" ON public.sync_logs
    FOR ALL USING (true) WITH CHECK (true);

-- Função de trigger para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS trg_articles_updated_at ON public.articles;
CREATE TRIGGER trg_articles_updated_at
    BEFORE UPDATE ON public.articles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
