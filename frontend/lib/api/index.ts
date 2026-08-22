import api from "./client";
import { LoginRequest, SignupRequest, TokenResponse, UserResponse } from "../types";

export const authApi = {
  signup: (data: SignupRequest) => api.post("/auth/signup", data),
  verifyEmail: (token: string) => api.post("/auth/verify-email", { token }),
  resendVerification: (email: string) => api.post("/auth/resend-verification", { email }),
  forgotPassword: (email: string) => api.post("/auth/forgot-password", { email }),
  resetPassword: (token: string, new_password: string) => api.post("/auth/reset-password", { token, new_password }),
  login: (data: LoginRequest) =>
    api.post<TokenResponse>("/auth/login", data),
  refresh: (refresh_token: string) =>
    api.post<{ access_token: string }>("/auth/refresh", { refresh_token }),
  me: () => api.get<UserResponse>("/auth/me"),
};

export const employeeApi = {
  getMe: () => api.get("/employees/me"),
  updateMe: (data: object) => api.patch("/employees/me", data),
  list: (params?: { search?: string }) =>
    api.get("/employees/", { params }),
  getById: (id: number) => api.get(`/employees/${id}`),
  update: (id: number, data: object) => api.patch(`/employees/${id}`, data),
  uploadDocument: (id: number, file: File, doc_type?: string) => {
    const form = new FormData();
    form.append("file", file);
    if (doc_type) form.append("doc_type", doc_type);
    return api.post(`/employees/${id}/documents`, form, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  },
  getDocuments: (id: number) => api.get(`/employees/${id}/documents`),
  deleteDocument: (empId: number, docId: number) => api.delete(`/employees/${empId}/documents/${docId}`),
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
  getFlagged: () => api.get("/attendance/flagged"),
  correctTime: (id: number, data: { check_in?: string; check_out?: string }) =>
    api.patch(`/attendance/${id}/correct-time`, data),
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
  downloadEmployeeSlip: (employeeId: number, month: string) =>
    api.get(`/payroll/${employeeId}/slip/${month}`, { responseType: "blob" }),
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
    employee_id?: number;
    format?: "csv" | "json";
  }) => api.get("/reports/attendance", { params, responseType: "blob" }),
  leaveSummary: (params?: { year?: number; format?: "csv" | "json" }) =>
    api.get("/reports/leave-summary", {
      params,
      responseType: params?.format === "csv" ? "blob" : "json",
    }),
  payroll: (params?: { month?: string }) =>
    api.get("/reports/payroll", { params, responseType: "blob" }),
};

