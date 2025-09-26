import { useAuth } from '../context/AuthContext';
import { BASE_URL } from '../config/apiConfig';

// For managing concurrent requests during token refresh
let isRefreshing = false;
let failedQueue: { resolve: Function; reject: Function }[] = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  console.log(`🔄 Processing queue with ${failedQueue.length} requests`, error ? "with error" : "with success");
  failedQueue.forEach(promise => {
    if (error) {
      promise.reject(error);
    } else {
      promise.resolve(token);
    }
  });
  
  failedQueue = [];
};

export const useApiClient = () => {
  const { token, refreshToken } = useAuth();

  const fetchWithAuth = async (url: string, options: RequestInit = {}): Promise<Response> => {
    // Add auth header if token exists
    const headers = {
      ...options.headers,
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    };

    console.log(`🌐 Making API request to: ${url}`, {
      method: options.method || 'GET',
      hasToken: !!token
    });

    try {
      // Make the initial request
      const response = await fetch(
        url.startsWith('http') ? url : `${BASE_URL}${url}`,
        { ...options, headers }
      );

      console.log(`📡 API response status: ${response.status} for ${url}`);

      // If unauthorized, try to refresh token
      if (response.status === 401) {
        console.log(`🔑 Received 401 Unauthorized for ${url}, attempting token refresh`);
        console.log(`🔍 Current isRefreshing state: ${isRefreshing}`);
        
        // If already refreshing, add to queue
        if (isRefreshing) {
          console.log(`⏳ Token refresh already in progress, adding request to queue`);
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
            console.log(`📋 Request added to queue. Queue size: ${failedQueue.length}`);
          })
            .then(newToken => {
              console.log(`✅ Queue processed, retrying request with new token`);
              // Retry with new token
              return fetchWithAuth(url, options);
            })
            .catch(err => {
              console.error(`❌ Queue processing failed:`, err);
              throw err;
            });
        }

        isRefreshing = true;
        console.log(`🔄 Starting token refresh process`);

        try {
          // Try to get a new token
          console.log(`📤 Calling refreshToken function`);
          const newToken = await refreshToken();
          console.log(`📥 refreshToken function returned:`, newToken ? "new token received" : "no token received");
          
          isRefreshing = false;
          
          if (newToken) {
            console.log(`✅ Token refresh successful, processing queue`);
            // Process any queued requests
            processQueue(null, newToken);
            
            console.log(`🔄 Retrying original request with new token`);
            // Retry original request with new token
            const newHeaders = {
              ...options.headers,
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${newToken}`
            };
            
            return fetch(
              url.startsWith('http') ? url : `${BASE_URL}${url}`,
              { ...options, headers: newHeaders }
            );
          } else {
            console.error(`❌ Token refresh failed - no new token received`);
            // Refresh failed
            processQueue(new Error('Failed to refresh token'));
            throw new Error('Failed to refresh token');
          }
        } catch (error) {
          console.error(`❌ Error during token refresh:`, error);
          isRefreshing = false;
          processQueue(error as Error);
          throw error;
        }
      }

      return response;
    } catch (error) {
      console.error(`❌ API request failed for ${url}:`, error);
      throw error;
    }
  };

  // Helper methods
  const get = async (url: string, options: RequestInit = {}) => {
    return fetchWithAuth(url, { ...options, method: 'GET' });
  };

  const post = async (url: string, data: any, options: RequestInit = {}) => {
    return fetchWithAuth(url, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    });
  };

  const put = async (url: string, data: any, options: RequestInit = {}) => {
    return fetchWithAuth(url, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    });
  };

  const patch = async (url: string, data: any, options: RequestInit = {}) => {
    return fetchWithAuth(url, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  };

  const del = async (url: string, options: RequestInit = {}) => {
    return fetchWithAuth(url, { ...options, method: 'DELETE' });
  };

  return {
    get,
    post,
    put,
    patch,
    delete: del
  };
};
