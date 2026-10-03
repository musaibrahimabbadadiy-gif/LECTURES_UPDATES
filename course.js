const fallbackCourseData = {
  COS202: { code: "COS 202", title: "Computer Programming II", units: "", day: "Thursday", times: ["10:00 AM – 12:00 PM"], venue: "7th Floor, City Campus (Venue to be decided)" },
  INS204: { code: "INS 204", title: "System Analysis and Design", units: "", day: "Thursday", times: ["12:00 PM – 2:00 PM"], venue: "7th Floor, City Campus (Venue to be decided)" },
  GST212: { code: "GST 212", title: "Philosophy, Logic and Human Existence", units: "", day: "Friday", times: ["8:00 AM – 10:00 AM"], venue: "Science Theatre B, Main Campus" },
  IFT212: { code: "IFT 212", title: "Computer Architecture and Organisation", units: "", day: "Thursday", times: ["2:00 PM – 4:00 PM"], venue: "7th Floor, City Campus (Venue to be decided)" },
  CYB204: { code: "CYB 204", title: "Python Programming", units: "", day: "Thursday", times: ["4:00 PM – 6:00 PM"], venue: "7th Floor, City Campus (Venue to be decided)" },
  MTH202: { code: "MTH 202", title: "Elementary Differential Equations", units: "", day: "Tuesday", times: ["9:00 AM – 11:00 AM", "12:00 PM – 2:00 PM"], venue: "Indabawa Room 3, Main Campus" }
};

const courseKey = new URLSearchParams(window.location.search).get("code") || "COS202";
const $ = selector => document.querySelector(selector);
const courseUrl = window.location.href;

let currentCourse = null;
let currentTimetable = null;
let currentTimetableEntries = [];
let shareText = "";

function normalizeCourseKey(value) {
  return (value || "COS202").replace(/\s+/g, "").toUpperCase();
}

function getFallbackCourseRecord(key) {
  const normalized = normalizeCourseKey(key);
  for (const course of Object.values(fallbackCourseData)) {
    if (normalizeCourseKey(course.code) === normalized) {
      return course;
    }
  }
  return fallbackCourseData.COS202;
}

function normalizeTimetableRecords(value) {
  const records = Array.isArray(value) ? value : (value ? [value] : []);
  return records
    .filter(record => record && typeof record === "object")
    .map(record => ({
      day: record.day || "TBA",
      start_time: record.start_time || null,
      end_time: record.end_time || null,
      venue: record.venue || "TBA"
    }));
}

function sortTimetableRecords(records) {
  const dayIndex = { monday: 0, tuesday: 1, wednesday: 2, thursday: 3, friday: 4, saturday: 5, sunday: 6 };
  return [...records].sort((a, b) => {
    const dayA = dayIndex[(a.day || "").toLowerCase()] ?? 99;
    const dayB = dayIndex[(b.day || "").toLowerCase()] ?? 99;
    if (dayA !== dayB) return dayA - dayB;
    return String(a.start_time || "").localeCompare(String(b.start_time || ""));
  });
}

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
  const formattedStart = formatSqlTime(start);
  const formattedEnd = formatSqlTime(end);
  if (!formattedStart || !formattedEnd) return "TBA";
  return `${formattedStart} – ${formattedEnd}`;
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

function applyCourseDetails(courseRecord, timetableRecords) {
  currentCourse = courseRecord;
  currentTimetableEntries = sortTimetableRecords(normalizeTimetableRecords(timetableRecords));
  currentTimetable = currentTimetableEntries[0] || null;

  const slots = currentTimetableEntries.length
    ? currentTimetableEntries.map(record => ({
      day: record.day || "TBA",
      time: formatTimeRange(record.start_time, record.end_time),
      venue: record.venue || "TBA"
    }))
    : [{
      day: courseRecord.day || "TBA",
      time: (courseRecord.times && courseRecord.times.length ? courseRecord.times.join(", ") : "TBA"),
      venue: courseRecord.venue || "TBA"
    }];
  const uniqueDays = [...new Set(slots.map(slot => slot.day || "TBA"))];
  const uniqueVenues = [...new Set(slots.map(slot => slot.venue || "TBA"))];
  const day = uniqueDays.join(", ");
  const time = slots.map(slot => slot.time).join(" / ");
  const venue = uniqueVenues.join(" / ");
  const units = courseRecord.credit_units ? String(courseRecord.credit_units) : (courseRecord.units || "N/A");

  $("#courseCode").textContent = courseRecord.code;
  $("#courseTitle").textContent = courseRecord.title;
  $("#courseUnits").textContent = units;
  $("#courseDay").textContent = day;
  $("#courseTime").textContent = time;
  $("#courseVenue").textContent = venue;
  $("#scheduleCopy").textContent = slots.map(slot => `${slot.day} · ${slot.time} · ${slot.venue}`).join(" | ");
  $("#overviewTitle").textContent = `Keep ${courseRecord.title} clear, focused, and easy to follow.`;

  shareText = `${courseRecord.code} — ${courseRecord.title}\n${day}, ${time}\n📍 ${venue}\n\nView course details:`;

  const computerCodes = ["COS202", "CYB204", "IFT212"];
  const isComputer = computerCodes.includes(normalizeCourseKey(courseRecord.code));
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
          <p>Course material curated for ${courseRecord.title}.</p>
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

  if (network === "copy") {
    if (!navigator.clipboard) {
      toast("Copy is unavailable in this browser.");
      return;
    }
    return navigator.clipboard.writeText(courseUrl).then(() => toast("Course link copied."));
  }

  if (network === "more" && navigator.share) {
    return navigator.share({ title: currentCourse?.title || "Course", text: shareText, url: courseUrl }).catch(() => {});
  }

  if (network === "more") {
    if (!navigator.clipboard) {
      toast("Copy is unavailable in this browser.");
      return;
    }
    return navigator.clipboard.writeText(courseUrl).then(() => toast("Course link copied."));
  }

  window.open(links[network], "share-window", "width=640,height=520,noopener");
}

function createCalendarFile() {
  if (!currentCourse) return;
  const fallbackTime = (currentCourse.times && currentCourse.times.length ? currentCourse.times[0] : "10:00 AM – 12:00 PM");
  const fallbackDay = currentCourse.day || "Monday";
  const fallbackVenue = currentCourse.venue || "FSBMS";
  const entries = currentTimetableEntries.length
    ? currentTimetableEntries
    : [{
      day: fallbackDay,
      start_time: null,
      end_time: null,
      venue: fallbackVenue,
      formattedTime: fallbackTime
    }];

  const toIcsTime = value => {
    const match = (value || "").match(/(\d+):(\d+)\s*(AM|PM)/i);
    if (!match) return "000000";
    let hour = Number(match[1]) % 12;
    if (match[3].toUpperCase() === "PM") hour += 12;
    return `${String(hour).padStart(2, "0")}${match[2]}00`;
  };

  const events = entries.map(entry => {
    const formatted = entry.formattedTime || formatTimeRange(entry.start_time, entry.end_time);
    const [start, end] = formatted.split(" – ");
    const eventDate = getNextWeekdayDate(entry.day || fallbackDay);
    const safeStart = start || "10:00 AM";
    const safeEnd = end || "12:00 PM";
    return [
      "BEGIN:VEVENT",
      `SUMMARY:${currentCourse.code} — ${currentCourse.title}`,
      `LOCATION:${entry.venue || fallbackVenue}`,
      "DESCRIPTION:NWU Software Engineering lecture",
      `DTSTART:${eventDate}T${toIcsTime(safeStart)}`,
      `DTEND:${eventDate}T${toIcsTime(safeEnd)}`,
      "END:VEVENT"
    ].join("\r\n");
  });

  const ics = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    ...events,
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
  const normalizedKey = normalizeCourseKey(courseKey);

  $("#courseCode").textContent = "Loading...";
  $("#courseTitle").textContent = "Fetching course details...";
  $("#overviewTitle").textContent = "Connecting to database...";
  $("#scheduleCopy").textContent = "Loading schedule...";

  try {
    if (typeof db === "undefined" || !db) {
      throw new Error("Supabase client is not initialised.");
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

    if (error) throw new Error(`Failed to load courses: ${error.message}`);
    if (!courses || courses.length === 0) throw new Error("No courses found in database.");

    const matched = courses.find(course => course?.code && normalizeCourseKey(course.code) === normalizedKey);
    if (!matched) throw new Error(`Course ${normalizedKey} was not found in database.`);

    const timetableEntries = sortTimetableRecords(normalizeTimetableRecords(matched.timetable));
    const fallbackRecord = getFallbackCourseRecord(normalizedKey);
    const courseRecord = {
      ...matched,
      code: matched.code || fallbackRecord.code,
      title: matched.title || fallbackRecord.title,
      units: matched.credit_units ? String(matched.credit_units) : "",
      credit_units: matched.credit_units,
      day: timetableEntries[0]?.day || "TBA",
      venue: timetableEntries[0]?.venue || "TBA",
      times: timetableEntries.length
        ? timetableEntries.map(entry => formatTimeRange(entry.start_time, entry.end_time))
        : ["TBA"]
    };

    applyCourseDetails(courseRecord, timetableEntries);
  } catch (err) {
    console.error("Failed to load course details:", err);
    $("#courseCode").textContent = "Error";
    $("#courseTitle").textContent = "Unable to load course details";
    $("#overviewTitle").textContent = err?.message || "A database connection error occurred.";
    $("#courseDay").textContent = "Unavailable";
    $("#courseTime").textContent = "Unavailable";
    $("#courseVenue").textContent = "Unavailable";
    $("#courseUnits").textContent = "N/A";
    $("#scheduleCopy").innerHTML = `
      <span style="color: var(--muted); margin-right: 12px;">Could not retrieve schedule.</span>
      <button class="accent-button compact" id="retryCourseBtn" style="cursor: pointer; margin-top: 10px;">
        <i class="fa-solid fa-rotate-right"></i> Retry
      </button>`;
    $("#retryCourseBtn")?.addEventListener("click", loadCoursePage);
  }
}

document.querySelectorAll(".course-tabs button").forEach(button => {
  button.addEventListener("click", () => {
    document.querySelectorAll(".course-tabs button").forEach(tab => tab.classList.remove("active"));
    document.querySelectorAll(".course-panel").forEach(panel => panel.classList.remove("active"));
    button.classList.add("active");
    $("#" + button.dataset.tab)?.classList.add("active");
  });
});

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

loadCoursePage();
