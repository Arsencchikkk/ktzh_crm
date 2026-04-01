'use client'

import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import clsx from 'clsx'
import type { Message } from '@/types'
import { CheckCheck, Check } from 'lucide-react'

interface MessageBubbleProps {
  message: Message
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isOutbound = message.direction === 'outbound'
  const time = format(new Date(message.created_at), 'HH:mm', { locale: ru })

  return (
    <div
      className={clsx(
        'flex mb-2',
        isOutbound ? 'justify-end' : 'justify-start'
      )}
    >
      <div
        className={clsx(
          'max-w-[70%] rounded-2xl px-4 py-2.5 text-sm shadow-sm',
          isOutbound
            ? 'bg-primary-600 text-white rounded-br-md'
            : 'bg-surface-750 text-surface-100 rounded-bl-md border border-surface-700'
        )}
        style={!isOutbound ? { backgroundColor: '#1e293b' } : undefined}
      >
        {message.text && <p className="leading-relaxed break-words">{message.text}</p>}
        {message.media_url && (
          <a
            href={message.media_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-300 underline text-xs"
          >
            [Медиафайл]
          </a>
        )}
        <div
          className={clsx(
            'flex items-center gap-1 mt-1',
            isOutbound ? 'justify-end' : 'justify-start'
          )}
        >
          <span
            className={clsx(
              'text-[10px]',
              isOutbound ? 'text-primary-200/80' : 'text-surface-500'
            )}
          >
            {time}
          </span>
          {isOutbound && (
            message.status === 'read' ? (
              <CheckCheck className="w-3 h-3 text-primary-200" />
            ) : (
              <Check className="w-3 h-3 text-primary-300/60" />
            )
          )}
        </div>
      </div>
    </div>
  )
}
