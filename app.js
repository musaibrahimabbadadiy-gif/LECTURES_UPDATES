// Published announcements are fetched from Supabase.

let fetchedTimetable = {};
let fetchedCourses = [];
let selectedDay = "tuesday";
let sharePayload = { text: "Explore the NWU Software Engineering Student Platform.", url: window.location.href };

const $ = (selector, parent = document) => parent.querySelector(selector);
const $$ = (selector, parent = document) => [...parent.querySelectorAll(selector)];
const scheduleList = $("#scheduleList");
const DAY_ORDER = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

function generateSlug(code) {
  return (code || "").replace(/\s+/g, "");
}

function formatSqlTime(timeStr) {
  if (!timeStr) return "";
  const parts = String(timeStr).split(":");
  let h = parseInt(parts[0], 10);
  if (Number.isNaN(h)) return "";
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

const DEPARTMENT_TIMETABLE = {
  tuesday: [
    {
      code: "MTH 202",
      title: "Elementary Differential Equations",
      time: "9:00 AM – 11:00 AM",
      venue: "Indabawa Room 3, Main Campus"
    },
    {
      code: "MTH 202",
      title: "Elementary Differential Equations",
      time: "12:00 PM – 2:00 PM",
      venue: "Indabawa Room 3, Main Campus"
    }
  ],
  thursday: [
    {
      code: "COS 202",
      title: "Computer Programming II",
      time: "10:00 AM – 12:00 PM",
      venue: "7th Floor, City Campus (Venue to be decided)"
    },
    {
      code: "INS 204",
      title: "System Analysis and Design",
      time: "12:00 PM – 2:00 PM",
      venue: "7th Floor, City Campus (Venue to be decided)"
    },
    {
      code: "IFT 212",
      title: "Computer Architecture and Organisation",
      time: "2:00 PM – 4:00 PM",
      venue: "7th Floor, City Campus (Venue to be decided)"
    },
    {
      code: "CYB 204",
      title: "Python Programming",
      time: "4:00 PM – 6:00 PM",
      venue: "7th Floor, City Campus (Venue to be decided)"
    }
  ],
  friday: [
    {
      code: "GST 212",
      title: "Philosophy, Logic and Human Existence",
      time: "8:00 AM – 10:00 AM",
      venue: "Science Theatre B, Main Campus"
    }
  ]
};

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

function lectureMarkup(lecture) {
  const [start, end] = lecture.time.split(" – ");
  return `<div class="schedule-item">
    <a class="schedule-main-link" href="course.html?code=${lecture.slug}">
      <div class="schedule-time">${start}<small>${end || ""}</small></div>
      <div class="schedule-main">
        <span class="course-code">${lecture.code}</span>
        <h3>${lecture.title}</h3>
        <p>${lecture.creditUnits || "Lecture session"}</p>
      </div>
      <div class="schedule-venue"><i class="fa-solid fa-location-dot"></i>${lecture.venue}</div>
      <span class="schedule-arrow"><i class="fa-solid fa-arrow-right"></i></span>
    </a>
    <button class="calendar-button" data-calendar-code="${lecture.slug}" aria-label="Add ${lecture.code} to calendar">
      <i class="fa-regular fa-calendar-plus"></i>
    </button>
  </div>`;
}

function renderTimetable(day) {
  if (!scheduleList) return;
  const days = Object.keys(fetchedTimetable);
  if (days.length === 0) {
    scheduleList.innerHTML = `<div style="text-align:center; padding: 48px; color: var(--muted);">No lecture timetable available at this time.</div>`;
    return;
  }

  if (day && days.includes(day.toLowerCase())) {
    selectedDay = day.toLowerCase();
  } else if (!days.includes(selectedDay)) {
    selectedDay = days[0];
  }

  scheduleList.innerHTML = Object.entries(fetchedTimetable).map(([name, lectures]) => `
    <div class="day-group ${name === selectedDay ? "selected-day" : ""}" id="${name}">
      <div class="day-group-heading">
        <span class="eyebrow">${name.toUpperCase()}</span>
        <small>${lectures.length} lecture${lectures.length > 1 ? "s" : ""}</small>
      </div>
      ${lectures.map(lectureMarkup).join("")}
    </div>
  `).join("");

  $$(".day-tab").forEach(tab => tab.classList.toggle("active", tab.dataset.day === selectedDay));
}

function renderDayDropdown(message) {
  const days = Object.entries(fetchedTimetable);
  $$(".dropdown-day-list").forEach(list => {
    list.innerHTML = message
      ? `<p class="dropdown-empty">${message}</p><button class="dropdown-retry" type="button" data-retry="timetable">Retry</button>`
      : days.length
        ? days.map(([name, lectures]) => `
        <details class="dropdown-day">
          <summary class="dropdown-day-item">
            <span>${name[0].toUpperCase() + name.slice(1)}</span>
            <small>${lectures.length} lecture${lectures.length === 1 ? "" : "s"}</small>
          </summary>
          <div class="dropdown-day-lectures">
            ${lectures.length
              ? lectures.map(lecture => `
                <article class="day-lecture-preview-item">
                  <div><strong>${lecture.code}</strong><span>${lecture.time}</span></div>
                  <p>${lecture.title}</p>
                  <small><i class="fa-solid fa-location-dot"></i>${lecture.venue}</small>
                </article>
              `).join("")
              : `<p class="dropdown-empty">No lectures scheduled.</p>`}
          </div>
        </details>
        `).join("")
        : `<p class="dropdown-empty">No lecture days available.</p>`;
  });
}

function renderTimetableDropdown(message) {
  const days = Object.entries(fetchedTimetable);
  $$(".dropdown-timetable-list").forEach(list => {
    list.innerHTML = message
      ? `<p class="dropdown-empty">${message}</p><button class="dropdown-retry" type="button" data-retry="timetable">Retry</button>`
      : days.length
      ? days.map(([day, lectures]) => `
        <section class="dropdown-timetable-day">
          <strong class="dropdown-timetable-day-heading">${day.toUpperCase()}</strong>
          ${lectures.map(lecture => `
            <article class="dropdown-timetable-item">
              <div><strong>${lecture.code}</strong><span>${lecture.time}</span></div>
              <p>${lecture.title}</p>
              <small><i class="fa-solid fa-location-dot"></i>${lecture.venue}</small>
            </article>
          `).join("")}
        </section>
      `).join("")
      : `<p class="dropdown-empty">No lecture timetable available.</p>`;
  });
}

function renderCourses() {
  const dir = $("#courseDirectory");
  if (!dir) return;
  if (fetchedCourses.length === 0) {
    dir.innerHTML = `<div style="text-align:center; padding: 48px; color: var(--muted); grid-column: 1 / -1;">No courses currently registered.</div>`;
    renderCourseDropdowns();
    return;
  }
  dir.innerHTML = fetchedCourses.map(course => `
    <a class="course-item" href="course.html?code=${course.slug}">
      <span class="course-symbol">${course.code.split(" ")[0]}</span>
      <span class="course-item-content">
        <small>${course.code}</small>
        <h3>${course.title}</h3>
        ${course.units ? `<p>${course.units}</p>` : ""}
      </span>
      <i class="fa-solid fa-arrow-up-right-from-square"></i>
    </a>
  `).join("");
  renderCourseDropdowns();
}

function renderCourseDropdowns(message) {
  $$(".dropdown-course-list").forEach(list => {
    list.innerHTML = message
      ? `<p class="dropdown-empty">${message}</p>`
      : fetchedCourses.length
        ? fetchedCourses.map(course => `
        <a class="dropdown-course-item" href="course.html?code=${course.slug}">
          <strong>${course.code}</strong>
          <span>${course.title}</span>
          ${course.units ? `<small>${course.units}</small>` : ""}
        </a>
        `).join("")
        : `<p class="dropdown-empty">No courses currently registered.</p>`;
  });
}

let fetchedAnnouncements = [];

// Renders published announcements from Supabase, a clean empty state, or a fetch-error state.
// No hard-coded fallback data — Supabase is the sole source of truth.
function renderUpdates(state) {
  const updatesList = $("#updatesList");
  if (!updatesList) return;

  if (state.mode === "error") {
    fetchedAnnouncements = [];
    renderAnnouncementDropdowns("error");
    updatesList.innerHTML = `
      <div style="text-align:center; padding:48px; color:var(--muted);">
        <p style="margin-bottom:14px;">Unable to load announcements.</p>
        <button class="accent-button compact" id="retryAnnouncementsBtn" style="cursor:pointer;">
          <i class="fa-solid fa-rotate-right"></i> Retry
        </button>
      </div>`;
    $("#retryAnnouncementsBtn")?.addEventListener("click", fetchAnnouncements);
    return;
  }

  if (state.mode === "empty") {
    fetchedAnnouncements = [];
    renderAnnouncementDropdowns("empty");
    updatesList.innerHTML = `
      <div style="text-align:center; padding:48px; color:var(--muted); font-size:0.9rem;">
        <i class="fa-regular fa-bell-slash" style="font-size:1.8rem; margin-bottom:12px; display:block;"></i>
        No announcements at this time.
      </div>`;
    return;
  }

  // mode === "data"
  fetchedAnnouncements = state.items;
  renderAnnouncementDropdowns("data");
  updatesList.innerHTML = state.items.map((update, index) => `
    <article class="update-item ${index === 0 ? "featured" : ""}">
      <time class="update-date">${update.date}</time>
      <div class="update-content">
        <span class="update-tag">${update.category}</span>
        <h3><a href="#updates">${update.title}</a></h3>
        <p>${update.description}</p>
      </div>
      <div class="update-actions">
        <button class="text-button update-share" data-index="${index}">Share <i class="fa-solid fa-arrow-up-from-bracket"></i></button>
        <a class="text-button" href="#updates">Read update <i class="fa-solid fa-arrow-right"></i></a>
      </div>
    </article>
  `).join("");
}

function renderAnnouncementDropdowns(state) {
  $$(".dropdown-update-list").forEach(list => {
    if (state === "error") {
      list.innerHTML = `<span class="dropdown-section-label">LATEST SIWES UPDATES</span><p class="dropdown-empty">Unable to load SIWES updates.</p><button class="dropdown-retry" type="button" data-retry="announcements">Retry</button>`;
      return;
    }
    if (state === "empty") {
      list.innerHTML = `<span class="dropdown-section-label">LATEST SIWES UPDATES</span><p class="dropdown-empty">No SIWES updates at this time.</p>`;
      return;
    }
    if (state === "loading") {
      list.innerHTML = `<span class="dropdown-section-label">LATEST SIWES UPDATES</span><p class="dropdown-empty">Loading SIWES updates...</p>`;
      return;
    }
    list.innerHTML = `<span class="dropdown-section-label">LATEST SIWES UPDATES</span>${fetchedAnnouncements.map(update => `
      <article class="dropdown-update-item">
        <span>${update.category}</span>
        <strong>${update.title}</strong>
        <p>${update.description}</p>
        ${update.date ? `<small>${update.date}</small>` : ""}
      </article>
    `).join("")}`;
  });
}

async function fetchAnnouncements() {
  renderAnnouncementDropdowns("loading");
  const updatesList = $("#updatesList");
  if (updatesList) {
    updatesList.innerHTML = `<div style="text-align:center; padding:48px; color:var(--muted); font-size:0.85rem;">
      <i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading announcements...
    </div>`;
  }

  try {
    if (typeof db === "undefined" || !db) {
      throw new Error("Supabase client not initialised.");
    }
    // RLS ensures only is_published = true rows are returned to anonymous users
    const { data, error } = await db
      .from("announcements")
      .select("id, title, content, category, published_at, created_at")
      .order("published_at", { ascending: false, nullsFirst: false });

    if (error) throw error;

    if (!data || data.length === 0) {
      renderUpdates({ mode: "empty" });
      return;
    }

    renderUpdates({
      mode: "data",
      items: data.map(a => ({
        category: (a.category || "GENERAL").toUpperCase(),
        title: a.title || "Untitled",
        description: a.content || "",
        date: a.published_at
          ? new Date(a.published_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
          : (a.created_at
            ? new Date(a.created_at).toLocaleDateString("en-US", { month: "long", year: "numeric" })
            : "")
      }))
    });
  } catch (err) {
    console.error("fetchAnnouncements failed:", err);
    renderUpdates({ mode: "error" });
  }
}

function showToast(message) {
  const toast = $("#toast");
  $("#toastMessage").textContent = message;
  toast.classList.add("show");
  window.clearTimeout(showToast.timeout);
  showToast.timeout = window.setTimeout(() => toast.classList.remove("show"), 2800);
}

function getShareContent(type) {
  if (type === "timetable") {
    const dayLectures = fetchedTimetable[selectedDay] || [];
    const lectures = dayLectures.map(item => `${item.time}\n${item.code} — ${item.title}\n📍 ${item.venue}`).join("\n\n");
    return {
      text: `${selectedDay[0].toUpperCase() + selectedDay.slice(1)}'s NWU Software Engineering lecture schedule:\n\n${lectures || "No lectures scheduled."}\n\nCheck the full schedule here:`,
      url: window.location.href.split("#")[0] + "#timetable"
    };
  }
  return sharePayload;
}

function openShareModal(type = "platform", customPayload) {
  sharePayload = customPayload || getShareContent(type);
  $("#shareContext").textContent = type === "timetable"
    ? `Sharing your ${selectedDay} lecture schedule.`
    : "A polished academic workspace for NWU Software Engineering students.";
  $("#shareModal").classList.add("show");
  $("#shareModal").setAttribute("aria-hidden", "false");
}

async function copyLink() {
  try {
    await navigator.clipboard.writeText(sharePayload.url);
    showToast("Link copied to your clipboard.");
  } catch {
    showToast("Copy is unavailable in this browser.");
  }
}

function shareTo(network) {
  const text = encodeURIComponent(sharePayload.text);
  const url = encodeURIComponent(sharePayload.url);
  const links = {
    whatsapp: `https://wa.me/?text=${text}%20${url}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${url}`,
    x: `https://twitter.com/intent/tweet?text=${text}&url=${url}`,
    telegram: `https://t.me/share/url?url=${url}&text=${text}`
  };
  if (network === "copy") return copyLink();
  if (network === "more" && navigator.share) {
    return navigator.share({ title: "NWU SE Student Platform", text: sharePayload.text, url: sharePayload.url }).catch(() => {});
  }
  if (network === "more") return copyLink();
  window.open(links[network], "share-window", "width=640,height=520,noopener");
}

function addToCalendar(code) {
  const allLectures = Object.entries(fetchedTimetable).flatMap(([day, items]) => items.map(item => ({ ...item, day })));
  const lecture = allLectures.find(item => item.slug === code);
  if (!lecture) return;

  const eventDate = getNextWeekdayDate(lecture.day);
  const [start, end] = lecture.time.split(" – ");
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
    `SUMMARY:${lecture.code} — ${lecture.title}`,
    `LOCATION:${lecture.venue}`,
    `DTSTART:${eventDate}T${toIcsTime(start)}`,
    `DTEND:${eventDate}T${toIcsTime(end)}`,
    "END:VEVENT",
    "END:VCALENDAR"
  ].join("\r\n");

  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([ics], { type: "text/calendar" }));
  link.download = `${lecture.slug}-lecture.ics`;
  link.click();
  URL.revokeObjectURL(link.href);
  showToast("Calendar event downloaded.");
}

async function fetchAndRender() {
  if (scheduleList) {
    scheduleList.innerHTML = `<div style="text-align:center; padding:48px; color:var(--muted); font-size:0.85rem;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading lecture schedule...</div>`;
  }
  const courseDir = $("#courseDirectory");
  if (courseDir) {
    courseDir.innerHTML = `<div style="text-align:center; padding:48px; color:var(--muted); font-size:0.85rem; grid-column:1 / -1;"><i class="fa-solid fa-spinner fa-spin" style="margin-right:8px;"></i> Loading courses...</div>`;
  }
  renderCourseDropdowns("Loading courses...");
  renderDayDropdown("Loading lecture days...");
  renderTimetableDropdown("Loading lecture timetable...");

  try {
    if (typeof db === "undefined" || !db) {
      throw new Error("Supabase client not initialised.");
    }

    const [{ data: timetableData, error: timetableError }, { data: coursesData, error: coursesError }] = await Promise.all([
      db
        .from("timetable")
        .select(`
          id,
          day,
          start_time,
          end_time,
          venue,
          course_id,
          courses (
            id,
            code,
            title,
            credit_units
          )
        `)
        .order("day", { ascending: true })
        .order("start_time", { ascending: true }),
      db
        .from("courses")
        .select("id, code, title, credit_units")
        .order("code", { ascending: true })
    ]);

    if (timetableError) throw new Error(`Failed to load timetable: ${timetableError.message}`);
    if (coursesError) throw new Error(`Failed to load courses: ${coursesError.message}`);

    const courseRecords = coursesData || [];
    const timetableRecords = timetableData || [];
    const coursesById = new Map(courseRecords.map(course => [course.id, course]));

    const courseMap = new Map();
    courseRecords.forEach(course => {
      if (!course?.code) return;
      courseMap.set(course.code, {
        code: course.code,
        title: course.title || "Untitled",
        units: course.credit_units ? `${course.credit_units} Credit Units` : "",
        slug: generateSlug(course.code)
      });
    });

    const groupedTimetable = {};
    timetableRecords.forEach(entry => {
      const relation = Array.isArray(entry?.courses) ? entry.courses[0] : entry?.courses;
      const linkedCourse = relation?.code ? relation : (entry?.course_id ? coursesById.get(entry.course_id) : null);
      if (!linkedCourse?.code) return;
      const dayKey = (entry.day || "other").toLowerCase();
      if (!groupedTimetable[dayKey]) groupedTimetable[dayKey] = [];
      groupedTimetable[dayKey].push({
        code: linkedCourse.code,
        title: linkedCourse.title || "Untitled",
        creditUnits: linkedCourse.credit_units ? `${linkedCourse.credit_units} Credit Units` : "Lecture session",
        time: formatTimeRange(entry.start_time, entry.end_time),
        venue: entry.venue || "TBA",
        slug: generateSlug(linkedCourse.code)
      });
      if (!courseMap.has(linkedCourse.code)) {
        courseMap.set(linkedCourse.code, {
          code: linkedCourse.code,
          title: linkedCourse.title || "Untitled",
          units: linkedCourse.credit_units ? `${linkedCourse.credit_units} Credit Units` : "",
          slug: generateSlug(linkedCourse.code)
        });
      }
    });

    fetchedTimetable = {};
    DAY_ORDER.forEach(day => {
      if (groupedTimetable[day]) fetchedTimetable[day] = groupedTimetable[day];
    });
    Object.keys(groupedTimetable).forEach(day => {
      if (!fetchedTimetable[day]) fetchedTimetable[day] = groupedTimetable[day];
    });
    fetchedCourses = [...courseMap.values()];

    const countBadge = $(".section-count");
    if (countBadge) {
      countBadge.innerHTML = `${String(fetchedCourses.length).padStart(2, "0")} courses <i class="fa-solid fa-arrow-down"></i>`;
    }

    const dayTabsContainer = $(".day-tabs");
    if (dayTabsContainer) {
      dayTabsContainer.innerHTML = Object.entries(fetchedTimetable).map(([name, lectures]) => `
        <button class="day-tab ${name === selectedDay ? "active" : ""}" data-day="${name}">
          ${name[0].toUpperCase() + name.slice(1)}
          <small>${lectures.length} lecture${lectures.length === 1 ? "" : "s"}</small>
        </button>
      `).join("");
      $$(".day-tab").forEach(tab => tab.addEventListener("click", event => {
        event.preventDefault();
        renderTimetable(tab.dataset.day);
        document.getElementById(tab.dataset.day)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    }

    selectedDay = Object.hasOwn(fetchedTimetable, selectedDay) ? selectedDay : (Object.keys(fetchedTimetable)[0] || "tuesday");
    renderCourses();
    renderTimetable(selectedDay);
    renderDayDropdown();
    renderTimetableDropdown();
  } catch (err) {
    console.error("fetchAndRender failed:", err);
    fetchedCourses = [];
    fetchedTimetable = {};
    const countBadge = $(".section-count");
    if (countBadge) countBadge.innerHTML = `00 courses <i class="fa-solid fa-arrow-down"></i>`;
    if (scheduleList) {
      scheduleList.innerHTML = `
        <div style="text-align:center; padding:48px; color:var(--muted);">
          <p style="margin-bottom:14px;">Unable to load timetable from database.</p>
          <button class="accent-button compact dropdown-retry" type="button" data-retry="timetable" style="cursor:pointer;">
            <i class="fa-solid fa-rotate-right"></i> Retry
          </button>
        </div>`;
    }
    if (courseDir) {
      courseDir.innerHTML = `
        <div style="text-align:center; padding:48px; color:var(--muted); grid-column:1 / -1;">
          <p style="margin-bottom:14px;">Unable to load courses from database.</p>
          <button class="accent-button compact dropdown-retry" type="button" data-retry="timetable" style="cursor:pointer;">
            <i class="fa-solid fa-rotate-right"></i> Retry
          </button>
        </div>`;
    }
    renderCourseDropdowns("Unable to load courses.");
    renderDayDropdown("Unable to load lecture days.");
    renderTimetableDropdown("Unable to load lecture timetable.");
  }
}

// Initial setup
const coursesSection = $("#courses");
const timetableSection = $("#timetable");
if (coursesSection && timetableSection) {
  timetableSection.parentNode.insertBefore(coursesSection, timetableSection);
}

fetchAnnouncements();
fetchAndRender();

// Event listeners
scheduleList?.addEventListener("click", event => {
  const button = event.target.closest(".calendar-button");
  if (button) {
    event.preventDefault();
    addToCalendar(button.dataset.calendarCode);
  }
});

$$(".share-trigger").forEach(button => button.addEventListener("click", () => openShareModal(button.dataset.shareType)));
$$('[data-scroll="timetable"]').forEach(button => button.addEventListener("click", () => $("#timetable").scrollIntoView({ behavior: "smooth" })));

$("#updatesList")?.addEventListener("click", event => {
  const button = event.target.closest(".update-share");
  if (!button) return;
  const update = fetchedAnnouncements[button.dataset.index];
  if (!update) return;
  openShareModal("update", {
    text: `${update.title}\n\n${update.description}\n\nRead more on the NWU SE Student Platform:`,
    url: window.location.href + "#updates"
  });
});

$("#shareModal")?.addEventListener("click", event => {
  if (event.target === $("#shareModal")) $("#closeShare")?.click();
});

$$(".share-options button").forEach(button => button.addEventListener("click", () => shareTo(button.dataset.share)));

$("#closeShare")?.addEventListener("click", () => {
  $("#shareModal")?.classList.remove("show");
  $("#shareModal")?.setAttribute("aria-hidden", "true");
});

$("#notificationButton")?.addEventListener("click", () => $("#notificationPanel")?.classList.toggle("show"));
$("#closeNotification")?.addEventListener("click", () => $("#notificationPanel")?.classList.remove("show"));
$("#menuButton")?.addEventListener("click", () => $("#mobileMenu")?.classList.toggle("show"));

$("#mobileMenu")?.addEventListener("click", event => {
  if (event.target.closest("a")) $("#mobileMenu")?.classList.remove("show");
});

const hoverCapablePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
$$(".nav-dropdown").forEach(dropdown => {
  dropdown.addEventListener("mouseleave", () => {
    if (hoverCapablePointer.matches) dropdown.removeAttribute("open");
  });
});

document.addEventListener("click", event => {
  const retryButton = event.target.closest(".dropdown-retry");
  if (retryButton?.dataset.retry === "announcements") fetchAnnouncements();
  if (retryButton?.dataset.retry === "timetable") fetchAndRender();
});

document.addEventListener("click", event => {
  if (!event.target.closest("#notificationPanel, #notificationButton")) {
    $("#notificationPanel")?.classList.remove("show");
  }
});
