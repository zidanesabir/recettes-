import { auth } from "@/firebaseConfig";

const API_URL = import.meta.env.VITE_API_URL || "/api"; // Functions URL (rewritten by Firebase Hosting)

// Get Firebase ID token for authenticated calls
const getToken = async () => {
  const currentUser = auth.currentUser;
  if (!currentUser) return null;
  return currentUser.getIdToken();
};


// API request helper
const request = async (endpoint: string, options: RequestInit = {}) => {
  const token = await getToken();
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config);
    
    // Check if response has content
    let data;
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      try {
        data = await response.json();
      } catch (e) {
        console.error('Failed to parse JSON response:', e);
        throw new Error('Réponse invalide du serveur');
      }
    } else {
      const text = await response.text();
      console.error('Non-JSON response:', text);
      throw new Error('Réponse invalide du serveur');
    }

    if (!response.ok) {
      // Log error for debugging
      console.error(`API Error [${response.status}]:`, endpoint, data);
      const errorMessage = data?.message || data?.error || `Erreur ${response.status}: ${response.statusText}`;
      throw new Error(errorMessage);
    }

    // Log successful responses for debugging (only in development)
    if (import.meta.env.DEV) {
      console.log(`API Success [${response.status}]:`, endpoint, data);
    }
    return data;
  } catch (error: any) {
    // Log network errors
    if (error.name === 'TypeError' && error.message.includes('fetch')) {
      console.error('Network error:', endpoint);
      throw new Error('Impossible de se connecter au serveur. Vérifiez que le serveur backend est démarré.');
    }
    // Re-throw if it's already an Error
    if (error instanceof Error) {
      throw error;
    }
    // Otherwise wrap it
    throw new Error(error.message || 'Une erreur est survenue');
  }
};

// Auth API (handled directly via Firebase Auth on the client)
export const authAPI = {};

// Recipes API
export const recipesAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    category?: string;
    difficulty?: string;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.category) queryParams.append('category', params.category);
    if (params?.difficulty) queryParams.append('difficulty', params.difficulty);
    if (params?.search) queryParams.append('search', params.search);

    const query = queryParams.toString();
    return request(`/recipes${query ? `?${query}` : ''}`);
  },

  getById: async (id: string) => {
    return request(`/recipes/${id}`);
  },

  create: async (recipeData: any) => {
    return request('/recipes', {
      method: 'POST',
      body: JSON.stringify(recipeData),
    });
  },

  update: async (id: string, recipeData: any) => {
    return request(`/recipes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(recipeData),
    });
  },

  delete: async (id: string) => {
    return request(`/recipes/${id}`, {
      method: 'DELETE',
    });
  },

  like: async (id: string) => {
    return request(`/recipes/${id}/like`, {
      method: 'PUT',
    });
  },

  getUserRecipes: async (userId: string) => {
    return request(`/recipes/user/${userId}`);
  },

  getRecent: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return request(`/recipes/recent${query}`);
  },

  getPopular: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return request(`/recipes/popular${query}`);
  },

  getFollowed: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return request(`/recipes/followed${query}`);
  },

  getFavorites: async (limit?: number) => {
    const query = limit ? `?limit=${limit}` : '';
    return request(`/recipes/favorites${query}`);
  },

  getMyRecipes: async () => {
    return request(`/recipes/my-recipes`);
  },
};

// Users API
export const usersAPI = {
  getById: async (id: string) => {
    return request(`/users/${id}`);
  },

  update: async (id: string, userData: any) => {
    return request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  toggleFavorite: async (id: string, recipeId: string) => {
    return request(`/users/${id}/favorites`, {
      method: 'PUT',
      body: JSON.stringify({ recipeId }),
    });
  },

  toggleBookmark: async (id: string, recipeId: string) => {
    return request(`/users/${id}/bookmarks`, {
      method: 'PUT',
      body: JSON.stringify({ recipeId }),
    });
  },
  
  toggleFollow: async (id: string) => {
    return request(`/users/${id}/follow`, {
      method: 'PUT',
    });
  },

  getFollowers: async (id: string) => {
    return request(`/users/${id}/followers`);
  },

  getFollowing: async (id: string) => {
    return request(`/users/${id}/following`);
  },
};

// Comments API
export const commentsAPI = {
  getByRecipe: async (recipeId: string) => {
    return request(`/recipes/${recipeId}/comments`);
  },

  create: async (commentData: { recipe: string; content: string; rating?: number }) => {
    return request(`/recipes/${commentData.recipe}/comments`, {
      method: 'POST',
      body: JSON.stringify({
        text: commentData.content,
        rating: commentData.rating,
      }),
    });
  },

  update: async (id: string, content: string, recipeId: string) => {
    return request(`/comments/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ content, recipeId }),
    });
  },

  delete: async (id: string, recipeId: string) => {
    return request(`/comments/${id}`, {
      method: 'DELETE',
      body: JSON.stringify({ recipeId }),
    });
  },

  like: async (id: string, recipeId: string) => {
    return request(`/comments/${id}/like`, {
      method: 'PUT',
      body: JSON.stringify({ recipeId }),
    });
  },

  addReply: async (id: string, content: string, recipeId: string) => {
    return request(`/comments/${id}/reply`, {
      method: 'POST',
      body: JSON.stringify({ content, recipeId }),
    });
  },
};

// Categories API
export const categoriesAPI = {
  getAll: async () => {
    try {
      const response = await request('/categories');
      console.log('Categories API response:', response);
      return response;
    } catch (error) {
      console.error('Categories API error:', error);
      throw error;
    }
  },

  getById: async (id: string) => {
    return request(`/categories/${id}`);
  },
  getBySlug: async () => { throw new Error('get category by slug not available on Firebase backend'); },
};

export const notificationsAPI = {
  getAll: async (params?: {
    page?: number;
    limit?: number;
    unread?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.unread) queryParams.append('unread', params.unread.toString());
    const query = queryParams.toString();
    return request(`/notifications${query ? `?${query}` : ''}`);
  },

  getUnreadCount: async () => {
    return request('/notifications/unread-count');
  },

  markAsRead: async (id: string) => {
    return request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  markAllAsRead: async () => {
    return request('/notifications/read-all', {
      method: 'PUT',
    });
  },

  delete: async (id: string) => {
    return request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  },
};
