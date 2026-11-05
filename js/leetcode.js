(() => {
  'use strict';

  // One public GraphQL request replaces three slow third-party API calls.
  // Never send LeetCode cookies, tokens, or private account data through a proxy.
  const username = 'adarshgupta162';
  const endpoint = 'https://proxy.cors.dev/https://leetcode.com/graphql';
  const CACHE_KEY = `leetcode-public-stats:${username.toLowerCase()}`;
  const CACHE_TTL = 60 * 1000;
  const $ = (id) => document.getElementById(id);
  const first = (...values) => values.find((v) => v !== undefined && v !== null && v !== '');
  const fmt = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-IN') : '—';
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const setBar = (id, count, total) => {
    const el = $(id);
    if (!el) return;
    const pct = Number(total) > 0 ? Math.max(0, Math.min(100, Number(count) / Number(total) * 100)) : 0;
    el.style.width = `${pct}%`;
  };
  const setPct = (id, count, total) => {
    const pct = Number(total) > 0 ? Math.round(Number(count) / Number(total) * 100) : 0;
    setText(id, Number(total) > 0 ? `${pct}%` : '—');
  };

  const query = `
    query PortfolioLeetCodeStats($username: String!) {
      matchedUser(username: $username) {
        profile { ranking userAvatar realName }
        submitStats { acSubmissionNum { difficulty count } }
        userCalendar { streak totalActiveDays submissionCalendar }
      }
      userContestRanking(username: $username) {
        rating globalRanking attendedContestsCount topPercentage
      }
      allQuestionsCount { difficulty count }
    }
  `;

  function readCache() {
    try {
      const cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null');
      return cached && cached.data ? cached : null;
    } catch { return null; }
  }

  function saveCache(data) {
    try { localStorage.setItem(CACHE_KEY, JSON.stringify({ savedAt: Date.now(), data })); }
    catch { /* Storage can be disabled or full; live stats still render. */ }
  }

  function indexCounts(rows) {
    return Object.fromEntries((Array.isArray(rows) ? rows : []).map((row) => [row.difficulty, Number(row.count) || 0]));
  }

  function render(data) {
    const user = data?.matchedUser;
    if (!user) throw new Error('LeetCode username was not found or its public profile is unavailable.');

    const avatar = user.profile?.userAvatar;
    const avatarImage = $('leetcode-avatar-image');
    const avatarFallback = $('leetcode-avatar-fallback');
    if (avatarImage && avatar && /^https:\/\//i.test(avatar)) {
      avatarImage.src = avatar;
      avatarImage.hidden = false;
      if (avatarFallback) avatarFallback.hidden = true;
      avatarImage.onerror = () => { avatarImage.hidden = true; if (avatarFallback) avatarFallback.hidden = false; };
    } else if (avatarImage) {
      avatarImage.hidden = true;
      if (avatarFallback) avatarFallback.hidden = false;
    }
    const rank = Number(user.profile?.ranking);
    setText('leetcode-rank', rank > 0 ? `GLOBAL RANK #${fmt(rank)}` : 'PUBLIC PROFILE');

    const solved = indexCounts(user.submitStats?.acSubmissionNum);
    const totals = indexCounts(data.allQuestionsCount);
    const easy = solved.Easy || 0;
    const medium = solved.Medium || 0;
    const hard = solved.Hard || 0;
    const total = solved.All || easy + medium + hard;

    setText('total-solved', fmt(total));
    setText('easy-solved', fmt(easy));
    setText('medium-solved', fmt(medium));
    setText('hard-solved', fmt(hard));
    setText('solved-caption', 'Problems completed');
    setText('easy-total', totals.Easy ? `of ${fmt(totals.Easy)} problems` : 'Solved problems');
    setText('medium-total', totals.Medium ? `of ${fmt(totals.Medium)} problems` : 'Solved problems');
    setText('hard-total', totals.Hard ? `of ${fmt(totals.Hard)} problems` : 'Solved problems');
    setBar('easy-progress', easy, totals.Easy);
    setBar('medium-progress', medium, totals.Medium);
    setBar('hard-progress', hard, totals.Hard);
    setPct('easy-percent', easy, totals.Easy);
    setPct('medium-percent', medium, totals.Medium);
    setPct('hard-percent', hard, totals.Hard);

    const contest = data.userContestRanking;
    setText('contest-rating', contest ? fmt(Math.round(contest.rating)) : '—');
    setText('contest-ranking', contest ? fmt(contest.globalRanking) : '—');
    setText('contest-attended', contest ? fmt(contest.attendedContestsCount) : '0');
    setText('contest-note', contest
      ? (contest.topPercentage != null ? `Top ${Number(contest.topPercentage).toFixed(2)}% globally.` : 'Contest details reflect the latest public LeetCode data.')
      : 'No contest rating is available for this account yet.');

    renderCalendar(user.userCalendar || {});
  }

  function renderCalendar(calendar) {
    const root = $('activity-grid');
    if (!root) return;
    root.replaceChildren();

    let map = calendar.submissionCalendar || {};
    if (typeof map === 'string') {
      try { map = JSON.parse(map); } catch { map = {}; }
    }
    const entries = Object.entries(map || {})
      .filter(([timestamp, count]) => /^\\d+$/.test(timestamp) && Number(count) >= 0)
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .slice(-364);
    const max = Math.max(1, ...entries.map(([, count]) => Number(count)));
    entries.forEach(([timestamp, count]) => {
      const n = Number(count);
      const level = n === 0 ? 0 : Math.min(4, Math.ceil((n / max) * 4));
      const cell = document.createElement('span');
      cell.className = 'activity-cell';
      cell.dataset.level = String(level);
      cell.title = `${new Date(Number(timestamp) * 1000).toLocaleDateString()}: ${n} submissions`;
      root.appendChild(cell);
    });

    const activeDays = Number(first(calendar.totalActiveDays, entries.filter(([, count]) => Number(count) > 0).length));
    setText('active-days', fmt(activeDays));
    setText('activity-note', entries.length
      ? `${fmt(activeDays)} active days · Current streak: ${fmt(calendar.streak || 0)} days. Showing the latest activity data returned by LeetCode.`
      : 'No activity calendar was returned. Open your LeetCode profile to view the full calendar.');
  }

  async function fetchStats() {
    const params = new URLSearchParams({
      query,
      variables: JSON.stringify({ username })
    });
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${endpoint}?${params.toString()}`, {
        method: 'GET',
        mode: 'cors',
        credentials: 'omit',
        cache: 'no-store',
        headers: { Accept: 'application/json' },
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`Stats service returned HTTP ${response.status}.`);
      const payload = await response.json();
      if (payload.errors?.length && !payload.data?.matchedUser) {
        throw new Error(payload.errors[0].message || 'LeetCode could not return this profile.');
      }
      if (!payload.data?.matchedUser) throw new Error('LeetCode profile not found.');
      saveCache(payload.data);
      return payload.data;
    } finally {
      clearTimeout(timeout);
    }
  }

  async function load(force = false) {
    const button = $('refresh-button');
    const status = $('api-status');
    const cached = readCache();
    if (cached && !force && Date.now() - cached.savedAt < CACHE_TTL) {
      try {
        render(cached.data);
        setText('last-updated', `CACHED · ${new Date(cached.savedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`);
        if (status) { status.classList.remove('is-error'); status.textContent = 'Loaded instantly from a 1-minute cache. Refresh for the latest stats.'; }
        return;
      } catch { /* Invalid cached data: fetch a fresh profile. */ }
    }

    if (button) { button.disabled = true; button.textContent = 'Loading…'; }
    if (status) { status.classList.remove('is-error'); status.textContent = cached ? 'Refreshing stats… showing saved data if the service is unavailable.' : 'Fetching your LeetCode profile…'; }

    try {
      const data = await fetchStats();
      render(data);
      setText('last-updated', `UPDATED · ${new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`);
      if (status) status.textContent = 'Connected · one request fetched your public LeetCode stats. Cached for 1 minute.';
    } catch (error) {
      if (cached) {
        try {
          render(cached.data);
          setText('last-updated', `SAVED DATA · ${new Date(cached.savedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}`);
          if (status) status.textContent = `Could not refresh (${error.message}). Showing the last saved stats.`;
        } catch {
          if (status) { status.classList.add('is-error'); status.textContent = error.message; }
        }
      } else if (status) {
        status.classList.add('is-error');
        status.textContent = `${error.name === 'AbortError' ? 'Request timed out.' : error.message} Try again shortly or open your LeetCode profile.`;
      }
    } finally {
      if (button) { button.disabled = false; button.textContent = '↻ Refresh stats'; }
    }
  }

  $('refresh-button')?.addEventListener('click', () => load(true));
  load();
})();
