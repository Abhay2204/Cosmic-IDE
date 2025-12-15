import React, { useState } from 'react';
import { FileNode, FileType } from '../types';
import { Folder, Plus } from 'lucide-react';
import { FileTree } from './FileTree';

interface SidebarProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
  onNewFile: () => void;
  onDeleteFile?: (id: string) => void;
  onRenameFile?: (id: string, newName: string) => void;
  workspaceFolder?: string | null;
}



export const Sidebar: React.FC<SidebarProps> = ({ files, activeFileId, onFileSelect, onNewFile, onDeleteFile, onRenameFile, workspaceFolder }) => {
  const [isSrcOpen, setIsSrcOpen] = useState(true);
  const [showNewFileDialog, setShowNewFileDialog] = useState(false);
  const [newFileName, setNewFileName] = useState('');

  const handleNewFile = () => {
    console.log('handleNewFile called, showing dialog');
    setShowNewFileDialog(true);
    setNewFileName('');
  };

  const handleCreateFile = () => {
    if (newFileName.trim()) {
      console.log('Dispatching createFileWithName event with name:', newFileName.trim());
      // Dispatch event to App component to create file with specific name
      const event = new CustomEvent('createFileWithName', {
        detail: { name: newFileName.trim() }
      });
      const dispatched = window.dispatchEvent(event);
      console.log('Event dispatched successfully:', dispatched);
      
      setShowNewFileDialog(false);
      setNewFileName('');
    }
  };

  const handleNewFolder = () => {
    const folderName = prompt('Enter folder name:');
    if (folderName?.trim()) {
      console.log('Dispatching createFolder event with name:', folderName.trim());
      window.dispatchEvent(new CustomEvent('createFolder', {
        detail: { name: folderName.trim() }
      }));
    }
  };

  return (
    <div className="h-full bg-cosmic-800 border-r border-cosmic-600 flex flex-col text-sm select-none">
      <div className="p-3 text-xs font-bold text-gray-400 uppercase tracking-wider flex justify-between items-center">
        <span>Explorer</span>
        <div className="flex gap-1">
          <button 
            onClick={handleNewFile} 
            className="hover:text-white p-1 rounded hover:bg-cosmic-600"
            title="New File"
          >
            <Plus className="w-3 h-3" />
          </button>
          <button 
            onClick={handleNewFolder} 
            className="hover:text-white p-1 rounded hover:bg-cosmic-600"
            title="New Folder"
          >
            <Folder className="w-3 h-3" />
          </button>

        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {/* Project Root */}
        <div className="px-2 py-1">
          <div 
            className="flex items-center gap-1 cursor-pointer hover:bg-cosmic-700 text-gray-300 py-1 px-1 rounded mb-2"
            onClick={() => setIsSrcOpen(!isSrcOpen)}
          >
            <span className="font-bold text-cosmic-accent">
              {workspaceFolder ? workspaceFolder.split(/[/\\]/).pop() : 'cosmic-project'}
            </span>
            {workspaceFolder && (
              <span className="text-xs text-gray-500 ml-2 truncate">
                {workspaceFolder}
              </span>
            )}
          </div>

          {isSrcOpen && (
            <FileTree
              files={files}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
              workspaceFolder={workspaceFolder}
            />
          )}
        </div>
      </div>

      {/* New File Dialog */}
      {showNewFileDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-cosmic-800 border border-cosmic-600 rounded-lg p-6 w-96">
            <h3 className="text-lg font-semibold text-white mb-4">Create New File</h3>
            <input
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleCreateFile();
                } else if (e.key === 'Escape') {
                  setShowNewFileDialog(false);
                }
              }}
              placeholder="Enter file name (e.g., main.ts, app.py, index.js)"
              className="w-full px-3 py-2 bg-cosmic-900 border border-cosmic-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-cosmic-accent"
              autoFocus
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCreateFile}
                className="px-4 py-2 bg-cosmic-accent text-white rounded hover:bg-cosmic-accent/80 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => setShowNewFileDialog(false)}
                className="px-4 py-2 bg-cosmic-700 text-gray-300 rounded hover:bg-cosmic-600 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};