/**
 * Simplified Marketplace Service - VS Code compatibility removed for stability
 */

export class MarketplaceService {
  constructor() {
    console.log('Marketplace service simplified for stability');
  }
  
  searchExtensions() {
    return Promise.resolve([]);
  }
  
  downloadExtension() {
    return Promise.resolve(null);
  }
}

// Export singleton instance
export const marketplaceService = new MarketplaceService();