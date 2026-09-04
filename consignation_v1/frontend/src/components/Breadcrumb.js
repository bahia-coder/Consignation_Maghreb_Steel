import React from 'react';
import { useNavigate } from 'react-router-dom';

export default function Breadcrumb({ items }) {
  const navigate = useNavigate();

  return (
    <nav style={{
      display: 'flex', alignItems: 'center', gap: 6,
      fontSize: '0.85rem', marginBottom: 20, flexWrap: 'wrap',
    }}>
      {items.map((item, i) => (
        <React.Fragment key={i}>
          {i > 0 && (
            <span style={{ color: '#9ca3af', fontSize: '0.75rem' }}>/</span>
          )}
          {item.path ? (
            <button
              onClick={() => navigate(item.path)}
              style={{
                background: 'none', border: 'none',
                color: 'var(--primary)', fontSize: '0.85rem', fontWeight: 500,
                cursor: 'pointer', padding: '2px 4px',
                borderRadius: 4, fontFamily: 'inherit',
              }}
            >
              {item.label}
            </button>
          ) : (
            <span style={{
              color: i === items.length - 1 ? '#111827' : '#6b7280',
              fontWeight: i === items.length - 1 ? 600 : 400,
              padding: '2px 4px',
            }}>
              {item.label}
            </span>
          )}
        </React.Fragment>
      ))}
    </nav>
  );
}
