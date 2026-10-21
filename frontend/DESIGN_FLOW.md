# CampusCare - Institution Complaint Management App (Frontend Design Flow)

## 📌 Overview
**CampusCare** is a modern, clean, and professional Institution Complaint Management application. It provides a dual-interface platform:
1. **Student App**: Empowers students to file complaints, track real-time resolution status via an interactive stepper, view announcements, and communicate with staff.
2. **Admin Panel**: Gives institution administrators and department heads full visibility over ticket queues, staff assignment, SLA tracking, department efficiency, and analytics.

---

## 📁 Simple Folder Structure (`frontend/src/`)

```
frontend/src/
├── API/
│   └── mockApi.js               # Central mock dataset & API service state
├── Components/
│   ├── Navbar.jsx               # Header with search, notification alert, & Student/Admin role switcher
│   ├── Sidebar.jsx              # Responsive navigation sidebar (Student vs Admin links)
│   ├── MobileNav.jsx            # Bottom navigation bar for mobile viewports
│   ├── StatCard.jsx             # Clean metrics card (Total, Pending, In Progress, Resolved, Overdue)
│   ├── StatusBadge.jsx          # Color-coded badge for 6 complaint statuses & 4 priorities
│   ├── StatusTimeline.jsx       # Visual status progress stepper (Submitted → Closed)
│   └── Modal.jsx                # Dialog overlay for quick actions (Assign staff, update status)
├── Screens/
│   ├── User/                    # Student App Screens
│   │   ├── Login.jsx            # Login page with student/admin demo quick login
│   │   ├── Register.jsx         # Student registration page
│   │   ├── Dashboard.jsx        # Student stats, quick CTA, active complaint overview, announcement
│   │   ├── SubmitComplaint.jsx  # Form: Title, Category, Department, Location, Description, Priority, Attachments, Anonymous option
│   │   ├── MyComplaints.jsx     # Filterable list of student complaints with status tabs
│   │   ├── ComplaintDetails.jsx # Complaint view with Status Timeline & interaction log
│   │   ├── Notifications.jsx    # Student alerts & notification list
│   │   └── Profile.jsx          # Student account details & preferences
│   └── Admin/                   # Admin Panel Screens
│       ├── Dashboard.jsx        # Admin metrics, triage queue, charts (Status distribution, Category breakdown)
│       ├── AllComplaints.jsx    # Full data table with filters (Category, Status, Priority, Search)
│       ├── ComplaintDetails.jsx # Admin management view: respond, change status, escalate
│       ├── AssignComplaint.jsx  # Assign complaint to specific staff / department
│       ├── Departments.jsx      # Overview of 10 campus departments & workload
│       ├── StaffManagement.jsx  # Staff roster, active task loads, & status badges
│       ├── ReportsAnalytics.jsx # Resolution rates, SLA performance, category distribution
│       ├── Notifications.jsx    # Admin alerts (Overdue complaints, urgent tickets)
│       └── Settings.jsx         # SLA rules & system configuration
├── App.jsx                      # Router setup, layout wrapper, & state provider
├── index.css                    # Tailwind CSS v4 styling rules (`@import "tailwindcss";`)
└── main.jsx                     # Vite mount point
```

---

## 🔄 Complaint Status Lifecycle
Complaints move sequentially through 6 standardized stages:
1. **Submitted** (`indigo`): Complaint filed by student, pending initial triage.
2. **Under Review** (`amber`): Admin / Department Head is reviewing details.
3. **Assigned** (`purple`): Ticket assigned to a specific technician/staff member.
4. **In Progress** (`sky`): Active work underway to resolve the issue.
5. **Resolved** (`emerald`): Work completed by staff; waiting confirmation.
6. **Closed** (`slate`): Student verified satisfaction or auto-closed.

---

## 📋 Categorization & Form Fields

### Categories (10 Total):
- **Academic**: Exam issues, marks queries, lecture hall allocation, course materials.
- **Hostel**: Water supply, room maintenance, electrical fixtures, mess queries.
- **Infrastructure**: Building damage, broken furniture, elevator maintenance, pathways.
- **Library**: Book availability, digital access, quiet zone disturbances, fine disputes.
- **IT**: Campus Wi-Fi, student portal login, lab computer maintenance, printer issues.
- **Transport**: Bus routes, shuttle timings, driver feedback, vehicle condition.
- **Canteen**: Food quality, hygiene standards, pricing complaints, seating space.
- **Cleanliness**: Restroom sanitation, trash disposal, corridor cleaning, pest control.
- **Security**: ID verification, lost & found, gate timings, campus safety.
- **Other**: Miscellaneous institutional feedback.

### Complaint Form Input Fields:
1. **Title**: Short summary of the issue.
2. **Category**: Dropdown (10 predefined categories).
3. **Department**: Auto-suggested or selectable department (e.g. Electrical Dept, IT Cell, Hostel Maintenance).
4. **Location**: Specific building, floor, room number, or block.
5. **Description**: Detailed explanation of the complaint.
6. **Priority**: Low, Medium, High, Urgent.
7. **Attachments**: File/Image upload dropzone with preview.
8. **Anonymous Option**: Toggle switch to hide student name & email from public view.

---

## 🖥️ Screen-by-Screen Functionality Specification

### 🟢 Student App (`Screens/User/`)

1. **Login (`Screens/User/Login.jsx`)**:
   - Clean SaaS card design with Roll No / Student ID and Password.
   - Quick Demo Login buttons: "Login as Student" & "Login as Admin".

2. **Register (`Screens/User/Register.jsx`)**:
   - Fields: Full Name, Student ID, Email, Department, Hostel Block, Password.

3. **Dashboard (`Screens/User/Dashboard.jsx`)**:
   - Welcome banner with "Submit New Complaint" button.
   - Stat widgets: Total Complaints, Active, Resolved, Avg Resolution Time.
   - Active Complaint Banner with live status tracker stepper.
   - Campus Announcements carousel.

4. **Submit Complaint (`Screens/User/SubmitComplaint.jsx`)**:
   - Interactive form with all fields (Title, Category, Department, Location, Description, Priority, Attachment dropzone, Anonymous switch).
   - Instant ticket generation modal (`#CC-2026-8942`).

5. **My Complaints (`Screens/User/MyComplaints.jsx`)**:
   - Search bar & Status tabs (`All`, `Submitted`, `Under Review`, `In Progress`, `Resolved`, `Closed`).
   - Cards displaying Ticket ID, Category tag, Priority badge, Date, and current Status.

6. **Complaint Details (`Screens/User/ComplaintDetails.jsx`)**:
   - Detailed complaint metadata card.
   - **Status Stepper Timeline**: Visual step progress indicator with time logs.
   - Interactive Comment & Response thread with assigned department staff.
   - "Mark as Satisfied" CTA button when resolved.

7. **Notifications (`Screens/User/Notifications.jsx`)**:
   - Alert items for status updates, admin replies, and campus announcements.

8. **Profile (`Screens/User/Profile.jsx`)**:
   - Profile card displaying student details, department, contact, and notification settings.

---

### 🔵 Admin Panel (`Screens/Admin/`)

1. **Dashboard (`Screens/Admin/Dashboard.jsx`)**:
   - Key Metric Cards: Total, Pending, In Progress, Resolved, Overdue (>48h).
   - Priority Triage Queue for urgent tickets.
   - Visual Charts: Complaint volume by Category and Status breakdown.

2. **All Complaints (`Screens/Admin/AllComplaints.jsx`)**:
   - High-density data table with multi-criteria filtering (Category, Department, Status, Priority, Search).
   - Quick action menu: Change Status, Assign Staff, View Details.

3. **Complaint Details (`Screens/Admin/ComplaintDetails.jsx`)**:
   - Complete audit view showing student info (or Anonymous tag).
   - Status transition dropdown (`Submitted` → `Under Review` → `Assigned` → `In Progress` → `Resolved` → `Closed`).
   - Staff assignment widget.
   - Dual message thread: Public student reply vs Internal admin notes.

4. **Assign Complaint (`Screens/Admin/AssignComplaint.jsx`)**:
   - Dedicated screen / modal mapping unassigned complaints to specific department staff based on workload counters.

5. **Departments (`Screens/Admin/Departments.jsx`)**:
   - Overview of 10 campus departments showing active ticket load, assigned staff count, and resolution score.

6. **Staff Management (`Screens/Admin/StaffManagement.jsx`)**:
   - Roster of staff members & technicians, active task count, availability badge, and Add Staff modal.

7. **Reports & Analytics (`Screens/Admin/ReportsAnalytics.jsx`)**:
   - High-level charts for SLA performance, department resolution speed comparisons, category distribution heatmaps.

8. **Notifications (`Screens/Admin/Notifications.jsx`)**:
   - Admin alert center for overdue complaints, urgent security issues, and staff updates.

9. **Settings (`Screens/Admin/Settings.jsx`)**:
   - Configurable SLA thresholds (Low: 72h, Medium: 48h, High: 24h, Urgent: 12h) and notice banner manager.

---

## 🎨 Design & Layout Strategy
- **Styling**: Modern SaaS Light Theme using Tailwind CSS v4.
- **Palette**: Clean slate background (`#f8fafc`), crisp white cards with soft borders (`border-slate-200`), rounded corners (`rounded-xl`), ambient shadows (`shadow-sm`).
- **Accent Colors**: Slate & Indigo for Student view; Deep Navy & Indigo for Admin view.
- **Header Role Switcher**: Navbar contains a quick toggle between Student View and Admin Panel for smooth demo navigation.
