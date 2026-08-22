import api from "./client";
import { LoginRequest, SignupRequest, TokenResponse, UserResponse } from "../types";

export const authApi = {
  signup: (data: SignupRequest) => api.post("/auth/signup", data),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  login: (data: LoginRequest) =>
    api.post<TokenResponse>("/auth/login", data),
  refresh: (refresh_token: string) =>
    api.post<{ access_token: string }>("/auth/refresh", { refresh_token }),
  me: () => api.get<UserResponse>("/auth/me"),
};

export const employeeApi = {
  getMe: () => api.get("/employees/me"),
  updateMe: (data: object) => api.patch("/employees/me", data),
  list: (params?: { department?: string; search?: string }) =>
    api.get("/employees/", { params }),
  getById: (id: number) => api.get(`/employees/${id}`),
  update: (id: number, data: object) => api.patch(`/employees/${id}`, data),
  getDepartments: () => api.get<string[]>("/employees/departments"),
  uploadDocument: (id: number, file: File, doc_type?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (doc_type) form.append("doc_type", doc_type);
    return api.post(`/employees/${id}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
};

export const attendanceApi = {
  checkIn: () => api.post("/attendance/check-in"),
  checkOut: () => api.post("/attendance/check-out"),
  myAttendance: (params?: { date_from?: string; date_to?: string }) =>
    api.get("/attendance/me", { params }),
  all: (params?: {
    employee_id?: number;
    date_from?: string;
    date_to?: string;
  }) => api.get("/attendance/", { params }),
};

export const leaveApi = {
  apply: (data: {
    leave_type: string;
    start_date: string;
    end_date: string;
    remarks?: string;
  }) => api.post("/leave/", data),
  myHistory: () => api.get("/leave/me"),
  myBalance: () => api.get("/leave/balance"),
  all: (params?: { status?: string; employee_id?: number }) =>
    api.get("/leave/", { params }),
  approve: (id: number, comment?: string) =>
    api.patch(`/leave/${id}/approve`, { comment }),
  reject: (id: number, comment?: string) =>
    api.patch(`/leave/${id}/reject`, { comment }),
};

export const payrollApi = {
  mySalary: () => api.get("/payroll/me"),
  downloadSlip: (month: string) =>
    api.get(`/payroll/me/slip/${month}`, { responseType: "blob" }),
  all: () => api.get("/payroll/"),
  update: (
    employeeId: number,
    data: {
      basic: number;
      hra: number;
      allowances: Record<string, number>;
      deductions: Record<string, number>;
      effective_from?: string;
    }
  ) => api.put(`/payroll/${employeeId}`, data),
};

export const dashboardApi = {
  employee: () => api.get("/dashboard/employee"),
  admin: () => api.get("/dashboard/admin"),
};

export const notificationApi = {
  list: (unread_only?: boolean) =>
    api.get("/notifications/", { params: { unread_only } }),
  markRead: (id: number) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch("/notifications/mark-all-read"),
};

export const reportsApi = {
  attendance: (params?: {
    date_from?: string;
    date_to?: string;
    format?: "csv" | "json";
  }) => api.get("/reports/attendance", { params, responseType: "blob" }),
  leaveSummary: (year?: number) =>
    api.get("/reports/leave-summary", { params: { year } }),
};
