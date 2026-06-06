export type BrowseItem = {
  id: number;
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
  id: number;
  name: string;
  dateFound: string;
  location: string;
  status: "Not Returned" | "Returned";
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
  id: number;
  name: string;
  dateFound: string;
  location: string;
  status: "Not Returned" | "Returned";
  studentName: string;
  rollNo: string;
  returnedDate: string;
  foundAt: string;
  lastUpdated: string;
};

export type ClaimedItem = {
  student: string;
  id: string;
  item: string;
  type: "Lost" | "Found";
  returnedDate: string;
  status: "Returned";
};

export type ReturnedLostRecord = {
  id: number;
  name: string;
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
  id: number;
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

export const lostItems: BrowseItem[] = [
  { id: 1, itemId: "LOST-001", name: "Black Leather Bi-fold Wallet with ID", date: "25 May 2026", location: "Library 2nd Floor", collectFrom: "Admin Reception", description: "Black leather bi-fold wallet, contains student ID card.", image: "https://images.unsplash.com/photo-1627123424574-724758594e93?w=400&h=300&fit=crop", category: "Accessories" },
  { id: 2, itemId: "LOST-002", name: "Blue Backpack", date: "10 May 2026", location: "Main Cafeteria", collectFrom: "Main Reception", description: "Medium-size blue Nike backpack with a red keychain attached.", image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400&h=300&fit=crop", category: "Bags & Backpacks" },
  { id: 3, itemId: "LOST-003", name: "Black Water Bottle", date: "15 Apr 2026", location: "Sports Complex Gym", collectFrom: "Humanities Reception", description: "500 ml black stainless steel bottle, name 'James' written on the bottom.", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400&h=300&fit=crop", category: "Water Bottles" },
  { id: 4, itemId: "LOST-004", name: "Sunglasses", date: "22 Apr 2026", location: "Central Quad", collectFrom: "Admin Reception", description: "Aviator-style sunglasses in a brown hard case.", image: "https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400&h=300&fit=crop", category: "Eyewear" },
  { id: 5, itemId: "LOST-005", name: "Keys", date: "20 Mar 2026", location: "North Parking Lot", collectFrom: "Main Reception", description: "Bundle of 3 keys on a green bottle-opener keychain.", image: "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=400&h=300&fit=crop", category: "Keys & Keychains" },
];

export const foundItems: BrowseItem[] = [
  { id: 1, itemId: "FOUND-001", name: "Red Foldable Umbrella with Floral Print", date: "28 May 2026", location: "Campus Bus Stop", collectFrom: "Main Reception", description: "Compact red foldable umbrella with floral print lining.", category: "Accessories", image: "https://images.unsplash.com/photo-1767379200536-128ddff6c89c?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: 2, itemId: "FOUND-002", name: "Laptop Charger", date: "12 May 2026", location: "Computer Lab 3", collectFrom: "Admin Reception", description: "Dell 65 W laptop charger with a black cable, slightly frayed near the tip.", category: "Electronics", image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: 3, itemId: "FOUND-003", name: "Student ID Card", date: "15 Apr 2026", location: "Student Canteen", collectFrom: "Humanities Reception", description: "Campus ID card, name visible: Adeola Benson, Dept of Engineering.", category: "Others", image: "https://images.unsplash.com/photo-1623795457671-600b1223c2db?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: 4, itemId: "FOUND-004", name: "Earphones", date: "22 Apr 2026", location: "Library Reading Room", collectFrom: "Main Reception", description: "White wired earphones in a small zip pouch.", category: "Electronics", image: "https://images.unsplash.com/photo-1728583938904-7124b3e1e428?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
  { id: 5, itemId: "FOUND-005", name: "Notebook", date: "25 Mar 2026", location: "Lecture Hall B", collectFrom: "Admin Reception", description: "A5 spiral notebook, Chemistry notes visible on first page.", category: "Books & Notebooks", image: "https://images.unsplash.com/photo-1612367980327-7454a7276aa7?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=400&q=80" },
];

export const categories: CategoryStat[] = [
  { name: "Bags & Backpacks", icon: "🎒", count: 24 },
  { name: "Water Bottles", icon: "🍶", count: 18 },
  { name: "Electronics", icon: "💻", count: 31 },
  { name: "Books & Notebooks", icon: "📚", count: 15 },
  { name: "Keys & Keychains", icon: "🔑", count: 22 },
  { name: "Accessories", icon: "⌚", count: 19 },
  { name: "Eyewear", icon: "🕶️", count: 11 },
  { name: "Others", icon: "📦", count: 8 },
];

export const adminLostItems: AdminLostItem[] = [
  { id: 1, name: "Black Wallet", dateFound: "25 May 2026", location: "Library 2nd Floor", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Mirabel Smith", reporterRoll: "STU-2024-001", reporterPhone: "+91 9876543210", reporterEmail: "mirabel@campus.edu", reportedAt: "25 May 2026, 09:45 AM", lastUpdated: "25 May 2026, 09:45 AM" },
  { id: 3, name: "Black Note Book", dateFound: "24 May 2026", location: "Square Hall", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Priya Nair", reporterRoll: "STU-2024-003", reporterPhone: "+91 9876543212", reporterEmail: "priya@campus.edu", reportedAt: "24 May 2026, 10:20 AM", lastUpdated: "24 May 2026, 10:20 AM" },
  { id: 5, name: "Black Water Bottle", dateFound: "10 May 2026", location: "Sports Complex Gym", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Rajesh Kumar", reporterRoll: "STU-2024-005", reporterPhone: "+91 9876543214", reporterEmail: "rajesh@campus.edu", reportedAt: "10 May 2026, 11:05 AM", lastUpdated: "10 May 2026, 11:05 AM" },
  { id: 6, name: "Keys", dateFound: "10 May 2026", location: "North Parking Lot", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Ananya Singh", reporterRoll: "STU-2024-006", reporterPhone: "+91 9876543215", reporterEmail: "ananya@campus.edu", reportedAt: "10 May 2026, 02:30 PM", lastUpdated: "10 May 2026, 02:30 PM" },
  { id: 9, name: "iPhone 13 (Grey)", dateFound: "25 Apr 2026", location: "Cafeteria B", status: "Returned", studentName: "James Okafor", rollNo: "STU-2024-019", claimedDate: "30 Apr 2026", reporterName: "James Okafor", reporterRoll: "STU-2024-019", reporterPhone: "+91 9876543220", reporterEmail: "james@campus.edu", reportedAt: "25 Apr 2026, 08:15 AM", lastUpdated: "30 Apr 2026, 03:00 PM" },
  { id: 10, name: "Blue Denim Jacket", dateFound: "22 Apr 2026", location: "Auditorium Foyer", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Fatima Al-Rashid", reporterRoll: "STU-2024-031", reporterPhone: "+91 9876543222", reporterEmail: "fatima@campus.edu", reportedAt: "22 Apr 2026, 01:45 PM", lastUpdated: "22 Apr 2026, 01:45 PM" },
  { id: 11, name: "Prescription Glasses", dateFound: "20 Apr 2026", location: "Lecture Hall A", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Chloe Martin", reporterRoll: "STU-2024-093", reporterPhone: "+91 9876543230", reporterEmail: "chloe@campus.edu", reportedAt: "20 Apr 2026, 09:00 AM", lastUpdated: "20 Apr 2026, 09:00 AM" },
  { id: 12, name: "Samsung Galaxy Buds", dateFound: "18 Apr 2026", location: "Engineering Block", status: "Returned", studentName: "Liam Patel", rollNo: "STU-2024-057", claimedDate: "25 Apr 2026", reporterName: "Liam Patel", reporterRoll: "STU-2024-057", reporterPhone: "+91 9876543232", reporterEmail: "liam@campus.edu", reportedAt: "18 Apr 2026, 11:30 AM", lastUpdated: "25 Apr 2026, 10:15 AM" },
  { id: 13, name: "Sports Bag", dateFound: "15 Apr 2026", location: "Indoor Stadium", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Yusuf Hassan", reporterRoll: "STU-2024-088", reporterPhone: "+91 9876543240", reporterEmail: "yusuf@campus.edu", reportedAt: "15 Apr 2026, 07:45 AM", lastUpdated: "15 Apr 2026, 07:45 AM" },
  { id: 14, name: "USB Flash Drive (32GB)", dateFound: "15 Apr 2026", location: "Computer Lab 2", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Ethan Zhao", reporterRoll: "STU-2024-102", reporterPhone: "+91 9876543245", reporterEmail: "ethan@campus.edu", reportedAt: "15 Apr 2026, 02:00 PM", lastUpdated: "15 Apr 2026, 02:00 PM" },
  { id: 15, name: "Chemistry Textbook", dateFound: "12 Apr 2026", location: "Science Block Room 5", status: "Returned", studentName: "Amara Diallo", rollNo: "STU-2024-064", claimedDate: "20 Apr 2026", reporterName: "Amara Diallo", reporterRoll: "STU-2024-064", reporterPhone: "+91 9876543250", reporterEmail: "amara@campus.edu", reportedAt: "12 Apr 2026, 10:00 AM", lastUpdated: "20 Apr 2026, 04:30 PM" },
  { id: 16, name: "Power Bank", dateFound: "05 Apr 2026", location: "Student Union", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Noah Williams", reporterRoll: "STU-2024-110", reporterPhone: "+91 9876543255", reporterEmail: "noah@campus.edu", reportedAt: "05 Apr 2026, 09:20 AM", lastUpdated: "05 Apr 2026, 09:20 AM" },
  { id: 17, name: "Wrist Watch (Silver)", dateFound: "05 Apr 2026", location: "Gym Changing Room", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Sofia Martinez", reporterRoll: "STU-2024-118", reporterPhone: "+91 9876543260", reporterEmail: "sofia@campus.edu", reportedAt: "05 Apr 2026, 06:55 PM", lastUpdated: "05 Apr 2026, 06:55 PM" },
  { id: 18, name: "Laptop Bag (Black)", dateFound: "25 Mar 2026", location: "Admin Block Corridor", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Omar Farouq", reporterRoll: "STU-2024-125", reporterPhone: "+91 9876543265", reporterEmail: "omar@campus.edu", reportedAt: "25 Mar 2026, 11:40 AM", lastUpdated: "25 Mar 2026, 11:40 AM" },
  { id: 19, name: "Student ID Card", dateFound: "20 Mar 2026", location: "Library Entrance", status: "Returned", studentName: "Adeola Benson", rollNo: "STU-2024-012", claimedDate: "22 Mar 2026", reporterName: "Adeola Benson", reporterRoll: "STU-2024-012", reporterPhone: "+91 9876543270", reporterEmail: "adeola@campus.edu", reportedAt: "20 Mar 2026, 03:15 PM", lastUpdated: "22 Mar 2026, 09:00 AM" },
  { id: 20, name: "Airpods Pro (White)", dateFound: "20 Mar 2026", location: "Food Court", status: "Not Returned", studentName: "", rollNo: "", claimedDate: "", reporterName: "Ines Dupont", reporterRoll: "STU-2024-133", reporterPhone: "+91 9876543275", reporterEmail: "ines@campus.edu", reportedAt: "20 Mar 2026, 12:30 PM", lastUpdated: "20 Mar 2026, 12:30 PM" },
];

export const adminFoundItems: AdminFoundItem[] = [
  { id: 2, name: "Blue Rucksack", dateFound: "28 May 2026", location: "Main Cafeteria", status: "Returned", studentName: "John Adams", rollNo: "STU-2024-002", returnedDate: "2026-05-30", foundAt: "28 May 2026, 08:30 AM", lastUpdated: "30 May 2026, 02:45 PM" },
  { id: 4, name: "Sunglasses", dateFound: "25 May 2026", location: "Central Quad", status: "Returned", studentName: "Sarah Chen", rollNo: "STU-2024-045", returnedDate: "2026-05-28", foundAt: "25 May 2026, 01:15 PM", lastUpdated: "28 May 2026, 11:00 AM" },
  { id: 7, name: "Red Umbrella", dateFound: "20 May 2026", location: "Campus Bus Stop", status: "Not Returned", studentName: "", rollNo: "", returnedDate: "", foundAt: "20 May 2026, 07:50 AM", lastUpdated: "20 May 2026, 07:50 AM" },
  { id: 8, name: "Laptop Charger", dateFound: "15 May 2026", location: "Computer Lab 3", status: "Returned", studentName: "Michael Brown", rollNo: "STU-2024-078", returnedDate: "2026-05-22", foundAt: "15 May 2026, 10:40 AM", lastUpdated: "22 May 2026, 09:30 AM" },
  { id: 21, name: "Student ID Card", dateFound: "10 May 2026", location: "Student Canteen", status: "Returned", studentName: "Adeola Benson", rollNo: "STU-2024-012", returnedDate: "2026-05-12", foundAt: "10 May 2026, 12:00 PM", lastUpdated: "12 May 2026, 10:20 AM" },
  { id: 22, name: "Earphones (White)", dateFound: "05 May 2026", location: "Library Reading Room", status: "Not Returned", studentName: "", rollNo: "", returnedDate: "", foundAt: "05 May 2026, 03:25 PM", lastUpdated: "05 May 2026, 03:25 PM" },
  { id: 23, name: "Chemistry Notebook", dateFound: "25 Apr 2026", location: "Lecture Hall B", status: "Returned", studentName: "Liam Patel", rollNo: "STU-2024-057", returnedDate: "2026-05-02", foundAt: "25 Apr 2026, 09:10 AM", lastUpdated: "02 May 2026, 03:00 PM" },
  { id: 24, name: "Wallet (Brown Leather)", dateFound: "22 Apr 2026", location: "Sports Pavilion", status: "Not Returned", studentName: "", rollNo: "", returnedDate: "", foundAt: "22 Apr 2026, 04:00 PM", lastUpdated: "22 Apr 2026, 04:00 PM" },
  { id: 25, name: "Water Bottle (Blue)", dateFound: "15 Apr 2026", location: "Engineering Lab 2", status: "Not Returned", studentName: "", rollNo: "", returnedDate: "", foundAt: "15 Apr 2026, 11:50 AM", lastUpdated: "15 Apr 2026, 11:50 AM" },
  { id: 26, name: "Wired Keyboard", dateFound: "10 Apr 2026", location: "Media Studies Room", status: "Returned", studentName: "Ethan Zhao", rollNo: "STU-2024-102", returnedDate: "2026-04-20", foundAt: "10 Apr 2026, 02:35 PM", lastUpdated: "20 Apr 2026, 01:15 PM" },
  { id: 27, name: "Prescription Glasses", dateFound: "05 Apr 2026", location: "Health Centre Waiting", status: "Not Returned", studentName: "", rollNo: "", returnedDate: "", foundAt: "05 Apr 2026, 10:05 AM", lastUpdated: "05 Apr 2026, 10:05 AM" },
  { id: 28, name: "Gym Gloves", dateFound: "05 Apr 2026", location: "Fitness Centre", status: "Returned", studentName: "Sofia Martinez", rollNo: "STU-2024-118", returnedDate: "2026-04-12", foundAt: "05 Apr 2026, 05:30 PM", lastUpdated: "12 Apr 2026, 08:45 AM" },
  { id: 29, name: "Campus Bus Pass", dateFound: "25 Mar 2026", location: "Main Gate", status: "Returned", studentName: "Omar Farouq", rollNo: "STU-2024-125", returnedDate: "2026-03-25", foundAt: "25 Mar 2026, 08:00 AM", lastUpdated: "25 Mar 2026, 04:00 PM" },
  { id: 30, name: "Mini Tripod", dateFound: "20 Mar 2026", location: "Photography Studio", status: "Not Returned", studentName: "", rollNo: "", returnedDate: "", foundAt: "20 Mar 2026, 01:20 PM", lastUpdated: "20 Mar 2026, 01:20 PM" },
  { id: 31, name: "Lab Safety Goggles", dateFound: "15 Mar 2026", location: "Chemistry Lab", status: "Not Returned", studentName: "", rollNo: "", returnedDate: "", foundAt: "15 Mar 2026, 03:45 PM", lastUpdated: "15 Mar 2026, 03:45 PM" },
  { id: 32, name: "Hoodie (Navy Blue)", dateFound: "10 Mar 2026", location: "Library 3rd Floor", status: "Not Returned", studentName: "", rollNo: "", returnedDate: "", foundAt: "10 Mar 2026, 02:10 PM", lastUpdated: "10 Mar 2026, 02:10 PM" },
];

export const claimedItems: ClaimedItem[] = [
  { student: "Mirabel Smith", id: "STU-2024-001", item: "Black Wallet", type: "Lost", returnedDate: "12 May 2024", status: "Returned" },
  { student: "John Adams", id: "STU-2024-002", item: "Blue Backpack", type: "Found", returnedDate: "13 May 2024", status: "Returned" },
  { student: "Priya Nair", id: "STU-2024-003", item: "Black Note Book", type: "Lost", returnedDate: "11 May 2024", status: "Returned" },
  { student: "Sarah Chen", id: "STU-2024-045", item: "Sunglasses", type: "Found", returnedDate: "14 May 2024", status: "Returned" },
  { student: "Michael Brown", id: "STU-2024-078", item: "Laptop Charger", type: "Found", returnedDate: "15 May 2024", status: "Returned" },
  { student: "Adeola Benson", id: "STU-2024-012", item: "Student ID Card", type: "Found", returnedDate: "16 May 2024", status: "Returned" },
  { student: "Rajesh Kumar", id: "STU-2024-005", item: "Black Water Bottle", type: "Lost", returnedDate: "17 May 2024", status: "Returned" },
  { student: "Ananya Singh", id: "STU-2024-006", item: "Keys", type: "Lost", returnedDate: "18 May 2024", status: "Returned" },
  { student: "James Okafor", id: "STU-2024-019", item: "Earphones", type: "Found", returnedDate: "19 May 2024", status: "Returned" },
  { student: "Fatima Al-Rashid", id: "STU-2024-031", item: "Red Umbrella", type: "Found", returnedDate: "20 May 2024", status: "Returned" },
  { student: "Liam Patel", id: "STU-2024-057", item: "Chemistry Notebook", type: "Lost", returnedDate: "21 May 2024", status: "Returned" },
  { student: "Amara Diallo", id: "STU-2024-064", item: "Airpods Case", type: "Found", returnedDate: "22 May 2024", status: "Returned" },
  { student: "Yusuf Hassan", id: "STU-2024-088", item: "Sports Bag", type: "Lost", returnedDate: "23 May 2024", status: "Returned" },
  { student: "Chloe Martin", id: "STU-2024-093", item: "Prescription Glasses", type: "Lost", returnedDate: "24 May 2024", status: "Returned" },
  { student: "Ethan Zhao", id: "STU-2024-102", item: "USB Flash Drive", type: "Found", returnedDate: "25 May 2024", status: "Returned" },
];

export const collectFromOptions = ["Admin Reception", "Main Reception", "Humanities Reception"] as const;

export function parseDateForCountdown(dateStr: string): Date {
  const months: Record<string, number> = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };
  const parts = dateStr.trim().split(" ");
  return new Date(Number(parts[2]), months[parts[1]], Number(parts[0]));
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
