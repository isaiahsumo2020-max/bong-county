    // ─────────────────────────────────────────
    //  SUPABASE
    // ─────────────────────────────────────────
    const SUPABASE_URL = 'https://choagncxtmsewzvxoncx.supabase.co';
    const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNob2FnbmN4dG1zZXd6dnhvbmN4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMzk3NjUsImV4cCI6MjA5MzkxNTc2NX0.hVPjF0_b-5DTXMzeFUPYZ82tL27CrsFBIUQrm-XYonE';
    const { createClient } = supabase;
    const sb = createClient(SUPABASE_URL, SUPABASE_ANON);

    // ─────────────────────────────────────────
    //  STATE
    // ─────────────────────────────────────────
    let selectedRole = 'contributor';
    let selectedCounty = null;
    let selectedContributorKind = null;
    let selectedIndividualCategory = null;
    let selectedPhone = null;
    // let phoneVerified = false;  // TODO: OTP phase 2
    // let otpSessionId = null;    // TODO: OTP phase 2
    let lastRegEmail = '';

    // ─────────────────────────────────────────
    //  INIT — load counties into select + check session
    // ─────────────────────────────────────────
    async function init() {
      // Check for return URL in query params
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('return');

      // If user is already logged in, redirect to dashboard or return URL
      const { data: { session } } = await sb.auth.getSession();
      if (session) {
        if (returnUrl) {
          window.location.href = returnUrl;
        } else {
          redirectAfterLogin(session.user);
        }
        return;
      }

      // Load counties for the register dropdown
      const sel = document.getElementById('reg-county');
      let hasLoadedCounties = false;
      
      try {
        const { data, error } = await sb
          .from('counties')
          .select('id, name, slug')
          .order('name');

        if (!error && data && data.length > 0) {
          hasLoadedCounties = true;
          data.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.textContent = c.name;
            opt.setAttribute('data-county-name', c.name); // Store name as data attribute
            sel.appendChild(opt);
          });
          console.log('✓ Successfully loaded', data.length, 'counties from database');
        } else if (error) {
          console.warn('⚠ Error loading counties:', error.message);
        }
      } catch (err) {
        console.warn('⚠ Exception loading counties:', err.message);
      }

      // If no counties loaded successfully, use fallback
      if (!hasLoadedCounties) {
        console.log('ℹ Using fallback counties - database connection may be unavailable');
        // Define fallback counties with consistent IDs (using county name as fallback ID for lookup)
        const fallback = [
          { name: 'Bong County', fallbackId: 'bong' },
          { name: 'Bomi County', fallbackId: 'bomi' },
          { name: 'Gbarpolu County', fallbackId: 'gbarpolu' },
          { name: 'Grand Bassa County', fallbackId: 'grand-bassa' },
          { name: 'Grand Cape Mount County', fallbackId: 'grand-cape-mount' },
          { name: 'Grand Gedeh County', fallbackId: 'grand-gedeh' },
          { name: 'Grand Kru County', fallbackId: 'grand-kru' },
          { name: 'Lofa County', fallbackId: 'lofa' },
          { name: 'Margibi County', fallbackId: 'margibi' },
          { name: 'Maryland County', fallbackId: 'maryland' },
          { name: 'Montserrado County', fallbackId: 'montserrado' },
          { name: 'Nimba County', fallbackId: 'nimba' },
          { name: 'River Cess County', fallbackId: 'river-cess' },
          { name: 'River Gee County', fallbackId: 'river-gee' },
          { name: 'Sinoe County', fallbackId: 'sinoe' }
        ];
        fallback.forEach(c => {
          const opt = document.createElement('option');
          opt.value = c.fallbackId; // Use consistent fallback ID
          opt.textContent = c.name;
          opt.setAttribute('data-county-name', c.name);
          opt.setAttribute('data-fallback', 'true');
          sel.appendChild(opt);
        });
      }
    }

    // ─────────────────────────────────────────
    //  REDIRECT after login based on role
    // ─────────────────────────────────────────
    async function redirectAfterLogin(user) {
      // Check for return URL in query params
      const params = new URLSearchParams(window.location.search);
      const returnUrl = params.get('return');

      if (returnUrl) {
        // If there's a specific return URL, use it
        window.location.href = returnUrl;
        return;
      }

      // Otherwise, redirect based on role
      const { data: profile } = await sb
        .from('users')
        .select('role, county_id')
        .eq('id', user.id)
        .single();

      if (!profile) {
        window.location.href = '../index-page/index.html';
        return;
      }
      if (profile.role === 'super_admin' || profile.role === 'county_admin') {
        window.location.href = '../superadmin/superadmin.html';
      } else if (profile.role === 'contributor') {
        window.location.href = '../dashboard-page/dashboard.html';
      } else {
        window.location.href = '../index-page/index.html';
      }
    }

    // ─────────────────────────────────────────
    //  TAB SWITCHER
    // ─────────────────────────────────────────
    function switchTab(tab) {
      document.querySelectorAll('.auth-tab').forEach((t, i) => {
        t.classList.toggle('active', (tab === 'login' ? i === 0 : i === 1));
      });
      document.getElementById('panel-login').classList.toggle('active', tab === 'login');
      document.getElementById('panel-register').classList.toggle('active', tab === 'register');
      clearAlerts();
    }

    // ─────────────────────────────────────────
    //  ROLE SELECTION
    // ─────────────────────────────────────────
    function selectRole(role) {
      selectedRole = role;
      document.querySelectorAll('.role-card').forEach(c => c.classList.remove('selected'));
      document.getElementById('role-' + role).classList.add('selected');
    }

    // ─────────────────────────────────────────
    //  CONTRIBUTOR KIND CHANGE
    //  Show/hide conditional fields based on selection
    // ─────────────────────────────────────────
    function onContributorKindChange() {
      const kind = document.getElementById('reg-contributor-kind').value;
      selectedContributorKind = kind;

      // Show/hide individual category
      const individualGroup = document.getElementById('individual-category-group');
      if (kind === 'individual') {
        individualGroup.style.display = 'block';
      } else {
        individualGroup.style.display = 'none';
        document.getElementById('reg-individual-category').value = '';
      }

      // Show/hide organization fields
      const orgGroup = document.getElementById('organization-fields-group');
      if (kind && kind !== 'individual') {
        orgGroup.style.display = 'block';
      } else {
        orgGroup.style.display = 'none';
        document.getElementById('reg-organization-name').value = '';
        document.getElementById('reg-institution-type').value = '';
        document.getElementById('reg-organization-description').value = '';
        document.getElementById('reg-website-url').value = '';
      }
    }

    // ─────────────────────────────────────────
    //  REGISTER — MULTI-STEP
    // ─────────────────────────────────────────
    function regNext(from) {
      clearAlerts();
      if (from === 1) {
        // Step 1: Validate county selection
        const county = document.getElementById('reg-county').value;
        if (!county) {
          showFieldErr('reg-county-err', 'Please select your county');
          return;
        }
        selectedCounty = county;
        showStep(2);
      } else if (from === 2) {
        // Step 2: Validate contributor kind and conditional fields
        const kind = document.getElementById('reg-contributor-kind').value;
        if (!kind) {
          showFieldErr('reg-contributor-kind-err', 'Please select your contributor type');
          return;
        }
        selectedContributorKind = kind;

        // Validate individual category if individual
        if (kind === 'individual') {
          const category = document.getElementById('reg-individual-category').value;
          if (!category) {
            showFieldErr('reg-individual-category-err', 'Please select a category');
            return;
          }
          selectedIndividualCategory = category;
        } else {
          // Validate organization fields if not individual
          const orgName = document.getElementById('reg-organization-name').value.trim();
          const instType = document.getElementById('reg-institution-type').value.trim();
          if (!orgName) {
            showFieldErr('reg-organization-name-err', 'Please enter your organization name');
            return;
          }
          if (!instType) {
            showFieldErr('reg-institution-type-err', 'Please enter your institution type');
            return;
          }
        }
        showStep(3);
      } else if (from === 3) {
        // Step 3: Validate personal info including phone
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const phone = document.getElementById('reg-phone').value.trim();

        if (!name) { showFieldErr('reg-name-err', 'Please enter your full name'); return; }
        if (!email || !email.includes('@')) { showFieldErr('reg-email-err', 'Please enter a valid email'); return; }

        // Validate phone number
        const phoneValidation = validateLiberianPhone(phone);
        if (!phoneValidation.valid) {
          showFieldErr('reg-phone-err', phoneValidation.error);
          return;
        }

        // Store the international format phone number
        selectedPhone = phoneValidation.international;

        showStep(4);
      }
    }

    function regBack(to) {
      clearAlerts();
      showStep(to);
    }

    function showStep(n) {
      [1, 2, 3, 4].forEach(i => {
        const el = document.getElementById('reg-step-' + i);
        if (el) el.style.display = i === n ? 'block' : 'none';
        const dot = document.getElementById('step-' + i);
        if (dot) {
          dot.classList.toggle('active', i === n);
          dot.classList.toggle('done', i < n);
        }
      });
      // Step 5 is hidden (OTP - to be implemented later)
    }

    // ─────────────────────────────────────────
    //  PHONE VALIDATION & OTP VERIFICATION
    // ─────────────────────────────────────────

    /**
     * Validates and converts Liberian phone number to international format
     * Accepts: 077-123-4567, 077 123 4567, 0771234567, 771234567, +231771234567
     * Valid prefixes: 077, 088, 055
     * Returns: { valid: boolean, international: string, error: string }
     */
    function validateLiberianPhone(phone) {
      if (!phone || !phone.trim()) {
        return { valid: false, error: 'Phone number is required' };
      }

      // Remove all non-digit characters except leading +
      let cleaned = phone.replace(/[\s\-()]/g, '');

      // Handle if user includes +231
      if (cleaned.startsWith('+231')) {
        cleaned = cleaned.substring(4);
      } else if (cleaned.startsWith('231')) {
        cleaned = cleaned.substring(3);
      }

      // Remove leading 0 if present
      if (cleaned.startsWith('0')) {
        cleaned = cleaned.substring(1);
      }

      // Validate length (should be 9 digits after country code)
      if (cleaned.length !== 9) {
        return { valid: false, error: 'Phone number must be 9 digits' };
      }

      // Validate it's all digits
      if (!/^\d+$/.test(cleaned)) {
        return { valid: false, error: 'Phone number must contain only digits' };
      }

      // Validate Liberian prefix (077, 088, 055, 066, 099)
      const validPrefixes = ['77', '88', '55', '66', '99'];

      const prefix = cleaned.substring(0, 2);

      if (!validPrefixes.includes(prefix)) {
        return {
          valid: false,
          error: 'Invalid Liberian mobile number'
        };
      }

      // Convert to international format: +231XXXXXXXXX
      const international = '+231' + cleaned;

      return { valid: true, international };
    }

    // TODO: OTP Functions - To be implemented later
    /*
    async function sendPhoneOtp() {
      try {
        if (!selectedPhone) {
          showAlert('reg-step5-alert', 'error', 'Phone number not set');
          return false;
        }

        const { data, error } = await sb.auth.signInWithOtp({
          phone: selectedPhone,
          options: {}
        });

        if (error) {
          showAlert('reg-step5-alert', 'error', 'Failed to send OTP: ' + error.message);
          return false;
        }

        otpSessionId = data?.session?.id || null;
        const masked = '+231***' + selectedPhone.slice(-4);
        document.getElementById('phone-display').textContent = masked;
        startResendTimer();
        return true;
      } catch (err) {
        console.error('Error sending OTP:', err);
        showAlert('reg-step5-alert', 'error', 'Error sending OTP. Please try again.');
        return false;
      }
    }

    async function verifyPhoneOtp() {
      const otp = document.getElementById('reg-otp').value.trim();
      if (!otp || otp.length !== 6) {
        showFieldErr('reg-otp-err', 'Please enter a 6-digit code');
        return;
      }
      if (!/^\d+$/.test(otp)) {
        showFieldErr('reg-otp-err', 'Code must contain only digits');
        return;
      }
      setLoading('verifyPhoneBtn', true);
      try {
        const { data, error } = await sb.auth.verifyOtp({
          phone: selectedPhone,
          token: otp,
          type: 'sms'
        });
        setLoading('verifyPhoneBtn', false);
        if (error) {
          showFieldErr('reg-otp-err', 'Invalid code. Please try again.');
          return;
        }
        phoneVerified = true;
        await completeRegistration();
      } catch (err) {
        console.error('Error verifying OTP:', err);
        showFieldErr('reg-otp-err', 'Verification failed. Please try again.');
        setLoading('verifyPhoneBtn', false);
      }
    }

    async function resendPhoneOtp() {
      document.getElementById('resend-otp-btn').style.display = 'none';
      const timerDiv = document.getElementById('resend-timer');
      timerDiv.textContent = 'Sending...';
      const result = await sendPhoneOtp();
      if (!result) {
        document.getElementById('resend-otp-btn').style.display = 'flex';
      }
    }

    function startResendTimer() {
      const resendBtn = document.getElementById('resend-otp-btn');
      const timerDiv = document.getElementById('resend-timer');
      let seconds = 60;
      resendBtn.style.display = 'none';
      timerDiv.textContent = 'Resend code in ' + seconds + 's';
      const interval = setInterval(() => {
        seconds--;
        if (seconds <= 0) {
          clearInterval(interval);
          resendBtn.style.display = 'flex';
          timerDiv.textContent = '';
        } else {
          timerDiv.textContent = 'Resend code in ' + seconds + 's';
        }
      }, 1000);
    }
    */

    // ─────────────────────────────────────────
    //  HANDLE REGISTER - Step 4 completion
    // ─────────────────────────────────────────
    async function handleRegister() {
      clearAlerts();

      const name     = document.getElementById('reg-name').value.trim();
      const email    = document.getElementById('reg-email').value.trim();
      const bio      = document.getElementById('reg-bio').value.trim();
      const password = document.getElementById('reg-password').value;
      const confirm  = document.getElementById('reg-confirm').value;
      const agreed   = document.getElementById('agree-terms').checked;

      // Validate password
      if (password.length < 8) {
        showFieldErr('reg-pw-err', 'Password must be at least 8 characters');
        return;
      }
      if (password !== confirm) {
        showFieldErr('reg-confirm-err', 'Passwords do not match');
        return;
      }
      if (!agreed) {
        showAlert('reg-step4-alert', 'error', 'Please accept the terms to continue');
        return;
      }

      setLoading('registerBtn', true);

      // Get county name for reference
      const countySelect = document.getElementById('reg-county');
      const countyName = countySelect.options[countySelect.selectedIndex]?.getAttribute('data-county-name') || null;

      // Sign up via Supabase Auth
      const { data, error } = await sb.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name:  name,
            role:       selectedRole,
            county_id:  selectedCounty && !selectedCounty.startsWith('fallback') ? selectedCounty : null,
            county_name: countyName, // Store county name as reference
            phone:      selectedPhone
          },
          emailRedirectTo: window.location.origin + '../auth-page/auth.html'
        }
      });

      setLoading('registerBtn', false);

      if (error) {
        showAlert('reg-step4-alert', 'error', error.message);
        return;
      }

      // Prepare data for users table upsert
      let userData = {
        id:        data.user.id,
        email:     email,
        phone:     selectedPhone || null,
        phone_verified: false,  // TODO: Implement OTP verification later
        full_name: name,
        bio:       bio || null,
        role:      selectedRole,
        county_id: selectedCounty && !selectedCounty.startsWith('fallback')
          ? selectedCounty
          : null,
        county_name: countyName, // Store county name as backup reference
        contributor_kind: selectedContributorKind,
        profile_visibility: 'public'
      };

      // Add individual or organization data
      if (selectedContributorKind === 'individual') {
        userData.individual_category = selectedIndividualCategory;
      } else {
        userData.organization_name = document.getElementById('reg-organization-name').value.trim();
        userData.institution_type = document.getElementById('reg-institution-type').value.trim();
        userData.organization_description = document.getElementById('reg-organization-description').value.trim() || null;
        userData.website_url = document.getElementById('reg-website-url').value.trim() || null;
      }

      // Update the users table with extra info
      if (data.user) {
        try {
          const { error: updateError } = await sb.from('users').upsert(userData);
          if (updateError) {
            console.error('Error updating user profile:', updateError);
          } else {
            console.log('✓ User profile saved with county_id:', userData.county_id);
          }
        } catch (err) {
          console.error('Exception updating user profile:', err);
        }
      }

      lastRegEmail = email;
      showVerifyScreen(email);
    }

    // ─────────────────────────────────────────
    //  PHONE OTP VERIFICATION - COMMENTED OUT (TODO: Implement later)
    // ─────────────────────────────────────────
    
    /*
    // Store password temporarily during signup flow
    let registrationPassword = null;

    // Complete registration after phone OTP verification
    async function completeRegistration() {
      try {
        const name = document.getElementById('reg-name').value.trim();
        const email = document.getElementById('reg-email').value.trim();
        const bio = document.getElementById('reg-bio').value.trim();
        const password = registrationPassword;

        setLoading('verifyPhoneBtn', true);

        // Sign up with email and password
        const { data, error } = await sb.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: name,
              role: selectedRole,
              county_id: selectedCounty,
              phone: selectedPhone
            },
            emailRedirectTo: window.location.origin + '../auth-page/auth.html'
          }
        });

        if (error) {
          showAlert('reg-step5-alert', 'error', 'Signup failed: ' + error.message);
          setLoading('verifyPhoneBtn', false);
          return;
        }

        // Prepare data for users table upsert
        let userData = {
          id: data.user.id,
          email: email,
          phone: selectedPhone,
          phone_verified: true,
          full_name: name,
          bio: bio || null,
          role: selectedRole,
          county_id: selectedCounty && !selectedCounty.startsWith('fallback')
            ? selectedCounty
            : null,
          contributor_kind: selectedContributorKind,
          profile_visibility: 'public'
        };

        // Add individual or organization data
        if (selectedContributorKind === 'individual') {
          userData.individual_category = selectedIndividualCategory;
        } else {
          userData.organization_name = document.getElementById('reg-organization-name').value.trim();
          userData.institution_type = document.getElementById('reg-institution-type').value.trim();
          userData.organization_description = document.getElementById('reg-organization-description').value.trim() || null;
          userData.website_url = document.getElementById('reg-website-url').value.trim() || null;
        }

        // Update the users table with all info including phone
        const { error: updateError } = await sb.from('users').upsert(userData);
        if (updateError) {
          console.error('Error updating user profile:', updateError);
        }

        setLoading('verifyPhoneBtn', false);
        lastRegEmail = email;
        showVerifyScreen(email);
      } catch (err) {
        console.error('Error completing registration:', err);
        showAlert('reg-step5-alert', 'error', 'Registration error: ' + err.message);
        setLoading('verifyPhoneBtn', false);
      }
    }
    */

    // ─────────────────────────────────────────
    //  HANDLE LOGIN
    // ─────────────────────────────────────────
    async function handleLogin(e) {
      e.preventDefault();
      clearAlerts();

      const email = document.getElementById('login-email').value.trim();
      const password = document.getElementById('login-password').value;

      if (!email) { showFieldErr('login-email-err', 'Please enter your email'); return; }
      if (!password) { return; }

      setLoading('loginBtn', true);

      const { data, error } = await sb.auth.signInWithPassword({ email, password });

      setLoading('loginBtn', false);

      if (error) {
        const msg = error.message === 'Invalid login credentials'
          ? 'Incorrect email or password. Please try again.'
          : error.message === 'Email not confirmed'
            ? 'Please verify your email before signing in. Check your inbox.'
            : error.message;
        showAlert('login-alert', 'error', msg);
        document.getElementById('login-password').classList.add('error');
        return;
      }

      // Redirect based on role
      redirectAfterLogin(data.user);
    }

    // ─────────────────────────────────────────
    //  FORGOT PASSWORD
    // ─────────────────────────────────────────
    function showReset() {
      document.getElementById('mainAuth').style.display = 'none';
      document.getElementById('resetPanel').style.display = 'block';
    }

    function hideReset() {
      document.getElementById('mainAuth').style.display = 'block';
      document.getElementById('resetPanel').style.display = 'none';
      clearAlerts();
    }

    async function handleReset() {
      clearAlerts();
      const email = document.getElementById('reset-email').value.trim();
      if (!email || !email.includes('@')) {
        showAlert('reset-alert-err', 'error', 'Please enter a valid email address');
        return;
      }

      setLoading('resetBtn', true);

      const { error } = await sb.auth.resetPasswordForEmail(email, {
        redirectTo: window.location.origin + '../auth-page/auth.html?type=recovery'
      });

      setLoading('resetBtn', false);

      if (error) {
        showAlert('reset-alert-err', 'error', error.message);
        return;
      }

      showAlert('reset-alert-ok', 'success',
        `Reset link sent to ${email}. Check your inbox and spam folder.`);
      document.getElementById('reset-email').value = '';
    }

    // ─────────────────────────────────────────
    //  VERIFY SCREEN
    // ─────────────────────────────────────────
    function showVerifyScreen(email) {
      document.getElementById('mainAuth').style.display = 'none';
      document.getElementById('resetPanel').style.display = 'none';
      document.getElementById('verifyPanel').style.display = 'block';
      document.getElementById('verify-email-display').textContent = email;
    }

    async function resendVerification() {
      if (!lastRegEmail) return;
      const { error } = await sb.auth.resend({
        type: 'signup',
        email: lastRegEmail
      });
      if (!error) {
        alert('Verification email resent! Check your inbox.');
      }
    }

    function showMain() {
      document.getElementById('verifyPanel').style.display = 'none';
      document.getElementById('mainAuth').style.display = 'block';
      switchTab('login');
    }

    // ─────────────────────────────────────────
    //  PASSWORD STRENGTH
    // ─────────────────────────────────────────
    function checkStrength(pw) {
      const fill = document.getElementById('strength-fill');
      const text = document.getElementById('strength-text');
      let score = 0;

      if (pw.length >= 8) score++;
      if (/[A-Z]/.test(pw)) score++;
      if (/[0-9]/.test(pw)) score++;
      if (/[^A-Za-z0-9]/.test(pw)) score++;

      const configs = [
        { pct: '0%', color: 'transparent', label: '' },
        { pct: '25%', color: '#ef4444', label: 'Weak' },
        { pct: '50%', color: '#f97316', label: 'Fair' },
        { pct: '75%', color: '#eab308', label: 'Good' },
        { pct: '100%', color: '#22c55e', label: 'Strong ✓' },
      ];

      const cfg = configs[score] || configs[0];
      fill.style.width = cfg.pct;
      fill.style.background = cfg.color;
      text.textContent = cfg.label;
      text.style.color = cfg.color;
    }

    // ─────────────────────────────────────────
    //  UTILITIES
    // ─────────────────────────────────────────
    function togglePw(id, btn) {
      const inp = document.getElementById(id);
      inp.type = inp.type === 'password' ? 'text' : 'password';
      btn.textContent = inp.type === 'password' ? '👁' : '🙈';
    }

    function setLoading(btnId, loading) {
      const btn = document.getElementById(btnId);
      if (!btn) return;
      btn.disabled = loading;
      btn.classList.toggle('loading', loading);
    }

    function showAlert(id, type, msg) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = msg;
      el.className = `alert alert-${type} show`;
    }

    function showFieldErr(id, msg) {
      const el = document.getElementById(id);
      if (!el) return;
      el.textContent = msg;
      el.classList.add('show');
    }

    function clearAlerts() {
      document.querySelectorAll('.alert').forEach(a => a.classList.remove('show'));
      document.querySelectorAll('.field-error').forEach(e => e.classList.remove('show'));
      document.querySelectorAll('.form-input').forEach(i => {
        i.classList.remove('error', 'success');
      });
    }

    // ─────────────────────────────────────────
    //  CHECK FOR PASSWORD RECOVERY REDIRECT
    //  Supabase redirects back here with a hash
    // ─────────────────────────────────────────
    async function checkRecoveryMode() {
      const hash = window.location.hash;
      if (hash.includes('type=recovery') || new URLSearchParams(window.location.search).get('type') === 'recovery') {
        // Show a new password form
        document.getElementById('mainAuth').innerHTML = `
          <div class="form-title">Set New Password</div>
          <div class="form-subtitle">Choose a strong new password for your account.</div>
          <div class="alert alert-error"   id="np-err"></div>
          <div class="alert alert-success" id="np-ok"></div>
          <div class="input-group">
            <label class="input-label">New Password</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input id="new-pw" type="password" class="form-input" placeholder="Min 8 characters"
                oninput="checkStrength(this.value)" />
              <button type="button" class="pw-toggle" onclick="togglePw('new-pw',this)">👁</button>
            </div>
            <div class="strength-bar"><div class="strength-fill" id="strength-fill"></div></div>
            <div class="strength-text" id="strength-text"></div>
          </div>
          <div class="input-group">
            <label class="input-label">Confirm New Password</label>
            <div class="input-wrap">
              <span class="input-icon">🔒</span>
              <input id="new-pw-confirm" type="password" class="form-input" placeholder="Repeat password" />
            </div>
          </div>
          <button class="btn-primary" id="newPwBtn" onclick="submitNewPassword()">
            <div class="spinner"></div>
            <span class="btn-text">Update Password →</span>
          </button>
        `;
      }
    }

    async function submitNewPassword() {
      const pw = document.getElementById('new-pw').value;
      const confirm = document.getElementById('new-pw-confirm').value;
      if (pw.length < 8) { showAlert('np-err', 'error', 'Password must be at least 8 characters'); return; }
      if (pw !== confirm) { showAlert('np-err', 'error', 'Passwords do not match'); return; }
      setLoading('newPwBtn', true);
      const { error } = await sb.auth.updateUser({ password: pw });
      setLoading('newPwBtn', false);
      if (error) { showAlert('np-err', 'error', error.message); return; }
      showAlert('np-ok', 'success', 'Password updated! Redirecting to sign in...');
      setTimeout(() => { window.location.href = '../auth-page/auth.html'; }, 2000);
    }

    // ─────────────────────────────────────────
    //  BOOT
    // ─────────────────────────────────────────
    checkRecoveryMode();
    init();