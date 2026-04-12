// frontend/src/components/NotificationBell.tsx
// Floating notification bell — shows medication reminders, safe zone alerts,
// and face detection alerts. Anchored to bottom-right corner.

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSpacetimeTables } from '../hooks/useSpacetimeTables';
import { useSpacetime } from './SpacetimeProvider';

export default function NotificationBell() {
    const { conn } = useSpacetime();
    const { notifications, medications } = useSpacetimeTables();
    const [open, setOpen] = useState(false);
    const [hasNewAlert, setHasNewAlert] = useState(false);
    const panelRef = useRef<HTMLDivElement>(null);
    const prevCountRef = useRef(0);

    // Filter relevant notifications (medication + safe zone + face)
    const relevantNotifs = notifications
        .filter(n =>
            n.type === 'medication_taken' ||
            n.type === 'medication_scheduled' ||
            n.type === 'medication_due' ||
            n.type === 'safe_zone_breach' ||
            n.type === 'new_face'
        )
        .sort((a, b) => Number(b.createdAt) - Number(a.createdAt))
        .slice(0, 20);

    const unreadCount = relevantNotifs.filter(n => !n.isRead).length;

    // Auto-mark missed medications
    useEffect(() => {
        if (!conn || medications.length === 0) return;

        const now = Date.now();
        medications.forEach(med => {
            const triggerTime = Number(med.triggerTime);
            // If more than 1 hour past trigger time and still pending → missed
            if (med.status === 'pending' && triggerTime < now - 3600000) {
                // We can't directly update from frontend without a reducer, so we just display as missed in UI
            }
        });
    }, [medications, conn]);

    // Detect new notifications
    useEffect(() => {
        if (relevantNotifs.length > prevCountRef.current) {
            setHasNewAlert(true);
        }
        prevCountRef.current = relevantNotifs.length;
    }, [relevantNotifs.length]);

    // Close panel on outside click
    useEffect(() => {
        if (!open) return;
        const handler = (e: MouseEvent) => {
            if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [open]);

    const handleOpen = () => {
        setOpen(!open);
        setHasNewAlert(false);
        // Mark all as read
        if (conn) {
            relevantNotifs.forEach(n => {
                if (!n.isRead) {
                    try {
                        conn.reducers.markNotificationRead({ notificationId: n.notificationId });
                    } catch { /* ignore */ }
                }
            });
        }
    };

    const typeLabel = (type: string) => {
        if (type === 'medication_taken') return { icon: '✅', color: '#10b981', label: 'Med Taken' };
        if (type === 'medication_scheduled') return { icon: '📋', color: '#3b82f6', label: 'Scheduled' };
        if (type === 'medication_due') return { icon: '⏰', color: '#f59e0b', label: 'Reminder' };
        if (type === 'safe_zone_breach') return { icon: '🚨', color: '#ef4444', label: 'Zone Alert' };
        if (type === 'new_face') return { icon: '👤', color: '#a78bfa', label: 'New Face' };
        return { icon: '🔔', color: '#94a3b8', label: 'Alert' };
    };

    // Get overdue medications to display as active reminders
    const now = Date.now();
    const overdueMeds = medications.filter(
        m => m.status === 'pending' && Number(m.triggerTime) < now
    );

    return (
        <div ref={panelRef} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 9999 }}>
            {/* Bell Button */}
            <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleOpen}
                style={{
                    width: 56, height: 56, borderRadius: '50%',
                    background: 'linear-gradient(135deg, #4c1d95 0%, #7c3aed 100%)',
                    border: '2px solid #7c3aed',
                    color: '#fff', fontSize: 24, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 8px 32px rgba(76, 29, 149, 0.5)',
                    position: 'relative',
                }}
            >
                🔔
                {(unreadCount > 0 || hasNewAlert) && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        style={{
                            position: 'absolute', top: -4, right: -4,
                            background: '#ef4444', color: '#fff',
                            fontSize: 11, fontWeight: 800,
                            width: 22, height: 22, borderRadius: '50%',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            border: '2px solid #0d0d14',
                        }}
                    >
                        {unreadCount > 0 ? (unreadCount > 9 ? '9+' : unreadCount) : '!'}
                    </motion.span>
                )}
            </motion.button>

            {/* Panel */}
            <AnimatePresence>
                {open && (
                    <motion.div
                        initial={{ opacity: 0, y: 20, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 20, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        style={{
                            position: 'absolute', bottom: 68, right: 0,
                            width: 360, maxHeight: 480,
                            background: '#13131f', border: '1px solid #1e1e30',
                            borderRadius: 16, boxShadow: '0 16px 64px rgba(0,0,0,0.6)',
                            overflow: 'hidden',
                            fontFamily: 'Inter, system-ui, sans-serif',
                        }}
                    >
                        {/* Header */}
                        <div style={{
                            padding: '16px 20px', borderBottom: '1px solid #1e1e30',
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                        }}>
                            <div>
                                <div style={{ fontSize: 14, fontWeight: 700, color: '#e2e8f0' }}>Notifications</div>
                                <div style={{ fontSize: 11, color: '#64748b' }}>{relevantNotifs.length} alerts</div>
                            </div>
                            <button
                                onClick={() => setOpen(false)}
                                style={{
                                    background: 'transparent', border: 'none', color: '#64748b',
                                    fontSize: 18, cursor: 'pointer', padding: 4,
                                }}
                            >✕</button>
                        </div>

                        {/* Overdue Medication Banner */}
                        {overdueMeds.length > 0 && (
                            <div style={{
                                padding: '10px 20px', background: 'rgba(245,158,11,0.1)',
                                borderBottom: '1px solid rgba(245,158,11,0.2)',
                            }}>
                                <div style={{ fontSize: 12, fontWeight: 700, color: '#f59e0b', marginBottom: 4 }}>
                                    ⚠ {overdueMeds.length} Overdue Medication{overdueMeds.length > 1 ? 's' : ''}
                                </div>
                                {overdueMeds.slice(0, 3).map(m => (
                                    <div key={m.medicationId} style={{ fontSize: 11, color: '#fbbf24', marginTop: 2 }}>
                                        💊 {m.medicineName} {m.dose} — was due {new Date(Number(m.triggerTime)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Notification List */}
                        <div style={{ maxHeight: 340, overflowY: 'auto', padding: '8px 0' }}>
                            {relevantNotifs.length === 0 ? (
                                <div style={{ padding: '40px 20px', textAlign: 'center', color: '#475569', fontSize: 13 }}>
                                    No notifications yet.
                                </div>
                            ) : (
                                relevantNotifs.map((n, i) => {
                                    const { icon, color, label } = typeLabel(n.type);
                                    return (
                                        <div
                                            key={n.notificationId}
                                            style={{
                                                padding: '10px 20px',
                                                borderBottom: i < relevantNotifs.length - 1 ? '1px solid #1a1a2e' : 'none',
                                                background: n.isRead ? 'transparent' : 'rgba(167, 139, 250, 0.03)',
                                            }}
                                        >
                                            <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                                <span style={{ fontSize: 16 }}>{icon}</span>
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                                        <span style={{ fontSize: 10, color, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em' }}>{label}</span>
                                                        <span style={{ fontSize: 10, color: '#475569' }}>
                                                            {new Date(Number(n.createdAt)).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </span>
                                                    </div>
                                                    <div style={{ fontSize: 12, color: '#e2e8f0', marginTop: 3, lineHeight: 1.4 }}>{n.message}</div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}