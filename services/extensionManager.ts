/**
 * Simplified Extension Manager - VS Code compatibility removed for stability
 */

export class ExtensionManager {
  constructor() {
    console.log('Extension manager simplified for stability');
  }
  
  getInstalledExtensions() {
    return [];
  }
  
  installExtension() {
    console.log('Extension installation disabled for stability');
    return Promise.resolve(false);
  }
}

// Export singleton instance
export const extensionManager = new ExtensionManager();