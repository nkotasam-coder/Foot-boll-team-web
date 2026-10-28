/* =========================================================================
   Iron Valley FC — Club Office
   -------------------------------------------------------------------------
   This front end mirrors the 8 tables in the `football_club_system`
   database (users, news, fixtures, match_reports, player_availability,
   sponsorships, enquiries, engagement_stats).

   It currently stores data in the browser via localStorage so it runs
   with zero setup. To wire it to your real MySQL database:
     1. Build small PHP endpoints (e.g. /api/fixtures.php) that do
        SELECT / INSERT / DELETE against phpMyAdmin's `football_club_system`.
     2. Replace the functions in the "DATA LAYER" section below with
        fetch() calls to those endpoints (they already return the same
        shape: an array of row objects).
   Everything else (rendering, forms, navigation) stays the same.
   ========================================================================= */

/* ---------------------------- DATA LAYER -------------------------------- */

const TABLES = {
  users: {
    columns: ["id", "full_name", "email", "role"],
    seed: [
      { id: 1, full_name: "Grace Uwase", email: "grace@ironvalleyfc.com", role: "Admin" },
      { id: 2, full_name: "Marc Okoro", email: "marc@ironvalleyfc.com", role: "Coach" },
    ],
  },
  news: {
    columns: ["id", "title", "author", "published_at"],
    seed: [
      { id: 1, title: "New training pitch opens next month", author: "Club Office", published_at: "2026-08-20", body: "Work on the second pitch is complete." },
    ],
  },
  fixtures: {
    columns: ["id", "opponent", "home_away", "match_date", "kickoff_time", "venue", "competition", "status"],
    seed: [
      { id: 1, opponent: "Redstone United", home_away: "Home", match_date: "2026-09-14", kickoff_time: "15:00", venue: "Iron Valley Park", competition: "League", status: "Upcoming" },
      { id: 2, opponent: "Northgate Athletic", home_away: "Away", match_date: "2026-09-05", kickoff_time: "18:30", venue: "Northgate Stadium", competition: "Cup", status: "Completed" },
    ],
  },
  match_reports: {
    columns: ["id", "fixture_id", "home_score", "away_score", "man_of_match", "summary"],
    seed: [
      { id: 1, fixture_id: 2, home_score: 1, away_score: 2, man_of_match: "D. Habimana", summary: "Late winner sealed a gritty away day." },
    ],
  },
  player_availability: {
    columns: ["id", "player_name", "position", "status", "notes"],
    seed: [
      { id: 1, player_name: "David Habimana", position: "Midfielder", status: "Available", notes: "" },
      { id: 2, player_name: "Eric Mugisha", position: "Defender", status: "Injured", notes: "Back in 2 weeks" },
    ],
  },
  sponsorships: {
    columns: ["id", "sponsor_name", "tier", "amount", "start_date", "end_date"],
    seed: [
      { id: 1, sponsor_name: "Highland Bank", tier: "Platinum", amount: 40000, start_date: "2026-01-01", end_date: "2026-12-31" },
    ],
  },
  enquiries: {
    columns: ["id", "name", "email", "subject", "submitted_at"],
    seed: [
      { id: 1, name: "Aline K.", email: "aline@example.com", subject: "Youth trials", submitted_at: "2026-09-01", message: "When are the next youth trials held?" },
    ],
  },
  engagement_stats: {
    columns: ["id", "metric_name", "value", "recorded_date"],
    seed: [
      { id: 1, metric_name: "Website visits", value: 3120, recorded_date: "2026-09-07" },
      { id: 2, metric_name: "Newsletter subscribers", value: 812, recorded_date: "2026-09-07" },
    ],
  },
};

function loadTable(name) {
  const raw = localStorage.getItem("fcs_" + name);
  if (raw) return JSON.parse(raw);
  const seed = TABLES[name].seed;
  localStorage.setItem("fcs_" + name, JSON.stringify(seed));
  return seed;
}

function saveTable(name, rows) {
  localStorage.setItem("fcs_" + name, JSON.stringify(rows));
}

function nextId(rows) {
  return rows.length ? Math.max(...rows.map((r) => r.id)) + 1 : 1;
}

function addRow(name, row) {
  const rows = loadTable(name);
  row.id = nextId(rows);
  rows.push(row);
  saveTable(name, rows);
  return rows;
}

function deleteRow(name, id) {
  const rows = loadTable(name).filter((r) => r.id !== id);
  saveTable(name, rows);
  return rows;
}

/* ---------------------------- RENDERING --------------------------------- */

function statusClass(status) {
  const s = (status || "").toLowerCase();
  if (["injured", "suspended", "postponed", "bad"].includes(s)) return "bad";
  if (["doubtful", "new"].includes(s)) return "warn";
  return "";
}

function renderTable(name) {
  const { columns } = TABLES[name];
  const rows = loadTable(name);
  const table = document.getElementById("table-" + name);
  const thead = table.querySelector("thead");
  const tbody = table.querySelector("tbody");

  thead.innerHTML =
    "<tr>" + columns.map((c) => `<th>${label(c)}</th>`).join("") + "<th></th></tr>";

  if (!rows.length) {
    tbody.innerHTML = `<tr class="empty-row"><td colspan="${columns.length + 1}">No records yet — add the first one above.</td></tr>`;
    return;
  }

  tbody.innerHTML = rows
    .map((row) => {
      const cells = columns
        .map((c) => {
          let val = row[c] ?? "";
          if (c === "status") {
            return `<td><span class="status-pill ${statusClass(val)}">${val}</span></td>`;
          }
          if (c === "amount") return `<td>$${Number(val).toLocaleString()}</td>`;
          return `<td>${val}</td>`;
        })
        .join("");
      return `<tr>${cells}<td><button class="del-btn" data-table="${name}" data-id="${row.id}">Remove</button></td></tr>`;
    })
    .join("");
}

function label(col) {
  return col
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function renderOverview() {
  const tickerRow = document.getElementById("tickerRow");
  const counts = Object.keys(TABLES).map((name) => ({
    name,
    count: loadTable(name).length,
  }));
  tickerRow.innerHTML = counts
    .map(
      (c) => `<div class="tick"><div class="num">${c.count}</div><div class="lbl">${label(c.name)}</div></div>`
    )
    .join("");

  const fixtures = loadTable("fixtures")
    .filter((f) => f.status === "Upcoming")
    .sort((a, b) => a.match_date.localeCompare(b.match_date));
  const next = fixtures[0];
  document.getElementById("nextFixture").innerHTML = next
    ? `<div class="vs">Iron Valley ${next.home_away === "Home" ? "vs" : "@"} ${next.opponent}</div>
       <div>${next.match_date} · ${next.kickoff_time} · ${next.venue || "TBC"}</div>`
    : `<span style="color:#8A9285;font-style:italic;">No upcoming fixtures logged.</span>`;

  const enquiries = loadTable("enquiries").slice(-4).reverse();
  document.getElementById("recentEnquiries").innerHTML = enquiries.length
    ? enquiries
        .map((e) => `<li><strong>${e.name}</strong> — ${e.subject || "General enquiry"}</li>`)
        .join("")
    : `<li style="color:#8A9285;font-style:italic;">No enquiries yet.</li>`;
}

function populateFixtureSelect() {
  const select = document.getElementById("reportFixtureSelect");
  const fixtures = loadTable("fixtures");
  select.innerHTML = fixtures
    .map((f) => `<option value="${f.id}">#${f.id} — vs ${f.opponent} (${f.match_date})</option>`)
    .join("");
}

function renderAll() {
  Object.keys(TABLES).forEach(renderTable);
  renderOverview();
  populateFixtureSelect();
}

/* ---------------------------- NAVIGATION --------------------------------- */

const railLinks = document.querySelectorAll(".rail-link");
const panels = document.querySelectorAll("[data-panel]");
const pageTitle = document.getElementById("pageTitle");
const pageSub = document.getElementById("pageSub");

const SUBTITLES = {
  overview: "A working snapshot of the club, pulled from eight tables.",
  fixtures: "Upcoming and past matches.",
  match_reports: "Scorelines and summaries tied to a fixture.",
  player_availability: "Who's fit for the next matchday.",
  news: "Club announcements and stories.",
  sponsorships: "Partners backing the club.",
  enquiries: "Messages submitted through the club site.",
  engagement_stats: "Site and audience metrics over time.",
  users: "People with access to the club office.",
};

railLinks.forEach((link) => {
  link.addEventListener("click", () => {
    const section = link.dataset.section;
    railLinks.forEach((l) => l.classList.remove("active"));
    link.classList.add("active");
    panels.forEach((p) => p.classList.add("hidden"));
    document.getElementById("panel-" + section).classList.remove("hidden");
    pageTitle.textContent = label(section);
    pageSub.textContent = SUBTITLES[section];
    if (section === "overview") renderOverview();
    if (section === "match_reports") populateFixtureSelect();
  });
});

/* ---------------------------- FORMS --------------------------------- */

Object.keys(TABLES).forEach((name) => {
  const form = document.getElementById("form-" + name);
  if (!form) return;
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form).entries());
    // numeric coercion for known numeric fields
    ["value", "amount", "home_score", "away_score", "fixture_id"].forEach((k) => {
      if (k in data) data[k] = Number(data[k]);
    });
    addRow(name, data);
    form.reset();
    renderAll();
  });
});

document.body.addEventListener("click", (e) => {
  if (e.target.matches(".del-btn")) {
    const { table, id } = e.target.dataset;
    deleteRow(table, Number(id));
    renderAll();
  }
});

/* ---------------------------- INIT --------------------------------- */

renderAll();
