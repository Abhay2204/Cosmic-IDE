// Theme Service - Manages IDE themes from extensions
import { extensionManager, Theme } from './extensionSystem';

export class ThemeService {
  private currentTheme: Theme | null = null;
  private listeners: Set<(theme: Theme | null) => void> = new Set();

  constructor() {
    this.loadSavedTheme();
    
    // Listen for extension changes
    extensionManager.subscribe(() => {
      this.updateAvailableThemes();
    });
  }

  private loadSavedTheme() {
    try {
      const savedThemeId = localStorage.getItem('cosmic-current-theme');
      if (savedThemeId) {
        const theme = this.getThemeById(savedThemeId);
        if (theme) {
          this.applyTheme(theme);
        }
      }
    } catch (error) {
      console.error('Failed to load saved theme:', error);
    }
  }

  private updateAvailableThemes() {
    // If current theme is no longer available, reset to default
    if (this.currentTheme) {
      const stillAvailable = this.getThemeById(this.currentTheme.id);
      if (!stillAvailable) {
        this.resetToDefault();
      }
    }
  }

  subscribe(listener: (theme: Theme | null) => void) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private notify() {
    this.listeners.forEach(listener => listener(this.currentTheme));
  }

  getAvailableThemes(): Theme[] {
    const themes: Theme[] = [];
    
    // Get themes from all installed extensions
    extensionManager.getInstalled().forEach(extension => {
      if (extension.themes) {
        themes.push(...extension.themes);
      }
    });

    return themes;
  }

  getThemeById(id: string): Theme | undefined {
    return this.getAvailableThemes().find(theme => theme.id === id);
  }

  getCurrentTheme(): Theme | null {
    return this.currentTheme;
  }

  applyTheme(theme: Theme) {
    this.currentTheme = theme;
    
    // Apply CSS custom properties
    const root = document.documentElement;
    
    // Apply theme colors
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Update cosmic color variables to match theme
    if (theme.colors.background) {
      root.style.setProperty('--cosmic-900', theme.colors.background);
    }
    if (theme.colors.foreground) {
      root.style.setProperty('--cosmic-100', theme.colors.foreground);
    }
    if (theme.colors.accent) {
      root.style.setProperty('--cosmic-accent', theme.colors.accent);
    }
    if (theme.colors.selection) {
      root.style.setProperty('--cosmic-700', theme.colors.selection);
    }

    // Save theme preference
    localStorage.setItem('cosmic-current-theme', theme.id);
    
    // Notify listeners
    this.notify();
  }

  resetToDefault() {
    this.currentTheme = null;
    
    // Reset to default cosmic theme
    const root = document.documentElement;
    root.style.removeProperty('--theme-background');
    root.style.removeProperty('--theme-foreground');
    root.style.removeProperty('--theme-accent');
    root.style.removeProperty('--theme-selection');
    
    // Reset cosmic variables to defaults
    root.style.setProperty('--cosmic-900', '#05050A');
    root.style.setProperty('--cosmic-800', '#0A0A12');
    root.style.setProperty('--cosmic-700', '#13131F');
    root.style.setProperty('--cosmic-600', '#1C1C2E');
    root.style.setProperty('--cosmic-500', '#2A2A40');
    root.style.setProperty('--cosmic-accent', '#6366f1');
    
    localStorage.removeItem('cosmic-current-theme');
    this.notify();
  }

  // Get theme-aware colors for editor
  getEditorColors() {
    if (!this.currentTheme) {
      return {
        background: '#05050A',
        foreground: '#e4e4e7',
        accent: '#6366f1',
        selection: '#2A2A40',
        lineNumber: '#4b5563',
        cursor: '#ffffff'
      };
    }

    return {
      background: this.currentTheme.colors.background || '#05050A',
      foreground: this.currentTheme.colors.foreground || '#e4e4e7',
      accent: this.currentTheme.colors.accent || '#6366f1',
      selection: this.currentTheme.colors.selection || '#2A2A40',
      lineNumber: this.currentTheme.colors.lineNumber || '#4b5563',
      cursor: this.currentTheme.colors.cursor || '#ffffff'
    };
  }
}

// Singleton instance
export const themeService = new ThemeService();