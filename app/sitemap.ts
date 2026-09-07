import { MetadataRoute } from 'next';
import { getPublishedArticles, getCategories } from '@/lib/supabase';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://umfuturoproximo.vercel.app';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles({ limit: 500 });
  const categories = await getCategories();

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: new Date(),
      changeFrequency: 'hourly',
      priority: 1.0,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => ({
    url: `${siteUrl}/categoria/${cat.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily',
    priority: 0.8,
  }));

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/noticia/${article.slug}`,
    lastModified: new Date(article.updated_at || article.published_at),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
