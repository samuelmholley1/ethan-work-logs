'use client'

import { useState, useEffect, useRef, useMemo } from 'react'

export interface SearchableItem {
  id: string
  title: string
  description?: string
  [key: string]: any
}

interface OutcomeSearchProps {
  items: SearchableItem[]
  selectedId: string | null
  onSelect: (id: string) => void
  placeholder?: string
  emptyMessage?: string
  disabled?: boolean
  className?: string
}

/**
 * OutcomeSearch Component
 * 
 * Adapted from nutrition-labels IngredientSearch pattern for Work Logger
 * Provides fuzzy search filtering for behavioral outcomes
 * 
 * Features:
 * - Real-time fuzzy search across title and description
 * - Keyboard navigation (Arrow keys, Enter, Escape)
 * - Click-outside to close
 * - Highlight matching text
 * - Auto-scroll to selected item
 * - Accessible (ARIA labels, roles, live regions)
 * - Mobile-friendly (touch-optimized)
 */
export default function OutcomeSearch({
  items,
  selectedId,
  onSelect,
  placeholder = 'Search outcomes...',
  emptyMessage = 'No outcomes found',
  disabled = false,
  className = ''
}: OutcomeSearchProps) {
  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [highlightedIndex, setHighlightedIndex] = useState(0)
  
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fuzzy search algorithm - matches characters in order, case-insensitive
  const fuzzyMatch = (text: string, search: string): boolean => {
    if (!search) return true
    
    const textLower = text.toLowerCase()
    const searchLower = search.toLowerCase()
    
    let searchIndex = 0
    for (let i = 0; i < textLower.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        searchIndex++
      }
    }
    
    return searchIndex === searchLower.length
  }

  // Filter items based on search query
  const filteredItems = useMemo(() => {
    if (!query.trim()) return items
    
    return items.filter(item => {
      const titleMatch = fuzzyMatch(item.title, query)
      const descriptionMatch = item.description ? fuzzyMatch(item.description, query) : false
      return titleMatch || descriptionMatch
    })
  }, [items, query])

  // Get currently selected item
  const selectedItem = useMemo(() => {
    return items.find(item => item.id === selectedId)
  }, [items, selectedId])

  // Reset highlighted index when filtered items change
  useEffect(() => {
    setHighlightedIndex(0)
  }, [filteredItems])

  // Scroll highlighted item into view
  useEffect(() => {
    if (isOpen && listRef.current) {
      const highlightedElement = listRef.current.children[highlightedIndex] as HTMLElement
      if (highlightedElement) {
        highlightedElement.scrollIntoView({
          block: 'nearest',
          behavior: 'smooth'
        })
      }
    }
  }, [highlightedIndex, isOpen])

  // Click outside to close
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen && e.key === 'Enter') {
      setIsOpen(true)
      return
    }

    if (!isOpen) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev < filteredItems.length - 1 ? prev + 1 : 0
        )
        break
      
      case 'ArrowUp':
        e.preventDefault()
        setHighlightedIndex(prev => 
          prev > 0 ? prev - 1 : filteredItems.length - 1
        )
        break
      
      case 'Enter':
        e.preventDefault()
        if (filteredItems[highlightedIndex]) {
          handleSelectItem(filteredItems[highlightedIndex].id)
        }
        break
      
      case 'Escape':
        e.preventDefault()
        setIsOpen(false)
        setQuery('')
        inputRef.current?.blur()
        break
    }
  }

  // Handle item selection
  const handleSelectItem = (id: string) => {
    onSelect(id)
    setIsOpen(false)
    setQuery('')
    inputRef.current?.blur()
  }

  // Highlight matching text in results
  const highlightMatch = (text: string, search: string) => {
    if (!search) return text

    const parts: { text: string; highlight: boolean }[] = []
    const textLower = text.toLowerCase()
    const searchLower = search.toLowerCase()
    
    let lastIndex = 0
    let searchIndex = 0
    
    for (let i = 0; i < text.length && searchIndex < searchLower.length; i++) {
      if (textLower[i] === searchLower[searchIndex]) {
        // Add non-matching part
        if (i > lastIndex) {
          parts.push({ text: text.slice(lastIndex, i), highlight: false })
        }
        // Add matching character
        parts.push({ text: text[i], highlight: true })
        lastIndex = i + 1
        searchIndex++
      }
    }
    
    // Add remaining text
    if (lastIndex < text.length) {
      parts.push({ text: text.slice(lastIndex), highlight: false })
    }
    
    return (
      <>
        {parts.map((part, index) => (
          part.highlight ? (
            <mark key={index} className="bg-yellow-200 text-gray-900 font-semibold">
              {part.text}
            </mark>
          ) : (
            <span key={index}>{part.text}</span>
          )
        ))}
      </>
    )
  }

  return (
    <div
      ref={containerRef}
      className={`relative ${className}`}
    >
      {/* Search Input */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={isOpen ? query : (selectedItem?.title || '')}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full px-4 py-3 pr-10 bg-white border-2 border-gray-300 rounded-xl text-gray-900 font-medium focus:border-emerald-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed transition-colors"
          role="combobox"
          aria-expanded={isOpen}
          aria-controls="outcome-listbox"
          aria-activedescendant={isOpen && filteredItems[highlightedIndex] ? `outcome-${filteredItems[highlightedIndex].id}` : undefined}
          aria-autocomplete="list"
          aria-label="Search and select outcome"
        />
        
        {/* Search Icon / Dropdown Arrow */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
          {isOpen ? (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          )}
        </div>
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-2 bg-white border-2 border-gray-300 rounded-xl shadow-xl max-h-80 overflow-hidden">
          {filteredItems.length === 0 ? (
            <div
              className="px-4 py-8 text-center text-gray-500"
              role="status"
              aria-live="polite"
            >
              {emptyMessage}
            </div>
          ) : (
            <ul
              ref={listRef}
              className="max-h-80 overflow-y-auto"
              role="listbox"
              id="outcome-listbox"
              aria-label="Outcome options"
            >
              {filteredItems.map((item, index) => (
                <li
                  key={item.id}
                  id={`outcome-${item.id}`}
                  role="option"
                  aria-selected={item.id === selectedId}
                  onClick={() => handleSelectItem(item.id)}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  className={`px-4 py-3 cursor-pointer transition-colors border-b border-gray-100 last:border-0 ${
                    index === highlightedIndex
                      ? 'bg-emerald-50'
                      : item.id === selectedId
                      ? 'bg-emerald-100'
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-900">
                    {highlightMatch(item.title, query)}
                  </div>
                  {item.description && (
                    <div className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {highlightMatch(item.description, query)}
                    </div>
                  )}
                  {item.id === selectedId && (
                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 bg-emerald-600 text-white text-xs font-semibold rounded">
                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                      Selected
                    </div>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {/* Screen reader announcements */}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true">
        {isOpen && `${filteredItems.length} ${filteredItems.length === 1 ? 'result' : 'results'} available`}
      </div>
    </div>
  )
}
