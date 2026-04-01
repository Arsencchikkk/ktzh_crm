'use client'

import { useEffect, useRef } from 'react'
import { PhoneCall, MessageSquare } from 'lucide-react'
import type { Conversation, Message } from '@/types'
import { MessageBubble } from './MessageBubble'
import { MessageInput } from './MessageInput'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'
import { Spinner } from '@/components/ui/Spinner'

interface ChatWindowProps {
  conversation: Conversation | null
  messages: Message[]
  loading: boolean
  onSend: (text: string) => Promise<void>
}

const statusLabel: Record<string, { label: string; variant: any }> = {
  open: { label: 'Открыт', variant: 'success' },
  pending: { label: 'В ожидании', variant: 'warning' },
  closed: { label: 'Закрыт', variant: 'default' },
}

export function ChatWindow({ conversation, messages, loading, onSend }: ChatWindowProps) {
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-surface-950 text-surface-500">
        <MessageSquare className="w-12 h-12 mb-4 opacity-30" />
        <p className="text-sm font-medium text-surface-400">Выберите диалог</p>
        <p className="text-xs mt-1">Нажмите на диалог слева, чтобы открыть переписку</p>
      </div>
    )
  }

  const contact = conversation.contact
  const displayName = contact?.name || contact?.phone || 'Неизвестный'
  const badge = statusLabel[conversation.status]

  return (
    <div className="flex flex-col h-full bg-surface-950">
      {/* Chat header */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-surface-800 bg-surface-900 flex-shrink-0">
        <Avatar name={displayName} size="md" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-surface-100 truncate">{displayName}</h3>
            <Badge variant={badge.variant} size="sm">{badge.label}</Badge>
          </div>
          {contact?.phone && (
            <p className="text-xs text-surface-500 flex items-center gap-1 mt-0.5">
              <PhoneCall className="w-3 h-3" />
              +{contact.phone}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          <span className="text-xs text-surface-500">
            {conversation.channel_type === 'whatsapp' ? '📱 WhatsApp' : conversation.channel_type}
          </span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
        {loading ? (
          <div className="flex items-center justify-center h-full">
            <Spinner />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-surface-600">
            <p className="text-sm">Нет сообщений</p>
          </div>
        ) : (
          messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <MessageInput
        onSend={onSend}
        disabled={conversation.status === 'closed'}
      />
    </div>
  )
}
