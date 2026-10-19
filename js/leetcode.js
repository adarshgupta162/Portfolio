(() => {
  const form = document.querySelector("#stats-form");
  const input = document.querySelector("#leetcode-username");
  const submit = document.querySelector("#stats-submit");
  const message = document.querySelector("#stats-message");
  const activityGrid = document.querySelector("#activity-grid");
  const activitySubtitle = document.querySelector("#activity-subtitle");
  const activityNote = document.querySelector("#activity-note");

  const setText = (id, value) => { document.getElementById(id).textContent = value; };
  const number = value => Number.isFinite(Number(value)) ? Number(value) : 0;
  const firstDefined = (...values) => values.find(value => value !== undefined && value !== null);

  function setDifficulty(key, solved, total) {
    const safeSolved = number(solved);
    const safeTotal = number(total);
    const percentage = safeTotal > 0 ? Math.min(100, safeSolved / safeTotal * 100) : 0;
    document.getElementById(`${key}-fill`).style.width = `${percentage}%`;
    setText(`${key}-detail`, `${safeSolved} / ${safeTotal || "—"}`);
  }

  function renderCalendar(calendar) {
    activityGrid.innerHTML = "";
    let entries = [];
    if (Array.isArray(calendar)) {
      entries = calendar.map(entry => ({
        count: number(firstDefined(entry.count, entry.submissionCount, entry.value)),
        date: entry.date || entry.timestamp || ""
      }));
    } else if (calendar && typeof calendar === "object") {
      const source = calendar.submissionCalendar || calendar.calendar || calendar;
      if (Array.isArray(source)) entries = source;
      else entries = Object.entries(source).map(([date, count]) => ({ date, count: number(count) }));
    }
    entries = entries.slice(-182);
    if (!entries.length) {
      activitySubtitle.textContent = "NOT PROVIDED";
      activityNote.textContent = "This API response did not include a usable daily calendar. Problem totals and difficulty counts can still be displayed.";
      return;
    }
    const max = Math.max(1, ...entries.map(entry => number(firstDefined(entry.count, entry.submissionCount, entry.value))));
    entries.forEach(entry => {
      const count = number(firstDefined(entry.count, entry.submissionCount, entry.value));
      const cell = document.createElement("span");
      const level = count === 0 ? 0 : count / max < .25 ? 1 : count / max < .5 ? 2 : count / max < .75 ? 3 : 4;
      cell.className = "activity-cell";
      cell.dataset.level = String(level);
      const date = entry.date ? new Date(typeof entry.date === "number" && entry.date < 1e12 ? entry.date * 1000 : entry.date) : null;
      cell.title = `${date && !Number.isNaN(date.valueOf()) ? date.toLocaleDateString() : "Day"}: ${count} submissions`;
      cell.setAttribute("aria-label", cell.title);
      activityGrid.appendChild(cell);
    });
    activitySubtitle.textContent = `${entries.length} DAYS`;
    activityNote.textContent = "Each square represents a day returned by the API; darker squares indicate more submissions relative to this displayed period.";
  }

  function normalizeStats(data) {
    // Supports common response shapes from community LeetCode stats APIs.
    const solvedObj = data.solvedProblem || data.solved || data;
    const totalSolved = firstDefined(
      data.totalSolved, data.total_solved, data.solvedProblem?.allQuestions, data.solved?.all,
      solvedObj.acSubmissionNum?.find?.(item => item.difficulty === "All")?.count
    );
    const easySolved = firstDefined(data.easySolved, data.easy_solved, data.solvedProblem?.easyQuestions,
      data.solved?.easy, solvedObj.acSubmissionNum?.find?.(item => item.difficulty === "Easy")?.count);
    const mediumSolved = firstDefined(data.mediumSolved, data.medium_solved, data.solvedProblem?.mediumQuestions,
      data.solved?.medium, solvedObj.acSubmissionNum?.find?.(item => item.difficulty === "Medium")?.count);
    const hardSolved = firstDefined(data.hardSolved, data.hard_solved, data.solvedProblem?.hardQuestions,
      data.solved?.hard, solvedObj.acSubmissionNum?.find?.(item => item.difficulty === "Hard")?.count);
    const totalEasy = firstDefined(data.totalEasy, data.total_easy, data.solvedProblem?.totalEasy, data.totalQuestions?.easy, data.totalQuestions?.Easy);
    const totalMedium = firstDefined(data.totalMedium, data.total_medium, data.solvedProblem?.totalMedium, data.totalQuestions?.medium, data.totalQuestions?.Medium);
    const totalHard = firstDefined(data.totalHard, data.total_hard, data.solvedProblem?.totalHard, data.totalQuestions?.hard, data.totalQuestions?.Hard);
    return { totalSolved, easySolved, mediumSolved, hardSolved, totalEasy, totalMedium, totalHard };
  }

  async function loadStats(username) {
    submit.disabled = true;
    submit.textContent = "Loading…";
    message.textContent = "Requesting the latest stats. The first request can take a little while if the API is waking up.";
    try {
      const url = `https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}`;
      const response = await fetch(url, { headers: { "Accept": "application/json" } });
      if (!response.ok) throw new Error(`Stats service returned HTTP ${response.status}.`);
      const data = await response.json();
      if (data.errors || data.error || data.message === "User not found") throw new Error(data.error || data.message || "The username could not be found.");
      const stats = normalizeStats(data);
      if (stats.totalSolved === undefined && stats.easySolved === undefined && stats.mediumSolved === undefined && stats.hardSolved === undefined) {
        throw new Error("The API response did not contain recognizable solved-problem totals.");
      }
      const easy = number(stats.easySolved), medium = number(stats.mediumSolved), hard = number(stats.hardSolved);
      const total = firstDefined(stats.totalSolved, easy + medium + hard);
      setText("total-solved", number(total).toLocaleString());
      setText("easy-solved", easy.toLocaleString());
      setText("medium-solved", medium.toLocaleString());
      setText("hard-solved", hard.toLocaleString());
      setDifficulty("easy", easy, stats.totalEasy);
      setDifficulty("medium", medium, stats.totalMedium);
      setDifficulty("hard", hard, stats.totalHard);
      message.textContent = `Stats loaded for ${username}.`;
      activityGrid.innerHTML = "";
      activitySubtitle.textContent = "OPTIONAL DATA";
      activityNote.textContent = "Loading submission calendar…";
      try {
        const calendarResponse = await fetch(`https://alfa-leetcode-api.onrender.com/${encodeURIComponent(username)}/calendar`, { headers: { "Accept": "application/json" } });
        if (calendarResponse.ok) {
          const calendarData = await calendarResponse.json();
          renderCalendar(calendarData);
        } else {
          renderCalendar(null);
        }
      } catch (_) {
        renderCalendar(null);
      }
    } catch (error) {
      message.textContent = `${error.message} Check the username or try again later; this public API can be temporarily unavailable.`;
      activityGrid.innerHTML = "";
      activitySubtitle.textContent = "UNAVAILABLE";
      activityNote.textContent = "Activity could not be loaded.";
    } finally {
      submit.disabled = false;
      submit.textContent = "Load progress ↗";
    }
  }
  form.addEventListener("submit", event => {
    event.preventDefault();
    const username = input.value.trim();
    if (!username) { message.textContent = "Enter a LeetCode username first."; return; }
    loadStats(username);
  });
  // Do not trigger network traffic automatically; user can confirm or change the default username.
})();
