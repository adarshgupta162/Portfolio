(() => {
  "use strict";
  const USERNAME = "adarshgupta162";
  const API = "https://alfa-leetcode-api.onrender.com";
  const $ = id => document.getElementById(id);
  const setText = (id, value) => { const el = $(id); if (el) el.textContent = value; };
  const asNumber = value => {
    if (value === null || value === undefined || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
  };
  const fmt = value => asNumber(value) === null ? "—" : Number(value).toLocaleString("en-US");

  async function request(endpoint) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    try {
      const response = await fetch(`${API}/${USERNAME}/${endpoint}`, {
        signal: controller.signal, headers: { Accept: "application/json" }
      });
      if (!response.ok) throw new Error(`API HTTP ${response.status} (${endpoint})`);
      return await response.json();
    } finally { clearTimeout(timeout); }
  }

  function flatten(data) {
    const result = [], seen = new Set();
    function walk(value, depth = 0) {
      if (!value || typeof value !== "object" || seen.has(value) || depth > 5) return;
      seen.add(value); result.push(value);
      Object.values(value).forEach(v => { if (v && typeof v === "object") walk(v, depth + 1); });
    }
    walk(data); return result;
  }
  function pick(objects, keys) {
    for (const obj of objects) for (const key of keys) {
      if (obj && obj[key] !== undefined && obj[key] !== null && obj[key] !== "") return obj[key];
    }
    return null;
  }
  function bar(id, solved, total) {
    const el = $(id), s = asNumber(solved), t = asNumber(total);
    if (el) el.style.width = (s !== null && t > 0 ? Math.min(100, s / t * 100) : 0) + "%";
  }

  function updateSolved(solvedData, profileData) {
    const all = [...flatten(solvedData || {}), ...flatten(profileData || {})];
    const easy = asNumber(pick(all, ["easySolved", "easy"]));
    const medium = asNumber(pick(all, ["mediumSolved", "medium"]));
    const hard = asNumber(pick(all, ["hardSolved", "hard"]));
    let total = asNumber(pick(all, ["solvedProblem", "totalSolved", "totalSolvedQuestions", "totalAC"]));
    if (total === null && easy !== null && medium !== null && hard !== null) total = easy + medium + hard;

    // Some API versions return difficulty totals as [{difficulty:"Easy", count:...}, ...].
    const rows = pick(all, ["allQuestionsCount", "solvedProblem"]);
    const totalFor = difficulty => {
      if (!Array.isArray(rows)) return null;
      const row = rows.find(item => String(item.difficulty || item.name || "").toLowerCase() === difficulty);
      return row ? asNumber(row.count ?? row.total) : null;
    };
    const easyTotal = totalFor("easy"), mediumTotal = totalFor("medium"), hardTotal = totalFor("hard");
    const totalQuestions = [easyTotal, mediumTotal, hardTotal].every(v => v !== null)
      ? easyTotal + mediumTotal + hardTotal : null;

    setText("total-solved", fmt(total)); setText("easy-solved", fmt(easy));
    setText("medium-solved", fmt(medium)); setText("hard-solved", fmt(hard));
    setText("easy-total", `of ${fmt(easyTotal)}`); setText("medium-total", `of ${fmt(mediumTotal)}`);
    setText("hard-total", `of ${fmt(hardTotal)}`); setText("total-target", `/ ${fmt(totalQuestions)}`);
    setText("solved-caption", total !== null && totalQuestions !== null
      ? `${(totalQuestions ? total / totalQuestions * 100 : 0).toFixed(1)}% of tracked problems`
      : "Solved across all difficulties");
    bar("total-progress", total, totalQuestions); bar("easy-progress", easy, easyTotal);
    bar("medium-progress", medium, mediumTotal); bar("hard-progress", hard, hardTotal);
    if ([total, easy, medium, hard].every(v => v === null)) {
      throw new Error("API responded, but the solved-stat fields were not recognized. Check the endpoint JSON.");
    }
  }

  function updateContest(data) {
    const all = flatten(data || {});
    setText("contest-rating", fmt(pick(all, ["rating", "currentRating", "contestRating"])));
    setText("contest-ranking", fmt(pick(all, ["globalRanking", "ranking", "globalRank"])));
    setText("contest-attended", fmt(pick(all, ["attendedContestsCount", "attended", "contestAttend"])));
  }

  function updateActivity(data) {
    const all = flatten(data || {});
    let raw = pick(all, ["submissionCalendar", "calendar"]);
    let total = null;
    if (typeof raw === "string") {
      try { raw = JSON.parse(raw); } catch (_) { raw = null; }
    }
    if (raw && typeof raw === "object" && !Array.isArray(raw)) {
      total = Object.values(raw).reduce((sum, value) => sum + (asNumber(value) || 0), 0);
    }
    if (total === null) total = asNumber(pick(all, ["totalSubmissions", "submissionCount", "totalActiveDays"]));
    setText("active-days", fmt(total));
    setText("activity-note", total === null
      ? "Activity summary wasn't available in the API response. Open LeetCode for the full calendar."
      : "This is the total activity count returned by the API; it may count submissions, not unique days.");
  }

  async function loadStats() {
    const button = $("refresh-button"), statusBar = document.querySelector(".api-status");
    if (button) { button.disabled = true; button.textContent = "Loading…"; }
    statusBar?.classList.remove("error");
    setText("api-status-text", "Fetching stats from the API…");
    const results = await Promise.allSettled([
      request("profile"), request("solved"), request("contest"), request("calendar")
    ]);
    try {
      const [profile, solved, contest, calendar] = results.map(r => r.status === "fulfilled" ? r.value : null);
      const failures = results.filter(r => r.status === "rejected");
      if (solved || profile) {
        try { updateSolved(solved, profile); }
        catch (error) { console.warn(error); }
      }
      if (contest) updateContest(contest);
      if (calendar) updateActivity(calendar);
      if (failures.length === results.length) throw new Error("The API is unreachable or temporarily unavailable.");
      setText("api-status-text", failures.length
        ? `Some stats loaded; ${failures.length} request(s) failed. Try refresh shortly.`
        : "Stats loaded from the LeetCode API.");
      if (failures.length) statusBar?.classList.add("error");
      setText("last-updated", `Last checked ${new Date().toLocaleTimeString([], {hour:"2-digit", minute:"2-digit"})}`);
    } catch (error) {
      console.error("LeetCode API:", error);
      setText("api-status-text", `${error.message} You can still open your LeetCode profile directly.`);
      setText("last-updated", "Live stats unavailable right now");
      statusBar?.classList.add("error");
    } finally {
      if (button) { button.disabled = false; button.textContent = "↻ Refresh stats"; }
    }
  }

  document.addEventListener("DOMContentLoaded", () => {
    $("refresh-button")?.addEventListener("click", loadStats);
    loadStats();
  });
})();
