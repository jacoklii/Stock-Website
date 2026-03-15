// [AI] ChangeBadge - Displays $ and % change; green for gains, red for losses

import React from 'react';

/**
 * ChangeBadge - Shows dollar and percent change with gain/loss coloring.
 * @param {object} props
 * @param {number} props.change - Dollar change (can be negative)
 * @param {number} props.changePercent - Percent change
 * @param {string} [props.currency='$'] - Currency symbol
 */
export default function ChangeBadge({ change, changePercent, currency = '$' }) {
  const validChange = Number.isFinite(Number(change));
  const validPercent = Number.isFinite(Number(changePercent));
  const numChange = validChange ? Number(change) : 0;
  const numPercent = validPercent ? Number(changePercent) : 0;
  const isGain = numChange >= 0;
  const prefix = isGain ? '+' : '';
  const colorClass = isGain ? 'text-gain' : 'text-loss';

  return (
    <span
      className={`change-badge font-mono ${colorClass}`}
      style={{
        fontSize: 'var(--font-size-sm)',
        fontWeight: 500,
        color: isGain ? 'var(--gain-color)' : 'var(--loss-color)',
      }}
    >
      {validChange ? `${prefix}${currency}${Math.abs(numChange).toFixed(2)}` : 'No Data'}
      {validPercent && (
        <>
          {' '}({prefix}{numPercent.toFixed(2)}%)
        </>
      )}
    </span>
  );
}
