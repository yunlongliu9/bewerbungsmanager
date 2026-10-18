export type ApplicationStatus =
  | 'WISHLIST'
  | 'APPLIED'
  | 'SCREENING'
  | 'INTERVIEW'
  | 'OFFER'
  | 'REJECTED'
  | 'WITHDRAWN'
  | 'ACCEPTED';

export type EmploymentType =
  'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP' | 'FREELANCE' | 'OTHER';

export type WorkMode = 'ONSITE' | 'HYBRID' | 'REMOTE' | 'UNSPECIFIED';

export type Priority = 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';

export type InterviewFormat = 'PHONE' | 'VIDEO' | 'ONSITE' | 'TECHNICAL' | 'OTHER';

export type Company = {
  id: string;
  name: string;
  website?: string | null;
  location?: string | null;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type StatusChange = {
  id: string;
  applicationId: string;
  fromStatus: ApplicationStatus;
  toStatus: ApplicationStatus;
  changedAt: string;
  note?: string | null;
};

export type Application = {
  id: string;
  companyId: string;
  company?: Company;
  jobTitle: string;
  jobPostingUrl?: string | null;
  status: ApplicationStatus;
  appliedAt: string;
  employmentType: EmploymentType;
  workMode: WorkMode;
  deadline?: string | null;
  nextActionAt?: string | null;
  priority: Priority;
  salaryMin?: number | null;
  salaryMax?: number | null;
  salaryCurrency?: string | null;
  jobDescriptionSnapshot?: string | null;
  source?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  statusChanges?: StatusChange[];
};

export type Contact = {
  id: string;
  companyId: string;
  company?: Company;
  name: string;
  role?: string | null;
  email?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type Interview = {
  id: string;
  applicationId: string;
  application?: Application;
  contactId?: string | null;
  contact?: Contact | null;
  interviewerName?: string | null;
  format: InterviewFormat;
  scheduledAt: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type Note = {
  id: string;
  companyId?: string | null;
  company?: Company | null;
  applicationId?: string | null;
  application?: Application | null;
  contactId?: string | null;
  contact?: Contact | null;
  interviewId?: string | null;
  interview?: Interview | null;
  text: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
};

export type DashboardData = {
  activeApplicationCount: number;
  applicationsByStatus: Record<ApplicationStatus, number>;
  upcomingInterviews: Interview[];
  recentlyUpdatedApplications: Application[];
  dueFollowUps: Application[];
  overdueFollowUps: Application[];
};

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
};

export type PaginatedResponse<T> = {
  data: T[];
  meta: PaginationMeta;
};

export type ApiErrorBody = {
  statusCode: number;
  message: string | string[];
  error: string;
  path: string;
  timestamp: string;
};

export type AuthOwner = {
  id: string;
  email: string;
  createdAt: string;
  updatedAt: string;
};
