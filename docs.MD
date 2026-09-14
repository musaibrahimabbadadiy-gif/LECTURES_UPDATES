Viewed app.js:1-15
Viewed course.js:1-9
Viewed index.html:24-34

Here is the complete analysis of your existing frontend codebase and how it connects with your Supabase database schema.

> [!IMPORTANT]
> As requested: **No files were modified, no database changes were made, and no code was executed or altered.** This is an inspection report and proposed plan only.

---

### 1. Where Timetable Data is Currently Defined
- **In [app.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/app.js) (Line 1)**: Hardcoded in a constant named `timetable`:
  ```javascript
  const timetable = {
    thursday: [
      { code: "COS 202", title: "Computer Programming II", creditUnits: "3 Credit Units", time: "10:00 AM – 12:00 PM", venue: "FSBMS", slug: "COS202" },
      { code: "INS 202", title: "System Analysis and Design", time: "2:00 PM – 4:00 PM", venue: "BMS", slug: "INS202" }
    ],
    friday: [ ... ],
    saturday: [ ... ]
  };
  ```
- **In [course.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/course.js) (Line 1)**: Embedded inside `courseData` for each course (`day`, `time`, `venue`).
- **In [index.html](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/index.html) (Line 27)**: Hardcoded in the hero "Academic Dashboard" widget (`COS 202` and `INS 202`).

---

### 2. Where the Homepage Reads and Renders the Timetable
In [app.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/app.js):
- **`lectureMarkup(lecture)` (Line 5)**: Formats a single lecture item (`.schedule-item`) including start/end time, course code, title, credit units, venue, link to `course.html?code=${lecture.slug}`, and the calendar button.
- **`renderTimetable(day)` (Line 6)**: Maps over `Object.entries(timetable)` and generates `.day-group` blocks inside `#scheduleList`.
- **Initialization (Line 15)**: Automatically calls `renderTimetable(selectedDay)` on script load.

---

### 3. Where Course Data is Currently Defined
- **In [app.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/app.js) (Line 2)**: Hardcoded in `courses`:
  ```javascript
  const courses = [
    { code: "COS 202", title: "Computer Programming II", units: "3 Credit Units", slug: "COS202" },
    { code: "INS 202", title: "System Analysis and Design", units: "", slug: "INS202" },
    ...
  ];
  ```
- **In [course.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/course.js) (Line 1)**: Hardcoded in `courseData` keyed by code without space (`COS202`, `INS202`, etc.).

---

### 4. Where Course Pages Read and Render Course Data
In [course.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/course.js):
- **URL Parameter Extraction (Line 2)**:
  `const courseKey = new URLSearchParams(window.location.search).get("code") || "COS202";`
- **DOM Injection (Line 3)**:
  Directly assigns values to HTML elements:
  - `$("#courseCode").textContent = course.code;`
  - `$("#courseTitle").textContent = course.title;`
  - `$("#courseUnits").textContent = course.units || "N/A";`
  - `$("#courseDay").textContent = course.day;`
  - `$("#courseTime").textContent = course.time;`
  - `$("#courseVenue").textContent = course.venue;`
  - `$("#scheduleCopy").textContent = ...;`
  - `$("#overviewTitle").textContent = ...;`
- **Course Materials (Line 4)**: Checks `computerCourses.includes(courseKey)` to select an Unsplash stock photo and category.

---

### 5. How "Add to Calendar" Functionality Works
Both [app.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/app.js) (`addToCalendar`) and [course.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/course.js) (`createCalendarFile`):
1. Split the string `time` (e.g. `"10:00 AM – 12:00 PM"`) into `start` and `end`.
2. Convert 12-hour AM/PM times to 24-hour ICS timestamp format (`HHMMSS`).
3. Pair the day with a hardcoded date string (e.g., `20260917`).
4. Generate a standard RFC 5545 `VCALENDAR` string.
5. Create a client-side Blob URL (`URL.createObjectURL`) and trigger an instant `.ics` file download.

---

### 6. Duplication Between `app.js` and `course.js`
**Yes, substantial duplication exists:**
- The list of 6 courses and their titles are declared twice.
- The schedule information (day, time, venue) is declared in `app.js` inside `timetable` and in `course.js` inside `courseData`.
- The `.ics` calendar generation logic and time conversion regex are copy-pasted across both files.

---

### 7. Existing Functions That Will Need to Change
1. **`app.js`**:
   - `renderCourses()`: Must use data fetched from Supabase `public.courses`.
   - `renderTimetable(day)`: Must consume records from `public.timetable` joined with `public.courses`.
   - `getShareContent(type)`: Must reference the fetched timetable state.
   - `addToCalendar(code)`: Must reference the fetched timetable state.
   - Entry point: Synchronous rendering at the bottom of `app.js` will wrap into an `async init()` function that queries Supabase.
2. **`course.js`**:
   - The synchronous lookup `courseData[courseKey]` will change to an async query:
     `db.from('courses').select('*, timetable(*)').eq('code', ...)`
   - `createCalendarFile()`: Uses the dynamically fetched course and timetable record.
   - Entry point: DOM population will run after the Supabase query resolves.

---

### 8. Hard-coded Data Conflicts with Database
1. **Time Format**:
   - Supabase `start_time` and `end_time` are Postgres `time` types (`"10:00:00"`, `"12:00:00"`).
   - The frontend expects `"10:00 AM – 12:00 PM"`.
   - *Solution*: A lightweight formatter (`formatTimeRange(start, end)`) will seamlessly convert the SQL times to the existing display string without altering any UI design.
2. **Day Casing**:
   - `app.js` uses lowercase keys: `"thursday"`, `"friday"`, `"saturday"`.
   - Supabase `timetable.day` has a check constraint requiring capitalized strings: `'Thursday'`, `'Friday'`, etc.
   - *Solution*: Normalize with `.toLowerCase()` when grouping by day.
3. **Calendar Dates**:
   - The `.ics` generator relies on hardcoded calendar dates `{ thursday: "20260917", ... }`.
   - The database only stores recurring days (`Thursday`), not calendar dates.
   - *Solution*: Helper function that resolves the next upcoming date for that day of the week.
4. **Course Slug vs Code**:
   - Database has `code: "COS 202"`. Frontend links use `code=COS202` (slug without space).
   - *Solution*: Cleanly match using `code.replace(/\s+/g, '')`.

---

### 9. Minimum Files to Modify for Supabase Integration
Only **2 files** need code logic changes:
1. **[app.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/app.js)**: Replace hardcoded arrays with async queries to `courses` and `timetable`.
2. **[course.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/course.js)**: Replace `courseData` lookup with an async query for the specific course.

*(Optional)* [supabase.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/supabase.js) already has the initialized `db` client ready to be consumed.
**Zero changes are needed in [styles.css](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/styles.css), [index.html](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/index.html), or [course.html](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/course.html).**

---

### 10. Existing Bugs / Inconsistencies Found
1. **Empty `.day-tabs` container**:
   In `index.html` line 30, `<div class="day-tabs"></div>` is empty, but `app.js` attempts to bind click events to `$$('.day-tab')`. The tabs are never rendered into that div, so day-switching relies solely on navigation anchor links.
2. **Runtime DOM mutation**:
   In `app.js` line 15, `timetableSection.parentNode.insertBefore(coursesSection, timetableSection)` reorders sections dynamically with JavaScript instead of having them in the intended order in HTML.
3. **Credit Units Discrepancy**:
   `COS 202` has `"3 Credit Units"` in `app.js` and `"3"` in `course.js`, while all other courses have `""`. The database stores an `integer` for `credit_units`, so rendering `${credit_units} Credit Units` will make all courses consistent.

---

### Proposed Integration Plan (For Review Only)

1. **Step 1: Data Fetching Helpers**
   - In `app.js` and `course.js`, utilize the globally available `db` instance from [supabase.js](file:///c:/Users/Py-Craft/Desktop/Alameen/timetable_website/supabase.js).
   - Helper function `fetchTimetableData()`:
     ```javascript
     const { data, error } = await db
       .from('timetable')
       .select('*, courses(*)');
     ```
   - Helper function `fetchCourseDetails(slug)`:
     ```javascript
     const { data, error } = await db
       .from('courses')
       .select('*, timetable(*)')
     ```

2. **Step 2: Compatibility Adapters**
   - Add small pure utility functions (e.g. `formatTime(sqlTime)`, `generateSlug(code)`) so Supabase data fields map 1:1 into the existing UI markup functions (`lectureMarkup`, `renderCourses`) with zero changes to HTML structure or styling.

3. **Step 3: Graceful Fallback**
   - If Supabase is unreachable or the publishable key is not yet pasted, keep the existing hardcoded data as a fallback so the website never breaks or appears blank.

4. **Step 4: Connect Announcements (Optional future phase)**
   - Wire `renderUpdates()` to `public.announcements`.

*Whenever you are ready to proceed with the implementation, let me know!*