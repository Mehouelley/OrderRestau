import { create } from 'zustand';
import { authAPI } from '../services/api';

interface User {
  id: string | number;
  email: string;
  name: string;
}

interface Restaurant {
  id: string | number;
  name: string;
  slug: string;
  owner_id: string | number;
  image_url?: string | null;
}

interface AuthState {
  user: User | null;
  restaurant: Restaurant | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: { restaurantName: string; email: string; phone: string; image_url?: string; password: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  me: () => Promise<void>;
  updateRestaurant: (restaurant: Restaurant | null) => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  restaurant: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,

  login: async (email: string, password: string) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authAPI.login(email, password);
      
      if (result.error) {
        set({ error: 'Email ou mot de passe incorrect', isLoading: false });
        return false;
      }

      if (result.data) {
        set({
          user: result.data.user,
          restaurant: result.data.restaurant,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      return false;
    } catch (err) {
      set({ error: 'Erreur de connexion', isLoading: false });
      return false;
    }
  },

  register: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const result = await authAPI.register(data);
      
      if (result.error) {
        set({ error: 'Erreur lors de l\'inscription', isLoading: false });
        return false;
      }

      if (result.data) {
        set({
          user: result.data.user,
          restaurant: result.data.restaurant,
          isAuthenticated: true,
          isLoading: false,
        });
        return true;
      }

      return false;
    } catch (err) {
      set({ error: 'Erreur lors de l\'inscription', isLoading: false });
      return false;
    }
  },

  logout: async () => {
    try {
      await authAPI.logout();
      set({ user: null, restaurant: null, isAuthenticated: false });
    } catch (err) {
      console.error('Logout error:', err);
      set({ user: null, restaurant: null, isAuthenticated: false });
    }
  },

  me: async () => {
    set({ isLoading: true });
    try {
      const result = await authAPI.me();
      
      if (result.data) {
        set({
          user: result.data.user,
          restaurant: result.data.restaurant,
          isAuthenticated: true,
          error: null,
        });
      } else if (result.error) {
        // Token invalide ou expiré
        localStorage.removeItem('authToken');
        set({
          user: null,
          restaurant: null,
          isAuthenticated: false,
          error: 'Session expired. Please login again.',
        });
      }
    } catch (err) {
      console.error('Me error:', err);
      localStorage.removeItem('authToken');
      set({
        user: null,
        restaurant: null,
        isAuthenticated: false,
        error: 'Failed to verify session',
      });
    } finally {
      set({ isLoading: false });
    }
  },

  updateRestaurant: (restaurant) => set({ restaurant }),

  clearError: () => set({ error: null }),
}));
