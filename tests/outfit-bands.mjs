import fs from "fs";
import vm from "vm";

const html = fs.readFileSync(new URL("../index.html", import.meta.url), "utf8");
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
const source = script.split('$("go")')[0];
const context = {
  console,
  URLSearchParams,
  document: { getElementById() { return null; } },
  location: { search: "" },
};
vm.createContext(context);
vm.runInContext(source, context);
const { classify } = context;

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

if (failed) {
  console.error(`${failed} failed`);
  process.exit(1);
}
console.log("all passed");
