<<<<<<< HEAD
const timetable={tuesday:[{code:"MTH 202",title:"Elementary Differential Equations",time:"9:00 AM – 11:00 AM",venue:"Indabawa Room 3, Main Campus",slug:"MTH202"},{code:"MTH 202",title:"Elementary Differential Equations",time:"12:00 PM – 2:00 PM",venue:"Indabawa Room 3, Main Campus",slug:"MTH202"}],thursday:[{code:"COS 202",title:"Computer Programming II",time:"10:00 AM – 12:00 PM",venue:"7th Floor, City Campus (Venue to be decided)",slug:"COS202"},{code:"INS 204",title:"System Analysis and Design",time:"12:00 PM – 2:00 PM",venue:"7th Floor, City Campus (Venue to be decided)",slug:"INS204"},{code:"IFT 212",title:"Computer Architecture and Organisation",time:"2:00 PM – 4:00 PM",venue:"7th Floor, City Campus (Venue to be decided)",slug:"IFT212"},{code:"CYB 204",title:"Python Programming",time:"4:00 PM – 6:00 PM",venue:"7th Floor, City Campus (Venue to be decided)",slug:"CYB204"}],friday:[{code:"GST 212",title:"Philosophy, Logic and Human Existence",time:"8:00 AM – 10:00 AM",venue:"Science Theatre B, Main Campus",slug:"GST212"}]};
const courses=[{code:"MTH 202",title:"Elementary Differential Equations",units:"",slug:"MTH202"},{code:"COS 202",title:"Computer Programming II",units:"",slug:"COS202"},{code:"INS 204",title:"System Analysis and Design",units:"",slug:"INS204"},{code:"IFT 212",title:"Computer Architecture and Organisation",units:"",slug:"IFT212"},{code:"CYB 204",title:"Python Programming",units:"",slug:"CYB204"},{code:"GST 212",title:"Philosophy, Logic and Human Existence",units:"",slug:"GST212"}];
const updates=[{category:"SIWES UPDATE",title:"Registration Information",description:"Important information regarding SIWES registration and required student documentation.",date:"September 2026"},{category:"DEPARTMENT NOTICE",title:"Placement Preparation",description:"A practical checklist to help you prepare for your industrial placement and first week.",date:"August 2026"},{category:"STUDENT GUIDE",title:"Your SIWES Logbook",description:"Keep your weekly records clear, consistent, and ready for assessment.",date:"August 2026"}];
const $=(selector,parent=document)=>parent.querySelector(selector);const $$=(selector,parent=document)=>[...parent.querySelectorAll(selector)];const scheduleList=$("#scheduleList");let selectedDay="tuesday";let sharePayload={text:"Explore the NWU Software Engineering Student Platform.",url:window.location.href};
function lectureMarkup(lecture){const[start,end]=lecture.time.split(" – ");return `<div class="schedule-item"><a class="schedule-main-link" href="course.html?code=${lecture.slug}"><div class="schedule-time">${start}<small>${end}</small></div><div class="schedule-main"><span class="course-code">${lecture.code}</span><h3>${lecture.title}</h3><p>Lecture session</p></div><div class="schedule-venue"><i class="fa-solid fa-location-dot"></i>${lecture.venue}</div><span class="schedule-arrow"><i class="fa-solid fa-arrow-right"></i></span></a><button class="calendar-button" data-calendar-code="${lecture.slug}|${lecture.time}" aria-label="Add ${lecture.code} to calendar"><i class="fa-regular fa-calendar-plus"></i></button></div>`}
function renderTimetable(day){selectedDay=day;scheduleList.innerHTML=Object.entries(timetable).map(([name,lectures])=>`<div class="day-group ${name===day?'selected-day':''}" id="${name}"><div class="day-group-heading"><span class="eyebrow">${name.toUpperCase()}</span><small>${lectures.length} ${lectures.length===1?"lecture":"lectures"}</small></div>${lectures.map(lectureMarkup).join("")}</div>`).join("");$$('.day-tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.day===day))}
function renderCourses(){$("#courseDirectory").innerHTML=courses.map(course=>`<a class="course-item" href="course.html?code=${course.slug}"><span class="course-symbol">${course.code.split(" ")[0]}</span><span class="course-item-content"><small>${course.code}</small><h3>${course.title}</h3>${course.units?`<p>${course.units}</p>`:""}</span><i class="fa-solid fa-arrow-up-right-from-square"></i></a>`).join("")}
function renderUpdates(){$("#updatesList").innerHTML=updates.map((update,index)=>`<article class="update-item ${index===0?"featured":""}" id="update-${index}"><time class="update-date">${update.date}</time><div class="update-content"><span class="update-tag">${update.category}</span><h3><a href="#updates">${update.title}</a></h3><p>${update.description}</p></div><div class="update-actions"><button class="text-button update-share" data-index="${index}">Share <i class="fa-solid fa-arrow-up-from-bracket"></i></button><a class="text-button" href="#updates">Read update <i class="fa-solid fa-arrow-right"></i></a></div></article>`).join("")}
function renderDropdownContent(){$$(".dropdown-course-list").forEach(list=>list.innerHTML=courses.map(course=>`<a class="dropdown-course-item" href="course.html?code=${course.slug}"><strong>${course.code}</strong><span>${course.title}</span>${course.units?`<small>${course.units}</small>`:""}</a>`).join(""));$$(".dropdown-update-list").forEach(list=>list.innerHTML=updates.map(update=>`<article class="dropdown-update-item"><span>${update.category} · ${update.date}</span><strong>${update.title}</strong><p>${update.description}</p></article>`).join(""))}
function showToast(message){const toast=$("#toast");$("#toastMessage").textContent=message;toast.classList.add("show");window.clearTimeout(showToast.timeout);showToast.timeout=window.setTimeout(()=>toast.classList.remove("show"),2800)}
function getShareContent(type){if(type==="timetable"){const lectures=timetable[selectedDay].map(item=>`${item.time}\n${item.code} — ${item.title}\n📍 ${item.venue}`).join("\n\n");return{text:`${selectedDay[0].toUpperCase()+selectedDay.slice(1)}'s NWU Software Engineering lecture schedule:\n\n${lectures}\n\nCheck the full schedule here:`,url:window.location.href+"#timetable"}}return sharePayload}
function openShareModal(type="platform",customPayload){sharePayload=customPayload||getShareContent(type);$("#shareContext").textContent=type==="timetable"?`Sharing your ${selectedDay} lecture schedule.`:"A polished academic workspace for NWU Software Engineering students.";$("#shareModal").classList.add("show");$("#shareModal").setAttribute("aria-hidden","false")}
async function copyLink(){try{await navigator.clipboard.writeText(sharePayload.url);showToast("Link copied to your clipboard.")}catch{showToast("Copy is unavailable in this browser.")}}
function shareTo(network){const text=encodeURIComponent(sharePayload.text);const url=encodeURIComponent(sharePayload.url);const links={whatsapp:`https://wa.me/?text=${text}%20${url}`,facebook:`https://www.facebook.com/sharer/sharer.php?u=${url}`,x:`https://twitter.com/intent/tweet?text=${text}&url=${url}`,telegram:`https://t.me/share/url?url=${url}&text=${text}`};if(network==="copy")return copyLink();if(network==="more"&&navigator.share)return navigator.share({title:"NWU SE Student Platform",text:sharePayload.text,url:sharePayload.url}).catch(()=>{});if(network==="more")return copyLink();window.open(links[network],"share-window","width=640,height=520,noopener")}
function addToCalendar(calendarCode){const[code,time]=calendarCode.split("|");const found=Object.entries(timetable).flatMap(([day,lectures])=>lectures.map(lecture=>({day,lecture}))).find(item=>item.lecture.slug===code&&item.lecture.time===time);if(!found)return;const{day,lecture}=found;const weekdayNumbers={sunday:0,monday:1,tuesday:2,wednesday:3,thursday:4,friday:5,saturday:6};const date=new Date();const daysUntil=(weekdayNumbers[day]-date.getDay()+7)%7||7;date.setDate(date.getDate()+daysUntil);const dateStamp=`${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}`;const[start,end]=time.split(" – ");const toIcsTime=value=>{const match=value.match(/(\d+):(\d+)\s*(AM|PM)/i);let hour=Number(match[1])%12;if(match[3].toUpperCase()==="PM")hour+=12;return `${String(hour).padStart(2,"0")}${match[2]}00`};const ics=["BEGIN:VCALENDAR","VERSION:2.0","BEGIN:VEVENT",`SUMMARY:${lecture.code} — ${lecture.title}`,`LOCATION:${lecture.venue}`,`DTSTART:${dateStamp}T${toIcsTime(start)}`,`DTEND:${dateStamp}T${toIcsTime(end)}`,"END:VEVENT","END:VCALENDAR"].join("\r\n");const link=document.createElement("a");link.href=URL.createObjectURL(new Blob([ics],{type:"text/calendar"}));link.download=`${lecture.slug}-lecture.ics`;link.click();URL.revokeObjectURL(link.href);showToast("Calendar event downloaded.")}
renderCourses();const coursesSection=$("#courses");const timetableSection=$("#timetable");timetableSection.parentNode.insertBefore(coursesSection,timetableSection);renderTimetable(selectedDay);renderUpdates();renderDropdownContent();$$('.day-tab').forEach(tab=>tab.addEventListener('click',event=>{event.preventDefault();document.getElementById(tab.dataset.day)?.scrollIntoView({behavior:'smooth',block:'start'});}));$$('.calendar-button').forEach(button=>button.addEventListener('click',()=>addToCalendar(button.dataset.calendarCode)));$$('.share-trigger').forEach(button=>button.addEventListener('click',()=>openShareModal(button.dataset.shareType)));$$('[data-scroll="timetable"]').forEach(button=>button.addEventListener('click',()=>$("#timetable").scrollIntoView({behavior:"smooth"})));$("#updatesList").addEventListener("click",event=>{const button=event.target.closest(".update-share");if(!button)return;const update=updates[button.dataset.index];openShareModal("update",{text:`${update.title}\n\n${update.description}\n\nRead more on the NWU SE Student Platform:`,url:window.location.href+"#updates"})});$("#shareModal").addEventListener("click",event=>{if(event.target===$("#shareModal"))$("#closeShare").click()});$$('.share-options button').forEach(button=>button.addEventListener('click',()=>shareTo(button.dataset.share)));$("#closeShare").addEventListener("click",()=>{$("#shareModal").classList.remove("show");$("#shareModal").setAttribute("aria-hidden","true")});$("#notificationButton").addEventListener("click",()=>$("#notificationPanel").classList.toggle("show"));$("#closeNotification").addEventListener("click",()=>$("#notificationPanel").classList.remove("show"));$("#menuButton").addEventListener("click",()=>$("#mobileMenu").classList.toggle("show"));$$('#mobileMenu a').forEach(link=>link.addEventListener('click',()=>$("#mobileMenu").classList.remove("show")));$$('.nav-dropdown-menu a').forEach(link=>link.addEventListener('click',()=>{link.closest('details').open=false;$("#mobileMenu").classList.remove("show")}));document.addEventListener("click",event=>{if(!event.target.closest("#notificationPanel, #notificationButton"))$("#notificationPanel").classList.remove("show")});
$$('.nav-dropdown-menu a[href="#tuesday"], .nav-dropdown-menu a[href="#thursday"], .nav-dropdown-menu a[href="#friday"]').forEach(link=>link.addEventListener("click",event=>{event.preventDefault();event.stopImmediatePropagation();const day=link.hash.slice(1);const preview=$(".day-lecture-preview",link.closest(".nav-dropdown-menu"));preview.innerHTML=`<strong class="day-lecture-preview-heading">${day.toUpperCase()} LECTURES</strong>${timetable[day].map(lecture=>`<article class="day-lecture-preview-item"><div><strong>${lecture.code}</strong><span>${lecture.time}</span></div><p>${lecture.title}</p><small><i class="fa-solid fa-location-dot" aria-hidden="true"></i> ${lecture.venue}</small></article>`).join("")}`;preview.hidden=false},true));
$$(".nav-links .nav-dropdown, #mobileMenu .nav-dropdown").forEach(dropdown=>{dropdown.querySelector("summary").addEventListener("click",()=>{$$(".nav-links .nav-dropdown, #mobileMenu .nav-dropdown").forEach(other=>{if(other===dropdown)return;other.open=false;const preview=$(".day-lecture-preview",other);if(preview){preview.hidden=true;preview.replaceChildren()}})});dropdown.addEventListener("pointerleave",event=>{if(event.pointerType!=="mouse")return;dropdown.open=false;const preview=$(".day-lecture-preview",dropdown);if(preview){preview.hidden=true;preview.replaceChildren()}})});
function openDaysDropdown(){const mobile=window.matchMedia("(max-width: 900px)").matches;const menu=mobile?$("#mobileMenu"):$(".nav-links");if(mobile)menu.classList.add("show");const dropdown=$(".nav-dropdown",menu);dropdown.open=true;dropdown.querySelector("summary").focus({preventScroll:true})}
$$("[data-open-days]").forEach(button=>button.addEventListener("click",openDaysDropdown));
=======
// No static/hard-coded announcement data — Supabase is the sole source of truth.

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
  const parts = timeStr.split(":");
  let h = parseInt(parts[0], 10);
  const m = parts[1] || "00";
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12;
  if (h === 0) h = 12;
  return `${h}:${m} ${ampm}`;
}

function formatTimeRange(start, end) {
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

function renderCourses() {
  const dir = $("#courseDirectory");
  if (!dir) return;
  if (fetchedCourses.length === 0) {
    dir.innerHTML = `<div style="text-align:center; padding: 48px; color: var(--muted); grid-column: 1 / -1;">No courses currently registered.</div>`;
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
}

let fetchedAnnouncements = [];

// Renders published announcements from Supabase, a clean empty state, or a fetch-error state.
// No hard-coded fallback data — Supabase is the sole source of truth.
function renderUpdates(state) {
  const updatesList = $("#updatesList");
  if (!updatesList) return;

  if (state.mode === "error") {
    fetchedAnnouncements = [];
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
    updatesList.innerHTML = `
      <div style="text-align:center; padding:48px; color:var(--muted); font-size:0.9rem;">
        <i class="fa-regular fa-bell-slash" style="font-size:1.8rem; margin-bottom:12px; display:block;"></i>
        No announcements at this time.
      </div>`;
    return;
  }

  // mode === "data"
  fetchedAnnouncements = state.items;
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

async function fetchAnnouncements() {
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
    scheduleList.innerHTML = `<div style="text-align: center; padding: 48px; color: var(--muted); font-size: 0.85rem;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Loading lecture schedule...</div>`;
  }
  const courseDir = $("#courseDirectory");
  if (courseDir) {
    courseDir.innerHTML = `<div style="text-align: center; padding: 48px; color: var(--muted); font-size: 0.85rem; grid-column: 1 / -1;"><i class="fa-solid fa-spinner fa-spin" style="margin-right: 8px;"></i> Loading courses...</div>`;
  }

  try {
    if (typeof db === "undefined" || !db) {
      throw new Error("Supabase client is not initialized.");
    }

    // 1. Fetch timetable with joined courses
    const { data: ttData, error: ttError } = await db
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
      .order("start_time");

    if (ttError) throw ttError;

    // 2. Fetch all courses
    const { data: cData, error: cError } = await db
      .from("courses")
      .select("id, code, title, credit_units")
      .order("code");

    if (cError) throw cError;

    // Transform courses
    fetchedCourses = (cData || []).map(c => ({
      code: c.code,
      title: c.title,
      units: c.credit_units ? `${c.credit_units} Credit Units` : "",
      slug: generateSlug(c.code)
    }));

    // Transform timetable records
    const grouped = {};
    (ttData || []).forEach(item => {
      const dayKey = (item.day || "other").toLowerCase();
      if (!grouped[dayKey]) grouped[dayKey] = [];
      const course = item.courses || {};
      grouped[dayKey].push({
        code: course.code || "N/A",
        title: course.title || "Untitled",
        creditUnits: course.credit_units ? `${course.credit_units} Credit Units` : "Lecture session",
        time: formatTimeRange(item.start_time, item.end_time),
        venue: item.venue || "TBA",
        slug: generateSlug(course.code)
      });
    });

    // Group days in standard weekday order
    fetchedTimetable = {};
    DAY_ORDER.forEach(day => {
      if (grouped[day]) fetchedTimetable[day] = grouped[day];
    });
    Object.keys(grouped).forEach(day => {
      if (!fetchedTimetable[day]) fetchedTimetable[day] = grouped[day];
    });

    // Update section count badge
    const countBadge = $(".section-count");
    if (countBadge) {
      countBadge.innerHTML = `${String(fetchedCourses.length).padStart(2, "0")} courses <i class="fa-solid fa-arrow-down"></i>`;
    }

    // Populate day tabs if container exists in index.html
    const dayTabsContainer = $(".day-tabs");
    if (dayTabsContainer) {
      dayTabsContainer.innerHTML = Object.entries(fetchedTimetable).map(([name, lectures]) => `
        <button class="day-tab ${name === selectedDay ? "active" : ""}" data-day="${name}">
          ${name[0].toUpperCase() + name.slice(1)}
          <small>${lectures.length} lecture${lectures.length > 1 ? "s" : ""}</small>
        </button>
      `).join("");

      $$(".day-tab").forEach(tab => tab.addEventListener("click", event => {
        event.preventDefault();
        renderTimetable(tab.dataset.day);
        document.getElementById(tab.dataset.day)?.scrollIntoView({ behavior: "smooth", block: "start" });
      }));
    }

    renderCourses();
    const days = Object.keys(fetchedTimetable);
    selectedDay = days.includes(selectedDay) ? selectedDay : (days[0] || "tuesday");
    renderTimetable(selectedDay);

  } catch (err) {
    console.error("Supabase request failed:", err);
    if (scheduleList) {
      scheduleList.innerHTML = `
        <div style="text-align: center; padding: 48px; color: var(--muted);">
          <p style="margin-bottom: 14px;">Unable to load schedule from database.</p>
          <button class="accent-button compact" id="retryTimetableBtn" style="cursor: pointer;"><i class="fa-solid fa-rotate-right"></i> Retry</button>
        </div>`;
      $("#retryTimetableBtn")?.addEventListener("click", fetchAndRender);
    }
    if (courseDir) {
      courseDir.innerHTML = `
        <div style="text-align: center; padding: 48px; color: var(--muted); grid-column: 1 / -1;">
          <p style="margin-bottom: 14px;">Unable to load courses from database.</p>
          <button class="accent-button compact" id="retryCoursesBtn" style="cursor: pointer;"><i class="fa-solid fa-rotate-right"></i> Retry</button>
        </div>`;
      $("#retryCoursesBtn")?.addEventListener("click", fetchAndRender);
    }
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

$("#shareModal").addEventListener("click", event => {
  if (event.target === $("#shareModal")) $("#closeShare").click();
});

$$(".share-options button").forEach(button => button.addEventListener("click", () => shareTo(button.dataset.share)));

$("#closeShare").addEventListener("click", () => {
  $("#shareModal").classList.remove("show");
  $("#shareModal").setAttribute("aria-hidden", "true");
});

$("#notificationButton").addEventListener("click", () => $("#notificationPanel").classList.toggle("show"));
$("#closeNotification").addEventListener("click", () => $("#notificationPanel").classList.remove("show"));
$("#menuButton").addEventListener("click", () => $("#mobileMenu").classList.toggle("show"));

$$("#mobileMenu a").forEach(link => link.addEventListener("click", () => $("#mobileMenu").classList.remove("show")));

document.addEventListener("click", event => {
  if (!event.target.closest("#notificationPanel, #notificationButton")) {
    $("#notificationPanel").classList.remove("show");
  }
});
>>>>>>> bf074dc4c229eeaef7d2937f42e31fedd97f2e29
