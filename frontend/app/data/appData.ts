export type ItemStatus = "Not Returned" | "Returned";

export type BrowseItem = {
  id: string;
  itemId: string;
  name: string;
  date: string;
  location: string;
  collectFrom: string;
  description: string;
  image: string;
  category: string;
};

export type CategoryStat = {
  name: string;
  icon: string;
  count: number;
};

export type AdminLostItem = {
  id: string;
  name: string;
  dateFound: string;
  location: string;
  status: ItemStatus;
  studentName: string;
  rollNo: string;
  claimedDate: string;
  reporterName: string;
  reporterRoll: string;
  reporterPhone: string;
  reporterEmail: string;
  reportedAt: string;
  lastUpdated: string;
};

export type AdminFoundItem = {
  id: string;
  name: string;
  dateFound: string;
  location: string;
  status: ItemStatus;
  studentName: string;
  rollNo: string;
  returnedDate: string;
  foundAt: string;
  lastUpdated: string;
};

export type ReturnedHistoryRecord = {
  id: string;
  name: string;
  type: "Lost" | "Found";
  reportedDate: string;
  closedDate: string;
  studentName: string;
  rollNo: string;
  location: string;
  reporter: string;
  reporterPhone: string;
  reporterEmail: string;
};

export type DisposedRecord = {
  id: string;
  name: string;
  type: "Lost" | "Found";
  reportedDate: string;
  location: string;
  reporter: string;
  reporterPhone: string;
  reporterEmail: string;
  disposalLocation: string;
  donatedTo: string;
  disposedDate: string;
  notes: string;
};

export type CountdownStatus = "active" | "expiring" | "last10" | "expired";

export type CountdownInfo = {
  daysRemaining: number;
  daysElapsed: number;
  isExpired: boolean;
  countdownStatus: CountdownStatus;
};

export const categories: CategoryStat[] = [
  { name: "Bags & Backpacks", icon: "🎒", count: 0 },
  { name: "Water Bottles", icon: "🍶", count: 0 },
  { name: "Electronics", icon: "💻", count: 0 },
  { name: "Books & Notebooks", icon: "📚", count: 0 },
  { name: "Keys & Keychains", icon: "🔑", count: 0 },
  { name: "Accessories", icon: "⌚", count: 0 },
  { name: "Eyewear", icon: "🕶️", count: 0 },
  { name: "Others", icon: "📦", count: 0 },
];

export const collectFromOptions = ["Admin Reception", "Main Reception", "Humanities Reception"] as const;

export function parseDateForCountdown(dateStr: string): Date {
  const parsed = new Date(dateStr);
  if (!Number.isNaN(parsed.getTime())) {
    parsed.setHours(0, 0, 0, 0);
    return parsed;
  }

  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = dateStr.trim().split(" ");
  const fallback = new Date(Number(parts[2]), months[parts[1]], Number(parts[0]));
  fallback.setHours(0, 0, 0, 0);
  return fallback;
}

export function getDaysInfo(dateStr: string): CountdownInfo {
  const reported = parseDateForCountdown(dateStr);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const daysElapsed = Math.max(0, Math.floor((today.getTime() - reported.getTime()) / 86400000));
  const daysRemaining = Math.max(0, 60 - daysElapsed);
  const isExpired = daysElapsed >= 60;
  const countdownStatus: CountdownStatus = isExpired
    ? "expired"
    : daysRemaining <= 10
    ? "last10"
    : daysRemaining <= 30
    ? "expiring"
    : "active";

  return { daysRemaining, daysElapsed, isExpired, countdownStatus };
}
