const API_BASE_URL = 'http://localhost:8000/api';

export interface LoginCredentials {
  username: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

export interface User {
  id: number;
  username: string;
  name: string;
  email: string;
  role: string;
  created_at: string;
}

export interface Property {
  id: number;
  name: string;
  location: string;
  region: string;
  image?: string;
  last_audit_score?: number;
  next_audit_date?: string;
  status: string;
  created_at: string;
}

export interface Audit {
  id: number;
  property_id: number;
  auditor_id?: number;
  reviewer_id?: number;
  status: string;
  overall_score?: number;
  cleanliness_score?: number;
  branding_score?: number;
  operational_score?: number;
  compliance_zone?: string;
  findings?: any;
  action_plan?: any;
  ai_report?: any;
  ai_insights?: any;
  submitted_at?: string;
  reviewed_at?: string;
  created_at: string;
  property?: Property;
  auditor?: User;
  reviewer?: User;
}

class ApiClient {
  private baseURL: string;
  private token: string | null = null;

  constructor(baseURL: string = API_BASE_URL) {
    this.baseURL = baseURL;
    this.token = localStorage.getItem('authToken');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = \`\${this.baseURL}\${endpoint}\`;
    
    const headers: Record<string, string> = {
      ...((options.headers as Record<string, string>) || {}),
    };

    // Only add Content-Type for JSON requests
    if (options.body && typeof options.body === 'string') {
      headers['Content-Type'] = 'application/json';
    }

    if (this.token) {
      headers.Authorization = \`Bearer \${this.token}\`;
    }

    const config: RequestInit = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Error:', response.status, errorText);
        throw new Error(\`HTTP \${response.status}: \${errorText}\`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const formData = new FormData();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    try {
      const response = await fetch(\`\${this.baseURL}/auth/login\`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Login failed:', response.status, errorText);
        throw new Error(\`Login failed: \${response.status}\`);
      }

      const data = await response.json();
      this.token = data.access_token;
      localStorage.setItem('authToken', this.token!);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User> {
    return this.request<User>('/auth/me');
  }

  logout(): void {
    this.token = null;
    localStorage.removeItem('authToken');
  }

  // Properties (note: endpoints need trailing slash for FastAPI)
  async getProperties(): Promise<Property[]> {
    return this.request<Property[]>('/properties/');
  }

  async getProperty(id: number): Promise<Property> {
    return this.request<Property>(\`/properties/\${id}\`);
  }

  // Audits (note: endpoints need trailing slash for FastAPI)
  async getAudits(params?: {
    auditor_id?: number;
    reviewer_id?: number;
    property_id?: number;
    status?: string;
  }): Promise<Audit[]> {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          queryParams.append(key, value.toString());
        }
      });
    }
    
    const endpoint = \`/audits/\${queryParams.toString() ? \`?\${queryParams.toString()}\` : ''}\`;
    return this.request<Audit[]>(endpoint);
  }

  async getAudit(id: number): Promise<Audit> {
    return this.request<Audit>(\`/audits/\${id}\`);
  }

  // AI Features
  async analyzePhoto(imageBase64: string, context: string, auditItemId?: number) {
    return this.request('/ai/analyze-photo', {
      method: 'POST',
      body: JSON.stringify({
        image_base64: imageBase64,
        context,
        audit_item_id: auditItemId,
      }),
    });
  }

  async generateReport(auditId: number) {
    return this.request('/ai/generate-report', {
      method: 'POST',
      body: JSON.stringify({
        audit_id: auditId,
      }),
    });
  }

  async suggestScore(auditItemId: number, observations: string) {
    return this.request('/ai/suggest-score', {
      method: 'POST',
      body: JSON.stringify({
        audit_item_id: auditItemId,
        observations,
      }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ message: string }> {
    const response = await fetch(\`\${this.baseURL.replace('/api', '')}/\`);
    return response.json();
  }
}

export const apiClient = new ApiClient();
