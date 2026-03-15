// [AI] StockSearchInput - Debounced ticker search with autocomplete

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import { searchTicker } from '../utils/stocks';

const DEBOUNCE_MS = 300;

/**
 * StockSearchInput - Debounced input with autocomplete from searchTicker().
 * @param {object} props
 * @param {function} props.onSelect - (ticker) => void when user selects a result
 * @param {string} [props.placeholder] - Input placeholder
 * @param {string} [props.value] - Controlled value (optional)
 */
export default function StockSearchInput({ onSelect, placeholder = 'Search ticker...', value: controlledValue }) {
  const [query, setQuery] = useState(controlledValue ?? '');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const containerRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    if (controlledValue !== undefined) setQuery(controlledValue ?? '');
  }, [controlledValue]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setLoading(true);
    debounceRef.current = setTimeout(async () => {
      const { data } = await searchTicker(query);
      setResults(Array.isArray(data) ? data : []);
      setLoading(false);
      setActiveIndex(-1);
    }, DEBOUNCE_MS);
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [query]);

  const handleSelect = useCallback(
    (item) => {
      const ticker = item.symbol ?? item.ticker ?? item;
      setQuery(ticker);
      setResults([]);
      setIsOpen(false);
      onSelect?.(typeof item === 'object' ? item : { symbol: ticker });
    },
    [onSelect]
  );

  const handleKeyDown = useCallback(
    (e) => {
      if (!isOpen || results.length === 0) {
        if (e.key === 'Enter' && query) {
          const first = results[0];
          if (first) {
            handleSelect(first);
          } else {
            const fallback = { symbol: query.trim().toUpperCase() };
            handleSelect(fallback);
          }
        }
        return;
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setActiveIndex((i) => (i < results.length - 1 ? i + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : results.length - 1));
      } else if (e.key === 'Enter' && activeIndex >= 0 && results[activeIndex]) {
        e.preventDefault();
        handleSelect(results[activeIndex]);
      }
    },
    [isOpen, results, activeIndex, handleSelect, query]
  );

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} style={{ position: 'relative', width: '100%' }}>
      <div style={{ position: 'relative' }}>
        <Search
          size={18}
          style={{
            position: 'absolute',
            left: 'var(--spacing-md)',
            top: '50%',
            transform: 'translateY(-50%)',
            color: 'var(--text-muted)',
          }}
        />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          style={{
            width: '100%',
            padding: 'var(--spacing-sm) var(--spacing-md) var(--spacing-sm) 2.5rem',
          }}
        />
      </div>
      {isOpen && (results.length > 0 || loading) && (
        <ul
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            marginTop: 'var(--spacing-xs)',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            maxHeight: 240,
            overflowY: 'auto',
            listStyle: 'none',
            zIndex: 100,
          }}
        >
          {loading ? (
            <li style={{ padding: 'var(--spacing-md)', color: 'var(--text-muted)' }}>Searching...</li>
          ) : (
            results.map((item, i) => {
              const sym = item.symbol ?? item.ticker;
              const name = item.name ?? '';
              return (
                <li
                  key={sym}
                  role="option"
                  aria-selected={i === activeIndex}
                  onClick={() => handleSelect(item)}
                  style={{
                    padding: 'var(--spacing-sm) var(--spacing-md)',
                    cursor: 'pointer',
                    background: i === activeIndex ? 'var(--bg-elevated)' : 'transparent',
                  }}
                >
                  <span className="font-mono" style={{ fontWeight: 500 }}>{sym}</span>
                  {name && <span style={{ marginLeft: 'var(--spacing-sm)', color: 'var(--text-secondary)' }}>{name}</span>}
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
