// class-rep-dashboard.js
// Handles route protection, role verification, data fetching, navigation, logout, Timetable CRUD, and Announcements CRUD

(function () {
    // ── DOM refs: General & Shell ──
    const dashboardBody = document.getElementById('dashboardBody');
    const displayEmail = document.getElementById('displayEmail');
    const displayRoleBadge = document.getElementById('displayRoleBadge');
    const displayRoleText = document.getElementById('displayRoleText');
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    const hamburgerBtn = document.getElementById('hamburgerBtn');
    const dashSidebar = document.getElementById('dashSidebar');
    const sidebarOverlay = document.getElementById('sidebarOverlay');
    const navUsersItem = document.getElementById('navUsersItem');
    const sidebarNav = document.getElementById('sidebarNav');

    // Overview elements
    const statCourses = document.getElementById('statCourses');
    const statTimetable = document.getElementById('statTimetable');
    const statAnnouncements = document.getElementById('statAnnouncements');
    const statAnnouncementsSub = document.getElementById('statAnnouncementsSub');
    const overviewError = document.getElementById('overviewError');
    const overviewErrorText = document.getElementById('overviewErrorText');
    const retryBtn = document.getElementById('retryBtn');
    const statsGrid = document.getElementById('statsGrid');
    const infoRole = document.getElementById('infoRole');

    // ── DOM refs: Timetable Management ──
    const btnAddClass = document.getElementById('btnAddClass');
    const btnEmptyAddClass = document.getElementById('btnEmptyAddClass');
    const timetableError = document.getElementById('timetableError');
    const timetableErrorText = document.getElementById('timetableErrorText');
    const retryTimetableBtn = document.getElementById('retryTimetableBtn');
    const timetableLoading = document.getElementById('timetableLoading');
    const timetableEmpty = document.getElementById('timetableEmpty');
    const timetableBox = document.getElementById('timetableBox');
    const timetableTbody = document.getElementById('timetableTbody');
    const timetableMobileCards = document.getElementById('timetableMobileCards');

    // Timetable Add / Edit Modal
    const timetableModal = document.getElementById('timetableModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalCloseBtn = document.getElementById('modalCloseBtn');
    const modalCancelBtn = document.getElementById('modalCancelBtn');
    const timetableForm = document.getElementById('timetableForm');
    const formAlert = document.getElementById('formAlert');
    const entryCourse = document.getElementById('entryCourse');
    const entryDay = document.getElementById('entryDay');
    const entryStartTime = document.getElementById('entryStartTime');
    const entryEndTime = document.getElementById('entryEndTime');
    const entryVenue = document.getElementById('entryVenue');
    const btnSaveEntry = document.getElementById('btnSaveEntry');
    const btnSaveText = document.getElementById('btnSaveText');

    // Timetable Delete Confirmation Modal
    const deleteModal = document.getElementById('deleteModal');
    const deleteModalCloseBtn = document.getElementById('deleteModalCloseBtn');
    const deleteCancelBtn = document.getElementById('deleteCancelBtn');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');
    const btnDeleteText = document.getElementById('btnDeleteText');
    const deleteConfirmMsg = document.getElementById('deleteConfirmMsg');

    // ── DOM refs: Announcements Management ──
    const btnAddAnnouncement = document.getElementById('btnAddAnnouncement');
    const btnEmptyAddAnnouncement = document.getElementById('btnEmptyAddAnnouncement');
    const announcementsError = document.getElementById('announcementsError');
    const announcementsErrorText = document.getElementById('announcementsErrorText');
    const retryAnnouncementsBtn = document.getElementById('retryAnnouncementsBtn');
    const announcementsLoading = document.getElementById('announcementsLoading');
    const announcementsEmpty = document.getElementById('announcementsEmpty');
    const announcementsBox = document.getElementById('announcementsBox');
    const announcementsTbody = document.getElementById('announcementsTbody');
    const announcementsMobileCards = document.getElementById('announcementsMobileCards');

    // Announcements Add / Edit Modal
    const announcementModal = document.getElementById('announcementModal');
    const announcementModalTitle = document.getElementById('announcementModalTitle');
    const announcementModalCloseBtn = document.getElementById('announcementModalCloseBtn');
    const announcementModalCancelBtn = document.getElementById('announcementModalCancelBtn');
    const announcementForm = document.getElementById('announcementForm');
    const announcementFormAlert = document.getElementById('announcementFormAlert');
    const announcementTitle = document.getElementById('announcementTitle');
    const announcementCategory = document.getElementById('announcementCategory');
    const announcementContent = document.getElementById('announcementContent');
    const announcementIsPublished = document.getElementById('announcementIsPublished');
    const btnSaveAnnouncement = document.getElementById('btnSaveAnnouncement');
    const btnSaveAnnouncementText = document.getElementById('btnSaveAnnouncementText');

    // Announcements Delete Confirmation Modal
    const announcementDeleteModal = document.getElementById('announcementDeleteModal');
    const annDeleteModalTitle = document.getElementById('annDeleteModalTitle');
    const annDeleteModalCloseBtn = document.getElementById('annDeleteModalCloseBtn');
    const annDeleteCancelBtn = document.getElementById('annDeleteCancelBtn');
    const btnConfirmDeleteAnnouncement = document.getElementById('btnConfirmDeleteAnnouncement');
    const btnDeleteAnnouncementText = document.getElementById('btnDeleteAnnouncementText');
    const annDeleteConfirmMsg = document.getElementById('annDeleteConfirmMsg');

    // ── State variables ──
    let cachedCourses = [];
    let timetableEntries = [];
    let currentEditingId = null;
    let currentDeletingId = null;
    let isSaving = false;
    let isDeleting = false;
    let timetableLoadedOnce = false;

    let announcementsList = [];
    let currentEditingAnnouncementId = null;
    let currentDeletingAnnouncementId = null;
    let isSavingAnnouncement = false;
    let isDeletingAnnouncement = false;
    let announcementsLoadedOnce = false;

    // Day ordering map: Monday -> Sunday
    const DAY_ORDER_MAP = {
        monday: 1,
        tuesday: 2,
        wednesday: 3,
        thursday: 4,
        friday: 5,
        saturday: 6,
        sunday: 7
    };

    const VALID_CATEGORIES = ['General', 'Timetable', 'Academic', 'Department', 'SIWES'];

    // ── Supabase client helper ──
    function getDbClient() {
        if (typeof window !== 'undefined' && window.db && window.db.auth) return window.db;
        if (typeof db !== 'undefined' && db && db.auth) return db;
        return null;
    }

    function redirectToLogin() {
        window.location.replace('class-rep-login.html');
    }

    // ── HTML Escape helper ──
    function escapeHtml(str) {
        if (!str) return '';
        return String(str)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    // ── Format helpers ──
    function formatSqlTime(timeStr) {
        if (!timeStr) return '';
        const parts = timeStr.split(':');
        let h = parseInt(parts[0], 10);
        const m = parts[1] || '00';
        const ampm = h >= 12 ? 'PM' : 'AM';
        h = h % 12;
        if (h === 0) h = 12;
        return `${h}:${m} ${ampm}`;
    }

    function formatTimeRange(start, end) {
        return `${formatSqlTime(start)} – ${formatSqlTime(end)}`;
    }

    function timeToInput(timeStr) {
        if (!timeStr) return '';
        return timeStr.slice(0, 5);
    }

    function formatDateTime(isoStr) {
        if (!isoStr) return '—';
        try {
            const d = new Date(isoStr);
            if (isNaN(d.getTime())) return isoStr;
            return d.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            }) + ', ' + d.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch {
            return isoStr;
        }
    }

    // ── Toast Notification system ──
    function showToast(message, type = 'success') {
        const container = document.getElementById('toastContainer');
        if (!container) return;

        const toast = document.createElement('div');
        toast.className = 'toast-message ' + type;
        const icon = type === 'error' ? 'fa-triangle-exclamation' : 'fa-circle-check';
        toast.innerHTML = `<i class="fa-solid ${icon}"></i><span>${escapeHtml(message)}</span>`;

        container.appendChild(toast);

        requestAnimationFrame(() => {
            toast.classList.add('show');
        });

        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                if (toast.parentNode) toast.parentNode.removeChild(toast);
            }, 300);
        }, 3500);
    }

    // ── Logout ──
    async function handleLogout() {
        const client = getDbClient();
        if (!client) { redirectToLogin(); return; }
        try {
            if (headerLogoutBtn) headerLogoutBtn.disabled = true;
            await client.auth.signOut();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            redirectToLogin();
        }
    }

    // ── Navigation ──
    function initNavigation() {
        if (!sidebarNav) return;

        sidebarNav.addEventListener('click', function (e) {
            const btn = e.target.closest('.nav-item');
            if (!btn) return;

            const sectionId = btn.getAttribute('data-section');
            if (!sectionId) return;

            // Update active nav
            sidebarNav.querySelectorAll('.nav-item').forEach(function (item) {
                item.classList.remove('active');
            });
            btn.classList.add('active');

            // Switch section
            document.querySelectorAll('.dash-section').forEach(function (sec) {
                sec.classList.remove('active');
            });
            const target = document.getElementById('section' + sectionId.charAt(0).toUpperCase() + sectionId.slice(1));
            if (target) {
                target.classList.add('active');
                target.style.animation = 'none';
                target.offsetHeight; // force reflow
                target.style.animation = '';
            }

            // Lazy load Timetable when switched
            if (sectionId === 'timetable') {
                fetchTimetableList();
                fetchCourseOptions();
            }

            // Lazy load Announcements when switched
            if (sectionId === 'announcements') {
                fetchAnnouncementsList();
            }

            // Close mobile sidebar
            closeMobileSidebar();
        });
    }

    // ── Mobile sidebar ──
    function openMobileSidebar() {
        if (dashSidebar) dashSidebar.classList.add('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.add('show');
    }

    function closeMobileSidebar() {
        if (dashSidebar) dashSidebar.classList.remove('mobile-open');
        if (sidebarOverlay) sidebarOverlay.classList.remove('show');
    }

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener('click', function () {
            const isOpen = dashSidebar && dashSidebar.classList.contains('mobile-open');
            if (isOpen) closeMobileSidebar();
            else openMobileSidebar();
        });
    }

    if (sidebarOverlay) {
        sidebarOverlay.addEventListener('click', closeMobileSidebar);
    }

    // ── Set stat value ──
    function setStatValue(el, value) {
        if (!el) return;
        el.classList.remove('loading');
        el.textContent = value;
    }

    function setStatLoading(el) {
        if (!el) return;
        el.textContent = '';
        el.classList.add('loading');
    }

    // ── Fetch dashboard overview counts ──
    async function fetchDashboardData() {
        const client = getDbClient();
        if (!client) {
            showOverviewError('Database client unavailable.');
            return;
        }

        setStatLoading(statCourses);
        setStatLoading(statTimetable);
        setStatLoading(statAnnouncements);
        hideOverviewError();

        let hasError = false;

        try {
            // Courses count
            const coursesRes = await client
                .from('courses')
                .select('id', { count: 'exact', head: true });

            if (coursesRes.error) {
                console.error('Courses count error:', coursesRes.error);
                hasError = true;
            } else {
                setStatValue(statCourses, coursesRes.count);
            }

            // Timetable count
            const timetableRes = await client
                .from('timetable')
                .select('id', { count: 'exact', head: true });

            if (timetableRes.error) {
                console.error('Timetable count error:', timetableRes.error);
                hasError = true;
            } else {
                setStatValue(statTimetable, timetableRes.count);
            }

            // Announcements count
            const annTotalRes = await client
                .from('announcements')
                .select('id', { count: 'exact', head: true });

            if (annTotalRes.error) {
                console.error('Announcements total count error:', annTotalRes.error);
                hasError = true;
            } else {
                const totalCount = annTotalRes.count || 0;
                const annPubRes = await client
                    .from('announcements')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_published', true);

                if (annPubRes.error) {
                    setStatValue(statAnnouncements, totalCount);
                    if (statAnnouncementsSub) {
                        statAnnouncementsSub.textContent = 'Total announcements';
                    }
                } else {
                    const pubCount = annPubRes.count || 0;
                    setStatValue(statAnnouncements, totalCount);
                    if (statAnnouncementsSub) {
                        statAnnouncementsSub.textContent = `${pubCount} published · ${totalCount} total`;
                    }
                }
            }

            if (hasError) {
                showOverviewError('Some data could not be loaded. Displayed counts may be incomplete.');
            }

        } catch (err) {
            console.error('Dashboard data fetch error:', err);
            showOverviewError('Unable to load dashboard data. Please check your connection and try again.');
        }
    }

    function showOverviewError(msg) {
        if (overviewError) {
            overviewError.classList.add('show');
            if (overviewErrorText) overviewErrorText.textContent = msg;
        }
    }

    function hideOverviewError() {
        if (overviewError) overviewError.classList.remove('show');
    }

    if (retryBtn) {
        retryBtn.addEventListener('click', function () {
            fetchDashboardData();
        });
    }

    // ══════════════════════════════════════════════════
    // ── TIMETABLE CRUD LOGIC
    // ══════════════════════════════════════════════════

    async function fetchCourseOptions(forceRefresh = false) {
        if (cachedCourses.length > 0 && !forceRefresh) {
            renderCourseSelect();
            return;
        }

        const client = getDbClient();
        if (!client) return;

        try {
            const { data, error } = await client
                .from('courses')
                .select('id, code, title, credit_units')
                .order('code');

            if (error) throw error;
            cachedCourses = data || [];
            renderCourseSelect();
        } catch (err) {
            console.error('Failed to fetch courses for select:', err);
        }
    }

    function renderCourseSelect() {
        if (!entryCourse) return;
        const currentVal = entryCourse.value;
        entryCourse.innerHTML = '<option value="">Select a course...</option>';

        cachedCourses.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = `${c.code} — ${c.title}`;
            entryCourse.appendChild(opt);
        });

        if (currentVal) entryCourse.value = currentVal;
    }

    async function fetchTimetableList() {
        const client = getDbClient();
        if (!client) {
            showTimetableError('Database client unavailable.');
            return;
        }

        showTimetableLoading();
        hideTimetableError();

        try {
            const { data, error } = await client
                .from('timetable')
                .select(`
                    id,
                    course_id,
                    day,
                    start_time,
                    end_time,
                    venue,
                    courses (
                        id,
                        code,
                        title,
                        credit_units
                    )
                `)
                .order('start_time');

            if (error) throw error;

            timetableEntries = data || [];

            timetableEntries.sort((a, b) => {
                const dayA = DAY_ORDER_MAP[(a.day || '').toLowerCase()] || 99;
                const dayB = DAY_ORDER_MAP[(b.day || '').toLowerCase()] || 99;
                if (dayA !== dayB) return dayA - dayB;
                return (a.start_time || '').localeCompare(b.start_time || '');
            });

            timetableLoadedOnce = true;
            renderTimetableUI();

        } catch (err) {
            console.error('Failed to fetch timetable entries:', err);
            showTimetableError('Unable to load timetable. Please check your connection and try again.');
        }
    }

    function showTimetableLoading() {
        if (timetableLoading) timetableLoading.classList.add('show');
        if (timetableEmpty) timetableEmpty.style.display = 'none';
        if (timetableBox) timetableBox.style.display = 'none';
    }

    function hideTimetableLoading() {
        if (timetableLoading) timetableLoading.classList.remove('show');
    }

    function showTimetableError(msg) {
        hideTimetableLoading();
        if (timetableError) {
            timetableError.classList.add('show');
            if (timetableErrorText) timetableErrorText.textContent = msg;
        }
        if (timetableEmpty) timetableEmpty.style.display = 'none';
        if (timetableBox) timetableBox.style.display = 'none';
    }

    function hideTimetableError() {
        if (timetableError) timetableError.classList.remove('show');
    }

    function renderTimetableUI() {
        hideTimetableLoading();
        hideTimetableError();

        if (!timetableEntries || timetableEntries.length === 0) {
            if (timetableEmpty) timetableEmpty.style.display = 'block';
            if (timetableBox) timetableBox.style.display = 'none';
            return;
        }

        if (timetableEmpty) timetableEmpty.style.display = 'none';
        if (timetableBox) timetableBox.style.display = 'block';

        if (timetableTbody) {
            timetableTbody.innerHTML = timetableEntries.map(entry => {
                const course = entry.courses || {};
                const code = escapeHtml(course.code || 'N/A');
                const title = escapeHtml(course.title || 'Untitled Course');
                const day = escapeHtml(entry.day || '—');
                const time = escapeHtml(formatTimeRange(entry.start_time, entry.end_time));
                const venue = escapeHtml(entry.venue || 'TBA');
                const id = escapeHtml(entry.id);

                return `
                    <tr data-id="${id}">
                        <td>
                            <div class="course-cell">
                                <span class="course-code-badge">${code}</span>
                                <span class="course-title-text">${title}</span>
                            </div>
                        </td>
                        <td>
                            <span class="day-pill">${day}</span>
                        </td>
                        <td>
                            <span class="time-text">
                                <i class="fa-regular fa-clock"></i>
                                ${time}
                            </span>
                        </td>
                        <td>
                            <span class="venue-pill" title="${venue}">
                                <i class="fa-solid fa-location-dot"></i>
                                ${venue}
                            </span>
                        </td>
                        <td>
                            <div class="actions-wrap">
                                <button type="button" class="btn-action btn-action-edit" data-id="${id}" aria-label="Edit ${code} class">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                    <span>Edit</span>
                                </button>
                                <button type="button" class="btn-action btn-action-delete" data-id="${id}" aria-label="Delete ${code} class">
                                    <i class="fa-solid fa-trash"></i>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        if (timetableMobileCards) {
            timetableMobileCards.innerHTML = timetableEntries.map(entry => {
                const course = entry.courses || {};
                const code = escapeHtml(course.code || 'N/A');
                const title = escapeHtml(course.title || 'Untitled Course');
                const day = escapeHtml(entry.day || '—');
                const time = escapeHtml(formatTimeRange(entry.start_time, entry.end_time));
                const venue = escapeHtml(entry.venue || 'TBA');
                const id = escapeHtml(entry.id);

                return `
                    <div class="timetable-item-card" data-id="${id}">
                        <div class="card-top">
                            <div class="card-course-info">
                                <span class="course-code-badge">${code}</span>
                                <h4 class="card-course-title">${title}</h4>
                            </div>
                            <span class="day-pill">${day}</span>
                        </div>
                        <div class="card-details">
                            <div class="card-detail-item">
                                <span class="label"><i class="fa-regular fa-clock"></i> Time</span>
                                <span class="time-text" style="font-size: 0.8rem;">${time}</span>
                            </div>
                            <div class="card-detail-item">
                                <span class="label"><i class="fa-solid fa-location-dot"></i> Venue</span>
                                <span class="venue-pill" style="font-size: 0.78rem; max-width: 100%;">${venue}</span>
                            </div>
                        </div>
                        <div class="card-actions">
                            <button type="button" class="btn-action btn-action-edit" data-id="${id}">
                                <i class="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button type="button" class="btn-action btn-action-delete" data-id="${id}">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    if (retryTimetableBtn) {
        retryTimetableBtn.addEventListener('click', function () {
            fetchTimetableList();
        });
    }

    function openAddModal() {
        currentEditingId = null;
        if (modalTitle) modalTitle.textContent = 'Add Timetable Entry';
        if (btnSaveText) btnSaveText.textContent = 'Save Entry';
        if (formAlert) { formAlert.style.display = 'none'; formAlert.textContent = ''; }
        if (timetableForm) timetableForm.reset();

        fetchCourseOptions();

        if (timetableModal) timetableModal.classList.add('show');
        setTimeout(() => { if (entryCourse) entryCourse.focus(); }, 100);
    }

    function openEditModal(id) {
        const entry = timetableEntries.find(e => e.id === id);
        if (!entry) {
            showToast('Selected entry could not be found.', 'error');
            return;
        }

        currentEditingId = id;
        if (modalTitle) modalTitle.textContent = 'Edit Timetable Entry';
        if (btnSaveText) btnSaveText.textContent = 'Update Entry';
        if (formAlert) { formAlert.style.display = 'none'; formAlert.textContent = ''; }
        if (timetableForm) timetableForm.reset();

        fetchCourseOptions();

        if (entryCourse) entryCourse.value = entry.course_id || '';
        if (entryDay) entryDay.value = entry.day || '';
        if (entryStartTime) entryStartTime.value = timeToInput(entry.start_time);
        if (entryEndTime) entryEndTime.value = timeToInput(entry.end_time);
        if (entryVenue) entryVenue.value = entry.venue || '';

        if (timetableModal) timetableModal.classList.add('show');
        setTimeout(() => { if (entryCourse) entryCourse.focus(); }, 100);
    }

    function closeTimetableModal() {
        if (timetableModal) timetableModal.classList.remove('show');
        currentEditingId = null;
        if (formAlert) { formAlert.style.display = 'none'; formAlert.textContent = ''; }
        if (timetableForm) timetableForm.reset();
    }

    function showFormAlert(msg) {
        if (formAlert) {
            formAlert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i><span>${escapeHtml(msg)}</span>`;
            formAlert.style.display = 'flex';
        }
    }

    async function handleFormSubmit(e) {
        e.preventDefault();
        if (isSaving) return;

        const courseId = (entryCourse?.value || '').trim();
        const day = (entryDay?.value || '').trim();
        const startTime = (entryStartTime?.value || '').trim();
        const endTime = (entryEndTime?.value || '').trim();
        const venue = (entryVenue?.value || '').trim();

        if (!courseId) {
            showFormAlert('Please select a course.');
            entryCourse?.focus();
            return;
        }
        if (!day) {
            showFormAlert('Please select a day of the week.');
            entryDay?.focus();
            return;
        }
        if (!startTime) {
            showFormAlert('Please select a valid start time.');
            entryStartTime?.focus();
            return;
        }
        if (!endTime) {
            showFormAlert('Please select a valid end time.');
            entryEndTime?.focus();
            return;
        }

        if (startTime >= endTime) {
            showFormAlert('End time must be later than start time.');
            entryEndTime?.focus();
            return;
        }

        if (!venue) {
            showFormAlert('Please enter a venue.');
            entryVenue?.focus();
            return;
        }

        const client = getDbClient();
        if (!client) {
            showFormAlert('Database connection unavailable.');
            return;
        }

        isSaving = true;
        if (btnSaveEntry) btnSaveEntry.disabled = true;
        if (btnSaveText) btnSaveText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        if (formAlert) formAlert.style.display = 'none';

        try {
            if (currentEditingId) {
                const { error } = await client
                    .from('timetable')
                    .update({
                        course_id: courseId,
                        day: day,
                        start_time: startTime,
                        end_time: endTime,
                        venue: venue
                    })
                    .eq('id', currentEditingId);

                if (error) throw error;
                showToast('Lecture slot updated successfully.', 'success');
            } else {
                const { error } = await client
                    .from('timetable')
                    .insert([{
                        course_id: courseId,
                        day: day,
                        start_time: startTime,
                        end_time: endTime,
                        venue: venue
                    }]);

                if (error) throw error;
                showToast('Lecture slot added successfully.', 'success');
            }

            closeTimetableModal();
            await fetchTimetableList();
            fetchDashboardData();

        } catch (err) {
            console.error('Failed to save timetable entry:', err);
            showFormAlert(err.message || 'Failed to save entry. Please check your inputs and try again.');
        } finally {
            isSaving = false;
            if (btnSaveEntry) btnSaveEntry.disabled = false;
            if (btnSaveText) btnSaveText.textContent = currentEditingId ? 'Update Entry' : 'Save Entry';
        }
    }

    function openDeleteModal(id) {
        const entry = timetableEntries.find(e => e.id === id);
        if (!entry) {
            showToast('Selected entry could not be found.', 'error');
            return;
        }

        currentDeletingId = id;

        const course = entry.courses || {};
        const code = course.code || 'Course';
        const day = entry.day || '';
        const time = formatSqlTime(entry.start_time);

        if (deleteConfirmMsg) {
            deleteConfirmMsg.innerHTML = `Delete <strong>${escapeHtml(code)} — ${escapeHtml(day)} ${escapeHtml(time)}</strong>?`;
        }

        if (deleteModal) deleteModal.classList.add('show');
    }

    function closeDeleteModal() {
        if (deleteModal) deleteModal.classList.remove('show');
        currentDeletingId = null;
    }

    async function handleConfirmDelete() {
        if (!currentDeletingId || isDeleting) return;

        const client = getDbClient();
        if (!client) {
            showToast('Database connection unavailable.', 'error');
            return;
        }

        isDeleting = true;
        if (btnConfirmDelete) btnConfirmDelete.disabled = true;
        if (btnDeleteText) btnDeleteText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        try {
            const { error } = await client
                .from('timetable')
                .delete()
                .eq('id', currentDeletingId);

            if (error) throw error;

            showToast('Lecture slot deleted successfully.', 'success');
            closeDeleteModal();
            await fetchTimetableList();
            fetchDashboardData();

        } catch (err) {
            console.error('Failed to delete timetable entry:', err);
            showToast(err.message || 'Failed to delete lecture slot.', 'error');
        } finally {
            isDeleting = false;
            if (btnConfirmDelete) btnConfirmDelete.disabled = false;
            if (btnDeleteText) btnDeleteText.textContent = 'Delete Entry';
        }
    }

    // ══════════════════════════════════════════════════
    // ── ANNOUNCEMENTS CRUD LOGIC
    // ══════════════════════════════════════════════════

    async function fetchAnnouncementsList() {
        const client = getDbClient();
        if (!client) {
            showAnnouncementsError('Database client unavailable.');
            return;
        }

        showAnnouncementsLoading();
        hideAnnouncementsError();

        try {
            const { data, error } = await client
                .from('announcements')
                .select('id, title, content, category, is_published, published_at, created_at, updated_at')
                .order('created_at', { ascending: false });

            if (error) throw error;

            announcementsList = data || [];
            announcementsLoadedOnce = true;
            renderAnnouncementsUI();

        } catch (err) {
            console.error('Failed to fetch announcements:', err);
            showAnnouncementsError('Unable to load announcements. Please check your connection and try again.');
        }
    }

    function showAnnouncementsLoading() {
        if (announcementsLoading) announcementsLoading.classList.add('show');
        if (announcementsEmpty) announcementsEmpty.style.display = 'none';
        if (announcementsBox) announcementsBox.style.display = 'none';
    }

    function hideAnnouncementsLoading() {
        if (announcementsLoading) announcementsLoading.classList.remove('show');
    }

    function showAnnouncementsError(msg) {
        hideAnnouncementsLoading();
        if (announcementsError) {
            announcementsError.classList.add('show');
            if (announcementsErrorText) announcementsErrorText.textContent = msg;
        }
        if (announcementsEmpty) announcementsEmpty.style.display = 'none';
        if (announcementsBox) announcementsBox.style.display = 'none';
    }

    function hideAnnouncementsError() {
        if (announcementsError) announcementsError.classList.remove('show');
    }

    function renderAnnouncementsUI() {
        hideAnnouncementsLoading();
        hideAnnouncementsError();

        if (!announcementsList || announcementsList.length === 0) {
            if (announcementsEmpty) announcementsEmpty.style.display = 'block';
            if (announcementsBox) announcementsBox.style.display = 'none';
            return;
        }

        if (announcementsEmpty) announcementsEmpty.style.display = 'none';
        if (announcementsBox) announcementsBox.style.display = 'block';

        // Render Desktop Table Rows
        if (announcementsTbody) {
            announcementsTbody.innerHTML = announcementsList.map(entry => {
                const title = escapeHtml(entry.title || 'Untitled');
                const content = escapeHtml(entry.content || '');
                const cat = escapeHtml(entry.category || 'General');
                const catClass = (entry.category || 'general').toLowerCase();
                const isPub = !!entry.is_published;
                const pubDate = entry.published_at ? formatDateTime(entry.published_at) : '—';
                const createdDate = formatDateTime(entry.created_at);
                const id = escapeHtml(entry.id);

                return `
                    <tr data-id="${id}">
                        <td>
                            <div class="course-cell">
                                <strong style="font-size: 0.88rem; color: #0f172a;">${title}</strong>
                                <span class="announcement-content-preview">${content}</span>
                            </div>
                        </td>
                        <td>
                            <span class="cat-pill ${catClass}">${cat}</span>
                        </td>
                        <td>
                            <span class="status-pill ${isPub ? 'published' : 'draft'}">
                                <i class="fa-solid ${isPub ? 'fa-circle-check' : 'fa-clock'}"></i>
                                ${isPub ? 'Published' : 'Draft'}
                            </span>
                        </td>
                        <td>
                            <span class="announcement-meta-date">${pubDate}</span>
                        </td>
                        <td>
                            <span class="announcement-meta-date">${createdDate}</span>
                        </td>
                        <td>
                            <div class="actions-wrap">
                                ${isPub ? `
                                    <button type="button" class="btn-action btn-action-toggle-publish unpublish" data-id="${id}" aria-label="Unpublish announcement">
                                        <i class="fa-solid fa-eye-slash"></i>
                                        <span>Unpublish</span>
                                    </button>
                                ` : `
                                    <button type="button" class="btn-action btn-action-toggle-publish publish" data-id="${id}" aria-label="Publish announcement">
                                        <i class="fa-solid fa-globe"></i>
                                        <span>Publish</span>
                                    </button>
                                `}
                                <button type="button" class="btn-action btn-action-ann-edit" data-id="${id}" aria-label="Edit announcement">
                                    <i class="fa-solid fa-pen-to-square"></i>
                                    <span>Edit</span>
                                </button>
                                <button type="button" class="btn-action btn-action-ann-delete" data-id="${id}" aria-label="Delete announcement">
                                    <i class="fa-solid fa-trash"></i>
                                    <span>Delete</span>
                                </button>
                            </div>
                        </td>
                    </tr>
                `;
            }).join('');
        }

        // Render Mobile Cards
        if (announcementsMobileCards) {
            announcementsMobileCards.innerHTML = announcementsList.map(entry => {
                const title = escapeHtml(entry.title || 'Untitled');
                const content = escapeHtml(entry.content || '');
                const cat = escapeHtml(entry.category || 'General');
                const catClass = (entry.category || 'general').toLowerCase();
                const isPub = !!entry.is_published;
                const pubDate = entry.published_at ? formatDateTime(entry.published_at) : '—';
                const createdDate = formatDateTime(entry.created_at);
                const id = escapeHtml(entry.id);

                return `
                    <div class="timetable-item-card" data-id="${id}">
                        <div class="card-top">
                            <div class="card-course-info" style="flex: 1;">
                                <h4 class="card-course-title" style="font-size: 0.94rem;">${title}</h4>
                                <div style="display: flex; gap: 6px; align-items: center; margin-top: 4px;">
                                    <span class="cat-pill ${catClass}">${cat}</span>
                                    <span class="status-pill ${isPub ? 'published' : 'draft'}">
                                        <i class="fa-solid ${isPub ? 'fa-circle-check' : 'fa-clock'}"></i>
                                        ${isPub ? 'Published' : 'Draft'}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <p style="font-size: 0.82rem; color: #475569; line-height: 1.5; margin: 4px 0 0;">${content}</p>
                        <div class="card-details" style="grid-template-columns: 1fr 1fr; margin-top: 6px;">
                            <div class="card-detail-item">
                                <span class="label">Published</span>
                                <span class="announcement-meta-date" style="font-size: 0.76rem;">${pubDate}</span>
                            </div>
                            <div class="card-detail-item">
                                <span class="label">Created</span>
                                <span class="announcement-meta-date" style="font-size: 0.76rem;">${createdDate}</span>
                            </div>
                        </div>
                        <div class="card-actions" style="flex-wrap: wrap;">
                            ${isPub ? `
                                <button type="button" class="btn-action btn-action-toggle-publish unpublish" data-id="${id}">
                                    <i class="fa-solid fa-eye-slash"></i> Unpublish
                                </button>
                            ` : `
                                <button type="button" class="btn-action btn-action-toggle-publish publish" data-id="${id}">
                                    <i class="fa-solid fa-globe"></i> Publish
                                </button>
                            `}
                            <button type="button" class="btn-action btn-action-ann-edit" data-id="${id}">
                                <i class="fa-solid fa-pen-to-square"></i> Edit
                            </button>
                            <button type="button" class="btn-action btn-action-ann-delete" data-id="${id}">
                                <i class="fa-solid fa-trash"></i> Delete
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }
    }

    if (retryAnnouncementsBtn) {
        retryAnnouncementsBtn.addEventListener('click', function () {
            fetchAnnouncementsList();
        });
    }

    function openAddAnnouncementModal() {
        currentEditingAnnouncementId = null;
        if (announcementModalTitle) announcementModalTitle.textContent = 'Add Announcement';
        if (btnSaveAnnouncementText) btnSaveAnnouncementText.textContent = 'Save Announcement';
        if (announcementFormAlert) { announcementFormAlert.style.display = 'none'; announcementFormAlert.textContent = ''; }
        if (announcementForm) announcementForm.reset();

        if (announcementIsPublished) announcementIsPublished.checked = true; // default to published per prompt

        if (announcementModal) announcementModal.classList.add('show');
        setTimeout(() => { if (announcementTitle) announcementTitle.focus(); }, 100);
    }

    function openEditAnnouncementModal(id) {
        const entry = announcementsList.find(e => e.id === id);
        if (!entry) {
            showToast('Selected announcement could not be found.', 'error');
            return;
        }

        currentEditingAnnouncementId = id;
        if (announcementModalTitle) announcementModalTitle.textContent = 'Edit Announcement';
        if (btnSaveAnnouncementText) btnSaveAnnouncementText.textContent = 'Update Announcement';
        if (announcementFormAlert) { announcementFormAlert.style.display = 'none'; announcementFormAlert.textContent = ''; }
        if (announcementForm) announcementForm.reset();

        if (announcementTitle) announcementTitle.value = entry.title || '';
        if (announcementCategory) announcementCategory.value = entry.category || 'General';
        if (announcementContent) announcementContent.value = entry.content || '';
        if (announcementIsPublished) announcementIsPublished.checked = !!entry.is_published;

        if (announcementModal) announcementModal.classList.add('show');
        setTimeout(() => { if (announcementTitle) announcementTitle.focus(); }, 100);
    }

    function closeAnnouncementModal() {
        if (announcementModal) announcementModal.classList.remove('show');
        currentEditingAnnouncementId = null;
        if (announcementFormAlert) { announcementFormAlert.style.display = 'none'; announcementFormAlert.textContent = ''; }
        if (announcementForm) announcementForm.reset();
    }

    function showAnnouncementFormAlert(msg) {
        if (announcementFormAlert) {
            announcementFormAlert.innerHTML = `<i class="fa-solid fa-circle-exclamation"></i><span>${escapeHtml(msg)}</span>`;
            announcementFormAlert.style.display = 'flex';
        }
    }

    async function handleAnnouncementFormSubmit(e) {
        e.preventDefault();
        if (isSavingAnnouncement) return;

        const title = (announcementTitle?.value || '').trim();
        const category = (announcementCategory?.value || '').trim();
        const content = (announcementContent?.value || '').trim();
        const isPublished = !!(announcementIsPublished?.checked);

        // Validation
        if (!title) {
            showAnnouncementFormAlert('Please enter an announcement title.');
            announcementTitle?.focus();
            return;
        }
        if (!category || !VALID_CATEGORIES.includes(category)) {
            showAnnouncementFormAlert('Please select a valid category.');
            announcementCategory?.focus();
            return;
        }
        if (!content) {
            showAnnouncementFormAlert('Please provide announcement content.');
            announcementContent?.focus();
            return;
        }

        const client = getDbClient();
        if (!client) {
            showAnnouncementFormAlert('Database connection unavailable.');
            return;
        }

        isSavingAnnouncement = true;
        if (btnSaveAnnouncement) btnSaveAnnouncement.disabled = true;
        if (btnSaveAnnouncementText) btnSaveAnnouncementText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Saving...';
        if (announcementFormAlert) announcementFormAlert.style.display = 'none';

        try {
            if (currentEditingAnnouncementId) {
                // Find existing entry
                const existing = announcementsList.find(e => e.id === currentEditingAnnouncementId);
                let publishedAt = existing ? existing.published_at : null;

                // When transitioning draft -> published: set published_at
                if (isPublished && !publishedAt) {
                    publishedAt = new Date().toISOString();
                }

                const { error } = await client
                    .from('announcements')
                    .update({
                        title: title,
                        category: category,
                        content: content,
                        is_published: isPublished,
                        published_at: isPublished ? publishedAt : existing?.published_at // preserve historical published_at
                    })
                    .eq('id', currentEditingAnnouncementId);

                if (error) throw error;
                showToast('Announcement updated successfully.', 'success');
            } else {
                // New announcement
                const publishedAt = isPublished ? new Date().toISOString() : null;

                const { error } = await client
                    .from('announcements')
                    .insert([{
                        title: title,
                        category: category,
                        content: content,
                        is_published: isPublished,
                        published_at: publishedAt
                    }]);

                if (error) throw error;
                showToast('Announcement created successfully.', 'success');
            }

            closeAnnouncementModal();
            await fetchAnnouncementsList();
            fetchDashboardData();

        } catch (err) {
            console.error('Failed to save announcement:', err);
            showAnnouncementFormAlert(err.message || 'Failed to save announcement. Please try again.');
        } finally {
            isSavingAnnouncement = false;
            if (btnSaveAnnouncement) btnSaveAnnouncement.disabled = false;
            if (btnSaveAnnouncementText) btnSaveAnnouncementText.textContent = currentEditingAnnouncementId ? 'Update Announcement' : 'Save Announcement';
        }
    }

    async function handleTogglePublish(id) {
        const entry = announcementsList.find(e => e.id === id);
        if (!entry) return;

        const client = getDbClient();
        if (!client) {
            showToast('Database connection unavailable.', 'error');
            return;
        }

        const willPublish = !entry.is_published;
        const publishedAt = willPublish ? (entry.published_at || new Date().toISOString()) : entry.published_at;

        try {
            const { error } = await client
                .from('announcements')
                .update({
                    is_published: willPublish,
                    published_at: publishedAt
                })
                .eq('id', id);

            if (error) throw error;

            showToast(willPublish ? 'Announcement published live.' : 'Announcement unpublished (moved to drafts).', 'success');
            await fetchAnnouncementsList();
            fetchDashboardData();

        } catch (err) {
            console.error('Failed to toggle publish status:', err);
            showToast(err.message || 'Failed to change publication status.', 'error');
        }
    }

    function openDeleteAnnouncementModal(id) {
        const entry = announcementsList.find(e => e.id === id);
        if (!entry) {
            showToast('Announcement not found.', 'error');
            return;
        }

        currentDeletingAnnouncementId = id;

        if (annDeleteConfirmMsg) {
            annDeleteConfirmMsg.innerHTML = `Delete announcement "<strong>${escapeHtml(entry.title)}</strong>"?`;
        }

        if (announcementDeleteModal) announcementDeleteModal.classList.add('show');
    }

    function closeDeleteAnnouncementModal() {
        if (announcementDeleteModal) announcementDeleteModal.classList.remove('show');
        currentDeletingAnnouncementId = null;
    }

    async function handleConfirmDeleteAnnouncement() {
        if (!currentDeletingAnnouncementId || isDeletingAnnouncement) return;

        const client = getDbClient();
        if (!client) {
            showToast('Database connection unavailable.', 'error');
            return;
        }

        isDeletingAnnouncement = true;
        if (btnConfirmDeleteAnnouncement) btnConfirmDeleteAnnouncement.disabled = true;
        if (btnDeleteAnnouncementText) btnDeleteAnnouncementText.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Deleting...';

        try {
            const { error } = await client
                .from('announcements')
                .delete()
                .eq('id', currentDeletingAnnouncementId);

            if (error) throw error;

            showToast('Announcement deleted successfully.', 'success');
            closeDeleteAnnouncementModal();
            await fetchAnnouncementsList();
            fetchDashboardData();

        } catch (err) {
            console.error('Failed to delete announcement:', err);
            showToast(err.message || 'Failed to delete announcement.', 'error');
        } finally {
            isDeletingAnnouncement = false;
            if (btnConfirmDeleteAnnouncement) btnConfirmDeleteAnnouncement.disabled = false;
            if (btnDeleteAnnouncementText) btnDeleteAnnouncementText.textContent = 'Delete Announcement';
        }
    }

    // ── Event Listeners for Timetable ──
    if (btnAddClass) btnAddClass.addEventListener('click', openAddModal);
    if (btnEmptyAddClass) btnEmptyAddClass.addEventListener('click', openAddModal);
    if (modalCloseBtn) modalCloseBtn.addEventListener('click', closeTimetableModal);
    if (modalCancelBtn) modalCancelBtn.addEventListener('click', closeTimetableModal);
    if (timetableForm) timetableForm.addEventListener('submit', handleFormSubmit);

    if (deleteModalCloseBtn) deleteModalCloseBtn.addEventListener('click', closeDeleteModal);
    if (deleteCancelBtn) deleteCancelBtn.addEventListener('click', closeDeleteModal);
    if (btnConfirmDelete) btnConfirmDelete.addEventListener('click', handleConfirmDelete);

    function handleTimetableActionClick(e) {
        const editBtn = e.target.closest('.btn-action-edit');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            if (id) openEditModal(id);
            return;
        }

        const deleteBtn = e.target.closest('.btn-action-delete');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            if (id) openDeleteModal(id);
            return;
        }
    }

    if (timetableTbody) timetableTbody.addEventListener('click', handleTimetableActionClick);
    if (timetableMobileCards) timetableMobileCards.addEventListener('click', handleTimetableActionClick);

    // ── Event Listeners for Announcements ──
    if (btnAddAnnouncement) btnAddAnnouncement.addEventListener('click', openAddAnnouncementModal);
    if (btnEmptyAddAnnouncement) btnEmptyAddAnnouncement.addEventListener('click', openAddAnnouncementModal);
    if (announcementModalCloseBtn) announcementModalCloseBtn.addEventListener('click', closeAnnouncementModal);
    if (announcementModalCancelBtn) announcementModalCancelBtn.addEventListener('click', closeAnnouncementModal);
    if (announcementForm) announcementForm.addEventListener('submit', handleAnnouncementFormSubmit);

    if (annDeleteModalCloseBtn) annDeleteModalCloseBtn.addEventListener('click', closeDeleteAnnouncementModal);
    if (annDeleteCancelBtn) annDeleteCancelBtn.addEventListener('click', closeDeleteAnnouncementModal);
    if (btnConfirmDeleteAnnouncement) btnConfirmDeleteAnnouncement.addEventListener('click', handleConfirmDeleteAnnouncement);

    function handleAnnouncementsActionClick(e) {
        const toggleBtn = e.target.closest('.btn-action-toggle-publish');
        if (toggleBtn) {
            const id = toggleBtn.getAttribute('data-id');
            if (id) handleTogglePublish(id);
            return;
        }

        const editBtn = e.target.closest('.btn-action-ann-edit');
        if (editBtn) {
            const id = editBtn.getAttribute('data-id');
            if (id) openEditAnnouncementModal(id);
            return;
        }

        const deleteBtn = e.target.closest('.btn-action-ann-delete');
        if (deleteBtn) {
            const id = deleteBtn.getAttribute('data-id');
            if (id) openDeleteAnnouncementModal(id);
            return;
        }
    }

    if (announcementsTbody) announcementsTbody.addEventListener('click', handleAnnouncementsActionClick);
    if (announcementsMobileCards) announcementsMobileCards.addEventListener('click', handleAnnouncementsActionClick);

    // ── Backdrop & Escape Key Closing ──
    if (timetableModal) {
        timetableModal.addEventListener('click', function (e) {
            if (e.target === timetableModal) closeTimetableModal();
        });
    }
    if (deleteModal) {
        deleteModal.addEventListener('click', function (e) {
            if (e.target === deleteModal) closeDeleteModal();
        });
    }
    if (announcementModal) {
        announcementModal.addEventListener('click', function (e) {
            if (e.target === announcementModal) closeAnnouncementModal();
        });
    }
    if (announcementDeleteModal) {
        announcementDeleteModal.addEventListener('click', function (e) {
            if (e.target === announcementDeleteModal) closeDeleteAnnouncementModal();
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            if (timetableModal && timetableModal.classList.contains('show')) closeTimetableModal();
            if (deleteModal && deleteModal.classList.contains('show')) closeDeleteModal();
            if (announcementModal && announcementModal.classList.contains('show')) closeAnnouncementModal();
            if (announcementDeleteModal && announcementDeleteModal.classList.contains('show')) closeDeleteAnnouncementModal();
        }
    });

    // ── Initialize dashboard ──
    async function initDashboard() {
        const client = getDbClient();
        if (!client) { redirectToLogin(); return; }

        try {
            const sessionResult = await client.auth.getSession();
            const session = sessionResult.data ? sessionResult.data.session : null;
            const sessionError = sessionResult.error;

            if (sessionError || !session || !session.user) {
                redirectToLogin();
                return;
            }

            const user = session.user;

            const profileResult = await client
                .from('profiles')
                .select('id, role')
                .eq('id', user.id)
                .maybeSingle();

            if (profileResult.error || !profileResult.data) {
                console.warn('Unauthorized: No profile row found for user');
                await client.auth.signOut();
                redirectToLogin();
                return;
            }

            const role = profileResult.data.role;
            if (role !== 'class_rep' && role !== 'admin') {
                console.warn('Unauthorized: Role is neither class_rep nor admin');
                await client.auth.signOut();
                redirectToLogin();
                return;
            }

            if (displayEmail) {
                displayEmail.textContent = user.email || 'Authenticated User';
            }

            const isAdmin = role === 'admin';
            const roleName = isAdmin ? 'Administrator' : 'Class Representative';

            if (displayRoleText) displayRoleText.textContent = roleName;

            if (displayRoleBadge) {
                displayRoleBadge.className = 'role-badge ' + (isAdmin ? 'admin' : 'class_rep');
            }

            if (infoRole) infoRole.textContent = roleName;

            if (navUsersItem) {
                navUsersItem.style.display = isAdmin ? 'block' : 'none';
            }

            if (dashboardBody) dashboardBody.classList.add('ready');

            fetchDashboardData();
            fetchCourseOptions();

            client.auth.onAuthStateChange(function (event, s) {
                if (event === 'SIGNED_OUT' || !s) {
                    redirectToLogin();
                }
            });

        } catch (err) {
            console.error('Dashboard init error:', err);
            redirectToLogin();
        }
    }

    if (headerLogoutBtn) headerLogoutBtn.addEventListener('click', handleLogout);

    initNavigation();

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
