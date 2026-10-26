(function (window) {
  var STORAGE_KEY = 'mytyson_session_v1';
  var CUSTOM_KEY_PREFIX = 'mytyson_profile_custom_';
  var THEME_KEY = 'tyson_active_theme';

  var DEFAULT_ACCOUNTS = [
    {
      name: 'Stephen French',
      username: 'flame@tysonmediagroup.org',
      slug: 'flame',
      aliases: ['flame@tysonmediagroup.org', 'flame'],
      password: 'hug',
      team: 'Y',
      badge: 'TYSON Team',
      badgeClass: 'badge-team',
      hasTysonBadge: true,
      initials: 'SF',
      avatarBg: 'linear-gradient(135deg, #991b1b 0%, #450a0a 100%)',
      coverBg: 'linear-gradient(125deg, #1a0505 0%, #3b0a0a 45%, #09090b 100%)',
      defaultCoverUrl: '/assets/tyson-t5s-login-backdrop.jpg',
      role: 'TYSON Team Member',
      division: 'TYSON Atlantis / Creative Direction',
      bio: 'Official myTYSON profile for Stephen French.'
    },
    {
      name: 'Tyler Custine',
      username: 't@tysonmediagroup.org',
      slug: 't',
      aliases: ['t@tysonmediagroup.org', 't', 'ty', 'ty@tysonmediagroup.org'],
      password: 'hug',
      team: 'Y',
      badge: 'TYSON Team',
      badgeClass: 'badge-team',
      hasTysonBadge: true,
      initials: 'TC',
      avatarBg: 'linear-gradient(135deg, #b91c1c 0%, #111827 100%)',
      coverBg: 'linear-gradient(125deg, #2a0808 0%, #111827 55%, #09090b 100%)',
      defaultCoverUrl: '/assets/atlantis-sunset.jpg',
      role: 'Founder & Executive Lead',
      division: 'TYSON Media Group / Core Systems',
      bio: 'Official myTYSON profile for Tyler Custine.'
    },
    {
      name: 'TYSON Media Group',
      username: 'tyson@tysonmediagroup.org',
      loginId: 'tyson',
      slug: 'tyson',
      aliases: ['tyson', 'tyson@tysonmediagroup.org'],
      password: '102280919TYSONMediaGroup1234',
      team: 'Official TYSON Account',
      badge: 'Official TYSON Account',
      badgeClass: 'badge-official',
      hasTysonBadge: true,
      initials: 'TMG',
      avatarBg: 'linear-gradient(135deg, #d97706 0%, #451a03 100%)',
      coverBg: 'linear-gradient(125deg, #2e1905 0%, #18181b 55%, #09090b 100%)',
      defaultCoverUrl: '/assets/tyson-t5s-login-backdrop.jpg',
      role: 'Primary Organization Account',
      division: 'TYSON Media Group',
      bio: 'Official organization profile for TYSON Media Group.'
    },
    {
      name: 'Ash French',
      username: 'a@tysonmediagroup.org',
      slug: 'a',
      aliases: ['a@tysonmediagroup.org', 'a'],
      password: 'AshFrench',
      team: 'Y',
      badge: 'TYSON Team',
      badgeClass: 'badge-team',
      hasTysonBadge: true,
      initials: 'AF',
      avatarBg: 'linear-gradient(135deg, #7f1d1d 0%, #1e1b4b 100%)',
      coverBg: 'linear-gradient(125deg, #1f091d 0%, #111827 55%, #09090b 100%)',
      defaultCoverUrl: '/assets/photograph.jpg',
      role: 'TYSON Team Member',
      division: 'TYSON Media Group',
      bio: 'Official myTYSON profile for Ash French.'
    },
    {
      name: 'Triston Rinebarger',
      username: 'rpm@tysonmediagroup.org',
      slug: 'rpm',
      aliases: ['rpm@tysonmediagroup.org', 'rpm'],
      password: 'TristonRinerbarger',
      altPasswords: ['TristonRinebarger'],
      team: 'Y',
      badge: 'TYSON Team',
      badgeClass: 'badge-team',
      hasTysonBadge: true,
      initials: 'TR',
      avatarBg: 'linear-gradient(135deg, #991b1b 0%, #1f2937 100%)',
      coverBg: 'linear-gradient(125deg, #260b0b 0%, #18181b 55%, #09090b 100%)',
      defaultCoverUrl: '/assets/atlantisplayer_nightgasstation1.jpg',
      role: 'TYSON Team Member',
      division: 'TYSON RPM / Operations',
      bio: 'Official myTYSON profile for Triston Rinebarger.'
    },
    {
      name: 'TYSON Support',
      username: 'contact@tysonmediagroup.org',
      slug: 'contact',
      aliases: ['contact@tysonmediagroup.org', 'contact'],
      password: 'TYSONSupport',
      team: 'Official Support Account',
      badge: 'Official Support Account',
      badgeClass: 'badge-support',
      hasTysonBadge: true,
      initials: 'TS',
      avatarBg: 'linear-gradient(135deg, #0284c7 0%, #0c4a6e 100%)',
      coverBg: 'linear-gradient(125deg, #082032 0%, #111827 55%, #09090b 100%)',
      defaultCoverUrl: '/assets/tyson-t5s-login-backdrop.jpg',
      role: 'Official Support Channel',
      division: 'TYSON Support & Communications',
      bio: 'Official myTYSON support and contact account.'
    },
    {
      name: 'Jake Gantt',
      username: 'j.gantt',
      slug: 'j.gantt',
      aliases: ['j.gantt'],
      password: 'JakeGantt',
      team: 'N',
      badge: 'Standard Account',
      badgeClass: 'badge-member',
      hasTysonBadge: false,
      initials: 'JG',
      avatarBg: 'linear-gradient(135deg, #27272a 0%, #09090b 100%)',
      coverBg: 'linear-gradient(125deg, #18181b 0%, #09090b 65%, #050505 100%)',
      defaultCoverUrl: '',
      role: 'Registered User',
      division: 'Independent / External',
      bio: 'Registered myTYSON account for Jake Gantt.'
    }
  ];

  function setSharedCookie(name, value, days) {
    var expires = '';
    if (days) {
      var date = new Date();
      date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
      expires = '; expires=' + date.toUTCString();
    }
    var host = window.location.hostname;
    var domainAttr = '';
    if (host.endsWith('tysonmediagroup.org')) {
      domainAttr = '; domain=.tysonmediagroup.org';
    }
    document.cookie = name + '=' + encodeURIComponent(value || '') + expires + '; path=/' + domainAttr + '; SameSite=Lax';
  }

  function getSharedCookie(name) {
    var match = document.cookie.match(new RegExp('(^| )' + name + '=([^;]+)'));
    return match ? decodeURIComponent(match[2]) : null;
  }

  function findAccount(identifier) {
    if (!identifier) return null;
    var clean = identifier.trim().toLowerCase();
    for (var i = 0; i < DEFAULT_ACCOUNTS.length; i++) {
      var acc = DEFAULT_ACCOUNTS[i];
      if (acc.slug.toLowerCase() === clean) return acc;
      if (acc.aliases.indexOf(clean) !== -1) return acc;
    }
    return null;
  }

  function authenticate(identifier, password) {
    var acc = findAccount(identifier);
    if (!acc) return null;
    var pass = (password || '').trim();
    var valid = (acc.password === pass) || (acc.altPasswords && acc.altPasswords.indexOf(pass) !== -1);
    if (!valid) return null;
    return createSessionForAccount(acc);
  }

  function createSessionForAccount(acc) {
    var session = {
      name: acc.name,
      username: acc.username,
      slug: acc.slug,
      team: acc.team,
      badge: acc.badge,
      hasTysonBadge: acc.hasTysonBadge,
      ts: Date.now()
    };
    var raw = JSON.stringify(session);
    try {
      localStorage.setItem(STORAGE_KEY, raw);
    } catch (e) {}
    setSharedCookie('mytyson_sso', raw, 30);
    return session;
  }

  function getSession() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY) || getSharedCookie('mytyson_sso');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function clearSession() {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {}
    setSharedCookie('mytyson_sso', '', -1);
  }

  function getCustomProfile(slug) {
    if (!slug) return {};
    try {
      var raw = localStorage.getItem(CUSTOM_KEY_PREFIX + slug) || getSharedCookie('mytyson_custom_' + slug);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCustomProfile(slug, data) {
    if (!slug) return;
    var payload = {
      slug: slug,
      displayName: data.displayName || '',
      bio: data.bio || '',
      division: data.division || '',
      pfpUrl: data.pfpUrl || '',
      coverUrl: data.coverUrl || '',
      updatedAt: Date.now()
    };
    var raw = JSON.stringify(payload);
    try {
      localStorage.setItem(CUSTOM_KEY_PREFIX + slug, raw);
    } catch (e) {}

    var cookieSafe = {
      slug: slug,
      displayName: payload.displayName,
      bio: payload.bio,
      division: payload.division,
      pfpUrl: payload.pfpUrl && payload.pfpUrl.length < 1200 ? payload.pfpUrl : '',
      coverUrl: payload.coverUrl && payload.coverUrl.length < 1200 ? payload.coverUrl : '',
      updatedAt: payload.updatedAt
    };
    setSharedCookie('mytyson_custom_' + slug, JSON.stringify(cookieSafe), 365);

    try {
      fetch('/api/profile?slug=' + encodeURIComponent(slug), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: raw
      }).catch(function () {});
    } catch (e) {}

    return payload;
  }

  function resetCustomProfile(slug) {
    if (!slug) return;
    try {
      localStorage.removeItem(CUSTOM_KEY_PREFIX + slug);
    } catch (e) {}
    setSharedCookie('mytyson_custom_' + slug, '', -1);
  }

  function encodeSsoToken(session) {
    try {
      return btoa(JSON.stringify(session));
    } catch (e) {
      return '';
    }
  }

  // Multi-Theme Engine (noir-aero, noir, frutiger, wii, nature)
  function applyTheme(themeName) {
    var t = themeName || 'noir-aero';
    document.documentElement.setAttribute('data-theme', t);
    try {
      localStorage.setItem(THEME_KEY, t);
    } catch (e) {}
    setSharedCookie(THEME_KEY, t, 365);
    var btns = document.querySelectorAll('[data-set-theme]');
    for (var i = 0; i < btns.length; i++) {
      if (btns[i].getAttribute('data-set-theme') === t) {
        btns[i].classList.add('active');
      } else {
        btns[i].classList.remove('active');
      }
    }
  }

  function initThemeDrawer() {
    var saved = 'noir-aero';
    try {
      saved = localStorage.getItem(THEME_KEY) || getSharedCookie(THEME_KEY) || 'noir-aero';
    } catch (e) {}
    applyTheme(saved);

    var toggleBtn = document.getElementById('settings-toggle-btn');
    var drawer = document.getElementById('settings-drawer');
    var backdrop = document.getElementById('settings-drawer-backdrop');
    var closeBtn = document.getElementById('settings-close-btn');

    function openDrawer() {
      if (drawer) drawer.classList.add('open');
      if (backdrop) backdrop.classList.add('open');
    }
    function closeDrawer() {
      if (drawer) drawer.classList.remove('open');
      if (backdrop) backdrop.classList.remove('open');
    }

    if (toggleBtn) toggleBtn.addEventListener('click', openDrawer);
    if (closeBtn) closeBtn.addEventListener('click', closeDrawer);
    if (backdrop) backdrop.addEventListener('click', closeDrawer);

    var btns = document.querySelectorAll('[data-set-theme]');
    for (var i = 0; i < btns.length; i++) {
      btns[i].addEventListener('click', function () {
        applyTheme(this.getAttribute('data-set-theme'));
      });
    }
  }

  document.addEventListener('DOMContentLoaded', initThemeDrawer);

  window.MyTysonCore = {
    ACCOUNTS: DEFAULT_ACCOUNTS,
    findAccount: findAccount,
    authenticate: authenticate,
    createSessionForAccount: createSessionForAccount,
    getSession: getSession,
    clearSession: clearSession,
    getCustomProfile: getCustomProfile,
    saveCustomProfile: saveCustomProfile,
    resetCustomProfile: resetCustomProfile,
    encodeSsoToken: encodeSsoToken,
    applyTheme: applyTheme
  };
})(window);
