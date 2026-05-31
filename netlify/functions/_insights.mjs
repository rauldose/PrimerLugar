const INSIGHT_KEYS = [
  "views",
  "generates",
  "copies",
  "downloads",
  "shares",
  "phraseSelections",
  "suggestionsSubmitted",
  "approvals",
  "rejections",
  "approvedPhraseDeletes"
];

const INSIGHTS_KEY = "insights";
const MAX_DAILY_BUCKETS = 30;

function emptyCounters() {
  return Object.fromEntries(INSIGHT_KEYS.map((key) => [key, 0]));
}

function normalizeCounters(value) {
  return {
    ...emptyCounters(),
    ...(value && typeof value === "object" ? value : {})
  };
}

function getDayKey(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

function normalizeDailyBuckets(value) {
  if (!value || typeof value !== "object") return {};

  return Object.fromEntries(
    Object.entries(value)
      .filter(([date]) => /^\d{4}-\d{2}-\d{2}$/.test(date))
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, MAX_DAILY_BUCKETS)
      .map(([date, counters]) => [date, normalizeCounters(counters)])
  );
}

export async function readInsights(store) {
  const data = await store.get(INSIGHTS_KEY, { type: "json" });
  return {
    totals: normalizeCounters(data?.totals),
    daily: normalizeDailyBuckets(data?.daily),
    updatedAt: typeof data?.updatedAt === "string" ? data.updatedAt : null
  };
}

export async function incrementInsight(store, eventName, amount = 1) {
  if (!INSIGHT_KEYS.includes(eventName) || !Number.isFinite(amount) || amount <= 0) return null;

  const insights = await readInsights(store);
  const dayKey = getDayKey();
  const dailyCounters = normalizeCounters(insights.daily[dayKey]);

  insights.totals[eventName] += amount;
  dailyCounters[eventName] += amount;
  insights.daily[dayKey] = dailyCounters;
  insights.updatedAt = new Date().toISOString();

  await store.setJSON(INSIGHTS_KEY, {
    totals: insights.totals,
    daily: normalizeDailyBuckets(insights.daily),
    updatedAt: insights.updatedAt
  });

  return insights;
}

export function summarizeInsights(insights, { pendingCount = 0, approvedCount = 0 } = {}) {
  const safeInsights = {
    totals: normalizeCounters(insights?.totals),
    daily: normalizeDailyBuckets(insights?.daily),
    updatedAt: insights?.updatedAt || null
  };

  return {
    totals: {
      ...safeInsights.totals,
      pendingPhrases: pendingCount,
      approvedPhrases: approvedCount
    },
    today: normalizeCounters(safeInsights.daily[getDayKey()]),
    recentDays: Object.entries(safeInsights.daily)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .slice(0, 7)
      .map(([date, counters]) => ({ date, ...normalizeCounters(counters) })),
    lastUpdatedAt: safeInsights.updatedAt
  };
}
