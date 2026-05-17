import { supabase } from './supabase'

export async function getProfile(userId: string) {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) console.error('Error al obtener perfil:', error)
  return data
}

export async function updateProfile(userId: string, updates: Record<string, unknown>) {
  const { error } = await supabase.from('profiles').upsert({ id: userId, ...updates }, { onConflict: 'id' })
  if (error) console.error('Error al guardar perfil:', error)
  return { error }
}

export async function getEvents(userId: string) {
  try {
    const { data } = await supabase.from('events').select('*').eq('organizer_id', userId).order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

export async function getTickets(userId: string) {
  try {
    const { data } = await supabase.from('tickets').select('*, events(*)').eq('user_id', userId).order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

export async function getFavorites(userId: string) {
  try {
    const { data } = await supabase.from('favorites').select('*, events(*)').eq('user_id', userId)
    return data || []
  } catch { return [] }
}

export async function getNotifications(userId: string) {
  try {
    const { data } = await supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

export async function getBalance(userId: string) {
  try {
    const { data } = await supabase.from('balances').select('*').eq('user_id', userId).maybeSingle()
    return data
  } catch { return null }
}

export async function getTransactions(userId: string) {
  try {
    const { data } = await supabase.from('transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

export async function getFollowers(userId: string) {
  try {
    const { data } = await supabase.from('followers').select('*, follower:profiles!follower_id(*)').eq('following_id', userId)
    return data || []
  } catch { return [] }
}

export async function createEvent(event: Record<string, unknown>) {
  try {
    const { data, error } = await supabase.from('events').insert(event).select().single()
    if (error) console.error('Error al crear evento:', error)
    return { data, error }
  } catch (e) {
    console.error('Error al crear evento:', e)
    return { data: null, error: e }
  }
}

export async function updateEvent(id: string, updates: Record<string, unknown>) {
  try {
    const { error } = await supabase.from('events').update(updates).eq('id', id)
    if (error) console.error('Error al actualizar evento:', error)
    return { error }
  } catch (e) {
    console.error('Error al actualizar evento:', e)
    return { error: e }
  }
}

export async function getAllEvents() {
  try {
    const { data } = await supabase.from('events').select('*').order('created_at', { ascending: false })
    return data || []
  } catch { return [] }
}

export async function getEventById(id: string) {
  try {
    const { data } = await supabase.from('events').select('*').eq('id', id).single()
    return data
  } catch { return null }
}

export async function getUserCategories(userId: string) {
  try {
    const { data } = await supabase.from('categories').select('name').eq('user_id', userId)
    return (data || []).map((c: { name: string }) => c.name)
  } catch { return [] }
}

export async function addUserCategory(userId: string, name: string) {
  try {
    const { error } = await supabase.from('categories').insert({ user_id: userId, name })
    if (error) console.error('Error al crear categoría:', error)
    return { error }
  } catch (e) {
    console.error('Error al crear categoría:', e)
    return { error: e }
  }
}

export async function getReviews(eventId: string) {
  try {
    const { data } = await supabase.from('reviews').select('*').eq('event_id', eventId).order('created_at', { ascending: false })
    if (!data) return []
    const userIds = [...new Set(data.map((r: any) => r.user_id))]
    const { data: profiles } = await supabase.from('profiles').select('id, nombre').in('id', userIds)
    const profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, p.nombre]))
    return data.map((r: any) => ({ ...r, profiles: { nombre: profileMap[r.user_id] || 'Usuario' } }))
  } catch { return [] }
}

export async function createReview(review: { event_id: string; user_id: string; rating: number; text: string }) {
  try {
    const { data, error } = await supabase.from('reviews').insert(review).select('*').single()
    if (error) console.error('Error al crear reseña:', error)
    return { data, error }
  } catch (e) {
    console.error('Error al crear reseña:', e)
    return { data: null, error: e }
  }
}

export async function getChatMessages(eventId: string) {
  try {
    const { data } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: true })
    if (!data) return []
    const userIds = [...new Set(data.map((m: any) => m.user_id))]
    let profileMap: Record<string, { nombre: string; avatar_url: string }> = {}
    try {
      const { data: profiles } = await supabase.from('profiles').select('id, nombre, avatar_url').in('id', userIds)
      profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, { nombre: p.nombre || '', avatar_url: p.avatar_url || '' }]))
    } catch {
      try {
        const { data: profiles } = await supabase.from('profiles').select('id, nombre').in('id', userIds)
        profileMap = Object.fromEntries((profiles || []).map((p: any) => [p.id, { nombre: p.nombre || '', avatar_url: '' }]))
      } catch {}
    }
    return data.map((m: any) => ({ ...m, sender: profileMap[m.user_id] || { nombre: 'Usuario', avatar_url: '' } }))
  } catch { return [] }
}

export async function sendChatMessage(message: { event_id: string; user_id: string; text: string }) {
  try {
    const { data, error } = await supabase.from('chat_messages').insert(message).select('*').single()
    if (error) console.error('Error al enviar mensaje:', error)
    return { data, error }
  } catch (e) {
    console.error('Error al enviar mensaje:', e)
    return { data: null, error: e }
  }
}

export async function deleteChatMessage(messageId: number) {
  try {
    const { error } = await supabase.from('chat_messages').delete().eq('id', messageId)
    if (error) console.error('Error al eliminar mensaje:', error)
    return { error }
  } catch (e) {
    console.error('Error al eliminar mensaje:', e)
    return { error: e }
  }
}

export async function hideMessageForUser(userId: string, messageId: number) {
  try {
    const { error } = await supabase.from('deleted_messages').insert({ user_id: userId, message_id: messageId })
    if (error) console.error('Error al ocultar mensaje:', error)
    return { error }
  } catch (e) {
    console.error('Error al ocultar mensaje:', e)
    return { error: e }
  }
}

export async function getHiddenMessageIds(userId: string) {
  try {
    const { data } = await supabase.from('deleted_messages').select('message_id').eq('user_id', userId)
    return new Set((data || []).map((d: { message_id: number }) => d.message_id))
  } catch { return new Set<number>() }
}

export async function userHasTicket(userId: string, eventId: string) {
  try {
    const { data } = await supabase.from('tickets').select('id').eq('user_id', userId).eq('event_id', eventId).maybeSingle()
    return !!data
  } catch { return false }
}
