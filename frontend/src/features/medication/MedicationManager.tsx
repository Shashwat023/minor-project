// frontend/src/features/medication/MedicationManager.tsx
// Full medication scheduling, tracking, and mark-as-taken functionality.
// Responsive layout, notification toast on actions, SpacetimeDB integration.

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpacetime } from '../../components/SpacetimeProvider';
import { useSpacetimeTables } from '../../hooks/useSpacetimeTables';

export default function MedicationManager() {
  const { conn, isConnected } = useSpacetime();
  const { medications, notifications } = useSpacetimeTables();

  const [showForm, setShowForm] = useState(false);
  const [medicineName, setMedicineName] = useState('');
  const [dose, setDose] = useState('');
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('');
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  // Set default date to today
  useEffect(() => {
    if (!scheduleDate) {
      setScheduleDate(new Date().toISOString().split('T')[0]);
    }
  }, []);

  const showToast = (msg: string, type: 'success' | 'error' = 'success') => {
    setToast({ msg, type });
  };

  const handleAddMedication = () => {
    if (!conn || !isConnected) {
      showToast("SpacetimeDB not connected!", 'error');
      return;
    }
    if (!medicineName.trim() || !dose.trim() || !scheduleDate || !scheduleTime) {
      showToast("Please fill in all fields.", 'error');
      return;
    }

    const dateTime = new Date(`${scheduleDate}T${scheduleTime}`);
    const triggerTimeMs = BigInt(dateTime.getTime());
    const medId = `med_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;

    try {
      conn.reducers.addMedication({
        medicationId: medId,
        medicineName: medicineName.trim(),
        dose: dose.trim(),
        triggerTime: triggerTimeMs,
      });
      showToast(`✅ ${medicineName} scheduled for ${scheduleDate} at ${scheduleTime}`);
      setMedicineName('');
      setDose('');
      setScheduleTime('');
      setShowForm(false);
    } catch (err) {
      console.error("Failed to add medication:", err);
      showToast("Error adding medication. Check console.", 'error');
    }
  };

  const handleMarkTaken = (medicationId: string, name: string) => {
    if (!conn) return;
    try {
      conn.reducers.markMedicationTaken({ medicationId });
      showToast(`✅ ${name} marked as taken!`);
    } catch (err) {
      console.error("Failed to mark taken:", err);
      showToast("Failed to mark as taken.", 'error');
    }
  };

  const handleRemove = (medicationId: string, name: string) => {
    if (!conn) return;
    try {
      conn.reducers.removeMedication({ medicationId });
      showToast(`🗑 ${name} removed.`);
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  };

  const sortedMeds = [...medications].sort((a, b) => Number(b.createdAt) - Number(a.createdAt));

  // Stats
  const takenCount = medications.filter(m => m.status === 'taken').length;
  const pendingCount = medications.filter(m => m.status === 'pending' || m.status === 'alerting').length;
  const totalCount = medications.length;
  const adherenceRate = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  // Recent medication notifications
  const medNotifs = notifications
    .filter(n => n.type === 'medication_taken' || n.type === 'medication_scheduled' || n.type === 'medication_due')
    .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
    .slice(0, 5);

  const statusColor = (s: string) => {
    if (s === 'taken') return { bg: 'rgba(16,185,129,0.15)', border: '#10b981', text: '#34d399' };
    if (s === 'alerting') return { bg: 'rgba(245,158,11,0.15)', border: '#f59e0b', text: '#fbbf24' };
    if (s === 'missed') return { bg: 'rgba(239,68,68,0.15)', border: '#ef4444', text: '#f87171' };
    return { bg: 'rgba(100,116,139,0.1)', border: '#475569', text: '#94a3b8' };
  };

  return (
    <div style={{
      background: "#0d0d14", minHeight: "100vh", color: "#e2e8f0",
      fontFamily: "Inter, system-ui, sans-serif",
      padding: "32px", paddingTop: "80px",
      maxWidth: "100%", overflow: "hidden",
    }}>
      {/* Toast notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            style={{
              position: 'fixed', top: 80, left: '50%', transform: 'translateX(-50%)',
              zIndex: 1000, padding: '12px 28px', borderRadius: 12,
              background: toast.type === 'success' ? '#064e3b' : '#7f1d1d',
              border: `1px solid ${toast.type === 'success' ? '#10b981' : '#ef4444'}`,
              color: toast.type === 'success' ? '#34d399' : '#fca5a5',
              fontSize: 14, fontWeight: 600,
              boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}
          >
            {toast.msg}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <div style={{ fontSize: 22, fontWeight: 700, color: "#a78bfa" }}>💊 Medication Manager</div>
          <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
            Schedule, track, and manage medications · <span style={{ color: isConnected ? '#10b981' : '#f59e0b' }}>{isConnected ? '🟢 Live' : '⏳ Connecting...'}</span>
          </div>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          style={{
            padding: "10px 20px", borderRadius: 10, background: "#4c1d95",
            color: "#ddd6fe", border: "1px solid #7c3aed", fontSize: 13,
            fontWeight: 600, cursor: "pointer", whiteSpace: 'nowrap',
          }}
        >
          {showForm ? '✕ Cancel' : '+ Add Medication'}
        </button>
      </div>

      {/* Stats Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 24 }}>
        {[
          { label: 'Total', value: totalCount, color: '#a78bfa' },
          { label: 'Taken', value: takenCount, color: '#10b981' },
          { label: 'Pending', value: pendingCount, color: '#f59e0b' },
          { label: 'Adherence', value: `${adherenceRate}%`, color: adherenceRate > 80 ? '#10b981' : '#f59e0b' },
        ].map(s => (
          <div key={s.label} style={{
            background: '#13131f', border: '1px solid #1e1e30', borderRadius: 10, padding: '16px',
            textAlign: 'center',
          }}>
            <div style={{ fontSize: 22, fontWeight: 700, color: s.color }}>{s.value}</div>
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 4, textTransform: 'uppercase', fontWeight: 600, letterSpacing: '.05em' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Add Medication Form */}
      <AnimatePresence>
        {showForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            style={{ overflow: 'hidden', marginBottom: 24 }}
          >
            <div style={{
              background: "#13131f", border: "1px solid #1e1e30",
              borderRadius: 16, padding: '24px',
            }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: '#a78bfa', marginBottom: 16, textTransform: 'uppercase', letterSpacing: '.05em' }}>
                Schedule New Medication
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Medicine Name</label>
                  <input
                    style={{ padding: "10px 14px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2d2d44", color: "#e2e8f0", fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. Donepezil"
                    value={medicineName}
                    onChange={e => setMedicineName(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Dose</label>
                  <input
                    style={{ padding: "10px 14px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2d2d44", color: "#e2e8f0", fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    placeholder="e.g. 10mg"
                    value={dose}
                    onChange={e => setDose(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Date</label>
                  <input
                    style={{ padding: "10px 14px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2d2d44", color: "#e2e8f0", fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    type="date"
                    value={scheduleDate}
                    onChange={e => setScheduleDate(e.target.value)}
                  />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '.05em', display: 'block', marginBottom: 6 }}>Time</label>
                  <input
                    style={{ padding: "10px 14px", borderRadius: 8, background: "#1a1a2e", border: "1px solid #2d2d44", color: "#e2e8f0", fontSize: 14, outline: 'none', width: '100%', boxSizing: 'border-box' }}
                    type="time"
                    value={scheduleTime}
                    onChange={e => setScheduleTime(e.target.value)}
                  />
                </div>
              </div>
              <button
                onClick={handleAddMedication}
                style={{
                  width: '100%', marginTop: 16, padding: "12px", borderRadius: 10,
                  background: "#4c1d95", color: "#ddd6fe", border: "1px solid #7c3aed",
                  fontSize: 14, fontWeight: 600, cursor: "pointer",
                }}
              >
                📋 Schedule Medication
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Two Column: Medication List + Notifications */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        {/* Medication List */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Medications ({sortedMeds.length})
          </div>

          {sortedMeds.length === 0 && (
            <div style={{ textAlign: 'center', padding: '48px 20px', color: '#64748b', background: '#13131f', borderRadius: 12, border: '1px solid #1e1e30' }}>
              <div style={{ fontSize: 40, marginBottom: 12 }}>💊</div>
              <div style={{ fontSize: 15 }}>No medications scheduled yet.</div>
              <div style={{ fontSize: 12, marginTop: 6, color: '#475569' }}>Click "+ Add Medication" to get started.</div>
            </div>
          )}

          <AnimatePresence>
            {sortedMeds.map((med, i) => {
              const sc = statusColor(med.status);
              const scheduledTime = new Date(Number(med.triggerTime));
              const isPast = scheduledTime.getTime() < Date.now();
              const showTakeBtn = med.status === 'pending' || med.status === 'alerting';

              return (
                <motion.div
                  key={med.medicationId}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ delay: i * 0.04 }}
                  style={{
                    background: "#13131f", border: "1px solid #1e1e30",
                    borderLeft: `4px solid ${sc.border}`,
                    borderRadius: 10, padding: "16px 20px", marginBottom: 10,
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    flexWrap: 'wrap', gap: 8,
                  }}
                >
                  <div style={{ flex: 1, minWidth: 180 }}>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#e2e8f0' }}>
                      {med.medicineName} <span style={{ fontSize: 12, color: '#94a3b8', fontWeight: 400 }}>— {med.dose}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 3 }}>
                      📅 {scheduledTime.toLocaleDateString()} at {scheduledTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      {isPast && med.status === 'pending' && <span style={{ color: '#f59e0b', marginLeft: 6 }}>⚠ Overdue</span>}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{
                      padding: "4px 10px", borderRadius: 16,
                      background: sc.bg, color: sc.text,
                      fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                      border: `1px solid ${sc.border}`,
                    }}>
                      {med.status}
                    </span>
                    {showTakeBtn && (
                      <button
                        onClick={() => handleMarkTaken(med.medicationId, med.medicineName)}
                        style={{
                          padding: "6px 12px", borderRadius: 8, border: "1px solid #10b981",
                          background: '#064e3b', color: '#34d399', fontSize: 11, fontWeight: 600, cursor: "pointer",
                        }}
                      >
                        ✓ Taken
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(med.medicationId, med.medicineName)}
                      style={{
                        padding: "6px 10px", borderRadius: 8, border: "1px solid #7f1d1d",
                        background: 'transparent', color: '#f87171', fontSize: 11, fontWeight: 600, cursor: "pointer",
                      }}
                    >
                      ✕
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {/* Recent Notifications Sidebar */}
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '.08em' }}>
            Recent Activity
          </div>
          <div style={{ background: '#13131f', border: '1px solid #1e1e30', borderRadius: 12, padding: 16 }}>
            {medNotifs.length === 0 ? (
              <div style={{ color: '#475569', fontSize: 13, textAlign: 'center', padding: 20 }}>
                No medication activity yet.
              </div>
            ) : (
              medNotifs.map((n, i) => {
                const isPositive = n.type === 'medication_taken';
                return (
                  <div key={n.notificationId} style={{
                    padding: '10px 12px', marginBottom: 8, borderRadius: 8,
                    background: '#1a1a2e',
                    borderLeft: `3px solid ${isPositive ? '#10b981' : n.type === 'medication_due' ? '#f59e0b' : '#3b82f6'}`,
                  }}>
                    <div style={{ fontSize: 12, color: '#e2e8f0', fontWeight: 500 }}>{n.message}</div>
                    <div style={{ fontSize: 10, color: '#64748b', marginTop: 3 }}>
                      {new Date(Number(n.createdAt)).toLocaleString()}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}