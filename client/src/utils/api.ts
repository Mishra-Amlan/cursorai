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

  // Authentication with multiple fallback methods
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const loginMethods = [
      // Method 1: Use flexible endpoint with JSON (preferred)
      () => this.loginWithJSON(credentials),
      // Method 2: Use flexible endpoint with FormData  
      () => this.loginWithFormData('/auth/login-flexible', credentials),
      // Method 3: Use original form endpoint as fallback
      () => this.loginWithFormData('/auth/login', credentials),
    ];

    let lastError: Error | null = null;

    for (const method of loginMethods) {
      try {
        const result = await method();
        this.token = result.access_token;
        localStorage.setItem('authToken', this.token);
        return result;
      } catch (error) {
        console.warn('Login method failed, trying next method:', error);
        lastError = error as Error;
        continue;
      }
    }

    // If all methods failed, throw the last error
    throw lastError || new Error('All login methods failed');
  }

  private async loginWithJSON(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const response = await fetch(\`\${this.baseURL}/auth/login-flexible\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(\`JSON login failed: \${response.status} - \${errorText}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('JSON login failed:', error);
      throw error;
    }
  }

  private async loginWithFormData(endpoint: string, credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      const formData = new FormData();
      formData.append('username', credentials.username);
      formData.append('password', credentials.password);

      const response = await fetch(\`\${this.baseURL}\${endpoint}\`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(\`Form login failed: \${response.status} - \${errorText}\`);
      }

      return await response.json();
    } catch (error) {
      console.error('Form data login failed:', error);
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

  // Test connectivity
  async testConnection(): Promise<{backend: boolean, auth: boolean}> {
    try {
      // Test backend health
      await this.healthCheck();
      const backendOk = true;

      // Test auth endpoint
      try {
        const testResponse = await fetch(\`\${this.baseURL}/auth/login-flexible\`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username: 'test', password: 'test' })
        });
        // We expect a 401, but not a 422 or 500
        const authOk = testResponse.status === 401;
        
        return { backend: backendOk, auth: authOk };
      } catch {
        return { backend: backendOk, auth: false };
      }
    } catch {
      return { backend: false, auth: false };
    }
  }
}

export const apiClient = new ApiClient();
