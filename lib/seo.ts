import { Article } from './types';

export interface HighlightItem {
  label: string;
  text: string;
}

/**
 * Overrides editoriais curados para artigos específicos de referência
 */
const CURATED_OVERRIDES: Record<
  string,
  {
    seoTitle?: string;
    lead?: string;
    imageAlt?: string;
    highlights?: HighlightItem[];
  }
> = {
  'nvidia-lanca-arquitetura-de-referencia-openshell-para-isolamento-e-contencao-segura-de-agentes-de-ia': {
    seoTitle: 'NVIDIA OpenShell: Arquitetura de Contenção de Agentes de IA',
    lead: 'Nova solução de segurança da NVIDIA combina GPUs Rubin, CPUs Vera e DPUs BlueField-4 para isolar processos de agentes em milissegundos e proteger credenciais corporativas.',
    imageAlt:
      'Diagrama conceitual da arquitetura NVIDIA OpenShell mostrando a contenção de agentes de IA via DPUs BlueField-4 e CPUs Vera',
    highlights: [
      {
        label: 'Isolamento em nível de kernel',
        text: 'Sandbox com permissões dinâmicas impede que agentes autônomos acessem recursos não autorizados.',
      },
      {
        label: 'Integração vertical',
        text: 'Processamento em GPUs Rubin, execução lógica em CPUs Vera e governança física por DPUs BlueField-4.',
      },
      {
        label: 'Proteção de credenciais',
        text: 'O software NVIDIA Sentry oculta chaves e senhas dos modelos de linguagem para mitigar injeção de prompt.',
      },
      {
        label: 'Disponibilidade',
        text: 'Lançado sob licença open-source Apache 2.0 e pronto para implantação em infraestruturas DSX POD.',
      },
    ],
  },
};

/**
 * Remove tags HTML e normaliza espaços
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]*>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * 1. Subtítulo (Linha Fina / Lead) e Meta Description (120 a 160 caracteres)
 * Garante um texto conciso de 1 a 2 frases curtas que complementa o H1
 * sem repetir os bullet points nem estourar o limite da SERP/Google Discover.
 */
export function formatLeadSubtitle(article: Article): string {
  const curated = CURATED_OVERRIDES[article.slug]?.lead;
  if (curated) return curated;

  const raw = stripHtml(article.excerpt || '');
  if (!raw) {
    const firstParaMatch = article.content.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const fallbackText = firstParaMatch ? stripHtml(firstParaMatch[1]) : article.title;
    return condenseToLength(fallbackText, 120, 160);
  }

  if (raw.length >= 110 && raw.length <= 172) {
    return raw;
  }

  return condenseToLength(raw, 120, 160);
}

/**
 * Condensa um texto longo para a faixa ideal de 120-160 caracteres
 * priorizando o fechamento na primeira sentença completa ou cláusula semântica.
 */
function condenseToLength(text: string, minLen = 120, maxLen = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= maxLen) return clean;

  // Tenta extrair a primeira frase completa se ela estiver num tamanho bom (85 a 165 chars)
  const sentences = clean.split(/(?<=[.!?])\s+/);
  if (sentences.length > 0) {
    const first = sentences[0].trim();
    if (first.length >= 85 && first.length <= 165) {
      return first;
    }
    if (sentences.length > 1) {
      const twoSentences = `${first} ${sentences[1].trim()}`;
      if (twoSentences.length <= 165) {
        return twoSentences;
      }
    }
  }

  // Tenta cortar em uma vírgula ou ponto-e-vírgula entre minLen e maxLen
  const slice = clean.slice(0, maxLen);
  const lastClause = Math.max(slice.lastIndexOf('; '), slice.lastIndexOf(', '), slice.lastIndexOf(' — '));
  if (lastClause >= minLen - 15) {
    return `${slice.slice(0, lastClause).trim()}.`;
  }

  // Corta na última palavra completa até maxLen - 1 e fecha com ponto ou reticências
  const lastSpace = slice.lastIndexOf(' ');
  if (lastSpace > 80) {
    const trimmed = slice.slice(0, lastSpace).replace(/[,;:\-–—]+$/, '').trim();
    return trimmed.endsWith('.') ? trimmed : `${trimmed}.`;
  }

  return `${clean.slice(0, maxLen - 3).trim()}...`;
}

/**
 * 2. Tamanho da <title> Tag vs. H1
 * O layout.tsx aplica o template "%s | Um Futuro Próximo".
 * Mantemos o H1 completo no corpo da página, mas na tag <title> geramos uma versão
 * enxuta (45-62 chars) com a entidade/palavra-chave primária à esquerda.
 */
export function generateSeoTitle(article: Article): string {
  const curated = CURATED_OVERRIDES[article.slug]?.seoTitle;
  if (curated) return curated;

  const fullTitle = article.title.trim();
  if (fullTitle.length <= 62) {
    return fullTitle;
  }

  // Extrai termos técnicos/entidades fortes do conteúdo ou do próprio título
  const strongMatches = Array.from(
    article.content.matchAll(/<(?:strong|em)>([^<]{2,32})<\/(?:strong|em)>/gi)
  ).map((m) => m[1].trim());

  // Verifica se o título começa com verbo de ação após o sujeito (ex.: "Empresa X lança/anuncia/apresenta Y para Z")
  const verbPattern =
    /^([^:]{2,35}?)\s+(?:lança|anuncia|apresenta|revela|oficializa|desenvolve|implementa|propõe|inaugura|firma|fecha|adota|cria|disponibiliza|bloqueia|abre|atinge)\s+(.*)$/i;
  const match = fullTitle.match(verbPattern);

  if (match) {
    const subject = match[1].trim();
    let rest = match[2].trim();

    // Remove conectivos longos no final ("para viabilizar...", "com foco em...", "em meio a...")
    rest = rest.replace(/\s+(?:para\s+viabilizar|com\s+o\s+objetivo\s+de|em\s+meio\s+a|visando\s+a)\s+.*$/i, '');

    // Capitaliza a primeira letra do complemento
    const capRest = rest.charAt(0).toUpperCase() + rest.slice(1);
    const candidate = `${subject}: ${capRest}`;

    if (candidate.length <= 62) {
      return candidate;
    }

    // Encurta na última palavra completa até 60 caracteres removendo preposições soltas no fim
    return truncateTitleCleanly(candidate, 60);
  }

  // Se houver uma entidade técnica curta no início ou nas tags strong
  const primaryEntity = strongMatches.find(
    (term) =>
      term.length >= 3 &&
      term.length <= 22 &&
      fullTitle.toLowerCase().includes(term.toLowerCase())
  );

  if (primaryEntity && !fullTitle.toLowerCase().startsWith(primaryEntity.toLowerCase())) {
    const cleanedRemainder = fullTitle
      .replace(new RegExp(primaryEntity, 'i'), '')
      .replace(/^\s*[,;:\-–—]+\s*/, '')
      .trim();
    const candidate = `${primaryEntity}: ${cleanedRemainder.charAt(0).toUpperCase() + cleanedRemainder.slice(1)}`;
    return truncateTitleCleanly(candidate, 60);
  }

  return truncateTitleCleanly(fullTitle, 60);
}

function truncateTitleCleanly(title: string, maxLen = 60): string {
  if (title.length <= maxLen) return title;
  const sub = title.slice(0, maxLen + 1);
  const lastSpace = sub.lastIndexOf(' ');
  let cut = lastSpace > 35 ? sub.slice(0, lastSpace) : sub.slice(0, maxLen);
  // Remove preposições/artigos órfãos no final do título
  cut = cut
    .replace(/\s+(?:de|da|do|das|dos|em|na|no|nas|nos|para|por|com|e|ou|a|o|as|os|sob|ante|após)$/i, '')
    .replace(/\s+(?:de|da|do|das|dos|em|na|no|nas|nos|para|por|com|e|ou|a|o|as|os)$/i, '')
    .replace(/[,;:\-–—]+$/, '')
    .trim();
  return cut;
}

/**
 * 3. SEO de Imagem (Alt Text Descritivo)
 * Evita repetir o H1 exatamente e descreve o contexto técnico, visual e as entidades da matéria.
 */
export function generateImageAlt(article: Article): string {
  const curated = CURATED_OVERRIDES[article.slug]?.imageAlt;
  if (curated) return curated;

  const entities = Array.from(
    new Set(
      Array.from(article.content.matchAll(/<(?:strong|em)>([^<]{2,35})<\/(?:strong|em)>/gi)).map((m) =>
        m[1].trim()
      )
    )
  ).slice(0, 3);

  const categoryPrefix: Record<string, string> = {
    'inteligencia-artificial': 'Ilustração técnica e arquitetura de IA sobre',
    'robos-humanoides': 'Registro visual de robótica corporificada e engenharia sobre',
    'saude-biotec': 'Representação de biotecnologia e IA médica sobre',
    'startups-futuro': 'Infográfico e contexto tecnológico sobre',
  };

  const prefix = categoryPrefix[article.category_slug] || 'Representação técnica sobre';
  const seoShort = generateSeoTitle(article);

  if (entities.length >= 2) {
    return `${prefix} ${seoShort}, destacando ${entities.join(', ')}`;
  }

  return `${prefix} ${seoShort} (${article.category_name})`;
}

/**
 * 4. Destaques da Notícia (Box de Destaque em 3 a 4 Bullet Points para SEO / GEO / Featured Snippets)
 * Extrai bullet points estruturados (Label + Explicação objetiva) sem repetir o Subtítulo (Lead).
 */
export function extractArticleHighlights(article: Article): HighlightItem[] {
  const curated = CURATED_OVERRIDES[article.slug]?.highlights;
  if (curated) return curated;

  // 1. Verifica se o HTML do artigo já possui um bloco <ul data-highlights="true">
  const explicitListMatch = article.content.match(
    /<ul[^>]*data-highlights=["']true["'][^>]*>([\s\S]*?)<\/ul>/i
  );
  if (explicitListMatch) {
    const liMatches = Array.from(explicitListMatch[1].matchAll(/<li[^>]*>([\s\S]*?)<\/li>/gi));
    const parsed: HighlightItem[] = [];
    for (const m of liMatches) {
      const strongMatch = m[1].match(/<strong[^>]*>([^<]+)<\/strong>\s*:?\s*([\s\S]*)/i);
      if (strongMatch) {
        parsed.push({
          label: stripHtml(strongMatch[1]).replace(/:$/, ''),
          text: stripHtml(strongMatch[2]),
        });
      } else {
        const rawLi = stripHtml(m[1]);
        const colonIdx = rawLi.indexOf(':');
        if (colonIdx > 2 && colonIdx < 40) {
          parsed.push({
            label: rawLi.slice(0, colonIdx).trim(),
            text: rawLi.slice(colonIdx + 1).trim(),
          });
        } else {
          parsed.push({
            label: 'Ponto-chave',
            text: rawLi,
          });
        }
      }
    }
    if (parsed.length >= 3) return parsed.slice(0, 4);
  }

  // 2. Extração determinística inteligente a partir dos parágrafos e subtítulos <h2> do artigo
  const leadNorm = formatLeadSubtitle(article).toLowerCase().slice(0, 60);
  const paragraphs = Array.from(article.content.matchAll(/<p[^>]*>([\s\S]*?)<\/p>/gi)).map(
    (m) => m[1]
  );
  const h2Headings = Array.from(article.content.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/gi)).map((m) =>
    stripHtml(m[1])
  );

  const defaultLabels = [
    'Arquitetura e tecnologia',
    'Funcionamento na prática',
    'Impacto estratégico',
    'Perspectivas para o setor',
  ];

  const items: HighlightItem[] = [];
  const usedSentences = new Set<string>();

  for (let i = 0; i < paragraphs.length && items.length < 4; i++) {
    const pHtml = paragraphs[i];
    const pText = stripHtml(pHtml);

    // Extrai as frases do parágrafo
    const sentences = pText
      .split(/(?<=[.!?])\s+/)
      .map((s) => s.trim())
      .filter((s) => s.length >= 45 && s.length <= 190);

    // Escolhe uma frase que não seja idêntica ao lead
    const chosen = sentences.find((s) => {
      const sNorm = s.toLowerCase();
      return !sNorm.includes(leadNorm) && !usedSentences.has(sNorm);
    });

    if (!chosen) continue;
    usedSentences.add(chosen.toLowerCase());

    // Tenta extrair um rótulo técnico de uma tag <strong> ou <em> do parágrafo, ou de um <h2>
    const tagMatches = Array.from(
      pHtml.matchAll(/<(?:strong|em)>([^<]{3,32})<\/(?:strong|em)>/gi)
    ).map((m) => stripHtml(m[1]).replace(/[:.,;]+$/, ''));

    let label = defaultLabels[items.length] || 'Destaque técnico';
    const goodTag = tagMatches.find(
      (t) =>
        t.split(' ').length <= 4 &&
        !items.some((existing) => existing.label.toLowerCase() === t.toLowerCase())
    );

    if (goodTag) {
      label = goodTag.charAt(0).toUpperCase() + goodTag.slice(1);
    } else if (i >= 2 && h2Headings[0] && items.length === 2) {
      label = truncateTitleCleanly(h2Headings[0], 32);
    } else if (i >= 4 && h2Headings[1] && items.length === 3) {
      label = truncateTitleCleanly(h2Headings[1], 32);
    }

    items.push({
      label,
      text: chosen.endsWith('.') ? chosen : `${chosen}.`,
    });
  }

  return items.slice(0, 4);
}

/**
 * 5. Linkagem Interna Contextual (2 a 3 links internos distribuídos nos parágrafos)
 * Remove eventual bloco <ul data-highlights="true"> duplicado e insere de 2 a 3 links
 * internos contextuais apontando para artigos relacionados e categorias do portal.
 */
export function enrichArticleContentWithInternalLinks(
  htmlContent: string,
  currentArticle: Article,
  candidateArticles: Article[]
): string {
  if (!htmlContent) return '';

  // Remove bloco <ul data-highlights="true"> do corpo para não duplicar o box de destaques
  let cleaned = htmlContent.replace(
    /<ul[^>]*data-highlights=["']true["'][^>]*>[\s\S]*?<\/ul>/gi,
    ''
  );

  // Conta quantos links internos já existem no HTML
  const existingInternalLinks = (cleaned.match(/href=["']\/(?:noticia|categoria)\//gi) || [])
    .length;
  if (existingInternalLinks >= 3) {
    return cleaned;
  }

  // Monta dicionário de âncoras -> URLs a partir dos artigos candidatos do próprio portal
  interface LinkCandidate {
    term: string;
    url: string;
    title: string;
    priority: number;
  }

  const candidates: LinkCandidate[] = [];
  const stopWords = new Set([
    'para',
    'como',
    'mais',
    'sobre',
    'entre',
    'após',
    'antes',
    'contra',
    'durante',
    'novo',
    'nova',
    'novos',
    'novas',
    'lança',
    'anuncia',
    'apresenta',
    'revela',
    'sistema',
    'modelo',
    'modelos',
    'empresa',
    'empresas',
    'mercado',
    'mundo',
    'brasil',
    'dados',
    'tecnologia',
  ]);

  for (const art of candidateArticles) {
    if (!art.slug || art.slug === currentArticle.slug) continue;
    const url = `/noticia/${art.slug}`;

    // Extrai termos compostos relevantes do título do artigo candidato
    const titleClean = art.title.replace(/['"“”‘’]/g, '');

    // Termos específicos de alto valor semântico no portal
    const highValuePhrases = [
      'agentes autônomos',
      'agentes de IA',
      'automação industrial',
      'robôs humanoides',
      'robô humanoide',
      'modelos de linguagem',
      'segurança de IA',
      'código aberto',
      'Anthropic',
      'OpenAI',
      'NVIDIA',
      'Google DeepMind',
      'Gemini 4',
      'Claude',
      'Agility Robotics',
      'AI Act',
      'União Europeia',
      'computação quântica',
      'modelos locais',
    ];

    for (const phrase of highValuePhrases) {
      if (
        titleClean.toLowerCase().includes(phrase.toLowerCase()) &&
        !candidates.some((c) => c.term.toLowerCase() === phrase.toLowerCase())
      ) {
        candidates.push({
          term: phrase,
          url,
          title: art.title,
          priority: phrase.includes(' ') ? 10 : 7,
        });
      }
    }

    // Também extrai o sujeito inicial antes de verbos comuns
    const subjMatch = titleClean.match(
      /^([A-ZÀ-Ú][A-Za-zÀ-ú0-9\s.-]{2,24}?)\s+(?:lança|anuncia|apresenta|oficializa|revela|desenvolve|adota|fecha|defende|abre)/
    );
    if (subjMatch) {
      const term = subjMatch[1].trim();
      if (
        term.length >= 4 &&
        !stopWords.has(term.toLowerCase()) &&
        !currentArticle.title.toLowerCase().startsWith(term.toLowerCase()) &&
        !candidates.some((c) => c.term.toLowerCase() === term.toLowerCase())
      ) {
        candidates.push({
          term,
          url,
          title: art.title,
          priority: 8,
        });
      }
    }
  }

  // Adiciona links de categorias como fallback semântico rico
  const categoryFallbacks: LinkCandidate[] = [
    {
      term: 'robótica corporificada',
      url: '/categoria/robos-humanoides',
      title: 'Robôs Humanoides e IA Corporificada',
      priority: 5,
    },
    {
      term: 'robôs bípedes',
      url: '/categoria/robos-humanoides',
      title: 'Robôs Humanoides',
      priority: 5,
    },
    {
      term: 'inteligência artificial',
      url: '/categoria/inteligencia-artificial',
      title: 'Notícias de Inteligência Artificial',
      priority: 4,
    },
    {
      term: 'biotecnologia',
      url: '/categoria/saude-biotec',
      title: 'Saúde e Biotecnologia',
      priority: 5,
    },
    {
      term: 'ecossistema de IA',
      url: '/categoria/inteligencia-artificial',
      title: 'Ecossistema de Inteligência Artificial',
      priority: 4,
    },
  ];

  for (const fb of categoryFallbacks) {
    if (!candidates.some((c) => c.term.toLowerCase() === fb.term.toLowerCase())) {
      candidates.push(fb);
    }
  }

  candidates.sort((a, b) => b.priority - a.priority || b.term.length - a.term.length);

  const maxLinksToAdd = Math.max(0, 3 - existingInternalLinks);
  if (maxLinksToAdd === 0) return cleaned;

  const usedUrls = new Set<string>();
  const usedTerms = new Set<string>();
  let linksAdded = 0;

  // Processa parágrafo por parágrafo para distribuir os links (máximo 1 novo link por parágrafo)
  cleaned = cleaned.replace(/<p([^>]*)>([\s\S]*?)<\/p>/gi, (fullMatch, attrs, innerHtml) => {
    if (linksAdded >= maxLinksToAdd) return fullMatch;
    // Se o parágrafo já tem um link, pula para manter a leitura fluida
    if (/<a\s/i.test(innerHtml)) return fullMatch;

    for (const cand of candidates) {
      if (usedUrls.has(cand.url) || usedTerms.has(cand.term.toLowerCase())) continue;

      const escapedTerm = cand.term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      // Casa apenas fora de tags HTML existentes
      const regex = new RegExp(`(?<![\\wÀ-ú/>])(${escapedTerm})(?![\\wÀ-ú<])`, 'i');

      // Divide por tags HTML para garantir que só substituímos em nós de texto puro
      const parts = innerHtml.split(/(<[^>]+>)/g);
      let replacedInPara = false;

      for (let i = 0; i < parts.length; i++) {
        // Índices ímpares são tags HTML (<...>), índices pares são texto
        if (i % 2 === 1) continue;
        if (regex.test(parts[i])) {
          parts[i] = parts[i].replace(
            regex,
            `<a href="${cand.url}" title="${cand.title.replace(/"/g, '&quot;')}">$1</a>`
          );
          replacedInPara = true;
          usedUrls.add(cand.url);
          usedTerms.add(cand.term.toLowerCase());
          linksAdded++;
          break;
        }
      }

      if (replacedInPara) {
        return `<p${attrs}>${parts.join('')}</p>`;
      }
    }

    return fullMatch;
  });

  return cleaned;
}
