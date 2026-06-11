// supabase/functions/broadcast-notification/index.ts
// Uses web-push library for proper ECDH encrypted Web Push delivery

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import webpush from "https://esm.sh/web-push@3.6.7"

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, content-type'
      }
    })
  }

  try {
    const { title, body, url = '/', priority = 'MEDIUM' } = await req.json()

    if (!title || !body) {
      return new Response(JSON.stringify({ error: 'title and body are required' }), { status: 400 })
    }

    const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY') ?? ''
    const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY') ?? ''

    if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
      return new Response(JSON.stringify({ error: 'VAPID keys not configured in Supabase secrets' }), { status: 500 })
    }

    // Set VAPID details
    webpush.setVapidDetails(
      'mailto:admin@fitai.app',
      VAPID_PUBLIC_KEY,
      VAPID_PRIVATE_KEY
    )

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Fetch all push subscriptions
    const { data: subscriptions, error } = await supabase
      .from('push_subscriptions')
      .select('*')

    if (error) throw error

    if (!subscriptions || subscriptions.length === 0) {
      return new Response(JSON.stringify({
        message: 'No subscribers yet. Users need to open the app first to register.'
      }), { status: 200 })
    }

    const payload = JSON.stringify({ title, body, action_url: url, priority })

    let sent = 0
    let failed = 0

    for (const sub of subscriptions) {
      try {
        const pushSubscription = {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        }

        await webpush.sendNotification(pushSubscription, payload)
        sent++

        // Save to notifications history
        await supabase.from('notifications').insert({
          user_id: sub.user_id,
          title,
          message: body,
          type: 'broadcast',
          priority,
          status: 'sent',
          action_url: url
        })

      } catch (e: any) {
        console.error('Push failed for', sub.endpoint, e.statusCode, e.body)

        // 410 = subscription expired, clean it up
        if (e.statusCode === 410) {
          await supabase.from('push_subscriptions').delete().eq('endpoint', sub.endpoint)
        }
        failed++
      }
    }

    return new Response(JSON.stringify({
      success: true,
      total: subscriptions.length,
      sent,
      failed
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 })
  }
})
