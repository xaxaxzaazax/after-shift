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
  authPassword: $("#authPassword"),
  authCopy: $("#authCopy"),
  authModeButton: $("#authModeButton"),
  forgotPasswordButton: $("#forgotPasswordButton"),
  emailLoginButton: $("#emailLoginButton"),
  authError: $("#authError"),
  authMessage: $("#authMessage"),
  resetDialog: $("#resetDialog"),
  resetForm: $("#resetForm"),
  newPasswordInput: $("#newPasswordInput"),
  resetError: $("#resetError"),
  syncStatus: $("#syncStatus"),
  todayLabel: $("#todayLabel"),
  weekRange: $("#weekRange"),
  weekTakeHome: $("#weekTakeHome"),
  weekSales: $("#weekSales"),
  weekTips: $("#weekTips"),
  weekTipOut: $("#weekTipOut"),
  weekTipRate: $("#weekTipRate"),
  weekTipOutRate: $("#weekTipOutRate"),
  weekHours: $("#weekHours"),
  weekHourly: $("#weekHourly"),
  shiftCount: $("#shiftCount"),
  weekProgress: $("#weekProgress"),
  weekHeading: $("#weekHeading"),
  previousWeekButton: $("#previousWeekButton"),
  nextWeekButton: $("#nextWeekButton"),
  goalButton: $("#goalButton"),
  monthPeriodButton: $("#monthPeriodButton"),
  yearPeriodButton: $("#yearPeriodButton"),
  previousSummaryButton: $("#previousSummaryButton"),
  nextSummaryButton: $("#nextSummaryButton"),
  summaryHeading: $("#summaryHeading"),
  summaryShiftCount: $("#summaryShiftCount"),
  summaryTakeHome: $("#summaryTakeHome"),
  summarySales: $("#summarySales"),
  summaryTips: $("#summaryTips"),
  summaryHours: $("#summaryHours"),
  summaryHourly: $("#summaryHourly"),
  summaryGoalWrap: $("#summaryGoalWrap"),
  summaryGoalLabel: $("#summaryGoalLabel"),
  summaryGoalValue: $("#summaryGoalValue"),
  summaryGoalProgress: $("#summaryGoalProgress"),
  chartTitle: $("#chartTitle"),
  chartRange: $("#chartRange"),
  earningsChart: $("#earningsChart"),
  emptyState: $("#emptyState"),
  shiftList: $("#shiftList"),
  homePage: $("#homePage"),
  earningsPage: $("#earningsPage"),
  homeTabButton: $("#homeTabButton"),
  earningsTabButton: $("#earningsTabButton"),
  shiftDialog: $("#shiftDialog"),
  goalDialog: $("#goalDialog"),
  accountDialog: $("#accountDialog"),
  reportScanButton: $("#reportScanButton"),
  reportImageInput: $("#reportImageInput"),
  scanNotice: $("#scanNotice"),
  goalForm: $("#goalForm"),
  weeklyGoalInput: $("#weeklyGoalInput"),
  monthlyGoalInput: $("#monthlyGoalInput"),
  goalError: $("#goalError"),
  accountError: $("#accountError"),
  shiftForm: $("#shiftForm"),
  shiftDate: $("#shiftDate"),
  salesInput: $("#salesInput"),
  tipsInput: $("#tipsInput"),
  tipOutInput: $("#tipOutInput"),
  hoursInput: $("#hoursInput"),
  notesInput: $("#notesInput"),
  takeHomePreview: $("#takeHomePreview"),
  formError: $("#formError")
};

let entries = [];
let currentUser = null;
let selectedWeekOffset = 0;
let summaryPeriod = "month";
let summaryOffset = 0;
let sessionVersion = 0;
let loadedUserId = null;
let lastLoadedAt = 0;
let backgroundRefresh = null;
let dataVersion = 0;
let goals = { weekly: null, monthly: null };
const legacyMigrationAttemptedFor = new Set();
let authMode = "login";
let selectedReportImage = null;

function setAuthBusy(isBusy) {
  elements.emailLoginButton.disabled = isBusy;
}

function showSyncStatus(message) {
  elements.syncStatus.textContent = message;
  elements.syncStatus.hidden = !message;
}

function setAuthMode(mode) {
  authMode = mode;
  const isLogin = mode === "login";
  elements.authCopy.textContent = isLogin
    ? "Welcome back. Log in to see your shifts, goals, and earnings."
    : "Create a free account to start tracking your tips, hours, and take-home pay.";
  elements.emailLoginButton.textContent = isLogin ? "Log in" : "Create account";
  elements.authModeButton.innerHTML = isLogin
    ? "New here? <b>Create an account</b>"
    : "Already have an account? <b>Log in</b>";
  elements.authPassword.autocomplete = isLogin ? "current-password" : "new-password";
  elements.forgotPasswordButton.hidden = !isLogin;
  elements.authError.textContent = "";
  elements.authMessage.textContent = "";
}

async function submitAuth(event) {
  event.preventDefault();
  setAuthBusy(true);
  elements.authError.textContent = "";
  elements.authMessage.textContent = "";

  const email = elements.authEmail.value.trim();
  const password = elements.authPassword.value;

  if (authMode === "signup") {
    const emailRedirectTo = new URL("./", window.location.href).href;
    const { data, error } = await supabaseClient.auth.signUp({
      email,
      password,
      options: { emailRedirectTo }
    });

    if (error) {
      elements.authError.textContent = error.message;
    } else if (data.user && !data.session) {
      elements.authMessage.textContent = "Almost there! Check your email and confirm your address to finish signing up.";
    }
    setAuthBusy(false);
    return;
  }

  const { error } = await supabaseClient.auth.signInWithPassword({ email, password });

  if (error) {
    if (error.code === "invalid_credentials") {
      elements.authError.textContent = "Wrong email or password. If you signed up before passwords existed, tap \"Forgot password?\" to set one.";
    } else if (error.code === "email_not_confirmed") {
      elements.authError.textContent = "Please confirm your email first - check your inbox for the confirmation link.";
    } else {
      elements.authError.textContent = error.message;
    }
    setAuthBusy(false);
  }
}

async function sendPasswordReset() {
  const email = elements.authEmail.value.trim();
  elements.authError.textContent = "";
  elements.authMessage.textContent = "";

  if (!email) {
    elements.authError.textContent = "Enter your email address above first, then tap Forgot password.";
    elements.authEmail.focus();
    return;
  }

  elements.forgotPasswordButton.disabled = true;
  const redirectTo = new URL("./", window.location.href).href;
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, { redirectTo });
  elements.forgotPasswordButton.disabled = false;

  if (error) {
    if (error.status === 429) {
      elements.authError.textContent = "Please wait a minute before requesting another reset email.";
    } else {
      elements.authError.textContent = error.message;
    }
    return;
  }

  elements.authMessage.textContent = "Check your email for a link to reset your password.";
}

async function saveNewPassword(event) {
  event.preventDefault();
  elements.resetError.textContent = "";
  const saveButton = elements.resetForm.querySelector(".save-button");
  saveButton.disabled = true;
  const { error } = await supabaseClient.auth.updateUser({ password: elements.newPasswordInput.value });
  saveButton.disabled = false;

  if (error) {
    elements.resetError.textContent = error.message;
    return;
  }

  elements.resetForm.reset();
  elements.resetDialog.close();
  showSyncStatus("Your password has been updated.");
  setTimeout(() => showSyncStatus(""), 3500);
}

function normalizeEntry(row) {
  return {
    id: row.id,
    date: row.shift_date,
    sales: row.sales == null ? null : Number(row.sales),
    tips: Number(row.tips),
    tipOut: row.tip_out == null ? 0 : Number(row.tip_out),
    hours: row.hours_worked == null ? null : Number(row.hours_worked),
    notes: row.notes || "",
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

async function fetchEntries() {
  const { data, error } = await supabaseClient
    .from("shifts")
    .select("id, shift_date, sales, tips, tip_out, hours_worked, notes, created_at")
    .order("shift_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data.map(normalizeEntry);
}

async function fetchGoals() {
  const { data, error } = await supabaseClient
    .from("user_goals")
    .select("weekly_take_home, monthly_take_home")
    .maybeSingle();

  if (error) throw error;
  return {
    weekly: data?.weekly_take_home == null ? null : Number(data.weekly_take_home),
    monthly: data?.monthly_take_home == null ? null : Number(data.monthly_take_home)
  };
}

async function applySession(session) {
  const version = ++sessionVersion;
  const nextUser = session?.user ?? null;
  const sameLoadedUser = nextUser && loadedUserId === nextUser.id;
  currentUser = nextUser;
  elements.authView.hidden = Boolean(currentUser);
  elements.appView.hidden = !sameLoadedUser;
  elements.bottomAction.hidden = !sameLoadedUser || elements.homePage.hidden;
  setAuthBusy(false);

  if (!currentUser) {
    entries = [];
    goals = { weekly: null, monthly: null };
    loadedUserId = null;
    lastLoadedAt = 0;
    if (elements.shiftDialog.open) elements.shiftDialog.close();
    if (elements.goalDialog.open) elements.goalDialog.close();
    if (elements.accountDialog.open) elements.accountDialog.close();
    if (elements.resetDialog.open) elements.resetDialog.close();
    render();
    showSyncStatus("");
    return;
  }

  if (sameLoadedUser) return;

  const userId = currentUser.id;
  entries = [];
  goals = { weekly: null, monthly: null };
  render();
  showSyncStatus("Loading your shifts...");

  try {
    await migrateLegacyEntries();
    const [nextEntries, nextGoals] = await Promise.all([fetchEntries(), fetchGoals()]);
    if (currentUser?.id !== userId) return;
    entries = nextEntries;
    goals = nextGoals;
    loadedUserId = userId;
    lastLoadedAt = Date.now();
    render();
    elements.appView.hidden = false;
    showPage("home");
    if (version === sessionVersion && elements.syncStatus.textContent === "Loading your shifts...") showSyncStatus("");
  } catch (error) {
    if (version === sessionVersion) {
      elements.appView.hidden = false;
      showPage("home");
      showSyncStatus(`Could not load your shifts: ${error.message}`);
    }
  }
}

async function refreshInBackground() {
  if (!currentUser || backgroundRefresh || Date.now() - lastLoadedAt < 300000) return;
  const userId = currentUser.id;
  const version = dataVersion;
  backgroundRefresh = Promise.all([fetchEntries(), fetchGoals()]);
  try {
    const [nextEntries, nextGoals] = await backgroundRefresh;
    if (currentUser?.id !== userId || dataVersion !== version) return;
    entries = nextEntries;
    goals = nextGoals;
    lastLoadedAt = Date.now();
    render();
  } catch (error) {
    if (currentUser?.id === userId) showSyncStatus(`Could not refresh your shifts: ${error.message}`);
  } finally {
    backgroundRefresh = null;
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

function getMonthBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
  return { start, end };
}

function getYearBounds(date = new Date()) {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);
  return { start, end };
}

function sum(list, field) {
  return list.reduce((total, item) => total + (item[field] || 0), 0);
}

function salesEntries(list) {
  return list.filter((entry) => entry.sales != null);
}

function tipRate(tips, sales) {
  return sales > 0 ? (tips / sales) * 100 : 0;
}

function formatRate(rate) {
  return `${rate.toFixed(1)}%`;
}

function takeHome(list) {
  return sum(list, "tips") - sum(list, "tipOut");
}

function totalHours(list) {
  return list.reduce((total, entry) => total + (entry.hours || 0), 0);
}

function hourlyEarnings(list) {
  const timedEntries = list.filter((entry) => entry.hours > 0);
  const hours = totalHours(timedEntries);
  return hours > 0 ? takeHome(timedEntries) / hours : 0;
}

function entriesBetween(start, end) {
  return entries.filter((entry) => {
    const date = parseDate(entry.date);
    return date >= start && date <= end;
  });
}

function selectedSummaryDate() {
  const date = new Date();
  if (summaryPeriod === "month") {
    date.setDate(1);
    date.setMonth(date.getMonth() - summaryOffset);
  }
  else date.setFullYear(date.getFullYear() - summaryOffset);
  return date;
}

function createChartBuckets(date) {
  if (summaryPeriod === "year") {
    return Array.from({ length: 12 }, (_, month) => {
      const { start, end } = getMonthBounds(new Date(date.getFullYear(), month, 1));
      return { label: start.toLocaleDateString("en-US", { month: "short" }), value: takeHome(entriesBetween(start, end)) };
    });
  }

  const monthBounds = getMonthBounds(date);
  const buckets = [];
  let cursor = new Date(monthBounds.start);
  while (cursor <= monthBounds.end) {
    const week = getWeekBounds(cursor);
    const start = new Date(Math.max(week.start.getTime(), monthBounds.start.getTime()));
    const end = new Date(Math.min(week.end.getTime(), monthBounds.end.getTime()));
    buckets.push({ label: `${start.getDate()}-${end.getDate()}`, value: takeHome(entriesBetween(start, end)) });
    cursor = new Date(end);
    cursor.setDate(cursor.getDate() + 1);
  }
  return buckets;
}

function renderChart(buckets) {
  const max = Math.max(1, ...buckets.map((bucket) => bucket.value));
  const compactMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", notation: "compact", maximumFractionDigits: 1 });
  elements.earningsChart.replaceChildren(...buckets.map((bucket) => {
    const column = document.createElement("div");
    column.className = "chart-column";
    const value = document.createElement("span");
    value.className = "chart-value";
    value.textContent = bucket.value > 0 ? compactMoney.format(bucket.value) : "$0";
    const wrap = document.createElement("div");
    wrap.className = "chart-bar-wrap";
    const bar = document.createElement("span");
    bar.className = "chart-bar";
    bar.style.height = `${Math.max(3, (bucket.value / max) * 100)}%`;
    bar.title = `${bucket.label}: ${money.format(bucket.value)}`;
    const label = document.createElement("span");
    label.className = "chart-label";
    label.textContent = bucket.label;
    wrap.append(bar);
    column.append(value, wrap, label);
    return column;
  }));
  elements.earningsChart.setAttribute("aria-label", buckets.map((bucket) => `${bucket.label}: ${money.format(bucket.value)}`).join(", "));
}

function renderSummary() {
  const date = selectedSummaryDate();
  const bounds = summaryPeriod === "month" ? getMonthBounds(date) : getYearBounds(date);
  const list = entriesBetween(bounds.start, bounds.end);
  const earnings = takeHome(list);
  const hours = totalHours(list);
  const goal = summaryPeriod === "month" ? goals.monthly : null;

  elements.monthPeriodButton.classList.toggle("active", summaryPeriod === "month");
  elements.yearPeriodButton.classList.toggle("active", summaryPeriod === "year");
  elements.nextSummaryButton.disabled = summaryOffset === 0;
  elements.summaryHeading.textContent = summaryPeriod === "month"
    ? date.toLocaleDateString("en-US", { month: "long", year: "numeric" })
    : String(date.getFullYear());
  const withSales = salesEntries(list);
  elements.summaryShiftCount.textContent = `${list.length} ${list.length === 1 ? "shift" : "shifts"}`;
  elements.summaryTakeHome.textContent = money.format(earnings);
  elements.summarySales.textContent = withSales.length ? wholeMoney.format(sum(withSales, "sales")) : "—";
  elements.summaryTips.textContent = wholeMoney.format(sum(list, "tips"));
  elements.summaryHours.textContent = hours > 0 ? `${hours.toFixed(hours % 1 ? 1 : 0)}h` : "—";
  elements.summaryHourly.textContent = hourlyEarnings(list) > 0 ? money.format(hourlyEarnings(list)) : "—";
  elements.summaryGoalWrap.hidden = !goal;
  if (goal) {
    const percent = Math.min(100, (earnings / goal) * 100);
    elements.summaryGoalLabel.textContent = `${Math.round(percent)}% of monthly goal`;
    elements.summaryGoalValue.textContent = `${money.format(earnings)} / ${money.format(goal)}`;
    elements.summaryGoalProgress.style.width = `${percent}%`;
  }

  const buckets = createChartBuckets(date);
  elements.chartTitle.textContent = summaryPeriod === "month" ? "Earnings by week" : "Earnings by month";
  elements.chartRange.textContent = summaryPeriod === "month" ? "days of month" : String(date.getFullYear());
  elements.earningsChart.classList.toggle("year-chart", summaryPeriod === "year");
  renderChart(buckets);
}

function render() {
  const now = new Date();
  const selectedDate = new Date(now);
  selectedDate.setDate(selectedDate.getDate() - selectedWeekOffset * 7);
  const { start, end } = getWeekBounds(selectedDate);
  const currentWeekStart = getWeekBounds(now).start;
  const thisWeek = entriesBetween(start, end);

  const withSales = salesEntries(thisWeek);
  const sales = sum(withSales, "sales");
  const salesTips = sum(withSales, "tips");
  const salesTipOut = sum(withSales, "tipOut");
  const tips = sum(thisWeek, "tips");
  const tipOut = sum(thisWeek, "tipOut");
  const takeHome = tips - tipOut;
  const hours = totalHours(thisWeek);

  elements.todayLabel.textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
  elements.weekHeading.textContent = selectedWeekOffset === 0 ? "This week" : selectedWeekOffset === 1 ? "Last week" : `${selectedWeekOffset} weeks ago`;
  elements.nextWeekButton.disabled = selectedWeekOffset === 0;
  elements.weekRange.textContent = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  elements.weekTakeHome.textContent = money.format(takeHome);
  elements.weekSales.textContent = withSales.length ? wholeMoney.format(sales) : "—";
  elements.weekTips.textContent = wholeMoney.format(tips);
  elements.weekTipOut.textContent = tipOut > 0 ? wholeMoney.format(tipOut) : "—";
  elements.weekTipRate.textContent = withSales.length ? formatRate(tipRate(salesTips, sales)) : "—";
  elements.weekTipOutRate.textContent = withSales.length ? formatRate(tipRate(salesTipOut, sales)) : "—";
  elements.weekHours.textContent = hours > 0 ? `${hours.toFixed(hours % 1 ? 1 : 0)} hrs` : "—";
  elements.weekHourly.textContent = hourlyEarnings(thisWeek) > 0 ? money.format(hourlyEarnings(thisWeek)) : "—";
  elements.shiftCount.textContent = `${thisWeek.length} ${thisWeek.length === 1 ? "shift" : "shifts"}`;
  const weeklyProgress = goals.weekly ? Math.min(100, (takeHome / goals.weekly) * 100) : (selectedWeekOffset === 0 ? Math.min(100, ((now.getDay() || 7) / 7) * 100) : 100);
  elements.weekProgress.style.width = `${weeklyProgress}%`;
  elements.goalButton.textContent = goals.weekly ? `${Math.round(weeklyProgress)}% of ${wholeMoney.format(goals.weekly)} goal` : "Set goals";

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt - a.createdAt);
  elements.emptyState.hidden = sorted.length > 0;
  const groups = new Map();
  sorted.forEach((entry) => {
    const bounds = getWeekBounds(parseDate(entry.date));
    const key = localDateString(bounds.start);
    if (!groups.has(key)) groups.set(key, { ...bounds, entries: [] });
    groups.get(key).entries.push(entry);
  });
  elements.shiftList.replaceChildren(...[...groups.values()].map((group) => createWeekGroup(group, currentWeekStart)));
  renderSummary();
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
  const parts = [];
  if (entry.sales != null) {
    parts.push(`${wholeMoney.format(entry.sales)} sales`);
    parts.push(`${formatRate(tipRate(entry.tips, entry.sales))} tips`);
    if (entry.tipOut > 0) parts.push(`${formatRate(tipRate(entry.tipOut, entry.sales))} tip out`);
  } else {
    parts.push(`${money.format(entry.tips)} tips`);
    if (entry.tipOut > 0) parts.push(`${money.format(entry.tipOut)} tip out`);
  }
  if (entry.hours) parts.push(`${entry.hours.toFixed(entry.hours % 1 ? 1 : 0)} hrs - ${money.format((entry.tips - entry.tipOut) / entry.hours)}/hr`);
  breakdown.textContent = parts.join(" - ");
  details.append(title, breakdown);
  if (entry.notes) {
    const note = document.createElement("p");
    note.className = "shift-note";
    note.textContent = entry.notes;
    details.append(note);
  }

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

function openShiftForm(scannedFields = null) {
  elements.shiftForm.reset();
  elements.shiftDate.value = localDateString();
  elements.formError.textContent = "";
  elements.scanNotice.hidden = true;
  elements.scanNotice.textContent = "";

  if (scannedFields) {
    if (/^\d{4}-\d{2}-\d{2}$/.test(scannedFields.shiftDate || "")) elements.shiftDate.value = scannedFields.shiftDate;
    if (Number.isFinite(scannedFields.sales) && scannedFields.sales >= 0) elements.salesInput.value = scannedFields.sales;
    if (Number.isFinite(scannedFields.tips) && scannedFields.tips >= 0) elements.tipsInput.value = scannedFields.tips;
    if (Number.isFinite(scannedFields.tipOut) && scannedFields.tipOut >= 0) elements.tipOutInput.value = scannedFields.tipOut;
    if (Number.isFinite(scannedFields.hours) && scannedFields.hours > 0 && scannedFields.hours <= 24) elements.hoursInput.value = scannedFields.hours;

    const source = scannedFields.restaurantName ? ` from ${scannedFields.restaurantName}` : "";
    const warningText = Array.isArray(scannedFields.warnings) && scannedFields.warnings.length
      ? ` ${scannedFields.warnings.join(" ")}`
      : "";
    elements.scanNotice.textContent = `Report scanned${source} with ${scannedFields.confidence || "unknown"} confidence. Review every field before saving.${warningText}`;
    elements.scanNotice.hidden = false;
  }

  updatePreview();
  elements.shiftDialog.showModal();
  setTimeout(() => (scannedFields ? elements.shiftDate : elements.tipsInput).focus(), 150);
}

function resetScanner() {
  selectedReportImage = null;
  elements.reportImageInput.value = "";
  elements.reportScanButton.disabled = false;
}

function openScanner() {
  resetScanner();
  showSyncStatus("");
  elements.reportImageInput.click();
}

async function resizeReportImage(file) {
  let image;
  let objectUrl;
  if ("createImageBitmap" in window) {
    try {
      image = await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      image = null;
    }
  }
  if (!image) {
    objectUrl = URL.createObjectURL(file);
    image = new Image();
    image.src = objectUrl;
    await image.decode();
  }
  const maxDimension = 1800;
  const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(image.width * scale));
  canvas.height = Math.max(1, Math.round(image.height * scale));
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.drawImage(image, 0, 0, canvas.width, canvas.height);
  if (typeof image.close === "function") image.close();
  if (objectUrl) URL.revokeObjectURL(objectUrl);
  return canvas.toDataURL("image/jpeg", 0.86);
}

async function selectReportImage() {
  const [file] = elements.reportImageInput.files;
  selectedReportImage = null;
  if (!file) return;
  if (!file.type.startsWith("image/")) {
    showSyncStatus("Choose a photo of the tip report.");
    return;
  }
  if (file.size > 20 * 1024 * 1024) {
    showSyncStatus("Choose a report photo smaller than 20 MB.");
    return;
  }

  showSyncStatus("Preparing your report photo...");
  try {
    selectedReportImage = await resizeReportImage(file);
  } catch {
    showSyncStatus("This photo could not be opened. Try taking another picture.");
    return;
  }

  await scanSelectedReport();
}

async function scanSelectedReport() {
  if (!selectedReportImage) return;
  elements.reportScanButton.disabled = true;
  showSyncStatus("Reading the date and totals from your report...");

  let data;
  let error;
  try {
    ({ data, error } = await supabaseClient.functions.invoke("scan-tip-report", {
      body: {
        image: selectedReportImage,
        currentDate: localDateString(),
        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || null
      }
    }));
  } catch {
    elements.reportScanButton.disabled = false;
    showSyncStatus("The report could not be scanned. Check your connection and try again.");
    return;
  }

  if (error || !data?.fields) {
    let message = error?.message || data?.error || "The report could not be read.";
    if (error?.context instanceof Response) {
      try {
        const details = await error.context.clone().json();
        if (details.error) message = details.error;
      } catch {
        // Keep the generic function error when no JSON response is available.
      }
    }
    elements.reportScanButton.disabled = false;
    showSyncStatus(message);
    return;
  }

  const fields = data.fields;
  resetScanner();
  showSyncStatus("");
  openShiftForm(fields);
}

async function submitShift(event) {
  event.preventDefault();
  const tips = parseAmount(elements.tipsInput.value);
  const sales = elements.salesInput.value.trim() === "" ? null : parseAmount(elements.salesInput.value);
  const tipOut = elements.tipOutInput.value.trim() === "" ? 0 : parseAmount(elements.tipOutInput.value);
  const hours = elements.hoursInput.value.trim() === "" ? null : Number(elements.hoursInput.value);
  const notes = elements.notesInput.value.trim();

  if (!Number.isFinite(tips) || tips < 0) {
    elements.formError.textContent = "Enter your total tips (0 is fine).";
    return;
  }
  if (sales !== null && (!Number.isFinite(sales) || sales < 0)) {
    elements.formError.textContent = "Total sales must be a valid amount, or leave it blank.";
    return;
  }
  if (!Number.isFinite(tipOut) || tipOut < 0) {
    elements.formError.textContent = "Tip out must be a valid amount, or leave it blank.";
    return;
  }
  if (tipOut > tips) {
    elements.formError.textContent = "Tip out cannot be more than your total tips.";
    return;
  }
  if (hours !== null && (!Number.isFinite(hours) || hours <= 0 || hours > 24)) {
    elements.formError.textContent = "Hours worked must be between 0.25 and 24, or leave it blank.";
    return;
  }

  const saveButton = elements.shiftForm.querySelector(".save-button");
  saveButton.disabled = true;
  elements.formError.textContent = "";
  const { data, error } = await supabaseClient
    .from("shifts")
    .insert({
      shift_date: elements.shiftDate.value,
      sales: sales === null ? null : Math.round(sales * 100) / 100,
      tips: Math.round(tips * 100) / 100,
      tip_out: tipOut > 0 ? Math.round(tipOut * 100) / 100 : null,
      hours_worked: hours === null ? null : Math.round(hours * 100) / 100,
      notes: notes || null
    })
    .select("id, shift_date, sales, tips, tip_out, hours_worked, notes, created_at")
    .single();
  saveButton.disabled = false;

  if (error) {
    elements.formError.textContent = error.message;
    return;
  }

  entries.push(normalizeEntry(data));
  dataVersion += 1;
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
  dataVersion += 1;
  render();
}

function openGoalDialog() {
  elements.weeklyGoalInput.value = goals.weekly || "";
  elements.monthlyGoalInput.value = goals.monthly || "";
  elements.goalError.textContent = "";
  elements.goalDialog.showModal();
}

async function saveGoals(event) {
  event.preventDefault();
  const weekly = elements.weeklyGoalInput.value === "" ? null : Number(elements.weeklyGoalInput.value);
  const monthly = elements.monthlyGoalInput.value === "" ? null : Number(elements.monthlyGoalInput.value);
  if ([weekly, monthly].some((value) => value !== null && (!Number.isFinite(value) || value <= 0))) {
    elements.goalError.textContent = "Goals must be positive amounts or left blank.";
    return;
  }

  const saveButton = elements.goalForm.querySelector(".save-button");
  saveButton.disabled = true;
  const { error } = await supabaseClient.from("user_goals").upsert({
    user_id: currentUser.id,
    weekly_take_home: weekly,
    monthly_take_home: monthly,
    updated_at: new Date().toISOString()
  });
  saveButton.disabled = false;
  if (error) {
    elements.goalError.textContent = error.message;
    return;
  }

  goals = { weekly, monthly };
  dataVersion += 1;
  render();
  elements.goalDialog.close();
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) {
    if (elements.accountDialog.open) elements.accountError.textContent = error.message;
    else showSyncStatus(`Could not sign out: ${error.message}`);
    return;
  }
  if (elements.accountDialog.open) elements.accountDialog.close();
}

async function deleteAllData() {
  if (!confirm("Delete every shift, note, hour entry, and goal? Your account will remain active.")) return;
  elements.accountError.textContent = "";
  const { error } = await supabaseClient.rpc("delete_my_app_data");
  if (error) {
    elements.accountError.textContent = error.message;
    return;
  }

  entries = [];
  goals = { weekly: null, monthly: null };
  dataVersion += 1;
  localStorage.removeItem(LEGACY_STORAGE_KEY);
  render();
  elements.accountDialog.close();
}

async function deleteAccount() {
  if (prompt("This permanently deletes your account and all data. Type DELETE to continue.") !== "DELETE") return;
  elements.accountError.textContent = "";
  const deleteButton = $("#deleteAccountButton");
  deleteButton.disabled = true;
  const { error } = await supabaseClient.functions.invoke("delete-account");
  deleteButton.disabled = false;
  if (error) {
    elements.accountError.textContent = error.message;
    return;
  }

  localStorage.removeItem(LEGACY_STORAGE_KEY);
  await supabaseClient.auth.signOut({ scope: "local" });
  window.location.reload();
}

function closeOnBackdrop(event) {
  if (event.target === event.currentTarget) event.currentTarget.close();
}

function showPage(page) {
  const isHome = page === "home";
  const showing = isHome ? elements.homePage : elements.earningsPage;
  const wasHidden = showing.hidden;
  elements.homePage.hidden = !isHome;
  elements.earningsPage.hidden = isHome;
  elements.homeTabButton.classList.toggle("active", isHome);
  elements.earningsTabButton.classList.toggle("active", !isHome);
  elements.bottomAction.hidden = !isHome || !currentUser;
  if (!isHome) renderSummary();
  if (wasHidden) {
    showing.classList.remove("page-enter");
    void showing.offsetWidth;
    showing.classList.add("page-enter");
  }
}

elements.homeTabButton.addEventListener("click", () => showPage("home"));
elements.earningsTabButton.addEventListener("click", () => showPage("earnings"));
elements.emailAuthForm.addEventListener("submit", submitAuth);
elements.authModeButton.addEventListener("click", () => setAuthMode(authMode === "login" ? "signup" : "login"));
elements.forgotPasswordButton.addEventListener("click", sendPasswordReset);
elements.resetForm.addEventListener("submit", saveNewPassword);
$("#accountSignOutButton").addEventListener("click", signOut);
$("#accountButton").addEventListener("click", () => {
  elements.accountError.textContent = "";
  elements.accountDialog.showModal();
});
$("#closeAccountButton").addEventListener("click", () => elements.accountDialog.close());
$("#deleteDataButton").addEventListener("click", deleteAllData);
$("#deleteAccountButton").addEventListener("click", deleteAccount);
elements.goalButton.addEventListener("click", openGoalDialog);
$("#closeGoalButton").addEventListener("click", () => elements.goalDialog.close());
elements.goalForm.addEventListener("submit", saveGoals);
elements.monthPeriodButton.addEventListener("click", () => {
  summaryPeriod = "month";
  summaryOffset = 0;
  renderSummary();
});
elements.yearPeriodButton.addEventListener("click", () => {
  summaryPeriod = "year";
  summaryOffset = 0;
  renderSummary();
});
elements.previousSummaryButton.addEventListener("click", () => {
  summaryOffset += 1;
  renderSummary();
});
elements.nextSummaryButton.addEventListener("click", () => {
  summaryOffset = Math.max(0, summaryOffset - 1);
  renderSummary();
});
$("#addButton").addEventListener("click", () => openShiftForm());
elements.reportScanButton.addEventListener("click", openScanner);
elements.reportImageInput.addEventListener("change", selectReportImage);
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
elements.goalDialog.addEventListener("click", closeOnBackdrop);
elements.accountDialog.addEventListener("click", closeOnBackdrop);

async function initialize() {
  const { data: { session }, error: sessionError } = await supabaseClient.auth.getSession();
  if (sessionError) elements.authError.textContent = sessionError.message;
  await applySession(session);

  supabaseClient.auth.onAuthStateChange((event, nextSession) => {
    if (event === "PASSWORD_RECOVERY") {
      setTimeout(() => {
        applySession(nextSession).then(() => {
          elements.resetError.textContent = "";
          elements.resetDialog.showModal();
        });
      }, 0);
      return;
    }
    if (event === "INITIAL_SESSION" || event === "TOKEN_REFRESHED") return;
    setTimeout(() => applySession(nextSession), 0);
  });
}

initialize();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}

document.addEventListener("visibilitychange", () => {
  if (document.visibilityState === "visible") refreshInBackground();
});
