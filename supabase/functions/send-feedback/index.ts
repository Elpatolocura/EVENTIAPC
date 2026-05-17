import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.105.4'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || ''
const TO_EMAIL = 'radatova18@gmail.com'
const FROM_EMAIL = 'feedback@eventia.app'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const authHeader = req.headers.get('Authorization') || ''
    if (!authHeader.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!
    )

    const { data: { user }, error: authError } = await supabase.auth.getUser(
      authHeader.replace('Bearer ', '')
    )
    if (authError || !user) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401 })
    }

    const { rating, category, message } = await req.json()

    if (!rating || !category || !message) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400 })
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('nombre, email')
      .eq('id', user.id)
      .maybeSingle()

    const userName = (profile as any)?.nombre || user.email || 'Anónimo'
    const userEmail = user.email || ''

    await supabase.from('feedback').insert({
      user_id: user.id,
      user_email: userEmail,
      rating,
      category,
      message,
    })

    if (RESEND_API_KEY) {
      const emailHtml = `
        <h2>Nuevo feedback de ${userName}</h2>
        <p><strong>Email:</strong> ${userEmail}</p>
        <p><strong>Puntuación:</strong> ${'⭐'.repeat(rating)} (${rating}/5)</p>
        <p><strong>Categoría:</strong> ${category}</p>
        <p><strong>Mensaje:</strong></p>
        <p style="background:#f5f5f5;padding:12px;border-radius:8px;">${message.replace(/\n/g, '<br>')}</p>
        <hr>
        <p style="color:#999;font-size:12px;">Enviado desde Eventia</p>
      `

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: FROM_EMAIL,
          to: [TO_EMAIL],
          subject: `💬 Feedback de ${userName} — ${category}`,
          html: emailHtml,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    })

  } catch (err) {
    console.error('Error:', err)
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json',
      },
    })
  }
})
