/**
 * AuraQL Zero-Server Shareable Link Engine
 * 
 * Compresses active dashboard state (selected table, analytical SQL query,
 * chart viewport configuration, and active filters) into a compact, URL-safe hash fragment.
 * 
 * Recipients open the link and their client browser tab immediately reconstructs
 * the exact dashboard visualization with 0 backend servers.
 */

import { ChartConfig } from '../types';

export interface ShareableDashboardState {
  version: 1;
  table: string;
  sql: string;
  chart: {
    type: ChartConfig['type'];
    title: string;
    xAxis: string;
    yAxis: string;
    colorTheme?: ChartConfig['colorTheme'];
  };
  filter?: { column: string; value: string } | null;
  createdAt: number;
}

/**
 * Base64 URL-safe encoding and decoding helpers
 */
function toUrlSafeBase64(str: string): string {
  try {
    const bytes = new TextEncoder().encode(str);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  } catch {
    return btoa(encodeURIComponent(str)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
}

function fromUrlSafeBase64(b64url: string): string {
  let b64 = b64url.replace(/-/g, '+').replace(/_/g, '/');
  while (b64.length % 4) {
    b64 += '=';
  }
  try {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return new TextDecoder().decode(bytes);
  } catch {
    return decodeURIComponent(atob(b64));
  }
}

/**
 * Encodes dashboard state into a shareable link
 */
export function generateShareableUrl(state: {
  table: string;
  sql: string;
  chart: ChartConfig;
  filter?: { column: string; value: string } | null;
}): string {
  const payload: ShareableDashboardState = {
    version: 1,
    table: state.table,
    sql: state.sql,
    chart: {
      type: state.chart.type,
      title: state.chart.title,
      xAxis: state.chart.xAxis,
      yAxis: state.chart.yAxis,
      colorTheme: state.chart.colorTheme
    },
    filter: state.filter || null,
    createdAt: Date.now()
  };

  const jsonStr = JSON.stringify(payload);
  const encoded = toUrlSafeBase64(jsonStr);

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';
  const pathname = typeof window !== 'undefined' ? window.location.pathname : '/';

  return `${origin}${pathname}#/share?s=${encoded}`;
}

/**
 * Parses and reconstructs dashboard state from URL hash
 */
export function parseShareableUrl(): ShareableDashboardState | null {
  if (typeof window === 'undefined') return null;

  try {
    const hash = window.location.hash || '';
    if (!hash.includes('#/share') && !hash.includes('s=')) return null;

    const match = hash.match(/[?&]s=([^&]+)/);
    if (!match || !match[1]) return null;

    const encoded = match[1];
    const jsonStr = fromUrlSafeBase64(encoded);
    const parsed = JSON.parse(jsonStr) as ShareableDashboardState;

    if (parsed && parsed.table && parsed.sql && parsed.chart) {
      return parsed;
    }
  } catch (e) {
    console.warn('[AuraShare] Could not parse shareable dashboard state from URL', e);
  }

  return null;
}
