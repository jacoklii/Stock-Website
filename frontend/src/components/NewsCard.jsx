// [AI] NewsCard - Headline, source, timestamp, ticker tags, summary, read-more link

import React from 'react';
import { ExternalLink } from 'lucide-react';

/**
 * NewsCard - Single news article card.
 * @param {object} props
 * @param {string} props.title - Headline
 * @param {string} [props.source] - Source name
 * @param {string} [props.url] - External link
 * @param {string} [props.publishedAt] - ISO date or relative timestamp
 * @param {string[]} [props.tickers] - Related ticker symbols
 * @param {string} [props.summary] - Short summary
 */
export default function NewsCard({ title, source, url, publishedAt, tickers = [], summary }) {
  return (
    <a
      href={url || '#'}
      target="_blank"
      rel="noopener noreferrer"
      className="card"
      style={{
        display: 'block',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.2s',
      }}
    >
      <h3
        style={{
          fontSize: 'var(--font-size-base)',
          marginBottom: 'var(--spacing-sm)',
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          color: 'var(--text-primary)',
        }}
      >
        {title}
      </h3>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: 'var(--spacing-sm)',
          marginBottom: 'var(--spacing-sm)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--text-secondary)',
        }}
      >
        {source && <span>{source}</span>}
        {publishedAt && (
          <span style={{ color: 'var(--text-muted)' }}>{publishedAt}</span>
        )}
      </div>
      {tickers.length > 0 && (
        <div style={{ display: 'flex', gap: 'var(--spacing-xs)', marginBottom: 'var(--spacing-sm)', flexWrap: 'wrap' }}>
          {tickers.map((t) => (
            <span
              key={t}
              className="font-mono"
              style={{
                padding: '2px 6px',
                background: 'var(--bg-elevated)',
                borderRadius: 'var(--radius-sm)',
                fontSize: 'var(--font-size-xs)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
      )}
      {summary && (
        <p
          style={{
            fontSize: 'var(--font-size-sm)',
            color: 'var(--text-secondary)',
            marginBottom: 'var(--spacing-sm)',
            lineHeight: 1.5,
          }}
        >
          {summary}
        </p>
      )}
      <span
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 'var(--spacing-xs)',
          fontSize: 'var(--font-size-sm)',
          color: 'var(--accent-color)',
        }}
      >
        Read more <ExternalLink size={14} />
      </span>
    </a>
  );
}
