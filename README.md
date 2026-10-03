

# NWU SE | Student Platform

> An open-source academic information platform built specifically for 200 Level Software Engineering students at Northwest University, Kano.

🌐 **Live Website:** https://lectures-updates.vercel.app/  
📦 **Repository:** https://github.com/musaibrahimabbadadiy-gif/LECTURES_UPDATES.git

---

## 📖 About the Project

**NWU SE | Student Platform** is a lightweight student-facing web platform created for **200 Level Software Engineering students at Northwest University, Kano**.

The goal is simple:

> Give students one reliable place to check their timetable, courses, venues, and important class announcements.

The project started as a static HTML/CSS/JavaScript frontend and has gradually evolved into a production-connected application using **Supabase** for its database, authentication, Row Level Security, and Edge Functions.

The project is intentionally built without a frontend framework.

### Current Stack

- HTML5
- CSS3
- Vanilla JavaScript
- Supabase
  - PostgreSQL
  - Supabase Auth
  - Row Level Security (RLS)
  - Edge Functions
- Vercel
- Git / GitHub

No React, Vue, Angular, Next.js, or other frontend framework is currently used.

---

# 🎯 Project Goals

The platform is designed around a simple student workflow:

```text
Open the website
      ↓
Check today's / weekly classes
      ↓
See course + time + venue
      ↓
View important announcements
      ↓
Add classes to calendar
````

The project is intentionally focused on the needs of the target student group instead of trying to become a complete university management system.

---

# ✨ Current Features

## Public Student Platform

Students do not need an account.

### Timetable

* Dynamic timetable loaded from Supabase
* Course code
* Course title
* Day
* Start time
* End time
* Venue
* Day filtering
* Mobile-friendly timetable
* Add individual classes to calendar
* Schedule sharing

### Courses

Currently contains six courses:

| Code    | Course                                 | Credit Units |
| ------- | -------------------------------------- | ------------ |
| COS 202 | Computer Programming II                | 3            |
| INS 202 | System Analysis and Design             | 3            |
| IFT 212 | Computer Architecture and Organisation | 3            |
| GST 212 | Philosophy, Logic and Human Existence  | 2            |
| MTH 202 | Elementary Differential Equations      | 3            |
| CYB 204 | Python Programming                     | 3            |

Course information is loaded dynamically from Supabase.

### Announcements

* Dynamic announcements from Supabase
* Categories
* Published / draft state
* Published announcements visible to students
* Draft announcements hidden from public users
* Empty-state handling
* Announcement management through the staff dashboard

### Calendar Integration

The platform can generate `.ics` calendar files for classes.

The calendar functionality is implemented client-side and does not require a separate calendar service.

---

# 🔐 Staff Portal

The public student platform does not require authentication.

There is a separate authenticated portal for authorized staff.

```text
Class Rep Login
      ↓
Authenticated Dashboard
      ↓
Role Verification
      ↓
Class Rep / Administrator
```

## Class Representative

Class Representatives can:

* View dashboard
* Manage timetable entries
* Add timetable entries
* Edit timetable entries
* Delete timetable entries
* Create announcements
* Edit announcements
* Publish/unpublish announcements
* Delete announcements

## Administrator

Administrators have Class Rep capabilities plus:

* User management
* Create Class Rep accounts
* Delete Class Rep accounts
* Change user roles
* Manage courses

---

# 🛡️ Security Architecture

Security is handled through multiple layers.

## Supabase Auth

Only authorized staff members have accounts.

Students do not have accounts in the current architecture.

## Role-Based Access Control

There are currently two staff roles:

```text
admin
class_rep
```

Role information is stored in:

```text
public.profiles
```

## Row Level Security

Supabase RLS protects the database.

### Anonymous users

Can:

* Read courses
* Read timetable
* Read published announcements

Cannot:

* Insert courses
* Update courses
* Delete courses
* Modify timetable
* Modify announcements
* Modify profiles

### Class Representatives

Can:

* Manage timetable
* Manage announcements

Cannot:

* Manage users
* Perform administrator-only operations

### Administrators

Can:

* Manage courses
* Manage timetable
* Manage announcements
* Manage staff accounts

---

# ⚡ Edge Function

User management is handled through the Supabase Edge Function:

```text
manage-users
```

Production endpoint:

```text
https://ukfmgugnvvytppxrvrzx.supabase.co/functions/v1/manage-users
```

The Edge Function exists because Supabase Admin Auth operations require privileged server-side access.

The service-role key is **never exposed to the browser**.

The function performs:

* JWT verification
* Admin role verification
* User listing
* Class Rep creation
* User deletion
* Role changes
* UUID validation
* Self-deletion protection
* Self-demotion protection
* Last-admin protection
* Administrator deletion protection
* Response sanitization
* Strict CORS origin allowlisting

The production frontend origin is explicitly allowlisted.

---

# 🗄️ Database

The main database tables are:

```text
public.courses
public.timetable
public.announcements
public.profiles
```

### courses

Stores course information.

Important fields include:

```text
id
code
title
credit_units
created_at
updated_at
```

### timetable

Stores lecture schedules.

Important fields:

```text
id
course_id
day
start_time
end_time
venue
created_at
updated_at
```

### announcements

Stores student announcements.

Important fields include:

```text
id
title
content
category
is_published
published_at
created_at
updated_at
```

### profiles

Stores staff roles associated with Supabase Auth users.

Roles:

```text
class_rep
admin
```

---

# 🏗️ Project Structure

The project currently follows a simple vanilla web architecture.

```text
LECTURES_UPDATES/
│
├── index.html
├── styles.css
├── app.js
│
├── course.html
├── course.js
│
├── supabase.js
│
├── class-rep-login.html
├── class-rep-login.js
│
├── class-rep-dashboard.html
├── class-rep-dashboard.js
│
├── assets/
│   └── ...
│
└── supabase/
    └── functions/
        └── manage-users/
            └── index.ts
```

---

# 🔄 Data Flow

The public application uses Supabase as the source of truth.

```text
                    SUPABASE
                       │
          ┌────────────┼────────────┐
          │            │            │
       Courses      Timetable   Announcements
          │            │            │
          └────────────┼────────────┘
                       │
                       ▼
                Vanilla JS Frontend
                       │
                       ▼
                 Student Website
```

Staff operations follow a different path:

```text
Staff
  │
  ▼
Login
  │
  ▼
Supabase Auth
  │
  ▼
Profile / Role Check
  │
  ├───────────────┐
  │               │
Class Rep       Admin
  │               │
  ▼               ▼
Dashboard       Dashboard
  │               │
  └───────┬───────┘
          │
          ▼
       Supabase
          │
          ▼
        RLS
```

Administrator user management additionally uses:

```text
Admin Dashboard
       │
       ▼
manage-users Edge Function
       │
       ├── Verify JWT
       ├── Verify admin role
       └── Perform Admin Auth operation
```

---

# 📱 Design Philosophy

The project follows a few important principles.

### 1. Keep it simple

This is a student information platform, not an enterprise ERP.

### 2. Mobile first

Students should be able to use the platform comfortably from a phone.

### 3. No unnecessary framework

The current frontend intentionally uses:

```text
HTML
CSS
Vanilla JavaScript
```

Do not introduce React, Next.js, Vue, or another framework without a strong architectural reason and discussion.

### 4. Supabase is the source of truth

Do not reintroduce hard-coded timetable, course, or announcement data as fallbacks.

If the database is empty, the UI should communicate the empty state.

### 5. Security before convenience

Do not bypass:

* RLS
* authentication
* role checks
* Edge Function authorization

Hiding a button is **not** considered security.

---

# 🧪 Testing & Production Status

The project has gone through a production QA and security audit.

Verified:

* Public website loads
* Timetable loads dynamically
* Six course pages work
* Announcements work
* Calendar generation works
* Class Rep authentication works
* Admin authentication works
* Admin user management works
* Class Rep account creation works
* Newly created Class Rep can log in
* Role-based dashboard access works
* Anonymous database mutations are blocked
* Profiles are protected by RLS
* Service-role credentials are not exposed
* Production Edge Function works
* Production CORS is restricted
* Mobile layouts were reviewed
* Vercel deployment is healthy
* Git working tree is clean

The project reached the end of **Phase 5: Production QA & Security**.

---

# 🛑 Current Development Checkpoint

## Development has currently stopped at Phase 5.

The foundation and production infrastructure are complete.

### Completed

```text
Phase 1
Frontend Foundation
       ↓
Phase 2
Supabase Database
       ↓
Phase 3
Dynamic Public Website
       ↓
Phase 4
Authentication + Staff Portal
       ↓
Phase 5
Production QA + Security
       ↓
       🟢 CURRENT CHECKPOINT
```

The next planned stage is:

```text
Phase 6
Student Experience & Content Enhancement
```

Phase 6 has **not yet been implemented**.

A contributor should therefore treat the current production version as the baseline.

---

# 🚧 Potential Phase 6 Direction

The next phase is expected to focus on improving the student experience rather than rebuilding the backend.

Possible areas include:

* Better "Today's Classes" experience
* Highlighting the next upcoming lecture
* Improved weekly timetable
* Course information improvements
* Better announcement experience
* Search / quick course navigation
* Mobile UX improvements
* Better loading and error states
* Improved Class Rep workflows

These are proposed directions, not completed features.

Before implementing major new features, contributors should review the existing architecture and avoid unnecessarily expanding the project scope.

---

# 🤝 Open Source Contributions

This project is open for developers who want to contribute.

You are welcome to:

* Fix bugs
* Improve accessibility
* Improve responsive design
* Improve performance
* Improve security
* Improve code quality
* Improve documentation
* Add carefully considered student-focused features
* Improve testing
* Review the existing architecture

## Before contributing

Please:

1. Read this README.
2. Understand the current architecture.
3. Check the existing issues / discussions.
4. Avoid changing the stack without discussion.
5. Avoid introducing unnecessary dependencies.
6. Do not remove or weaken RLS policies.
7. Do not expose Supabase service-role credentials.
8. Do not add authentication requirements to the public student experience without discussion.
9. Do not add unrelated university-management features.
10. Test your changes before submitting them.

---

# 🔀 Contribution Workflow

A typical contribution should follow:

```text
Fork / Clone
     ↓
Create a branch
     ↓
Understand existing implementation
     ↓
Make focused changes
     ↓
Test locally
     ↓
Review security implications
     ↓
Commit
     ↓
Push
     ↓
Open Pull Request
```

Recommended branch naming:

```text
feature/feature-name
fix/bug-name
docs/documentation-name
security/security-fix
```

Example:

```text
feature/todays-classes
fix/calendar-timezone
docs/contributing-guide
```

---

# ⚠️ Important Security Rules

Never commit:

```text
SUPABASE_SERVICE_ROLE_KEY
sb_secret_*
private keys
passwords
access tokens
personal credentials
```

The frontend may use the Supabase publishable/anonymous key.

The service-role key must remain server-side.

If you accidentally expose a secret:

1. Stop.
2. Do not push it to GitHub.
3. Rotate/revoke the exposed credential.
4. Remove it from the affected files.
5. Report the incident.

---

# 🌍 Deployment

## Frontend

Production frontend is deployed on Vercel:

[https://lectures-updates.vercel.app/](https://lectures-updates.vercel.app/)

## Backend

Supabase provides:

* PostgreSQL
* Auth
* RLS
* Edge Functions

The `manage-users` Edge Function is deployed to the project's Supabase environment.

---

# 🧑‍💻 Local Development

Clone the repository:

```bash
git clone https://github.com/musaibrahimabbadadiy-gif/LECTURES_UPDATES.git
```

Enter the project:

```bash
cd LECTURES_UPDATES
```

Because this is a vanilla HTML/CSS/JavaScript application, it does not require a frontend framework.

A local development server can be used to serve the project.

For example, VS Code Live Server or another static HTTP server.

Do not open the files using only:

```text
file:///
```

because some browser functionality and Supabase interactions work more reliably through HTTP.

---

# 🔑 Supabase Configuration

The frontend requires the Supabase project URL and publishable/anonymous key.

These values are used by:

```text
supabase.js
```

The publishable/anonymous key is intended for client-side use and is protected by RLS.

Never put the service-role key in:

```text
index.html
app.js
course.js
supabase.js
class-rep-login.js
class-rep-dashboard.js
```

---

# 📌 Contributor Notes

### Do not assume the README's proposed future features already exist.

The current production application is the source of truth.

### Do not blindly rebuild existing functionality.

Before changing something:

```text
Inspect
  ↓
Understand
  ↓
Test
  ↓
Change
  ↓
Test again
```

### Preserve the existing architecture unless there is a clear reason to change it.

This project deliberately uses a lightweight frontend.

---

# 🗺️ Roadmap

## Completed

* [x] Initial student platform UI
* [x] Supabase database
* [x] Dynamic timetable
* [x] Dynamic courses
* [x] Dynamic announcements
* [x] Calendar integration
* [x] Class Rep authentication
* [x] Admin authentication
* [x] Role-based access
* [x] Timetable CRUD
* [x] Announcement CRUD
* [x] Admin user management
* [x] Supabase Edge Function
* [x] RLS security
* [x] Production CORS
* [x] Production deployment
* [x] Production QA/security audit

## Current

* [ ] Phase 6: Student Experience & Content Enhancement

## Future

Future features should be evaluated based on actual student needs and project scope.

---

# 📜 License

This project is intended to be developed as an open-source project.

If you are contributing, please check the repository's `LICENSE` file for the applicable licensing terms.

---

# ❤️ Contributing to NWU SE

The purpose of this project is not simply to build another website.

It is to build a useful, maintainable student platform that can be improved collaboratively by developers and students.

If you find a bug, have an improvement, or want to contribute code, documentation, testing, accessibility improvements, or ideas, contributions are welcome.

**Build it. Improve it. Keep it useful.**

```


