import { useState, useEffect } from 'react';

interface ContentItem {
  id: number;
  page: string;
  section: string;
  title: string;
  content: string;
  image_url: string;
  order_index: number;
}

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

// Cache: once loaded, content stays in memory — no re-fetch on navigation
const contentCache = new Map<string, Record<string, ContentItem>>();

// Allow cache invalidation from outside (e.g. after SuperAdmin edits)
export function invalidateContentCache(page?: string) {
  if (page) contentCache.delete(page);
  else contentCache.clear();
}

export function usePageContent(page: string) {
  const cached = contentCache.get(page);
  const [contentMap, setContentMap] = useState<Record<string, ContentItem>>(cached || {});
  const [isLoaded, setIsLoaded] = useState(!!cached);

  useEffect(() => {
    // Use cache for instant render, but always refetch for freshness
    if (contentCache.has(page)) {
      setContentMap(contentCache.get(page)!);
      setIsLoaded(true);
    }

    fetch(`/api/public/content/${page}`)
      .then(res => res.ok ? res.json() : [])
      .then((data: ContentItem[]) => {
        const map: Record<string, ContentItem> = {};
        data.forEach(item => {
          if (item.image_url && item.image_url.startsWith('/uploads/')) {
            item.image_url = BASE + item.image_url;
          }
          map[item.section] = item;
        });
        contentCache.set(page, map);
        setContentMap(map);
        setIsLoaded(true);
      })
      .catch(() => setIsLoaded(true));
  }, [page]);

  // Text: show fallback while loading (text flash is invisible — same font, same layout)
  // After load: show DB content, or fallback if section not in DB
  const getText = (section: string, fallback: string): string => {
    if (!isLoaded) return fallback;
    return contentMap[section]?.content || fallback;
  };

  const getTitle = (section: string, fallback: string): string => {
    if (!isLoaded) return fallback;
    return contentMap[section]?.title || fallback;
  };

  // Image: NEVER show fallback before loading.
  // Empty string = no image rendered = no flash of old image.
  // After load: show DB image (or fallback if section has no image in DB).
  const getImage = (section: string, fallback: string): string => {
    if (!isLoaded) return '';
    return contentMap[section]?.image_url || fallback;
  };

  return { getText, getTitle, getImage, isLoaded, contentMap };
}