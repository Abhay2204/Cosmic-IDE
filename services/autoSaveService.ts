// Auto-save service for Cosmic IDE
import { FileNode } from '../types';

export class AutoSaveService {
  private saveInterval: NodeJS.Timeout | null = null;
  private pendingSaves = new Set<string>();

  constructor(private onSaveFile: (file: FileNode) => Promise<void>) {}

  startAutoSave(intervalMs: number = 2000) {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
    }

    this.saveInterval = setInterval(() => {
      this.processPendingSaves();
    }, intervalMs);

    console.log(`🔄 Auto-save enabled (${intervalMs}ms interval)`);
  }

  stopAutoSave() {
    if (this.saveInterval) {
      clearInterval(this.saveInterval);
      this.saveInterval = null;
      console.log('🛑 Auto-save disabled');
    }
  }

  markForSave(fileId: string) {
    this.pendingSaves.add(fileId);
  }

  private async processPendingSaves() {
    if (this.pendingSaves.size === 0) return;

    const electronAPI = (window as any).electronAPI;
    if (!electronAPI?.writeFile) return;

    // Get files that need saving (this would need to be passed in or accessed globally)
    // For now, we'll emit an event that the main app can listen to
    window.dispatchEvent(new CustomEvent('autoSave:processPending', {
      detail: { fileIds: Array.from(this.pendingSaves) }
    }));

    this.pendingSaves.clear();
  }

  async saveFile(file: FileNode): Promise<boolean> {
    const electronAPI = (window as any).electronAPI;
    
    if (!electronAPI?.writeFile || !file.path) {
      return false;
    }

    try {
      const result = await electronAPI.writeFile(file.path, file.content);
      if (result.success) {
        console.log(`💾 Auto-saved: ${file.name}`);
        return true;
      } else {
        console.error(`❌ Auto-save failed for ${file.name}:`, result.error);
        return false;
      }
    } catch (error) {
      console.error(`❌ Auto-save error for ${file.name}:`, error);
      return false;
    }
  }
}

// Singleton instance
export const autoSaveService = new AutoSaveService(async (file) => {
  // This will be implemented in the main app
});