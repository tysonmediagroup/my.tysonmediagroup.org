(function (window) {
  var STORAGE_KEY = 'mytyson_session_v1';
  var CUSTOM_KEY_PREFIX = 'mytyson_profile_custom_';
  var CUSTOM_ACCOUNTS_KEY = 'mytyson_custom_accounts_v1';
  var THEME_KEY = 'tyson_active_theme';
  var CHUNK_COUNT = 8;
  var CHUNK_SIZE = 2800;

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
      aliases: ['a@tysonmediagroup.org', 'a', 'ash', 'ash@tysonmediagroup.org', 'ashfrench'],
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
    },
    {
      name: 'Eythn Cullia',
      firstName: '',
      lastName: '',
      showRealName: false,
      username: 'eythn@tysonmediagroup.org',
      slug: 'eythn',
      aliases: ['eythn@tysonmediagroup.org', 'eythn'],
      password: 'ej121',
      team: 'Y',
      badge: 'TYSON Team',
      badgeClass: 'badge-team',
      hasTysonBadge: true,
      initials: 'EC',
      avatarBg: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
      coverBg: 'linear-gradient(125deg, #18181b 0%, #09090b 65%, #050505 100%)',
      defaultCoverUrl: '',
      role: 'Marketing Coordinator',
      division: 'TYSON Media Group',
      bio: 'myTYSON profile for Eythn Cullia.'
    },
    {
      name: 'Jason May',
      firstName: 'Jason',
      lastName: 'May',
      showRealName: true,
      username: 'jmay@tysonmediagroup.org',
      slug: 'jmay',
      aliases: ['jmay@tysonmediagroup.org', 'jmay'],
      password: '102280919',
      team: 'N',
      badge: 'Standard Member',
      badgeClass: 'badge-member',
      hasTysonBadge: false,
      initials: 'JM',
      avatarBg: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
      coverBg: 'linear-gradient(125deg, #18181b 0%, #09090b 65%, #050505 100%)',
      defaultCoverUrl: '',
      role: 'Registered Member',
      division: 'TYSON Media Group',
      bio: 'myTYSON profile for Jason May.'
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
    var escaped = name.replace(/([.$?*|{}()[\]\\/+^])/g, '\\$1');
    var match = document.cookie.match(new RegExp('(?:^|; )' + escaped + '=([^;]*)'));
    return match ? decodeURIComponent(match[1]) : null;
  }

  // Write chunked cookies across .tysonmediagroup.org so base64 PFPs survive cookie limits
  function writeChunkedCookie(slug, rawJson) {
    if (!slug) return;
    for (var c = 0; c < 12; c++) {
      if (c < CHUNK_COUNT && rawJson) {
        var part = rawJson.slice(c * CHUNK_SIZE, (c + 1) * CHUNK_SIZE);
        if (part) {
          setSharedCookie('mytyson_p' + c + '_' + slug, part, 365);
          continue;
        }
      }
      setSharedCookie('mytyson_p' + c + '_' + slug, '', -1);
    }
  }

  function readChunkedCookie(slug) {
    if (!slug) return null;
    var combined = '';
    for (var c = 0; c < 12; c++) {
      var part = getSharedCookie('mytyson_p' + c + '_' + slug);
      if (!part) break;
      combined += part;
    }
    if (!combined) return null;
    try {
      return JSON.parse(combined);
    } catch (e) {
      return null;
    }
  }

  function getCloudApiBase() {
    var h = window.location.hostname;
    var port = window.location.port;
    if (h === 'localhost' || h === '127.0.0.1') {
      return (port === '8097' || !port) ? '' : 'http://localhost:8097';
    }
    return 'https://my.tysonmediagroup.org';
  }

  function getCustomAccounts() {
    try {
      var raw = localStorage.getItem(CUSTOM_ACCOUNTS_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  }

  function saveCustomAccounts(accounts) {
    try {
      localStorage.setItem(CUSTOM_ACCOUNTS_KEY, JSON.stringify(accounts || []));
    } catch (e) {}
  }

  function getAllAccounts() {
    var custom = getCustomAccounts();
    var map = {};
    for (var i = 0; i < DEFAULT_ACCOUNTS.length; i++) {
      var d = DEFAULT_ACCOUNTS[i];
      map[d.slug.toLowerCase()] = Object.assign({}, d);
    }
    for (var j = 0; j < custom.length; j++) {
      var c = custom[j];
      if (c && c.slug) {
        var k = c.slug.toLowerCase();
        map[k] = Object.assign({}, map[k] || {}, c);
      }
    }
    return Object.values(map);
  }

  function findAccount(identifier) {
    if (!identifier) return null;
    var clean = identifier.trim().toLowerCase();
    var all = getAllAccounts();
    for (var i = 0; i < all.length; i++) {
      var acc = all[i];
      if (acc.slug && acc.slug.toLowerCase() === clean) return acc;
      if (acc.username && acc.username.toLowerCase() === clean) return acc;
      if (acc.aliases && acc.aliases.some(function (a) { return (a || '').toLowerCase() === clean; })) return acc;
    }
    return null;
  }

  function isPowerAdmin(sessionOrSlug) {
    var s = sessionOrSlug;
    if (typeof s === 'object' && s !== null) s = s.slug || s.username;
    s = (s || '').trim().toLowerCase().replace(/@tysonmediagroup\.org$/i, '');
    return s === 'tyson' || s === 't' || s === 'ash' || s === 'a';
  }

  function createAccount(data, callback) {
    var rawSlug = (data.slug || data.username || '').trim().toLowerCase();
    var cleanSlug = rawSlug.replace(/@tysonmediagroup\.org$/i, '').trim();

    // Basic user accounts must NOT have usernames under 3 characters!
    // Poweradmin accounts (isPowerAdmin=true) are exempt from this limit.
    if (!data.isPowerAdmin) {
      if (cleanSlug.length < 3) {
        var errRes = { ok: false, error: 'Username must be at least 3 characters long.' };
        if (typeof callback === 'function') callback(errRes);
        return errRes;
      }
      if (!/^[a-z0-9._-]+$/i.test(cleanSlug)) {
        var errFmt = { ok: false, error: 'Username may only contain letters, numbers, periods, and hyphens.' };
        if (typeof callback === 'function') callback(errFmt);
        return errFmt;
      }
    }

    if (findAccount(cleanSlug)) {
      var errExists = { ok: false, error: 'Account with handle "' + cleanSlug + '" already exists.' };
      if (typeof callback === 'function') callback(errExists);
      return errExists;
    }

    var firstName = (data.firstName || '').trim();
    var lastName = (data.lastName || '').trim();
    var dName = (data.name || [firstName, lastName].filter(Boolean).join(' ') || cleanSlug).trim();

    var initials = ((firstName[0] || '') + (lastName[0] || (cleanSlug[0] || ''))).toUpperCase() || 'TM';
    var isTeam = (data.team === 'Y' || data.team === true || data.isTeam === true);

    var newAcc = {
      name: dName,
      firstName: firstName,
      lastName: lastName,
      showRealName: data.showRealName !== false,
      username: cleanSlug + '@tysonmediagroup.org',
      slug: cleanSlug,
      aliases: [cleanSlug + '@tysonmediagroup.org', cleanSlug],
      password: data.password || 'password123',
      team: isTeam ? 'Y' : 'N',
      badge: data.badge || (isTeam ? 'TYSON Team' : 'Standard Member'),
      badgeClass: data.badgeClass || (isTeam ? 'badge-team' : 'badge-member'),
      hasTysonBadge: data.hasTysonBadge !== undefined ? !!data.hasTysonBadge : isTeam,
      initials: initials,
      avatarBg: data.avatarBg || 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
      coverBg: data.coverBg || 'linear-gradient(125deg, #18181b 0%, #09090b 65%, #050505 100%)',
      defaultCoverUrl: data.defaultCoverUrl || '',
      role: data.role || (isTeam ? 'TYSON Team Member' : 'Registered Member'),
      division: data.division || 'TYSON Media Group',
      bio: data.bio || ('myTYSON profile for ' + dName + '.'),
      pfpUrl: data.pfpUrl || '',
      isDynamic: true,
      isPowerAdmin: !!data.isPowerAdmin,
      createdAt: Date.now()
    };

    var custom = getCustomAccounts();
    custom.push(newAcc);
    saveCustomAccounts(custom);

    // Save profile defaults
    saveCustomProfile(cleanSlug, {
      displayName: dName,
      firstName: firstName,
      lastName: lastName,
      showRealName: newAcc.showRealName,
      division: newAcc.division,
      bio: newAcc.bio,
      pfpUrl: newAcc.pfpUrl,
      coverUrl: ''
    });

    // Cloud sync to /api/accounts
    var apiBase = getCloudApiBase();
    fetch(apiBase + '/api/accounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newAcc)
    })
      .then(function (r) {
        if (!r.ok) {
          return r.json().then(function (err) {
            throw new Error((err && err.error) || ('Server returned HTTP ' + r.status));
          });
        }
        return r.json();
      })
      .then(function () {
        var res = { ok: true, account: newAcc };
        if (typeof callback === 'function') callback(res);
      })
      .catch(function (e) {
        var res = { ok: true, account: newAcc, syncNotice: e.message };
        if (typeof callback === 'function') callback(res);
      });

    return { ok: true, account: newAcc };
  }

  function updateAccount(slug, updates, callback) {
    if (!slug) return;
    var clean = slug.toLowerCase();
    var custom = getCustomAccounts();
    var idx = custom.findIndex(function (a) { return a.slug.toLowerCase() === clean; });
    var target = null;
    if (idx >= 0) {
      custom[idx] = Object.assign({}, custom[idx], updates);
      target = custom[idx];
      saveCustomAccounts(custom);
    } else {
      var d = DEFAULT_ACCOUNTS.find(function (a) { return a.slug.toLowerCase() === clean; });
      if (d) {
        target = Object.assign({}, d, updates, { isDynamic: true });
        custom.push(target);
        saveCustomAccounts(custom);
      }
    }

    if (target) {
      var apiBase = getCloudApiBase();
      fetch(apiBase + '/api/accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(target)
      }).catch(function () {});
    }

    var res = { ok: !!target, account: target };
    if (typeof callback === 'function') callback(res);
    return res;
  }

  function deleteAccount(slug, callback) {
    if (!slug) return;
    var clean = slug.toLowerCase();
    if (clean === 'tyson' || clean === 't') {
      var errRes = { ok: false, error: 'Cannot delete primary root admin account.' };
      if (typeof callback === 'function') callback(errRes);
      return errRes;
    }

    var custom = getCustomAccounts();
    custom = custom.filter(function (a) { return a.slug.toLowerCase() !== clean; });
    saveCustomAccounts(custom);

    var apiBase = getCloudApiBase();
    fetch(apiBase + '/api/accounts?slug=' + encodeURIComponent(clean), {
      method: 'DELETE'
    }).catch(function () {});

    resetCustomProfile(clean);

    var res = { ok: true };
    if (typeof callback === 'function') callback(res);
    return res;
  }

  function syncAccountsFromCloud(callback) {
    var apiBase = getCloudApiBase();
    fetch(apiBase + '/api/accounts?_t=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (cloudAccounts) {
        if (Array.isArray(cloudAccounts)) {
          var local = getCustomAccounts();
          var map = {};
          for (var i = 0; i < local.length; i++) {
            if (local[i] && local[i].slug) map[local[i].slug.toLowerCase()] = local[i];
          }
          for (var j = 0; j < cloudAccounts.length; j++) {
            var ca = cloudAccounts[j];
            if (ca && ca.slug) {
              map[ca.slug.toLowerCase()] = Object.assign({}, map[ca.slug.toLowerCase()] || {}, ca);
            }
          }
          saveCustomAccounts(Object.values(map));
        }
        if (typeof callback === 'function') callback(getAllAccounts());
      })
      .catch(function () {
        if (typeof callback === 'function') callback(getAllAccounts());
      });
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
      var localRaw = localStorage.getItem(CUSTOM_KEY_PREFIX + slug);
      if (localRaw) {
        return JSON.parse(localRaw);
      }
    } catch (e) {}
    var chunked = readChunkedCookie(slug);
    if (chunked) return chunked;
    try {
      var fallbackCookie = getSharedCookie('mytyson_custom_' + slug);
      return fallbackCookie ? JSON.parse(fallbackCookie) : {};
    } catch (e) {
      return {};
    }
  }

  function saveCustomProfile(slug, data, onCloudSaved) {
    if (!slug) return;
    var payload = {
      slug: slug,
      displayName: data.displayName || '',
      firstName: data.firstName || '',
      lastName: data.lastName || '',
      showRealName: data.showRealName !== false,
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

    // Write chunked cookie if total payload fits in chunk quota
    if (raw.length <= CHUNK_COUNT * CHUNK_SIZE) {
      writeChunkedCookie(slug, raw);
    } else {
      // If cover photo is huge, at least store PFP + metadata in chunked cookie
      var pfpPayload = JSON.stringify({
        slug: slug,
        displayName: payload.displayName,
        bio: payload.bio,
        division: payload.division,
        pfpUrl: payload.pfpUrl || '',
        coverUrl: (payload.coverUrl && !payload.coverUrl.startsWith('data:')) ? payload.coverUrl : '',
        updatedAt: payload.updatedAt
      });
      if (pfpPayload.length <= CHUNK_COUNT * CHUNK_SIZE) {
        writeChunkedCookie(slug, pfpPayload);
      }
    }

    // Sync to Cloudflare Worker Edge Storage (/api/profile)
    var apiBase = getCloudApiBase();
    try {
      fetch(apiBase + '/api/profile?slug=' + encodeURIComponent(slug), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: raw
      })
        .then(function (r) { return r.json(); })
        .then(function (res) {
          if (typeof onCloudSaved === 'function') onCloudSaved(true, res);
        })
        .catch(function () {
          if (typeof onCloudSaved === 'function') onCloudSaved(false);
        });
    } catch (e) {
      if (typeof onCloudSaved === 'function') onCloudSaved(false);
    }

    return payload;
  }

  function fetchCloudProfile(slug, callback) {
    if (!slug) return;
    var apiBase = getCloudApiBase();
    fetch(apiBase + '/api/profile?slug=' + encodeURIComponent(slug) + '&_t=' + Date.now())
      .then(function (r) {
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return r.json();
      })
      .then(function (cloudData) {
        if (cloudData && (cloudData.slug || cloudData.pfpUrl || cloudData.displayName || cloudData.updatedAt)) {
          var local = getCustomProfile(slug);
          if (!local.updatedAt || (cloudData.updatedAt && cloudData.updatedAt >= local.updatedAt) || (cloudData.pfpUrl && !local.pfpUrl)) {
            try {
              localStorage.setItem(CUSTOM_KEY_PREFIX + slug, JSON.stringify(cloudData));
            } catch (e) {}
            var rawJson = JSON.stringify(cloudData);
            if (rawJson.length <= CHUNK_COUNT * CHUNK_SIZE) {
              writeChunkedCookie(slug, rawJson);
            } else if (cloudData.pfpUrl) {
              var compact = JSON.stringify({
                slug: slug,
                displayName: cloudData.displayName || '',
                bio: cloudData.bio || '',
                division: cloudData.division || '',
                pfpUrl: cloudData.pfpUrl,
                updatedAt: cloudData.updatedAt
              });
              if (compact.length <= CHUNK_COUNT * CHUNK_SIZE) {
                writeChunkedCookie(slug, compact);
              }
            }
            if (typeof callback === 'function') callback(cloudData);
            return;
          }
        }
        if (typeof callback === 'function') callback(getCustomProfile(slug));
      })
      .catch(function () {
        if (typeof callback === 'function') callback(getCustomProfile(slug));
      });
  }

  function resetCustomProfile(slug, callback) {
    if (!slug) return;
    try {
      localStorage.removeItem(CUSTOM_KEY_PREFIX + slug);
    } catch (e) {}
    writeChunkedCookie(slug, '');
    setSharedCookie('mytyson_custom_' + slug, '', -1);

    var apiBase = getCloudApiBase();
    fetch(apiBase + '/api/profile?slug=' + encodeURIComponent(slug), {
      method: 'DELETE'
    }).finally(function () {
      if (typeof callback === 'function') callback();
    });
  }

  function encodeSsoToken(session) {
    try {
      return btoa(JSON.stringify(session));
    } catch (e) {
      return '';
    }
  }

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
    DEFAULT_ACCOUNTS: DEFAULT_ACCOUNTS,
    ACCOUNTS: DEFAULT_ACCOUNTS,
    getAllAccounts: getAllAccounts,
    findAccount: findAccount,
    authenticate: authenticate,
    createSessionForAccount: createSessionForAccount,
    getSession: getSession,
    clearSession: clearSession,
    isPowerAdmin: isPowerAdmin,
    createAccount: createAccount,
    updateAccount: updateAccount,
    deleteAccount: deleteAccount,
    syncAccountsFromCloud: syncAccountsFromCloud,
    getCustomProfile: getCustomProfile,
    saveCustomProfile: saveCustomProfile,
    fetchCloudProfile: fetchCloudProfile,
    resetCustomProfile: resetCustomProfile,
    encodeSsoToken: encodeSsoToken,
    applyTheme: applyTheme
  };
})(window);
