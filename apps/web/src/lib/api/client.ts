import { ApiError, errorMessage } from './errors';
import type {
  ApiErrorBody,
  Application,
  ApplicationStatus,
  Company,
  Contact,
  DashboardData,
  Interview,
  Note,
  PaginatedResponse,
} from './types';

export type AccessTokenProvider = () => string | null | Promise<string | null>;

export type ApiClientOptions = {
  baseUrl: string;
  getAccessToken: AccessTokenProvider;
};

type QueryValue = string | number | boolean | undefined;
type QueryParams = Record<string, QueryValue>;

type CompanyInput = {
  name: string;
  website?: string;
  location?: string;
  description?: string;
};

type ApplicationInput = {
  companyId: string;
  jobTitle: string;
  jobPostingUrl?: string;
  appliedAt?: string;
  employmentType?: Application['employmentType'];
  workMode?: Application['workMode'];
  deadline?: string;
  nextActionAt?: string;
  priority?: Application['priority'];
  salaryMin?: number;
  salaryMax?: number;
  salaryCurrency?: string;
  jobDescriptionSnapshot?: string;
  source?: string;
};

type ApplicationUpdateInput = Omit<ApplicationInput, 'status'>;

type ContactInput = {
  companyId: string;
  name: string;
  role?: string;
  email?: string;
  phone?: string;
};

type InterviewInput = {
  applicationId: string;
  contactId?: string;
  interviewerName?: string;
  format?: Interview['format'];
  scheduledAt: string;
};

type NoteInput = {
  companyId?: string;
  applicationId?: string;
  contactId?: string;
  interviewId?: string;
  text: string;
};

export type ApiClient = {
  health: {
    get: () => Promise<{ status: 'ok' }>;
  };
  companies: {
    list: (query?: {
      page?: number;
      limit?: number;
      search?: string;
    }) => Promise<PaginatedResponse<Company>>;
    get: (id: string) => Promise<Company>;
    create: (input: CompanyInput) => Promise<Company>;
    update: (id: string, input: Partial<CompanyInput>) => Promise<Company>;
    remove: (id: string) => Promise<Company>;
    archive: (id: string) => Promise<Company>;
  };
  applications: {
    list: (query?: {
      page?: number;
      limit?: number;
      search?: string;
      status?: ApplicationStatus;
      companyId?: string;
    }) => Promise<PaginatedResponse<Application>>;
    get: (id: string) => Promise<Application>;
    create: (input: ApplicationInput & { status?: ApplicationStatus }) => Promise<Application>;
    update: (id: string, input: ApplicationUpdateInput) => Promise<Application>;
    remove: (id: string) => Promise<Application>;
    archive: (id: string) => Promise<Application>;
    changeStatus: (
      id: string,
      input: { status: ApplicationStatus; note?: string },
    ) => Promise<Application>;
  };
  contacts: {
    list: (query?: {
      page?: number;
      limit?: number;
      search?: string;
      companyId?: string;
    }) => Promise<PaginatedResponse<Contact>>;
    get: (id: string) => Promise<Contact>;
    create: (input: ContactInput) => Promise<Contact>;
    update: (id: string, input: Partial<ContactInput>) => Promise<Contact>;
    remove: (id: string) => Promise<Contact>;
  };
  interviews: {
    list: (query?: {
      page?: number;
      limit?: number;
      applicationId?: string;
      contactId?: string;
      from?: string;
      to?: string;
    }) => Promise<PaginatedResponse<Interview>>;
    get: (id: string) => Promise<Interview>;
    create: (input: InterviewInput) => Promise<Interview>;
    update: (id: string, input: Partial<InterviewInput>) => Promise<Interview>;
    cancel: (id: string) => Promise<Interview>;
    remove: (id: string) => Promise<Interview>;
  };
  notes: {
    list: (query?: {
      page?: number;
      limit?: number;
      companyId?: string;
      applicationId?: string;
      contactId?: string;
      interviewId?: string;
    }) => Promise<PaginatedResponse<Note>>;
    get: (id: string) => Promise<Note>;
    create: (input: NoteInput) => Promise<Note>;
    update: (id: string, input: { text: string }) => Promise<Note>;
    remove: (id: string) => Promise<Note>;
  };
  dashboard: {
    get: () => Promise<DashboardData>;
  };
};

export function createApiClient(options: ApiClientOptions): ApiClient {
  async function request<T>(
    path: string,
    init: RequestInit = {},
    authenticated = true,
  ): Promise<T> {
    const headers = new Headers(init.headers);

    if (init.body) {
      headers.set('content-type', 'application/json');
    }

    if (authenticated) {
      const token = await options.getAccessToken();
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
    }

    const response = await fetch(`${options.baseUrl}${path}`, {
      ...init,
      headers,
    });

    const body = await response.json().catch(() => undefined);

    if (!response.ok) {
      throw new ApiError(
        response.status,
        errorMessage(response.status, body),
        body as ApiErrorBody,
      );
    }

    return body as T;
  }

  function toQuery(params: QueryParams): string {
    const search = new URLSearchParams();

    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        search.set(key, String(value));
      }
    }

    const query = search.toString();
    return query ? `?${query}` : '';
  }

  return {
    health: {
      get: () => request<{ status: 'ok' }>('/health', {}, false),
    },
    companies: {
      list: (query = {}) => request<PaginatedResponse<Company>>(`/companies${toQuery(query)}`),
      get: (id) => request<Company>(`/companies/${id}`),
      create: (input) =>
        request<Company>('/companies', { method: 'POST', body: JSON.stringify(input) }),
      update: (id, input) =>
        request<Company>(`/companies/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
      remove: (id) => request<Company>(`/companies/${id}`, { method: 'DELETE' }),
      archive: (id) => request<Company>(`/companies/${id}/archive`, { method: 'POST' }),
    },
    applications: {
      list: (query = {}) =>
        request<PaginatedResponse<Application>>(`/applications${toQuery(query)}`),
      get: (id) => request<Application>(`/applications/${id}`),
      create: (input) =>
        request<Application>('/applications', { method: 'POST', body: JSON.stringify(input) }),
      update: (id, input) =>
        request<Application>(`/applications/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(input),
        }),
      remove: (id) => request<Application>(`/applications/${id}`, { method: 'DELETE' }),
      archive: (id) => request<Application>(`/applications/${id}/archive`, { method: 'POST' }),
      changeStatus: (id, input) =>
        request<Application>(`/applications/${id}/status`, {
          method: 'POST',
          body: JSON.stringify(input),
        }),
    },
    contacts: {
      list: (query = {}) => request<PaginatedResponse<Contact>>(`/contacts${toQuery(query)}`),
      get: (id) => request<Contact>(`/contacts/${id}`),
      create: (input) =>
        request<Contact>('/contacts', { method: 'POST', body: JSON.stringify(input) }),
      update: (id, input) =>
        request<Contact>(`/contacts/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
      remove: (id) => request<Contact>(`/contacts/${id}`, { method: 'DELETE' }),
    },
    interviews: {
      list: (query = {}) => request<PaginatedResponse<Interview>>(`/interviews${toQuery(query)}`),
      get: (id) => request<Interview>(`/interviews/${id}`),
      create: (input) =>
        request<Interview>('/interviews', { method: 'POST', body: JSON.stringify(input) }),
      update: (id, input) =>
        request<Interview>(`/interviews/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
      cancel: (id) => request<Interview>(`/interviews/${id}/cancel`, { method: 'POST' }),
      remove: (id) => request<Interview>(`/interviews/${id}`, { method: 'DELETE' }),
    },
    notes: {
      list: (query = {}) => request<PaginatedResponse<Note>>(`/notes${toQuery(query)}`),
      get: (id) => request<Note>(`/notes/${id}`),
      create: (input) => request<Note>('/notes', { method: 'POST', body: JSON.stringify(input) }),
      update: (id, input) =>
        request<Note>(`/notes/${id}`, { method: 'PATCH', body: JSON.stringify(input) }),
      remove: (id) => request<Note>(`/notes/${id}`, { method: 'DELETE' }),
    },
    dashboard: {
      get: () => request<DashboardData>('/dashboard'),
    },
  };
}
