// supabase/functions/broadcast-notification/index.ts
// Send a push notification to ALL users — even when app is closed
// Call via: POST https://<project>.supabase.co/functions/v1/broadcast-notification
// Body: { "title": "Hello 👋", "body": "Message here", "url": "/" }

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

// ==========================================
// Web Push using VAPID (no Firebase needed)
// ==========================================
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? '';
const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? '';
const VAPID_SUBJECT = 'mailto:admin@fitai.app';

// Convert base64url to Uint8Array
function base64urlToUint8Array(base64url: string): Uint8Array {
  const padding = '='.repeat((4 - base64url.length % 4) % 4);
  const base64 = (base64url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// Sign a JWT for VAPID auth
async function createVapidJWT(audience: string): Promise<string> {
  const header = { alg: 'ES256', typ: 'JWT' };
  const payload = {
    aud: audience,
    exp: Math.floor(Date.now() / 1000) + 12 * 60 * 60,
    sub: VAPID_SUBJECT
  };

  const enc = new TextEncoder();
  const headerB64 = btoa(JSON.stringify(header)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const payloadB64 = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  const signingInput = enc.encode(`${headerB64}.${payloadB64}`);

  const privateKeyBytes = base64urlToUint8Array(VAPID_PRIVATE_KEY);
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    privateKeyBytes,
    { name: 'ECDSA', namedCurve: 'P-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, cryptoKey, signingInput);
  const sigB64 = btoa(String.fromCharCode(...new Uint8Array(sig))).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');

  return `${headerB64}.${payloadB64}.${sigB64}`;
}

// Send a Web Push to one subscription
async function sendWebPush(subscription: { endpoint: string; p256dh: string; auth: string }, payload: string) {
  const url = new URL(subscription.endpoint);
  const audience = `${url.protocol}//${url.host}`;
  const jwt = await createVapidJWT(audience);

  const response = await fetch(subscription.endpoint, {
    method: 'POST',
    headers: {
      'Authorization': `vapid t=${jwt},k=${VAPID_PUBLIC_KEY}`,
      'Content-Type': 'application/octet-stream',
      'TTL': '86400',
    },
    body: payload
  });

  return response.status;
}

serve(async (req) => {
  // CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, content-type' } });
  }

  try {
    const { title, body, url = '/', priority = 'MEDIUM' } = await req.json();

    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'title and body are required' }), { status: 400 });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Fetch all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*');

    if (error) throw error;
    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({ message: 'No subscribers yet. Users need to open the app first to register.' }), { status: 200 });
    }

    const payload = JSON.stringify({ title, body, action_url: url, priority });

    let sent = 0;
    let failed = 0;

    for (const sub of subscriptions) {
      try {
        const status = await sendWebPush({ endpoint: sub.endpoint, p256dh: sub.p256dh, auth: sub.auth }, payload);
        if (status >= 200 && status < 300) {
          sent++;
          // Also insert into notifications table for history
          await supabase.from('notifications').insert({
            user_id: sub.user_id,
            title,
            message: body,
            type: 'broadcast',
            priority,
            status: 'sent',
            action_url: url
          });
        } else if (status === 410) {
          // Subscription expired — remove it
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint);
          failed++;
        } else {
          failed++;
        }
      } catch (e) {
        failed++;
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total: subscriptions.length,
      sent,
      failed
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' }
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
});
