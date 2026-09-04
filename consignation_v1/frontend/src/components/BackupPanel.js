import React, { useCallback, useEffect, useRef, useState } from 'react';
import { backupService } from '../services/api';

const STATUS_META = {
  OK:              { label: 'Opérationnel',        dot: '#4ade80' },
  PARTIEL:         { label: 'Partiel (erreurs)',    dot: '#f59e0b' },
  ERROR:           { label: 'En erreur',            dot: '#ef4444' },
  JAMAIS_EXECUTE:  { label: 'Jamais exécuté',       dot: '#94a3b8' },
};

const OP_STATUS_COLOR = {
  SUCCESS: '#059669',
  PENDING: '#d97706',
  FAILED:  '#e11d48',
};

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return iso;
  }
}

export default function BackupPanel() {
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const pollRef = useRef(null);

  const fetchStatus = useCallback(() => {
    return backupService.getStatus()
      .then(data => { setStatus(data); setError(''); })
      .catch(() => setError('Impossible de charger le statut du backup.'))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    fetchStatus();
    return () => clearInterval(pollRef.current);
  }, [fetchStatus]);

  const pollWhileBusy = () => {
    clearInterval(pollRef.current);
    let ticks = 0;
    pollRef.current = setInterval(() => {
      ticks += 1;
      fetchStatus();
      if (ticks >= 10) clearInterval(pollRef.current); // ~30s de polling max
    }, 3000);
  };

  const handleRunNow = async () => {
    setBusy(true);
    try {
      await backupService.runNow();
      pollWhileBusy();
    } catch {
      setError("Impossible de déclencher le backup.");
    } finally {
      setTimeout(() => setBusy(false), 1500);
    }
  };

  const handleRetry = async () => {
    setBusy(true);
    try {
      await backupService.retry();
      pollWhileBusy();
    } catch {
      setError('Impossible de relancer les échecs.');
    } finally {
      setTimeout(() => setBusy(false), 1500);
    }
  };

  const meta = STATUS_META[status?.lastBackupStatus] || STATUS_META.JAMAIS_EXECUTE;

  return (
    <div className="adm-card" style={{ gridColumn: '1 / -1' }}>
      <div className="adm-card__head">
        <div className="adm-card__head-l">
          <span className="adm-card__head-icon adm-card__head-icon--blue">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l2-3h4l2 3h3a2 2 0 0 1 2 2z" />
              <circle cx="12" cy="13" r="3" />
            </svg>
          </span>
          <span className="adm-card__title">Sauvegarde des plans</span>
        </div>
        {status && (
          <span className="adm-card__total" style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: meta.dot, display: 'inline-block' }} />
            {meta.label}
          </span>
        )}
      </div>

      {loading ? (
        <div style={{ padding: '30px 20px', textAlign: 'center', color: '#94a3b8', fontSize: 13 }}>Chargement…</div>
      ) : error && !status ? (
        <div style={{ padding: '20px', color: '#b91c1c', fontSize: 13 }}>⚠ {error}</div>
      ) : (
        <div style={{ padding: '14px 20px 20px' }}>
          <div style={{ fontSize: 12, color: '#64748b', marginBottom: 14, wordBreak: 'break-all' }}>
            <strong style={{ color: '#0f172a' }}>Emplacement :</strong> {status.rootPath}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 16 }}>
            <MiniStat label="Dernier backup" value={formatDate(status.lastBackupDate)} />
            <MiniStat label="Plans sauvegardés" value={status.totalPlansSauvegardes ?? 0} color="#2563eb" />
            <MiniStat label="Échecs" value={status.totalEchecs ?? 0} color={status.totalEchecs > 0 ? '#e11d48' : '#059669'} />
          </div>

          <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap' }}>
            <button
              onClick={handleRunNow}
              disabled={busy}
              style={{
                background: '#2563eb', color: '#fff', border: 'none', borderRadius: 10,
                padding: '9px 16px', fontSize: 12.5, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
                opacity: busy ? 0.6 : 1, transition: 'opacity .2s',
              }}
            >
              {busy ? 'Backup en cours…' : 'Sauvegarder maintenant'}
            </button>
            {status.totalEchecs > 0 && (
              <button
                onClick={handleRetry}
                disabled={busy}
                style={{
                  background: '#fff', color: '#e11d48', border: '1.5px solid #fca5a5', borderRadius: 10,
                  padding: '9px 16px', fontSize: 12.5, fontWeight: 600, cursor: busy ? 'default' : 'pointer',
                  opacity: busy ? 0.6 : 1,
                }}
              >
                Retenter les échecs
              </button>
            )}
          </div>

          {error && <div style={{ color: '#b91c1c', fontSize: 12, marginBottom: 12 }}>⚠ {error}</div>}

          <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.08em', marginBottom: 8 }}>
            Dernières opérations
          </div>
          {(!status.dernieresOperations || status.dernieresOperations.length === 0) ? (
            <div style={{ fontSize: 12.5, color: '#94a3b8', fontStyle: 'italic' }}>Aucune opération enregistrée.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 220, overflowY: 'auto' }}>
              {status.dernieresOperations.map(op => (
                <div key={op.id} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
                  fontSize: 12, padding: '7px 10px', background: '#f8fafc', borderRadius: 8,
                }}>
                  <span style={{ color: '#334155', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {op.planReference ? `Plan ${op.planReference}` : op.type} — {op.type}
                    {op.message ? <span style={{ color: '#94a3b8' }}> · {op.message}</span> : null}
                  </span>
                  <span style={{
                    color: OP_STATUS_COLOR[op.status] || '#64748b', fontWeight: 700, fontSize: 11,
                    whiteSpace: 'nowrap', flexShrink: 0,
                  }}>
                    {op.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function MiniStat({ label, value, color }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.06em' }}>{label}</div>
      <div style={{ fontSize: 16, fontWeight: 800, color: color || '#0f172a', marginTop: 2 }}>{value}</div>
    </div>
  );
}
