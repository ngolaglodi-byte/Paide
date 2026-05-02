// Helper pour les URLs
// Les appels API utilisent /api/... directement (Vite proxy en dev, Prestige proxy en iframe)
// Les images uploadées ont besoin du base path en iframe

const BASE = import.meta.env.BASE_URL?.replace(/\/$/, '') || '';

export function apiUrl(path: string): string {
  // Les API ne prennent PAS le préfixe — Vite proxy et le proxy iframe gèrent le routage
  return path;
}

export function uploadUrl(path: string): string {
  // Les images uploadées ont besoin du base path pour passer par le bon proxy
  if (path && path.startsWith('/uploads/')) {
    return `${BASE}${path}`;
  }
  return path;
}