import { create } from 'zustand';
import * as auth from '../services/authService';

export const useAuthStore = create((set, get) => ({
  user: null,
  isLoggedIn: false,
  isLoading: false,
  error: null,
  gbuxBalance: 0,

  tryRestoreSession: () => {
    const user = auth.getCurrentUser();
    if (user) set({ user, isLoggedIn: true });
  },

  loginGuest: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await auth.loginAsGuest();
      set({ user: auth.getCurrentUser(), isLoggedIn: true, isLoading: false });
      return data;
    } catch (e) {
      set({ error: e.message, isLoading: false });
    }
  },

  loginPuter: async () => {
    set({ isLoading: true, error: null });
    try {
      if (window.puter) {
        if (!window.puter.auth?.isSignedIn?.()) await window.puter.auth.signIn();
        const puterUser = await window.puter.auth.getUser();
        if (puterUser?.uuid) {
          await auth.loginWithPuter(puterUser.uuid, puterUser.username);
          set({ user: auth.getCurrentUser(), isLoggedIn: true, isLoading: false });
          return;
        }
      }
      throw new Error('Puter not available');
    } catch (e) {
      set({ error: e.message, isLoading: false });
    }
  },

  loginDiscord: async () => {
    try {
      const url = await auth.startDiscordLogin();
      if (url) window.location.href = url;
    } catch (e) {
      set({ error: e.message });
    }
  },

  loginCredentials: async (username, password) => {
    set({ isLoading: true, error: null });
    try {
      await auth.loginWithCredentials(username, password);
      set({ user: auth.getCurrentUser(), isLoggedIn: true, isLoading: false });
    } catch (e) {
      set({ error: e.message, isLoading: false });
    }
  },

  register: async (username, password, email) => {
    set({ isLoading: true, error: null });
    try {
      await auth.registerAccount(username, password, email);
      set({ user: auth.getCurrentUser(), isLoggedIn: true, isLoading: false });
    } catch (e) {
      set({ error: e.message, isLoading: false });
    }
  },

  logout: () => {
    auth.logout();
    set({ user: null, isLoggedIn: false, gbuxBalance: 0 });
  },

  refreshGBux: async () => {
    try {
      const data = await auth.getGBuxBalance();
      set({ gbuxBalance: data.balance || 0 });
    } catch { /* silent */ }
  },

  earnGBux: async (amount, reason) => {
    try {
      await auth.earnGBux(amount, reason);
      get().refreshGBux();
    } catch { /* silent */ }
  },
}));
