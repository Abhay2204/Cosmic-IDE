/**
 * Simplified LSP Client - Complex features removed for stability
 */

export class LSPClient {
  constructor() {
    console.log('LSP client simplified for stability');
  }
  
  getCompletions() {
    return Promise.resolve([]);
  }
  
  getHover() {
    return Promise.resolve(null);
  }
  
  getDefinition() {
    return Promise.resolve(null);
  }
  
  openDocument() {
    // Simplified
  }
  
  updateDocument() {
    // Simplified
  }
}

// Export singleton instance
export const lspClient = new LSPClient();