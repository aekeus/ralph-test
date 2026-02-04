import { useState, useRef, useEffect } from 'react';
import type { Tag } from '../types';

interface TagInputProps {
  allTags: Tag[];
  currentTags: Tag[];
  onAddTag: (tag: Tag) => void;
  onCreateAndAddTag: (name: string) => void;
  onRemoveTag: (tagId: number) => void;
}

export default function TagInput({ allTags, currentTags, onAddTag, onCreateAndAddTag, onRemoveTag }: TagInputProps) {
  const [input, setInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentTagIds = new Set(currentTags.map((t) => t.id));
  const filtered = allTags.filter(
    (t) => !currentTagIds.has(t.id) && t.name.toLowerCase().includes(input.toLowerCase())
  );

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault();
      const trimmed = input.trim();
      if (!trimmed) return;

      const existing = allTags.find((t) => t.name.toLowerCase() === trimmed.toLowerCase());
      if (existing && !currentTagIds.has(existing.id)) {
        onAddTag(existing);
      } else if (!existing) {
        onCreateAndAddTag(trimmed);
      }
      setInput('');
      setShowSuggestions(false);
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      inputRef.current?.blur();
    }
  }

  function handleSelect(tag: Tag) {
    onAddTag(tag);
    setInput('');
    setShowSuggestions(false);
    inputRef.current?.focus();
  }

  return (
    <div className="tag-input-container" ref={containerRef}>
      <div className="tag-chips">
        {currentTags.map((tag) => (
          <span
            key={tag.id}
            className="tag-chip"
            style={{ backgroundColor: tag.color + '22', color: tag.color, borderColor: tag.color + '44' }}
          >
            {tag.name}
            <button
              type="button"
              className="tag-chip-remove"
              onClick={() => onRemoveTag(tag.id)}
              aria-label={`Remove tag ${tag.name}`}
            >
              &times;
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          className="tag-input"
          value={input}
          onChange={(e) => { setInput(e.target.value); setShowSuggestions(true); }}
          onFocus={() => setShowSuggestions(true)}
          onKeyDown={handleKeyDown}
          placeholder={currentTags.length === 0 ? 'Add tags...' : ''}
          aria-label="Add tag"
        />
      </div>
      {showSuggestions && input.trim() && filtered.length > 0 && (
        <ul className="tag-suggestions">
          {filtered.slice(0, 5).map((tag) => (
            <li key={tag.id}>
              <button
                type="button"
                className="tag-suggestion-item"
                onClick={() => handleSelect(tag)}
              >
                <span className="tag-suggestion-dot" style={{ backgroundColor: tag.color }} />
                {tag.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
