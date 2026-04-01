'use client'

import { useState, KeyboardEvent, useRef } from 'react'
import { Send, Paperclip } from 'lucide-react'
import clsx from 'clsx'

interface MessageInputProps {
  onSend: (text: string) => Promise<void>
  disabled?: boolean
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [text, setText] = useState('')
  const [sending, setSending] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending || disabled) return
    setSending(true)
    try {
      await onSend(trimmed)
      setText('')
      // Reset textarea height
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
    } finally {
      setSending(false)
    }
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleInput = () => {
    const ta = textareaRef.current
    if (ta) {
      ta.style.height = 'auto'
      ta.style.height = `${Math.min(ta.scrollHeight, 120)}px`
    }
  }

  return (
    <div className="border-t border-surface-800 bg-surface-900 px-4 py-3">
      <div className="flex items-end gap-3 bg-surface-800 rounded-2xl border border-surface-700 focus-within:border-primary-600 focus-within:ring-1 focus-within:ring-primary-600/30 transition-all px-4 py-2.5">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Введите сообщение... (Enter для отправки)"
          disabled={disabled || sending}
          rows={1}
          className="flex-1 bg-transparent text-surface-100 placeholder-surface-500 text-sm resize-none focus:outline-none disabled:opacity-50 leading-relaxed min-h-[20px] max-h-[120px]"
        />
        <button
          onClick={handleSend}
          disabled={!text.trim() || sending || disabled}
          className={clsx(
            'flex-shrink-0 w-8 h-8 rounded-xl flex items-center justify-center transition-all',
            text.trim() && !disabled
              ? 'bg-primary-600 text-white hover:bg-primary-500 active:scale-95'
              : 'text-surface-600'
          )}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="text-xs text-surface-600 mt-1.5 pl-1">
        Shift+Enter для переноса строки
      </p>
    </div>
  )
}
