// Formatter Service - Code formatting using extensions
import { extensionManager } from './extensionSystem';

export class FormatterService {
  
  /**
   * Format code using available formatters from extensions
   */
  formatCode(code: string, language: string): string {
    const formatter = extensionManager.getFormatter(language);
    
    if (formatter) {
      try {
        return formatter.format(code);
      } catch (error) {
        console.error('Formatting error:', error);
        return code; // Return original code if formatting fails
      }
    }
    
    // Fallback: basic formatting for common languages
    return this.basicFormat(code, language);
  }

  /**
   * Check if a formatter is available for the given language
   */
  isFormatterAvailable(language: string): boolean {
    return extensionManager.getFormatter(language) !== undefined;
  }

  /**
   * Basic formatting fallback
   */
  private basicFormat(code: string, language: string): string {
    switch (language) {
      case 'javascript':
      case 'typescript':
      case 'javascriptreact':
      case 'typescriptreact':
        return this.formatJavaScript(code);
      case 'json':
        return this.formatJSON(code);
      case 'css':
        return this.formatCSS(code);
      case 'html':
        return this.formatHTML(code);
      default:
        return this.formatGeneric(code);
    }
  }

  private formatJavaScript(code: string): string {
    try {
      // Basic JavaScript formatting
      let formatted = code;
      
      // Fix indentation
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const indentSize = 2;
      
      const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        // Decrease indent for closing braces
        if (trimmed.startsWith('}') || trimmed.startsWith(']') || trimmed.startsWith(')')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
        
        // Increase indent for opening braces
        if (trimmed.endsWith('{') || trimmed.endsWith('[') || trimmed.endsWith('(')) {
          indentLevel++;
        }
        
        return indentedLine;
      });
      
      return formattedLines.join('\n');
    } catch (error) {
      return code;
    }
  }

  private formatJSON(code: string): string {
    try {
      const parsed = JSON.parse(code);
      return JSON.stringify(parsed, null, 2);
    } catch (error) {
      return code;
    }
  }

  private formatCSS(code: string): string {
    try {
      // Basic CSS formatting
      let formatted = code;
      
      // Add newlines after semicolons and braces
      formatted = formatted.replace(/;/g, ';\n');
      formatted = formatted.replace(/{/g, ' {\n');
      formatted = formatted.replace(/}/g, '\n}\n');
      
      // Fix indentation
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const indentSize = 2;
      
      const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        if (trimmed === '}') {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
        
        if (trimmed.endsWith('{')) {
          indentLevel++;
        }
        
        return indentedLine;
      });
      
      return formattedLines.join('\n');
    } catch (error) {
      return code;
    }
  }

  private formatHTML(code: string): string {
    try {
      // Basic HTML formatting
      let formatted = code;
      
      // Add newlines after tags
      formatted = formatted.replace(/></g, '>\n<');
      
      // Fix indentation
      const lines = formatted.split('\n');
      let indentLevel = 0;
      const indentSize = 2;
      
      const formattedLines = lines.map(line => {
        const trimmed = line.trim();
        if (!trimmed) return '';
        
        // Decrease indent for closing tags
        if (trimmed.startsWith('</')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }
        
        const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
        
        // Increase indent for opening tags (but not self-closing)
        if (trimmed.startsWith('<') && !trimmed.startsWith('</') && !trimmed.endsWith('/>')) {
          indentLevel++;
        }
        
        return indentedLine;
      });
      
      return formattedLines.join('\n');
    } catch (error) {
      return code;
    }
  }

  private formatGeneric(code: string): string {
    // Basic indentation fix for any language
    const lines = code.split('\n');
    let indentLevel = 0;
    const indentSize = 2;
    
    const formattedLines = lines.map(line => {
      const trimmed = line.trim();
      if (!trimmed) return '';
      
      // Simple brace-based indentation
      if (trimmed.includes('}') || trimmed.includes(']') || trimmed.includes(')')) {
        indentLevel = Math.max(0, indentLevel - 1);
      }
      
      const indentedLine = ' '.repeat(indentLevel * indentSize) + trimmed;
      
      if (trimmed.includes('{') || trimmed.includes('[') || trimmed.includes('(')) {
        indentLevel++;
      }
      
      return indentedLine;
    });
    
    return formattedLines.join('\n');
  }
}

// Singleton instance
export const formatterService = new FormatterService();