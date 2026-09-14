// class-rep-dashboard.js
// Handles route protection, role verification, and logout for the dashboard placeholder

(function () {
    const dashboardBody = document.getElementById('dashboardBody');
    const displayEmail = document.getElementById('displayEmail');
    const displayRoleBadge = document.getElementById('displayRoleBadge');
    const displayRoleText = document.getElementById('displayRoleText');
    const statRoleTitle = document.getElementById('statRoleTitle');
    const headerLogoutBtn = document.getElementById('headerLogoutBtn');
    const footerLogoutBtn = document.getElementById('footerLogoutBtn');

    function getDbClient() {
        if (typeof window !== 'undefined' && window.db && window.db.auth) return window.db;
        if (typeof db !== 'undefined' && db && db.auth) return db;
        return null;
    }

    function redirectToLogin() {
        window.location.replace('class-rep-login.html');
    }

    async function handleLogout() {
        const client = getDbClient();
        if (!client) {
            redirectToLogin();
            return;
        }

        try {
            if (headerLogoutBtn) headerLogoutBtn.disabled = true;
            if (footerLogoutBtn) footerLogoutBtn.disabled = true;
            await client.auth.signOut();
        } catch (err) {
            console.error('Logout error:', err);
        } finally {
            redirectToLogin();
        }
    }

    async function initDashboard() {
        const client = getDbClient();
        if (!client) {
            redirectToLogin();
            return;
        }

        try {
            // 1. Check for active session
            const { data: { session }, error: sessionError } = await client.auth.getSession();

            if (sessionError || !session || !session.user) {
                redirectToLogin();
                return;
            }

            const user = session.user;

            // 2. Fetch profile & verify role
            const { data: profile, error: profileError } = await client
                .from('profiles')
                .select('id, role')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError || !profile) {
                console.warn('Unauthorized: No profile row found for user');
                await client.auth.signOut();
                redirectToLogin();
                return;
            }

            const role = profile.role;
            if (role !== 'class_rep' && role !== 'admin') {
                console.warn('Unauthorized: Role is neither class_rep nor admin');
                await client.auth.signOut();
                redirectToLogin();
                return;
            }

            // 3. User is authenticated & authorized. Render details:
            if (displayEmail) {
                displayEmail.textContent = user.email || 'Authenticated User';
            }

            const isRoleAdmin = role === 'admin';
            const roleName = isRoleAdmin ? 'Administrator' : 'Class Representative';

            if (displayRoleText) {
                displayRoleText.textContent = roleName;
            }

            if (displayRoleBadge) {
                displayRoleBadge.className = 'role-badge ' + (isRoleAdmin ? 'admin' : 'class_rep');
            }

            if (statRoleTitle) {
                statRoleTitle.textContent = roleName;
            }

            // Reveal the dashboard page
            if (dashboardBody) {
                dashboardBody.classList.add('ready');
            }

            // Listen for sign-out events from other tabs / sessions
            client.auth.onAuthStateChange((event, s) => {
                if (event === 'SIGNED_OUT' || !s) {
                    redirectToLogin();
                }
            });

        } catch (err) {
            console.error('Dashboard init error:', err);
            redirectToLogin();
        }
    }

    // Attach logout handlers
    if (headerLogoutBtn) headerLogoutBtn.addEventListener('click', handleLogout);
    if (footerLogoutBtn) footerLogoutBtn.addEventListener('click', handleLogout);

    // Initialize on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initDashboard);
    } else {
        initDashboard();
    }
})();
