import React from 'react';
import { Folder, Shield, Sparkles, CheckCircle } from 'lucide-react';

interface WorkspaceInitializerProps {
  isInitializing: boolean;
  workspaceName: string;
}

export const WorkspaceInitializer: React.FC<WorkspaceInitializerProps> = ({
  isInitializing,
  workspaceName
}) => {
  if (!isInitializing) return null;

  return (
    <div className="h-screen w-screen flex items-center justify-center bg-cosmic-900">
      <div className="text-center max-w-md">
        {/* Logo */}
        <div className="text-6xl mb-6">🚀</div>
        
        {/* Title */}
        <h1 className="text-2xl font-bold text-white mb-2">Cosmic IDE</h1>
        <p className="text-gray-400 mb-8">Setting up your workspace...</p>
        
        {/* Progress Steps */}
        <div className="space-y-4 text-left">
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>Creating safe workspace folder</span>
          </div>
          
          <div className="flex items-center gap-3 text-green-400">
            <CheckCircle className="w-5 h-5" />
            <span>Protecting IDE files</span>
          </div>
          
          <div className="flex items-center gap-3 text-cosmic-accent">
            <div className="w-5 h-5 border-2 border-cosmic-accent border-t-transparent rounded-full animate-spin"></div>
            <span>Initializing workspace: {workspaceName}</span>
          </div>
          
          <div className="flex items-center gap-3 text-gray-500">
            <div className="w-5 h-5 border-2 border-gray-600 rounded-full"></div>
            <span>Loading AI Agent</span>
          </div>
        </div>
        
        {/* Features */}
        <div className="mt-8 p-4 bg-cosmic-800 rounded-lg border border-cosmic-700">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-green-400" />
            Safe Development Environment
          </h3>
          <div className="text-sm text-gray-400 space-y-2">
            <div className="flex items-center gap-2">
              <Folder className="w-3 h-3" />
              <span>Projects organized in separate folders</span>
            </div>
            <div className="flex items-center gap-2">
              <Shield className="w-3 h-3" />
              <span>IDE files protected from overwrites</span>
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-3 h-3" />
              <span>AI creates files safely in workspace</span>
            </div>
          </div>
        </div>
        
        <p className="text-xs text-gray-500 mt-4">
          Your workspace keeps everything organized and safe
        </p>
      </div>
    </div>
  );
};