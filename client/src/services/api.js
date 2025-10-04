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
      throw new Error(data.message || data.error || `API request failed with status ${response.status}`);
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

  // User login (unified for both user and admin)
  login: async (email, password) => {
    // First check if this is an admin
    try {
      const checkResult = await authAPI.checkAdmin(email);
      
      if (checkResult.isAdmin) {
        // Login as admin
        return apiCall('/admin/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
      } else {
        // Login as regular user
        return apiCall('/auth/login', {
          method: 'POST',
          body: JSON.stringify({ email, password }),
        });
      }
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
