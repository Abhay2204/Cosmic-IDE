import React, { useState } from 'react';
import { FileNode, FileType } from '../types';
import { 
  Folder, FolderOpen, FileCode, FileJson, FileText, 
  ChevronRight, ChevronDown, MoreVertical, Trash2, Edit2 
} from 'lucide-react';

interface FileTreeNode {
  name: string;
  path: string;
  isDirectory: boolean;
  children?: FileTreeNode[];
}

interface FileTreeProps {
  files: FileNode[];
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
  onDeleteFile?: (id: string) => void;
  onRenameFile?: (id: string, newName: string) => void;
  workspaceFolder?: string | null;
}

const FileIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'rust': return <FileCode className="w-4 h-4 text-orange-400" />;
    case 'typescript': return <FileCode className="w-4 h-4 text-blue-400" />;
    case 'javascript': return <FileCode className="w-4 h-4 text-yellow-400" />;
    case 'python': return <FileCode className="w-4 h-4 text-green-400" />;
    case 'java': return <FileCode className="w-4 h-4 text-red-400" />;
    case 'go': return <FileCode className="w-4 h-4 text-cyan-400" />;
    case 'cpp': return <FileCode className="w-4 h-4 text-blue-500" />;
    case 'csharp': return <FileCode className="w-4 h-4 text-purple-400" />;
    case 'ruby': return <FileCode className="w-4 h-4 text-red-500" />;
    case 'php': return <FileCode className="w-4 h-4 text-indigo-400" />;
    case 'swift': return <FileCode className="w-4 h-4 text-orange-500" />;
    case 'kotlin': return <FileCode className="w-4 h-4 text-purple-500" />;
    case 'html': return <FileCode className="w-4 h-4 text-orange-300" />;
    case 'css': return <FileCode className="w-4 h-4 text-blue-300" />;
    case 'json': return <FileJson className="w-4 h-4 text-yellow-400" />;
    case 'markdown': return <FileText className="w-4 h-4 text-blue-200" />;
    case 'yaml': return <FileText className="w-4 h-4 text-red-300" />;
    case 'sql': return <FileText className="w-4 h-4 text-blue-600" />;
    case 'shell': return <FileText className="w-4 h-4 text-green-300" />;
    case 'dockerfile': return <FileText className="w-4 h-4 text-blue-400" />;
    case 'toml': return <FileText className="w-4 h-4 text-gray-300" />;
    case 'xml': return <FileText className="w-4 h-4 text-green-500" />;
    default: return <FileText className="w-4 h-4 text-gray-400" />;
  }
};

const TreeNode: React.FC<{
  node: FileTreeNode;
  level: number;
  files: FileNode[];
  activeFileId: string | null;
  onFileSelect: (id: string) => void;
  onDeleteFile?: (id: string) => void;
  onRenameFile?: (id: string, newName: string) => void;
  expandedFolders: Set<string>;
  onToggleFolder: (path: string) => void;
}> = ({ 
  node, 
  level, 
  files, 
  activeFileId, 
  onFileSelect, 
  onDeleteFile, 
  onRenameFile,
  expandedFolders,
  onToggleFolder
}) => {
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const isExpanded = expandedFolders.has(node.path);
  const file = files.find(f => f.path === node.path);
  const isActive = file && file.id === activeFileId;

  const handleClick = () => {
    if (node.isDirectory) {
      onToggleFolder(node.path);
    } else if (file) {
      onFileSelect(file.id);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleRename = () => {
    if (file) {
      setRenamingId(file.id);
      setRenameValue(file.name);
    }
    setContextMenu(null);
  };

  const handleDelete = () => {
    if (file && onDeleteFile) {
      onDeleteFile(file.id);
    }
    setContextMenu(null);
  };

  const handleRenameSubmit = () => {
    if (file && renameValue.trim() && onRenameFile) {
      onRenameFile(file.id, renameValue.trim());
    }
    setRenamingId(null);
  };

  return (
    <>
      <div
        className={`
          flex items-center gap-2 py-1 px-2 rounded cursor-pointer mb-0.5 group relative
          ${isActive ? 'bg-cosmic-600 text-white' : 'text-gray-400 hover:text-gray-200 hover:bg-cosmic-700/50'}
        `}
        style={{ paddingLeft: `${level * 12 + 8}px` }}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
      >
        {node.isDirectory ? (
          <>
            {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
            {isExpanded ? <FolderOpen className="w-4 h-4 text-blue-400" /> : <Folder className="w-4 h-4 text-blue-400" />}
          </>
        ) : (
          <>
            <div className="w-3 h-3" /> {/* Spacer for alignment */}
            {file && <FileIcon type={file.type} />}
          </>
        )}
        
        {renamingId === file?.id ? (
          <input
            type="text"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleRenameSubmit();
              } else if (e.key === 'Escape') {
                setRenamingId(null);
              }
            }}
            className="flex-1 bg-cosmic-900 border border-cosmic-accent rounded px-1 text-sm text-white outline-none"
            autoFocus
          />
        ) : (
          <>
            <span className="flex-1">{node.name}</span>
            {file?.isModified && <div className="w-2 h-2 rounded-full bg-yellow-500" />}
            {!node.isDirectory && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleContextMenu(e);
                }}
                className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-cosmic-600 rounded"
              >
                <MoreVertical className="w-3 h-3" />
              </button>
            )}
          </>
        )}
      </div>

      {node.isDirectory && isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <TreeNode
              key={child.path}
              node={child}
              level={level + 1}
              files={files}
              activeFileId={activeFileId}
              onFileSelect={onFileSelect}
              onDeleteFile={onDeleteFile}
              onRenameFile={onRenameFile}
              expandedFolders={expandedFolders}
              onToggleFolder={onToggleFolder}
            />
          ))}
        </div>
      )}

      {/* Context Menu */}
      {contextMenu && (
        <>
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setContextMenu(null)}
          />
          <div 
            className="fixed z-50 bg-cosmic-800 border border-cosmic-600 rounded-lg shadow-2xl py-1 w-48"
            style={{ left: contextMenu.x, top: contextMenu.y }}
          >
            <button
              onClick={handleRename}
              className="w-full px-3 py-1.5 text-left text-sm text-gray-300 hover:bg-cosmic-700 hover:text-white flex items-center gap-2"
            >
              <Edit2 className="w-3 h-3" /> Rename
            </button>
            <button
              onClick={handleDelete}
              className="w-full px-3 py-1.5 text-left text-sm text-red-400 hover:bg-red-900/30 hover:text-red-300 flex items-center gap-2"
            >
              <Trash2 className="w-3 h-3" /> Delete
            </button>
          </div>
        </>
      )}
    </>
  );
};

export const FileTree: React.FC<FileTreeProps> = ({ 
  files, 
  activeFileId, 
  onFileSelect, 
  onDeleteFile, 
  onRenameFile,
  workspaceFolder 
}) => {
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  // Build tree structure from flat file list
  const buildTree = (files: FileNode[]): FileTreeNode[] => {
    const tree: FileTreeNode[] = [];
    const folderMap = new Map<string, FileTreeNode>();

    // Sort files by relative path to ensure proper tree building
    const sortedFiles = [...files].sort((a, b) => {
      const pathA = (a as any).relativePath || a.name;
      const pathB = (b as any).relativePath || b.name;
      return pathA.localeCompare(pathB);
    });

    sortedFiles.forEach(file => {
      // Use relative path if available, otherwise use just the filename
      const relativePath = (file as any).relativePath || file.name;
      const pathParts = relativePath.split(/[/\\]/).filter(Boolean);
      
      // Skip if this is a system path (contains C:, Users, etc.)
      if (pathParts.some(part => ['C:', 'Users', 'Documents'].includes(part))) {
        return;
      }
      
      let currentPath = '';
      
      pathParts.forEach((part, index) => {
        const parentPath = currentPath;
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        
        if (index === pathParts.length - 1) {
          // This is the file
          const fileNode: FileTreeNode = {
            name: part,
            path: file.path, // Keep full path for file operations
            isDirectory: false
          };
          
          if (parentPath && folderMap.has(parentPath)) {
            const parent = folderMap.get(parentPath)!;
            if (!parent.children) parent.children = [];
            parent.children.push(fileNode);
          } else {
            tree.push(fileNode);
          }
        } else {
          // This is a directory
          if (!folderMap.has(currentPath)) {
            const folderNode: FileTreeNode = {
              name: part,
              path: currentPath,
              isDirectory: true,
              children: []
            };
            
            folderMap.set(currentPath, folderNode);
            
            if (parentPath && folderMap.has(parentPath)) {
              const parent = folderMap.get(parentPath)!;
              if (!parent.children) parent.children = [];
              parent.children.push(folderNode);
            } else {
              tree.push(folderNode);
            }
          }
        }
      });
    });

    // Sort tree nodes (directories first, then alphabetically)
    const sortNodes = (nodes: FileTreeNode[]): FileTreeNode[] => {
      return nodes.sort((a, b) => {
        if (a.isDirectory && !b.isDirectory) return -1;
        if (!a.isDirectory && b.isDirectory) return 1;
        return a.name.localeCompare(b.name);
      }).map(node => ({
        ...node,
        children: node.children ? sortNodes(node.children) : undefined
      }));
    };

    return sortNodes(tree);
  };

  const toggleFolder = (path: string) => {
    const newExpanded = new Set(expandedFolders);
    if (newExpanded.has(path)) {
      newExpanded.delete(path);
    } else {
      newExpanded.add(path);
    }
    setExpandedFolders(newExpanded);
  };

  const tree = buildTree(files);

  return (
    <div className="overflow-y-auto">
      {tree.map((node) => (
        <TreeNode
          key={node.path}
          node={node}
          level={0}
          files={files}
          activeFileId={activeFileId}
          onFileSelect={onFileSelect}
          onDeleteFile={onDeleteFile}
          onRenameFile={onRenameFile}
          expandedFolders={expandedFolders}
          onToggleFolder={toggleFolder}
        />
      ))}
    </div>
  );
};