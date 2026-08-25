# V-English — Production Operations Runbook

## 1. Architecture Overview
- **Frontend**: Vite SPA + Tailwind CSS + Spaced Repetition (SM-2) Client Engine + Offline Outbox Queue (`syncEngine.js`).
- **Backend**: Node.js / Express REST API (`server/`) with JWT access tokens in memory and HttpOnly refresh token rotation.
- **Database**: MongoDB with scoped schemas (`User`, `UserSession`, `UserCardProgress`, `Topic`, `StudySet`).

---

## 2. Health Check & Observability
- **Liveness probe**: `GET /health` (Response: `{ status: "OK" }`).
- **Safe Logging Invariants**:
  - `logger.js` automatically redacts: `password`, `token`, `jwt`, `authorization`, `cookie`, `secret`, `apiKey`.
  - Production error boundaries never expose internal stack traces or backend connection strings to the end user.

---

## 3. Routine Operations & Maintenance

### 3.1 Database Backup & Export
- Automated backup via MongoDB Atlas Daily Snapshots or `mongodump`:
  ```bash
  mongodump --uri="mongodb+srv://..." --out=/backups/$(date +%Y%m%d)
  ```
- Client-side data recovery:
  - Users can export learning progress anytime via **Data Management** -> **Xuất file sao lưu (JSON)**.
  - JSON imports are protected by recursive Prototype Pollution defenses and strict payload bounding.

### 3.2 Token Lifecycle & Session Rotation
- Access tokens expire every 15 minutes (`JWT_EXPIRES_IN=15m`).
- Refresh tokens expire every 7 days (`REFRESH_TOKEN_EXPIRES_IN=7d`) and are single-use rotated.
- In case of session anomaly or device compromise:
  - User can execute **Đăng xuất tất cả thiết bị (Logout All Devices)** to invalidate all active session records in `UserSession`.

---

## 4. Incident Response & Troubleshooting

### Scenario A: API Returns 401 Unauthorized Loop
1. Verify `VITE_API_URL` matches the backend domain exactly.
2. Ensure HTTPS is enabled and `credentials: true` is allowed in CORS.
3. Check browser cookie settings (Third-party cookie blocking if frontend and backend are on different subdomains).

### Scenario B: Offline Outbox Does Not Flush
1. Check network connectivity indicator in `SyncStatus.jsx`.
2. Inspect browser IndexedDB / LocalStorage quota.
3. If necessary, user can click **Đồng bộ ngay** in Data Management screen to trigger manual flush.

### Scenario C: High Memory / Performance Degradation
1. Confirm the NLP chunk (`nlp-*.js`) is loaded asynchronously and not blocking critical render.
2. Check reading progress bar listeners use native `requestAnimationFrame` without triggering React state updates.
