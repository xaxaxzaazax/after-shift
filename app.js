const SUPABASE_URL = "https://vlddrxazjjtqdxoqlcwr.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_jZjq3fcOmrshCscHbNEdhw_rNvSeKZP";
const LEGACY_STORAGE_KEY = "after-shift.entries.v1";

const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
const $ = (selector) => document.querySelector(selector);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const wholeMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const elements = {
  authView: $("#authView"),
  appView: $("#appView"),
  bottomAction: $("#bottomAction"),
  emailAuthForm: $("#emailAuthForm"),
  authEmail: $("#authEmail"),
  emailLoginButton: $("#emailLoginButton"),
  authError: $("#authError"),
  authMessage: $("#authMessage"),
  syncStatus: $("#syncStatus"),
  todayLabel: $("#todayLabel"),
  weekRange: $("#weekRange"),
  weekTakeHome: $("#weekTakeHome"),
  weekSales: $("#weekSales"),
  weekTips: $("#weekTips"),
  weekTipOut: $("#weekTipOut"),
  weekTipRate: $("#weekTipRate"),
  weekTipOutRate: $("#weekTipOutRate"),
  shiftCount: $("#shiftCount"),
  weekProgress: $("#weekProgress"),
  weekHeading: $("#weekHeading"),
  previousWeekButton: $("#previousWeekButton"),
  nextWeekButton: $("#nextWeekButton"),
  emptyState: $("#emptyState"),
  shiftList: $("#shiftList"),
  clearButton: $("#clearButton"),
  shiftDialog: $("#shiftDialog"),
  infoDialog: $("#infoDialog"),
  shiftForm: $("#shiftForm"),
  shiftDate: $("#shiftDate"),
  salesInput: $("#salesInput"),
  tipsInput: $("#tipsInput"),
  tipOutInput: $("#tipOutInput"),
  takeHomePreview: $("#takeHomePreview"),
  formError: $("#formError")
};

let entries = [];
let currentUser = null;
let selectedWeekOffset = 0;
let sessionVersion = 0;
const legacyMigrationAttemptedFor = new Set();

function setAuthBusy(isBusy) {
  elements.emailLoginButton.disabled = isBusy;
}

function showSyncStatus(message) {
  elements.syncStatus.textContent = message;
  elements.syncStatus.hidden = !message;
}

async function sendSignInLink(event) {
  event.preventDefault();
  setAuthBusy(true);
  elements.authError.textContent = "";
  elements.authMessage.textContent = "";

  const emailRedirectTo = new URL("./", window.location.href).href;
  const { error } = await supabaseClient.auth.signInWithOtp({
    email: elements.authEmail.value.trim(),
    options: {
      emailRedirectTo,
      shouldCreateUser: true
    }
  });

  if (error) {
    elements.authError.textContent = error.message;
  } else {
    elements.authMessage.textContent = "Check your email and open the secure sign-in link.";
  }

  setAuthBusy(false);
}

function normalizeEntry(row) {
  return {
    id: row.id,
    date: row.shift_date,
    sales: Number(row.sales),
    tips: Number(row.tips),
    tipOut: Number(row.tip_out),
    createdAt: new Date(row.created_at).getTime()
  };
}

function validLegacyEntry(entry) {
  const date = entry && /^\d{4}-\d{2}-\d{2}$/.test(entry.date) ? parseDate(entry.date) : null;
  const amounts = entry ? [entry.sales, entry.tips, entry.tipOut] : [];
  return entry
    && date
    && !Number.isNaN(date.getTime())
    && localDateString(date) === entry.date
    && amounts.every((value) => Number.isFinite(value) && value >= 0 && value <= 9999999999.99)
    && entry.tipOut <= entry.tips
    && (entry.createdAt == null || (Number.isFinite(entry.createdAt) && !Number.isNaN(new Date(entry.createdAt).getTime())));
}

async function migrateLegacyEntries() {
  if (legacyMigrationAttemptedFor.has(currentUser.id)) return;
  legacyMigrationAttemptedFor.add(currentUser.id);

  let saved;

  try {
    saved = JSON.parse(localStorage.getItem(LEGACY_STORAGE_KEY));
  } catch {
    showSyncStatus("Older saved shift data could not be read and was left on this device.");
    return;
  }

  if (!Array.isArray(saved)) {
    if (saved !== null) showSyncStatus("Older saved shift data could not be read and was left on this device.");
    return;
  }

  if (saved.length === 0) {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    return;
  }

  const validEntries = saved.map((entry, index) => ({ entry, index })).filter(({ entry }) => validLegacyEntry(entry));
  const invalidEntries = saved.filter((entry) => !validLegacyEntry(entry));

  if (validEntries.length === 0) {
    showSyncStatus("Older saved shift data could not be moved and was left on this device.");
    return;
  }

  if (!confirm(`Move ${validEntries.length} saved ${validEntries.length === 1 ? "shift" : "shifts"} from this device into the email account you just used?`)) return;

  const rows = validEntries.map(({ entry, index }) => ({
    legacy_id: String(entry.id || `legacy-${index}-${entry.date}-${entry.createdAt || "unknown"}`),
    shift_date: entry.date,
    sales: entry.sales,
    tips: entry.tips,
    tip_out: entry.tipOut,
    created_at: new Date(entry.createdAt || Date.now()).toISOString()
  }));

  showSyncStatus(`Moving ${rows.length} saved ${rows.length === 1 ? "shift" : "shifts"} to your account...`);
  const { error } = await supabaseClient.from("shifts").upsert(rows, {
    onConflict: "user_id,legacy_id",
    ignoreDuplicates: true
  });

  if (error) throw error;
  if (invalidEntries.length > 0) {
    localStorage.setItem(LEGACY_STORAGE_KEY, JSON.stringify(invalidEntries));
    showSyncStatus(`${rows.length} shifts synced. ${invalidEntries.length} unreadable ${invalidEntries.length === 1 ? "entry was" : "entries were"} left on this device.`);
  } else {
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    showSyncStatus("Your saved shifts are now securely synced.");
  }
  setTimeout(() => showSyncStatus(""), 3500);
}

async function loadEntries(userId) {
  const { data, error } = await supabaseClient
    .from("shifts")
    .select("id, shift_date, sales, tips, tip_out, created_at")
    .order("shift_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (currentUser?.id !== userId) return;
  entries = data.map(normalizeEntry);
  render();
}

async function applySession(session) {
  const version = ++sessionVersion;
  currentUser = session?.user ?? null;
  elements.authView.hidden = Boolean(currentUser);
  elements.appView.hidden = !currentUser;
  elements.bottomAction.hidden = !currentUser;
  setAuthBusy(false);

  if (!currentUser) {
    entries = [];
    showSyncStatus("");
    return;
  }

  const userId = currentUser.id;
  showSyncStatus("Loading your shifts...");

  try {
    await migrateLegacyEntries();
    await loadEntries(userId);
    if (version === sessionVersion && elements.syncStatus.textContent === "Loading your shifts...") showSyncStatus("");
  } catch (error) {
    if (version === sessionVersion) showSyncStatus(`Could not load your shifts: ${error.message}`);
  }
}

function parseDate(dateString) {
  return new Date(`${dateString}T12:00:00`);
}

function localDateString(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 10);
}

function getWeekBounds(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const day = start.getDay();
  start.setDate(start.getDate() - (day === 0 ? 6 : day - 1));
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function sum(list, field) {
  return list.reduce((total, item) => total + item[field], 0);
}

function tipRate(tips, sales) {
  return sales > 0 ? (tips / sales) * 100 : 0;
}

function formatRate(rate) {
  return `${rate.toFixed(1)}%`;
}

function render() {
  const now = new Date();
  const selectedDate = new Date(now);
  selectedDate.setDate(selectedDate.getDate() - selectedWeekOffset * 7);
  const { start, end } = getWeekBounds(selectedDate);
  const currentWeekStart = getWeekBounds(now).start;
  const thisWeek = entries.filter((entry) => {
    const date = parseDate(entry.date);
    return date >= start && date <= end;
  });

  const sales = sum(thisWeek, "sales");
  const tips = sum(thisWeek, "tips");
  const tipOut = sum(thisWeek, "tipOut");
  const takeHome = tips - tipOut;

  elements.todayLabel.textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
  elements.weekHeading.textContent = selectedWeekOffset === 0 ? "This week" : selectedWeekOffset === 1 ? "Last week" : `${selectedWeekOffset} weeks ago`;
  elements.nextWeekButton.disabled = selectedWeekOffset === 0;
  elements.weekRange.textContent = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  elements.weekTakeHome.textContent = money.format(takeHome);
  elements.weekSales.textContent = wholeMoney.format(sales);
  elements.weekTips.textContent = wholeMoney.format(tips);
  elements.weekTipOut.textContent = wholeMoney.format(tipOut);
  elements.weekTipRate.textContent = formatRate(tipRate(tips, sales));
  elements.weekTipOutRate.textContent = formatRate(tipRate(tipOut, sales));
  elements.shiftCount.textContent = `${thisWeek.length} ${thisWeek.length === 1 ? "shift" : "shifts"}`;
  elements.weekProgress.style.width = selectedWeekOffset === 0 ? `${Math.min(100, ((now.getDay() || 7) / 7) * 100)}%` : "100%";

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  elements.emptyState.hidden = sorted.length > 0;
  elements.clearButton.hidden = sorted.length === 0;
  const groups = new Map();
  sorted.forEach((entry) => {
    const bounds = getWeekBounds(parseDate(entry.date));
    const key = localDateString(bounds.start);
    if (!groups.has(key)) groups.set(key, { ...bounds, entries: [] });
    groups.get(key).entries.push(entry);
  });
  elements.shiftList.replaceChildren(...[...groups.values()].map((group) => createWeekGroup(group, currentWeekStart)));
}

function createWeekGroup(group, currentWeekStart) {
  const wrapper = document.createElement("section");
  wrapper.className = "week-group";

  const heading = document.createElement("div");
  heading.className = "week-group-heading";
  const label = document.createElement("div");
  const title = document.createElement("strong");
  const isCurrentWeek = localDateString(group.start) === localDateString(currentWeekStart);
  title.textContent = isCurrentWeek ? "This week" : `Week of ${group.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const range = document.createElement("p");
  range.textContent = `${group.entries.length} ${group.entries.length === 1 ? "shift" : "shifts"} - through ${group.end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  label.append(title, range);

  const total = document.createElement("div");
  total.className = "week-group-total";
  const caption = document.createElement("span");
  caption.textContent = "WALKED WITH";
  const amount = document.createElement("strong");
  amount.textContent = money.format(sum(group.entries, "tips") - sum(group.entries, "tipOut"));
  total.append(caption, amount);
  heading.append(label, total);
  wrapper.append(heading, ...group.entries.map(createShiftRow));
  return wrapper;
}

function createShiftRow(entry) {
  const date = parseDate(entry.date);
  const row = document.createElement("article");
  row.className = "shift-row";

  const badge = document.createElement("div");
  badge.className = "date-badge";
  const month = document.createElement("span");
  month.textContent = date.toLocaleDateString("en-US", { month: "short" }).toUpperCase();
  const day = document.createElement("strong");
  day.textContent = date.getDate();
  badge.append(month, day);

  const details = document.createElement("div");
  details.className = "shift-details";
  const title = document.createElement("strong");
  title.textContent = date.toLocaleDateString("en-US", { weekday: "long" });
  const breakdown = document.createElement("p");
  breakdown.textContent = `${wholeMoney.format(entry.sales)} sales - ${formatRate(tipRate(entry.tips, entry.sales))} tips - ${formatRate(tipRate(entry.tipOut, entry.sales))} tip out`;
  details.append(title, breakdown);

  const result = document.createElement("div");
  result.className = "shift-result";
  const amount = document.createElement("strong");
  amount.textContent = money.format(entry.tips - entry.tipOut);
  const remove = document.createElement("button");
  remove.className = "delete-button";
  remove.type = "button";
  remove.textContent = "Delete";
  remove.setAttribute("aria-label", `Delete ${title.textContent} shift`);
  remove.addEventListener("click", () => deleteEntry(entry.id));
  result.append(amount, remove);

  row.append(badge, details, result);
  return row;
}

function parseAmount(value) {
  const normalized = value.replace(/[$,\s]/g, "");
  if (normalized === "") return NaN;
  return Number(normalized);
}

function updatePreview() {
  const tips = parseAmount(elements.tipsInput.value) || 0;
  const tipOut = parseAmount(elements.tipOutInput.value) || 0;
  elements.takeHomePreview.textContent = money.format(tips - tipOut);
}

function openShiftForm() {
  elements.shiftForm.reset();
  elements.shiftDate.value = localDateString();
  elements.formError.textContent = "";
  updatePreview();
  elements.shiftDialog.showModal();
  setTimeout(() => elements.salesInput.focus(), 150);
}

async function submitShift(event) {
  event.preventDefault();
  const sales = parseAmount(elements.salesInput.value);
  const tips = parseAmount(elements.tipsInput.value);
  const tipOut = parseAmount(elements.tipOutInput.value);

  if (![sales, tips, tipOut].every((value) => Number.isFinite(value) && value >= 0)) {
    elements.formError.textContent = "Enter a valid amount in each field.";
    return;
  }
  if (tipOut > tips) {
    elements.formError.textContent = "Tip out cannot be more than your total tips.";
    return;
  }

  const saveButton = elements.shiftForm.querySelector(".save-button");
  saveButton.disabled = true;
  elements.formError.textContent = "";
  const { data, error } = await supabaseClient
    .from("shifts")
    .insert({
      shift_date: elements.shiftDate.value,
      sales: Math.round(sales * 100) / 100,
      tips: Math.round(tips * 100) / 100,
      tip_out: Math.round(tipOut * 100) / 100
    })
    .select("id, shift_date, sales, tips, tip_out, created_at")
    .single();
  saveButton.disabled = false;

  if (error) {
    elements.formError.textContent = error.message;
    return;
  }

  entries.push(normalizeEntry(data));
  render();
  elements.shiftDialog.close();
}

async function deleteEntry(id) {
  if (!confirm("Delete this shift?")) return;
  const { error } = await supabaseClient.from("shifts").delete().eq("id", id);

  if (error) {
    alert(`Could not delete the shift: ${error.message}`);
    return;
  }

  entries = entries.filter((entry) => entry.id !== id);
  render();
}

async function clearEntries() {
  if (!confirm("Delete all of your shift history? This cannot be undone.")) return;
  const { error } = await supabaseClient.from("shifts").delete().eq("user_id", currentUser.id);

  if (error) {
    alert(`Could not clear your shifts: ${error.message}`);
    return;
  }

  entries = [];
  render();
}

function closeOnBackdrop(event) {
  if (event.target === event.currentTarget) event.currentTarget.close();
}

elements.emailAuthForm.addEventListener("submit", sendSignInLink);
$("#signOutButton").addEventListener("click", () => supabaseClient.auth.signOut());
$("#addButton").addEventListener("click", openShiftForm);
elements.previousWeekButton.addEventListener("click", () => {
  selectedWeekOffset += 1;
  render();
});
elements.nextWeekButton.addEventListener("click", () => {
  selectedWeekOffset = Math.max(0, selectedWeekOffset - 1);
  render();
});
$("#closeButton").addEventListener("click", () => elements.shiftDialog.close());
elements.shiftForm.addEventListener("submit", submitShift);
elements.tipsInput.addEventListener("input", updatePreview);
elements.tipOutInput.addEventListener("input", updatePreview);
elements.shiftDialog.addEventListener("click", closeOnBackdrop);
elements.infoDialog.addEventListener("click", closeOnBackdrop);
$("#infoButton").addEventListener("click", () => elements.infoDialog.showModal());
$("#closeInfoButton").addEventListener("click", () => elements.infoDialog.close());
$("#gotItButton").addEventListener("click", () => elements.infoDialog.close());
elements.clearButton.addEventListener("click", clearEntries);

async function initialize() {
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) elements.authError.textContent = sessionError.message;
  await applySession(session);

  supabaseClient.auth.onAuthStateChange((event, nextSession) => {
    if (event === "INITIAL_SESSION") return;
    setTimeout(() => applySession(nextSession), 0);
  });
}

initialize();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}
