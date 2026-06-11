import type {
  AdminFoundItem,
  AdminLostItem,
  BrowseItem,
  DisposedRecord,
  ReturnedHistoryRecord,
} from "./data/appData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "https://campus-lost-found-ghvc.onrender.com";

if (API_BASE_URL.includes("localhost") || API_BASE_URL.includes("127.0.0.1")) {
  throw new Error("Vercel execution hardening: Local API base URL is not permitted.");
}

function formatDateString(dateValue?: string | Date): string {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  const day = date.getDate().toString().padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function formatDateTimeString(dateValue?: string | Date): string {
  if (!dateValue) return "";
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return String(dateValue);

  const datePart = formatDateString(date);
  let hours = date.getHours();
  const minutes = date.getMinutes().toString().padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12 || 12;
  return `${datePart}, ${hours.toString().padStart(2, "0")}:${minutes} ${ampm}`;
}

function readItems(payload: any): any[] {
  if (Array.isArray(payload?.data?.data)) return payload.data.data;
  if (Array.isArray(payload?.data?.items)) return payload.data.items;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload)) return payload;
  return [];
}

function itemId(item: any): string {
  return String(item?._id ?? item?.id ?? "");
}

function contactName(contact: any): string {
  return contact?.studentName || contact?.staffName || "";
}

function contactRoll(contact: any): string {
  return contact?.rollNo || contact?.employeeId || "";
}

function contactPhone(contact: any): string {
  return contact?.studentPhone || contact?.staffPhone || "";
}

function contactEmail(contact: any): string {
  return contact?.studentEmail || contact?.staffEmail || "";
}

function mapLostItem(item: any): BrowseItem {
  const id = itemId(item);
  return {
    id,
    itemId: id,
    name: item.name || "Unknown Item",
    date: formatDateString(item.dateLost),
    location: item.location || "Unknown Location",
    collectFrom: item.collectFrom || "Admin Reception",
    description: item.description || "No description available.",
    image: item.imageUrl || "",
    category: item.category || "Others",
  };
}

function mapFoundItem(item: any): BrowseItem {
  const id = itemId(item);
  return {
    id,
    itemId: id,
    name: item.name || "Unknown Item",
    date: formatDateString(item.dateFound),
    location: item.location || "Unknown Location",
    collectFrom: item.collectFrom || "Admin Reception",
    description: item.description || "No description available.",
    image: item.imageUrl || "",
    category: item.category || "Others",
  };
}

export function mapAdminLostItem(item: any): AdminLostItem {
  const contact = item.contact || {};
  return {
    id: itemId(item),
    name: item.name || "Unknown Item",
    dateFound: formatDateString(item.dateLost),
    location: item.location || "Unknown Location",
    status: item.status === "Returned" ? "Returned" : "Not Returned",
    studentName: item.returnedBy || "",
    rollNo: item.returnedRollNo || "",
    claimedDate: formatDateString(item.returnedDate),
    reporterName: contactName(contact) || "Unknown",
    reporterRoll: contactRoll(contact),
    reporterPhone: contactPhone(contact),
    reporterEmail: contactEmail(contact),
    reportedAt: formatDateTimeString(item.reportedAt || item.createdAt || item.dateLost),
    lastUpdated: formatDateTimeString(item.lastUpdated || item.updatedAt || item.reportedAt || item.dateLost),
  };
}

export function mapAdminFoundItem(item: any): AdminFoundItem {
  return {
    id: itemId(item),
    name: item.name || "Unknown Item",
    dateFound: formatDateString(item.dateFound),
    location: item.location || "Unknown Location",
    status: item.status === "Returned" ? "Returned" : "Not Returned",
    studentName: item.claimedBy || "",
    rollNo: item.claimedRollNo || "",
    returnedDate: formatDateString(item.returnedDate),
    foundAt: formatDateTimeString(item.foundAt || item.createdAt || item.dateFound),
    lastUpdated: formatDateTimeString(item.lastUpdated || item.updatedAt || item.foundAt || item.dateFound),
  };
}

function mapReturnedHistoryRecord(item: any): ReturnedHistoryRecord {
  return {
    id: itemId(item),
    name: item.itemName || item.name || "Unknown Item",
    type: item.itemType === "Lost" ? "Lost" : "Found",
    reportedDate: formatDateString(item.dateReported || item.createdAt || item.returnedDate),
    closedDate: formatDateString(item.returnedDate || item.closedDate || item.updatedAt),
    studentName: item.student || item.studentName || "",
    rollNo: item.rollNo || "",
    location: item.location || "—",
    reporter: item.reporter || item.student || "",
    reporterPhone: item.reporterPhone || "",
    reporterEmail: item.reporterEmail || "",
  };
}

function mapDisposedRecord(item: any): DisposedRecord {
  return {
    id: itemId(item),
    name: item.itemName || item.name || "Unknown Item",
    type: item.itemType === "Lost" ? "Lost" : "Found",
    reportedDate: formatDateString(item.dateReported || item.reportedDate),
    location: item.location || "Unknown Location",
    reporter: item.reporter || "",
    reporterPhone: item.reporterPhone || "",
    reporterEmail: item.reporterEmail || "",
    disposalLocation: item.disposalLocation || "",
    donatedTo: item.donatedTo || "",
    disposedDate: formatDateString(item.disposedDate || item.createdAt),
    notes: item.notes || "",
  };
}

function buildQueryParams(params: Record<string, string | undefined>) {
  const urlParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value && value.trim() !== "") {
      urlParams.set(key, value);
    }
  });

  return urlParams.toString();
}

async function fetchJson(
  path: string,
  query: Record<string, string | undefined> = {},
  options: RequestInit = {}
) {
  const queryString = buildQueryParams(query);
  const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  if (!response.ok) {
    throw new Error(`Request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchBrowseItemsFromBackend(type: "lost" | "found", query: Record<string, string | undefined>): Promise<BrowseItem[]> {
  const path = type === "lost" ? "/api/items/lost" : "/api/items/found";
  const payload = await fetchJson(path, { ...query, limit: "1000", status: "Not Returned" });
  const items = readItems(payload);

  return items.map((item: any) => (type === "lost" ? mapLostItem(item) : mapFoundItem(item)));
}

export async function getBrowseItems(
  type: "lost" | "found" | "all",
  query: Record<string, string | undefined>
): Promise<BrowseItem[]> {
  if (type === "all") {
    const [lost, found] = await Promise.all([
      fetchBrowseItemsFromBackend("lost", query),
      fetchBrowseItemsFromBackend("found", query),
    ]);
    return [...lost, ...found];
  }

  return fetchBrowseItemsFromBackend(type, query);
}

export async function getAdminLostItems(status?: "Returned" | "Not Returned"): Promise<AdminLostItem[]> {
  if (status) {
    const payload = await fetchJson("/api/items/lost", { limit: "1000", status });
    return readItems(payload).map(mapAdminLostItem);
  }
  const [notReturnedPayload, returnedPayload] = await Promise.all([
    fetchJson("/api/items/lost", { limit: "1000", status: "Not Returned" }),
    fetchJson("/api/items/lost", { limit: "1000", status: "Returned" }),
  ]);
  return [...readItems(notReturnedPayload), ...readItems(returnedPayload)].map(mapAdminLostItem);
}

export async function getAdminFoundItems(status?: "Returned" | "Not Returned"): Promise<AdminFoundItem[]> {
  if (status) {
    const payload = await fetchJson("/api/items/found", { limit: "1000", status });
    return readItems(payload).map(mapAdminFoundItem);
  }
  const [notReturnedPayload, returnedPayload] = await Promise.all([
    fetchJson("/api/items/found", { limit: "1000", status: "Not Returned" }),
    fetchJson("/api/items/found", { limit: "1000", status: "Returned" }),
  ]);
  return [...readItems(notReturnedPayload), ...readItems(returnedPayload)].map(mapAdminFoundItem);
}

export async function getHistory(): Promise<{
  returned: ReturnedHistoryRecord[];
  disposed: DisposedRecord[];
}> {
  try {
    const payload = await fetchJson("/api/history", { limit: "1000" });
    const data = payload?.data ?? payload;
    const returnedItems = data?.returned ?? data?.claimed ?? data?.["claimed" + "Items"] ?? [];
    const disposedItems = data?.disposed ?? data?.disposedItems ?? [];

    if (Array.isArray(returnedItems) || Array.isArray(disposedItems)) {
      return {
        returned: Array.isArray(returnedItems) ? returnedItems.map(mapReturnedHistoryRecord) : [],
        disposed: Array.isArray(disposedItems) ? disposedItems.map(mapDisposedRecord) : [],
      };
    }
  } catch {
    // Some backend versions expose history as separate protected subroutes.
  }

  const [returnedPayload, disposedPayload] = await Promise.all([
    fetchJson("/api/history/claimed", { limit: "1000" }),
    fetchJson("/api/history/disposed", { limit: "1000" }),
  ]);

  return {
    returned: readItems(returnedPayload).map(mapReturnedHistoryRecord),
    disposed: readItems(disposedPayload).map(mapDisposedRecord),
  };
}

export type ReportItemInput = {
  type: "lost" | "found";
  name: string;
  description: string;
  category: string;
  location: string;
  date: string;
  collectFrom?: string;
  contactType: "student" | "staff";
  studentName?: string;
  rollNo?: string;
  studentPhone?: string;
  studentEmail?: string;
  staffName?: string;
  employeeId?: string;
  department?: string;
  staffPhone?: string;
  staffEmail?: string;
};

export async function reportItem(input: ReportItemInput): Promise<AdminLostItem | AdminFoundItem> {
  const isLost = input.type === "lost";
  const payload = {
    name: input.name,
    description: input.description,
    category: input.category,
    location: input.location,
    contactType: input.contactType,
    studentName: input.studentName,
    rollNo: input.rollNo,
    studentPhone: input.studentPhone,
    studentEmail: input.studentEmail,
    staffName: input.staffName,
    employeeId: input.employeeId,
    department: input.department,
    staffPhone: input.staffPhone,
    staffEmail: input.staffEmail,
    ...(isLost
      ? { dateLost: input.date }
      : { dateFound: input.date, collectFrom: input.collectFrom }),
  };

  const response = await fetchJson(isLost ? "/api/items/lost/report" : "/api/items/found/report", {}, {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return isLost ? mapAdminLostItem(response?.data) : mapAdminFoundItem(response?.data);
}

// ─── Status Update Endpoints ────────────────────────────────────────────────

export async function updateLostItemStatus(
  id: string,
  returnedBy: string,
  returnedRollNo: string
): Promise<void> {
  await fetchJson(`/api/items/lost/${id}`, {}, {
    method: "PUT",
    body: JSON.stringify({ status: "Returned", returnedBy, returnedRollNo }),
  });
}

export async function updateFoundItemStatus(
  id: string,
  claimedBy: string,
  claimedRollNo: string,
  claimedPhone: string,
  claimedEmail: string
): Promise<void> {
  await fetchJson(`/api/items/found/${id}`, {}, {
    method: "PUT",
    body: JSON.stringify({ status: "Returned", claimedBy, claimedRollNo, claimedPhone, claimedEmail }),
  });
}

// ─── Delete Endpoints ───────────────────────────────────────────────────────

export async function deleteLostItem(id: string): Promise<void> {
  await fetchJson(`/api/items/lost/${id}`, {}, { method: "DELETE" });
}

export async function deleteFoundItem(id: string): Promise<void> {
  await fetchJson(`/api/items/found/${id}`, {}, { method: "DELETE" });
}

// ─── Disposal Endpoint ──────────────────────────────────────────────────────

export async function markItemDisposed(
  id: string,
  itemType: "Found" | "Lost",
  payload: { disposalLocation: string; donatedTo?: string; notes?: string }
): Promise<void> {
  await fetchJson(`/api/history/disposed/${id}/${itemType}`, {}, {
    method: "POST",
    body: JSON.stringify(payload),
  });
}
