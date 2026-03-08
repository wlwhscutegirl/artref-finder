'use client';

import { useState, useRef, useEffect } from 'react';
import { ALL_TAG_NAMES, getTagTooltip } from '@/lib/sample-data';

interface TagSearchInputProps {
  selectedTags: string[];
  onTagsChange: (tags: string[]) => void;
}

/**
 * 태그 자동완성 검색 입력 컴포넌트
 * 텍스트를 입력하면 매칭되는 태그를 드롭다운으로 보여주고,
 * 클릭 또는 Enter로 태그를 선택합니다.
 */
export function TagSearchInput({ selectedTags, onTagsChange }: TagSearchInputProps) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [highlightIndex, setHighlightIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 입력값과 매칭되는 태그 필터링 (이미 선택된 태그 제외)
  const suggestions = query.trim()
    ? ALL_TAG_NAMES.filter(
        (tag) =>
          tag.includes(query.trim()) && !selectedTags.includes(tag)
      )
    : [];

  // 태그 선택 처리
  const selectTag = (tag: string) => {
    onTagsChange([...selectedTags, tag]);
    setQuery('');
    setIsOpen(false);
    setHighlightIndex(0);
    inputRef.current?.focus();
  };

  // 키보드 네비게이션 (위/아래 화살표, Enter, Escape)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) {
      if (e.key === 'Enter' && query.trim()) {
        // 정확히 매칭되는 태그가 있으면 바로 선택
        const exact = ALL_TAG_NAMES.find((t) => t === query.trim());
        if (exact && !selectedTags.includes(exact)) {
          selectTag(exact);
        }
      }
      return;
    }

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setHighlightIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setHighlightIndex((prev) => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        selectTag(suggestions[highlightIndex]);
        break;
      case 'Escape':
        setIsOpen(false);
        break;
    }
  };

  // 입력값 변경 시 드롭다운 열기
  useEffect(() => {
    setIsOpen(suggestions.length > 0);
    setHighlightIndex(0);
  }, [query]);

  // 외부 클릭 시 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target as Node) &&
        !inputRef.current?.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative">
      {/* 검색 입력 필드 */}
      <input
        ref={inputRef}
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={handleKeyDown}
        onFocus={() => suggestions.length > 0 && setIsOpen(true)}
        placeholder="태그 검색... (예: 역광, 손, 드라마틱)"
        className="w-full px-3 py-2 rounded-lg text-sm bg-neutral-900 border border-neutral-700 text-white placeholder-neutral-500 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
      />

      {/* 자동완성 드롭다운 */}
      {isOpen && suggestions.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute top-full left-0 right-0 mt-1 bg-neutral-900 border border-neutral-700 rounded-lg shadow-xl z-50 max-h-60 overflow-y-auto"
        >
          {suggestions.slice(0, 10).map((tag, index) => (
            <button
              key={tag}
              onClick={() => selectTag(tag)}
              className={`w-full px-3 py-2 text-left text-sm flex items-center justify-between cursor-pointer transition-colors ${
                index === highlightIndex
                  ? 'bg-orange-600/20 text-white'
                  : 'text-neutral-300 hover:bg-neutral-800'
              }`}
            >
              <span>#{tag}</span>
              <span className="text-xs text-neutral-500 ml-2 truncate max-w-[200px]">
                {getTagTooltip(tag)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
