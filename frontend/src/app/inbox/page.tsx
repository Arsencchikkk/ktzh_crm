'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { Train, LogOut, Bell, Wifi, WifiOff } from 'lucide-react'

import { getStoredUser, logout, isAuthenticated } from '@/lib/auth'
import api from '@/lib/api'
import type { Conversation, Message, WsEvent, User, Case } from '@/types'

import { useConversations } from '@/hooks/useConversations'
import { useMessages } from '@/hooks/useMessages'
import { useWebSocket } from '@/hooks/useWebSocket'

import { ConversationList } from '@/components/inbox/ConversationList'
import { ChatWindow } from '@/components/inbox/ChatWindow'
import { CasePanel } from '@/components/inbox/CasePanel'
import { Spinner } from '@/components/ui/Spinner'

export default function InboxPage() {
  const router = useRouter()
  const [currentUser, setCurrentUser] = useState<User | null>(null)
  const [operators, setOperators] = useState<User[]>([])
  const [activeConversation, setActiveConversation] = useState<Conversation | null>(null)
  const [wsConnected, setWsConnected] = useState(false)
  const [notification, setNotification] = useState<string | null>(null)

  const {
    conversations,
    loading: convLoading,
    fetchConversations,
    upsertConversation,
    incrementUnread,
    clearUnread,
  } = useConversations()

  const {
    messages,
    loading: msgLoading,
    fetchMessages,
    sendMessage,
    appendMessage,
  } = useMessages(activeConversation?.id || null)

  // Auth guard
  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login')
      return
    }
    const user = getStoredUser()
    setCurrentUser(user)
    fetchConversations()
    loadOperators()
  }, [])

  const loadOperators = async () => {
    try {
      const { data } = await api.get<User[]>('/auth/operators')
      setOperators(data)
    } catch {}
  }

  // Load messages when conversation changes
  useEffect(() => {
    if (activeConversation) {
      fetchMessages()
      clearUnread(activeConversation.id)
    }
  }, [activeConversation?.id])

  // WebSocket event handler
  const handleWsEvent = useCallback(
    (event: WsEvent) => {
      if (event.type === 'new_message') {
        const msg = event.data as Message
        const convId = msg.conversation_id

        // If message is for active conversation, append it
        if (activeConversation?.id === convId) {
          appendMessage(msg)
          clearUnread(convId)
        } else {
          // Increment unread for other conversations
          if (msg.direction === 'inbound') {
            incrementUnread(convId)
          }
        }

        // Update conversation preview
        upsertConversation({
          id: convId,
          last_message_text: msg.text,
          last_message_at: msg.created_at,
          contact: event.contact
            ? { id: event.contact.id, phone: event.contact.phone, name: event.contact.name, created_at: '', updated_at: '' }
            : activeConversation?.contact,
        } as Partial<Conversation> & { id: string })

        // Show notification for inbound messages not in active window
        if (msg.direction === 'inbound' && activeConversation?.id !== convId) {
          const name = event.contact?.name || `+${event.contact?.phone}` || 'Пассажир'
          showNotification(`Новое сообщение от ${name}`)
        }
      } else if (event.type === 'conversation_updated') {
        const conv = event.data as Conversation
        upsertConversation(conv)
        if (activeConversation?.id === conv.id) {
          setActiveConversation((prev) => (prev ? { ...prev, ...conv } : null))
        }
      }
    },
    [activeConversation, appendMessage, incrementUnread, clearUnread, upsertConversation]
  )

  useWebSocket(handleWsEvent)

  const showNotification = (text: string) => {
    setNotification(text)
    setTimeout(() => setNotification(null), 4000)
  }

  const handleSelectConversation = (conv: Conversation) => {
    setActiveConversation(conv)
  }

  const handleSendMessage = async (text: string) => {
    if (!activeConversation) return
    await sendMessage(text)
  }

  const handleRefresh = () => {
    fetchConversations()
  }

  if (!currentUser) {
    return (
      <div className="h-screen flex items-center justify-center bg-surface-950">
        <Spinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-surface-950 overflow-hidden">
      {/* Top navbar */}
      <header className="flex items-center justify-between px-4 py-2.5 bg-surface-900 border-b border-surface-800 flex-shrink-0 z-10">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-primary-600/20 border border-primary-500/30 rounded-lg flex items-center justify-center">
              <Train className="w-4 h-4 text-primary-400" />
            </div>
            <span className="text-sm font-bold text-surface-100">КТЖ CRM</span>
          </div>
          <div className="h-4 w-px bg-surface-700" />
          <span className="text-xs text-surface-500">Обращения пассажиров</span>
        </div>

        <div className="flex items-center gap-3">
          {/* WS status */}
          <div className="flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
            <span className="text-xs text-surface-500">Live</span>
          </div>

          {/* Notification bell */}
          <button className="p-1.5 rounded-lg text-surface-400 hover:text-surface-200 hover:bg-surface-800 transition-colors relative">
            <Bell className="w-4 h-4" />
          </button>

          {/* User */}
          <div className="flex items-center gap-2">
            <div className="text-right">
              <p className="text-xs font-medium text-surface-200">{currentUser.full_name}</p>
              <p className="text-[10px] text-surface-500">{currentUser.role}</p>
            </div>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-surface-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
              title="Выйти"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Toast notification */}
      {notification && (
        <div className="fixed top-14 right-4 z-50 bg-surface-800 border border-surface-700 rounded-xl px-4 py-3 shadow-xl flex items-center gap-3 animate-in slide-in-from-right-4 duration-300">
          <div className="w-2 h-2 bg-primary-400 rounded-full flex-shrink-0" />
          <p className="text-sm text-surface-200">{notification}</p>
        </div>
      )}

      {/* Main 3-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Panel 1: Conversation list (leftmost, fixed width) */}
        <div className="w-72 xl:w-80 flex-shrink-0 overflow-hidden">
          <ConversationList
            conversations={conversations}
            activeId={activeConversation?.id || null}
            loading={convLoading}
            onSelect={handleSelectConversation}
            onRefresh={handleRefresh}
          />
        </div>

        {/* Panel 2: Chat window (center, flexible) */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow
            conversation={activeConversation}
            messages={messages}
            loading={msgLoading}
            onSend={handleSendMessage}
          />
        </div>

        {/* Panel 3: Case panel (right, fixed width) */}
        <div className="w-72 xl:w-80 flex-shrink-0 overflow-hidden">
          <CasePanel
            conversation={activeConversation}
            operators={operators}
            currentUser={currentUser}
          />
        </div>
      </div>
    </div>
  )
}
