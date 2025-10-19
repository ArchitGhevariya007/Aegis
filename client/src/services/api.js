// API service for backend communication
const API_BASE_URL = 'http://localhost:5000/api';

// Helper function for API calls
const apiCall = async (endpoint, options = {}) => {
  try {
    const fullUrl = `${API_BASE_URL}${endpoint}`;
    console.log('Making API call to:', fullUrl, 'with method:', options.method || 'GET');
    
    const response = await fetch(fullUrl, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    console.log('Response status:', response.status, response.statusText);

    // Handle case where response is not JSON
    let data;
    try {
      data = await response.json();
    } catch (e) {
      throw new Error(`Route not found: ${fullUrl} returned ${response.status}`);
    }

    if (!response.ok) {
      const error = new Error(data.message || data.error || `API request failed with status ${response.status}`);
      // Preserve lockdown flag from response
      if (data.lockdown) {
        error.lockdown = true;
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('API Error:', error.message);
    throw error;
  }
};

// Auth API calls
export const authAPI = {
  // User registration
  register: async (userData) => {
    return apiCall('/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        email: userData.email,
        password: userData.password,
        birthDate: userData.birthDate,
        residency: userData.residency,
        idFaceImage: userData.idFaceImage,
        liveFaceImage: userData.liveFaceImage,
      }),
    });
  },

  // Check if email belongs to admin
  checkAdmin: async (email) => {
    return apiCall('/admin/check', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  // User login (unified for user, admin, and department)
  login: async (email, password) => {
    try {
      // Check if this is a department login
      const isDepartment = email.match(/@(immi|income|medical)\.com$/);
      if (isDepartment) {
        return apiCall('/departments/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
      }

      // Check if this is an admin
      const checkResult = await authAPI.checkAdmin(email);
      if (checkResult.isAdmin) {
        return apiCall('/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
      }

      // Regular user login
      return apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // Face verification after login
  faceVerify: async (faceImage, token) => {
    return apiCall('/auth/face-verify', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ faceImage }),
    });
  },

  // Logout
  logout: async (token) => {
    return apiCall('/auth/logout', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// KYC API calls
export const kycAPI = {
  // Upload ID document
  uploadId: async (document, token) => {
    const formData = new FormData();
    formData.append('document', document);
    
    return apiCall('/kyc/upload-id', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
  },

  // Liveness check
  livenessCheck: async (faceImage, token) => {
    return apiCall('/kyc/liveness-check', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ faceImage }),
    });
  },

  // Face matching
  faceMatch: async (idImage, liveImage, token) => {
    return apiCall('/kyc/face-match', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ idImage, liveImage }),
    });
  },

  // Get KYC status
  getStatus: async (userId, token) => {
    return apiCall(`/kyc/status/${userId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Location tracking API calls
export const locationAPI = {
  // Get map data for visualization
  getMapData: async (timeRange = '24h') => {
    return apiCall(`/locations/map-data?timeRange=${timeRange}`);
  },

  // Get recent activity
  getRecentActivity: async (limit = 10) => {
    return apiCall(`/locations/recent-activity?limit=${limit}`);
  },
};

// Emergency control API calls
export const emergencyAPI = {
  // Get emergency status
  getStatus: async (token) => {
    return apiCall('/emergency/status', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Toggle system lockdown
  toggleLockdown: async (enabled, reason, token) => {
    const payload = { enabled, reason };
    console.log('[API] Sending lockdown toggle:', payload);
    console.log('[API] Stringified:', JSON.stringify(payload));
    
    return apiCall('/emergency/toggle-lockdown', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });
  },

  // Export all user data
  exportUsers: async (token, type = 'users') => {
    return apiCall(`/emergency/export-users?type=${type}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Generate system report
  generateReport: async (token) => {
    return apiCall('/emergency/system-report', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get emergency statistics
  getStats: async (token) => {
    return apiCall('/emergency/stats', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Department API calls
export const departmentAPI = {
  // Get all departments (admin)
  getAll: async (token) => {
    return apiCall('/departments/admin/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Get single department (admin)
  getById: async (id, token) => {
    return apiCall(`/departments/admin/${id}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },

  // Update department permissions (admin)
  updatePermissions: async (id, permissions, token) => {
    return apiCall(`/departments/admin/${id}/permissions`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ permissions }),
    });
  },

  // Toggle specific permission field (admin)
  toggleField: async (id, categoryIndex, fieldIndex, enabled, token) => {
    console.log('[API] Toggle field:', { id, categoryIndex, fieldIndex, enabled });
    return apiCall(`/departments/admin/${id}/toggle-field`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryIndex, fieldIndex, enabled }),
    });
  },

  // Toggle entire category (admin)
  toggleCategory: async (id, categoryIndex, enabled, token) => {
    console.log('[API] Toggle category:', { id, categoryIndex, enabled });
    return apiCall(`/departments/admin/${id}/toggle-category`, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ categoryIndex, enabled }),
    });
  },

  // Get permissions summary (admin)
  getSummary: async (token) => {
    return apiCall('/departments/admin/summary/all', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
  },
};

// Local storage helpers
export const storage = {
  setToken: (token) => localStorage.setItem('authToken', token),
  getToken: () => localStorage.getItem('authToken'),
  removeToken: () => localStorage.removeItem('authToken'),
  setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
  getUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  removeUser: () => localStorage.removeItem('user'),
};
