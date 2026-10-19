(() => {
  'use strict';
  const username = 'adarshgupta162';
  const api = 'https://alfa-leetcode-api.onrender.com';
  const $ = (id) => document.getElementById(id);
  const fmt = (value) => Number.isFinite(Number(value)) ? Number(value).toLocaleString('en-IN') : '—';
  const first = (...values) => values.find((v) => v !== undefined && v !== null && v !== '');
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
  async function get(path) {
    const response = await fetch(`${api}/${username}/${path}`, { headers: { Accept: 'application/json' } });
    if (!response.ok) throw new Error(`API returned ${response.status}`);
    return response.json();
  }
  function renderSolved(data) {
    const easy = Number(first(data.easySolved, data.easy, data.solvedProblem?.easy, 0));
    const medium = Number(first(data.mediumSolved, data.medium, data.solvedProblem?.medium, 0));
    const hard = Number(first(data.hardSolved, data.hard, data.solvedProblem?.hard, 0));
    const total = Number(first(data.solvedProblem, data.totalSolved, data.total, easy + medium + hard));
    const easyTotal = Number(first(data.totalEasy, data.totalEasyQuestions, data.totalProblems?.easy, 0));
    const mediumTotal = Number(first(data.totalMedium, data.totalMediumQuestions, data.totalProblems?.medium, 0));
    const hardTotal = Number(first(data.totalHard, data.totalHardQuestions, data.totalProblems?.hard, 0));
    setText('total-solved', fmt(total || easy + medium + hard));
    setText('easy-solved', fmt(easy)); setText('medium-solved', fmt(medium)); setText('hard-solved', fmt(hard));
    setText('solved-caption', 'Problems completed');
    setText('easy-total', easyTotal ? `of ${fmt(easyTotal)} problems` : 'Solved problems');
    setText('medium-total', mediumTotal ? `of ${fmt(mediumTotal)} problems` : 'Solved problems');
    setText('hard-total', hardTotal ? `of ${fmt(hardTotal)} problems` : 'Solved problems');
    setBar('easy-progress', easy, easyTotal); setBar('medium-progress', medium, mediumTotal); setBar('hard-progress', hard, hardTotal);
    setPct('easy-percent', easy, easyTotal); setPct('medium-percent', medium, mediumTotal); setPct('hard-percent', hard, hardTotal);
  }
  function renderContest(data) {
    const rating = first(data.contestRating, data.rating, data.currentRating);
    const ranking = first(data.globalRanking, data.ranking, data.topPercentage);
    const attended = first(data.attendedContestsCount, data.contestsAttended, data.attended);
    setText('contest-rating', rating != null ? fmt(rating) : '—');
    setText('contest-ranking', ranking != null ? (data.topPercentage != null && ranking === data.topPercentage ? `${ranking}%` : fmt(ranking)) : '—');
    setText('contest-attended', attended != null ? fmt(attended) : '—');
    setText('contest-note', rating == null && attended == null ? 'Contest information was not returned by the API.' : 'Contest details reflect the latest data returned by the API.');
  }
  function renderCalendar(data) {
    const root = $('activity-grid');
    if (!root) return;
    root.replaceChildren();
    let map = first(data.submissionCalendar, data.calendar, data);
    if (typeof map === 'string') { try { map = JSON.parse(map); } catch { map = {}; } }
    if (map && map.submissionCalendar) map = map.submissionCalendar;
    const entries = map && typeof map === 'object' ? Object.entries(map).filter(([key, value]) => /^\d+$/.test(key) && Number(value) >= 0) : [];
    const recent = entries.sort((a, b) => Number(a[0]) - Number(b[0])).slice(-364);
    const max = Math.max(1, ...recent.map(([, count]) => Number(count)));
    recent.forEach(([timestamp, count]) => {
      const cell = document.createElement('span');
      const n = Number(count);
      const level = n === 0 ? 0 : n / max < .25 ? 1 : n / max < .5 ? 2 : n / max < .75 ? 3 : 4;
      cell.className = 'activity-cell'; cell.dataset.level = String(level);
      cell.title = `${new Date(Number(timestamp) * 1000).toLocaleDateString()}: ${n} submissions`;
      root.appendChild(cell);
    });
    const days = recent.filter(([, count]) => Number(count) > 0).length;
    setText('active-days', fmt(days));
    setText('activity-note', recent.length ? `${days} active days represented in the recent activity data. Each square represents a day with submission activity.` : 'No activity calendar was returned. Open your LeetCode profile to view the full calendar.');
  }
  async function load() {
    const button = $('refresh-button');
    const status = $('api-status');
    if (button) { button.disabled = true; button.textContent = 'Loading…'; }
    if (status) { status.classList.remove('is-error'); status.textContent = 'Loading profile data…'; }
    const outcomes = await Promise.allSettled([get('solved'), get('contest'), get('calendar')]);
    let success = 0;
    if (outcomes[0].status === 'fulfilled') { renderSolved(outcomes[0].value); success++; }
    if (outcomes[1].status === 'fulfilled') { renderContest(outcomes[1].value); success++; }
    if (outcomes[2].status === 'fulfilled') { renderCalendar(outcomes[2].value); success++; }
    const now = new Date().toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
    setText('last-updated', `LAST CHECKED · ${now}`);
    if (status) {
      status.textContent = success === 3 ? 'Connected · stats refreshed. Data is supplied by an unofficial third-party API.' : success > 0 ? `Partially connected (${success}/3 data sources). Some stats may be unavailable; try refreshing later.` : 'Could not load LeetCode stats. The unofficial API may be asleep or unavailable; try again shortly.';
      if (success === 0) status.classList.add('is-error');
    }
    if (button) { button.disabled = false; button.textContent = '↻ Refresh stats'; }
  }
  $('refresh-button')?.addEventListener('click', load);
  load();
})();
