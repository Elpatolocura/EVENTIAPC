import { useState, useRef, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useLanguage } from '../context/LanguageContext'
import { getChatMessages, sendChatMessage, deleteChatMessage, hideMessageForUser, getHiddenMessageIds, getTodayMessagesCount, getUnreadChatCounts, markChatRead, toggleChatMute, getMutedChats, toggleChatPin, getPinnedChats } from '../lib/db'
import { supabase } from '../lib/supabase'

const emojis = ['😀','😎','🔥','❤️','🎉','👍','😢','😂','😍','🎶','💪','🙌','✨','🥳','💯','👏','😅','🤔','🎸','🍕','🎭','📸','🎤','💃','🕺','🌮','🍷','🎪','🤩','💫']

export default function Chat() {
  const { t } = useLanguage()
  const { user, isPremium } = useAuth()
  const { eventId } = useParams<{ eventId: string }>()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [chatList, setChatList] = useState<any[]>([])
  const [newMsg, setNewMsg] = useState('')
  const [showEmoji, setShowEmoji] = useState(false)
  const [showAttach, setShowAttach] = useState(false)
  const [showCustomize, setShowCustomize] = useState(false)
  const [mediaPreview, setMediaPreview] = useState<{ url: string; type: string } | null>(null)
  const [chatBg, setChatBg] = useState('bg-gray-50')
  const [myBubble, setMyBubble] = useState('indigo')
  const [otherBubble, setOtherBubble] = useState('gray')
  const [textColor, setTextColor] = useState('gray-900')
  const [fontSize, setFontSize] = useState<'sm' | 'base'>('sm')
  const [notifications, setNotifications] = useState(true)
  const [pinned, setPinned] = useState(false)
  const [hidden, setHidden] = useState(false)
  const [persistent, setPersistent] = useState(false)
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [showReport, setShowReport] = useState(false)
  const [reportSent, setReportSent] = useState(false)

  const [reportReason, setReportReason] = useState('')

  const [reportMessage, setReportMessage] = useState('')

  const [sendingReport, setSendingReport] = useState(false)
  const [menuMsgId, setMenuMsgId] = useState<number | null>(null)
  const [replyingTo, setReplyingTo] = useState<{ id: number; text: string } | null>(null)
  const [msgs, setMsgs] = useState<{ id: number; from: string; text: string; time: string; senderName: string; senderAvatar: string | null; replyTo?: { id: number; text: string }; media?: { url: string; type: string } }[]>([])
  const [fullscreenMedia, setFullscreenMedia] = useState<{ url: string; type: string } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<{ id: number; action: 'me' | 'all' } | null>(null)
  const [attendeeCount, setAttendeeCount] = useState(0)
  const [eventDate, setEventDate] = useState('')
  const [sidebarCollapsed, setSidebarCollapsed] = useState(true)
  const [dailyCount, setDailyCount] = useState(0)
  const [limitMsg, setLimitMsg] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({})
  const [toastMsg, setToastMsg] = useState('')
  const toastTimer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const [mutedChats, setMutedChats] = useState<Set<string>>(new Set())
  const [pinnedChats, setPinnedChats] = useState<Set<string>>(new Set())
  const mutedRef = useRef(new Set<string>())
  const pinnedRef = useRef(new Set<string>())
  const msgRefs = useRef<Record<number, HTMLDivElement | null>>({})
  const messagesEndRef = useRef<HTMLDivElement | null>(null)
  const messagesContainerRef = useRef<HTMLDivElement | null>(null)
  const chatIdsRef = useRef<string[]>([])

  const filteredChatList = searchQuery
    ? chatList.filter((c: any) => c.event.toLowerCase().includes(searchQuery.toLowerCase()))
    : chatList
  const selected = filteredChatList.find((c: any) => c.id === selectedId)

  useEffect(() => {
    if (!user) return
    if (!isPremium) getTodayMessagesCount(user.id).then(setDailyCount)
    getMutedChats(user.id).then(s => { mutedRef.current = s; setMutedChats(s) })
    getPinnedChats(user.id).then(s => { pinnedRef.current = s; setPinnedChats(s) })
    Promise.all([
      supabase.from('tickets').select('*, events(*)').eq('user_id', user.id),
      supabase.from('events').select('*').eq('organizer_id', user.id),
    ]).then(async ([{ data: tickets }, { data: ownEvents }]) => {
      const seen = new Set<string>()
      const allEvents: any[] = []
      if (tickets && tickets.length > 0) {
        tickets.forEach((t: any) => {
          if (!seen.has(t.event_id)) {
            seen.add(t.event_id)
            allEvents.push({ event_id: t.event_id, events: t.events, created_at: t.created_at })
          }
        })
      }
      if (ownEvents && ownEvents.length > 0) {
        ownEvents.forEach((e: any) => {
          if (!seen.has(e.id)) {
            seen.add(e.id)
            allEvents.push({ event_id: e.id, events: e, created_at: e.created_at })
          }
        })
      }
      if (allEvents.length > 0) {
        const lastMsgs = await Promise.all(
          allEvents.map((item: any) =>
            supabase.from('chat_messages').select('text, created_at')
              .eq('event_id', item.event_id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
              .then(({ data }) => data)
          )
        )
        const eventChats = allEvents.map((item: any, i: number) => ({
          id: item.event_id,
          event: item.events?.title || 'Evento',
          cover: item.events?.photos?.[0] || null,
          lastMsg: lastMsgs[i]?.text || 'Conversación del evento',
          time: lastMsgs[i]?.created_at
            ? new Date(lastMsgs[i].created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
            : new Date(item.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
          unread: 0,
          online: false,
          messages: [],
        }))
        chatIdsRef.current = eventChats.map((c: any) => c.id)
        setChatList(eventChats)
      } else {
        setChatList([])
      }
    })
  }, [user])

  useEffect(() => {
    if (eventId && chatList.length > 0) {
      setSelectedId(eventId)
    }
  }, [eventId, chatList])

  useEffect(() => {
    if (!user) return
    let mounted = true
    const refresh = async () => {
      const ids = chatIdsRef.current
      if (ids.length === 0) return
      const [unread, lastMsgs] = await Promise.all([
        getUnreadChatCounts(user.id),
        Promise.all(
          ids.map((id: string) =>
            supabase.from('chat_messages').select('text, created_at')
              .eq('event_id', id)
              .order('created_at', { ascending: false })
              .limit(1)
              .maybeSingle()
              .then(({ data }) => data)
          )
        ),
      ])
      if (!mounted) return
      if (unread) setUnreadCounts(unread)
      setChatList(prev => {
        const updated = prev.map((c: any) => {
          const idx = ids.indexOf(c.id)
          return {
            ...c,
            lastMsg: lastMsgs[idx]?.text || c.lastMsg,
            time: lastMsgs[idx]?.created_at
              ? new Date(lastMsgs[idx].created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
              : c.time,
          }
        })
        const msgTimes = lastMsgs.map((m: any) => m?.created_at || 0)
        updated.sort((a: any, b: any) => {
          const aPinned = pinnedRef.current.has(a.id)
          const bPinned = pinnedRef.current.has(b.id)
          if (aPinned && !bPinned) return -1
          if (!aPinned && bPinned) return 1
          const aTime = msgTimes[ids.indexOf(a.id)]
          const bTime = msgTimes[ids.indexOf(b.id)]
          return new Date(bTime).getTime() - new Date(aTime).getTime()
        })
        return updated
      })
    }
    refresh()
    const interval = setInterval(refresh, 5000)
    const channel = supabase.channel('chat-messages-realtime')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'chat_messages' },
        (payload: any) => {
          const msg = payload.new
          if (msg.user_id === user.id) return
          setChatList(prev => {
            const idx = prev.findIndex((c: any) => c.id === msg.event_id)
            if (idx === -1) return prev
            const chat = prev[idx]
            const updated = {
              ...chat,
              lastMsg: msg.text,
              time: new Date(msg.created_at).toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
            }
            const next = [...prev]
            next.splice(idx, 1)
            next.unshift(updated)
            return next
          })
          if (msg.event_id === selectedId) {
            supabase.from('profiles').select('nombre, avatar_url').eq('id', msg.user_id).single()
              .then(({ data: profile }) => {
                const time = new Date(msg.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
                setMsgs(prev => {
                  if (prev.some(m => m.id === msg.id)) return prev
                  return [...prev, {
                    id: msg.id,
                    from: 'them',
                    text: msg.text,
                    time,
                    senderName: profile?.nombre || 'Usuario',
                    senderAvatar: profile?.avatar_url || null,
                  }]
                })
              })
          } else {
            setUnreadCounts(prev => ({
              ...prev,
              [msg.event_id]: (prev[msg.event_id] || 0) + 1
            }))
          }
        }
      )
      .subscribe()
    return () => {
      mounted = false
      clearInterval(interval)
      supabase.removeChannel(channel)
    }
  }, [user, selectedId])

  useEffect(() => {
    if (!selectedId || !user) return
    markChatRead(user.id, selectedId)
    setUnreadCounts(prev => ({ ...prev, [selectedId]: 0 }))
    setNotifications(!mutedRef.current.has(selectedId))
    setPinned(pinnedRef.current.has(selectedId))
    Promise.all([
      getChatMessages(selectedId),
      getHiddenMessageIds(user.id),
      supabase.from('tickets').select('id', { count: 'exact', head: true }).eq('event_id', selectedId),
      supabase.from('events').select('date, hour').eq('id', selectedId).single(),
    ]).then(([messages, hiddenIds, ticketsRes, eventRes]) => {
      setAttendeeCount(ticketsRes.count || 0)
      if (eventRes.data) setEventDate(`${eventRes.data.date} • ${eventRes.data.hour}`)
      const mapped = messages
        .filter((m: any) => !hiddenIds.has(m.id))
        .map((m: any) => {
        const isMe = m.user_id === user?.id
        const time = new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
        return {
          id: m.id,
          from: isMe ? 'me' : 'them',
          text: m.text,
          time,
          senderName: m.sender?.nombre || 'Usuario',
          senderAvatar: m.sender?.avatar_url || null,
        }
      })
      setMsgs(mapped)
    })
    setReplyingTo(null)
  }, [selectedId, user?.id, mutedChats, pinnedChats])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [msgs])

  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const autoResize = () => {
    const ta = textareaRef.current
    if (!ta) return
    ta.style.height = 'auto'
    ta.style.height = Math.min(ta.scrollHeight, 144) + 'px'
  }

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newMsg.trim() || !selectedId || !user) return
    const text = newMsg.trim()

    if (!isPremium) {
      const lineCount = text.split('\n').length
      if (lineCount > 40) {
        setLimitMsg(`Máximo 40 líneas por mensaje (tienes ${lineCount})`)
        return
      }
      const count = await getTodayMessagesCount(user.id)
      setDailyCount(count)
      if (count >= 40) {
        setLimitMsg('Límite diario alcanzado (40 mensajes). Actualiza a Premium para mensajes ilimitados.')
        return
      }
    }

    setLimitMsg('')
    setNewMsg('')
    setReplyingTo(null)
    await sendChatMessage({ event_id: selectedId, user_id: user.id, text })
    setChatList(prev => {
      const idx = prev.findIndex((c: any) => c.id === selectedId)
      if (idx === -1) return prev
      const chat = prev[idx]
      const updated = {
        ...chat,
        lastMsg: text,
        time: new Date().toLocaleDateString('es-CO', { day: 'numeric', month: 'short' }),
      }
      const next = [...prev]
      next.splice(idx, 1)
      next.unshift(updated)
      return next
    })
    if (!isPremium) setDailyCount(c => c + 1)
    const [messages, hiddenIds] = await Promise.all([
      getChatMessages(selectedId),
      getHiddenMessageIds(user.id),
    ])
    const mapped = messages
      .filter((m: any) => !hiddenIds.has(m.id))
      .map((m: any) => {
      const isMe = m.user_id === user.id
      const time = new Date(m.created_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' })
      return { id: m.id, from: isMe ? 'me' : 'them', text: m.text, time, senderName: m.sender?.nombre || 'Usuario', senderAvatar: m.sender?.avatar_url || null }
    })
    setMsgs(mapped)
  }

  const showToast = (msg: string) => {
    setToastMsg(msg)
    clearTimeout(toastTimer.current)
    toastTimer.current = setTimeout(() => setToastMsg(''), 2000)
  }

  const insertEmoji = (emoji: string) => {
    setNewMsg((prev) => prev + emoji)
  }

  const handleFileSelect = (type: 'image' | 'video') => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = type === 'image' ? 'image/*' : 'video/*'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return
      const url = URL.createObjectURL(file)
      setMediaPreview({ url, type: file.type.startsWith('video/') ? 'video' : 'image' })
    }
    input.click()
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex gap-0 -m-8">
      <div className={`${sidebarCollapsed ? 'w-16' : 'w-80'} bg-white border-r border-gray-200 flex flex-col shrink-0 transition-all duration-200`}>
        <div className="p-4 border-b border-gray-100 flex items-center justify-between gap-2">
          {!sidebarCollapsed && (
            <div className="flex-1 min-w-0">
              <h2 className="text-sm font-semibold text-gray-900">{t('chat.titulo')}</h2>
              <p className="text-xs text-gray-500 mt-0.5">{chatList.length} {t('chat.conversaciones')}</p>
            </div>
          )}
          <button type="button" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors cursor-pointer shrink-0">
            <svg className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
            </svg>
          </button>
        </div>

        {!sidebarCollapsed && (
          <div className="px-4 py-2 border-b border-gray-100">
            <div className="relative">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Buscar conversación..."
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-gray-50"
              />
            </div>
          </div>
        )}

        <div className="flex-1 overflow-y-auto">
          {filteredChatList.length === 0 && !sidebarCollapsed && (
            <div className="p-4 text-center text-sm text-gray-400">
              {searchQuery ? 'Sin resultados' : 'No hay conversaciones'}
            </div>
          )}
          {filteredChatList.map((chat) => {
            const unread = unreadCounts[chat.id] || 0
            return (
            <button
              key={chat.id}
              type="button"
              onClick={() => { setSelectedId(chat.id); setSidebarCollapsed(true) }}
              className={`w-full flex items-start gap-3 px-4 py-3.5 text-left transition-colors cursor-pointer border-b border-gray-50 ${
                selectedId === chat.id
                  ? 'bg-indigo-50/70'
                  : unread > 0
                    ? 'bg-blue-50/60 hover:bg-blue-100/50'
                    : 'hover:bg-gray-50'
              } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
            >
              <div className="relative shrink-0">
                {chat.cover ? (
                  <div className="w-10 h-10 rounded-full overflow-hidden">
                    <img src={chat.cover} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold`}>
                    {chat.event.charAt(0)}
                  </div>
                )}
                {unread > 0 && (
                  <div className={`absolute -top-1 -right-1 flex items-center justify-center rounded-full bg-red-500 text-white font-bold shadow-md ring-2 ring-white ${sidebarCollapsed ? 'w-4 h-4 text-[8px]' : 'min-w-[18px] h-[18px] text-[10px] px-1'}`}>
                    {unread > (sidebarCollapsed ? 9 : 99) ? (sidebarCollapsed ? '9+' : '99+') : unread}
                  </div>
                )}
              </div>
              {!sidebarCollapsed && (
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className={`text-sm truncate ${unread > 0 ? 'font-bold text-gray-900' : 'font-medium text-gray-900'}`}>
                      {pinnedRef.current.has(chat.id) && (
                        <svg className="w-3.5 h-3.5 inline mr-1 -mt-0.5 text-gray-400" fill="currentColor" viewBox="0 0 24 24">
                          <path d="M16 12V4h1V2H7v2h1v8l-2 2v2h5.2v6h1.6v-6H18v-2l-2-2z" />
                        </svg>
                      )}
                      {chat.event}
                    </p>
                    <div className="flex items-center gap-1.5 shrink-0">
                      {unread > 0 && (
                        <span className="w-2 h-2 rounded-full bg-indigo-500" />
                      )}
                      <span className="text-[11px] text-gray-400">{chat.time}</span>
                    </div>
                  </div>
                  <p className={`text-xs truncate mt-0.5 ${unread > 0 ? 'font-semibold text-gray-700' : 'text-gray-500'}`}>{chat.lastMsg}</p>
                </div>
              )}
            </button>
          )})}
        </div>
      </div>

      <div className="flex-1 flex flex-col bg-gray-50">
        {!selected ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-3xl mb-4">
              💬
            </div>
            <h3 className="text-base font-semibold text-gray-900 mb-1">{t('chat.selecciona')}</h3>
            <p className="text-sm text-gray-500 max-w-xs">
              {t('chat.selecciona_desc')}
            </p>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-3 px-6 py-4 bg-white border-b border-gray-200">
              <div className="relative shrink-0">
                {selected?.cover ? (
                  <div className="w-9 h-9 rounded-full overflow-hidden">
                    <img src={selected.cover} alt="" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className={`w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                    {selected?.event?.charAt(0) ?? 'E'}
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 truncate">{selected.event}</p>
                <p className="text-xs text-gray-500 truncate">{eventDate}</p>
                <p className="text-xs text-gray-400">{attendeeCount} {t('chat.boletas_vendidas')}</p>
              </div>
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowCustomize(!showCustomize)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                  title="Personalizar chat"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </button>

                {showCustomize && (
                  <>
                    <div className="absolute top-full right-0 mt-2 w-72 bg-white rounded-2xl shadow-lg border border-gray-200 z-20 max-h-[80vh] overflow-y-auto">
                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Apariencia del chat</h4>
                      </div>

                      <div className="p-4 space-y-4 border-b border-gray-100">
                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1.5">Mi burbuja</p>
                          <div className="flex gap-1.5">
                            {[
                              { key: 'indigo', cls: 'bg-indigo-600' },
                              { key: 'blue', cls: 'bg-blue-600' },
                              { key: 'green', cls: 'bg-green-500' },
                              { key: 'purple', cls: 'bg-purple-600' },
                              { key: 'pink', cls: 'bg-pink-500' },
                            ].map((b) => (
                              <button key={b.key} type="button" onClick={() => setMyBubble(b.key)}
                                className={`w-7 h-7 rounded-full ${b.cls} border-2 transition-all cursor-pointer ${myBubble === b.key ? 'border-gray-800 scale-110' : 'border-transparent'}`} title={b.key} />
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1.5">Otras burbujas</p>
                          <div className="flex gap-1.5">
                            {[
                              { key: 'gray', cls: 'bg-gray-100 border-gray-300', label: 'Gris' },
                              { key: 'white', cls: 'bg-white border-gray-300', label: 'Blanco' },
                              { key: 'warm', cls: 'bg-amber-50 border-amber-300', label: 'Cálido' },
                              { key: 'cool', cls: 'bg-sky-50 border-sky-300', label: 'Frío' },
                            ].map((b) => (
                              <button key={b.key} type="button" onClick={() => setOtherBubble(b.key)}
                                className={`w-7 h-7 rounded-full ${b.cls} border-2 transition-all cursor-pointer ${otherBubble === b.key ? 'border-gray-800 scale-110' : 'border-gray-200'}`} title={b.label} />
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1.5">Color de fondo</p>
                          <div className="flex gap-1.5">
                            {[
                              { key: 'bg-gray-50', cls: 'bg-gray-50', label: 'Gris' },
                              { key: 'bg-white', cls: 'bg-white', label: 'Blanco' },
                              { key: 'bg-stone-100', cls: 'bg-stone-100', label: 'Beige' },
                              { key: 'bg-blue-50', cls: 'bg-blue-50', label: 'Azul' },
                            ].map((b) => (
                              <button key={b.key} type="button" onClick={() => setChatBg(b.key)}
                                className={`w-7 h-7 rounded-full ${b.cls} border-2 transition-all cursor-pointer ${chatBg === b.key ? 'border-indigo-500 scale-110' : 'border-gray-200'}`} title={b.label} />
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1.5">Color del texto</p>
                          <div className="flex gap-1.5">
                            {[
                              { key: 'gray-900', cls: 'bg-gray-900', label: 'Oscuro' },
                              { key: 'gray-700', cls: 'bg-gray-700', label: 'Medio' },
                              { key: 'gray-600', cls: 'bg-gray-600', label: 'Claro' },
                              { key: 'indigo-800', cls: 'bg-indigo-800', label: 'Indigo' },
                            ].map((b) => (
                              <button key={b.key} type="button" onClick={() => setTextColor(b.key)}
                                className={`w-7 h-7 rounded-full ${b.cls} border-2 transition-all cursor-pointer ${textColor === b.key ? 'border-indigo-500 scale-110' : 'border-gray-200'}`} title={b.label} />
                            ))}
                          </div>
                        </div>

                        <div>
                          <p className="text-xs font-medium text-gray-600 mb-1.5">Tamaño de texto</p>
                          <div className="flex gap-1">
                            {[
                              { key: 'sm' as const, label: 'Pequeño' },
                              { key: 'base' as const, label: 'Mediano' },
                            ].map((f) => (
                              <button key={f.key} type="button" onClick={() => setFontSize(f.key)}
                                className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${fontSize === f.key ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>

                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Preferencias del chat</h4>
                      </div>

                      <div className="p-4 space-y-3 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Notificaciones</span>
                          <button type="button" onClick={() => {
                            const newVal = !notifications
                            setNotifications(newVal)
                            showToast(newVal ? 'Notificaciones activadas' : 'Notificaciones silenciadas')
                            if (user && selectedId) {
                              toggleChatMute(user.id, selectedId, !newVal)
                              if (!newVal) {
                                mutedRef.current = new Set(mutedRef.current).add(selectedId)
                              } else {
                                const next = new Set(mutedRef.current)
                                next.delete(selectedId)
                                mutedRef.current = next
                              }
                            }
                          }}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${notifications ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${notifications ? 'translate-x-4' : ''}`} />
                          </button>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">Fijar chat</span>
                          <button type="button" onClick={() => {
                            const newVal = !pinned
                            if (newVal && pinnedRef.current.size >= 7) {
                              showToast('Máximo 7 chats fijados')
                              return
                            }
                            setPinned(newVal)
                            showToast(newVal ? 'Chat fijado' : 'Chat desfijado')
                            if (user && selectedId) {
                              toggleChatPin(user.id, selectedId, newVal)
                              if (newVal) {
                                pinnedRef.current = new Set(pinnedRef.current).add(selectedId)
                              } else {
                                const next = new Set(pinnedRef.current)
                                next.delete(selectedId)
                                pinnedRef.current = next
                              }
                            }
                          }}
                            className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${pinned ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${pinned ? 'translate-x-4' : ''}`} />
                          </button>
                        </div>
                        {[
                          { key: 'hidden', label: 'Ocultar chat', value: hidden, set: setHidden },
                          { key: 'persistent', label: 'Mensajes persistentes', value: persistent, set: setPersistent },
                        ].map((t) => (
                          <div key={t.key} className="flex items-center justify-between">
                            <span className="text-sm text-gray-700">{t.label}</span>
                            <button type="button" onClick={() => t.set(!t.value)}
                              className={`w-9 h-5 rounded-full p-0.5 transition-colors cursor-pointer ${t.value ? 'bg-indigo-600' : 'bg-gray-300'}`}>
                              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${t.value ? 'translate-x-4' : ''}`} />
                            </button>
                          </div>
                        ))}
                      </div>

                      <div className="p-4 border-b border-gray-100">
                        <h4 className="text-xs font-semibold text-red-500 uppercase tracking-wider">Zona de peligro</h4>
                      </div>

                      <div className="p-4 space-y-2">
                        <button type="button" onClick={() => setShowClearConfirm(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          {t('chat.vaciar')}
                        </button>
                        <button type="button" onClick={() => setShowReport(true)}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21l4-4m0 0l-4-4m4 4h18" />
                          </svg>
                          {t('chat.reportar')}
                        </button>
                      </div>
                    </div>
                    <div className="fixed inset-0 z-10" onClick={() => setShowCustomize(false)} />
                  </>
                )}
              </div>
            </div>

            <div ref={messagesContainerRef} className={`flex-1 overflow-y-auto px-6 py-4 space-y-3 ${chatBg} ${fontSize === 'base' ? 'text-base' : 'text-sm'}`}>
              {msgs.map((msg) => {
                const isMe = msg.from === 'me'
                const senderName = isMe ? t('chat.tu') : msg.senderName || 'Usuario'
  const myBubbleColors: Record<string, string> = {
    indigo: 'bg-indigo-600',
    blue: 'bg-blue-600',
    green: 'bg-green-500',
    purple: 'bg-purple-600',
    pink: 'bg-pink-500',
  }
  const otherBubbleColors: Record<string, string> = {
    gray: 'bg-gray-100 border-gray-300',
    white: 'bg-white border-gray-300',
    warm: 'bg-amber-50 border-amber-300',
    cool: 'bg-sky-50 border-sky-300',
  }
  const textColorMap: Record<string, string> = {
    'gray-900': 'text-gray-900',
    'gray-700': 'text-gray-700',
    'gray-600': 'text-gray-600',
    'indigo-800': 'text-indigo-800',
  }

  return (
                <div key={msg.id} className="relative group">
                  {replyingTo?.id === msg.id && (
                    <button type="button" onClick={() => msgRefs.current[msg.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' })}
                      className="text-[11px] text-indigo-500 font-medium mb-1 ml-1 hover:text-indigo-700 transition-colors cursor-pointer">
                      ← Respondiendo a este mensaje
                    </button>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[75%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (msg.senderAvatar ? (
                        <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                          <img src={msg.senderAvatar} alt="" className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-fuchsia-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                          {(msg.senderName || 'U').charAt(0).toUpperCase()}
                        </div>
                      ))}
                      <div className="flex flex-col min-w-0">
                        <div className={`flex items-center gap-2 mb-0.5 ${isMe ? 'justify-end' : ''}`}>
                          <span className="text-[11px] font-medium text-gray-500">{senderName}</span>
                          <span className="text-[10px] text-gray-400">{msg.time}</span>
                        </div>
                        <div className="relative flex items-end gap-1">
                          {!isMe && (
                            <button type="button" onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                              className="opacity-40 hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 cursor-pointer" title="Opciones">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                            </button>
                          )}
                          <div
                            onClick={() => isMe && setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                            ref={(el) => { msgRefs.current[msg.id] = el }}
                            className={`px-4 py-2.5 rounded-2xl cursor-pointer ${fontSize === 'base' ? 'text-base' : 'text-sm'} ${isMe ? `text-white rounded-br-md ${myBubbleColors[myBubble] || 'bg-indigo-600'}` : `rounded-bl-md border ${otherBubbleColors[otherBubble] || 'bg-white border-gray-200'} ${textColorMap[textColor] || 'text-gray-900'}`}`}
                          >
                            {msg.replyTo && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); msgRefs.current[msg.replyTo!.id]?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
                                className={`block w-full text-left mb-2 p-2 rounded-lg text-[11px] border-l-2 transition-all cursor-pointer ${isMe ? 'bg-white/15 border-white/50 text-white/80 hover:bg-white/25' : 'bg-gray-50 border-gray-400 text-gray-500 hover:bg-gray-100'}`}
                                title="Ir al mensaje original"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="font-semibold">Mensaje respondido</span>
                                  <svg className="w-3 h-3 shrink-0 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                                  </svg>
                                </div>
                                <span className="line-clamp-1 mt-0.5 block">{msg.replyTo.text}</span>
                              </button>
                            )}
                            {msg.media && (
                              <button type="button" onClick={(e) => { e.stopPropagation(); setFullscreenMedia({ url: msg.media!.url, type: msg.media!.type }) }}
                                className="mb-2 rounded-xl overflow-hidden block w-full cursor-pointer">
                                {msg.media.type === 'video' ? (
                                  <video src={msg.media.url} className="w-full max-h-60 object-cover rounded-xl pointer-events-none" />
                                ) : (
                                  <img src={msg.media.url} alt="" className="w-full max-h-60 object-cover rounded-xl" />
                                )}
                              </button>
                            )}
                            <p className="leading-relaxed">{msg.text}</p>
                            <p className={`text-[10px] mt-1 ${isMe ? 'text-white/60' : 'text-gray-400'}`}>
                              {msg.time}
                            </p>
                          </div>
                          {isMe && (
                            <button type="button" onClick={() => setMenuMsgId(menuMsgId === msg.id ? null : msg.id)}
                              className="opacity-40 hover:opacity-100 transition-opacity p-1 text-gray-400 hover:text-gray-600 cursor-pointer" title="Opciones">
                              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" /></svg>
                            </button>
                          )}
                          {menuMsgId === msg.id && (
                            <>
                              <div className="fixed inset-0 z-10" onClick={() => setMenuMsgId(null)} />
                              <div className={`absolute top-0 ${isMe ? 'right-full mr-2' : 'left-full ml-2'} bg-white rounded-xl shadow-lg border border-gray-200 py-1 min-w-[160px] z-20`}>
                                <button type="button" onClick={() => { setReplyingTo({ id: msg.id, text: msg.text }); setMenuMsgId(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg> {t('chat.responder')}
                                </button>
                                <button type="button" onClick={() => { navigator.clipboard.writeText(msg.text); setMenuMsgId(null) }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg> {t('chat.copiar')}
                                </button>
                                <div className="border-t border-gray-100 my-1">
                                  <button type="button" onClick={() => { setConfirmDelete({ id: msg.id, action: 'me' }); setMenuMsgId(null) }}
                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg> {t('chat.eliminar_mi')}
                                  </button>
                                  {isMe && (
                                    <button type="button" onClick={() => { setConfirmDelete({ id: msg.id, action: 'all' }); setMenuMsgId(null) }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors cursor-pointer">
                                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> {t('chat.eliminar_todos')}
                                    </button>
                                  )}
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )})}
              {msgs.length === 0 && selected && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center mb-4">
                    <svg className="w-8 h-8 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h3 className="text-base font-semibold text-gray-800 mb-1">No hay mensajes aún</h3>
                  <p className="text-sm text-gray-500 max-w-xs">Sé el primero en romper el hielo 💬</p>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {!isPremium && limitMsg && (
              <div className="px-4 py-2 bg-red-50 border-t border-red-100 text-xs text-red-600 flex items-center gap-2">
                <span>⚠️</span>
                <span>{limitMsg}</span>
              </div>
            )}
            {!isPremium && !limitMsg && dailyCount > 0 && (
              <div className="px-4 py-1.5 bg-amber-50 border-t border-amber-100 text-[11px] text-amber-600 flex items-center gap-1.5">
                <span>📨</span>
                <span>{dailyCount}/40 mensajes hoy</span>
                {dailyCount >= 35 && <span className="font-semibold">— Quedan pocos</span>}
              </div>
            )}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-gray-200 relative">
              {replyingTo && (
                <div className="flex items-center justify-between mb-2 px-3 py-2 bg-indigo-50 rounded-xl text-xs text-indigo-600">
                  <div className="flex items-center gap-2 min-w-0">
                    <svg className="w-3.5 h-3.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
                    </svg>
                    <span className="truncate font-medium">Respondiendo: <span className="font-normal text-indigo-500">{replyingTo.text}</span></span>
                  </div>
                  <button type="button" onClick={() => setReplyingTo(null)}
                    className="text-indigo-400 hover:text-indigo-600 transition-colors cursor-pointer shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              {mediaPreview && (
                <div className="flex items-center gap-2 mb-3 p-2 rounded-xl bg-gray-50 border border-gray-200">
                  {mediaPreview.type === 'image' ? (
                    <img src={mediaPreview.url} alt="" className="w-16 h-16 rounded-lg object-cover" />
                  ) : (
                    <video src={mediaPreview.url} className="w-16 h-16 rounded-lg object-cover" />
                  )}
                  <span className="text-xs text-gray-500 flex-1">Archivo listo para enviar</span>
                  <button
                    type="button"
                    onClick={() => { setMediaPreview(null); URL.revokeObjectURL(mediaPreview.url) }}
                    className="text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )}
              <div className="flex items-center gap-1.5">
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowAttach(!showAttach)}
                    className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                    title="Adjuntar archivo"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                  </button>
                  {showAttach && (
                    <>
                      <div className="absolute bottom-full left-0 mb-2 bg-white rounded-xl shadow-lg border border-gray-200 p-1.5 flex gap-1 z-10">
                        <button
                          type="button"
                          onClick={() => { handleFileSelect('image'); setShowAttach(false) }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors cursor-pointer"
                        >
                          <span className="text-lg">📷</span>
                          Foto
                        </button>
                        <button
                          type="button"
                          onClick={() => { handleFileSelect('video'); setShowAttach(false) }}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 text-sm text-gray-700 transition-colors cursor-pointer"
                        >
                          <span className="text-lg">🎥</span>
                          Video
                        </button>
                      </div>
                      <div className="fixed inset-0 z-0" onClick={() => setShowAttach(false)} />
                    </>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmoji(!showEmoji)}
                  className="p-2 text-gray-400 hover:text-amber-500 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer relative"
                  title="Emojis"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </button>
                <textarea
                  ref={textareaRef}
                  value={newMsg}
                  onChange={(e) => {
                    const lines = e.target.value.split('\n')
                    if (!isPremium && lines.length > 40) return
                    setNewMsg(e.target.value); autoResize()
                  }}
                  placeholder={t('chat.escribe')}
                  rows={1}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none overflow-y-auto leading-[22px]"
                  style={{ maxHeight: 144 }}
                />
                <button
                  type="submit"
                  disabled={!newMsg.trim() && !mediaPreview}
                  className="p-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>

              {showEmoji && (
                <>
                  <div className="absolute bottom-full left-0 mb-2 p-3 bg-white rounded-2xl shadow-lg border border-gray-200 grid grid-cols-6 gap-1.5 z-10" onClick={(e) => e.stopPropagation()}>
                    {emojis.map((emoji) => (
                      <button
                        key={emoji}
                        type="button"
                        onClick={() => insertEmoji(emoji)}
                        className="w-8 h-8 flex items-center justify-center hover:bg-gray-100 rounded-lg text-lg transition-colors cursor-pointer"
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                  <div className="fixed inset-0 z-0" onClick={() => setShowEmoji(false)} />
                </>
              )}
            </form>
          </>
        )}
      </div>

      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setConfirmDelete(null)}>
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {confirmDelete.action === 'all' ? 'Eliminar para todos' : 'Eliminar para mí'}
            </h3>
            <p className="text-sm text-gray-600 mb-6">
              {confirmDelete.action === 'all'
                ? 'Este mensaje se eliminará para todos los participantes. ¿Estás seguro?'
                : 'Este mensaje se eliminará solo para ti. ¿Estás seguro?'}
            </p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setConfirmDelete(null)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={() => {
                const msgId = confirmDelete.id
                if (confirmDelete.action === 'all') {
                  deleteChatMessage(msgId)
                } else {
                  hideMessageForUser(user!.id, msgId)
                }
                setMsgs((prev) => prev.filter((m) => m.id !== msgId))
                setConfirmDelete(null)
              }}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer">
                {confirmDelete.action === 'all' ? 'Eliminar para todos' : 'Eliminar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {showClearConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-80 mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{t('chat.vaciar')}</h3>
            <p className="text-sm text-gray-600 mb-6">{t('chat.vaciar_confirm')}</p>
            <div className="flex gap-3 justify-end">
              <button type="button" onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                Cancelar
              </button>
              <button type="button" onClick={() => setShowClearConfirm(false)}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 transition-colors cursor-pointer">
                Vaciar chat
              </button>
            </div>
          </div>
        </div>
      )}

      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-96 mx-4">
            {reportSent ? (
              <div className="text-center py-4">
                <span className="text-4xl block mb-3">✅</span>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Reporte enviado</h3>
                <p className="text-sm text-gray-500 mb-6">Gracias por tu reporte. Lo revisaremos a la brevedad.</p>
                <button type="button" onClick={() => { setShowReport(false); setReportSent(false); setReportReason(''); setReportMessage('') }}
                  className="px-6 py-2 rounded-lg text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors cursor-pointer">
                  Cerrar
                </button>
              </div>
            ) : (
              <>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Reportar chat</h3>
                <p className="text-sm text-gray-500 mb-5">Selecciona el motivo y describe la situación para que podamos revisarlo.</p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Motivo del reporte</label>
                    <select
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
                    >
                      <option value="">Selecciona un motivo</option>
                      <option value="spam">Spam o publicidad no deseada</option>
                      <option value="acoso">Acoso o intimidación</option>
                      <option value="lenguaje">Lenguaje inapropiado</option>
                      <option value="contenido">Contenido ofensivo</option>
                      <option value="estafa">Estafa o fraude</option>
                      <option value="identidad">Suplantación de identidad</option>
                      <option value="otro">Otro</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Mensaje (opcional)</label>
                    <textarea
                      value={reportMessage}
                      onChange={(e) => setReportMessage(e.target.value)}
                      placeholder="Describe los detalles del reporte..."
                      rows={4}
                      className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    />
                  </div>
                </div>

                <div className="flex gap-3 justify-end mt-6">
                  <button type="button" onClick={() => { setShowReport(false); setReportReason(''); setReportMessage('') }}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors cursor-pointer">
                    Cancelar
                  </button>
                  <button type="button" onClick={async () => {
                    if (!reportReason) return
                    setSendingReport(true)
                    try {
                      const token = (await supabase.auth.getSession()).data.session?.access_token
                      await fetch('https://kuamqlxbaeclxspmlztv.supabase.co/functions/v1/send-report', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                        body: JSON.stringify({ type: 'chat', target_id: selectedId || 'desconocido', reason: reportReason, details: reportMessage }),
                      })
                      setReportSent(true)
                    } catch { setReportSent(true) }
                    finally { setSendingReport(false) }
                  }} disabled={!reportReason || sendingReport}
                    className="px-4 py-2 rounded-lg text-sm font-medium text-white bg-red-600 hover:bg-red-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors cursor-pointer">
                    {sendingReport ? 'Enviando...' : 'Enviar reporte'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {fullscreenMedia && (
        <div className="fixed inset-0 z-50 bg-black flex items-center justify-center" onClick={() => setFullscreenMedia(null)}>
          <button type="button" onClick={() => setFullscreenMedia(null)}
            className="absolute top-4 right-4 w-10 h-10 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white transition-colors cursor-pointer z-10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          {fullscreenMedia.type === 'video' ? (
            <video src={fullscreenMedia.url} controls autoPlay className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          ) : (
            <img src={fullscreenMedia.url} alt="" className="max-w-full max-h-full object-contain" onClick={(e) => e.stopPropagation()} />
          )}
        </div>
      )}

      {toastMsg && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[9999] px-5 py-3 bg-gray-900 text-white text-sm font-medium rounded-xl shadow-lg transition-all duration-300">
          {toastMsg}
        </div>
      )}
    </div>
  )
}
