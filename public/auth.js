// File: public/js/auth.js (optional utility file for authentication functions)

// You can optionally create this separate file for authentication utilities

/**
 * Checks if a valid token exists in local storage
 * @returns {boolean} True if token exists and is valid
 */
function isAuthenticated() {
    const token = localStorage.getItem('eduquest_token');
    if (!token) return false;
    
    // Basic token validation (in a real app, you'd verify the token's expiration)
    // This is a very simple validation, just checking if it's a reasonable JWT length
    return token.split('.').length === 3 && token.length > 50;
  }
  
  /**
   * Parses JWT token to extract payload data
   * @param {string} token - JWT token string
   * @returns {Object} Decoded token payload or null if invalid
   */
  function parseJwt(token) {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
      }).join(''));
  
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('Error parsing JWT:', e);
      return null;
    }
  }
  
  /**
   * Makes an authenticated API request
   * @param {string} url - API endpoint
   * @param {Object} options - Fetch options
   * @returns {Promise} - Fetch promise
   */
  async function authenticatedFetch(url, options = {}) {
    const token = localStorage.getItem('eduquest_token');
    
    if (!token) {
      throw new Error('No authentication token found');
    }
    
    const headers = {
      ...options.headers,
      'Authorization': `Bearer ${token}`
    };
    
    try {
      const response = await fetch(url, {
        ...options,
        headers
      });
      
      // Handle token expiration
      if (response.status === 401) {
        localStorage.removeItem('eduquest_token');
        window.location.href = '/#login';
        throw new Error('Authentication token expired');
      }
      
      return response;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }
  
  // Export functions if using modules
  export { authenticatedFetch, isAuthenticated, parseJwt };
