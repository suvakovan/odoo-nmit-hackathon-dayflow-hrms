// ============================================================
// TypeScript types mirroring backend Pydantic schemas
// ============================================================

export type Role = "ADMIN" | "EMPLOYEE";
export type LeaveType = "PAID" | "SICK" | "UNPAID";
export type LeaveStatus = "PENDING" | "APPROVED" | "REJECTED";
export type AttendanceStatus = "PRESENT" | "ABSENT" | "HALF_DAY" | "LEAVE";

export interface UserResponse {
  id: number;
  email: string;
  role: Role;
  is_verified: boolean;
}

export interface TokenResponse {
  access_token: string;
  refresh_token?: string;
  token_type: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignupRequest {
  email: string;
  password: string;
  role: Role;
  first_name: string;
  last_name: string;
  department: string;
  designation: string;
}

export interface Employee {
  id: number;
  user_id: number;
  employee_code: string;
  first_name: string;
  last_name: string;
  phone?: string;
  address?: string;
  department: string;
  designation: string;
  manager_id?: number;
  joining_date: string;
  profile_picture_url?: string;
}

export interface AttendanceRecord {
  id: number;
  employee_id: number;
  date: string;
  check_in?: string;
  check_out?: string;
  status: AttendanceStatus;
  working_hours?: number;
  flagged?: boolean;
}

export interface LeaveRequest {
  id: number;
  employee_id: number;
  leave_type: LeaveType;
  start_date: string;
  end_date: string;
  remarks?: string;
  status: LeaveStatus;
  reviewed_by?: number;
  review_comment?: string;
  total_days: number;
}

export interface LeaveBalance {
  id: number;
  leave_type: LeaveType;
  year: number;
  total_days: number;
  used_days: number;
  remaining_days: number;
}

export interface SalaryStructure {
  id: number;
  employee_id: number;
  basic: number;
  hra: number;
  allowances: Record<string, number>;
  deductions: Record<string, number>;
  effective_from: string;
  is_active: boolean;
  net_salary: number;
}

export interface Notification {
  id: number;
  message: string;
  is_read: boolean;
}
