import { MetadataRoute } from 'next';
import { getPublishedArticles, getCategories } from '@/lib/supabase';
import { SITE_URL } from '@/lib/utils';

const siteUrl = SITE_URL;

export const revalidate = 60;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const articles = await getPublishedArticles({ limit: 1000 });
  const categories = await getCategories();

  const latestArticleDate =
    articles.length > 0
      ? new Date(articles[0].updated_at || articles[0].published_at)
      : new Date();
  const institutionalLastMod = new Date('2026-11-01T12:00:00Z');

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: siteUrl,
      lastModified: latestArticleDate,
      changeFrequency: 'hourly',
      priority: 1.0,
    },
    {
      url: `${siteUrl}/sobre`,
      lastModified: institutionalLastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${siteUrl}/privacidade`,
      lastModified: institutionalLastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/termos`,
      lastModified: institutionalLastMod,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${siteUrl}/contato`,
      lastModified: institutionalLastMod,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  const categoryRoutes: MetadataRoute.Sitemap = categories.map((cat) => {
    const latestInCat = articles.find((a) => a.category_slug === cat.slug);
    const catLastMod = latestInCat
      ? new Date(latestInCat.updated_at || latestInCat.published_at)
      : latestArticleDate;

    return {
      url: `${siteUrl}/categoria/${cat.slug}`,
      lastModified: catLastMod,
      changeFrequency: 'daily',
      priority: 0.8,
    };
  });

  const articleRoutes: MetadataRoute.Sitemap = articles.map((article) => ({
    url: `${siteUrl}/noticia/${article.slug}`,
    lastModified: new Date(article.updated_at || article.published_at),
    changeFrequency: 'weekly',
    priority: 0.9,
  }));

  return [...staticRoutes, ...categoryRoutes, ...articleRoutes];
}
