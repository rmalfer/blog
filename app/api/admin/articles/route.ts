import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { getAdminSession } from '@/lib/admin-auth';
import { supabaseAdmin } from '@/lib/supabase';

function revalidatePortalRoutes(slugs: string[] = [], categories: string[] = []) {
  try {
    revalidatePath('/', 'layout');
    revalidatePath('/');
    revalidatePath('/sitemap.xml');
    for (const cat of new Set(categories.filter(Boolean))) {
      revalidatePath(`/categoria/${cat}`);
    }
    for (const slug of new Set(slugs.filter(Boolean))) {
      revalidatePath(`/noticia/${slug}`);
    }
  } catch (err) {
    console.warn('revalidatePortalRoutes warning:', err);
  }
}

export async function GET(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (id) {
    const { data, error } = await supabaseAdmin
      .from('articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Matéria não encontrada.' }, { status: 404 });
    }
    return NextResponse.json({ article: data });
  }

  // Carrega todos os artigos (ativos e inativos) sem perder registros
  const { data, error } = await supabaseAdmin
    .from('articles')
    .select('*')
    .order('published_at', { ascending: false })
    .range(0, 999);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ articles: data || [] });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const { data, error } = await supabaseAdmin
      .from('articles')
      .insert([payload])
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePortalRoutes([data.slug], [data.category_slug]);
    return NextResponse.json({ article: data }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao criar artigo' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  try {
    const body = await request.json();

    // 1. Atualização em massa por lista de IDs (preserva slug, published_at e created_at)
    if (Array.isArray(body?.ids) && body.ids.length > 0) {
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };
      if (body.status && ['published', 'draft', 'archived'].includes(body.status)) {
        updates.status = body.status;
      }
      if (typeof body.is_featured === 'boolean') {
        updates.is_featured = body.is_featured;
      }

      // Processa em lotes de 100 IDs para evitar URL muito longa no PostgREST
      const affectedSlugs: string[] = [];
      const affectedCats: string[] = [];
      const chunkSize = 100;

      for (let i = 0; i < body.ids.length; i += chunkSize) {
        const chunk = body.ids.slice(i, i + chunkSize);
        const { data, error } = await supabaseAdmin
          .from('articles')
          .update(updates)
          .in('id', chunk)
          .select('id, slug, category_slug, status, is_featured');

        if (error) {
          return NextResponse.json({ error: error.message }, { status: 400 });
        }
        for (const row of data || []) {
          affectedSlugs.push(row.slug);
          affectedCats.push(row.category_slug);
        }
      }

      revalidatePortalRoutes(affectedSlugs, affectedCats);
      return NextResponse.json({ updated: affectedSlugs.length });
    }

    // 2. Atualização individual por ID
    const id = body?.id as string | undefined;
    const updates = body?.updates as Record<string, any> | undefined;
    if (!id || !updates) {
      return NextResponse.json({ error: 'Informe id e updates ou ids.' }, { status: 400 });
    }

    const safeUpdates = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabaseAdmin
      .from('articles')
      .update(safeUpdates)
      .eq('id', id)
      .select('*')
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    revalidatePortalRoutes([data.slug], [data.category_slug]);
    return NextResponse.json({ article: data });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Erro ao atualizar artigo' }, { status: 400 });
  }
}

export async function DELETE(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) {
    return NextResponse.json({ error: 'ID obrigatório' }, { status: 400 });
  }

  const { data: existing } = await supabaseAdmin
    .from('articles')
    .select('slug, category_slug')
    .eq('id', id)
    .single();

  const { error } = await supabaseAdmin.from('articles').delete().eq('id', id);
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (existing) {
    revalidatePortalRoutes([existing.slug], [existing.category_slug]);
  } else {
    revalidatePortalRoutes();
  }

  return NextResponse.json({ deleted: true });
}
