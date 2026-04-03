# API Contracts

This document is the agreement between all three devs.
If you change a contract, update this file and tell the team.

---

## Contract 1 - Frame to ML service

Sender: Dev 3 (Frontend)
Receiver: Dev 1 (ML service)
Frequency: Every 500ms during an active call

POST http://localhost:8000/detect

Request:
{
  "frame": "<base64 JPEG string>",
  "session_id": "patient_1",
  "frame_width": 640,
  "frame_height": 480
}

Response - known face:
{
  "matched": true,
  "is_new": false,
  "person_id": "person_101",
  "confidence": 0.91,
  "box": { "x": 150, "y": 80, "w": 120, "h": 140 }
}

Response - new unknown face:
{
  "matched": true,
  "is_new": true,
  "person_id": "a3f8c201",
  "confidence": 1.0,
  "box": { "x": 155, "y": 85, "w": 115, "h": 135 }
}

Response - no face:
{
  "matched": false
}

---

## Contract 2 - Face registration

POST http://localhost:8000/register

Request:
{
  "person_id": "person_101",
  "name": "Rahul",
  "relationship": "Son",
  "photo": "<base64 JPEG string>"
}

Response:
{
  "status": "registered",
  "person_id": "person_101"
}

---

## Contract 3 - SpacetimeDB reducers

Called via SpacetimeDB SDK over WebSocket.

Reducer              | Called by      | Arguments
---------------------|----------------|------------------------------------------
addKnownPerson       | Dev 3          | (id, name, relationship)
createNewFace        | Dev 1 bridge   | (person_id)
updatePersonDetails  | Dev 3          | (person_id, name, relationship)
updateLiveDetection  | Dev 1 bridge   | (session_id, person_id, x, y, w, h, confidence)
clearLiveDetection   | Dev 3          | (session_id)
updateCue            | Dev 1 bridge   | (person_id, session_id, new_cue)
startMeeting         | Dev 3          | (session_id, person_id)
endMeeting           | Dev 3          | (session_id)
saveMeetingSummary   | Dev 1 bridge   | (session_id, person_id, summary, meeting_date)
addMedication        | Dev 3          | (id, name, dose_description, trigger_at)
markMedicationTaken  | Dev 3          | (med_id)

---

## Box coordinate convention

ML processes all frames at 640x480.
All box coordinates are pixels in that frame.
Dev 3 scales to actual video size:

  scaleX = renderedVideoWidth / 640
  scaleY = renderedVideoHeight / 480
  screenX = box.x * scaleX
  screenY = box.y * scaleY
