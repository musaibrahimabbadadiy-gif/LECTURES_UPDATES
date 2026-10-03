// class-rep-login.js
// Handles authentication and role verification for Class Reps and Admins

(function () {
    const loginForm = document.getElementById('loginForm');
    const emailInput = document.getElementById('emailInput');
    const passwordInput = document.getElementById('passwordInput');
    const submitBtn = document.getElementById('submitBtn');
    const submitBtnText = document.getElementById('submitBtnText');
    const submitBtnIcon = document.getElementById('submitBtnIcon');
    const errorMessage = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');

    function getDbClient() {
        if (typeof window !== 'undefined' && window.db && window.db.auth) return window.db;
        if (typeof db !== 'undefined' && db && db.auth) return db;
        return null;
    }

    function showError(msg) {
        if (errorText) errorText.textContent = msg;
        if (errorMessage) errorMessage.classList.add('show');
    }

    function hideError() {
        if (errorMessage) errorMessage.classList.remove('show');
        if (errorText) errorText.textContent = '';
    }

    function setLoading(isLoading) {
        if (!submitBtn) return;
        submitBtn.disabled = isLoading;
        if (isLoading) {
            submitBtnText.textContent = 'Signing in...';
            submitBtnIcon.className = 'spinner';
        } else {
            submitBtnText.textContent = 'Sign In';
            submitBtnIcon.className = 'fa-solid fa-arrow-right';
        }
    }

    // Check if user is already authenticated with an authorized role
    async function checkExistingSession() {
        const client = getDbClient();
        if (!client) return;

        try {
            const { data: { session }, error } = await client.auth.getSession();
            if (error || !session || !session.user) {
                return;
            }

            const { data: profile, error: profileError } = await client
                .from('profiles')
                .select('id, role')
                .eq('id', session.user.id)
                .maybeSingle();

            if (!profileError && profile && (profile.role === 'class_rep' || profile.role === 'admin')) {
                // Already authenticated & authorized
                window.location.replace('class-rep-dashboard.html');
            } else {
                // Active session exists but not authorized; clear it
                await client.auth.signOut();
            }
        } catch (err) {
            console.error('Session check error:', err);
        }
    }

    // Form submit handler
    async function handleLogin(e) {
        e.preventDefault();
        hideError();

        const email = emailInput ? emailInput.value.trim() : '';
        const password = passwordInput ? passwordInput.value : '';

        if (!email || !password) {
            showError('Please enter both your email address and password.');
            return;
        }

        const client = getDbClient();
        if (!client) {
            showError('Database connection unavailable. Please refresh and try again.');
            return;
        }

        setLoading(true);

        try {
            // 1. Authenticate with Supabase Auth (passwords are never logged)
            const { data: authData, error: authError } = await client.auth.signInWithPassword({
                email,
                password
            });

            if (authError) {
                setLoading(false);
                if (authError.message && authError.message.toLowerCase().includes('invalid login credentials')) {
                    showError('Invalid email or password. Access is restricted to authorized personnel.');
                } else {
                    showError(authError.message || 'Unable to sign in. Please try again.');
                }
                return;
            }

            const user = authData?.user;
            if (!user) {
                setLoading(false);
                showError('Authentication failed. No user found.');
                return;
            }

            // 2. Verify user role from public.profiles
            const { data: profile, error: profileError } = await client
                .from('profiles')
                .select('id, role')
                .eq('id', user.id)
                .maybeSingle();

            if (profileError || !profile) {
                // Profile not found: sign out and deny access
                await client.auth.signOut();
                setLoading(false);
                showError('Account not authorized. No profile record found.');
                return;
            }

            const role = profile.role;
            if (role !== 'class_rep' && role !== 'admin') {
                // Unauthorized role: sign out immediately
                await client.auth.signOut();
                setLoading(false);
                showError('Access denied. Only Class Representatives and Admins may access this portal.');
                return;
            }

            // 3. Authorized -> redirect to dashboard
            window.location.replace('class-rep-dashboard.html');
        } catch (err) {
            setLoading(false);
            console.error('Sign-in error:', err);
            showError('A network or server error occurred. Please try again.');
        }
    }

    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }

    // Run session check on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', checkExistingSession);
    } else {
        checkExistingSession();
    }
})();
