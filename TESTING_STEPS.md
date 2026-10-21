# CampusCollab - Testing Guide for Updated Features & 5-Phase Flow

This guide walks you step-by-step through testing all the newly implemented features, security fixes, and the structured **5-Phase Collaboration Flow**.

---

## 🚀 Pre-requisites: Starting the Servers

### 1. Start the Backend Server
In your backend terminal:
```bash
cd backend
npm run dev
```
*(Ensure MongoDB is running or your MongoDB Atlas URI in `.env` is reachable).*

### 2. Start the Frontend Dev Server
In your frontend terminal:
```bash
cd frontend
npm run dev
```
Open your browser at `http://localhost:5173`.

---

## 🧪 Test Case 1: Admin Candidate Isolation & Self-Protection

**Goal:** Verify that the admin account does not appear in candidate searches or student lists and cannot delete itself.

1. **Log in as Administrator:**
   - Go to `/login` and sign in with your admin credentials.
2. **Check Candidate Oversight:**
   - Navigate to `/admin/candidates` (or click *Manage Candidates* from the Admin Dashboard).
   - **Verification:**
     - The logged-in administrator is **NOT** listed in the candidates table.
     - Total student count excludes administrative accounts.
     - Any admin account shown in the system displays a gold **Protected** badge instead of a Delete button.
3. **Admin Direct Request Protection:**
   - Log out, sign in as a student, and attempt to send a collaboration request to the admin email.
   - **Verification:** The system blocks requests with: *"Cannot send collaboration requests to administrators."*

---

## 🧪 Test Case 2: Phase 1 & 2 — Discovery & Direct Inquiry

**Goal:** Verify that students can search candidates with filters and send direct inquiries with a specific target role without generating unwanted teams.

1. **Sign in as Student A** (e.g., Jane Doe).
2. **Phase 1: Discover & Filter:**
   - Navigate to **Find Peers** (`/search`).
   - Filter by skill (e.g. `React`, `Python`) or department.
   - Click **View Profile & Repos** to inspect GitHub activity, rating score, and repositories.
3. **Phase 2: Inquire First:**
   - Click **Request Collaboration** (or *Send Request*).
   - Fill in:
     - **Discussion Message / Note:** *"Hi, we are building an IoT app and need an embedded C++ dev."*
     - **Target Role / Discussion Topic:** *"Embedded C++ Developer"*.
     - *(Optional)* Attach a project link or file URL.
   - Click **Send Collaboration Request**.
4. **Verification:**
   - Check the **Sent Requests** tab in `/requests`.
   - The request displays a gold badge: `Direct Peer Inquiry Sent` with `Role: Embedded C++ Developer`.
   - **No fake or dummy team has been created** in `/teams`.

---

## 🧪 Test Case 3: Phase 3 — Scheduled Sync (Video Call) & Live Countdown

**Goal:** Test scheduling a video meeting with Date, Time, Duration, and Timezone, and verify live countdowns and Google Calendar integration.

1. **Sign in as Student B** (the recipient of the inquiry).
2. **Review Incoming Request:**
   - Go to `/requests` and open the **Incoming Requests** tab.
   - Notice the card displays the message, role badge (`Role: Embedded C++ Developer`), and a **Phase 3: Schedule Video Sync & Review Before Deciding** banner.
3. **Schedule the Meeting:**
   - Click **Schedule Video Sync** (or *Call Settings / Reschedule*).
   - In the modal:
     - **Scheduled Date:** Choose tomorrow's date.
     - **Start Time:** e.g., `16:00` (4:00 PM).
     - **Duration:** Choose `20 minutes` or `30 minutes`.
     - **Timezone:** `IST (UTC+5:30)`.
     - Review the auto-generated WebRTC room URL (or enter a custom Jitsi / Meet URL).
     - Click **Send Video Conference Invite Email**.
4. **Verification:**
   - **Live Countdown Badge:**
     - Both Student A and Student B see an updated sync banner showing:
       - 📅 Date and Time: e.g. `Tomorrow at 16:00 (30 mins • IST)`.
       - Countdown: `Starts in 1 day` or `Starts in X hours`.
       - *(If set to the current time, it turns green with an active pulse: `🟢 Meeting is LIVE NOW!`)*.
   - **Google Calendar 1-Click Link:**
     - Click **Add to Calendar**. A new tab opens directly to Google Calendar pre-filled with the title, video call URL, and correct start/end times.
   - **Join Call:**
     - Click **Join Video Room** to confirm it opens the video conference room.
   - **Dashboard Meeting Card:**
     - Go to `/` (Home Dashboard). Under **Upcoming Collaboration Sessions**, verify the scheduled sync card appears with the live countdown and direct action buttons.

---

## 🧪 Test Case 4: Phase 4 — Explicit Team Formation & Role Assignment

**Goal:** Confirm that teams are created explicitly by team leads and that invitations/applications carry explicit roles without peer connections auto-generating teams.

### Part A: Team Lead Creates Team & Invites with a Specific Role
1. **Sign in as Team Lead** (e.g., Student A).
2. Go to `/teams` and click **+ Create New Team**.
   - **Project Name:** `EcoTrack IoT`
   - **Tech Stack:** `React, C++, Node.js, ESP32`
   - **Open Roles Needed:** `UI Designer, Embedded C++ Dev, Cloud Engineer`
   - Click **Create Team**.
3. **Invite a Specific Peer with a Role:**
   - On the `EcoTrack IoT` card, click **+ Add Member**.
   - Search for Student B and select them.
   - In **Specific Role to Assign in Team**, enter: `Embedded C++ Dev`.
   - Click **Send Team Invitation Email**.
4. **Recipient Accepts Team Invite:**
   - Sign in as Student B and go to `/requests`.
   - The card clearly states: `👥 Team Invitation to join: EcoTrack IoT` with `Role: Embedded C++ Dev`.
   - Click **Accept & Join Team**.
   - Navigate to `/teams`. Student B is now listed under `EcoTrack IoT` members with their assigned role.

---

### Part B: Student Applies to Join an Existing Team
1. **Sign in as Student C**.
2. Go to `/teams` and browse all project teams.
3. Find `EcoTrack IoT` and click **Apply to Join**.
4. Notice the available open role suggestion chips: `[+ UI Designer]`, `[+ Cloud Engineer]`.
5. Click a chip or type in: `UI Designer`.
6. Write a brief application message and click **Send Join Request**.
7. The Team Lead receives a request marked `🙋 Request to Join Team: EcoTrack IoT` with `Role: UI Designer`.

---

## 🧪 Test Case 5: Phase 5 — User-Controlled Availability (`openToWork`)

**Goal:** Ensure a student's availability is never auto-disabled when accepting requests, and verify the manual toggle.

1. **Accepting Requests Does NOT Mutate Availability:**
   - As Student B, accept any pending peer collaboration or team invite.
   - Verify that your profile availability status remains unchanged.
2. **Profile Availability Toggle:**
   - Go to **My Profile** (`/profile`).
   - Look at the **Availability & Work Status** card:
     - Check the toggle: **`[✓] Available for new projects / teams`**.
     - Toggle it off: the badge switches to `Busy / Focused on Current Projects`.
     - Toggle it on: the badge switches to `🟢 Open to Work (Visible in Peer Discovery)`.
   - Click **Save Changes**.
   - Refresh the page to confirm the setting persists.
   - Check `/search` to verify that when toggled ON, the candidate appears with `Available`, and when toggled OFF, they are filtered out from open-to-work searches.

---

## 📋 Checklist Summary

| Feature | Expected Result | Status |
|---|---|---|
| **Admin Protection** | Admin excluded from `/admin/candidates` list; cannot delete self; blocked from peer requests | Verified ✅ |
| **Phase 1: Discovery** | Search with skill filters & GitHub ranking | Verified ✅ |
| **Phase 2: Direct Inquiry** | Custom inquiry with target role; does not create fake teams | Verified ✅ |
| **Phase 3: Scheduled Sync** | Date, Time, Duration, Timezone; WebRTC room link | Verified ✅ |
| **Phase 3: Calendar Sync** | 1-click Google Calendar URL pre-filled with room link | Verified ✅ |
| **Phase 3: Live Countdown** | Countdown displayed on `/requests` and `/` dashboard | Verified ✅ |
| **Phase 4: Explicit Teams** | Open roles declared upon creation; explicit invitations & applications | Verified ✅ |
| **Phase 5: User Availability** | Decoupled from request acceptance; clean toggle in `/profile` | Verified ✅ |
