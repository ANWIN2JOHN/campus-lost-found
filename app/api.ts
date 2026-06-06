import type { BrowseItem } from "./data/appData";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:5000";

function formatDateString(dateValue: string | Date): string {
  const date = new Date(dateValue);
  const day = date.getDate().toString().padStart(2, "0");
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const month = monthNames[date.getMonth()];
  const year = date.getFullYear();
  return `${day} ${month} ${year}`;
}

function mapLostItem(item: any): BrowseItem {
  return {
    id: item._id ?? item.id,
    itemId: item._id ?? item.id,
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
  return {
    id: item._id ?? item.id,
    itemId: item._id ?? item.id,
    name: item.name || "Unknown Item",
    date: formatDateString(item.dateFound),
    location: item.location || "Unknown Location",
    collectFrom: item.collectFrom || "Admin Reception",
    description: item.description || "No description available.",
    image: item.imageUrl || "",
    category: item.category || "Others",
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

async function fetchBrowseItemsFromBackend(type: "lost" | "found", query: Record<string, string | undefined>): Promise<BrowseItem[]> {
  const path = type === "lost" ? "/api/items/lost" : "/api/items/found";
  const queryString = buildQueryParams({ ...query, limit: "1000", status: "Not Returned" });
  const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ""}`;

  const response = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Unable to load ${type} items: ${response.statusText}`);
  }

  const payload = await response.json();
  const items = payload?.data?.data ?? [];

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
