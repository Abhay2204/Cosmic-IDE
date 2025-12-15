import React, { useState, useEffect } from 'react';
import { FileNode } from '../types';
import { liveServerService } from '../services/liveServerService';
import { 
  Play, 
  Square, 
  ExternalLink, 
  RefreshCw, 
  Globe, 
  AlertCircle,
  Eye,
  Code,
  Monitor
} from 'lucide-react';

interface PreviewPanelProps {
  files: FileNode[];
  activeFile?: FileNode;
  workspaceFolder?: string | null;
}

export const PreviewPanel: React.FC<PreviewPanelProps> = ({
  files,
  activeFile,
  workspaceFolder
}) => {
  const [serverStatus, setServerStatus] = useState(liveServerService.getStatus());
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const [previewMode, setPreviewMode] = useState<'iframe' | 'external'>('iframe');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Update server status periodically
  useEffect(() => {
    const interval = setInterval(() => {
      setServerStatus(liveServerService.getStatus());
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  // Auto-generate preview URL when server is running
  useEffect(() => {
    if (serverStatus.isRunning && serverStatus.url) {
      const mainFile = liveServerService.detectMainFile(files);
      const url = mainFile ? `${serverStatus.url}/${mainFile}` : serverStatus.url;
      setPreviewUrl(url);
    } else {
      setPreviewUrl('');
    }
  }, [serverStatus, files]);

  const handleStartServer = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await liveServerService.startServer({
        port: 3001,
        host: 'localhost',
        root: workspaceFolder || '.',
        open: false,
        cors: true
      });

      if (result.success && result.url) {
        setServerStatus({ isRunning: true, port: 3001, url: result.url });
        setPreviewUrl(result.url);
      } else {
        setError(result.error || 'Failed to start server');
      }
    } catch (err) {
      setError(`Server error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStopServer = async () => {
    setIsLoading(true);
    setError('');

    try {
      const result = await liveServerService.stopServer();
      if (result.success) {
        setServerStatus({ isRunning: false });
        setPreviewUrl('');
      } else {
        setError(result.error || 'Failed to stop server');
      }
    } catch (err) {
      setError(`Stop error: ${err}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenExternal = () => {
    if (previewUrl) {
      liveServerService.openInBrowser();
    }
  };

  const handleRefresh = () => {
    // Force iframe refresh
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement;
    if (iframe) {
      iframe.src = iframe.src;
    }
  };

  const getPreviewContent = () => {
    if (!activeFile) {
      return (
        <div className="flex-1 flex items-center justify-center text-gray-500">
          <div className="text-center">
            <Eye className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Select an HTML file to preview</p>
          </div>
        </div>
      );
    }

    // Show HTML content preview for HTML files
    if (activeFile.type === 'html' || activeFile.name.endsWith('.html')) {
      if (serverStatus.isRunning && previewUrl) {
        return (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 p-2 bg-cosmic-800 border-b border-cosmic-700">
              <Globe className="w-4 h-4 text-blue-400" />
              <span className="text-sm text-gray-300 flex-1">{previewUrl}</span>
              <button
                onClick={handleRefresh}
                className="p-1 hover:bg-cosmic-700 rounded"
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
              <button
                onClick={handleOpenExternal}
                className="p-1 hover:bg-cosmic-700 rounded"
                title="Open in Browser"
              >
                <ExternalLink className="w-4 h-4" />
              </button>
            </div>
            
            {previewMode === 'iframe' ? (
              <iframe
                id="preview-iframe"
                src={previewUrl}
                className="flex-1 w-full border-0 bg-white"
                title="Live Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
              />
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <Monitor className="w-12 h-12 mx-auto mb-4" />
                  <p>Preview opened in external browser</p>
                  <button
                    onClick={() => setPreviewMode('iframe')}
                    className="mt-2 px-3 py-1 bg-cosmic-accent text-white rounded text-sm hover:bg-cosmic-accent/80"
                  >
                    Show Inline Preview
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      } else {
        // Show static HTML preview (no server)
        return (
          <div className="flex-1 flex flex-col">
            <div className="flex items-center gap-2 p-2 bg-cosmic-800 border-b border-cosmic-700">
              <Code className="w-4 h-4 text-yellow-400" />
              <span className="text-sm text-gray-300">Static Preview (no server)</span>
            </div>
            
            <iframe
              srcDoc={activeFile.content}
              className="flex-1 w-full border-0 bg-white"
              title="Static HTML Preview"
              sandbox="allow-scripts allow-same-origin"
            />
          </div>
        );
      }
    }

    // For non-HTML files
    return (
      <div className="flex-1 flex items-center justify-center text-gray-500">
        <div className="text-center">
          <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Preview not available for {activeFile.type} files</p>
          <p className="text-xs mt-2">Switch to an HTML file to see preview</p>
        </div>
      </div>
    );
  };

  const htmlFiles = files.filter(f => f.type === 'html' || f.name.endsWith('.html'));

  return (
    <div className="h-full flex flex-col bg-cosmic-900">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-cosmic-700 bg-cosmic-800">
        <div className="flex items-center gap-2">
          <Eye className="w-5 h-5 text-cosmic-accent" />
          <h3 className="font-semibold text-white">Live Preview</h3>
          {htmlFiles.length > 0 && (
            <span className="text-xs bg-cosmic-accent px-2 py-1 rounded text-white">
              {htmlFiles.length} HTML file{htmlFiles.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {serverStatus.isRunning ? (
            <>
              <div className="flex items-center gap-1 text-green-400 text-xs">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                Port {serverStatus.port}
              </div>
              <button
                onClick={handleStopServer}
                disabled={isLoading}
                className="flex items-center gap-1 px-2 py-1 bg-red-600 hover:bg-red-700 text-white rounded text-xs disabled:opacity-50"
              >
                <Square className="w-3 h-3" />
                Stop
              </button>
            </>
          ) : (
            <button
              onClick={handleStartServer}
              disabled={isLoading}
              className="flex items-center gap-1 px-2 py-1 bg-green-600 hover:bg-green-700 text-white rounded text-xs disabled:opacity-50"
            >
              <Play className="w-3 h-3" />
              {isLoading ? 'Starting...' : 'Start Server'}
            </button>
          )}
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-3 bg-red-900/20 border-b border-red-800 flex items-center gap-2 text-red-400">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{error}</span>
          <button
            onClick={() => setError('')}
            className="ml-auto text-red-400 hover:text-red-300"
          >
            ×
          </button>
        </div>
      )}

      {/* Preview Content */}
      {getPreviewContent()}

      {/* Footer Info */}
      <div className="p-2 border-t border-cosmic-700 bg-cosmic-800 text-xs text-gray-500">
        {serverStatus.isRunning ? (
          <div className="flex items-center justify-between">
            <span>Live Server running • Auto-reload enabled</span>
            <span>{serverStatus.url}</span>
          </div>
        ) : (
          <span>Start Live Server to enable hot reload and external access</span>
        )}
      </div>
    </div>
  );
};