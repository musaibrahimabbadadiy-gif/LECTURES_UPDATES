const courseKey = new URLSearchParams(window.location.search).get("code") || "COS202";
const $ = selector => document.querySelector(selector);
const courseUrl = window.location.href;

let currentCourse = null;
let currentTimetable = null;
let shareText = "";

function formatSqlTime(timeStr) {
  if (!timeStr) return "";
  const parts = timeStr.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function formatTimeRange(start, end) {
  if (!start || !end) return "TBA";
  return `${formatSqlTime(start)} – ${formatSqlTime(end)}`;
}

function getNextWeekdayDate(dayName) {
  const days = { sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6 };
  const targetDay = days[(dayName || "").toLowerCase()];
  const now = new Date();
  if (targetDay === undefined) return now.toISOString().slice(0, 10).replace(/-/g, "");
  let diff = (targetDay - now.getDay() + 7) % 7;
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diff);
  const y = targetDate.getFullYear();
  const m = String(targetDate.getMonth() + 1).padStart(2, "0");
  const d = String(targetDate.getDate()).padStart(2, "0");
  return `${y}${m}${d}`;
}

function toast(message) {
  const toastEl = $("#toast");
  if (!toastEl) return;
  $("#toastMessage").textContent = message;
  toastEl.classList.add("show");
  setTimeout(() => toastEl.classList.remove("show"), 2600);
}

function share(network) {
  const text = encodeURIComponent(shareText);
  const url = encodeURIComponent(courseUrl);
  const links = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`
  };
  if (network === "copy") return navigator.clipboard.writeText(courseUrl).then(() => toast("Course link copied."));
  if (network === "more" && navigator.share) return navigator.share({ title: currentCourse ? currentCourse.title : "Course Details", text: shareText, url: courseUrl });
  if (network === "more") return navigator.clipboard.writeText(courseUrl).then(() => toast("Course link copied."));
  window.open(links[network], "share-window", "width=640,height=520,noopener");
}

function createCalendarFile() {
  if (!currentCourse) return;
  const day = currentTimetable ? currentTimetable.day : "Monday";
  const time = currentTimetable ? formatTimeRange(currentTimetable.start_time, currentTimetable.end_time) : "10:00 AM – 12:00 PM";
  const venue = currentTimetable ? currentTimetable.venue : "FSBMS";
  const [start, end] = time.split(" – ");
  const eventDate = getNextWeekdayDate(day);

  const toIcsTime = value => {
    const match = (value || "").match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "000000";
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hour += 12;
    return `${String(hour).padStart(2, "0")}${match[2]}00`;
  };

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "BEGIN:VEVENT",
    `SUMMARY:${currentCourse.code} — ${currentCourse.title}`,
    `LOCATION:${venue}`,
    "DESCRIPTION:NWU Software Engineering lecture",
    `DTSTART:${eventDate}T${toIcsTime(start)}`,
    `DTEND:${eventDate}T${toIcsTime(end)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  link.download = `${currentCourse.code.replace(/\s+/g, "")}-lecture.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
  toast("Calendar event downloaded.");
}

async function loadCoursePage() {
  const normalizedKey = (courseKey || "COS202").replace(/\s+/g, "").toUpperCase();

  // Set initial loading state in overview and header
  $("#courseCode").textContent = "Loading...";
  $("#courseTitle").textContent = "Fetching course details...";
  $("#overviewTitle").textContent = "Connecting to database...";
  $("#scheduleCopy").textContent = "Loading schedule...";

  try {
    if (typeof db === "undefined" || !db) {
      throw new Error("Supabase client is not initialized.");
    }

    const { data: courses, error } = await db
      .from("courses")
      .select(`
        id,
        code,
        title,
        credit_units,
        timetable (
          id,
          day,
          start_time,
          end_time,
          venue
        )
      `);

    if (error) throw error;
    if (!courses || courses.length === 0) {
      throw new Error("No courses found in database.");
    }

    // Match code by removing spaces (e.g. "COS 202" -> "COS202")
    let matched = courses.find(c => c.code && c.code.replace(/\s+/g, "").toUpperCase() === normalizedKey);
    if (!matched) {
      matched = courses[0];
    }

    currentCourse = matched;
    currentTimetable = (matched.timetable && matched.timetable.length > 0) ? matched.timetable[0] : null;

    const day = currentTimetable ? currentTimetable.day : "TBA";
    const time = currentTimetable ? formatTimeRange(currentTimetable.start_time, currentTimetable.end_time) : "TBA";
    const venue = currentTimetable ? currentTimetable.venue : "TBA";
    const units = currentCourse.credit_units ? String(currentCourse.credit_units) : "N/A";

    $("#courseCode").textContent = currentCourse.code;
    $("#courseTitle").textContent = currentCourse.title;
    $("#courseUnits").textContent = units;
    $("#courseDay").textContent = day;
    $("#courseTime").textContent = time;
    $("#courseVenue").textContent = venue;
    $("#scheduleCopy").textContent = `${day} · ${time} · ${venue}`;
    $("#overviewTitle").textContent = `Keep ${currentCourse.title} clear, focused, and easy to follow.`;

    shareText = `${currentCourse.code} — ${currentCourse.title}\n${day}, ${time}\n📍 ${venue}\n\nView course details:`;

    // Dynamic material image & description
    const computerCodes = ["COS202", "CYB204", "IFT212"];
    const isComputer = computerCodes.includes(currentCourse.code.replace(/\s+/g, "").toUpperCase());
    const materialImage = isComputer
      ? "https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&w=900&q=80"
      : "https://images.unsplash.com/photo-1544947950-fa07a98d237f?auto=format&fit=crop&w=900&q=80";

    const materialGrid = $("#materialGrid");
    if (materialGrid) {
      materialGrid.innerHTML = `
        <article class="material-card">
          <img src="${materialImage}" alt="${isComputer ? "Laptop for computer course materials" : "Book for course materials"}">
          <div>
            <span class="micro-label">CORE MATERIAL</span>
            <h4>${isComputer ? "Programming workspace" : "Reading guide"}</h4>
            <p>Course material curated for ${currentCourse.title}.</p>
            <button class="quiet-button" type="button" onclick="document.getElementById('shareContext').textContent='Course material link copied.'">
              <i class="fa-regular fa-file-lines"></i> Open material
            </button>
          </div>
        </article>
        <article class="material-card material-card-secondary">
          <div class="material-placeholder"><i class="fa-solid fa-book-open"></i></div>
          <div>
            <span class="micro-label">REFERENCE</span>
            <h4>Study notes</h4>
            <p>Keep your revision resources close throughout the semester.</p>
          </div>
        </article>`;
    }

  } catch (err) {
    console.error("Failed to load course details from Supabase:", err);
    $("#courseCode").textContent = "Error";
    $("#courseTitle").textContent = "Unable to load course details";
    $("#overviewTitle").textContent = "A database connection error occurred.";
    $("#scheduleCopy").innerHTML = `
      <span style="color: var(--muted); margin-right: 12px;">Could not retrieve schedule.</span>
      <button class="accent-button compact" id="retryCourseBtn" style="cursor: pointer; margin-top: 10px;">
        <i class="fa-solid fa-rotate-right"></i> Retry
      </button>`;
    $("#retryCourseBtn")?.addEventListener("click", loadCoursePage);
  }
}

// Tab navigation
document.querySelectorAll(".course-tabs button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".course-tabs button").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".course-panel").forEach(panel => panel.classList.remove("active"));
    button.classList.add("active");
    $("#" + button.dataset.tab)?.classList.add("active");
  });
});

// Share and calendar setup
$("#courseShare")?.addEventListener("click", () => {
  if (currentCourse) {
    $("#shareContext").textContent = `Sharing ${currentCourse.code} — ${currentCourse.title}.`;
  }
  $("#shareModal").classList.add("show");
});

$("#closeShare")?.addEventListener("click", () => $("#shareModal").classList.remove("show"));

document.querySelectorAll(".share-options button").forEach(button => {
  button.addEventListener("click", () => share(button.dataset.share));
});

$("#shareModal")?.addEventListener("click", event => {
  if (event.target === $("#shareModal")) $("#shareModal").classList.remove("show");
});

document.querySelector("#addCourseCalendar")?.addEventListener("click", createCalendarFile);

// Initial fetch
loadCoursePage();