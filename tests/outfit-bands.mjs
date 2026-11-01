import fs from "fs";
import vm from "vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const source = script.replace(/\nload\(\);\nsetInterval\(load,15\*60\*1000\);\s*$/, "\n");
function el() {
  return {
    onclick: null,
    onchange: null,
    onkeydown: null,
    hidden: false,
    value: "22:00",
    textContent: "",
    innerHTML: "",
    classList: { toggle() {}, add() {}, remove() {} },
    dataset: {},
    setAttribute() {},
    replaceChildren() {},
    append() {},
  };
}
const elements = {};
const context = {
  console,
  URLSearchParams,
  document: {
    getElementById(id) {
      return elements[id] || (elements[id] = el());
    },
    querySelectorAll() {
      return [];
    },
  },
  location: { search: "" },
  setInterval() {},
};
vm.createContext(context);
vm.runInContext(source, context);
const { classify, classifySpan, planTrip, placeName, isNight, weatherIcon } = context;

function hr(feels, extra = {}) {
  return {
    feels,
    code: extra.code ?? 3,
    wind: extra.wind ?? 0,
    gust: extra.gust ?? 0,
    pop: extra.pop ?? 0,
    amount: extra.amount ?? 0,
  };
}

const cases = [
  [31, "freezing"],
  [32, "cold"],
  [49, "cold"],
  [50, "cloudy"],
  [59, "cloudy"],
  [60, "mild"],
  [69, "mild"],
  [70, "warm"],
  [84, "warm"],
  [85, "sunny", { code: 0 }],
  [85, "warm", { code: 3 }],
  [59, "cold", { wind: 20 }],
  [85, "warm", { code: 1, gust: 28 }],
  [31, "freezing", { wind: 25 }],
  [59, "rain", { pop: 50 }],
  [76, "rain", { code: 61 }],
  [80, "rain", { amount: 0.2 }],
  [40, "cold", { code: 71 }],
  [31, "freezing", { code: 71 }],
];

let failed = 0;
for (const [feels, want, extra] of cases) {
  const got = classify([hr(feels, extra)]).key;
  const label = `${feels} ${JSON.stringify(extra || {})}`;
  if (got !== want) {
    failed++;
    console.error(`FAIL ${label}: ${got} !== ${want}`);
  } else {
    console.log(`ok ${label} -> ${got}`);
  }
}

const later = classify([hr(59), hr(43), hr(49, { wind: 30, pop: 80, code: 63 })]).key;
if (later !== "cloudy") {
  failed++;
  console.error(`FAIL later hours changed the outfit: ${later}`);
} else {
  console.log("ok later cold/rain/wind stays cloudy");
}

function at(day, hour, feels, extra = {}) {
  return { ...hr(feels, extra), time: `${day}T${String(hour).padStart(2, "0")}:00`, temp: feels };
}
const overnight = [];
for (let h = 22; h <= 23; h++) overnight.push(at("2026-11-01", h, 55));
for (let h = 0; h <= 7; h++) overnight.push(at("2026-11-02", h, h === 4 ? 28 : 46, h === 3 ? { pop: 80, code: 63 } : {}));
const spanKey = classifySpan(overnight).key;
if (spanKey !== "rain") {
  failed++;
  console.error(`FAIL trip window ignored middle rain: ${spanKey}`);
} else console.log("ok trip window sees middle rain");

const coldNight = [at("2026-11-01", 22, 52), at("2026-11-02", 3, 30), at("2026-11-02", 7, 40)];
const coldKey = classifySpan(coldNight).key;
if (coldKey !== "freezing") {
  failed++;
  console.error(`FAIL trip window ignored the coldest hour: ${coldKey}`);
} else console.log("ok trip window uses the coldest hour");

const rows = [];
for (let h = 18; h <= 23; h++) rows.push(at("2026-11-01", h, 50));
for (let h = 0; h <= 12; h++) rows.push(at("2026-11-02", h, h < 6 ? 31 : 48));
const planned = planTrip(rows, "2026-11-01T15:00", "", "22:00", "07:00");
if (!planned || planned.decision.key !== "freezing" || planned.end.time !== "2026-11-02T07:00") {
  failed++;
  console.error("FAIL overnight plan", planned && planned.decision.key, planned && planned.end.time);
} else console.log("ok overnight 10pm to 7am includes the freezing hour");

const same = planTrip(rows, "2026-11-01T15:00", "", "18:00", "21:00");
if (!same || same.endDay !== "2026-11-01" || same.decision.key !== "cloudy") {
  failed++;
  console.error("FAIL same-day trip", same && same.endDay, same && same.decision.key);
} else console.log("ok same-day trip stays on one date");

if (placeName({ name: "Wilmington", admin1: "Delaware", country_code: "US" }) !== "Wilmington, DE") {
  failed++;
  console.error("FAIL Delaware label");
} else console.log("ok Wilmington, DE");
if (placeName({ name: "Wilmington", admin1: "North Carolina", country_code: "US" }) !== "Wilmington, NC") {
  failed++;
  console.error("FAIL NC label");
} else console.log("ok Wilmington, NC");

const nightData = { daily: { time: ["2026-11-01"], sunrise: ["2026-11-01T06:30"], sunset: ["2026-11-01T17:05"] } };
if (!isNight("2026-11-01T22:00", nightData) || isNight("2026-11-01T12:00", nightData)) {
  failed++;
  console.error("FAIL sunrise/sunset night check");
} else console.log("ok night follows sunset");
if (weatherIcon(0, "2026-11-01T22:00", nightData) !== "🌙" || weatherIcon(0, "2026-11-01T12:00", nightData) !== "☀️") {
  failed++;
  console.error("FAIL night icon", weatherIcon(0, "2026-11-01T22:00", nightData), weatherIcon(0, "2026-11-01T12:00", nightData));
} else console.log("ok clear night uses the moon");
if (weatherIcon(2, "2026-11-01T22:00", nightData) !== "☁️") {
  failed++;
  console.error("FAIL partly cloudy night icon");
} else console.log("ok partly cloudy night is not a sun");

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all passed");
