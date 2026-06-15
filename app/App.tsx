import { lazy, Suspense, useEffect, useMemo, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { toast, Toaster } from "sonner";
import {
  Search, FolderOpen, BookOpen, Phone, Bell, ChevronRight, ChevronDown,
  CheckSquare, Settings, LogOut, Plus, Edit2, Trash2,
  CheckCircle, Calendar, MapPin, Filter, Tag,
  AlertCircle, AlertTriangle, Check,
  Upload, ArrowLeft, Info, Building2, ArrowUp, ShieldCheck, Lock,
  Recycle, Package, Heart, Loader2, Menu
} from "lucide-react";
import { CardNameTooltip } from "./components/CardNameTooltip";
import ClaimCountdownBar from "./components/ClaimCountdownBar";
import { ScrollToTopButton } from "./components/ScrollToTopButton";
import campusLogo from "../imports/afa90946107debb396ffdb7284683a17-1.jpg";
import { getAdminFoundItems, getAdminLostItems, getBrowseItems, getHistory, reportItem, updateLostItemStatus, updateFoundItemStatus, deleteLostItem, markItemDisposed } from "./api";
import {
  categories,
  collectFromOptions,
  getDaysInfo,
  parseDateForCountdown,
  type AdminFoundItem,
  type AdminLostItem,
  type BrowseItem,
  type ReturnedHistoryRecord,
} from "./data/appData";

const LandingPage = lazy(() => import("./components/LandingPage"));
const LoginPage = lazy(() => import("./components/LoginPage"));

// ─── Date Helper ───────────────────────────────────────────────────────────
function getTodayDateString(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function get30DaysAgoDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

// ─── Input Validation Helpers ───────────────────────────────────────────────
function validateEmail(email: string): string | null {
  const trimmed = email.trim();
  if (!trimmed) return "Email address is required.";
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  if (!emailRegex.test(trimmed)) return "Please enter a valid email address.";
  return null;
}

function validateName(name: string, fieldLabel: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return `${fieldLabel} is required.`;
  if (trimmed.length < 2) return `${fieldLabel} must be at least 2 characters.`;
  if (trimmed.length > 50) return `${fieldLabel} must not exceed 50 characters.`;
  const nameRegex = /^[a-zA-Z\s'-]+$/;
  if (!nameRegex.test(trimmed)) return `${fieldLabel} can only contain letters, spaces, hyphens, and apostrophes.`;
  return null;
}

function validatePhone(phone: string, fieldLabel: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return `${fieldLabel} is required.`;
  const phoneRegex = /^\+?[0-9\s()-]+$/;
  if (!phoneRegex.test(trimmed)) return `${fieldLabel} can only contain numbers, spaces, hyphens, parentheses, and a leading '+'.`;
  const digitsOnly = trimmed.replace(/\D/g, "");
  if (digitsOnly.length < 7 || digitsOnly.length > 15) {
    return `${fieldLabel} must contain between 7 and 15 digits.`;
  }
  return null;
}

// ─── Found Item Return Validators ────────────────────────────────────────────
function validateReturnStudentName(name: string): string | null {
  const trimmed = name.trim();
  if (!trimmed) return "Student Name is required.";
  if (trimmed.length < 8) return "Student Name must contain at least 8 characters.";
  if (trimmed.length > 100) return "Student Name must not exceed 100 characters.";
  if (!/^[a-zA-Z\s]+$/.test(trimmed)) return "Student Name can only contain letters and spaces.";
  return null;
}

function validateReturnRollNo(roll: string): string | null {
  const trimmed = roll.trim().toLowerCase();
  if (!trimmed) return "Roll number is required.";
  if (trimmed.length < 7) return "Roll Number must be at least 7 characters.";
  if (trimmed.length > 30) return "Roll Number must not exceed 30 characters.";
  if (!/^[a-z0-9]+$/.test(trimmed)) {
    return "Only lowercase alphanumeric characters allowed.";
  }
  return null;
}

function validateReturnPhone(phone: string): string | null {
  const trimmed = phone.trim();
  if (!trimmed) return "Phone number is required.";
  if (!/^\d+$/.test(trimmed) || trimmed.length !== 10) {
    return "Phone Number must contain exactly 10 digits.";
  }
  return null;
}

function validateReturnEmail(email: string, rollNo: string): string | null {
  const trimmed = email.trim().toLowerCase();
  if (!trimmed) return "Please enter a college email address.";
  if (!trimmed.endsWith("@kristujayanti.com") || /\s/.test(trimmed)) {
    return "Only @kristujayanti.com domain are allowed.";
  }
  const username = trimmed.split("@")[0];
  if (username !== rollNo.trim().toLowerCase()) {
    return "Email must match the entered Roll Number.";
  }
  return null;
}

function validateReturnedDate(date: string, foundDateStr: string): string | null {
  if (!date) return "Returned Date is required.";
  const parts = date.split("-").map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    return "Returned Date is not a valid date.";
  }
  const returnDate = new Date(parts[0], parts[1] - 1, parts[2]);
  returnDate.setHours(0, 0, 0, 0);

  if (isNaN(returnDate.getTime())) return "Returned Date is not a valid date.";
  // Allow returned date up to tomorrow to bypass potential client/server timezone drifts
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  if (returnDate > tomorrow) return "Returned Date cannot be a future date.";
  if (foundDateStr) {
    const parsedFound = parseDateForCountdown(foundDateStr);
    if (!isNaN(parsedFound.getTime())) {
      parsedFound.setHours(0, 0, 0, 0);
      if (returnDate.getTime() < parsedFound.getTime()) {
        return "Returned Date cannot be before the item's found date.";
      }
    }
  }
  return null;
}

function validateReturnedTime(time: string, date: string): string | null {
  if (!time) return "Returned Time is required.";
  if (!/^\d{2}:\d{2}$/.test(time)) return "Returned Time must be in HH:MM format.";
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  if (date === todayStr) {
    const [h, m] = time.split(":").map(Number);
    // Allow up to a 15-minute clock drift/grace period to prevent clock drifts from marking prefilled times as "future"
    if (h * 60 + m > now.getHours() * 60 + now.getMinutes() + 15) return "Returned Time cannot be in the future.";
  }
  return null;
}

function validateReturnRemarks(remarks: string): string | null {
  const trimmed = remarks.trim();
  if (trimmed.length > 500) return "Remarks must not exceed 500 characters.";
  if (/<[^>]+>/.test(trimmed)) return "Remarks cannot contain HTML tags.";
  if (/javascript:/i.test(trimmed) || /on\w+\s*=/i.test(trimmed)) return "Remarks contain invalid content.";
  return null;
}

// ─── Helper Types ──────────────────────────────────────────────────────────

export type ReturnedLostRecord = {
  id: string;
  type: "Lost" | "Found";
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


// ─── Upload Page (Admin) ───────────────────────────────────────────────────

function Field({ label, required, error, children }: { label: string; required?: boolean; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-gray-700 text-xs font-medium block mb-1.5" style={{ fontFamily: "DM Sans, sans-serif" }}>
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {error && (
        <p className="text-red-500 text-xs mt-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
          {error}
        </p>
      )}
    </div>
  );
}


function UploadPage({ onBack, onItemCreated }: { onBack: () => void; onItemCreated?: (type: "lost" | "found") => void | Promise<void> }) {
  const [itemType, setItemType] = useState<"lost" | "found">("found");
  const [contactType, setContactType] = useState<"student" | "staff">("student");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    name: "", location: "", date: getTodayDateString(), collectFrom: "", description: "", category: "", image: "",
    studentName: "", rollNo: "", phone: "", email: "",
    staffName: "", employeeId: "", department: "", staffPhone: "", staffEmail: "",
    customCategory: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [pageLoading, setPageLoading] = useState(true);
  const [tabLoading, setTabLoading] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [categoryLoading, setCategoryLoading] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setPageLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  const isLost = itemType === "lost";
  const isStudent = contactType === "student";
  const accent = isLost ? "#f59e0b" : "#10b981";
  const btnClass = isLost
    ? "bg-amber-500 hover:bg-amber-600 text-white"
    : "bg-emerald-500 hover:bg-emerald-600 text-white";

  const inputCls = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all";

  const getFieldError = (key: string, value: string): string | null => {
    const trimmed = value.trim();
    switch (key) {
      case "name":
        if (!trimmed) return "Item Name is required.";
        if (trimmed.length < 10) return "Item Name must be at least 10 characters.";
        if (trimmed.length > 100) return "Item Name must not exceed 100 characters.";
        return null;
      case "location": {
        const label = isLost ? "Last Seen Location" : "Location Found";
        if (!trimmed) return `${label} is required.`;
        if (isLost && trimmed.length < 15) return `${label} must be at least 15 characters.`;
        if (!isLost && trimmed.length < 10) return `${label} must be at least 10 characters.`;
        if (trimmed.length > 100) return `${label} must not exceed 100 characters.`;
        return null;
      }
      case "description":
        if (!trimmed) return "Description is required.";
        if (isLost && trimmed.length < 15) return "Description must be at least 15 characters.";
        if (!isLost && trimmed.length < 15) return "Description must be at least 15 characters.";
        if (trimmed.length > 1000) return "Description must not exceed 1000 characters.";
        return null;
      case "category":
        if (!value) return "Category is required.";
        return null;
      case "customCategory":
        if (form.category === "Others") {
          if (!trimmed) return "Specify Category is required.";
          if (trimmed.length < 8) return "Specify Category must be at least 8 characters.";
          if (trimmed.length > 100) return "Specify Category must not exceed 100 characters.";
        }
        return null;
      case "studentName":
        if (isStudent) {
          if (!trimmed) return "Student Name is required.";
          if (isLost && trimmed.length < 12) return "Student Name must be at least 12 characters.";
          if (!isLost && trimmed.length < 15) return "Student Name must be at least 15 characters.";
          if (trimmed.length > 100) return "Student Name must not exceed 100 characters.";
          if (/^[0-9]+$/.test(trimmed)) return "Student Name cannot be numbers only.";
          if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return "Student Name can only contain letters, spaces, hyphens, and apostrophes.";
        }
        return null;
      case "rollNo":
        if (isStudent) {
          if (!trimmed) return "Roll Number is required.";
          if (trimmed.length < 7) return "Roll Number must be at least 7 characters.";
          if (trimmed.length > 30) return "Roll Number must not exceed 30 characters.";
          if (!/^[a-z0-9]+$/.test(trimmed)) return "Only lowercase alphanumeric characters allowed.";
        }
        return null;
      case "phone":
        if (isStudent) {
          if (!trimmed) return "Phone Number is required.";
          if (!/^\d+$/.test(trimmed)) return "Phone Number must contain digits only.";
          if (trimmed.length !== 10) return "Phone Number must be exactly 10 digits.";
          if (trimmed === "0000000000") return "Phone Number cannot be all zeros.";
        }
        return null;
      case "email":
        if (isStudent) {
          if (!trimmed) return "Email address is required.";
          if (!trimmed.endsWith("@kristujayanti.com") || trimmed !== trimmed.toLowerCase() || /\s/.test(value)) {
            return "Only @kristujayanti.com domain are allowed.";
          }
          const username = trimmed.substring(0, trimmed.indexOf("@"));
          if (username !== form.rollNo) {
            return "Email must match the entered Roll Number.";
          }
        }
        return null;
      case "staffName":
        if (!isStudent) {
          if (!trimmed) return "Staff Name is required.";
          if (isLost && trimmed.length < 12) return "Staff Name must be at least 12 characters.";
          if (!isLost && trimmed.length < 10) return "Staff Name must be at least 10 characters.";
          if (trimmed.length > 100) return "Staff Name must not exceed 100 characters.";
          if (!/^[a-zA-Z\s'-]+$/.test(trimmed)) return "Staff Name can only contain letters, spaces, hyphens, and apostrophes.";
        }
        return null;
      case "employeeId":
        if (!isStudent) {
          if (!trimmed) return "Staff ID is required.";
          if (trimmed.length < 7) return "Staff ID must be at least 7 characters.";
          if (trimmed.length > 30) return "Staff ID must not exceed 30 characters.";
          if (!/^[a-z0-9]+$/.test(trimmed)) return "Only lowercase alphanumeric characters allowed.";
        }
        return null;
      case "department":
        if (!isStudent) {
          if (!trimmed) return "Department is required.";
          if (isLost && trimmed.length < 10) return "Department must be at least 10 characters.";
          if (!isLost && trimmed.length < 10) return "Department must be at least 10 characters.";
          if (trimmed.length > 100) return "Department must not exceed 100 characters.";
        }
        return null;
      case "staffPhone":
        if (!isStudent) {
          if (!trimmed) return "Phone Number is required.";
          if (!/^\d+$/.test(trimmed)) return "Phone Number must contain digits only.";
          if (trimmed.length !== 10) return "Phone Number must be exactly 10 digits.";
          if (trimmed === "0000000000") return "Phone Number cannot be all zeros.";
        }
        return null;
      case "staffEmail":
        if (!isStudent) {
          if (!trimmed) return "Email address is required.";
          if (!trimmed.endsWith("@kristujayanti.com") || trimmed !== trimmed.toLowerCase() || /\s/.test(value)) {
            return "Only @kristujayanti.com domain are allowed.";
          }
          const username = trimmed.substring(0, trimmed.indexOf("@"));
          if (username !== form.employeeId) {
            return "Email must match the entered Staff ID.";
          }
        }
        return null;
      case "collectFrom":
        if (!isLost && !value) return "Where to Receive From is required.";
        return null;
      case "date":
        if (!value) return `${isLost ? "Date Lost" : "Date Found"} is required.`;
        if (value > getTodayDateString()) return `${isLost ? "Date Lost" : "Date Found"} cannot be in the future.`;
        const minDateStr = get30DaysAgoDateString();
        if (value < minDateStr) {
          return `${isLost ? "Date Lost" : "Date Found"} cannot be older than 30 days.`;
        }
        return null;
      default:
        return null;
    }
  };

  const handleBlur = (key: keyof typeof form) => {
    const err = getFieldError(key, form[key]);
    setErrors(prev => ({ ...prev, [key]: err || "" }));
  };

  const set = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    let val = e.target.value;
    if (key === "rollNo" || key === "employeeId") {
      val = val.toLowerCase();
    }
    if (key === "email" || key === "staffEmail") {
      val = val.toLowerCase().replace(/\s+/g, "");
    }
    setForm(f => {
      const next = { ...f, [key]: val };
      if (key === "category" && val !== "Others") {
        next.customCategory = "";
      }
      return next;
    });
    setErrors(prev => {
      const nextErrors = { ...prev, [key]: "" };
      if (key === "category" && val !== "Others") {
        nextErrors.customCategory = "";
      }
      if (key === "rollNo") {
        nextErrors.email = "";
      }
      if (key === "employeeId") {
        nextErrors.staffEmail = "";
      }
      return nextErrors;
    });
    if (key === "category") {
      if (val === "Others") {
        setCategoryLoading(true);
        setTimeout(() => setCategoryLoading(false), 300);
      } else {
        setCategoryLoading(false);
      }
    }
  };

  const handleTypeSwitch = (t: "lost" | "found") => {
    setTabLoading(true);
    setItemType(t);
    setForm({
      name: "", location: "", date: getTodayDateString(), collectFrom: "", description: "", category: "", image: "",
      studentName: "", rollNo: "", phone: "", email: "",
      staffName: "", employeeId: "", department: "", staffPhone: "", staffEmail: "",
      customCategory: ""
    });
    setErrors({});
    setTimeout(() => setTabLoading(false), 400);
  };

  const handleContactTypeSwitch = (t: "student" | "staff") => {
    setContactLoading(true);
    setContactType(t);
    setErrors(prev => {
      const copy = { ...prev };
      if (t === "student") {
        delete copy.staffName;
        delete copy.employeeId;
        delete copy.department;
        delete copy.staffPhone;
        delete copy.staffEmail;
      } else {
        delete copy.studentName;
        delete copy.rollNo;
        delete copy.phone;
        delete copy.email;
      }
      return copy;
    });
    setTimeout(() => setContactLoading(false), 400);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    // Validate all fields relevant to current type and contact type
    const newErrors: Record<string, string> = {};

    const nameErr = getFieldError("name", form.name);
    if (nameErr) newErrors.name = nameErr;

    const locationErr = getFieldError("location", form.location);
    if (locationErr) newErrors.location = locationErr;

    const dateErr = getFieldError("date", form.date);
    if (dateErr) newErrors.date = dateErr;

    if (!isLost) {
      const collectErr = getFieldError("collectFrom", form.collectFrom);
      if (collectErr) newErrors.collectFrom = collectErr;
    }

    const descErr = getFieldError("description", form.description);
    if (descErr) newErrors.description = descErr;

    const catErr = getFieldError("category", form.category);
    if (catErr) newErrors.category = catErr;

    if (form.category === "Others") {
      const customCatErr = getFieldError("customCategory", form.customCategory);
      if (customCatErr) newErrors.customCategory = customCatErr;
    }

    if (isStudent) {
      const sNameErr = getFieldError("studentName", form.studentName);
      if (sNameErr) newErrors.studentName = sNameErr;

      const rollErr = getFieldError("rollNo", form.rollNo);
      if (rollErr) newErrors.rollNo = rollErr;

      const phoneErr = getFieldError("phone", form.phone);
      if (phoneErr) newErrors.phone = phoneErr;

      const emailErr = getFieldError("email", form.email);
      if (emailErr) newErrors.email = emailErr;
    } else {
      const stNameErr = getFieldError("staffName", form.staffName);
      if (stNameErr) newErrors.staffName = stNameErr;

      const empIdErr = getFieldError("employeeId", form.employeeId);
      if (empIdErr) newErrors.employeeId = empIdErr;

      const deptErr = getFieldError("department", form.department);
      if (deptErr) newErrors.department = deptErr;

      const stPhoneErr = getFieldError("staffPhone", form.staffPhone);
      if (stPhoneErr) newErrors.staffPhone = stPhoneErr;

      const stEmailErr = getFieldError("staffEmail", form.staffEmail);
      if (stEmailErr) newErrors.staffEmail = stEmailErr;
    }

    setErrors(newErrors);

    const errorKeys = Object.keys(newErrors).filter(k => newErrors[k]);
    if (errorKeys.length > 0) {
      const domOrder = [
        "name",
        "location",
        "date",
        "collectFrom",
        "description",
        "category",
        "customCategory",
        isStudent ? "studentName" : "staffName",
        isStudent ? "rollNo" : "employeeId",
        !isStudent && "department",
        isStudent ? "phone" : "staffPhone",
        isStudent ? "email" : "staffEmail",
      ].filter(Boolean) as string[];

      const firstErrorKey = domOrder.find(k => newErrors[k]);
      if (firstErrorKey) {
        const element = document.getElementById(firstErrorKey);
        if (element) {
          element.focus();
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
      return;
    }

    setSubmitting(true);

    try {
      await reportItem({
        type: itemType,
        name: form.name.trim(),
        description: form.description.trim(),
        category: form.category,
        customCategory: form.category === "Others" ? form.customCategory.trim() : undefined,
        location: form.location.trim(),
        date: form.date,
        collectFrom: isLost ? undefined : form.collectFrom,
        contactType,
        studentName: isStudent ? form.studentName.trim() : undefined,
        rollNo: isStudent ? form.rollNo.trim().toLowerCase() : undefined,
        studentPhone: isStudent ? form.phone.trim() : undefined,
        studentEmail: isStudent ? form.email.trim().toLowerCase() : undefined,
        staffName: !isStudent ? form.staffName.trim() : undefined,
        employeeId: !isStudent ? form.employeeId.trim().toLowerCase() : undefined,
        department: !isStudent ? form.department.trim() : undefined,
        staffPhone: !isStudent ? form.staffPhone.trim() : undefined,
        staffEmail: !isStudent ? form.staffEmail.trim().toLowerCase() : undefined,
      });
      await onItemCreated?.(itemType);
      setSubmitted(true);
    } catch (error: any) {
      if (error.details && Array.isArray(error.details)) {
        const backendErrors: Record<string, string> = {};
        error.details.forEach((det: any) => {
          let fieldKey = det.field;
          if (fieldKey === "studentPhone" || fieldKey === "staffPhone") {
            fieldKey = isStudent ? "phone" : "staffPhone";
          } else if (fieldKey === "studentEmail" || fieldKey === "staffEmail") {
            fieldKey = isStudent ? "email" : "staffEmail";
          } else if (fieldKey === "dateLost") {
            fieldKey = "date";
          }
          backendErrors[fieldKey] = det.message;
        });
        setErrors(backendErrors);

        const domOrder = [
          "name", "location", "date", "collectFrom", "description", "category", "customCategory",
          isStudent ? "studentName" : "staffName",
          isStudent ? "rollNo" : "employeeId",
          !isStudent && "department",
          isStudent ? "phone" : "staffPhone",
          isStudent ? "email" : "staffEmail",
        ].filter(Boolean) as string[];
        const firstErrorKey = domOrder.find(k => backendErrors[k]);
        if (firstErrorKey) {
          const element = document.getElementById(firstErrorKey);
          if (element) {
            element.focus();
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }
      } else {
        toast.error("Unable to report item", {
          description: error instanceof Error ? error.message : "Please check the Render API connection.",
          duration: 4500,
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const contactName = isStudent ? form.studentName : form.staffName;
  const contactEmail = isStudent ? form.email : form.staffEmail;

  if (submitted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-gray-50 p-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-10 max-w-md w-full text-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${isLost ? "bg-amber-100" : "bg-emerald-100"}`}>
            <CheckCircle size={32} style={{ color: accent }} />
          </div>
          <h2 className="text-gray-900 text-xl font-bold mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>
            Item Reported Successfully!
          </h2>
          <p className="text-gray-600 text-sm mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
            <span className="font-semibold text-gray-900">{form.name || "The item"}</span> has been added to the system.
          </p>
          {contactName && (
            <p className="text-gray-600 text-sm mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
              {isLost ? "We'll contact" : "Contact on file:"} <span className="font-semibold text-gray-900">{contactEmail}</span>{isLost ? " if your item is found." : "."}
            </p>
          )}
          {form.collectFrom && (
            <p className="text-gray-600 text-sm mb-6" style={{ fontFamily: "DM Sans, sans-serif" }}>
              {isLost ? "If found, you'll be notified to collect it from" : "Students can bring it to"} <span className="font-semibold text-gray-900">{form.collectFrom}</span>.
            </p>
          )}
          <button
            onClick={onBack}
            className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${btnClass}`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  if (pageLoading) {
    return (
      <div className="flex-1 overflow-y-auto bg-gray-50">
        <div className="max-w-2xl mx-auto px-6 py-8">
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-pulse">
            {/* Form header strip */}
            <div className="px-6 py-5 border-b border-gray-200 space-y-3">
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
              <div className="h-10 bg-gray-200 rounded-xl w-48"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>

            <div className="p-6 space-y-6">
              {/* Item Name */}
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
              </div>

              {/* Location & Date */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
              </div>

              {/* Category */}
              <div className="space-y-2">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
              </div>

              {/* Contact Details */}
              <div className="pt-4 border-t border-gray-200 space-y-4">
                <div className="space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-28"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded-xl w-64"></div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer buttons skeleton */}
            <div className="px-6 pb-6 flex gap-3">
              <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
              <div className="h-10 bg-gray-200 rounded-xl flex-1"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      <form onSubmit={handleSubmit} noValidate className="max-w-2xl mx-auto px-6 py-8">
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
          {/* Form header strip */}
          <div className="px-6 py-5 border-b border-gray-200">
            <p className="text-gray-900 font-semibold text-base mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Report an Item</p>
            {/* Lost / Found toggle */}
            <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1">
              <button
                type="button"
                onClick={() => handleTypeSwitch("lost")}
                disabled={submitting}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isLost ? "bg-amber-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                  } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                <AlertCircle size={14} />
                Lost Item
              </button>
              <button
                type="button"
                onClick={() => handleTypeSwitch("found")}
                disabled={submitting}
                className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${!isLost ? "bg-emerald-500 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                  } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                <CheckCircle size={14} />
                Found Item
              </button>
            </div>
            <p className="text-gray-400 text-[11px] mt-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
              Fill in the details below. All fields marked * are required.
            </p>
          </div>

          <div className="p-6 space-y-5">
            {tabLoading ? (
              <div className="space-y-5 animate-pulse">
                {/* Skeleton for item fields */}
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-28"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                </div>
                {!isLost && (
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                )}
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-24 bg-gray-200 rounded-lg w-full"></div>
                </div>
                <div className="space-y-2">
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                  <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                </div>
              </div>
            ) : (
              <>
                {/* Item Name */}
                <Field label="Item Name" required error={errors.name}>
                  <input
                    id="name"
                    value={form.name}
                    onChange={set("name")}
                    onBlur={() => handleBlur("name")}
                    disabled={submitting}
                    placeholder={isLost ? "e.g. Black Leather Wallet" : "e.g. Blue Nike Backpack"}
                    className={`${inputCls} ${errors.name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  />
                </Field>

                {/* Location + Date row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field label={isLost ? "Last Seen Location" : "Location Found"} required error={errors.location}>
                    <input
                      id="location"
                      value={form.location}
                      onChange={set("location")}
                      onBlur={() => handleBlur("location")}
                      disabled={submitting}
                      placeholder={isLost ? "e.g. Library 2nd Floor" : "e.g. Main Cafeteria"}
                      className={`${inputCls} ${errors.location ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    />
                  </Field>
                  <Field label={isLost ? "Date Lost" : "Date Found"} required error={errors.date}>
                    <input
                      id="date"
                      type="date"
                      value={form.date}
                      min={get30DaysAgoDateString()}
                      max={getTodayDateString()}
                      onChange={set("date")}
                      onBlur={() => handleBlur("date")}
                      disabled={submitting}
                      className={`${inputCls} ${errors.date ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                      style={{ colorScheme: "light", fontFamily: "DM Sans, sans-serif" }}
                    />
                  </Field>
                </div>

                {/* Collect From — only for found items */}
                {!isLost && (
                  <Field label="Where to Receive From" required error={errors.collectFrom}>
                    <select
                      id="collectFrom"
                      value={form.collectFrom}
                      onChange={set("collectFrom")}
                      onBlur={() => handleBlur("collectFrom")}
                      disabled={submitting}
                      className={`${inputCls} appearance-none ${errors.collectFrom ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      <option value="" disabled className="bg-white">Select reception/office</option>
                      {collectFromOptions.map((o) => <option key={o} value={o} className="bg-white">{o}</option>)}
                    </select>
                  </Field>
                )}

                {/* Description */}
                <Field label="Description" required error={errors.description}>
                  <textarea
                    id="description"
                    rows={4}
                    value={form.description}
                    onChange={set("description")}
                    onBlur={() => handleBlur("description")}
                    disabled={submitting}
                    placeholder="Describe the item clearly — colour, size, any distinguishing marks, contents if applicable..."
                    className={`${inputCls} resize-none ${errors.description ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  />
                </Field>

                {/* Category */}
                <Field label="Category" required error={errors.category}>
                  <select
                    id="category"
                    value={form.category}
                    onChange={set("category")}
                    onBlur={() => handleBlur("category")}
                    disabled={submitting}
                    className={`${inputCls} appearance-none ${errors.category ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  >
                    <option value="" disabled className="bg-white">Select a category</option>
                    {categories.map((cat) => (
                      <option key={cat.name} value={cat.name} className="bg-white">
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </Field>

                {/* Specify Category when Others is selected */}
                {form.category === "Others" && (
                  categoryLoading ? (
                    <div className="space-y-2 animate-pulse">
                      <div className="h-3 bg-gray-200 rounded w-28"></div>
                      <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                    </div>
                  ) : (
                    <Field label="Specify Category" required error={errors.customCategory}>
                      <input
                        id="customCategory"
                        value={form.customCategory || ""}
                        onChange={set("customCategory")}
                        onBlur={() => handleBlur("customCategory")}
                        disabled={submitting}
                        placeholder="Enter custom category"
                        className={`${inputCls} ${errors.customCategory ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                  )
                )}
              </>
            )}

            {/* ── Contact Type Switcher ─────────────────────── */}
            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <p className="text-gray-900 font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Contact Details
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    {isLost ? "To contact if item is found" : "Reporter contact information"}
                  </p>
                </div>
              </div>

              {/* Tab switcher */}
              <div className="inline-flex rounded-xl border border-gray-200 bg-gray-50 p-1 mt-3">
                <button
                  type="button"
                  onClick={() => handleContactTypeSwitch("student")}
                  disabled={submitting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${isStudent ? "bg-cyan-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
                  Student Contact Details
                </button>
                <button
                  type="button"
                  onClick={() => handleContactTypeSwitch("staff")}
                  disabled={submitting}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-medium transition-all duration-200 ${!isStudent ? "bg-cyan-600 text-white shadow-sm" : "text-gray-500 hover:text-gray-700"
                    } ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2" /><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" /></svg>
                  Staff Contact Details
                </button>
              </div>
            </div>

            {contactLoading ? (
              <div className="space-y-4 animate-pulse pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-20"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                  <div className="space-y-2">
                    <div className="h-3 bg-gray-200 rounded w-24"></div>
                    <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                {/* Student Contact Fields */}
                <div
                  style={{
                    display: isStudent ? "block" : "none",
                    transition: "opacity 0.2s ease",
                    opacity: isStudent ? 1 : 0,
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Student Name" required={isStudent} error={errors.studentName}>
                      <input
                        id="studentName"
                        value={form.studentName}
                        onChange={set("studentName")}
                        onBlur={() => handleBlur("studentName")}
                        disabled={submitting}
                        placeholder="Enter full name"
                        className={`${inputCls} ${errors.studentName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                    <Field label="Roll Number" required={isStudent} error={errors.rollNo}>
                      <input
                        id="rollNo"
                        value={form.rollNo}
                        onChange={set("rollNo")}
                        onBlur={() => handleBlur("rollNo")}
                        disabled={submitting}
                        placeholder="eg. 25MCAIOT21"
                        className={`${inputCls} ${errors.rollNo ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <Field label="Phone Number" required={isStudent} error={errors.phone}>
                      <input
                        id="phone"
                        type="tel"
                        value={form.phone}
                        onChange={set("phone")}
                        onBlur={() => handleBlur("phone")}
                        disabled={submitting}
                        placeholder="eg. +91 "
                        className={`${inputCls} ${errors.phone ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                    <Field label="Email Address" required={isStudent} error={errors.email}>
                      <input
                        id="email"
                        type="email"
                        value={form.email}
                        onChange={set("email")}
                        onBlur={() => handleBlur("email")}
                        disabled={submitting}
                        placeholder="college email address"
                        className={`${inputCls} ${errors.email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                  </div>
                </div>

                {/* Staff Contact Fields */}
                <div
                  style={{
                    display: !isStudent ? "block" : "none",
                    transition: "opacity 0.2s ease",
                    opacity: !isStudent ? 1 : 0,
                  }}
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Field label="Staff Name" required={!isStudent} error={errors.staffName}>
                      <input
                        id="staffName"
                        value={form.staffName}
                        onChange={set("staffName")}
                        onBlur={() => handleBlur("staffName")}
                        disabled={submitting}
                        placeholder="Enter full name"
                        className={`${inputCls} ${errors.staffName ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                    <Field label="Staff ID" required={!isStudent} error={errors.employeeId}>
                      <input
                        id="employeeId"
                        value={form.employeeId}
                        onChange={set("employeeId")}
                        onBlur={() => handleBlur("employeeId")}
                        disabled={submitting}
                        placeholder="e.g. 23CS2067"
                        className={`${inputCls} ${errors.employeeId ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                  </div>
                  <div className="mt-4">
                    <Field label="Department" required={!isStudent} error={errors.department}>
                      <input
                        id="department"
                        value={form.department}
                        onChange={set("department")}
                        onBlur={() => handleBlur("department")}
                        disabled={submitting}
                        placeholder="e.g. Computer Science, Commerce, Library…,Admin"
                        className={`${inputCls} ${errors.department ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                    <Field label="Phone Number" required={!isStudent} error={errors.staffPhone}>
                      <input
                        id="staffPhone"
                        type="tel"
                        value={form.staffPhone}
                        onChange={set("staffPhone")}
                        onBlur={() => handleBlur("staffPhone")}
                        disabled={submitting}
                        placeholder="eg. +91"
                        className={`${inputCls} ${errors.staffPhone ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                    <Field label="Email Address" required={!isStudent} error={errors.staffEmail}>
                      <input
                        id="staffEmail"
                        type="email"
                        value={form.staffEmail}
                        onChange={set("staffEmail")}
                        onBlur={() => handleBlur("staffEmail")}
                        disabled={submitting}
                        placeholder="college email address"
                        className={`${inputCls} ${errors.staffEmail ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : ""}`}
                        style={{ fontFamily: "DM Sans, sans-serif" }}
                      />
                    </Field>
                  </div>
                </div>
              </>
            )}

          </div>

          {/* Footer buttons */}
          <div className="px-6 pb-6 flex gap-3">
            <button
              type="button"
              onClick={onBack}
              disabled={submitting}
              className={`flex-1 py-2.5 rounded-xl border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm font-medium transition-all ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 py-2.5 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${btnClass} ${submitting ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {submitting ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <Upload size={14} />
              )}
              {submitting ? "Reporting..." : `Report ${isLost ? "Lost" : "Found"} Item`}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

// ─── Public Browse View ────────────────────────────────────────────────────

function PublicBrowseView({ type, onBack }: { type: "lost" | "found"; onBack: () => void }) {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors text-sm"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            <ArrowLeft size={18} />
            Back to Home
          </button>
          <div className="flex items-center gap-3">
            <img src={campusLogo} alt="Campus Logo" className="w-8 h-8 object-contain" />
            <p className="text-gray-900 font-semibold text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>Campus Lost and Found</p>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-6 py-8">
        <CombinedItemsPage initialFilter="found" />
      </div>
      <ScrollToTopButton />
    </div>
  );
}

// ─── Student View ──────────────────────────────────────────────────────────

// Student view helper components removed because they were not used by the active app view.

const BROWSE_PAGE_SIZE = 6;

function CombinedItemsPage({ initialFilter = "all" }: { initialFilter?: "all" | "lost" | "found" }) {
  const [searchInput, setSearchInput] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [searchError, setSearchError] = useState<string | null>(null);

  const [locationInput, setLocationInput] = useState("");
  const [debouncedLocation, setDebouncedLocation] = useState("");
  const [locationError, setLocationError] = useState<string | null>(null);

  const [selectedCategory, setSelectedCategory] = useState("");
  const [isCategoryFocused, setIsCategoryFocused] = useState(false);
  const [isStatusFocused, setIsStatusFocused] = useState(false);
  const [countdownFilter, setCountdownFilter] = useState("");
  const [dateFromInput, setDateFromInput] = useState(getTodayDateString());
  const [dateFromQuery, setDateFromQuery] = useState(getTodayDateString());
  const [dateTo, setDateTo] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [backendItems, setBackendItems] = useState<BrowseItem[]>([]);
  const [loadingItems, setLoadingItems] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Debounce and validate Search input
  useEffect(() => {
    const trimmed = searchInput.trim();
    if (trimmed.length === 0) {
      setSearchError(null);
      const handler = setTimeout(() => {
        setDebouncedSearch("");
      }, 400);
      return () => clearTimeout(handler);
    }

    if (trimmed.length < 3) {
      setSearchError("Please enter at least 3 characters to search.");
      const handler = setTimeout(() => {
        setDebouncedSearch("");
      }, 400);
      return () => clearTimeout(handler);
    }

    setSearchError(null);
    const handler = setTimeout(() => {
      setDebouncedSearch(trimmed);
    }, 400);

    return () => clearTimeout(handler);
  }, [searchInput]);

  // Debounce and validate Location input
  useEffect(() => {
    const trimmed = locationInput.trim();
    if (trimmed.length === 0) {
      setLocationError(null);
      const handler = setTimeout(() => {
        setDebouncedLocation("");
      }, 400);
      return () => clearTimeout(handler);
    }

    if (trimmed.length < 3) {
      setLocationError("Please enter at least 3 characters to search.");
      const handler = setTimeout(() => {
        setDebouncedLocation("");
      }, 400);
      return () => clearTimeout(handler);
    }

    setLocationError(null);
    const handler = setTimeout(() => {
      setDebouncedLocation(trimmed);
    }, 400);

    return () => clearTimeout(handler);
  }, [locationInput]);

  useEffect(() => {
    const fetchItems = async () => {
      setLoadingItems(true);
      setFetchError(null);

      try {
        const items = await getBrowseItems(initialFilter, {
          search: debouncedSearch || undefined,
          category: selectedCategory || undefined,
          location: debouncedLocation || undefined,
          dateFrom: dateFromQuery || undefined,
          dateTo: dateTo || undefined,
        });

        setBackendItems(items);
      } catch (error: unknown) {
        setFetchError(error instanceof Error ? error.message : "Unable to load items from the database.");
      } finally {
        setLoadingItems(false);
      }
    };

    fetchItems();
  }, [initialFilter, debouncedSearch, selectedCategory, debouncedLocation, dateFromQuery, dateTo]);

  const filteredItems = useMemo(() => {
    return backendItems.filter((item) => {
      const matchesCountdown = !countdownFilter || getDaysInfo(item.reportedAt || item.date).countdownStatus === countdownFilter;
      return matchesCountdown;
    });
  }, [backendItems, countdownFilter]);

  const totalPages = useMemo(() => Math.max(1, Math.ceil(filteredItems.length / BROWSE_PAGE_SIZE)), [filteredItems.length]);
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = useMemo(
    () => filteredItems.slice((safePage - 1) * BROWSE_PAGE_SIZE, safePage * BROWSE_PAGE_SIZE),
    [filteredItems, safePage]
  );

  const applyCategory = (v: string) => { setSelectedCategory(v); setCurrentPage(1); };
  const applyCountdown = (v: string) => { setCountdownFilter(v); setCurrentPage(1); };

  const pageNumbers = useMemo(() => Array.from({ length: totalPages }, (_, i) => i + 1), [totalPages]);

  const pageTitle = initialFilter === "lost" ? "Campus Lost Items" : "Campus Found Items";
  const pageDescription = initialFilter === "lost"
    ? "Browse all lost items reported across campus."
    : "Browse all found items available for collection across campus.";

  return (
    <div className="space-y-6">

      {/* ── Page Header ─────────────────────────────────────── */}
      <div>
        <h1
          className="text-2xl text-gray-900"
          style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700, letterSpacing: "-0.02em" }}
        >
          {pageTitle}
        </h1>
        <p className="text-gray-500 text-sm mt-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
          {pageDescription}
        </p>
      </div>

      {fetchError && (
        <div className="rounded-2xl border border-[#FECACA] bg-red-50 p-4 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* ── Search & Filter Bar ─────────────────────────────── */}
      <div className="bg-white border border-[#E5E7EB] rounded-2xl shadow-sm p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative md:col-span-1">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item name or description…"
              value={searchInput}
              onChange={e => { setSearchInput(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/15 transition-all"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            />
            {searchError && (
              <p className="absolute left-0 top-full mt-1 text-xs text-red-500 z-10" style={{ fontFamily: "DM Sans, sans-serif" }}>
                {searchError}
              </p>
            )}
          </div>
          {/* Location */}
          <div className="relative">
            <MapPin size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by location…"
              value={locationInput}
              onChange={e => { setLocationInput(e.target.value); setCurrentPage(1); }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/15 transition-all"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            />
            {locationError && (
              <p className="absolute left-0 top-full mt-1 text-xs text-red-500 z-10" style={{ fontFamily: "DM Sans, sans-serif" }}>
                {locationError}
              </p>
            )}
          </div>
          {/* Category */}
          <div className="relative">
            <select
              value={selectedCategory}
              onChange={e => applyCategory(e.target.value)}
              onFocus={() => setIsCategoryFocused(true)}
              onBlur={() => setIsCategoryFocused(false)}
              className="w-full pl-4 pr-10 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/15 transition-all appearance-none cursor-pointer"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat.name} value={cat.name}>{cat.name}</option>
              ))}
            </select>
            <ChevronDown
              size={15}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform duration-200 ${isCategoryFocused ? "rotate-180 text-[#0891B2]" : ""}`}
            />
          </div>
          {/* Claim status */}
          <div className="relative">
            <select
              value={countdownFilter}
              onChange={e => applyCountdown(e.target.value)}
              onFocus={() => setIsStatusFocused(true)}
              onBlur={() => setIsStatusFocused(false)}
              className="w-full pl-4 pr-10 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/15 transition-all appearance-none cursor-pointer"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              <option value="">All Claim Status</option>
              <option value="active">🟢 Active (31–60 days)</option>
              <option value="expiring">🟡 Expiring Soon (11–30 days)</option>
              <option value="last10">🔴 Last 10 Days</option>
            </select>
            <ChevronDown
              size={15}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400 transition-transform duration-200 ${isStatusFocused ? "rotate-180 text-[#0891B2]" : ""}`}
            />
          </div>
          {/* Date From */}
          <div className="relative">
            <Calendar size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            <input
              type="date"
              value={dateFromInput}
              max={getTodayDateString()}
              onChange={e => {
                const val = e.target.value;
                setDateFromInput(val);
                if (!val) {
                  setDateFromQuery("");
                  setCurrentPage(1);
                } else if (val.length === 10 && !isNaN(new Date(val).getTime())) {
                  if (val > getTodayDateString()) {
                    toast.error("Invalid Date", {
                      description: "Future dates are not allowed.",
                      duration: 3500,
                    });
                    return;
                  }
                  setDateFromQuery(val);
                  setCurrentPage(1);
                }
              }}
              className="w-full pl-10 pr-4 py-2.5 bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-sm text-gray-700 focus:outline-none focus:border-[#0891B2] focus:ring-2 focus:ring-[#0891B2]/15 transition-all"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            />
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between">
          <p className="text-xs text-gray-400" style={{ fontFamily: "DM Sans, sans-serif" }}>
            <span className="font-semibold text-gray-600">{filteredItems.length}</span> item{filteredItems.length !== 1 ? "s" : ""} found
          </p>
          {(searchInput || selectedCategory || countdownFilter || locationInput || dateFromQuery || dateTo) && (
            <button
              onClick={() => {
                setSearchInput("");
                setSelectedCategory("");
                setCountdownFilter("");
                setLocationInput("");
                setDateFromInput("");
                setDateFromQuery("");
                setDateTo("");
                setCurrentPage(1);
              }}
              className="text-xs text-[#0891B2] hover:underline font-medium"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Clear all filters
            </button>
          )}
        </div>
      </div>

      {/* ── Cards Grid & Skeleton Loading ───────────────────── */}
      {loadingItems ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 animate-pulse">
          {Array.from({ length: BROWSE_PAGE_SIZE }).map((_, idx) => (
            <div
              key={`skeleton-${idx}`}
              className="bg-white border border-[#E5E7EB] rounded-2xl p-4 space-y-4"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-3/4"></div>
                <div className="h-3 bg-gray-100 rounded w-1/4"></div>
              </div>
              <div className="space-y-1.5">
                <div className="h-3 bg-gray-200 rounded w-full"></div>
                <div className="h-3 bg-gray-200 rounded w-5/6"></div>
              </div>
              <div className="space-y-2 pt-3 border-t border-[#E5E7EB]">
                <div className="h-3 bg-gray-100 rounded w-1/2"></div>
                <div className="h-3 bg-gray-100 rounded w-1/3"></div>
                <div className="h-3 bg-gray-100 rounded w-2/3"></div>
              </div>
              <div className="h-2 bg-gray-200 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : pageItems.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 bg-white border border-[#E5E7EB] rounded-2xl">
          <FolderOpen size={40} className="text-gray-200 mb-3" />
          <p className="text-gray-500 text-sm font-medium" style={{ fontFamily: "DM Sans, sans-serif" }}>No items match your search</p>
          <p className="text-gray-400 text-xs mt-1" style={{ fontFamily: "DM Sans, sans-serif" }}>Try adjusting your filters or search term</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {pageItems.map(item => (
            <div
              key={`found-${item.id}`}
              className="group bg-white border border-[#E5E7EB] rounded-2xl overflow-hidden cursor-pointer transition-all duration-250 hover:shadow-xl hover:-translate-y-1.5 hover:border-transparent"
              style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.06)" }}
            >
              {/* Card body */}
              <div className={`p-4 ${getDaysInfo(item.reportedAt || item.date).isExpired ? "opacity-70" : ""}`}>
                <div className="mb-2">
                  <CardNameTooltip
                    name={item.name}
                    className="text-gray-900 text-sm leading-snug"
                    style={{ fontFamily: "Outfit, sans-serif", fontWeight: 700 }}
                  />
                  <p className="text-[10px] text-gray-400 mt-0.5 font-mono tracking-wide">{item.itemId}</p>
                </div>

                <p className="text-gray-500 text-[11px] leading-relaxed line-clamp-2 mb-3" style={{ fontFamily: "DM Sans, sans-serif" }}>
                  {item.description}
                </p>

                {/* Meta rows */}
                <div className="space-y-1.5 pt-3 border-t border-[#E5E7EB]">
                  <div className="flex items-center gap-2">
                    <MapPin size={11} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-600 truncate" style={{ fontFamily: "DM Sans, sans-serif" }}>{item.location}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar size={11} className="text-gray-400 shrink-0" />
                    <span className="text-[11px] text-gray-600" style={{ fontFamily: "DM Sans, sans-serif" }}>{item.date}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Building2 size={11} className="shrink-0 text-emerald-500" />
                    <span className="text-[11px] font-semibold truncate text-emerald-600" style={{ fontFamily: "DM Sans, sans-serif" }}>
                      {item.collectFrom}
                    </span>
                  </div>
                </div>

                {/* 60-day countdown */}
                <ClaimCountdownBar dateStr={item.reportedAt || item.date} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Pagination ──────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-[#E5E7EB]">
        <p className="text-xs text-gray-400 order-2 sm:order-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
          Showing{" "}
          <span className="font-semibold text-gray-700">
            {filteredItems.length === 0 ? 0 : (safePage - 1) * BROWSE_PAGE_SIZE + 1}
          </span>
          {" – "}
          <span className="font-semibold text-gray-700">{Math.min(safePage * BROWSE_PAGE_SIZE, filteredItems.length)}</span>
          {" of "}
          <span className="font-semibold text-gray-700">{filteredItems.length}</span> items
        </p>

        <div className="flex items-center gap-1.5 order-1 sm:order-2">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={safePage === 1}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-gray-600 hover:bg-[#0891B2] hover:text-white hover:border-[#0891B2] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            ← Previous
          </button>

          {pageNumbers.map(n => (
            <button
              key={n}
              onClick={() => setCurrentPage(n)}
              className={`w-9 h-9 rounded-xl border text-xs font-bold transition-all duration-150 shadow-sm ${safePage === n
                ? "bg-[#0891B2] border-[#0891B2] text-white shadow-md"
                : "border-[#E5E7EB] bg-white text-gray-600 hover:bg-[#0891B2] hover:text-white hover:border-[#0891B2]"
                }`}
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {n}
            </button>
          ))}

          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={safePage === totalPages}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-[#E5E7EB] bg-white text-xs font-semibold text-gray-600 hover:bg-[#0891B2] hover:text-white hover:border-[#0891B2] disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Next →
          </button>
        </div>
      </div>

    </div>
  );
}

// StudentView was removed because it was not referenced by the current application routes.

// ─── Logout Confirm Modal ──────────────────────────────────────────────────

function LogoutModal({ onConfirm, onClose, loading }: { onConfirm: () => void; onClose: () => void; loading?: boolean }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, loading]);

  return (
    <div
      onClick={loading ? undefined : onClose}
      style={{
        transition: "background 0.25s, backdrop-filter 0.25s",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
        background: visible ? "rgba(15,23,42,0.55)" : "rgba(15,23,42,0)",
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: "opacity 0.25s, transform 0.25s",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.93)",
        }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-7 flex flex-col items-center text-center"
      >
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center mb-4">
          <AlertTriangle size={26} className="text-red-500" />
        </div>

        {/* Title */}
        <h2
          className="text-gray-900 mb-2"
          style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.1rem", fontWeight: 700 }}
        >
          Confirm Logout
        </h2>

        {/* Message */}
        <p
          className="text-gray-500 text-sm leading-relaxed mb-7"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Are you sure you want to logout from <span className="font-semibold text-gray-700">KJU Lost and Found</span>?
        </p>

        {/* Buttons */}
        <div className="flex gap-3 w-full">
          <button
            onClick={onClose}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-gray-700 text-sm font-medium hover:bg-gray-100 hover:border-gray-300 transition-all duration-150 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`flex-1 py-2.5 rounded-xl bg-red-700 text-white text-sm font-semibold hover:bg-red-800 active:bg-red-900 transition-all duration-150 shadow-sm flex items-center justify-center gap-1.5 ${loading ? "opacity-50 cursor-not-allowed" : ""}`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {loading && <Loader2 size={14} className="animate-spin" />}
            Logout
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Delete Confirm Modal ──────────────────────────────────────────────────

function DeleteConfirmModal({
  onConfirm, onClose, itemName, itemId, itemType, loading,
}: {
  onConfirm: () => void;
  onClose: () => void;
  itemName: string;
  itemId: string;
  itemType: string;
  loading?: boolean;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("keydown", onKey);
    };
  }, [onClose, loading]);

  const typeColor = itemType === "Lost Item"
    ? { bg: "bg-amber-50", border: "border-amber-200", badge: "bg-amber-100 text-amber-700" }
    : itemType === "Found Item"
      ? { bg: "bg-emerald-50", border: "border-emerald-200", badge: "bg-emerald-100 text-emerald-700" }
      : { bg: "bg-blue-50", border: "border-blue-200", badge: "bg-blue-100 text-blue-700" };

  return (
    <div
      onClick={() => { if (!loading) onClose(); }}
      style={{
        transition: "background 0.25s, backdrop-filter 0.25s",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
        background: visible ? "rgba(15,23,42,0.55)" : "rgba(15,23,42,0)",
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          transition: "opacity 0.25s, transform 0.25s",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.93)",
          borderRadius: 20,
        }}
        className="bg-white shadow-2xl w-full max-w-sm overflow-hidden"
      >
        {/* Red top bar */}
        <div className="bg-red-500 px-6 pt-7 pb-5 flex flex-col items-center text-center">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center mb-3">
            <Trash2 size={22} className="text-white" />
          </div>
          <h2 className="text-white" style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.15rem", fontWeight: 700 }}>
            Delete Item
          </h2>
        </div>

        {/* Body */}
        <div className="px-6 pt-5 pb-6 flex flex-col items-center text-center">
          <p className="text-gray-700 text-sm leading-relaxed mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Are you sure you want to delete
          </p>
          <p className="text-gray-900 font-semibold text-sm mb-4" style={{ fontFamily: "DM Sans, sans-serif" }}>
            "{itemName}"?
          </p>

          {/* Item details card */}
          <div className={`w-full ${typeColor.bg} border ${typeColor.border} rounded-xl p-4 mb-4 text-left`}>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>
              Item Details
            </p>
            <p className="text-gray-900 font-semibold text-sm mb-1" style={{ fontFamily: "DM Sans, sans-serif" }}>
              {itemName}
            </p>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-gray-500 text-xs" style={{ fontFamily: "DM Sans, sans-serif" }}>ID: {itemId}</span>
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${typeColor.badge}`}>
                {itemType}
              </span>
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-center gap-1.5 mb-6">
            <AlertCircle size={13} className="text-red-400 shrink-0" />
            <p className="text-red-400 text-xs font-medium" style={{ fontFamily: "DM Sans, sans-serif" }}>
              This action cannot be undone.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 w-full">
            <button
              onClick={onClose}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl border border-gray-200 bg-white text-gray-700 text-sm font-medium hover:bg-gray-50 hover:border-gray-300 transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              className="flex-1 py-2.5 rounded-xl text-white text-sm font-semibold transition-all duration-150 shadow-sm flex items-center justify-center gap-2"
              style={{ background: loading ? "#FDA4AF" : "#EF4444", cursor: loading ? "not-allowed" : "pointer", fontFamily: "DM Sans, sans-serif" }}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = "#DC2626"; }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = "#EF4444"; }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Trash2 size={14} />
              )}
              {loading ? "Deleting..." : "Delete"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Return Confirm Modal ───────────────────────────────────────────────────

function ReturnConfirmModal({
  itemName, itemId, itemType, onConfirm, onClose, loading,
}: {
  itemName: string;
  itemId: string;
  itemType: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape" && !loading) onClose(); };
    document.addEventListener("keydown", onKey);
    return () => { cancelAnimationFrame(raf); document.removeEventListener("keydown", onKey); };
  }, [onClose, loading]);

  return (
    <div
      onClick={() => { if (!loading) onClose(); }}
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem",
        backdropFilter: visible ? "blur(4px)" : "blur(0px)",
        background: visible ? "rgba(15,23,42,0.55)" : "rgba(15,23,42,0)",
        transition: "background 0.25s, backdrop-filter 0.25s",
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: "white", borderRadius: 20,
          boxShadow: "0 25px 60px #00000030, 0 8px 20px #0000001a",
          width: "100%", maxWidth: 420, overflow: "hidden",
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1)" : "scale(0.93)",
          transition: "opacity 0.25s, transform 0.25s",
        }}
      >
        {/* Green header */}
        <div style={{ background: "linear-gradient(135deg,#16a34a,#15803d)", padding: "24px 24px 20px", textAlign: "center" }}>
          <div style={{ width: 48, height: 48, borderRadius: "50%", background: "rgba(255,255,255,0.2)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
            <CheckCircle size={24} style={{ color: "white" }} />
          </div>
          <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1.1rem", fontWeight: 700, color: "white", margin: 0 }}>
            Confirm Item Return
          </h2>
        </div>

        {/* Body */}
        <div style={{ padding: "20px 24px 24px", display: "flex", flexDirection: "column", gap: 16 }}>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "#374151", textAlign: "center", margin: 0 }}>
            Are you sure this item has been successfully returned to its owner?
          </p>

          {/* Item details */}
          <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12, padding: "14px 16px" }}>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 10, fontWeight: 700, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10 }}>
              Item Details
            </p>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 6 }}>{itemName}</p>
            <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#6b7280" }}>ID: {itemId}</span>
              <span style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, fontFamily: "DM Sans, sans-serif" }}>
                <span style={{ background: "#fef3c7", color: "#d97706", padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Not Returned</span>
                <span style={{ color: "#9ca3af" }}>→</span>
                <span style={{ background: "#dcfce7", color: "#16a34a", padding: "1px 8px", borderRadius: 20, fontSize: 11, fontWeight: 600 }}>Returned</span>
              </span>
            </div>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: "#6b7280", marginTop: 6 }}>Type: {itemType}</p>
          </div>

          {/* Warning */}
          <div style={{ display: "flex", alignItems: "flex-start", gap: 8, background: "#fffbeb", border: "1px solid #fde68a", borderRadius: 10, padding: "10px 14px" }}>
            <AlertTriangle size={14} style={{ color: "#d97706", marginTop: 1, flexShrink: 0 }} />
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#92400e", margin: 0 }}>
              Once marked as <strong>Returned</strong>, this action cannot be reversed. The status will be permanently locked.
            </p>
          </div>

          {/* Buttons */}
          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              disabled={loading}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: "1px solid #d1d5db",
                background: "white", color: "#374151", fontSize: 14, fontWeight: 500, fontFamily: "DM Sans, sans-serif",
                cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.5 : 1
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "white"; }}
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              disabled={loading}
              style={{
                flex: 1, padding: "10px 0", borderRadius: 10, border: "none",
                background: loading ? "#86efac" : "#22c55e",
                color: "white", fontSize: 14, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6
              }}
              onMouseEnter={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#16a34a"; }}
              onMouseLeave={e => { if (!loading) (e.currentTarget as HTMLButtonElement).style.background = "#22c55e"; }}
            >
              {loading ? (
                <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <CheckCircle size={14} />
              )}
              {loading ? "Returning..." : "Confirm Return"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Item History Page ─────────────────────────────────────────────────────

// ─── Synonym map for intelligent History Page search ─────────────────
const HISTORY_ITEM_SYNONYMS: Record<string, string[]> = {
  bag: ["backpack", "sack", "pouch", "tote", "knapsack", "haversack", "bagpack", "school bag", "travel bag", "handbag", "satchel", "kit bag", "gym bag", "skybag", "laptop bag", "duffle", "duffel", "leather bag"],
  backpack: ["bag", "school bag", "travel bag", "knapsack", "haversack", "bagpack", "rucksack", "skybag", "campus bag"],
  phone: ["mobile", "cell", "smartphone", "handphone", "iphone", "android", "cellphone", "handset"],
  mobile: ["phone", "cell", "smartphone", "handphone", "iphone", "android", "cellphone"],
  wallet: ["purse", "billfold", "card holder", "money clip"],
  bottle: ["water bottle", "flask", "tumbler", "sipper", "thermos", "canteen"],
  "water bottle": ["bottle", "flask", "tumbler", "sipper"],
  glasses: ["spectacles", "specs", "eyeglasses", "sunglasses", "shades", "goggles", "reading glasses", "frames"],
  spectacles: ["glasses", "specs", "eyeglasses", "frames"],
  keys: ["key", "keychain", "key ring", "keyring", "locket", "lanyard key"],
  key: ["keys", "keychain", "key ring", "keyring"],
  charger: ["adapter", "cable", "power adapter", "charging cable", "plug"],
  earphones: ["earbuds", "headphones", "headset", "airpods", "earpiece", "in-ear", "buds"],
  headphones: ["earphones", "earbuds", "headset", "over-ear"],
  umbrella: ["raincoat", "rain cover"],
  book: ["notebook", "textbook", "notes", "journal", "diary", "workbook"],
  notebook: ["book", "notes", "journal", "copy", "notepad"],
  pen: ["pencil", "marker", "ballpoint", "ink pen", "sketch pen", "highlighter"],
  pencil: ["pen", "eraser", "sketch"],
  calculator: ["calc", "scientific calculator"],
  laptop: ["computer", "pc", "macbook", "notebook computer", "chromebook"],
  watch: ["wristwatch", "timepiece", "clock", "smartwatch"],
  id: ["id card", "identity card", "student id", "college id", "college card", "access card", "pass"],
  "id card": ["identity card", "student id", "college card", "access card", "id"],
  earring: ["earrings", "stud", "hoop", "jewelry"],
  necklace: ["chain", "pendant", "locket", "jewelry"],
  ring: ["band", "finger ring", "jewelry"],
  bracelet: ["bangle", "wristband", "jewelry"],
};

function getHistorySynonymTerms(word: string): string[] {
  const lower = word.toLowerCase();
  const synonyms = HISTORY_ITEM_SYNONYMS[lower] || [];
  const reverseMatches = Object.entries(HISTORY_ITEM_SYNONYMS)
    .filter(([, syns]) => syns.some(s => s.toLowerCase() === lower))
    .map(([key]) => key);
  return [lower, ...synonyms.map(s => s.toLowerCase()), ...reverseMatches];
}

function matchesHistorySearch(name: string, location: string, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const nameLower = name.toLowerCase();
  const locLower = location.toLowerCase();

  // 1. Exact match
  if (nameLower === q || locLower === q) return true;

  // 2. Partial match
  if (nameLower.includes(q) || locLower.includes(q)) return true;

  // 3. Keyword matching: split query into words. Each word must be present in either name or location (or match synonym for name)
  const queryWords = q.split(/\s+/).filter(Boolean);
  if (queryWords.length === 0) return true;

  return queryWords.every(word => {
    if (nameLower.includes(word) || locLower.includes(word)) return true;
    const terms = getHistorySynonymTerms(word);
    return terms.some(term => nameLower.includes(term) || locLower.includes(term));
  });
}

function parseHistoryDateToMs(dt: string | undefined | null): number {
  if (!dt) return 0;
  const parsed = Date.parse(dt);
  if (!Number.isNaN(parsed)) return parsed;

  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const parts = dt.split(", ");
  const datePart = parts[0];
  const timePart = parts[1];
  
  if (!datePart) return 0;
  
  const dateTokens = datePart.split(" ").filter(Boolean);
  if (dateTokens.length < 3) return 0;
  
  const day = Number(dateTokens[0]);
  const monthStr = dateTokens[1];
  const year = Number(dateTokens[2]);
  
  const month = months[monthStr] !== undefined ? months[monthStr] : 0;
  
  let hours = 0;
  let minutes = 0;
  
  if (timePart) {
    const timeTokens = timePart.split(" ").filter(Boolean);
    if (timeTokens[0]) {
      const hm = timeTokens[0].split(":").map(Number);
      hours = hm[0] || 0;
      minutes = hm[1] || 0;
    }
    const ampm = timeTokens[1];
    if (ampm === "PM" && hours !== 12) hours += 12;
    if (ampm === "AM" && hours === 12) hours = 0;
  }
  
  return new Date(year, month, day, hours, minutes).getTime();
}

function ItemHistoryPage({
  foundAdminRecords,
  lostAdminRecords,
  disposedHistory,
  returnedHistory,
  isLoading,
  isLoggingOut,
}: {
  foundAdminRecords: AdminFoundItem[];
  lostAdminRecords: AdminLostItem[];
  disposedHistory: DisposedRecord[];
  returnedHistory: ReturnedHistoryRecord[];
  isLoading?: boolean;
  isLoggingOut?: boolean;
}) {
  const [activeTab, setActiveTab] = useState<"returned" | "lost-not-found" | "disposed">("returned");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [dateError, setDateError] = useState<string | null>(null);

  // Dedicated stable statistics state:
  const [statistics, setStatistics] = useState<{
    totalReturned: number;
    lostNotFound: number;
    disposedItems: number;
    foundReturned: number;
  } | null>(null);
  const [isStatsLoading, setIsStatsLoading] = useState(true);

  // Local state for dynamically loaded history data:
  const [localReturnedLostRecords, setLocalReturnedLostRecords] = useState<AdminLostItem[]>([]);
  const [localReturnedFoundRecords, setLocalReturnedFoundRecords] = useState<AdminFoundItem[]>([]);
  const [localNotReturnedLostRecords, setLocalNotReturnedLostRecords] = useState<AdminLostItem[]>([]);
  const [localDisposedHistory, setLocalDisposedHistory] = useState<DisposedRecord[]>([]);
  const [localReturnedHistory, setLocalReturnedHistory] = useState<ReturnedHistoryRecord[]>([]);
  const [isApiLoading, setIsApiLoading] = useState(false);

  // Debounced filters & Local filtering loading state:
  const [isFiltering, setIsFiltering] = useState(false);
  const [activeSearch, setActiveSearch] = useState("");
  const [debouncedDateTo, setDebouncedDateTo] = useState("");
  const [debouncedFilterType, setDebouncedFilterType] = useState("");
  const [searchHint, setSearchHint] = useState<string | null>(null);

  const prevSearchRef = useRef("");

  useEffect(() => {
    let active = true;
    const loadData = async () => {
      if (isLoggingOut) return;
      setIsStatsLoading(true);
      setIsApiLoading(true);
      try {
        const [returnedLost, returnedFound, notReturnedLost, history] = await Promise.all([
          getAdminLostItems("Returned"),
          getAdminFoundItems("Returned"),
          getAdminLostItems("Not Returned"),
          getHistory(),
        ]);
        if (active) {
          setLocalReturnedLostRecords(returnedLost);
          setLocalReturnedFoundRecords(returnedFound);
          setLocalNotReturnedLostRecords(notReturnedLost);
          setLocalReturnedHistory(history.returned);
          setLocalDisposedHistory(history.disposed);

          // Compute statistics
          const totalReturned = history.returned.length + returnedLost.length + returnedFound.length;
          const lostNotFound = notReturnedLost.filter(i => getDaysInfo(i.reportedAt).isExpired).length;
          const disposedItems = history.disposed.length;
          const foundReturned = returnedFound.length + history.returned.filter(r => r.type === "Found").length;

          setStatistics({
            totalReturned,
            lostNotFound,
            disposedItems,
            foundReturned,
          });
        }
      } catch (error) {
        console.error("Failed to load history initial data", error);
      } finally {
        if (active) {
          setIsApiLoading(false);
          setIsStatsLoading(false);
        }
      }
    };
    loadData();
    return () => {
      active = false;
    };
  }, [isLoggingOut]);

  // Debounce search input — only activate at >=3 characters or when empty
  useEffect(() => {
    setIsFiltering(true);
    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) {
      setSearchHint(null);
      const t = setTimeout(() => {
        if (prevSearchRef.current !== "") {
          prevSearchRef.current = "";
          setActiveSearch("");
        }
        setIsFiltering(false);
      }, 400);
      return () => clearTimeout(t);
    }
    if (trimmed.length < 3) {
      setSearchHint("Enter at least 3 characters to search.");
      setIsFiltering(false);
      return;
    }
    setSearchHint(null);
    const t = setTimeout(() => {
      if (prevSearchRef.current !== trimmed) {
        prevSearchRef.current = trimmed;
        setActiveSearch(trimmed);
      }
      setIsFiltering(false);
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Debounce date and type inputs
  useEffect(() => {
    setIsFiltering(true);
    const handler = setTimeout(() => {
      const isDateValid = !dateError && (!dateTo || dateTo.length === 10);
      setDebouncedDateTo(isDateValid ? dateTo : "");
      setDebouncedFilterType(filterType);
      setIsFiltering(false);
    }, 300);
    return () => clearTimeout(handler);
  }, [dateTo, filterType, dateError]);

  // Returned records come from the backend history endpoint plus current returned records.
  const returnedItems = useMemo(() => [
    ...localReturnedHistory.map(i => ({
      id: i.id, name: i.name, type: i.type,
      reportedDate: i.reportedDate, closedDate: i.closedDate,
      studentName: i.studentName, rollNo: i.rollNo, location: i.location,
      reporter: i.reporter, reporterPhone: i.reporterPhone, reporterEmail: i.reporterEmail,
    })),
    ...localReturnedLostRecords.map(i => ({
      id: i.id, name: i.name, type: "Lost" as const,
      reportedDate: i.dateFound, closedDate: i.claimedDate || i.lastUpdated,
      studentName: i.studentName, rollNo: i.rollNo, location: i.location,
      reporter: i.reporterName, reporterPhone: i.reporterPhone, reporterEmail: i.reporterEmail,
    })),
    ...localReturnedFoundRecords.map(i => ({
      id: i.id, name: i.name, type: "Found" as const,
      reportedDate: i.dateFound, closedDate: i.returnedDate || i.lastUpdated,
      studentName: i.studentName, rollNo: i.rollNo, location: i.location,
      reporter: "", reporterPhone: "", reporterEmail: "",
    })),
  ], [localReturnedHistory, localReturnedLostRecords, localReturnedFoundRecords]);

  const parseSelectedDate = (dateStr: string): Date => {
    const parts = dateStr.split("-");
    const d = new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const matchesExactDate = (recordDateStr: string | undefined, selectedDateStr: string) => {
    if (!selectedDateStr) return true;
    if (!recordDateStr) return false;
    try {
      const selected = parseSelectedDate(selectedDateStr);
      const recordDate = parseDateForCountdown(recordDateStr);
      return selected.getTime() === recordDate.getTime();
    } catch {
      return false;
    }
  };

  const isSearchActive = activeSearch.length > 0;

  const dateAndTypeFilteredReturned = useMemo(() => {
    const records = returnedItems.filter(r => {
      const matchesType = !debouncedFilterType || r.type === debouncedFilterType;
      const matchesDate = matchesExactDate(r.closedDate, debouncedDateTo);
      return matchesType && matchesDate;
    });
    return records.sort((a, b) => parseHistoryDateToMs(b.closedDate) - parseHistoryDateToMs(a.closedDate));
  }, [returnedItems, debouncedFilterType, debouncedDateTo]);

  const filteredReturned = useMemo(() => {
    return dateAndTypeFilteredReturned.filter(r => {
      return !activeSearch || matchesHistorySearch(r.name, r.location, activeSearch);
    });
  }, [dateAndTypeFilteredReturned, activeSearch]);

  // Lost & Not Found: lost items that expired (60+ days) and were never returned
  const lostNotFoundRecords = useMemo(() => localNotReturnedLostRecords
    .filter(i => getDaysInfo(i.reportedAt).isExpired)
    .map(i => ({
      id: i.id, name: i.name, reportedDate: i.reportedAt,
      location: i.location, reporter: i.reporterName,
      reporterPhone: i.reporterPhone, reporterEmail: i.reporterEmail,
      daysElapsed: getDaysInfo(i.reportedAt).daysElapsed,
    })), [localNotReturnedLostRecords]);

  const dateFilteredLostNotFound = useMemo(() => {
    const records = lostNotFoundRecords.filter(r => matchesExactDate(r.reportedDate, debouncedDateTo));
    return records.sort((a, b) => parseHistoryDateToMs(b.reportedDate) - parseHistoryDateToMs(a.reportedDate));
  }, [lostNotFoundRecords, debouncedDateTo]);

  const filteredLostNotFound = useMemo(() => {
    return dateFilteredLostNotFound.filter(r => {
      return !activeSearch || matchesHistorySearch(r.name, r.location, activeSearch);
    });
  }, [dateFilteredLostNotFound, activeSearch]);

  const dateFilteredDisposed = useMemo(() => {
    const records = localDisposedHistory.filter(r => matchesExactDate(r.disposedDate, debouncedDateTo));
    return records.sort((a, b) => parseHistoryDateToMs(b.disposedDate) - parseHistoryDateToMs(a.disposedDate));
  }, [localDisposedHistory, debouncedDateTo]);

  const filteredDisposed = useMemo(() => {
    return dateFilteredDisposed.filter(r => {
      return !activeSearch || matchesHistorySearch(r.name, r.location, activeSearch);
    });
  }, [dateFilteredDisposed, activeSearch]);

  const inputCls = "w-full bg-[#F5F7FA] border border-[#E5E7EB] rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/15 transition-all py-2.5";

  return (
    <main className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Disposed &amp; Returned History</h1>
        <p className="text-gray-500 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>Permanent record of all returned and disposed items</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        {[
          { label: "Total Returned", value: statistics?.totalReturned ?? 0, dot: "bg-emerald-500", card: "bg-emerald-50 border-emerald-200", txt: "text-emerald-700" },
          { label: "Lost & Not Found", value: statistics?.lostNotFound ?? 0, dot: "bg-red-400", card: "bg-red-50 border-red-200", txt: "text-red-700" },
          { label: "Disposed Items", value: statistics?.disposedItems ?? 0, dot: "bg-gray-400", card: "bg-gray-50 border-gray-200", txt: "text-gray-600" },
          { label: "Found → Returned", value: statistics?.foundReturned ?? 0, dot: "bg-cyan-500", card: "bg-cyan-50 border-cyan-200", txt: "text-cyan-700" },
        ].map((s, i) => (
          <div key={i} className={`border rounded-2xl p-4 flex items-center gap-3 shadow-sm ${s.card}`}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${s.dot}`} />
            <div>
              <p className={`text-2xl font-bold ${s.txt}`} style={{ fontFamily: "Outfit, sans-serif", display: "flex", alignItems: "center", minHeight: "2rem" }}>
                {isStatsLoading || !statistics ? (
                  <span className="inline-block w-8 h-6 bg-current/25 rounded animate-pulse" />
                ) : (
                  s.value
                )}
              </p>
              <p className={`text-[10px] font-semibold ${s.txt}`} style={{ fontFamily: "DM Sans, sans-serif" }}>{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-white border border-gray-200 rounded-xl shadow-sm w-fit mb-4">
        {([
          { id: "returned", label: `Returned (${isStatsLoading || !statistics ? "..." : statistics.totalReturned})`, color: "bg-emerald-500" },
          { id: "lost-not-found", label: `Lost & Not Found (${isStatsLoading || !statistics ? "..." : statistics.lostNotFound})`, color: "bg-red-500" },
          { id: "disposed", label: `Disposed (${isStatsLoading || !statistics ? "..." : statistics.disposedItems})`, color: "bg-gray-500" },
        ] as { id: "returned" | "lost-not-found" | "disposed"; label: string; color: string }[]).map(t => (
          <button
            key={t.id}
            onClick={() => setActiveTab(t.id)}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-all ${activeTab === t.id ? `${t.color} text-white shadow-sm` : "text-gray-500 hover:bg-gray-50"}`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-4 mb-4">
        <div className={`grid grid-cols-1 gap-3 ${activeTab === "disposed" ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
          <div className="relative flex flex-col justify-center">
            <div className="relative">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search item name, location…" value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                className={inputCls + " pl-9"} style={{ fontFamily: "DM Sans, sans-serif" }} />
            </div>
            {searchHint && (
              <p className="absolute left-0 top-full mt-1 text-xs text-amber-500 z-10 font-medium animate-fade-in" style={{ fontFamily: "DM Sans, sans-serif" }}>
                {searchHint}
              </p>
            )}
          </div>
          {activeTab !== "disposed" && (
            <select value={filterType} onChange={e => setFilterType(e.target.value)}
              className={inputCls + " px-3 appearance-none"} style={{ fontFamily: "DM Sans, sans-serif" }}>
              <option value="">All Types</option>
              <option value="Lost">Lost Items</option>
              <option value="Found">Found Items</option>
            </select>
          )}
          <div className="relative flex flex-col justify-center">
            <div className="relative">
              <Calendar size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
              <input type="date" value={dateTo}
                min={get30DaysAgoDateString()}
                max={getTodayDateString()}
                onChange={e => {
                  const val = e.target.value;
                  const validity = e.target.validity;
                  if (!val && !validity.badInput) {
                    setDateTo("");
                    setDateError(null);
                    return;
                  }
                  if (val && val.length === 10) {
                    if (val >= get30DaysAgoDateString() && val <= getTodayDateString()) {
                      setDateTo(val);
                      setDateError(null);
                    } else {
                      setDateTo("");
                      setDateError("Please select a date within the last 30 days.");
                    }
                  } else {
                    setDateTo(val);
                  }
                }}
                onBlur={e => {
                  const val = e.target.value;
                  const validity = e.target.validity;
                  if (validity.badInput || !val || val.length !== 10 || val < get30DaysAgoDateString() || val > getTodayDateString()) {
                    if (!val && !validity.badInput) {
                      setDateTo("");
                      setDateError(null);
                    } else {
                      setDateTo("");
                      setDateError("Please select a date within the last 30 days.");
                    }
                  }
                }}
                className={inputCls + " pl-9"} style={{ fontFamily: "DM Sans, sans-serif" }} />
            </div>
            {dateError && (
              <p className="text-red-500 text-[10px] mt-1 font-medium animate-fade-in" style={{ fontFamily: "DM Sans, sans-serif" }}>
                {dateError}
              </p>
            )}
          </div>
        </div>
        {(searchTerm || filterType || dateFrom || dateTo || dateError) && (
          <button onClick={() => { setSearchTerm(""); setFilterType(""); setDateFrom(""); setDateTo(""); setDateError(null); }}
            className="mt-2 text-xs text-cyan-600 hover:underline font-medium" style={{ fontFamily: "DM Sans, sans-serif" }}>
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {activeTab === "returned"
                  ? ["Item Name", "Type", "Reported Date", "Returned Date", "Location", "Student", "Roll No", "Reporter"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}>{h}</th>
                  ))
                  : activeTab === "lost-not-found"
                    ? ["Item Name", "Reported Date", "Location", "Days Elapsed", "Reporter"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}>{h}</th>
                    ))
                    : ["Item Name", "Disposed Date", "Donated To"].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}>{h}</th>
                    ))
                }
              </tr>
            </thead>
            <tbody>
              {isApiLoading || isFiltering ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="border-b border-gray-100 animate-pulse">
                    {activeTab === "returned" ? (
                      <>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-16"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      </>
                    ) : activeTab === "lost-not-found" ? (
                      <>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-12"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      </>
                    ) : (
                      <>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div></td>
                        <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                      </>
                    )}
                  </tr>
                ))
              ) : localReturnedHistory.length === 0 && localReturnedLostRecords.length === 0 && localReturnedFoundRecords.length === 0 && localNotReturnedLostRecords.length === 0 && localDisposedHistory.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === "returned" ? 8 : activeTab === "lost-not-found" ? 5 : 3} className="px-4 py-10 text-center text-gray-400 text-sm font-medium" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    No history records available.
                  </td>
                </tr>
              ) : activeTab === "lost-not-found" ? (
                dateFilteredLostNotFound.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No Lost &amp; Not Found items found for the selected filters.</td></tr>
                ) : isSearchActive && filteredLostNotFound.length === 0 ? (
                  <tr><td colSpan={5} className="px-4 py-10 text-center text-gray-400 text-sm">No matching Lost &amp; Not Found items found.</td></tr>
                ) : filteredLostNotFound.map((item, i) => {
                  const elapsed = item.daysElapsed;
                  return (
                    <tr key={`lnf-${item.id}`} className={`border-b border-gray-100 hover:bg-red-50/30 transition-colors ${i % 2 !== 0 ? "bg-gray-50/40" : ""}`}>
                      <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}><CardNameTooltip name={item.name} /></td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.reportedDate}</td>
                      <td className="px-4 py-3 text-gray-600 max-w-[120px]"><span className="truncate block">{item.location}</span></td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{elapsed}d</td>
                      <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.reporter ? <CardNameTooltip name={item.reporter} /> : "—"}</td>
                    </tr>
                  );
                })
              ) : activeTab === "returned" ? (
                dateAndTypeFilteredReturned.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No returned items found for the selected filters.</td></tr>
                ) : isSearchActive && filteredReturned.length === 0 ? (
                  <tr><td colSpan={8} className="px-4 py-10 text-center text-gray-400 text-sm">No matching returned items found.</td></tr>
                ) : filteredReturned.map((item, i) => (
                  <tr key={`ret-${item.type}-${item.id}`} className={`border-b border-gray-100 hover:bg-emerald-50/30 transition-colors ${i % 2 !== 0 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}><CardNameTooltip name={item.name} /></td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${item.type === "Lost" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>{item.type}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.reportedDate}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.closedDate || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 max-w-[120px]"><span className="truncate block">{item.location}</span></td>
                    <td className="px-4 py-3 text-gray-900 whitespace-nowrap">{item.studentName ? <CardNameTooltip name={item.studentName} /> : "—"}</td>
                    <td className="px-4 py-3 text-gray-600 font-mono">{item.rollNo || "—"}</td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.reporter ? <CardNameTooltip name={item.reporter} /> : "—"}</td>
                  </tr>
                ))
              ) : (
                dateFilteredDisposed.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400 text-sm">No disposed items found for the selected filters.</td></tr>
                ) : isSearchActive && filteredDisposed.length === 0 ? (
                  <tr><td colSpan={3} className="px-4 py-10 text-center text-gray-400 text-sm">No matching disposed items found.</td></tr>
                ) : filteredDisposed.map((item, i) => (
                  <tr key={`dis-${item.type}-${item.id}-${i}`} className={`border-b border-gray-100 hover:bg-gray-50 transition-colors ${i % 2 !== 0 ? "bg-gray-50/40" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}><CardNameTooltip name={item.name} /></td>
                    <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.disposedDate}</td>
                    <td className="px-4 py-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-pink-50 text-pink-600">
                        {item.donatedTo || item.disposalLocation || "—"}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  );
}

// ─── Expired Items Page ────────────────────────────────────────────────────

const SOCIAL_CLUBS = ["NSS", "KCDC", "NCC", "Other"];

// ─── Synonym map for intelligent Expired Items search ─────────────────
const EXPIRED_ITEM_SYNONYMS: Record<string, string[]> = {
  bag: ["backpack", "sack", "pouch", "tote", "knapsack", "haversack", "bagpack", "school bag", "travel bag", "handbag", "satchel", "kit bag", "gym bag", "skybag", "laptop bag", "duffle", "duffel", "leather bag"],
  backpack: ["bag", "school bag", "travel bag", "knapsack", "haversack", "bagpack", "rucksack", "skybag", "campus bag"],
  phone: ["mobile", "cell", "smartphone", "handphone", "iphone", "android", "cellphone", "handset"],
  mobile: ["phone", "cell", "smartphone", "handphone", "iphone", "android", "cellphone"],
  wallet: ["purse", "billfold", "card holder", "money clip"],
  bottle: ["water bottle", "flask", "tumbler", "sipper", "thermos", "canteen"],
  "water bottle": ["bottle", "flask", "tumbler", "sipper"],
  glasses: ["spectacles", "specs", "eyeglasses", "sunglasses", "shades", "goggles", "reading glasses", "frames"],
  spectacles: ["glasses", "specs", "eyeglasses", "frames"],
  keys: ["key", "keychain", "key ring", "keyring", "locket", "lanyard key"],
  key: ["keys", "keychain", "key ring", "keyring"],
  charger: ["adapter", "cable", "power adapter", "charging cable", "plug"],
  earphones: ["earbuds", "headphones", "headset", "airpods", "earpiece", "in-ear", "buds"],
  headphones: ["earphones", "earbuds", "headset", "over-ear"],
  umbrella: ["raincoat", "rain cover"],
  book: ["notebook", "textbook", "notes", "journal", "diary", "workbook"],
  notebook: ["book", "notes", "journal", "copy", "notepad"],
  pen: ["pencil", "marker", "ballpoint", "ink pen", "sketch pen", "highlighter"],
  pencil: ["pen", "eraser", "sketch"],
  calculator: ["calc", "scientific calculator"],
  laptop: ["computer", "pc", "macbook", "notebook computer", "chromebook"],
  watch: ["wristwatch", "timepiece", "clock", "smartwatch"],
  id: ["id card", "identity card", "student id", "college id", "college card", "access card", "pass"],
  "id card": ["identity card", "student id", "college card", "access card", "id"],
  earring: ["earrings", "stud", "hoop", "jewelry"],
  necklace: ["chain", "pendant", "locket", "jewelry"],
  ring: ["band", "finger ring", "jewelry"],
  bracelet: ["bangle", "wristband", "jewelry"],
};

/** Expand a query word to all synonym terms (including itself). */
function getExpiredSynonymTerms(word: string): string[] {
  const lower = word.toLowerCase();
  const synonyms = EXPIRED_ITEM_SYNONYMS[lower] || [];
  const reverseMatches = Object.entries(EXPIRED_ITEM_SYNONYMS)
    .filter(([, syns]) => syns.some(s => s.toLowerCase() === lower))
    .map(([key]) => key);
  return [lower, ...synonyms.map(s => s.toLowerCase()), ...reverseMatches];
}

/** Intelligent multi-strategy name search for expired items: partial, keyword, synonym. */
function matchesExpiredSearch(name: string, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = name.toLowerCase();

  // 1. Partial match
  if (haystack.includes(q)) return true;

  // 2. Keyword match: all words in query appear in the name
  const queryWords = q.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1 && queryWords.every(w => haystack.includes(w))) return true;

  // 3. Synonym match
  for (const word of queryWords) {
    const terms = getExpiredSynonymTerms(word);
    if (terms.some(term => haystack.includes(term))) return true;
  }

  return false;
}

function ExpiredItemsPage({
  foundAdminRecords, lostAdminRecords, setFoundAdminRecords, setLostAdminRecords, onDispose,
}: {
  foundAdminRecords: AdminFoundItem[];
  lostAdminRecords: AdminLostItem[];
  setFoundAdminRecords: React.Dispatch<React.SetStateAction<AdminFoundItem[]>>;
  setLostAdminRecords: React.Dispatch<React.SetStateAction<AdminLostItem[]>>;
  onDispose: (record: DisposedRecord) => void;
}) {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("");
  const [selectedItem, setSelectedItem] = useState<{ id: string; name: string; type: "Lost" | "Found"; reportedDate: string; location: string; reporter: string; reporterPhone: string; reporterEmail: string } | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isDisposing, setIsDisposing] = useState(false);
  const [notesError, setNotesError] = useState("");
  const [disposingItemId, setDisposingItemId] = useState<string | null>(null);

  const [disposalLocation, setDisposalLocation] = useState("");
  const [donatedTo, setDonatedTo] = useState("None");
  const [notes, setNotes] = useState("");
  const [showConfirm, setShowConfirm] = useState(false);

  // Debounced effective search — only activated at ≥3 chars or when cleared
  const [activeSearch, setActiveSearch] = useState("");
  const [searchHint, setSearchHint] = useState<string | null>(null);
  const prevSearchRef = useRef("");

  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) {
      setSearchHint(null);
      const t = setTimeout(() => {
        if (prevSearchRef.current !== "") { prevSearchRef.current = ""; setActiveSearch(""); }
      }, 400);
      return () => clearTimeout(t);
    }
    if (trimmed.length < 3) {
      setSearchHint("Enter at least 3 characters to search.");
      return;
    }
    setSearchHint(null);
    const t = setTimeout(() => {
      if (prevSearchRef.current !== trimmed) { prevSearchRef.current = trimmed; setActiveSearch(trimmed); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Statistics: always derived from the full expired dataset — never affected by search
  const expiredFoundRecords = useMemo(() =>
    foundAdminRecords
      .filter(i => i.status === "Not Returned" && getDaysInfo(i.foundAt).isExpired)
      .map(i => ({ id: i.id, name: i.name, type: "Found" as const, reportedDate: i.dateFound, location: i.location, reporter: "", reporterPhone: "", reporterEmail: "", daysElapsed: getDaysInfo(i.foundAt).daysElapsed })),
    [foundAdminRecords]
  );

  // Filtered + sorted items — newest first (lowest daysElapsed = most recently expired)
  const allExpired = useMemo(() =>
    expiredFoundRecords
      .filter(i => matchesExpiredSearch(i.name, activeSearch))
      .sort((a, b) => a.daysElapsed - b.daysElapsed),
    [expiredFoundRecords, activeSearch]
  );

  const openModal = (item: typeof allExpired[0]) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setSelectedItem(item);
    setDisposalLocation("");
    setDonatedTo("None");
    setNotes("");
    setNotesError("");
    setShowConfirm(false);
    setDisposingItemId(null);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
  };

  const closeModal = () => {
    setModalVisible(false);
    closeTimerRef.current = setTimeout(() => setSelectedItem(null), 260);
  };

  const handleSubmitDisposal = async () => {
    if (!selectedItem || !disposalLocation.trim() || isDisposing) return;
    const trimmedNotes = notes.trim();
    if (trimmedNotes && trimmedNotes.length < 8) {
      setNotesError("Notes must be at least 8 characters if provided.");
      return;
    }
    const now = formatNow();
    const record: DisposedRecord = {
      id: selectedItem.id,
      name: selectedItem.name,
      type: selectedItem.type,
      reportedDate: selectedItem.reportedDate,
      location: selectedItem.location,
      reporter: selectedItem.reporter,
      reporterPhone: selectedItem.reporterPhone,
      reporterEmail: selectedItem.reporterEmail,
      disposalLocation: disposalLocation.trim(),
      donatedTo: donatedTo === "None" ? "" : donatedTo,
      disposedDate: now,
      notes: trimmedNotes,
    };
    setIsDisposing(true);
    try {
      await markItemDisposed(selectedItem.id, selectedItem.type, {
        disposalLocation: disposalLocation.trim(),
        donatedTo: donatedTo === "None" ? "" : donatedTo,
        notes: trimmedNotes,
      });
      if (selectedItem.type === "Found") {
        setFoundAdminRecords(prev => prev.filter(i => i.id !== selectedItem.id));
      } else {
        setLostAdminRecords(prev => prev.filter(i => i.id !== selectedItem.id));
      }
      onDispose(record);
      closeModal();
      toast.success("Item marked as disposed", {
        description: `${selectedItem.name} has been moved to History.`,
        duration: 3500,
      });
    } catch (error) {
      console.error("Disposal failed:", error);
      toast.error("Failed to mark item as disposed", {
        description: error instanceof Error ? error.message : "API error. Please try again.",
        duration: 4500,
      });
    } finally {
      setIsDisposing(false);
      setDisposingItemId(null);
    }
  };

  const fLabel = "block text-xs font-semibold text-gray-600 mb-1.5";
  const fInput = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all";

  return (
    <main className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-1">
          <Recycle size={18} className="text-gray-500" />
          <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Expired Items – Awaiting Disposal</h1>
        </div>
        <p className="text-gray-600 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>Items unclaimed for 60+ days. Mark each item as disposed and optionally donate to a social service club.</p>
      </div>

      {/* Summary bar */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        {[
          { label: "Total Expired", value: expiredFoundRecords.length, cls: "bg-gray-50 border-gray-200", txt: "text-gray-700", dot: "bg-gray-500" },
          { label: "Found Items", value: expiredFoundRecords.length, cls: "bg-emerald-50 border-emerald-200", txt: "text-emerald-700", dot: "bg-emerald-500" },
        ].map((c, i) => (
          <div key={i} className={`border rounded-xl p-4 flex items-center gap-3 ${c.cls}`}>
            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
            <div>
              <p className={`text-2xl font-bold ${c.txt}`} style={{ fontFamily: "Outfit, sans-serif" }}>{c.value}</p>
              <p className={`text-[10px] font-semibold ${c.txt}`} style={{ fontFamily: "DM Sans, sans-serif" }}>{c.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input type="text" placeholder="Search by item name " value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              style={{ fontFamily: "DM Sans, sans-serif" }} />
            {searchHint && (
              <p className="absolute left-0 top-full mt-1 text-xs text-amber-500 z-10" style={{ fontFamily: "DM Sans, sans-serif" }}>{searchHint}</p>
            )}
          </div>
        </div>
        <p className="text-xs text-gray-400 mt-2" style={{ fontFamily: "DM Sans, sans-serif" }}>{allExpired.length} expired item{allExpired.length !== 1 ? "s" : ""} awaiting disposal</p>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["Item Name", "Found Date", "Action"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {allExpired.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-14 text-center" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    <div className="flex flex-col items-center gap-2 text-gray-400">
                      <Package size={32} className="opacity-30" />
                      <p className="text-sm font-medium">No expired items</p>
                      <p className="text-xs">All items have been claimed within the 60-day window.</p>
                    </div>
                  </td>
                </tr>
              ) : allExpired.map((item, i) => (
                <tr key={`exp-${item.id}`} className={`border-b border-gray-100 hover:bg-gray-50/60 transition-colors ${i % 2 !== 0 ? "bg-gray-50/30" : ""}`}>
                  <td className="px-4 py-3 font-medium text-gray-900 whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}>{item.name}</td>
                  <td className="px-4 py-3 text-gray-600 whitespace-nowrap">{item.reportedDate}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => { setDisposingItemId(item.id); openModal(item); }}
                      disabled={disposingItemId === item.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-white text-[11px] font-semibold transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                      style={{ fontFamily: "DM Sans, sans-serif" }}
                    >
                      {disposingItemId === item.id
                        ? <><Loader2 size={11} className="animate-spin" /> Loading…</>
                        : <><Recycle size={11} /> Mark Disposed</>}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Disposal Modal */}
      {selectedItem && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
            background: modalVisible ? "rgba(15,23,42,0.52)" : "rgba(15,23,42,0)",
            backdropFilter: modalVisible ? "blur(4px)" : "blur(0px)",
            transition: "background 0.25s ease, backdrop-filter 0.25s ease",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white", borderRadius: "14px",
              boxShadow: "0 25px 60px #00000030, 0 8px 20px #0000001a",
              width: "100%", maxWidth: "500px", maxHeight: "92vh", overflowY: "auto",
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? "scale(1) translateY(0)" : "scale(0.96) translateY(10px)",
              transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Recycle size={16} className="text-gray-600" />
                </div>
                <div>
                  <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>Mark Item as Disposed</h2>
                  <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Record disposal details for this expired item</p>
                </div>
              </div>
              <button onClick={closeModal}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6b7280" }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Item info */}
              <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#6b7280" }}>Item</span>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, fontWeight: 600, color: "#111827" }}>{selectedItem.name}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#6b7280" }}>Type</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${selectedItem.type === "Lost" ? "bg-amber-50 text-amber-600" : "bg-emerald-50 text-emerald-600"}`}>{selectedItem.type}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#6b7280" }}>Date Reported</span>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#374151" }}>{selectedItem.reportedDate}</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#6b7280" }}>Found Location</span>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#374151" }}>{selectedItem.location}</span>
                </div>
              </div>

              {/* Club selector */}
              <div>
                <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Donate to Social Services Club for Further Disposal <span style={{ color: "#ef4444" }}>*</span></label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {["KCDC", "NSS", "NCC", "Others"].map(club => (
                    <button key={club} type="button"
                      onClick={() => setDisposalLocation(club)}
                      className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-all ${disposalLocation === club ? "bg-pink-500 text-white border-pink-500" : "bg-white text-gray-600 border-gray-200 hover:border-gray-300 hover:bg-gray-50"}`}
                      style={{ fontFamily: "DM Sans, sans-serif" }}>
                      {club}
                    </button>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Notes <span style={{ color: "#9ca3af", fontWeight: 400 }}>(Optional)</span></label>
                <textarea rows={3} value={notes} onChange={e => { setNotes(e.target.value); if (notesError) setNotesError(""); }}
                  placeholder="Additional disposal notes…" className={fInput}
                  style={{ fontFamily: "DM Sans, sans-serif", resize: "none" }} />
                {notesError && (
                  <p className="text-red-500 text-xs mt-1" style={{ fontFamily: "DM Sans, sans-serif" }}>{notesError}</p>
                )}
              </div>
            </div>

            {/* Footer */}
            {!showConfirm ? (
              <div style={{ padding: "0 24px 20px", display: "flex", gap: 10 }}>
                <button onClick={closeModal}
                  style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: 14, fontWeight: 500, fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
                  Cancel
                </button>
                <button
                  onClick={() => {
                    const trimmedNotes = notes.trim();
                    if (trimmedNotes && trimmedNotes.length < 8) {
                      setNotesError("Notes must be at least 8 characters if provided.");
                      return;
                    }
                    setShowConfirm(true);
                  }}
                  disabled={!disposalLocation.trim()}
                  style={{
                    flex: 1, padding: "10px 0", borderRadius: 9, border: "none",
                    background: disposalLocation.trim() ? "#1f2937" : "#e5e7eb",
                    color: disposalLocation.trim() ? "white" : "#9ca3af",
                    fontSize: 14, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
                    cursor: disposalLocation.trim() ? "pointer" : "not-allowed",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  }}>
                  <Recycle size={14} /> Confirm Disposal
                </button>
              </div>
            ) : (
              <div style={{ padding: "0 24px 20px", display: "flex", flexDirection: "column", gap: 10 }}>
                <div style={{ background: "#fef3c7", border: "1px solid #fde68a", borderRadius: 10, padding: "12px 14px", fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "#92400e" }}>
                  ⚠ Are you sure you want to dispose <strong>{selectedItem?.name}</strong> by donating to <strong>{disposalLocation}</strong>? This action cannot be undone.
                </div>
                <div style={{ display: "flex", gap: 10 }}>
                  <button onClick={() => setShowConfirm(false)}
                    style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: 14, fontWeight: 500, fontFamily: "DM Sans, sans-serif", cursor: "pointer" }}>
                    Go Back
                  </button>
                  <button onClick={handleSubmitDisposal} disabled={isDisposing}
                    style={{
                      flex: 1, padding: "10px 0", borderRadius: 9, border: "none",
                      background: isDisposing ? "#9ca3af" : "#dc2626", color: "white",
                      fontSize: 14, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
                      cursor: isDisposing ? "not-allowed" : "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                    }}>
                    {isDisposing
                      ? <><Loader2 size={14} className="animate-spin" /> Disposing…</>
                      : <><Recycle size={14} /> Yes, Dispose Now</>}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

// ─── Admin View ────────────────────────────────────────────────────────────

function AdminSidebar({ active, setActive, onLogoutRequest, isOpen, onClose, isLoggingOut }: { active: string; setActive: (s: string) => void; onLogoutRequest: () => void; isOpen: boolean; onClose: () => void; isLoggingOut?: boolean }) {
  const sections = [
    {
      label: "ITEMS",
      items: [
        { id: "upload-item", icon: <Upload size={15} />, label: "Report Item" },
        { id: "lost-items", icon: <AlertCircle size={15} />, label: "Lost Items" },
        { id: "found-items", icon: <CheckSquare size={15} />, label: "Found Items" },
        { id: "expired-items", icon: <Recycle size={15} />, label: "Expired Items" },
      ],
    },
    {
      label: "RECORDS",
      items: [
        { id: "history", icon: <BookOpen size={15} />, label: "Disposed & Returned History" },
      ],
    },
    {
      label: "MANAGE",
      items: [
        { id: "guidelines", icon: <BookOpen size={15} />, label: "Guidelines" },
        { id: "settings", icon: <Settings size={15} />, label: "Settings" },
      ],
    },
  ];

  return (
    <aside className={`fixed inset-y-0 left-0 z-50 w-52 bg-white flex flex-col min-h-screen shrink-0 border-r border-gray-200 transition-transform duration-300 transform ${isOpen ? "translate-x-0" : "-translate-x-full"} md:relative md:translate-x-0`}>
      <div className="px-4 py-5 border-b border-gray-200">
        <div className="flex items-center gap-2.5">
          <img
            src={campusLogo}
            alt="Campus Logo"
            className="w-8 h-8 object-contain"
          />
          <div>
            <p className="text-gray-900 font-semibold text-sm leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Campus</p>
            <p className="text-cyan-600 text-[10px] leading-tight">Lost &amp; Found</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
        {sections.map((section, si) => (
          <div key={si}>
            {section.label && (
              <p className="text-[9px] font-semibold text-gray-400 tracking-widest px-3 mb-1.5">{section.label}</p>
            )}
            <div className="space-y-0.5">
              {section.items.map((item) => (
                <button
                  key={item.id}
                  onClick={() => {
                    setActive(item.id);
                    onClose();
                  }}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs transition-all ${active === item.id
                    ? "bg-cyan-600 text-white"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    }`}
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-gray-200">
        <div className="flex items-center gap-2.5 px-2 py-2">
          <div className="w-7 h-7 rounded-full bg-gradient-to-br from-cyan-500 to-teal-600 flex items-center justify-center text-white text-[10px] font-bold shrink-0">A</div>
          <div className="min-w-0 flex-1">
            <p className="text-gray-900 text-xs font-medium truncate" style={{ fontFamily: "Outfit, sans-serif" }}>Admin</p>
            <p className="text-gray-500 text-[10px] truncate">admin@campus.edu</p>
          </div>
          <button
            onClick={() => {
              if (isLoggingOut) return;
              onClose();
              onLogoutRequest();
            }}
            disabled={isLoggingOut}
            title="Logout"
            className={`p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 hover:shadow-sm transition-all duration-150 ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            {isLoggingOut ? <Loader2 size={14} className="animate-spin" /> : <LogOut size={14} />}
          </button>
        </div>
      </div>
    </aside>
  );
}

const ADMIN_ROWS_OPTIONS = [10, 25, 50, 100];

// Shared countdown helpers moved to ./data/appData

function CountdownChip({ dateStr }: { dateStr: string }) {
  const { daysRemaining, isExpired, countdownStatus } = getDaysInfo(dateStr);
  if (isExpired) return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 whitespace-nowrap">⚫ Expired</span>;
  if (countdownStatus === "last10") return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-600 whitespace-nowrap">🔴 {daysRemaining}d</span>;
  if (countdownStatus === "expiring") return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 whitespace-nowrap">🟡 {daysRemaining}d</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 whitespace-nowrap">🟢 {daysRemaining}d</span>;
}

function CountdownSummaryCards({ items, dateField, isLoading }: { items: Array<Record<string, string>>, dateField: string, isLoading?: boolean }) {
  const notReturned = items.filter(i => i.status === "Not Returned");
  const stats = notReturned.reduce(
    (acc, item) => { const { countdownStatus } = getDaysInfo(item[dateField]); acc[countdownStatus]++; return acc; },
    { active: 0, expiring: 0, last10: 0, expired: 0 }
  );
  const cards = [
    { label: "Total Unclaimed", value: stats.active + stats.expiring + stats.last10, cls: "bg-cyan-50 border-cyan-200", txt: "text-cyan-700", dot: "bg-cyan-400" },
    { label: "Expiring in 30 Days", value: stats.expiring + stats.last10, cls: "bg-amber-50 border-amber-200", txt: "text-amber-700", dot: "bg-amber-400" },
    { label: "Last 10 Days", value: stats.last10, cls: "bg-red-50 border-red-200", txt: "text-red-700", dot: "bg-red-500" },
    { label: "Expired – Awaiting Removal", value: stats.expired, cls: "bg-gray-50 border-gray-200", txt: "text-gray-600", dot: "bg-gray-400" },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
      {cards.map((c, i) => (
        <div key={i} className={`border rounded-xl p-4 flex items-center gap-3 ${c.cls}`}>
          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${c.dot}`} />
          <div>
            {isLoading ? (
              <div className="h-8 w-12 bg-gray-200 rounded animate-pulse" />
            ) : (
              <p className={`text-2xl font-bold ${c.txt}`} style={{ fontFamily: "Outfit, sans-serif" }}>{c.value}</p>
            )}
            <p className={`text-[10px] font-semibold ${c.txt}`} style={{ fontFamily: "DM Sans, sans-serif" }}>{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function parseDateTime(dt: string): number {
  const months: Record<string, number> = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const [datePart, timePart] = dt.split(", ");
  if (!datePart || !timePart) return 0;
  const [day, mon, year] = datePart.split(" ");
  const [time, ampm] = timePart.split(" ");
  const [h, m] = time.split(":").map(Number);
  let hours = h;
  if (ampm === "PM" && h !== 12) hours += 12;
  if (ampm === "AM" && h === 12) hours = 0;
  return new Date(Number(year), months[mon], Number(day), hours, m).getTime();
}

function AdminTablePagination({
  totalRecords, currentPage, rowsPerPage, onPageChange, onRowsPerPageChange,
}: {
  totalRecords: number;
  currentPage: number;
  rowsPerPage: number;
  onPageChange: (p: number) => void;
  onRowsPerPageChange: (n: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(totalRecords / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const start = totalRecords === 0 ? 0 : (safePage - 1) * rowsPerPage + 1;
  const end = Math.min(safePage * rowsPerPage, totalRecords);

  const maxVisible = 5;
  let pageStart = Math.max(1, safePage - Math.floor(maxVisible / 2));
  const pageEnd = Math.min(totalPages, pageStart + maxVisible - 1);
  if (pageEnd - pageStart + 1 < maxVisible) pageStart = Math.max(1, pageEnd - maxVisible + 1);
  const pageNumbers = Array.from({ length: pageEnd - pageStart + 1 }, (_, i) => pageStart + i);

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 bg-gray-50/60">
      {/* Left: record count + rows per page */}
      <div className="flex items-center gap-3 flex-wrap">
        <p className="text-xs text-gray-500" style={{ fontFamily: "DM Sans, sans-serif" }}>
          Showing <span className="font-semibold text-gray-700">{start}</span>–<span className="font-semibold text-gray-700">{end}</span> of <span className="font-semibold text-gray-700">{totalRecords}</span> items
        </p>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-gray-400" style={{ fontFamily: "DM Sans, sans-serif" }}>Rows per page:</span>
          <select
            value={rowsPerPage}
            onChange={e => { onRowsPerPageChange(Number(e.target.value)); onPageChange(1); }}
            className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white text-gray-700 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 cursor-pointer"
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {ADMIN_ROWS_OPTIONS.map(n => <option key={n} value={n}>{n}</option>)}
          </select>
        </div>
      </div>

      {/* Right: page navigation */}
      <div className="flex items-center gap-1">
        <button
          onClick={() => onPageChange(Math.max(1, safePage - 1))}
          disabled={safePage === 1}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          ← Previous
        </button>

        {pageStart > 1 && (
          <>
            <button onClick={() => onPageChange(1)} className="w-8 h-8 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all duration-150 shadow-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>1</button>
            {pageStart > 2 && <span className="text-gray-400 text-xs px-1">…</span>}
          </>
        )}

        {pageNumbers.map(n => (
          <button
            key={n}
            onClick={() => onPageChange(n)}
            className={`w-8 h-8 text-xs rounded-lg border transition-all duration-150 shadow-sm ${safePage === n
              ? "bg-cyan-600 border-cyan-600 text-white"
              : "border-gray-200 bg-white text-gray-600 hover:bg-cyan-600 hover:text-white hover:border-cyan-600"
              }`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            {n}
          </button>
        ))}

        {pageEnd < totalPages && (
          <>
            {pageEnd < totalPages - 1 && <span className="text-gray-400 text-xs px-1">…</span>}
            <button onClick={() => onPageChange(totalPages)} className="w-8 h-8 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 transition-all duration-150 shadow-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>{totalPages}</button>
          </>
        )}

        <button
          onClick={() => onPageChange(Math.min(totalPages, safePage + 1))}
          disabled={safePage === totalPages}
          className="px-3 py-1.5 text-xs rounded-lg border border-gray-200 bg-white text-gray-600 hover:bg-cyan-600 hover:text-white hover:border-cyan-600 disabled:opacity-35 disabled:cursor-not-allowed transition-all duration-150 shadow-sm"
          style={{ fontFamily: "DM Sans, sans-serif" }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Synonym map for intelligent Lost Items search ─────────────────────
const LOST_ITEM_SYNONYMS: Record<string, string[]> = {
  bag: ["backpack", "sack", "pouch", "tote", "knapsack", "haversack", "bagpack", "school bag", "travel bag", "handbag", "satchel", "kit bag", "gym bag", "skybag", "laptop bag", "duffle", "duffel", "leather bag"],
  backpack: ["bag", "school bag", "travel bag", "knapsack", "haversack", "bagpack", "rucksack", "skybag", "campus bag"],
  phone: ["mobile", "cell", "smartphone", "handphone", "iphone", "android", "cellphone", "handset"],
  mobile: ["phone", "cell", "smartphone", "handphone", "iphone", "android", "cellphone"],
  wallet: ["purse", "billfold", "card holder", "money clip"],
  bottle: ["water bottle", "flask", "tumbler", "sipper", "thermos", "canteen"],
  "water bottle": ["bottle", "flask", "tumbler", "sipper"],
  glasses: ["spectacles", "specs", "eyeglasses", "sunglasses", "shades", "goggles", "reading glasses", "frames"],
  spectacles: ["glasses", "specs", "eyeglasses", "frames"],
  keys: ["key", "keychain", "key ring", "keyring", "locket", "lanyard key"],
  key: ["keys", "keychain", "key ring", "keyring"],
  charger: ["adapter", "cable", "power adapter", "charging cable", "plug"],
  earphones: ["earbuds", "headphones", "headset", "airpods", "earpiece", "in-ear", "buds"],
  headphones: ["earphones", "earbuds", "headset", "over-ear"],
  umbrella: ["raincoat", "rain cover"],
  book: ["notebook", "textbook", "notes", "journal", "diary", "workbook"],
  notebook: ["book", "notes", "journal", "copy", "notepad"],
  pen: ["pencil", "marker", "ballpoint", "ink pen", "sketch pen", "highlighter"],
  pencil: ["pen", "eraser", "sketch"],
  calculator: ["calc", "scientific calculator"],
  laptop: ["computer", "pc", "macbook", "notebook computer", "chromebook"],
  watch: ["wristwatch", "timepiece", "clock", "smartwatch"],
  id: ["id card", "identity card", "student id", "college id", "college card", "access card", "pass"],
  "id card": ["identity card", "student id", "college card", "access card", "id"],
  earring: ["earrings", "stud", "hoop", "jewelry"],
  necklace: ["chain", "pendant", "locket", "jewelry"],
  ring: ["band", "finger ring", "jewelry"],
  bracelet: ["bangle", "wristband", "jewelry"],
};

/** Expand a single query word into all synonym terms (including itself). */
function getLostSynonymTerms(word: string): string[] {
  const lower = word.toLowerCase();
  const synonyms = LOST_ITEM_SYNONYMS[lower] || [];
  const reverseMatches = Object.entries(LOST_ITEM_SYNONYMS)
    .filter(([, syns]) => syns.some(s => s.toLowerCase() === lower))
    .map(([key]) => key);
  return [lower, ...synonyms.map(s => s.toLowerCase()), ...reverseMatches];
}

/**
 * Intelligent multi-strategy matcher for Lost Items.
 * Checks item name + reporter name against: exact, partial, keyword, synonym.
 */
function matchesLostSearch(item: AdminLostItem, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const nameHaystack = item.name.toLowerCase();
  const reporterHaystack = item.reporterName.toLowerCase();
  const combined = `${nameHaystack} ${reporterHaystack}`;

  // 1. Partial / substring match on name or reporter
  if (nameHaystack.includes(q) || reporterHaystack.includes(q)) return true;

  // 2. Keyword match: all words in query appear in the combined haystack
  const queryWords = q.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1 && queryWords.every(w => combined.includes(w))) return true;

  // 3. Synonym match: expand each word and check against item name
  for (const word of queryWords) {
    const terms = getLostSynonymTerms(word);
    if (terms.some(term => nameHaystack.includes(term))) return true;
  }

  return false;
}

/** Case-insensitive partial location match. */
function matchesLostLocation(item: AdminLostItem, query: string): boolean {
  if (!query) return true;
  return item.location.toLowerCase().includes(query.trim().toLowerCase());
}

function LostItemsPage({ items, setItems, onReturn, isLoading, onRefresh }: { items: AdminLostItem[]; setItems: React.Dispatch<React.SetStateAction<AdminLostItem[]>>; onReturn: (r: ReturnedLostRecord) => void; isLoading?: boolean; onRefresh?: () => void }) {
  const [editItem, setEditItem] = useState<AdminLostItem | null>(null);
  const [editStatus, setEditStatus] = useState("");
  const [editStudentName, setEditStudentName] = useState("");
  const [editRollNo, setEditRollNo] = useState("");
  const [editClaimedDate, setEditClaimedDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  const showSkeleton = isLoading || isRefreshing;

  // Raw input state (bound to inputs)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCountdown, setFilterCountdown] = useState("");

  // Debounced effective values — only updated when input ≥3 chars or empty
  const [activeSearch, setActiveSearch] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [searchHint, setSearchHint] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState<string | null>(null);

  // Track previous debounced values to prevent duplicate re-renders
  const prevSearchRef = useRef("");
  const prevLocationRef = useRef("");

  // Debounce search input — only activate at ≥3 chars
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) {
      setSearchHint(null);
      const t = setTimeout(() => {
        if (prevSearchRef.current !== "") { prevSearchRef.current = ""; setActiveSearch(""); }
      }, 400);
      return () => clearTimeout(t);
    }
    if (trimmed.length < 3) {
      setSearchHint("Enter at least 3 characters to search.");
      return; // Don't update activeSearch — avoids stale/partial-query results
    }
    setSearchHint(null);
    const t = setTimeout(() => {
      if (prevSearchRef.current !== trimmed) { prevSearchRef.current = trimmed; setActiveSearch(trimmed); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Debounce location input — only activate at ≥3 chars
  useEffect(() => {
    const trimmed = filterLocation.trim();
    if (trimmed.length === 0) {
      setLocationHint(null);
      const t = setTimeout(() => {
        if (prevLocationRef.current !== "") { prevLocationRef.current = ""; setActiveLocation(""); }
      }, 400);
      return () => clearTimeout(t);
    }
    if (trimmed.length < 3) {
      setLocationHint("Enter at least 3 characters to filter.");
      return;
    }
    setLocationHint(null);
    const t = setTimeout(() => {
      if (prevLocationRef.current !== trimmed) { prevLocationRef.current = trimmed; setActiveLocation(trimmed); }
    }, 400);
    return () => clearTimeout(t);
  }, [filterLocation]);

  const statusColor = (s: string) =>
    s === "Returned" ? "text-emerald-600 bg-emerald-100" : "text-amber-600 bg-amber-100";

  // Statistics: always computed from the FULL dataset — unaffected by search/filter state
  const statsItems = useMemo(() =>
    items.filter(item => item.status !== "Returned"),
    [items]
  );

  // Filtered + sorted items for the table (newest first)
  const filteredItems = useMemo(() =>
    items
      .filter(item => {
        if (item.status === "Returned") return false;
        if (item.status === "Not Returned" && getDaysInfo(item.reportedAt).isExpired) return false;
        if (!matchesLostSearch(item, activeSearch)) return false;
        if (!matchesLostLocation(item, activeLocation)) return false;
        const matchesCountdown = !filterCountdown || getDaysInfo(item.reportedAt).countdownStatus === filterCountdown;
        return matchesCountdown;
      })
      .sort((a, b) => parseDateTime(b.reportedAt) - parseDateTime(a.reportedAt)),
    [items, activeSearch, activeLocation, filterCountdown]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const clearFilters = () => {
    setSearchTerm(""); setActiveSearch(""); prevSearchRef.current = "";
    setFilterLocation(""); setActiveLocation(""); prevLocationRef.current = "";
    setSearchHint(null); setLocationHint(null);
    setCurrentPage(1);
  };

  const handleEdit = (item: AdminLostItem) => {
    if (item.status === "Returned") return;
    setEditItem(item); setEditStatus("Returned");
    // Pre-populate with reporter info (the person who lost the item) so validation passes
    setEditStudentName(item.reporterName || ""); setEditRollNo(item.reporterRoll || ""); setEditClaimedDate(item.claimedDate || "");
  };

  const handleSaveEdit = async () => {
    if (!editItem || isSaveLoading) return;
    if (!editStatus || editStatus.trim() === "") {
      toast.error("Validation Error", { description: "Status field is required.", duration: 4000 });
      return;
    }
    if (editStatus !== "Returned") {
      toast.error("Validation Error", { description: "Status must be Returned.", duration: 4000 });
      return;
    }
    const trimmedName = editStudentName.trim();
    const nameErr = validateName(trimmedName, "Student Name");
    if (nameErr) {
      toast.error("Validation Error", { description: nameErr, duration: 4000 });
      return;
    }
    const trimmedRoll = editRollNo.trim();

    setIsSaveLoading(true);
    try {
      await updateLostItemStatus(editItem.id, trimmedName, trimmedRoll);
      const now = formatNow();
      onReturn({
        id: editItem.id,
        type: "Lost",
        name: editItem.name,
        reportedDate: editItem.dateFound,
        closedDate: now,
        studentName: trimmedName,
        rollNo: trimmedRoll,
        location: editItem.location,
        reporter: editItem.reporterName,
        reporterPhone: editItem.reporterPhone,
        reporterEmail: editItem.reporterEmail,
      });
      toast.success("Item marked as Returned", {
        description: `${editItem.name} has been moved to Returned History.`,
        duration: 3500,
      });
      setEditItem(null);
      onRefresh?.();
    } catch (error) {
      console.error(error);
      toast.error("Failed to return item", { description: error instanceof Error ? error.message : "API Error", duration: 4000 });
    } finally {
      setIsSaveLoading(false);
    }
  };

  return (
    <main className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Lost Items</h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>Manage all lost items reported on campus</p>
      </div>

      {/* Countdown Summary Cards — always use full dataset, unaffected by search/filter */}
      <CountdownSummaryCards items={statsItems as Array<Record<string, string>>} dateField="reportedAt" isLoading={showSkeleton} />

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item name, reporter…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            />
            {searchHint && (
              <p className="absolute left-0 top-full mt-1 text-xs text-amber-500 z-10" style={{ fontFamily: "DM Sans, sans-serif" }}>{searchHint}</p>
            )}
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by location..."
              value={filterLocation}
              onChange={e => { setFilterLocation(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            />
            {locationHint && (
              <p className="absolute left-0 top-full mt-1 text-xs text-amber-500 z-10" style={{ fontFamily: "DM Sans, sans-serif" }}>{locationHint}</p>
            )}
          </div>
        </div>
        {/* Countdown filter row */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 font-medium shrink-0" style={{ fontFamily: "DM Sans, sans-serif" }}>Countdown:</span>
          {[
            { value: "", label: "All" },
            { value: "active", label: "🟢 Active" },
            { value: "expiring", label: "🟡 Expiring Soon" },
            { value: "last10", label: "🔴 Last 10 Days" },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterCountdown(opt.value); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterCountdown === opt.value ? "bg-cyan-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500" style={{ fontFamily: "DM Sans, sans-serif" }}>
          {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found · sorted by newest first
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["ITEM Name", "Lost Date", "Location", "Reporter", "Days Left", "Return"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-gray-600 font-semibold text-[11px] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {showSkeleton ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-3 bg-gray-100 rounded w-16 mt-1"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-20"></div><div className="h-3 bg-gray-100 rounded w-16 mt-1"></div></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded w-12"></div></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-gray-500 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    No items found matching your search criteria
                  </td>
                </tr>
              ) : pageItems.map((item, i) => (
                <tr key={item.id} className={`border-b border-gray-100 hover:bg-cyan-50/30 transition-colors ${i % 2 !== 0 ? "bg-gray-50/40" : ""}`}>
                  <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}><CardNameTooltip name={item.name} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {item.dateFound}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[130px]">
                    <span className="truncate block">{item.location}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-900"><CardNameTooltip name={item.reporterName} /></p>
                      <p className="text-[10px] text-gray-500">{item.reporterRoll}</p>
                      <p className="text-[10px] text-gray-500">{item.reporterPhone}</p>
                      <p className="text-[10px] text-cyan-600">{item.reporterEmail}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <CountdownChip dateStr={item.reportedAt} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => handleEdit(item)} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-50/50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100/50 hover:border-cyan-300 hover:text-cyan-900 transition-all duration-150" title="Return">
                        <Check size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdminTablePagination
          totalRecords={filteredItems.length}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={n => { setRowsPerPage(n); setCurrentPage(1); }}
        />
      </div>

      {editItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-1" style={{ fontFamily: "Outfit, sans-serif" }}>Edit Item Status</h2>
            <p className="text-xs text-gray-400 mb-4" style={{ fontFamily: "DM Sans, sans-serif" }}>Changing to "Returned" requires confirmation</p>
            {isSaveLoading ? (
              <div className="space-y-4 animate-pulse py-4">
                <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="animate-spin text-cyan-600" size={24} />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Item name read-only */}
                <div className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 flex items-center gap-2">
                  <span className="text-xs text-gray-500" style={{ fontFamily: "DM Sans, sans-serif" }}>Item:</span>
                  <span className="text-sm font-semibold text-gray-900" style={{ fontFamily: "DM Sans, sans-serif" }}>{editItem.name}</span>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-2" style={{ fontFamily: "DM Sans, sans-serif" }}>Status <span className="text-red-400">*</span></label>
                  <div
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50 text-gray-500 font-medium select-none"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
                  >
                    Returned
                  </div>
                </div>
              </div>
            )}
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setEditItem(null)}
                disabled={isSaveLoading}
                className="flex-1 px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaveLoading}
                className="flex-1 px-4 py-2 rounded-lg bg-cyan-600 text-white hover:bg-cyan-700 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={{ fontFamily: "DM Sans, sans-serif" }}
              >
                {isSaveLoading ? (
                  <>
                    <Loader2 className="animate-spin" size={14} />
                    Processing...
                  </>
                ) : (
                  "Continue →"
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

function formatNow(): string {
  const now = new Date();
  const day = String(now.getDate()).padStart(2, "0");
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const mon = months[now.getMonth()];
  const year = now.getFullYear();
  let h = now.getHours();
  const m = String(now.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${day} ${mon} ${year}, ${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

// ─── Synonym map for intelligent Found Items search ───────────────────
const FOUND_ITEM_SYNONYMS: Record<string, string[]> = {
  bag: ["backpack", "sack", "pouch", "tote", "knapsack", "haversack", "bagpack", "school bag", "travel bag", "handbag", "satchel", "kit bag", "gym bag", "skybag", "laptop bag", "duffle", "duffel", "leather bag"],
  backpack: ["bag", "school bag", "travel bag", "knapsack", "haversack", "bagpack", "rucksack", "skybag", "campus bag"],
  phone: ["mobile", "cell", "smartphone", "handphone", "iphone", "android", "cellphone", "handset"],
  mobile: ["phone", "cell", "smartphone", "handphone", "iphone", "android", "cellphone"],
  wallet: ["purse", "billfold", "card holder", "money clip"],
  bottle: ["water bottle", "flask", "tumbler", "sipper", "thermos", "canteen"],
  "water bottle": ["bottle", "flask", "tumbler", "sipper"],
  glasses: ["spectacles", "specs", "eyeglasses", "sunglasses", "shades", "goggles", "reading glasses", "frames"],
  spectacles: ["glasses", "specs", "eyeglasses", "frames"],
  keys: ["key", "keychain", "key ring", "keyring", "locket", "lanyard key"],
  key: ["keys", "keychain", "key ring", "keyring"],
  charger: ["adapter", "cable", "power adapter", "charging cable", "plug"],
  earphones: ["earbuds", "headphones", "headset", "airpods", "earpiece", "in-ear", "buds"],
  headphones: ["earphones", "earbuds", "headset", "over-ear"],
  umbrella: ["raincoat", "rain cover"],
  book: ["notebook", "textbook", "notes", "journal", "diary", "workbook"],
  notebook: ["book", "notes", "journal", "copy", "notepad"],
  pen: ["pencil", "marker", "ballpoint", "ink pen", "sketch pen", "highlighter"],
  pencil: ["pen", "eraser", "sketch"],
  calculator: ["calc", "scientific calculator"],
  laptop: ["computer", "pc", "macbook", "notebook computer", "chromebook"],
  watch: ["wristwatch", "timepiece", "clock", "smartwatch"],
  id: ["id card", "identity card", "student id", "college id", "college card", "access card", "pass"],
  "id card": ["identity card", "student id", "college card", "access card", "id"],
  earring: ["earrings", "stud", "hoop", "jewelry"],
  necklace: ["chain", "pendant", "locket", "jewelry"],
  ring: ["band", "finger ring", "jewelry"],
  bracelet: ["bangle", "wristband", "jewelry"],
};

/** Expand a single query word into all synonym terms (including itself). */
function getFoundSynonymTerms(word: string): string[] {
  const lower = word.toLowerCase();
  const synonyms = FOUND_ITEM_SYNONYMS[lower] || [];
  const reverseMatches = Object.entries(FOUND_ITEM_SYNONYMS)
    .filter(([, syns]) => syns.some(s => s.toLowerCase() === lower))
    .map(([key]) => key);
  return [lower, ...synonyms.map(s => s.toLowerCase()), ...reverseMatches];
}

/**
 * Intelligent multi-strategy matcher for Found Items.
 * Checks item name + date against: partial, keyword, synonym.
 */
function matchesFoundSearch(item: AdminFoundItem, query: string): boolean {
  if (!query) return true;
  const q = query.trim().toLowerCase();
  if (!q) return true;

  const nameHaystack = item.name.toLowerCase();
  const dateHaystack = item.dateFound.toLowerCase();
  const combined = `${nameHaystack} ${dateHaystack}`;

  // 1. Partial / substring match on name or date
  if (nameHaystack.includes(q) || dateHaystack.includes(q)) return true;

  // 2. Keyword match: all words in query appear in the combined haystack
  const queryWords = q.split(/\s+/).filter(Boolean);
  if (queryWords.length > 1 && queryWords.every(w => combined.includes(w))) return true;

  // 3. Synonym match: expand each word and check against item name
  for (const word of queryWords) {
    const terms = getFoundSynonymTerms(word);
    if (terms.some(term => nameHaystack.includes(term))) return true;
  }

  return false;
}

/** Case-insensitive partial location match. */
function matchesFoundLocation(item: AdminFoundItem, query: string): boolean {
  if (!query) return true;
  return item.location.toLowerCase().includes(query.trim().toLowerCase());
}

function FoundItemsPage({ items, setItems, onReturn, isLoading, onRefresh }: { items: AdminFoundItem[]; setItems: React.Dispatch<React.SetStateAction<AdminFoundItem[]>>; onReturn: (r: ReturnedLostRecord) => void; isLoading?: boolean; onRefresh?: () => void }) {
  const [editItem, setEditItem] = useState<AdminFoundItem | null>(null);
  const [pendingReturnItem, setPendingReturnItem] = useState<AdminFoundItem | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [isModalLoading, setIsModalLoading] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [editStatus, setEditStatus] = useState("");
  const [editStudentName, setEditStudentName] = useState("");
  const [editRollNo, setEditRollNo] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editReturnedDate, setEditReturnedDate] = useState(getTodayDateString());
  const [editReturnedTime, setEditReturnedTime] = useState("");
  const [editRemarks, setEditRemarks] = useState("");

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSaveLoading, setIsSaveLoading] = useState(false);

  // Raw input state (bound to inputs)
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLocation, setFilterLocation] = useState("");
  const [filterCountdown, setFilterCountdown] = useState("");

  // Debounced effective values — only updated when input ≥3 chars or empty
  const [activeSearch, setActiveSearch] = useState("");
  const [activeLocation, setActiveLocation] = useState("");
  const [searchHint, setSearchHint] = useState<string | null>(null);
  const [locationHint, setLocationHint] = useState<string | null>(null);

  // Track previous debounced values to prevent duplicate re-renders
  const prevSearchRef = useRef("");
  const prevLocationRef = useRef("");

  // Debounce search input — only activate at ≥3 chars
  useEffect(() => {
    const trimmed = searchTerm.trim();
    if (trimmed.length === 0) {
      setSearchHint(null);
      const t = setTimeout(() => {
        if (prevSearchRef.current !== "") { prevSearchRef.current = ""; setActiveSearch(""); }
      }, 400);
      return () => clearTimeout(t);
    }
    if (trimmed.length < 3) {
      setSearchHint("Enter at least 3 characters to search.");
      return;
    }
    setSearchHint(null);
    const t = setTimeout(() => {
      if (prevSearchRef.current !== trimmed) { prevSearchRef.current = trimmed; setActiveSearch(trimmed); }
    }, 400);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Debounce location input — only activate at ≥3 chars
  useEffect(() => {
    const trimmed = filterLocation.trim();
    if (trimmed.length === 0) {
      setLocationHint(null);
      const t = setTimeout(() => {
        if (prevLocationRef.current !== "") { prevLocationRef.current = ""; setActiveLocation(""); }
      }, 400);
      return () => clearTimeout(t);
    }
    if (trimmed.length < 3) {
      setLocationHint("Enter at least 3 characters to filter.");
      return;
    }
    setLocationHint(null);
    const t = setTimeout(() => {
      if (prevLocationRef.current !== trimmed) { prevLocationRef.current = trimmed; setActiveLocation(trimmed); }
    }, 400);
    return () => clearTimeout(t);
  }, [filterLocation]);

  // Statistics: always computed from the FULL dataset — unaffected by search/filter state
  const statsItems = useMemo(() =>
    items.filter(item => item.status !== "Returned"),
    [items]
  );

  // Filtered + sorted items for the table (newest first by foundAt)
  const filteredItems = useMemo(() =>
    items
      .filter(item => {
        if (item.status === "Returned") return false;
        if (item.status === "Not Returned" && getDaysInfo(item.foundAt).isExpired) return false;
        if (!matchesFoundSearch(item, activeSearch)) return false;
        if (!matchesFoundLocation(item, activeLocation)) return false;
        const matchesCountdown = !filterCountdown || getDaysInfo(item.foundAt).countdownStatus === filterCountdown;
        return matchesCountdown;
      })
      .sort((a, b) => parseDateTime(b.foundAt) - parseDateTime(a.foundAt)),
    [items, activeSearch, activeLocation, filterCountdown]
  );

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / rowsPerPage));
  const safePage = Math.min(currentPage, totalPages);
  const pageItems = filteredItems.slice((safePage - 1) * rowsPerPage, safePage * rowsPerPage);

  const openModal = (item: AdminFoundItem) => {
    if (item.status === "Returned") return;
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setEditItem(item);
    setEditStatus("Returned");
    setEditStudentName(item.studentName || "");
    setEditRollNo(item.rollNo || "");
    setEditPhone("");
    setEditEmail("");
    // Pre-fill date=today and time=now so the button can enable once text fields are valid
    const _now = new Date();
    setEditReturnedDate(item.returnedDate || getTodayDateString());
    setEditReturnedTime(`${String(_now.getHours()).padStart(2, "0")}:${String(_now.getMinutes()).padStart(2, "0")}`);
    setEditRemarks("");
    setFieldErrors({});
    setIsSaveLoading(false);
    setIsModalLoading(true);
    setTimeout(() => {
      setIsModalLoading(false);
    }, 450);
    requestAnimationFrame(() => requestAnimationFrame(() => setModalVisible(true)));
  };

  const closeModal = () => {
    setModalVisible(false);
    closeTimerRef.current = setTimeout(() => setEditItem(null), 260);
  };

  const isReturnValid = editStatus === "Returned" &&
    !validateReturnStudentName(editStudentName) &&
    !validateReturnRollNo(editRollNo) &&
    !validateReturnPhone(editPhone) &&
    !validateReturnEmail(editEmail, editRollNo) &&
    !validateReturnedDate(editReturnedDate, editItem?.dateFound ?? "") &&
    !validateReturnedTime(editReturnedTime, editReturnedDate) &&
    !validateReturnRemarks(editRemarks);

  const handleSaveEdit = async () => {
    if (!editItem || isSaveLoading) return;
    if (editStatus === "Returned") {
      const errors: Record<string, string> = {};
      const nameErr = validateReturnStudentName(editStudentName);
      if (nameErr) errors.name = nameErr;
      const rollErr = validateReturnRollNo(editRollNo);
      if (rollErr) errors.roll = rollErr;
      const phoneErr = validateReturnPhone(editPhone);
      if (phoneErr) errors.phone = phoneErr;
      const emailErr = validateReturnEmail(editEmail, editRollNo);
      if (emailErr) errors.email = emailErr;
      const dateErr = validateReturnedDate(editReturnedDate, editItem.dateFound);
      if (dateErr) errors.date = dateErr;
      const timeErr = validateReturnedTime(editReturnedTime, editReturnedDate);
      if (timeErr) errors.time = timeErr;
      const remarksErr = validateReturnRemarks(editRemarks);
      if (remarksErr) errors.remarks = remarksErr;

      if (Object.keys(errors).length > 0) {
        setFieldErrors(errors);

        const focusOrder = [
          { key: "name", id: "edit-student-name" },
          { key: "roll", id: "edit-roll-no" },
          { key: "phone", id: "edit-phone" },
          { key: "email", id: "edit-email" },
          { key: "date", id: "edit-returned-date" },
          { key: "time", id: "edit-returned-time" },
          { key: "remarks", id: "edit-remarks" }
        ];

        for (const item of focusOrder) {
          if (errors[item.key]) {
            const el = document.getElementById(item.id);
            if (el) {
              el.focus();
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
            break;
          }
        }
        return;
      }

      setFieldErrors({});
      setIsSaveLoading(true);

      const trimmedName = editStudentName.trim();
      const trimmedRoll = editRollNo.trim().toLowerCase();
      const trimmedPhone = editPhone.trim();
      const trimmedEmail = editEmail.trim().toLowerCase();

      try {
        await updateFoundItemStatus(editItem.id, trimmedName, trimmedRoll, trimmedPhone, trimmedEmail);
        const now = formatNow();
        onReturn({
          id: editItem.id,
          type: "Found",
          name: editItem.name,
          reportedDate: editItem.dateFound,
          closedDate: now,
          studentName: trimmedName,
          rollNo: trimmedRoll,
          location: editItem.location,
          reporter: "",
          reporterPhone: "",
          reporterEmail: "",
        });
        toast.success("Item marked as Returned", {
          description: `${editItem.name} has been moved to Returned History.`,
          duration: 3500,
        });
        closeModal();
        onRefresh?.();
      } catch (error) {
        console.error(error);
        toast.error("Failed to return item", { description: error instanceof Error ? error.message : "API Error", duration: 4000 });
      } finally {
        setIsSaveLoading(false);
      }
    }
  };

  const fLabel = "block text-xs font-semibold text-gray-600 mb-1.5";
  const fInput = "w-full bg-white border border-gray-200 rounded-lg px-3 py-2.5 text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20 transition-all";

  return (
    <main className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
      <div className="mb-4">
        <h1 className="text-xl font-bold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Found Items</h1>
        <p className="text-gray-600 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>Manage all found items on campus</p>
      </div>

      {/* Countdown Summary Cards — always use full dataset, unaffected by search/filter */}
      <CountdownSummaryCards items={statsItems as Array<Record<string, string>>} dateField="foundAt" />

      {/* Search and Filters */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4 mb-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search by item name, date…"
              value={searchTerm}
              onChange={e => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            />
            {searchHint && (
              <p className="absolute left-0 top-full mt-1 text-xs text-amber-500 z-10" style={{ fontFamily: "DM Sans, sans-serif" }}>{searchHint}</p>
            )}
          </div>
          <div className="relative">
            <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Filter by location..."
              value={filterLocation}
              onChange={e => { setFilterLocation(e.target.value); setCurrentPage(1); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-500/20"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            />
            {locationHint && (
              <p className="absolute left-0 top-full mt-1 text-xs text-amber-500 z-10" style={{ fontFamily: "DM Sans, sans-serif" }}>{locationHint}</p>
            )}
          </div>
        </div>
        {/* Countdown filter row */}
        <div className="mt-3 flex items-center gap-3 flex-wrap">
          <span className="text-xs text-gray-500 font-medium shrink-0" style={{ fontFamily: "DM Sans, sans-serif" }}>Countdown:</span>
          {[
            { value: "", label: "All" },
            { value: "active", label: "🟢 Active" },
            { value: "expiring", label: "🟡 Expiring Soon" },
            { value: "last10", label: "🔴 Last 10 Days" },
          ].map(opt => (
            <button
              key={opt.value}
              onClick={() => { setFilterCountdown(opt.value); setCurrentPage(1); }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${filterCountdown === opt.value ? "bg-cyan-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <div className="mt-2 text-xs text-gray-500" style={{ fontFamily: "DM Sans, sans-serif" }}>
          {filteredItems.length} item{filteredItems.length !== 1 ? "s" : ""} found · sorted by newest first
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50">
                {["ITEM Name", "Found Date", "Location", "Days Left", "Return"].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-gray-600 font-semibold text-[11px] uppercase tracking-wide whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`skeleton-${idx}`} className="border-b border-gray-100 animate-pulse">
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-28"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div><div className="h-3 bg-gray-100 rounded w-16 mt-1"></div></td>
                    <td className="px-4 py-4"><div className="h-4 bg-gray-200 rounded w-24"></div></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded-full w-16"></div></td>
                    <td className="px-4 py-4"><div className="h-6 bg-gray-200 rounded w-12"></div></td>
                  </tr>
                ))
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-gray-500 text-sm" style={{ fontFamily: "DM Sans, sans-serif" }}>
                    No items found matching your search criteria
                  </td>
                </tr>
              ) : pageItems.map((item, i) => (
                <tr key={item.id} className={`border-b border-gray-100 hover:bg-cyan-50/30 transition-colors ${i % 2 !== 0 ? "bg-gray-50/40" : ""}`}>
                  <td className="px-4 py-3 text-gray-900 font-medium whitespace-nowrap" style={{ fontFamily: "DM Sans, sans-serif" }}><CardNameTooltip name={item.name} /></td>
                  <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                    {item.dateFound}
                  </td>
                  <td className="px-4 py-3 text-gray-600 max-w-[130px]">
                    <span className="truncate block">{item.location}</span>
                  </td>
                  <td className="px-4 py-3">
                    <CountdownChip dateStr={item.foundAt} />
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <button onClick={() => openModal(item)} className="inline-flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-50/50 border border-cyan-200 text-cyan-800 hover:bg-cyan-100/50 hover:border-cyan-300 hover:text-cyan-900 transition-all duration-150" title="Return">
                        <Check size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <AdminTablePagination
          totalRecords={filteredItems.length}
          currentPage={currentPage}
          rowsPerPage={rowsPerPage}
          onPageChange={setCurrentPage}
          onRowsPerPageChange={n => { setRowsPerPage(n); setCurrentPage(1); }}
        />
      </div>

      {/* ── Edit Found Item Modal ─────────────────────────────────────────── */}
      {editItem && (
        <div
          onClick={closeModal}
          style={{
            position: "fixed", inset: 0, zIndex: 50,
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: "1rem",
            background: modalVisible ? "rgba(15,23,42,0.52)" : "rgba(15,23,42,0)",
            backdropFilter: modalVisible ? "blur(4px)" : "blur(0px)",
            transition: "background 0.25s ease, backdrop-filter 0.25s ease",
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: "white",
              borderRadius: "14px",
              boxShadow: "0 25px 60px #00000030, 0 8px 20px #0000001a",
              width: "100%",
              maxWidth: "520px",
              maxHeight: "92vh",
              overflowY: "auto",
              opacity: modalVisible ? 1 : 0,
              transform: modalVisible ? "scale(1) translateY(0)" : "scale(0.96) translateY(10px)",
              transition: "opacity 0.25s ease, transform 0.25s ease",
            }}
          >
            {/* Modal header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid #f0f0f0", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h2 style={{ fontFamily: "Outfit, sans-serif", fontSize: "1rem", fontWeight: 700, color: "#111827", margin: 0 }}>Edit Item Status</h2>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "#6b7280", marginTop: "2px" }}>Update return details for this found item</p>
              </div>
              <button
                onClick={closeModal}
                style={{ width: 30, height: 30, borderRadius: 8, border: "1px solid #e5e7eb", background: "#f9fafb", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer", color: "#6b7280", transition: "all 0.15s" }}
                onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "#fee2e2"; (e.currentTarget as HTMLButtonElement).style.color = "#ef4444"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#fecaca"; }}
                onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; (e.currentTarget as HTMLButtonElement).style.color = "#6b7280"; (e.currentTarget as HTMLButtonElement).style.borderColor = "#e5e7eb"; }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" /></svg>
              </button>
            </div>

            {/* Modal body */}
            <div style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>

              {/* Item Name (read-only) */}
              <div>
                <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Item Name</label>
                <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 8, padding: "10px 12px", fontSize: 14, color: "#374151", fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#9ca3af" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><path d="M9 9h6M9 12h6M9 15h4" /></svg>
                  <span style={{ fontWeight: 500, color: "#111827" }}>{editItem.name}</span>
                </div>
              </div>

              {/* Status */}
              <div>
                <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>
                  Status <span style={{ color: "#ef4444" }}>*</span>
                </label>
                <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: 8, padding: "10px 12px", fontSize: 14, fontFamily: "DM Sans, sans-serif", display: "flex", alignItems: "center", gap: 8, fontWeight: 600, color: "#15803d" }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12" /></svg>
                  Returned
                </div>
              </div>

              {isModalLoading ? (
                <div className="space-y-4 animate-pulse">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div style={{ height: 16, width: 80, background: "#e2e8f0", borderRadius: 4, marginBottom: 6 }}></div>
                      <div style={{ height: 38, background: "#e2e8f0", borderRadius: 8 }}></div>
                    </div>
                    <div>
                      <div style={{ height: 16, width: 80, background: "#e2e8f0", borderRadius: 4, marginBottom: 6 }}></div>
                      <div style={{ height: 38, background: "#e2e8f0", borderRadius: 8 }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div style={{ height: 16, width: 80, background: "#e2e8f0", borderRadius: 4, marginBottom: 6 }}></div>
                      <div style={{ height: 38, background: "#e2e8f0", borderRadius: 8 }}></div>
                    </div>
                    <div>
                      <div style={{ height: 16, width: 80, background: "#e2e8f0", borderRadius: 4, marginBottom: 6 }}></div>
                      <div style={{ height: 38, background: "#e2e8f0", borderRadius: 8 }}></div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <div style={{ height: 16, width: 80, background: "#e2e8f0", borderRadius: 4, marginBottom: 6 }}></div>
                      <div style={{ height: 38, background: "#e2e8f0", borderRadius: 8 }}></div>
                    </div>
                    <div>
                      <div style={{ height: 16, width: 80, background: "#e2e8f0", borderRadius: 4, marginBottom: 6 }}></div>
                      <div style={{ height: 38, background: "#e2e8f0", borderRadius: 8 }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                editStatus === "Returned" && (
                  <>
                    {/* Student Name + Roll Number */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Student Name <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          id="edit-student-name"
                          type="text"
                          disabled={isSaveLoading}
                          value={editStudentName}
                          onChange={e => { setEditStudentName(e.target.value); setFieldErrors(prev => ({ ...prev, name: "" })); }}
                          onBlur={e => setFieldErrors(prev => ({ ...prev, name: validateReturnStudentName(e.target.value) || "" }))}
                          placeholder="Full name"
                          className={fInput}
                          style={{ fontFamily: "DM Sans, sans-serif", ...(fieldErrors.name ? { borderColor: "#ef4444", boxShadow: "0 0 0 2px #fee2e2" } : {}) }}
                        />
                        {fieldErrors.name && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>{fieldErrors.name}</p>}
                      </div>
                      <div>
                        <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Roll Number <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          id="edit-roll-no"
                          type="text"
                          disabled={isSaveLoading}
                          value={editRollNo}
                          onChange={e => {
                            const val = e.target.value.toLowerCase();
                            setEditRollNo(val);
                            setFieldErrors(prev => {
                              const updatedErrors: Record<string, string> = { ...prev, roll: validateReturnRollNo(val) || "" };
                              if (editEmail) {
                                updatedErrors.email = validateReturnEmail(editEmail, val) || "";
                              }
                              return updatedErrors;
                            });
                          }}
                          onBlur={e => {
                            const val = e.target.value.trim().toLowerCase();
                            setEditRollNo(val);
                            setFieldErrors(prev => {
                              const updatedErrors: Record<string, string> = { ...prev, roll: validateReturnRollNo(val) || "" };
                              if (editEmail) {
                                updatedErrors.email = validateReturnEmail(editEmail, val) || "";
                              }
                              return updatedErrors;
                            });
                          }}
                          placeholder="e.g. 25bcaiot23"
                          className={fInput}
                          style={{ fontFamily: "DM Sans, sans-serif", ...(fieldErrors.roll ? { borderColor: "#ef4444", boxShadow: "0 0 0 2px #fee2e2" } : {}) }}
                        />
                        {fieldErrors.roll && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>{fieldErrors.roll}</p>}
                      </div>
                    </div>

                    {/* Phone + Email */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Phone Number <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          id="edit-phone"
                          type="tel"
                          disabled={isSaveLoading}
                          value={editPhone}
                          onChange={e => { setEditPhone(e.target.value); setFieldErrors(prev => ({ ...prev, phone: "" })); }}
                          onBlur={e => setFieldErrors(prev => ({ ...prev, phone: validateReturnPhone(e.target.value) || "" }))}
                          placeholder="+91 9876543210"
                          className={fInput}
                          style={{ fontFamily: "DM Sans, sans-serif", ...(fieldErrors.phone ? { borderColor: "#ef4444", boxShadow: "0 0 0 2px #fee2e2" } : {}) }}
                        />
                        {fieldErrors.phone && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>{fieldErrors.phone}</p>}
                      </div>
                      <div>
                        <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Email Address <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          id="edit-email"
                          type="email"
                          disabled={isSaveLoading}
                          value={editEmail}
                          onChange={e => {
                            const val = e.target.value.toLowerCase().replace(/\s/g, "");
                            setEditEmail(val);
                            setFieldErrors(prev => ({ ...prev, email: validateReturnEmail(val, editRollNo) || "" }));
                          }}
                          onBlur={e => {
                            const val = e.target.value.trim().toLowerCase();
                            setEditEmail(val);
                            setFieldErrors(prev => ({ ...prev, email: validateReturnEmail(val, editRollNo) || "" }));
                          }}
                          placeholder="rollno@kristujayanti.com"
                          className={fInput}
                          style={{ fontFamily: "DM Sans, sans-serif", ...(fieldErrors.email ? { borderColor: "#ef4444", boxShadow: "0 0 0 2px #fee2e2" } : {}) }}
                        />
                        {fieldErrors.email && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>{fieldErrors.email}</p>}
                      </div>
                    </div>

                    {/* Returned Date + Time */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <style>{`
                        #edit-returned-date::-webkit-calendar-picker-indicator,
                        #edit-returned-time::-webkit-calendar-picker-indicator {
                          display: none !important;
                          -webkit-appearance: none !important;
                        }
                      `}</style>
                      <div>
                        <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Returned Date <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          id="edit-returned-date"
                          type="date"
                          readOnly
                          disabled={isSaveLoading}
                          value={editReturnedDate}
                          max={getTodayDateString()}
                          onChange={e => { setEditReturnedDate(e.target.value); setFieldErrors(prev => ({ ...prev, date: "", time: "" })); }}
                          onBlur={e => {
                            const d = e.target.value;
                            setFieldErrors(prev => ({
                              ...prev,
                              date: validateReturnedDate(d, editItem?.dateFound ?? "") || "",
                              time: editReturnedTime ? (validateReturnedTime(editReturnedTime, d) || "") : prev.time,
                            }));
                          }}
                          className={fInput}
                          style={{ fontFamily: "DM Sans, sans-serif", colorScheme: "light", ...(fieldErrors.date ? { borderColor: "#ef4444", boxShadow: "0 0 0 2px #fee2e2" } : {}) }}
                        />
                        {fieldErrors.date && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>{fieldErrors.date}</p>}
                      </div>
                      <div>
                        <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif" }}>Returned Time <span style={{ color: "#ef4444" }}>*</span></label>
                        <input
                          id="edit-returned-time"
                          type="time"
                          readOnly
                          disabled={isSaveLoading}
                          value={editReturnedTime}
                          onChange={e => { setEditReturnedTime(e.target.value); setFieldErrors(prev => ({ ...prev, time: "" })); }}
                          onBlur={e => setFieldErrors(prev => ({ ...prev, time: validateReturnedTime(e.target.value, editReturnedDate) || "" }))}
                          className={fInput}
                          style={{ fontFamily: "DM Sans, sans-serif", colorScheme: "light", ...(fieldErrors.time ? { borderColor: "#ef4444", boxShadow: "0 0 0 2px #fee2e2" } : {}) }}
                        />
                        {fieldErrors.time && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>{fieldErrors.time}</p>}
                      </div>
                    </div>
                  </>
                )
              )}

              {/* Remarks */}
              <div>
                <label className={fLabel} style={{ fontFamily: "DM Sans, sans-serif", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>Remarks / Notes <span style={{ color: "#9ca3af", fontWeight: 400 }}>(Optional)</span></span>
                  <span style={{ color: editRemarks.trim().length > 500 ? "#ef4444" : "#9ca3af", fontSize: 11, fontWeight: 400 }}>{editRemarks.trim().length}/500</span>
                </label>
                <textarea
                  id="edit-remarks"
                  rows={3}
                  disabled={isModalLoading || isSaveLoading}
                  value={editRemarks}
                  onChange={e => { setEditRemarks(e.target.value); setFieldErrors(prev => ({ ...prev, remarks: "" })); }}
                  placeholder="Add any additional notes or remarks…"
                  className={fInput}
                  style={{ fontFamily: "DM Sans, sans-serif", resize: "none", ...(fieldErrors.remarks ? { borderColor: "#ef4444", boxShadow: "0 0 0 2px #fee2e2" } : {}) }}
                />
                {fieldErrors.remarks && <p style={{ color: "#ef4444", fontSize: 11, marginTop: 4, fontFamily: "DM Sans, sans-serif" }}>{fieldErrors.remarks}</p>}
              </div>

              {/* Record Information */}
              <div style={{ background: "#f8fafc", border: "1px solid #e5e7eb", borderRadius: 10, padding: "14px 16px" }}>
                <p style={{ fontFamily: "Outfit, sans-serif", fontSize: 12, fontWeight: 700, color: "#374151", marginBottom: 10, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Record Information
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
                  {[
                    { label: "Created At", value: editItem.foundAt },
                    { label: "Updated At", value: editItem.lastUpdated },
                    { label: "Updated By", value: "Admin" },
                  ].map(row => (
                    <div key={row.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#6b7280" }}>{row.label}</span>
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "#111827", fontWeight: 500 }}>{row.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div style={{ padding: "0 24px 20px", display: "flex", gap: 10 }}>
              <button
                onClick={closeModal}
                disabled={isSaveLoading}
                style={{ flex: 1, padding: "10px 0", borderRadius: 9, border: "1px solid #d1d5db", background: "white", color: "#374151", fontSize: 14, fontWeight: 500, fontFamily: "DM Sans, sans-serif", cursor: isSaveLoading ? "not-allowed" : "pointer", transition: "all 0.15s" }}
                onMouseEnter={e => { if (!isSaveLoading) (e.currentTarget as HTMLButtonElement).style.background = "#f9fafb"; }}
                onMouseLeave={e => { if (!isSaveLoading) (e.currentTarget as HTMLButtonElement).style.background = "white"; }}
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                disabled={isSaveLoading || isModalLoading || !isReturnValid || Object.values(fieldErrors).some(err => !!err)}
                style={{
                  flex: 1, padding: "10px 0", borderRadius: 9, border: "none",
                  background: (!isSaveLoading && !isModalLoading && isReturnValid && !Object.values(fieldErrors).some(err => !!err)) ? "#0891b2" : "#e5e7eb",
                  color: (!isSaveLoading && !isModalLoading && isReturnValid && !Object.values(fieldErrors).some(err => !!err)) ? "white" : "#9ca3af",
                  fontSize: 14, fontWeight: 600, fontFamily: "DM Sans, sans-serif",
                  cursor: (!isSaveLoading && !isModalLoading && isReturnValid && !Object.values(fieldErrors).some(err => !!err)) ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                  opacity: isSaveLoading ? 0.85 : 1,
                }}
                onMouseEnter={e => { if (!isSaveLoading && !isModalLoading && isReturnValid && !Object.values(fieldErrors).some(err => !!err)) (e.currentTarget as HTMLButtonElement).style.background = "#0e7490"; }}
                onMouseLeave={e => { if (!isSaveLoading && !isModalLoading && isReturnValid && !Object.values(fieldErrors).some(err => !!err)) (e.currentTarget as HTMLButtonElement).style.background = "#0891b2"; }}
              >
                {isSaveLoading ? (
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>
                ) : (
                  <>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" /><polyline points="17 21 17 13 7 13 7 21" /><polyline points="7 3 7 8 15 8" /></svg>
                    Continue →
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </main>
  );
}

const CLAIMED_PAGE_SIZE = 10;

function GuidelinesPage() {
  const [active, setActive] = useState<"lost" | "found">("lost");

  const lostRules = [
    "Verify student ID before releasing any item to ensure proper ownership.",
    "The claimant should correctly describe the item appearance, brand/model, and any special marks or accessories.",
    "For electronic items, students may be asked to unlock the device or verify ownership.",
    "Admin should verify matching details from the Lost Item report before returning the item.",
    "If ownership is unclear, the item should remain under admin review until verification is complete.",
    "Items unclaimed after 60 days will be donated or disposed of responsibly.",
  ];

  const foundRules = [
    "Food items, damaged items, or unsafe materials should not be accepted.",
    "Every found item must be entered into the system immediately after submission.",
    "Admin must collect complete details of the found item: item name, color/brand, location found, and date & time found.",
    "Ensure storage areas are locked and secure at all times.",
  ];

  const RuleList = ({ rules, accent }: { rules: string[]; accent: "cyan" | "amber" }) => (
    <div className="space-y-3">
      {rules.map((g, i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100">
          <span className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${accent === "cyan" ? "bg-cyan-100" : "bg-amber-100"}`}>
            <CheckCircle size={14} className={accent === "cyan" ? "text-cyan-600" : "text-amber-600"} />
          </span>
          <p className="text-gray-700 text-sm leading-relaxed" style={{ fontFamily: "DM Sans, sans-serif" }}>{g}</p>
        </div>
      ))}
    </div>
  );

  return (
    <main className="flex-1 overflow-y-auto px-5 py-6 bg-gray-50">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Admin Guidelines</h1>
        <p className="text-gray-600 text-sm mb-6" style={{ fontFamily: "DM Sans, sans-serif" }}>Essential protocols for managing lost and found items</p>

        {/* Toggle Switch */}
        <div className="inline-flex rounded-xl border border-gray-200 bg-white shadow-sm p-1 mb-6">
          <button
            onClick={() => setActive("lost")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active === "lost"
              ? "bg-cyan-600 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            <AlertCircle size={14} />
            Lost Items Rules
          </button>
          <button
            onClick={() => setActive("found")}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${active === "found"
              ? "bg-amber-500 text-white shadow-sm"
              : "text-gray-500 hover:text-gray-700"
              }`}
            style={{ fontFamily: "DM Sans, sans-serif" }}
          >
            <CheckSquare size={14} />
            Found Items Rules
          </button>
        </div>

        {/* Active Panel */}
        {active === "lost" ? (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-cyan-100 flex items-center justify-center shrink-0">
                <AlertCircle size={18} className="text-cyan-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Lost Items Rules</h2>
                <p className="text-gray-500 text-xs" style={{ fontFamily: "DM Sans, sans-serif" }}>Protocols for returning lost items to students</p>
              </div>
            </div>
            <RuleList rules={lostRules} accent="cyan" />
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-9 h-9 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
                <CheckSquare size={18} className="text-amber-600" />
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900" style={{ fontFamily: "Outfit, sans-serif" }}>Found Items Rules</h2>
                <p className="text-gray-500 text-xs" style={{ fontFamily: "DM Sans, sans-serif" }}>Protocols for accepting and storing found items</p>
              </div>
            </div>
            <RuleList rules={foundRules} accent="amber" />
          </div>
        )}
      </div>
    </main>
  );
}

function SettingsPage({ onLogoutRequest, isLoggingOut }: { onLogoutRequest: () => void; isLoggingOut?: boolean }) {
  return (
    <main className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Outfit, sans-serif" }}>Settings</h1>
        <p className="text-gray-600 text-sm mb-6" style={{ fontFamily: "DM Sans, sans-serif" }}>Manage your account and preferences</p>

        <div className="space-y-4">
          {/* Account Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Account</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: "DM Sans, sans-serif" }}>Email</p>
                  <p className="text-xs text-gray-500">admin@campus.edu</p>
                </div>
              </div>
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900" style={{ fontFamily: "DM Sans, sans-serif" }}>Role</p>
                  <p className="text-xs text-gray-500">Administrator</p>
                </div>
              </div>
            </div>
          </div>

          {/* Logout Section */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
            <h2 className="text-base font-semibold text-gray-900 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Session</h2>
            <button
              onClick={onLogoutRequest}
              disabled={isLoggingOut}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 hover:border-red-300 font-medium text-sm transition-all duration-150 w-full justify-center border border-red-200 ${isLoggingOut ? "opacity-50 cursor-not-allowed" : ""}`}
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              {isLoggingOut ? <Loader2 size={16} className="animate-spin" /> : <LogOut size={16} />}
              {isLoggingOut ? "Logging out..." : "Logout"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}

function AdminView({ onLogout }: { onLogout: () => void }) {
  const [activeNav, setActiveNav] = useState("lost-items");
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Shared item state lifted here so pages can communicate
  const [sharedFoundItems, setSharedFoundItems] = useState<AdminFoundItem[]>([]);
  const [sharedLostItems, setSharedLostItems] = useState<AdminLostItem[]>([]);
  const [disposedHistory, setDisposedHistory] = useState<DisposedRecord[]>([]);
  const [returnedHistory, setReturnedHistory] = useState<ReturnedHistoryRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lostIsStale, setLostIsStale] = useState(true);
  const [foundIsStale, setFoundIsStale] = useState(true);

  const loadNavData = async (nav: string, force = false) => {
    if (nav !== "lost-items" && nav !== "found-items" && nav !== "expired-items") {
      return;
    }

    if (!force) {
      if (nav === "lost-items" && !lostIsStale) return;
      if (nav === "found-items" && !foundIsStale) return;
      if (nav === "expired-items" && !lostIsStale && !foundIsStale) return;
    }

    setIsLoading(true);
    try {
      if (nav === "lost-items") {
        const lost = await getAdminLostItems("Not Returned");
        setSharedLostItems(lost);
        setLostIsStale(false);
      } else if (nav === "found-items") {
        const found = await getAdminFoundItems("Not Returned");
        setSharedFoundItems(found);
        setFoundIsStale(false);
      } else if (nav === "expired-items") {
        const promises: Promise<any>[] = [];
        const shouldFetchLost = force || lostIsStale;
        const shouldFetchFound = force || foundIsStale;

        if (shouldFetchLost) promises.push(getAdminLostItems("Not Returned"));
        else promises.push(Promise.resolve(null));

        if (shouldFetchFound) promises.push(getAdminFoundItems("Not Returned"));
        else promises.push(Promise.resolve(null));

        const [lost, found] = await Promise.all(promises);
        if (lost !== null) {
          setSharedLostItems(lost);
          setLostIsStale(false);
        }
        if (found !== null) {
          setSharedFoundItems(found);
          setFoundIsStale(false);
        }
      }
      // Note: History page loads its own active-tab data dynamically inside ItemHistoryPage, so no fetching here.
    } catch (error) {
      console.error(`Failed to load ${nav} data`, error);
      toast.error("Unable to load dashboard data", {
        description: error instanceof Error ? error.message : "Please check the Render API connection.",
        duration: 4500,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const refreshData = async () => {
    if (activeNav === "lost-items") setLostIsStale(true);
    if (activeNav === "found-items") setFoundIsStale(true);
    if (activeNav === "expired-items") {
      setLostIsStale(true);
      setFoundIsStale(true);
    }
  };

  const handleItemCreated = async (type: "lost" | "found") => {
    if (type === "lost") {
      setLostIsStale(true);
      setActiveNav("lost-items");
      toast.success("Item reported successfully!");
    } else {
      setFoundIsStale(true);
      setActiveNav("found-items");
      toast.success("Item reported successfully!");
    }
  };

  useEffect(() => {
    if (isLoggingOut) return;
    loadNavData(activeNav);
  }, [activeNav, lostIsStale, foundIsStale, isLoggingOut]);

  const handleDispose = (record: DisposedRecord) => {
    setDisposedHistory(prev => [record, ...prev]);
  };

  const handleReturn = (record: ReturnedLostRecord) => {
    setReturnedHistory(prev => [record, ...prev]);
  };

  const handleNavChange = (page: string) => {
    setActiveNav(page);
    setMobileMenuOpen(false);
  };

  const openLogoutModal = () => { if (!isLoggingOut) setShowLogoutModal(true); };
  const closeLogoutModal = () => { if (!isLoggingOut) setShowLogoutModal(false); };
  const confirmLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      sessionStorage.setItem("justLoggedOut", "true");
      await new Promise((resolve) => setTimeout(resolve, 800));
      localStorage.removeItem("accessToken");
      localStorage.removeItem("refreshToken");
      onLogout();
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoggingOut(false);
      setShowLogoutModal(false);
    }
  };

  const renderMain = () => {
    if (isLoggingOut) {
      return (
        <div className="flex-1 overflow-y-auto px-5 py-4 bg-gray-50 space-y-4">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="h-20 bg-gray-200 rounded-xl"></div>
              ))}
            </div>
            <div className="h-10 bg-gray-200 rounded-lg w-full"></div>
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="h-12 bg-gray-200 rounded-lg w-full"></div>
              ))}
            </div>
          </div>
        </div>
      );
    }
    if (activeNav === "upload-item") {
      return <UploadPage onBack={() => setActiveNav("lost-items")} onItemCreated={handleItemCreated} />;
    }
    if (activeNav === "lost-items") {
      return <LostItemsPage items={sharedLostItems} setItems={setSharedLostItems} onReturn={handleReturn} isLoading={isLoading} onRefresh={refreshData} />;
    }
    if (activeNav === "found-items") {
      return <FoundItemsPage items={sharedFoundItems} setItems={setSharedFoundItems} onReturn={handleReturn} isLoading={isLoading} onRefresh={refreshData} />;
    }
    if (activeNav === "expired-items") {
      return (
        <ExpiredItemsPage
          foundAdminRecords={sharedFoundItems}
          lostAdminRecords={sharedLostItems}
          setFoundAdminRecords={setSharedFoundItems}
          setLostAdminRecords={setSharedLostItems}
          onDispose={handleDispose}
        />
      );
    }
    if (activeNav === "history") {
      return <ItemHistoryPage foundAdminRecords={sharedFoundItems} lostAdminRecords={sharedLostItems} disposedHistory={disposedHistory} returnedHistory={returnedHistory} isLoading={isLoading} isLoggingOut={isLoggingOut} />;
    }
    if (activeNav === "guidelines") {
      return <GuidelinesPage />;
    }
    if (activeNav === "settings") {
      return <SettingsPage onLogoutRequest={openLogoutModal} isLoggingOut={isLoggingOut} />;
    }
    return <LostItemsPage items={sharedLostItems} setItems={setSharedLostItems} onReturn={handleReturn} isLoading={isLoading} onRefresh={refreshData} />;
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/35 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      <AdminSidebar
        active={activeNav}
        setActive={handleNavChange}
        onLogoutRequest={openLogoutModal}
        isOpen={mobileMenuOpen}
        onClose={() => setMobileMenuOpen(false)}
        isLoggingOut={isLoggingOut}
      />
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-gray-200">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-1.5 rounded-md text-gray-600 hover:bg-gray-100 focus:outline-none"
              title="Open Menu"
            >
              <Menu size={20} />
            </button>
            <div className="flex items-center gap-1.5">
              <img
                src={campusLogo}
                alt="Campus Logo"
                className="w-6 h-6 object-contain"
              />
              <span className="text-gray-900 font-semibold text-xs leading-tight" style={{ fontFamily: "Outfit, sans-serif" }}>Campus L&F</span>
            </div>
          </div>
          <div className="text-xs font-semibold text-gray-500 capitalize" style={{ fontFamily: "Outfit, sans-serif" }}>
            {activeNav.replace("-", " ")}
          </div>
        </header>
        {renderMain()}
      </div>
      {showLogoutModal && (
        <LogoutModal onConfirm={confirmLogout} onClose={closeLogoutModal} loading={isLoggingOut} />
      )}
      <Toaster position="top-right" richColors closeButton />
    </div>
  );
}

// ─── Root ──────────────────────────────────────────────────────────────────

export default function App() {
  const [view, setView] = useState<"landing" | "login" | "browse-lost" | "browse-found" | "admin">("landing");

  useEffect(() => {
    if (view === "admin") {
      window.history.pushState(null, "", window.location.href);
      const handlePopState = () => {
        if (view === "admin") {
          window.history.pushState(null, "", window.location.href);
        }
      };
      window.addEventListener("popstate", handlePopState);
      return () => {
        window.removeEventListener("popstate", handlePopState);
      };
    }
  }, [view]);

  const handleBrowseLost = () => {
    setView("browse-lost");
  };

  const handleBrowseFound = () => {
    setView("browse-found");
  };

  const handleAdminLogin = () => {
    setView("login");
  };

  const handleLogin = (mode: "student" | "admin") => {
    if (mode === "admin") {
      setView("admin");
    }
  };

  const handleBackToLanding = () => {
    setView("landing");
  };

  const pageFallback = (
    <div className="min-h-screen flex items-center items-center justify-center bg-gray-50">
      <p className="text-sm text-gray-500">Loading…</p>
    </div>
  );

  if (view === "landing") {
    return (
      <Suspense fallback={pageFallback}>
        <LandingPage onBrowseLost={handleBrowseLost} onBrowseFound={handleBrowseFound} onAdminLogin={handleAdminLogin} />
      </Suspense>
    );
  }

  if (view === "login") {
    return (
      <Suspense fallback={pageFallback}>
        <LoginPage onLogin={handleLogin} onBack={handleBackToLanding} />
      </Suspense>
    );
  }

  if (view === "browse-lost" || view === "browse-found") {
    return <PublicBrowseView type={view === "browse-lost" ? "lost" : "found"} onBack={handleBackToLanding} />;
  }

  return <AdminView onLogout={handleBackToLanding} />;
}
