'use client'

import { formatDistanceToNow } from 'date-fns'
import { ru } from 'date-fns/locale'
import clsx from 'clsx'
import type { Conversation } from '@/types'
import { Avatar } from '@/components/ui/Avatar'
import { Badge } from '@/components/ui/Badge'

interface ConversationItemProps {
  conversation: Conversation
  isActive: boolean
  onClick: () => void
}

const statusBadge: Record<string, { label: string; variant: any }> = {
  open: { label: 'Открыт', variant: 'success' },
  pending: { label: 'В ожидании', variant: 'warning' },
  closed: { label: 'Закрыт', variant: 'default' },
}

export function ConversationItem({ conversation, isActive, onClick }: ConversationItemProps) {
  const contact = conversation.contact
  const displayName = contact?.name || contact?.phone || 'Неизвестный'
  const lastMsg = conversation.last_message_text
  const lastAt = conversation.last_message_at
    ? formatDistanceToNow(new Date(conversation.last_message_at), {
        addSuffix: false,
        locale: ru,
      })
    : null
  const badge = statusBadge[conversation.status]

  return (
    <button
      onClick={onClick}
      className={clsx(
        'w-full flex items-start gap-3 px-4 py-3.5 transition-all duration-150 border-b border-surface-800/50 text-left group',
        isActive
          ? 'bg-primary-600/15 border-l-2 border-l-primary-500'
          : 'hover:bg-surface-800/60 border-l-2 border-l-transparent'
      )}
    >
      <Avatar name={displayName} size="md" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-1">
          <span className={clsx('text-sm font-semibold truncate', isActive ? 'text-primary-300' : 'text-surface-100')}>
            {displayName}
          </span>
          <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
            {conversation.unread_count > 0 && (
              <span className="bg-primary-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                {conversation.unread_count > 9 ? '9+' : conversation.unread_count}
              </span>
            )}
            {lastAt && (
              <span className="text-xs text-surface-500">{lastAt}</span>
            )}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-surface-400 truncate flex-1">
            {lastMsg || 'Нет сообщений'}
          </p>
          <Badge variant={badge.variant} size="sm">
            {badge.label}
          </Badge>
        </div>
        {conversation.assigned_operator_name && (
          <p className="text-xs text-surface-500 mt-0.5">
            → {conversation.assigned_operator_name}
          </p>
        )}
      </div>
    </button>
  )
}
