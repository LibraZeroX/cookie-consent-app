/**
 * Cloudflare Workers adapter for cookie consent logging
 * @module @cookie-ja/cloudflare-adapter
 */

import { WebhookPayload } from '@cookie-ja/core';

export interface Env {
  COOKIE_CONSENT_KV: KVNamespace;
  ALLOWED_ORIGINS?: string; // カンマ区切りのドメインリスト
  RATE_LIMIT_KV?: KVNamespace;
  SECRET_KEY?: string; // HMAC署名用
}

interface ConsentLogEntry {
  siteId: string;
  uidHash: string;
  timestamp: string;
  categories: {
    necessary: boolean;
    functional: boolean;
    analytics: boolean;
    marketing: boolean;
  };
  version: string;
  ipRegion?: string;
  userAgent?: string;
  ipAddress?: string;
}

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    
    // CORS preflight handling
    if (request.method === 'OPTIONS') {
      return handleOptions(request, env);
    }

    // Health check
    if (url.pathname === '/health') {
      return new Response('OK', { 
        status: 200,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    // Main consent logging endpoint
    if (url.pathname === '/collect' && request.method === 'POST') {
      return handleConsentLog(request, env, ctx);
    }

    // CSV export endpoint
    if (url.pathname === '/export' && request.method === 'GET') {
      return handleExport(request, env);
    }

    return new Response('Not found', { status: 404 });
  },
};

async function handleOptions(request: Request, env: Env): Promise<Response> {
  const origin = request.headers.get('Origin');
  const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];
  
  const responseHeaders = {
    ...corsHeaders,
    'Access-Control-Allow-Origin': isOriginAllowed(origin, allowedOrigins) ? origin || '*' : 'null',
  };

  return new Response(null, {
    status: 204,
    headers: responseHeaders,
  });
}

async function handleConsentLog(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  try {
    // CORS check
    const origin = request.headers.get('Origin');
    const allowedOrigins = env.ALLOWED_ORIGINS?.split(',') || ['*'];
    
    if (!isOriginAllowed(origin, allowedOrigins)) {
      return new Response('Origin not allowed', { status: 403 });
    }

    // Rate limiting
    const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimitKey = `rate_limit:${clientIP}`;
    
    if (env.RATE_LIMIT_KV) {
      const rateLimitData = await env.RATE_LIMIT_KV.get(rateLimitKey);
      if (rateLimitData) {
        const { count, timestamp } = JSON.parse(rateLimitData);
        const now = Date.now();
        
        // 10秒以内に10回以上のリクエストは拒否
        if (now - timestamp < 10000 && count >= 10) {
          return new Response('Rate limit exceeded', { status: 429 });
        }
      }
    }

    // Parse request body
    const payload: WebhookPayload = await request.json();
    
    // Validation
    if (!isValidPayload(payload)) {
      return new Response('Invalid payload', { status: 400 });
    }

    // HMAC signature verification (optional)
    if (env.SECRET_KEY) {
      const signature = request.headers.get('X-Signature');
      if (!signature || !verifySignature(JSON.stringify(payload), signature, env.SECRET_KEY)) {
        return new Response('Invalid signature', { status: 401 });
      }
    }

    // CF地域情報を追加
    const cfRegion = request.cf?.country || 'unknown';
    
    // Create log entry
    const logEntry: ConsentLogEntry = {
      siteId: payload.siteId,
      uidHash: payload.uidHash,
      timestamp: payload.timestamp,
      categories: payload.categories,
      version: payload.version,
      ipRegion: payload.ipRegion || cfRegion,
      userAgent: payload.userAgent,
      ipAddress: clientIP
    };

    // Store in KV with monthly partitioning
    const date = new Date(payload.timestamp);
    const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
    const logKey = `consent-logs:${payload.siteId}:${monthKey}`;
    
    // Get existing logs for the month
    let existingLogs: ConsentLogEntry[] = [];
    const existingData = await env.COOKIE_CONSENT_KV.get(logKey);
    if (existingData) {
      existingLogs = JSON.parse(existingData);
    }

    // Add new entry
    existingLogs.push(logEntry);
    
    // Store back to KV with TTL (13 months = 1 year + 1 month buffer)
    const ttl = 13 * 30 * 24 * 60 * 60; // 13 months in seconds
    await env.COOKIE_CONSENT_KV.put(logKey, JSON.stringify(existingLogs), {
      expirationTtl: ttl
    });

    // Update rate limiting
    if (env.RATE_LIMIT_KV) {
      const rateLimitData = await env.RATE_LIMIT_KV.get(rateLimitKey);
      let count = 1;
      const now = Date.now();
      
      if (rateLimitData) {
        const existing = JSON.parse(rateLimitData);
        if (now - existing.timestamp < 10000) {
          count = existing.count + 1;
        }
      }
      
      await env.RATE_LIMIT_KV.put(rateLimitKey, JSON.stringify({
        count,
        timestamp: now
      }), { expirationTtl: 60 }); // 1分でリセット
    }

    // Response with CORS headers
    const responseHeaders = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': isOriginAllowed(origin, allowedOrigins) ? origin || '*' : 'null',
    };

    return new Response(JSON.stringify({ 
      success: true, 
      timestamp: new Date().toISOString() 
    }), {
      status: 200,
      headers: responseHeaders,
    });

  } catch (error) {
    console.error('Error handling consent log:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

async function handleExport(request: Request, env: Env): Promise<Response> {
  try {
    const url = new URL(request.url);
    const siteId = url.searchParams.get('siteId');
    const month = url.searchParams.get('month'); // YYYY-MM format
    const format = url.searchParams.get('format') || 'json';
    
    if (!siteId || !month) {
      return new Response('Missing siteId or month parameter', { status: 400 });
    }

    // Basic auth check (optional)
    const authHeader = request.headers.get('Authorization');
    if (env.SECRET_KEY && (!authHeader || !authHeader.startsWith('Bearer '))) {
      return new Response('Unauthorized', { status: 401 });
    }

    const logKey = `consent-logs:${siteId}:${month}`;
    const logData = await env.COOKIE_CONSENT_KV.get(logKey);
    
    if (!logData) {
      return new Response('No data found for the specified month', { status: 404 });
    }

    const logs: ConsentLogEntry[] = JSON.parse(logData);

    if (format === 'csv') {
      const csv = convertToCSV(logs);
      return new Response(csv, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="consent-logs-${siteId}-${month}.csv"`,
        },
      });
    }

    // JSON format (default)
    return new Response(JSON.stringify({
      siteId,
      month,
      count: logs.length,
      logs
    }, null, 2), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Error handling export:', error);
    return new Response('Internal server error', { status: 500 });
  }
}

function isValidPayload(payload: any): payload is WebhookPayload {
  return (
    typeof payload === 'object' &&
    typeof payload.siteId === 'string' &&
    typeof payload.uidHash === 'string' &&
    typeof payload.timestamp === 'string' &&
    typeof payload.categories === 'object' &&
    typeof payload.categories.necessary === 'boolean' &&
    typeof payload.categories.functional === 'boolean' &&
    typeof payload.categories.analytics === 'boolean' &&
    typeof payload.categories.marketing === 'boolean' &&
    typeof payload.version === 'string'
  );
}

function isOriginAllowed(origin: string | null, allowedOrigins: string[]): boolean {
  if (allowedOrigins.includes('*')) return true;
  if (!origin) return false;
  return allowedOrigins.some(allowed => {
    if (allowed === origin) return true;
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      return origin.endsWith(domain);
    }
    return false;
  });
}

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign', 'verify']
    );
    
    const expectedSignature = await crypto.subtle.sign('HMAC', key, encoder.encode(payload));
    const expectedHex = Array.from(new Uint8Array(expectedSignature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return signature === `sha256=${expectedHex}`;
  } catch {
    return false;
  }
}

function convertToCSV(logs: ConsentLogEntry[]): string {
  const headers = [
    'timestamp',
    'siteId', 
    'uidHash',
    'necessary',
    'functional',
    'analytics',
    'marketing',
    'version',
    'ipRegion',
    'userAgent',
    'ipAddress'
  ];
  
  const rows = logs.map(log => [
    log.timestamp,
    log.siteId,
    log.uidHash,
    log.categories.necessary.toString(),
    log.categories.functional.toString(),
    log.categories.analytics.toString(),
    log.categories.marketing.toString(),
    log.version,
    log.ipRegion || '',
    `"${log.userAgent || ''}"`, // Quote user agent to handle commas
    log.ipAddress || ''
  ]);
  
  return [headers.join(','), ...rows.map(row => row.join(','))].join('\n');
} 