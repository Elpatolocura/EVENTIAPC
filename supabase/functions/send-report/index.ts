const RESEND_KEY = Deno.env.get('RESEND_API_KEY') || ''
const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || ''
const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY') || ''
const TO_EMAIL = 'radatova18@gmail.com'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type' },
    })
  }

  try {
    const auth = req.headers.get('Authorization') || ''
    if (!auth.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } })
    }

    const token = auth.replace('Bearer ', '')
    const userRes = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      headers: { 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
    })
    if (!userRes.ok) {
      return new Response(JSON.stringify({ error: 'Token inválido' }), { status: 401, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } })
    }
    const userData = await userRes.json()
    const userId = userData.id
    const userEmail = userData.email || ''

    const { type, target_id, reason, details } = await req.json()
    if (!type || !target_id || !reason) {
      return new Response(JSON.stringify({ error: 'Faltan campos requeridos' }), { status: 400, headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' } })
    }

    await fetch(`${SUPABASE_URL}/rest/v1/reports`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'apikey': ANON_KEY, 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ reporter_id: userId, reporter_email: userEmail, type, target_id, reason, details }),
    })

    const typeLabel = type === 'evento' ? 'Evento' : 'Chat'
    const detailText = details ? `<p><strong>Detalles:</strong></p><p style="background:#f5f5f5;padding:12px;border-radius:8px;">${details.replace(/\n/g, '<br>')}</p>` : ''

    if (RESEND_KEY) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Eventia <onboarding@resend.dev>',
          to: [TO_EMAIL],
          subject: `🚩 Reporte de ${typeLabel} — ${reason}`,
          html: `<h2>🚩 Nuevo reporte de ${typeLabel}</h2>
<p><strong>Reportado por:</strong> ${userEmail}</p>
<p><strong>ID del ${typeLabel.toLowerCase()}:</strong> ${target_id}</p>
<p><strong>Motivo:</strong> ${reason}</p>
${detailText}
<hr><p style="color:#999;font-size:12px;">Enviado desde Eventia</p>`,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: 'Error interno' }), {
      status: 500,
      headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
    })
  }
})
