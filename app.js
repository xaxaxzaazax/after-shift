const STORAGE_KEY = "after-shift.entries.v1";

const $ = (selector) => document.querySelector(selector);
const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const wholeMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

const elements = {
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

let entries = loadEntries();
let selectedWeekOffset = 0;

function loadEntries() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    return Array.isArray(saved) ? saved : [];
  } catch {
    return [];
  }
}

function saveEntries() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
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
  elements.weekRange.textContent = `${start.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  elements.weekTakeHome.textContent = money.format(takeHome);
  elements.weekSales.textContent = wholeMoney.format(sales);
  elements.weekTips.textContent = wholeMoney.format(tips);
  elements.weekTipOut.textContent = wholeMoney.format(tipOut);
  elements.weekTipRate.textContent = formatRate(tipRate(tips, sales));
  elements.weekTipOutRate.textContent = formatRate(tipRate(tipOut, sales));
  elements.shiftCount.textContent = `${thisWeek.length} ${thisWeek.length === 1 ? "shift" : "shifts"}`;
  elements.weekProgress.style.width = selectedWeekOffset === 0 ? `${Math.min(100, (now.getDay() || 7) / 7 * 100)}%` : "100%";

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
  range.textContent = `${group.entries.length} ${group.entries.length === 1 ? "shift" : "shifts"} · through ${group.end.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
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
  breakdown.textContent = `${wholeMoney.format(entry.sales)} sales · ${formatRate(tipRate(entry.tips, entry.sales))} tips · ${formatRate(tipRate(entry.tipOut, entry.sales))} tip out`;
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

function submitShift(event) {
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

  entries.push({
    id: crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random()}`,
    date: elements.shiftDate.value,
    sales: Math.round(sales * 100) / 100,
    tips: Math.round(tips * 100) / 100,
    tipOut: Math.round(tipOut * 100) / 100,
    createdAt: Date.now()
  });
  saveEntries();
  render();
  elements.shiftDialog.close();
}

function deleteEntry(id) {
  if (!confirm("Delete this shift?")) return;
  entries = entries.filter((entry) => entry.id !== id);
  saveEntries();
  render();
}

function closeOnBackdrop(event) {
  if (event.target === event.currentTarget) event.currentTarget.close();
}

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
elements.clearButton.addEventListener("click", () => {
  if (!confirm("Delete all of your shift history? This cannot be undone.")) return;
  entries = [];
  saveEntries();
  render();
});

render();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => navigator.serviceWorker.register("./service-worker.js"));
}
