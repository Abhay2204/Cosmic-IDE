/**
 * Electron utility functions and type guards
 */

export const isElectron = (): boolean => {
  return typeof window !== 'undefined' && !!window.electronAPI;
};

export const electronAPI = typeof window !== 'undefined' ? window.electronAPI : null;

/**
 * Safe wrapper for Electron file operations
 */
export const fileSystem = {
  async readFile(filePath: string): Promise<string | null> {
    if (!isElectron()) return null;
    const result = await window.electronAPI.readFile(filePath);
    return result.success ? result.content! : null;
  },

  async writeFile(filePath: string, content: string): Promise<boolean> {
    if (!isElectron()) return false;
    const result = await window.electronAPI.writeFile(filePath, content);
    return result.success;
  },

  async readDir(dirPath: string): Promise<any[] | null> {
    if (!isElectron()) return null;
    const result = await window.electronAPI.readDir(dirPath);
    return result.success ? result.files! : null;
  },
};

/**
 * Window controls
 */
export const windowControls = {
  minimize: () => isElectron() && window.electronAPI.minimizeWindow(),
  maximize: () => isElectron() && window.electronAPI.maximizeWindow(),
  close: () => isElectron() && window.electronAPI.closeWindow(),
};
