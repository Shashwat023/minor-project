/**
 * MemoryCare — SpacetimeDB Module (Dev 2)
 * =========================================
 */

// @ts-ignore: Bypassing SpacetimeDB v2.1.0 internal type mapping bug
import { schema, table, t } from "spacetimedb/server";
import type { ReducerCtx } from "spacetimedb/server";

// ─────────────────────────────────────────────────────────────────────────────
// TABLES
// ─────────────────────────────────────────────────────────────────────────────

// caretaker_identity [PRIVATE]
const caretakerIdentity = table(
  { name: "caretaker_identity", public: false },
  {
    identity:     t.identity().primaryKey(),
    displayName:  t.string(),
    registeredAt: t.u64(),
  }
);

// patient_identity [PRIVATE]
const patientIdentity = table(
  { name: "patient_identity", public: false },
  {
    identity:     t.identity().primaryKey(),
    registeredAt: t.u64(),
  }
);

// known_person [PUBLIC]
const knownPerson = table(
  { name: "known_person", public: true },
  {
    personId:   t.string().primaryKey(),
    name:       t.string(),
    relation:   t.string(),
    currentCue: t.string(),
    photoUrl:   t.string(),
    createdAt:  t.u64(),
  }
);

// live_detection [PUBLIC]
const liveDetection = table(
  { name: "live_detection", public: true },
  {
    sessionId:  t.string().primaryKey(),
    personId:   t.string(),
    boxX:       t.i32(),
    boxY:       t.i32(),
    boxW:       t.i32(),
    boxH:       t.i32(),
    confidence: t.f64(),
    updatedAt:  t.u64(),
  }
);

// meeting_log [PUBLIC — temporary]
const meetingLog = table(
  { name: "meeting_log", public: true },
  {
    sessionId: t.string().primaryKey(),
    personId:  t.string(),
    status:    t.string(),   // "active" | "ended"
    cuesJson:  t.string(),
    startedAt: t.u64(),
  }
);

// meeting_summary [PUBLIC — permanent]
const meetingSummary = table(
  { name: "meeting_summary", public: true },
  {
    sessionId:   t.string().primaryKey(),
    personId:    t.string(),
    summary:     t.string(),
    meetingDate: t.string(),
    createdAt:   t.u64(),
  }
);

// medication [PUBLIC]
const medication = table(
  { name: "medication", public: true },
  {
    medicationId: t.string().primaryKey(),
    medicineName: t.string(),
    dose:         t.string(),
    triggerTime:  t.u64(),
    status:       t.string(),
    createdAt:    t.u64(),
  }
);

// medication_schedule [PRIVATE — scheduler table]
const medicationSchedule = table(
  {
    name:      "medication_schedule",
    scheduled: (): typeof triggerMedicationAlert => triggerMedicationAlert,
    public:    false,
  },
  {
    scheduledId:  t.u64().primaryKey().autoInc(),
    scheduledAt:  t.scheduleAt(),
    medicationId: t.string(),
  }
);

// notification [PUBLIC]
const notification = table(
  { name: "notification", public: true },
  {
    notificationId: t.string().primaryKey(),
    type:           t.string(),
    personId:       t.string(),
    message:        t.string(),
    isRead:         t.bool(),
    createdAt:      t.u64(),
  }
);

// safe_zone [PUBLIC]
const safeZone = table(
  { name: "safe_zone", public: true },
  {
    zoneId:       t.string().primaryKey(),
    centerLat:    t.f64(),
    centerLng:    t.f64(),
    radiusMeters: t.f64(),
    label:        t.string(),
    updatedAt:    t.u64(),
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SCHEMA
// ─────────────────────────────────────────────────────────────────────────────

const spacetimedb = schema({
  caretakerIdentity,
  patientIdentity,
  knownPerson,
  liveDetection,
  meetingLog,
  meetingSummary,
  medication,
  medicationSchedule,
  notification,
  safeZone,
});

export default spacetimedb;

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

function assertCaretaker(ctx: ReducerCtx): void {
  const found = ctx.db.caretakerIdentity.identity.find(ctx.sender);
  if (!found) {
    throw new Error("Unauthorized: only caretakers can call this reducer.");
  }
}

function nowMs(): bigint {
  return BigInt(Date.now());
}

let idCounter = 0;
function shortId(): string {
  idCounter++;
  return `${Date.now()}_${idCounter}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// AUTH REDUCERS
// ─────────────────────────────────────────────────────────────────────────────

export const registerCaretaker = spacetimedb.reducer(
  { displayName: t.string() },
  (ctx: ReducerCtx, { displayName }: { displayName: string }) => {
    let hasExisting = false;
    for (const _ of ctx.db.caretakerIdentity.iter()) {
      hasExisting = true;
      break;
    }
    if (hasExisting) assertCaretaker(ctx);
    if (ctx.db.caretakerIdentity.identity.find(ctx.sender)) return;
    ctx.db.caretakerIdentity.insert({
      identity: ctx.sender,
      displayName,
      registeredAt: nowMs(),
    });
  }
);

export const registerPatient = spacetimedb.reducer(
  {},
  (ctx: ReducerCtx) => {
    if (ctx.db.patientIdentity.identity.find(ctx.sender)) return;
    ctx.db.patientIdentity.insert({
      identity:     ctx.sender,
      registeredAt: nowMs(),
    });
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// FACE RECOGNITION REDUCERS
// ─────────────────────────────────────────────────────────────────────────────

export const addKnownPerson = spacetimedb.reducer(
  {
    personId: t.string(),
    name:     t.string(),
    relation: t.string(),
    photoUrl: t.string(),
  },
  (ctx: ReducerCtx, { personId, name, relation, photoUrl }: {
    personId: string; name: string; relation: string; photoUrl: string;
  }) => {
    assertCaretaker(ctx);
    if (ctx.db.knownPerson.personId.find(personId)) {
      throw new Error(`Person ${personId} already exists.`);
    }
    ctx.db.knownPerson.insert({
      personId, name, relation, currentCue: "", photoUrl, createdAt: nowMs(),
    });
  }
);

export const createNewFace = spacetimedb.reducer(
  { personId: t.string() },
  (ctx: ReducerCtx, { personId }: { personId: string }) => {
    if (ctx.db.knownPerson.personId.find(personId)) return;
    ctx.db.knownPerson.insert({
      personId, name: "", relation: "", currentCue: "", photoUrl: "", createdAt: nowMs(),
    });
    ctx.db.notification.insert({
      notificationId: `notif_${shortId()}`,
      type:    "new_face",
      personId,
      message: "Unknown face detected. Please identify this person.",
      isRead:  false,
      createdAt: nowMs(),
    });
  }
);

export const updatePersonDetails = spacetimedb.reducer(
  { personId: t.string(), name: t.string(), relation: t.string() },
  (ctx: ReducerCtx, { personId, name, relation }: {
    personId: string; name: string; relation: string;
  }) => {
    assertCaretaker(ctx);
    const person = ctx.db.knownPerson.personId.find(personId);
    if (!person) throw new Error(`Person ${personId} not found.`);
    ctx.db.knownPerson.personId.update({ ...person, name, relation });
    for (const notif of ctx.db.notification.iter()) {
      if (notif.personId === personId && notif.type === "new_face" && !notif.isRead) {
        ctx.db.notification.notificationId.update({ ...notif, isRead: true });
      }
    }
  }
);

export const updateLiveDetection = spacetimedb.reducer(
  {
    sessionId:  t.string(),
    personId:   t.string(),
    boxX:       t.i32(),
    boxY:       t.i32(),
    boxW:       t.i32(),
    boxH:       t.i32(),
    confidence: t.f64(),
  },
  (ctx: ReducerCtx, { sessionId, personId, boxX, boxY, boxW, boxH, confidence }: {
    sessionId: string; personId: string;
    boxX: number; boxY: number; boxW: number; boxH: number;
    confidence: number;
  }) => {
    const row = { sessionId, personId, boxX, boxY, boxW, boxH, confidence, updatedAt: nowMs() };
    if (ctx.db.liveDetection.sessionId.find(sessionId)) {
      ctx.db.liveDetection.sessionId.update(row);
    } else {
      ctx.db.liveDetection.insert(row);
    }
  }
);

export const clearLiveDetection = spacetimedb.reducer(
  { sessionId: t.string() },
  (ctx: ReducerCtx, { sessionId }: { sessionId: string }) => {
    if (ctx.db.liveDetection.sessionId.find(sessionId)) {
      ctx.db.liveDetection.sessionId.delete(sessionId);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// MEETING LIFECYCLE REDUCERS
// ─────────────────────────────────────────────────────────────────────────────

export const startMeeting = spacetimedb.reducer(
  { sessionId: t.string(), personId: t.string() },
  (ctx: ReducerCtx, { sessionId, personId }: { sessionId: string; personId: string }) => {
    let initialCues: string[] = [];
    if (personId !== "") {
      const person = ctx.db.knownPerson.personId.find(personId);
      if (person && person.currentCue !== "") {
        initialCues = [person.currentCue];
      }
    }
    ctx.db.meetingLog.insert({
      sessionId, personId, status: "active",
      cuesJson: JSON.stringify(initialCues), startedAt: nowMs(),
    });
  }
);

export const updateCue = spacetimedb.reducer(
  { personId: t.string(), sessionId: t.string(), newCue: t.string() },
  (ctx: ReducerCtx, { personId, sessionId, newCue }: {
    personId: string; sessionId: string; newCue: string;
  }) => {
    const person = ctx.db.knownPerson.personId.find(personId);
    if (person) {
      ctx.db.knownPerson.personId.update({ ...person, currentCue: newCue });
    }
    const log = ctx.db.meetingLog.sessionId.find(sessionId);
    if (log) {
      const cues: string[] = JSON.parse(log.cuesJson || "[]");
      cues.push(newCue);
      ctx.db.meetingLog.sessionId.update({ ...log, cuesJson: JSON.stringify(cues) });
    }
  }
);

export const endMeeting = spacetimedb.reducer(
  { sessionId: t.string() },
  (ctx: ReducerCtx, { sessionId }: { sessionId: string }) => {
    const log = ctx.db.meetingLog.sessionId.find(sessionId);
    if (!log) throw new Error(`No active meeting for session: ${sessionId}`);
    ctx.db.meetingLog.sessionId.update({ ...log, status: "ended" });
    if (ctx.db.liveDetection.sessionId.find(sessionId)) {
      ctx.db.liveDetection.sessionId.delete(sessionId);
    }
  }
);

export const saveMeetingSummary = spacetimedb.reducer(
  {
    sessionId:   t.string(),
    personId:    t.string(),
    summary:     t.string(),
    meetingDate: t.string(),
  },
  (ctx: ReducerCtx, { sessionId, personId, summary, meetingDate }: {
    sessionId: string; personId: string; summary: string; meetingDate: string;
  }) => {
    ctx.db.meetingSummary.insert({ sessionId, personId, summary, meetingDate, createdAt: nowMs() });
    const person = ctx.db.knownPerson.personId.find(personId);
    if (person) {
      ctx.db.knownPerson.personId.update({ ...person, currentCue: summary });
    }
    if (ctx.db.meetingLog.sessionId.find(sessionId)) {
      ctx.db.meetingLog.sessionId.delete(sessionId);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// MEDICATION REDUCERS
// ─────────────────────────────────────────────────────────────────────────────

export const addMedication = spacetimedb.reducer(
  {
    medicationId: t.string(),
    medicineName: t.string(),
    dose:         t.string(),
    triggerTime:  t.u64(),
  },
  (ctx: ReducerCtx, { medicationId, medicineName, dose, triggerTime }: {
    medicationId: string; medicineName: string; dose: string; triggerTime: bigint;
  }) => {
    assertCaretaker(ctx);
    ctx.db.medication.insert({
      medicationId, medicineName, dose, triggerTime, status: "pending", createdAt: nowMs(),
    });
    ctx.db.medicationSchedule.insert({
      scheduledId:  0n,
      scheduledAt:  triggerTime,
      medicationId,
    });
  }
);

export const triggerMedicationAlert = spacetimedb.reducer(
  { arg: medicationSchedule.rowType },
  (ctx: ReducerCtx, { arg }: { arg: typeof medicationSchedule.rowType }) => {
    const med = ctx.db.medication.medicationId.find(arg.medicationId);
    if (!med || med.status !== "pending") return;
    ctx.db.medication.medicationId.update({ ...med, status: "alerting" });
    ctx.db.notification.insert({
      notificationId: `notif_${shortId()}`,
      type:      "medication_due",
      personId:  "",
      message:   `Medication reminder: ${med.medicineName} ${med.dose}`,
      isRead:    false,
      createdAt: nowMs(),
    });
  }
);

export const markMedicationTaken = spacetimedb.reducer(
  { medicationId: t.string() },
  (ctx: ReducerCtx, { medicationId }: { medicationId: string }) => {
    const med = ctx.db.medication.medicationId.find(medicationId);
    if (!med) return;
    ctx.db.medication.medicationId.update({ ...med, status: "taken" });
  }
);

export const removeMedication = spacetimedb.reducer(
  { medicationId: t.string() },
  (ctx: ReducerCtx, { medicationId }: { medicationId: string }) => {
    assertCaretaker(ctx);
    if (ctx.db.medication.medicationId.find(medicationId)) {
      ctx.db.medication.medicationId.delete(medicationId);
    }
  }
);

// ─────────────────────────────────────────────────────────────────────────────
// SAFE ZONE REDUCERS
// ─────────────────────────────────────────────────────────────────────────────

export const setSafeZone = spacetimedb.reducer(
  { centerLat: t.f64(), centerLng: t.f64(), radiusMeters: t.f64(), label: t.string() },
  (ctx: ReducerCtx, { centerLat, centerLng, radiusMeters, label }: {
    centerLat: number; centerLng: number; radiusMeters: number; label: string;
  }) => {
    assertCaretaker(ctx);
    const row = { zoneId: "default", centerLat, centerLng, radiusMeters, label, updatedAt: nowMs() };
    if (ctx.db.safeZone.zoneId.find("default")) {
      ctx.db.safeZone.zoneId.update(row);
    } else {
      ctx.db.safeZone.insert(row);
    }
  }
);

export const triggerSafeZoneAlert = spacetimedb.reducer(
  { lastLat: t.f64(), lastLng: t.f64() },
  (ctx: ReducerCtx, { lastLat, lastLng }: { lastLat: number; lastLng: number }) => {
    ctx.db.notification.insert({
      notificationId: `notif_${shortId()}`,
      type:      "safe_zone_breach",
      personId:  "",
      message:   `Patient has left the safe zone — last seen at (${lastLat.toFixed(5)}, ${lastLng.toFixed(5)})`,
      isRead:    false,
      createdAt: nowMs(),
    });
  }
);

export const markNotificationRead = spacetimedb.reducer(
  { notificationId: t.string() },
  (ctx: ReducerCtx, { notificationId }: { notificationId: string }) => {
    assertCaretaker(ctx);
    const notif = ctx.db.notification.notificationId.find(notificationId);
    if (!notif) return;
    ctx.db.notification.notificationId.update({ ...notif, isRead: true });
  }
);