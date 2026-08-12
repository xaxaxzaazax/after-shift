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
  heroCaption: $("#heroCaption"),
  weekSales: $("#weekSales"),
  weekTips: $("#weekTips"),
  weekTipOut: $("#weekTipOut"),
  weekTipRate: $("#weekTipRate"),
  weekTipOutRate: $("#weekTipOutRate"),
  weekHours: $("#weekHours"),
  weekBasePay: $("#weekBasePay"),
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
  battlePage: $("#battlePage"),
  homeTabButton: $("#homeTabButton"),
  earningsTabButton: $("#earningsTabButton"),
  battleTabButton: $("#battleTabButton"),
  shiftDialog: $("#shiftDialog"),
  goalDialog: $("#goalDialog"),
  accountDialog: $("#accountDialog"),
  battleDialog: $("#battleDialog"),
  battleList: $("#battleList"),
  battleEmptyState: $("#battleEmptyState"),
  newBattleButton: $("#newBattleButton"),
  emptyStartBattleButton: $("#emptyStartBattleButton"),
  emptyJoinBattleButton: $("#emptyJoinBattleButton"),
  closeBattleButton: $("#closeBattleButton"),
  battleDialogHeading: $("#battleDialogHeading"),
  battleDialogCopy: $("#battleDialogCopy"),
  battleChoiceActions: $("#battleChoiceActions"),
  startBattleChoiceButton: $("#startBattleChoiceButton"),
  joinBattleChoiceButton: $("#joinBattleChoiceButton"),
  startBattleForm: $("#startBattleForm"),
  joinBattleForm: $("#joinBattleForm"),
  battleStartNickname: $("#battleStartNickname"),
  battleEndDate: $("#battleEndDate"),
  startBattleError: $("#startBattleError"),
  battleJoinNickname: $("#battleJoinNickname"),
  battleCodeInput: $("#battleCodeInput"),
  joinBattleError: $("#joinBattleError"),
  battleCodeResult: $("#battleCodeResult"),
  createdBattleCode: $("#createdBattleCode"),
  copyBattleCodeButton: $("#copyBattleCodeButton"),
  reportScanButton: $("#reportScanButton"),
  reportImageInput: $("#reportImageInput"),
  scanLoading: $("#scanLoading"),
  scanLoadingText: $("#scanLoadingText"),
  scanNotice: $("#scanNotice"),
  onboardingDialog: $("#onboardingDialog"),
  onboardingContent: $("#onboardingContent"),
  onboardingBackButton: $("#onboardingBackButton"),
  onboardingSkipButton: $("#onboardingSkipButton"),
  onboardingContinueButton: $("#onboardingContinueButton"),
  onboardingProgress: $("#onboardingProgress"),
  onboardingError: $("#onboardingError"),
  goalForm: $("#goalForm"),
  hourlyPayInput: $("#hourlyPayInput"),
  weeklyGoalInput: $("#weeklyGoalInput"),
  monthlyGoalInput: $("#monthlyGoalInput"),
  goalError: $("#goalError"),
  accountError: $("#accountError"),
  shiftForm: $("#shiftForm"),
  shiftFormEyebrow: $("#shiftFormEyebrow"),
  shiftFormHeading: $("#shiftFormHeading"),
  saveShiftButton: $("#saveShiftButton"),
  shiftDate: $("#shiftDate"),
  salesInput: $("#salesInput"),
  tipsInput: $("#tipsInput"),
  tipOutInput: $("#tipOutInput"),
  hoursInput: $("#hoursInput"),
  shiftHourlyPayInput: $("#shiftHourlyPayInput"),
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
let profile = null;
const legacyMigrationAttemptedFor = new Set();
let authMode = "login";
let selectedReportImage = null;
let scanLoadingTimers = [];
let editingEntryId = null;
let onboardingStep = 0;
let onboardingDraft = { workplace: "", role: null, tipSetup: null, hourlyRate: "", goal: "" };
let battles = [];
let battleChannel = null;
let battleRefreshTimer = null;

const onboardingRoles = [
  { value: "server", label: "Server", description: "Table service and guest sections" },
  { value: "bartender", label: "Bartender", description: "Bar sales, drinks, and bar guests" },
  { value: "host", label: "Host", description: "Seating, reservations, and the front door" },
  { value: "busser", label: "Busser", description: "Table resets and service support" },
  { value: "food_runner", label: "Food runner", description: "Expo and food delivery" },
  { value: "other", label: "Other", description: "Another restaurant role" }
];
const onboardingTipSetups = [
  { value: "individual", label: "I keep my own tips", description: "Individual tips after any tip-out", icon: "ME" },
  { value: "tip_out", label: "I tip out coworkers", description: "I pay support staff from my tips", icon: "OUT" },
  { value: "pool", label: "We share a tip pool", description: "Tips are combined across the team", icon: "POOL" },
  { value: "varies", label: "It varies", description: "The setup changes by shift", icon: "MIX" }
];

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
    : "Create a free account to start tracking your tips, hours, and total earnings.";
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
    hourlyPayRate: row.base_hourly_rate == null ? null : Number(row.base_hourly_rate),
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
    .select("id, shift_date, sales, tips, tip_out, hours_worked, base_hourly_rate, notes, created_at")
    .eq("user_id", currentUser.id)
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

async function fetchProfile() {
  const { data, error } = await supabaseClient
    .from("user_profiles")
    .select("workplace_name, role, tip_setup, hourly_pay_rate, onboarding_completed_at, onboarding_version")
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;
  return {
    workplaceName: data.workplace_name || "",
    role: data.role,
    tipSetup: data.tip_setup,
    hourlyPayRate: data.hourly_pay_rate == null ? null : Number(data.hourly_pay_rate),
    onboardingCompletedAt: data.onboarding_completed_at,
    onboardingVersion: Number(data.onboarding_version || 1)
  };
}

async function fetchBattles() {
  const { data: battleRows, error: battleError } = await supabaseClient
    .from("battles")
    .select("id, code, status, end_date, created_by, created_at, completed_at")
    .order("created_at", { ascending: false });
  if (battleError) throw battleError;
  if (!battleRows.length) return [];

  const battleIds = battleRows.map((battle) => battle.id);
  const { data: memberRows, error: memberError } = await supabaseClient
    .from("battle_members")
    .select("battle_id, user_id, nickname, joined_at")
    .in("battle_id", battleIds);
  if (memberError) throw memberError;

  const { data: shiftRows, error: shiftError } = await supabaseClient.rpc("get_battle_shifts", {
    p_battle_ids: battleIds
  });
  if (shiftError) throw shiftError;

  return battleRows.map((battle) => {
    const members = memberRows.filter((member) => member.battle_id === battle.id);
    return {
      ...battle,
      members,
      shifts: (shiftRows || []).filter((shift) => members.some((member) =>
        member.user_id === shift.user_id
        && new Date(shift.created_at) >= new Date(member.joined_at)
      ))
    };
  });
}

async function refreshBattles() {
  if (!currentUser) return;
  try {
    battles = await fetchBattles();
    if (!elements.battlePage.hidden) renderBattles();
  } catch (error) {
    if (!elements.battlePage.hidden) showSyncStatus(`Could not refresh battles: ${error.message}`);
  }
}

function scheduleBattleRefresh() {
  clearTimeout(battleRefreshTimer);
  battleRefreshTimer = setTimeout(() => refreshBattles(), 180);
}

function subscribeToBattleChanges() {
  if (battleChannel) supabaseClient.removeChannel(battleChannel);
  battleChannel = supabaseClient.channel(`battle-updates-${currentUser.id}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "battles" }, scheduleBattleRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "battle_members" }, scheduleBattleRefresh)
    .on("postgres_changes", { event: "*", schema: "public", table: "shifts" }, scheduleBattleRefresh)
    .subscribe();
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
    resetScanner();
    entries = [];
    goals = { weekly: null, monthly: null };
    profile = null;
    battles = [];
    loadedUserId = null;
    lastLoadedAt = 0;
    if (battleChannel) {
      supabaseClient.removeChannel(battleChannel);
      battleChannel = null;
    }
    if (elements.shiftDialog.open) elements.shiftDialog.close();
    if (elements.goalDialog.open) elements.goalDialog.close();
    if (elements.accountDialog.open) elements.accountDialog.close();
    if (elements.onboardingDialog.open) elements.onboardingDialog.close();
    if (elements.resetDialog.open) elements.resetDialog.close();
    if (elements.battleDialog.open) elements.battleDialog.close();
    render();
    showSyncStatus("");
    return;
  }

  if (sameLoadedUser) return;

  const userId = currentUser.id;
  entries = [];
  goals = { weekly: null, monthly: null };
  profile = null;
  render();
  showSyncStatus("Loading your shifts...");

  try {
    await migrateLegacyEntries();
    const [nextEntries, nextGoals, nextProfile, nextBattles] = await Promise.all([fetchEntries(), fetchGoals(), fetchProfile(), fetchBattles()]);
    if (currentUser?.id !== userId) return;
    entries = nextEntries;
    goals = nextGoals;
    profile = nextProfile;
    battles = nextBattles;
    loadedUserId = userId;
    lastLoadedAt = Date.now();
    render();
    elements.appView.hidden = false;
    showPage("home");
    subscribeToBattleChanges();
    if (version === sessionVersion && elements.syncStatus.textContent === "Loading your shifts...") showSyncStatus("");
    if (!profile?.onboardingCompletedAt || profile.onboardingVersion < 2) openOnboarding();
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
  backgroundRefresh = Promise.all([fetchEntries(), fetchGoals(), fetchProfile()]);
  try {
    const [nextEntries, nextGoals, nextProfile] = await backgroundRefresh;
    if (currentUser?.id !== userId || dataVersion !== version) return;
    entries = nextEntries;
    goals = nextGoals;
    profile = nextProfile;
    lastLoadedAt = Date.now();
    render();
    if ((!profile?.onboardingCompletedAt || profile.onboardingVersion < 2) && !elements.onboardingDialog.open) openOnboarding();
  } catch (error) {
    if (currentUser?.id === userId) showSyncStatus(`Could not refresh your shifts: ${error.message}`);
  } finally {
    backgroundRefresh = null;
  }
}

function onboardingHeading(eyebrow, title, copy) {
  elements.onboardingContent.innerHTML = `<p class="eyebrow">${eyebrow}</p><h1>${title}</h1><p class="onboarding-lead">${copy}</p>`;
}

function onboardingChoiceList(items, selected, onSelect) {
  const list = document.createElement("div");
  list.className = "onboarding-choices";
  items.forEach((item) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `onboarding-choice${item.icon ? "" : " no-icon"}${selected === item.value ? " selected" : ""}`;
    const copy = document.createElement("span");
    const title = document.createElement("strong");
    title.textContent = item.label;
    copy.append(title);
    if (item.description) {
      const description = document.createElement("small");
      description.textContent = item.description;
      copy.append(description);
    }
    const dot = document.createElement("span");
    dot.className = "onboarding-choice-dot";
    if (item.icon) {
      const icon = document.createElement("span");
      icon.className = "onboarding-choice-icon";
      icon.textContent = item.icon;
      button.append(icon);
    }
    button.append(copy, dot);
    button.addEventListener("click", () => onSelect(item.value));
    list.append(button);
  });
  return list;
}

function onboardingLabel(items, value, fallback) {
  return items.find((item) => item.value === value)?.label || fallback;
}

function renderOnboarding() {
  elements.onboardingContent.style.animation = "none";
  void elements.onboardingContent.offsetWidth;
  elements.onboardingContent.style.animation = "";
  elements.onboardingContent.replaceChildren();
  elements.onboardingError.textContent = "";
  elements.onboardingBackButton.disabled = onboardingStep === 0;
  elements.onboardingSkipButton.hidden = onboardingStep === 0 || onboardingStep === 6;
  elements.onboardingProgress.style.width = onboardingStep === 0 ? "0%" : `${Math.min(100, (onboardingStep / 5) * 100)}%`;
  elements.onboardingContinueButton.disabled = false;

  if (onboardingStep === 0) {
    elements.onboardingContent.innerHTML = `<div class="onboarding-mark"><strong>AS</strong><span>$</span></div><p class="eyebrow">WELCOME TO AFTER SHIFT</p><h1>Make it feel like your app.</h1><p class="onboarding-lead">Five quick questions help personalize your earnings. Every question can be skipped.</p>`;
    elements.onboardingContinueButton.textContent = "Set up my account";
    return;
  }

  if (onboardingStep === 1) {
    onboardingHeading("1 OF 5", "What should we call your workplace?", "Use the restaurant name or a private nickname. This can help organize shifts if you work at more than one place.");
    const label = document.createElement("label");
    const caption = document.createElement("span");
    caption.className = "onboarding-field-label";
    caption.textContent = "Workplace name";
    const input = document.createElement("input");
    input.className = "onboarding-text-field";
    input.maxLength = 80;
    input.placeholder = "Downtown location";
    input.value = onboardingDraft.workplace;
    const hint = document.createElement("p");
    hint.className = "onboarding-hint";
    hint.textContent = "Optional. You never need to enter the restaurant's address.";
    input.addEventListener("input", () => { onboardingDraft.workplace = input.value; });
    label.append(caption, input, hint);
    elements.onboardingContent.append(label);
    elements.onboardingContinueButton.textContent = "Continue";
    setTimeout(() => input.focus(), 100);
    return;
  }

  if (onboardingStep === 2) {
    onboardingHeading("2 OF 5", "What do you usually do?", "Your role can help After Shift understand different report layouts and show more relevant insights.");
    elements.onboardingContent.append(onboardingChoiceList(onboardingRoles, onboardingDraft.role, (value) => {
      onboardingDraft.role = value;
      renderOnboarding();
    }));
    elements.onboardingContinueButton.textContent = "Continue";
    elements.onboardingContinueButton.disabled = !onboardingDraft.role;
    return;
  }

  if (onboardingStep === 3) {
    onboardingHeading("3 OF 5", "How are tips handled?", "This helps the report scanner distinguish your tips from the amount you tip out or receive through a pool.");
    elements.onboardingContent.append(onboardingChoiceList(onboardingTipSetups, onboardingDraft.tipSetup, (value) => {
      onboardingDraft.tipSetup = value;
      renderOnboarding();
    }));
    elements.onboardingContinueButton.textContent = "Continue";
    elements.onboardingContinueButton.disabled = !onboardingDraft.tipSetup;
    return;
  }

  if (onboardingStep === 4) {
    onboardingHeading("4 OF 5", "What is your hourly base pay?", "Enter the hourly wage you earn before tips. We will combine it with your net tips when calculating earnings.");
    const card = document.createElement("div");
    card.className = "onboarding-goal-card";
    const caption = document.createElement("span");
    caption.className = "onboarding-field-label";
    caption.textContent = "Hourly base pay";
    const inputWrap = document.createElement("div");
    inputWrap.className = "onboarding-goal-input";
    const currency = document.createElement("b");
    currency.textContent = "$";
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "decimal";
    input.min = "0";
    input.max = "10000";
    input.step = "0.01";
    input.placeholder = "2.13";
    input.value = onboardingDraft.hourlyRate;
    input.addEventListener("input", () => { onboardingDraft.hourlyRate = input.value; });
    inputWrap.append(currency, input);
    const hint = document.createElement("p");
    hint.className = "onboarding-hint";
    hint.textContent = "For example, $2.13 per hour for a tipped server.";
    card.append(caption, inputWrap, hint);
    elements.onboardingContent.append(card);
    elements.onboardingContinueButton.textContent = "Continue";
    return;
  }

  if (onboardingStep === 5) {
    onboardingHeading("5 OF 5", "Want a weekly earnings goal?", "Set a target now or skip it. You can change this any time from the app.");
    const card = document.createElement("div");
    card.className = "onboarding-goal-card";
    const caption = document.createElement("span");
    caption.className = "onboarding-field-label";
    caption.textContent = "Weekly goal";
    const inputWrap = document.createElement("div");
    inputWrap.className = "onboarding-goal-input";
    const currency = document.createElement("b");
    currency.textContent = "$";
    const input = document.createElement("input");
    input.type = "number";
    input.inputMode = "numeric";
    input.min = "1";
    input.step = "25";
    input.placeholder = "750";
    input.value = onboardingDraft.goal;
    input.addEventListener("input", () => { onboardingDraft.goal = input.value; });
    inputWrap.append(currency, input);
    const chips = document.createElement("div");
    chips.className = "onboarding-goal-chips";
    [500, 750, 1000].forEach((amount) => {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = wholeMoney.format(amount);
      button.addEventListener("click", () => {
        onboardingDraft.goal = String(amount);
        input.value = onboardingDraft.goal;
      });
      chips.append(button);
    });
    card.append(caption, inputWrap, chips);
    elements.onboardingContent.append(card);
    elements.onboardingContinueButton.textContent = "Finish setup";
    return;
  }

  onboardingHeading("YOU'RE READY", "Your shifts, your way.", "After Shift will use these details to personalize your account.");
  const summary = document.createElement("div");
  summary.className = "onboarding-summary";
  const rows = [
    ["WORK", "Workplace", onboardingDraft.workplace.trim() || "Not provided"],
    ["ROLE", "Role", onboardingLabel(onboardingRoles, onboardingDraft.role, "Not provided")],
    ["TIPS", "Tip setup", onboardingLabel(onboardingTipSetups, onboardingDraft.tipSetup, "Not provided")],
    ["PAY", "Hourly base pay", onboardingDraft.hourlyRate === "" ? "Not provided" : `${money.format(Number(onboardingDraft.hourlyRate))}/hr`],
    ["GOAL", "Weekly goal", onboardingDraft.goal ? wholeMoney.format(Number(onboardingDraft.goal)) : "No goal yet"]
  ];
  rows.forEach(([iconText, labelText, valueText]) => {
    const row = document.createElement("div");
    row.className = "onboarding-summary-row";
    const icon = document.createElement("span");
    icon.textContent = iconText;
    const copy = document.createElement("div");
    const label = document.createElement("small");
    label.textContent = labelText;
    const value = document.createElement("strong");
    value.textContent = valueText;
    copy.append(label, value);
    row.append(icon, copy);
    summary.append(row);
  });
  elements.onboardingContent.append(summary);
  elements.onboardingContinueButton.textContent = "Open After Shift";
}

function openOnboarding() {
  onboardingStep = 0;
  onboardingDraft = {
    workplace: profile?.workplaceName || "",
    role: profile?.role || null,
    tipSetup: profile?.tipSetup || null,
    hourlyRate: profile?.hourlyPayRate == null ? "" : String(profile.hourlyPayRate),
    goal: goals.weekly == null ? "" : String(goals.weekly)
  };
  renderOnboarding();
  if (!elements.onboardingDialog.open) elements.onboardingDialog.showModal();
}

function skipOnboardingStep() {
  if (onboardingStep === 1) onboardingDraft.workplace = "";
  if (onboardingStep === 2) onboardingDraft.role = null;
  if (onboardingStep === 3) onboardingDraft.tipSetup = null;
  if (onboardingStep === 4) onboardingDraft.hourlyRate = profile?.hourlyPayRate == null ? "" : String(profile.hourlyPayRate);
  if (onboardingStep === 5) onboardingDraft.goal = goals.weekly == null ? "" : String(goals.weekly);
  onboardingStep = Math.min(6, onboardingStep + 1);
  renderOnboarding();
}

async function saveOnboarding() {
  const workplace = onboardingDraft.workplace.trim();
  const weekly = onboardingDraft.goal === "" ? null : Number(onboardingDraft.goal);
  const hourlyRate = onboardingDraft.hourlyRate === "" ? null : Number(onboardingDraft.hourlyRate);
  if (workplace.length > 80) {
    elements.onboardingError.textContent = "Keep the workplace name under 80 characters.";
    return;
  }
  if (weekly !== null && (!Number.isFinite(weekly) || weekly <= 0 || weekly > 9999999999.99)) {
    elements.onboardingError.textContent = "Enter a valid weekly goal or leave it blank.";
    return;
  }
  if (hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 10000)) {
    elements.onboardingError.textContent = "Enter a valid hourly pay rate or leave it blank.";
    return;
  }

  elements.onboardingContinueButton.disabled = true;
  elements.onboardingContinueButton.textContent = "Saving...";
  elements.onboardingError.textContent = "";

  const roundedWeekly = weekly === null ? null : Math.round(weekly * 100) / 100;
  const { error: goalError } = await supabaseClient.from("user_goals").upsert({
    user_id: currentUser.id,
    weekly_take_home: roundedWeekly,
    monthly_take_home: goals.monthly,
    updated_at: new Date().toISOString()
  });
  if (goalError) {
    elements.onboardingError.textContent = goalError.message;
    elements.onboardingContinueButton.disabled = false;
    elements.onboardingContinueButton.textContent = "Open After Shift";
    return;
  }

  const completedAt = new Date().toISOString();
  const roundedHourlyRate = hourlyRate === null ? null : Math.round(hourlyRate * 100) / 100;
  if (roundedHourlyRate !== null) {
    const { error: backfillError } = await supabaseClient
      .from("shifts")
      .update({ base_hourly_rate: roundedHourlyRate })
      .is("base_hourly_rate", null);
    if (backfillError) {
      elements.onboardingError.textContent = backfillError.message;
      elements.onboardingContinueButton.disabled = false;
      elements.onboardingContinueButton.textContent = "Open After Shift";
      return;
    }
  }

  const { error: profileError } = await supabaseClient.from("user_profiles").upsert({
    user_id: currentUser.id,
    workplace_name: workplace || null,
    role: onboardingDraft.role,
    tip_setup: onboardingDraft.tipSetup,
    hourly_pay_rate: roundedHourlyRate,
    onboarding_completed_at: completedAt,
    onboarding_version: 2,
    updated_at: completedAt
  });
  if (profileError) {
    elements.onboardingError.textContent = profileError.message;
    elements.onboardingContinueButton.disabled = false;
    elements.onboardingContinueButton.textContent = "Open After Shift";
    return;
  }

  goals.weekly = roundedWeekly;
  if (roundedHourlyRate !== null) {
    entries.forEach((entry) => {
      if (entry.hourlyPayRate === null) entry.hourlyPayRate = roundedHourlyRate;
    });
  }
  profile = {
    workplaceName: workplace,
    role: onboardingDraft.role,
    tipSetup: onboardingDraft.tipSetup,
    hourlyPayRate: roundedHourlyRate,
    onboardingCompletedAt: completedAt,
    onboardingVersion: 2
  };
  dataVersion += 1;
  render();
  elements.onboardingDialog.close();
}

async function advanceOnboarding() {
  if (onboardingStep === 4 && onboardingDraft.hourlyRate !== "") {
    const hourlyRate = Number(onboardingDraft.hourlyRate);
    if (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 10000) {
      elements.onboardingError.textContent = "Enter a valid hourly pay rate or leave it blank.";
      return;
    }
  }
  if (onboardingStep === 5 && onboardingDraft.goal !== "") {
    const weekly = Number(onboardingDraft.goal);
    if (!Number.isFinite(weekly) || weekly <= 0 || weekly > 9999999999.99) {
      elements.onboardingError.textContent = "Enter a valid weekly goal or leave it blank.";
      return;
    }
  }
  if (onboardingStep < 6) {
    onboardingStep += 1;
    renderOnboarding();
    return;
  }
  await saveOnboarding();
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

function basePay(entry) {
  return (entry.hours || 0) * (entry.hourlyPayRate || 0);
}

function entryEarnings(entry) {
  return entry.tips - entry.tipOut + basePay(entry);
}

function totalEarnings(list) {
  return list.reduce((total, entry) => total + entryEarnings(entry), 0);
}

function totalHours(list) {
  return list.reduce((total, entry) => total + (entry.hours || 0), 0);
}

function totalBasePay(list) {
  return list.reduce((total, entry) => total + basePay(entry), 0);
}

function hourlyEarnings(list) {
  const timedEntries = list.filter((entry) => entry.hours > 0);
  const hours = totalHours(timedEntries);
  return hours > 0 ? totalEarnings(timedEntries) / hours : 0;
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
      return { label: start.toLocaleDateString("en-US", { month: "short" }), value: totalEarnings(entriesBetween(start, end)) };
    });
  }

  const monthBounds = getMonthBounds(date);
  const buckets = [];
  let cursor = new Date(monthBounds.start);
  while (cursor <= monthBounds.end) {
    const week = getWeekBounds(cursor);
    const start = new Date(Math.max(week.start.getTime(), monthBounds.start.getTime()));
    const end = new Date(Math.min(week.end.getTime(), monthBounds.end.getTime()));
    buckets.push({ label: `${start.getDate()}-${end.getDate()}`, value: totalEarnings(entriesBetween(start, end)) });
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
  const earnings = totalEarnings(list);
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
  const earnings = totalEarnings(thisWeek);
  const hours = totalHours(thisWeek);

  elements.todayLabel.textContent = now.toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" }).toUpperCase();
  elements.weekHeading.textContent = selectedWeekOffset === 0 ? "This week" : selectedWeekOffset === 1 ? "Last week" : `${selectedWeekOffset} weeks ago`;
  elements.nextWeekButton.disabled = selectedWeekOffset === 0;
  elements.weekRange.textContent = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  elements.heroCaption.textContent = profile?.workplaceName ? `estimated earnings at ${profile.workplaceName}` : "estimated earnings";
  elements.weekTakeHome.textContent = money.format(earnings);
  elements.weekSales.textContent = withSales.length ? wholeMoney.format(sales) : "—";
  elements.weekTips.textContent = wholeMoney.format(tips);
  elements.weekTipOut.textContent = tipOut > 0 ? wholeMoney.format(tipOut) : "—";
  elements.weekTipRate.textContent = withSales.length ? formatRate(tipRate(salesTips, sales)) : "—";
  elements.weekTipOutRate.textContent = withSales.length ? formatRate(tipRate(salesTipOut, sales)) : "—";
  elements.weekHours.textContent = hours > 0 ? `${hours.toFixed(hours % 1 ? 1 : 0)} hrs` : "—";
  elements.weekBasePay.textContent = totalBasePay(thisWeek) > 0 ? money.format(totalBasePay(thisWeek)) : "—";
  elements.weekHourly.textContent = hourlyEarnings(thisWeek) > 0 ? money.format(hourlyEarnings(thisWeek)) : "—";
  elements.shiftCount.textContent = `${thisWeek.length} ${thisWeek.length === 1 ? "shift" : "shifts"}`;
  const weeklyProgress = goals.weekly ? Math.min(100, (earnings / goals.weekly) * 100) : (selectedWeekOffset === 0 ? Math.min(100, ((now.getDay() || 7) / 7) * 100) : 100);
  elements.weekProgress.style.width = `${weeklyProgress}%`;
  elements.goalButton.textContent = goals.weekly ? `${Math.round(weeklyProgress)}% of ${wholeMoney.format(goals.weekly)} goal` : "Pay & goals";

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
  const weekTitle = isCurrentWeek ? "This week" : `Week of ${group.start.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  title.textContent = profile?.workplaceName ? `${weekTitle} at ${profile.workplaceName}` : weekTitle;
  const range = document.createElement("p");
  range.textContent = `${group.entries.length} ${group.entries.length === 1 ? "shift" : "shifts"} - through ${group.end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  label.append(title, range);

  const total = document.createElement("div");
  total.className = "week-group-total";
  const caption = document.createElement("span");
  caption.textContent = "EST. EARNINGS";
  const amount = document.createElement("strong");
  amount.textContent = money.format(totalEarnings(group.entries));
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
  const stats = document.createElement("div");
  stats.className = "shift-stats";
  const parts = [];
  if (entry.sales != null) {
    parts.push(`${wholeMoney.format(entry.sales)} sales`);
    parts.push(`${formatRate(tipRate(entry.tips, entry.sales))} tips`);
    if (entry.tipOut > 0) parts.push(`${formatRate(tipRate(entry.tipOut, entry.sales))} tip out`);
  } else {
    parts.push(`${money.format(entry.tips)} tips`);
    if (entry.tipOut > 0) parts.push(`${money.format(entry.tipOut)} tip out`);
  }
  parts.forEach((part) => {
    const stat = document.createElement("span");
    stat.textContent = part;
    stats.append(stat);
  });
  details.append(title, stats);
  if (entry.notes) {
    const note = document.createElement("p");
    note.className = "shift-note";
    note.textContent = entry.notes;
    details.append(note);
  }

  const result = document.createElement("div");
  result.className = "shift-result";
  const resultLabel = document.createElement("span");
  resultLabel.className = "shift-result-label";
  resultLabel.textContent = "earned";
  const amount = document.createElement("strong");
  amount.textContent = money.format(entryEarnings(entry));
  const actions = document.createElement("div");
  actions.className = "shift-actions";
  const edit = document.createElement("button");
  edit.className = "edit-button";
  edit.type = "button";
  edit.textContent = "Edit";
  edit.setAttribute("aria-label", `Edit ${title.textContent} shift`);
  edit.addEventListener("click", () => openShiftForm(null, entry));
  const remove = document.createElement("button");
  remove.className = "delete-button";
  remove.type = "button";
  remove.textContent = "Delete";
  remove.setAttribute("aria-label", `Delete ${title.textContent} shift`);
  remove.addEventListener("click", () => deleteEntry(entry.id));
  actions.append(edit, remove);
  result.append(resultLabel, amount, actions);

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
  const hours = Number(elements.hoursInput.value) || 0;
  const hourlyRate = Number(elements.shiftHourlyPayInput.value) || 0;
  elements.takeHomePreview.textContent = money.format(tips - tipOut + (hours * hourlyRate));
}

function openShiftForm(scannedFields = null, entry = null) {
  editingEntryId = entry?.id || null;
  elements.shiftForm.reset();
  elements.shiftDate.value = localDateString();
  elements.shiftHourlyPayInput.value = profile?.hourlyPayRate ?? "";
  elements.shiftFormEyebrow.textContent = entry ? "EDIT SHIFT" : "SHIFT DETAILS";
  elements.shiftFormHeading.textContent = entry ? "Update your shift" : "How did tonight go?";
  elements.saveShiftButton.textContent = entry ? "Save changes" : "Save shift";
  elements.formError.textContent = "";
  elements.scanNotice.hidden = true;
  elements.scanNotice.textContent = "";

  if (entry) {
    elements.shiftDate.value = entry.date;
    elements.salesInput.value = entry.sales ?? "";
    elements.tipsInput.value = entry.tips;
    elements.tipOutInput.value = entry.tipOut || "";
    elements.hoursInput.value = entry.hours ?? "";
    elements.shiftHourlyPayInput.value = entry.hourlyPayRate ?? "";
    elements.notesInput.value = entry.notes;
  } else if (scannedFields) {
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
  setTimeout(() => (scannedFields || entry ? elements.shiftDate : elements.tipsInput).focus(), 150);
}

function resetScanner() {
  selectedReportImage = null;
  elements.reportImageInput.value = "";
  elements.reportScanButton.disabled = false;
  hideScanLoading();
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

function hideScanLoading() {
  scanLoadingTimers.forEach(clearTimeout);
  scanLoadingTimers = [];
  elements.scanLoading.hidden = true;
}

function showScanLoading(message) {
  hideScanLoading();
  elements.scanLoadingText.textContent = message;
  elements.scanLoading.hidden = false;
}

function startScanLoadingStages() {
  showScanLoading("Finding the report date...");
  scanLoadingTimers = [
    setTimeout(() => { elements.scanLoadingText.textContent = "Reading sales, tips, and tip-out..."; }, 1400),
    setTimeout(() => { elements.scanLoadingText.textContent = "Checking the totals..."; }, 3200)
  ];
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

  showSyncStatus("");
  showScanLoading("Preparing your photo...");
  try {
    selectedReportImage = await resizeReportImage(file);
  } catch {
    hideScanLoading();
    showSyncStatus("This photo could not be opened. Try taking another picture.");
    return;
  }

  await scanSelectedReport();
}

async function scanSelectedReport() {
  if (!selectedReportImage) return;
  elements.reportScanButton.disabled = true;
  startScanLoadingStages();

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
    hideScanLoading();
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
    hideScanLoading();
    showSyncStatus(message);
    return;
  }

  const fields = data.fields;
  hideScanLoading();
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
  const hourlyPayRate = elements.shiftHourlyPayInput.value.trim() === "" ? null : Number(elements.shiftHourlyPayInput.value);
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
  if (hourlyPayRate !== null && (!Number.isFinite(hourlyPayRate) || hourlyPayRate < 0 || hourlyPayRate > 10000)) {
    elements.formError.textContent = "Hourly base pay must be between $0 and $10,000, or leave it blank.";
    return;
  }

  const saveButton = elements.saveShiftButton;
  saveButton.disabled = true;
  elements.formError.textContent = "";
  const values = {
    shift_date: elements.shiftDate.value,
    sales: sales === null ? null : Math.round(sales * 100) / 100,
    tips: Math.round(tips * 100) / 100,
    tip_out: tipOut > 0 ? Math.round(tipOut * 100) / 100 : null,
    hours_worked: hours === null ? null : Math.round(hours * 100) / 100,
    base_hourly_rate: hourlyPayRate === null ? null : Math.round(hourlyPayRate * 100) / 100,
    notes: notes || null
  };
  const mutation = editingEntryId
    ? supabaseClient.from("shifts").update(values).eq("id", editingEntryId)
    : supabaseClient.from("shifts").insert(values);
  const { data, error } = await mutation
    .select("id, shift_date, sales, tips, tip_out, hours_worked, base_hourly_rate, notes, created_at")
    .single();
  saveButton.disabled = false;

  if (error) {
    elements.formError.textContent = error.message;
    return;
  }

  const savedEntry = normalizeEntry(data);
  if (editingEntryId) {
    entries = entries.map((entry) => entry.id === editingEntryId ? savedEntry : entry);
  } else {
    entries.push(savedEntry);
  }
  editingEntryId = null;
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
  elements.hourlyPayInput.value = profile?.hourlyPayRate ?? "";
  elements.weeklyGoalInput.value = goals.weekly || "";
  elements.monthlyGoalInput.value = goals.monthly || "";
  elements.goalError.textContent = "";
  elements.goalDialog.showModal();
}

async function saveGoals(event) {
  event.preventDefault();
  const hourlyRate = elements.hourlyPayInput.value === "" ? null : Number(elements.hourlyPayInput.value);
  const weekly = elements.weeklyGoalInput.value === "" ? null : Number(elements.weeklyGoalInput.value);
  const monthly = elements.monthlyGoalInput.value === "" ? null : Number(elements.monthlyGoalInput.value);
  if ([weekly, monthly].some((value) => value !== null && (!Number.isFinite(value) || value <= 0))) {
    elements.goalError.textContent = "Goals must be positive amounts or left blank.";
    return;
  }
  if (hourlyRate !== null && (!Number.isFinite(hourlyRate) || hourlyRate < 0 || hourlyRate > 10000)) {
    elements.goalError.textContent = "Hourly pay must be between $0 and $10,000, or left blank.";
    return;
  }

  const saveButton = elements.goalForm.querySelector(".save-button");
  saveButton.disabled = true;
  const updatedAt = new Date().toISOString();
  const roundedHourlyRate = hourlyRate === null ? null : Math.round(hourlyRate * 100) / 100;
  const shouldBackfillRate = profile.hourlyPayRate == null && roundedHourlyRate !== null;
  const backfillRequest = shouldBackfillRate
    ? supabaseClient.from("shifts").update({ base_hourly_rate: roundedHourlyRate }).is("base_hourly_rate", null)
    : Promise.resolve({ error: null });
  const [{ error }, { error: profileError }, { error: backfillError }] = await Promise.all([
    supabaseClient.from("user_goals").upsert({
      user_id: currentUser.id,
      weekly_take_home: weekly,
      monthly_take_home: monthly,
      updated_at: updatedAt
    }),
    supabaseClient.from("user_profiles").update({
      hourly_pay_rate: roundedHourlyRate,
      updated_at: updatedAt
    }).eq("user_id", currentUser.id),
    backfillRequest
  ]);
  saveButton.disabled = false;
  if (error || profileError || backfillError) {
    elements.goalError.textContent = error?.message || profileError?.message || backfillError.message;
    return;
  }

  goals = { weekly, monthly };
  if (shouldBackfillRate) {
    entries.forEach((entry) => {
      if (entry.hourlyPayRate === null) entry.hourlyPayRate = roundedHourlyRate;
    });
  }
  profile.hourlyPayRate = roundedHourlyRate;
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

function openBattleDialog() {
  elements.battleDialogHeading.textContent = "Start or join a battle";
  elements.battleDialogCopy.textContent = "Choose a workplace and nickname before you begin.";
  elements.battleChoiceActions.hidden = false;
  elements.startBattleForm.hidden = true;
  elements.joinBattleForm.hidden = true;
  elements.battleCodeResult.hidden = true;
  elements.startBattleError.textContent = "";
  elements.joinBattleError.textContent = "";
  elements.battleDialog.showModal();
}

function showStartBattleForm() {
  elements.battleDialogHeading.textContent = "Start a battle";
  elements.battleDialogCopy.textContent = "You'll get a code to share with one opponent.";
  elements.battleChoiceActions.hidden = true;
  elements.startBattleForm.hidden = false;
  elements.joinBattleForm.hidden = true;
  elements.battleCodeResult.hidden = true;
  elements.startBattleError.textContent = "";
  const today = localDateString();
  elements.battleEndDate.min = today;
  setTimeout(() => elements.battleStartNickname.focus(), 100);
}

function showJoinBattleForm() {
  elements.battleDialogHeading.textContent = "Join a battle";
  elements.battleDialogCopy.textContent = "Enter the six-digit code from your coworker.";
  elements.battleChoiceActions.hidden = true;
  elements.startBattleForm.hidden = true;
  elements.joinBattleForm.hidden = false;
  elements.battleCodeResult.hidden = true;
  elements.joinBattleError.textContent = "";
  setTimeout(() => elements.battleJoinNickname.focus(), 100);
}

async function submitStartBattle(event) {
  event.preventDefault();
  const nickname = elements.battleStartNickname.value.trim();
  const endDate = elements.battleEndDate.value || null;
  if (!nickname || nickname.length > 30) {
    elements.startBattleError.textContent = "Nickname must be 1 to 30 characters.";
    return;
  }
  const saveButton = elements.startBattleForm.querySelector(".save-button");
  saveButton.disabled = true;
  elements.startBattleError.textContent = "";
  const { data, error } = await supabaseClient.rpc("start_battle", {
    p_nickname: nickname,
    p_end_date: endDate
  });
  saveButton.disabled = false;
  if (error) {
    elements.startBattleError.textContent = error.message;
    return;
  }
  elements.startBattleForm.reset();
  elements.createdBattleCode.textContent = data[0].battle_code;
  elements.battleDialogHeading.textContent = "Battle created";
  elements.battleDialogCopy.textContent = "Share this code with your opponent.";
  elements.battleChoiceActions.hidden = true;
  elements.startBattleForm.hidden = true;
  elements.battleCodeResult.hidden = false;
  await refreshBattles();
}

async function submitJoinBattle(event) {
  event.preventDefault();
  const nickname = elements.battleJoinNickname.value.trim();
  const code = elements.battleCodeInput.value.trim();
  if (!nickname || nickname.length > 30) {
    elements.joinBattleError.textContent = "Nickname must be 1 to 30 characters.";
    return;
  }
  if (!/^\d{6}$/.test(code)) {
    elements.joinBattleError.textContent = "Enter a six-digit battle code.";
    return;
  }
  const saveButton = elements.joinBattleForm.querySelector(".save-button");
  saveButton.disabled = true;
  elements.joinBattleError.textContent = "";
  const { error } = await supabaseClient.rpc("join_battle", {
    p_code: code,
    p_nickname: nickname
  });
  saveButton.disabled = false;
  if (error) {
    elements.joinBattleError.textContent = error.message;
    return;
  }
  elements.joinBattleForm.reset();
  elements.battleDialog.close();
  await refreshBattles();
  showPage("battle");
}

function copyBattleCode() {
  const code = elements.createdBattleCode.textContent;
  navigator.clipboard.writeText(code).then(() => {
    elements.copyBattleCodeButton.textContent = "Copied!";
    setTimeout(() => { elements.copyBattleCodeButton.textContent = "Copy code"; }, 2000);
  });
}

async function completeBattle(battleId) {
  if (!confirm("End this battle now? Neither player will be able to add more shifts.")) return;
  const { error } = await supabaseClient.rpc("complete_battle", { p_battle_id: battleId });
  if (error) {
    showSyncStatus(`Could not end battle: ${error.message}`);
    return;
  }
  await refreshBattles();
}

async function deleteBattle(battleId) {
  if (!confirm("Delete this battle permanently? This cannot be undone.")) return;
  const { error } = await supabaseClient.rpc("delete_battle", { p_battle_id: battleId });
  if (error) {
    showSyncStatus(`Could not delete battle: ${error.message}`);
    return;
  }
  await refreshBattles();
}

async function leaveBattle(battleId) {
  if (!confirm("Leave this battle? Your shifts will no longer be counted.")) return;
  const { error } = await supabaseClient.rpc("leave_battle", { p_battle_id: battleId });
  if (error) {
    showSyncStatus(`Could not leave battle: ${error.message}`);
    return;
  }
  await refreshBattles();
}

function renderBattles() {
  elements.battleEmptyState.hidden = battles.length > 0;
  elements.battleList.replaceChildren(...battles.map(createBattleCard));
}

function createBattleCard(battle) {
  const card = document.createElement("article");
  card.className = "battle-card";
  const ownMember = battle.members.find((m) => m.user_id === currentUser.id);
  const opponentMember = battle.members.find((m) => m.user_id !== currentUser.id);
  const isCreator = battle.created_by === currentUser.id;
  const isWaiting = battle.status === "waiting";
  const isActive = battle.status === "active";
  const isCompleted = battle.status === "completed";

  const header = document.createElement("div");
  header.className = "battle-card-header";
  const title = document.createElement("strong");
  title.textContent = !opponentMember ? "Waiting for opponent" : `${ownMember.nickname} vs ${opponentMember.nickname}`;
  const status = document.createElement("span");
  status.className = `battle-status battle-status-${battle.status}`;
  status.textContent = isWaiting ? "Waiting" : (isCompleted ? "Completed" : "Active");
  header.append(title, status);

  const dates = document.createElement("p");
  dates.className = "battle-dates";
  const startDate = new Date(battle.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric" });
  dates.textContent = battle.end_date
    ? `${startDate} - ${new Date(battle.end_date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    : `Started ${startDate} • No end date`;

  card.append(header, dates);

  if (isWaiting) {
    const code = document.createElement("p");
    code.className = "battle-code-display";
    code.innerHTML = `Code: <strong>${battle.code}</strong>`;
    card.append(code);
    
    // Add delete/leave button for waiting battles
    const actions = document.createElement("div");
    actions.className = "battle-actions";
    if (isCreator) {
      const deleteButton = document.createElement("button");
      deleteButton.className = "secondary-button";
      deleteButton.textContent = "Delete battle";
      deleteButton.addEventListener("click", () => deleteBattle(battle.id));
      actions.append(deleteButton);
    } else {
      const leaveButton = document.createElement("button");
      leaveButton.className = "secondary-button";
      leaveButton.textContent = "Leave battle";
      leaveButton.addEventListener("click", () => leaveBattle(battle.id));
      actions.append(leaveButton);
    }
    card.append(actions);
  }

  if (isActive || isCompleted) {
    if (!opponentMember) {
      const message = document.createElement("p");
      message.className = "battle-empty-state";
      message.textContent = "Opponent left the battle";
      card.append(message);
    } else {
      const ownShifts = battle.shifts.filter((s) => s.user_id === currentUser.id);
      const opponentShifts = battle.shifts.filter((s) => s.user_id === opponentMember.user_id);
      const ownTips = ownShifts.reduce((sum, s) => sum + Number(s.tips || 0), 0);
      const ownTipOut = ownShifts.reduce((sum, s) => sum + Number(s.tip_out || 0), 0);
      const ownNetTips = ownTips - ownTipOut;
      const opponentTips = opponentShifts.reduce((sum, s) => sum + Number(s.tips || 0), 0);
      const opponentTipOut = opponentShifts.reduce((sum, s) => sum + Number(s.tip_out || 0), 0);
      const opponentNetTips = opponentTips - opponentTipOut;
      const combined = ownNetTips + opponentNetTips;

    const tugOfWar = document.createElement("div");
    tugOfWar.className = "battle-tug-of-war";
    const leftBar = document.createElement("span");
    leftBar.className = "battle-tug-bar battle-tug-left";
    const rightBar = document.createElement("span");
    rightBar.className = "battle-tug-bar battle-tug-right";
    if (combined > 0) {
      leftBar.style.width = `${(ownNetTips / combined) * 100}%`;
      rightBar.style.width = `${(opponentNetTips / combined) * 100}%`;
    } else {
      leftBar.style.width = "50%";
      rightBar.style.width = "50%";
    }
    tugOfWar.append(leftBar, rightBar);

    const stats = document.createElement("div");
    stats.className = "battle-stats";
    const ownStat = document.createElement("div");
    ownStat.className = "battle-player-stat";
    ownStat.innerHTML = `<span>${ownMember.nickname}</span><strong>${money.format(ownNetTips)}</strong>`;
    const combinedStat = document.createElement("div");
    combinedStat.className = "battle-combined-stat";
    combinedStat.innerHTML = `<small>Combined</small><strong>${money.format(combined)}</strong>`;
    const opponentStat = document.createElement("div");
    opponentStat.className = "battle-player-stat";
    opponentStat.innerHTML = `<span>${opponentMember.nickname}</span><strong>${money.format(opponentNetTips)}</strong>`;
    stats.append(ownStat, combinedStat, opponentStat);

    const result = document.createElement("p");
    result.className = "battle-result";
    if (ownNetTips > opponentNetTips) {
      result.innerHTML = `<strong>${ownMember.nickname} is winning</strong> by ${money.format(ownNetTips - opponentNetTips)} in net tips`;
    } else if (opponentNetTips > ownNetTips) {
      result.innerHTML = `<strong>${opponentMember.nickname} is winning</strong> by ${money.format(opponentNetTips - ownNetTips)} in net tips`;
    } else {
      result.innerHTML = `<strong>Tied</strong> at ${money.format(ownNetTips)} in net tips`;
    }

      card.append(tugOfWar, stats, result);

      if (isActive) {
        const actions = document.createElement("div");
        actions.className = "battle-actions";
        if (isCreator) {
          const endButton = document.createElement("button");
          endButton.className = "secondary-button";
          endButton.textContent = "End battle";
          endButton.addEventListener("click", () => completeBattle(battle.id));
          actions.append(endButton);
        }
        const leaveButton = document.createElement("button");
        leaveButton.className = "secondary-button";
        leaveButton.textContent = "Leave battle";
        leaveButton.addEventListener("click", () => leaveBattle(battle.id));
        actions.append(leaveButton);
        card.append(actions);
      }
      
      if (isCompleted && isCreator) {
        const actions = document.createElement("div");
        actions.className = "battle-actions";
        const deleteButton = document.createElement("button");
        deleteButton.className = "secondary-button";
        deleteButton.textContent = "Delete battle";
        deleteButton.addEventListener("click", () => deleteBattle(battle.id));
        actions.append(deleteButton);
        card.append(actions);
      }
    }
  }

  return card;
}

function closeOnBackdrop(event) {
  if (event.target === event.currentTarget) event.currentTarget.close();
}

function showPage(page) {
  const isHome = page === "home";
  const isEarnings = page === "earnings";
  const isBattle = page === "battle";
  const showing = isHome ? elements.homePage : (isEarnings ? elements.earningsPage : elements.battlePage);
  const wasHidden = showing.hidden;
  elements.homePage.hidden = !isHome;
  elements.earningsPage.hidden = !isEarnings;
  elements.battlePage.hidden = !isBattle;
  elements.homeTabButton.classList.toggle("active", isHome);
  elements.earningsTabButton.classList.toggle("active", isEarnings);
  elements.battleTabButton.classList.toggle("active", isBattle);
  elements.bottomAction.hidden = !isHome || !currentUser;
  if (isEarnings) renderSummary();
  if (isBattle) renderBattles();
  if (wasHidden) {
    showing.classList.remove("page-enter");
    void showing.offsetWidth;
    showing.classList.add("page-enter");
  }
}

elements.homeTabButton.addEventListener("click", () => showPage("home"));
elements.earningsTabButton.addEventListener("click", () => showPage("earnings"));
elements.battleTabButton.addEventListener("click", () => showPage("battle"));
elements.newBattleButton.addEventListener("click", openBattleDialog);
elements.emptyStartBattleButton.addEventListener("click", openBattleDialog);
elements.emptyJoinBattleButton.addEventListener("click", () => {
  openBattleDialog();
  showJoinBattleForm();
});
elements.closeBattleButton.addEventListener("click", () => elements.battleDialog.close());
elements.startBattleChoiceButton.addEventListener("click", showStartBattleForm);
elements.joinBattleChoiceButton.addEventListener("click", showJoinBattleForm);
elements.startBattleForm.addEventListener("submit", submitStartBattle);
elements.joinBattleForm.addEventListener("submit", submitJoinBattle);
elements.copyBattleCodeButton.addEventListener("click", copyBattleCode);
elements.battleDialog.addEventListener("click", closeOnBackdrop);
elements.onboardingBackButton.addEventListener("click", () => {
  onboardingStep = Math.max(0, onboardingStep - 1);
  renderOnboarding();
});
elements.onboardingSkipButton.addEventListener("click", skipOnboardingStep);
elements.onboardingContinueButton.addEventListener("click", advanceOnboarding);
elements.onboardingDialog.addEventListener("cancel", (event) => event.preventDefault());
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
$("#paySettingsButton").addEventListener("click", () => {
  elements.accountDialog.close();
  openGoalDialog();
});
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
elements.hoursInput.addEventListener("input", updatePreview);
elements.shiftHourlyPayInput.addEventListener("input", updatePreview);
elements.shiftDialog.addEventListener("close", () => { editingEntryId = null; });
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
