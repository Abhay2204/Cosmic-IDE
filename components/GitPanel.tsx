import React, { useState, useEffect } from 'react';
import { 
  GitBranch, GitCommit, GitMerge, GitPullRequest, 
  RefreshCw, Check, Plus, Minus, ChevronDown, ChevronRight,
  Upload, Download, RotateCcw, Trash2, Eye
} from 'lucide-react';
import { FileNode } from '../types';
import { gitService, GitCommit as GitCommitType, GitBranch as GitBranchType } from '../services/gitService';
import { generateCommitMessage } from '../services/geminiService';

interface GitPanelProps {
  modifiedFiles: FileNode[];
  onCommit: () => void;
  workingDir?: string;
}

interface GitFile {
  status: 'M' | 'A' | 'D' | 'U' | '?';
  file: string;
  staged: boolean;
}

export const GitPanel: React.FC<GitPanelProps> = ({ modifiedFiles, onCommit, workingDir }) => {
  const [commitMsg, setCommitMsg] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentBranch, setCurrentBranch] = useState('main');
  const [branches, setBranches] = useState<GitBranchType[]>([]);
  const [commits, setCommits] = useState<GitCommitType[]>([]);
  const [stagedFiles, setStagedFiles] = useState<string[]>([]);
  const [showBranches, setShowBranches] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [gitFiles, setGitFiles] = useState<GitFile[]>([]);

  useEffect(() => {
    loadGitData();
  }, [workingDir]);

  const loadGitData = async () => {
    const branch = await gitService.currentBranch();
    setCurrentBranch(branch);
    
    const branchList = await gitService.branches();
    setBranches(branchList);
    
    const commitList = await gitService.log(5);
    setCommits(commitList);

    // Convert modified files to git files
    const files: GitFile[] = modifiedFiles.map(f => ({
      status: 'M' as const,
      file: f.name,
      staged: stagedFiles.includes(f.id)
    }));
    setGitFiles(files);
  };

  const handleGenerateCommitMsg = async () => {
    if (modifiedFiles.length === 0) return;
    
    setIsGenerating(true);
    const diff = modifiedFiles.map(f => `File: ${f.name}\n${f.content}`).join('\n');
    const msg = await generateCommitMessage(diff);
    setCommitMsg(msg);
    setIsGenerating(false);
  };

  const handleStageFile = (fileId: string) => {
    if (stagedFiles.includes(fileId)) {
      setStagedFiles(prev => prev.filter(id => id !== fileId));
    } else {
      setStagedFiles(prev => [...prev, fileId]);
    }
  };

  const handleStageAll = () => {
    setStagedFiles(modifiedFiles.map(f => f.id));
  };

  const handleUnstageAll = () => {
    setStagedFiles([]);
  };

  const handleCommit = async () => {
    if (!commitMsg.trim()) return;
    
    await gitService.commit(commitMsg);
    setCommitMsg('');
    setStagedFiles([]);
    onCommit();
    loadGitData();
  };

  const handlePush = async () => {
    await gitService.push();
  };

  const handlePull = async () => {
    await gitService.pull();
    loadGitData();
  };

  const handleCheckout = async (branch: string) => {
    await gitService.checkout(branch);
    setCurrentBranch(branch);
    setShowBranches(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'M': return 'text-yellow-400';
      case 'A': return 'text-green-400';
      case 'D': return 'text-red-400';
      case 'U': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'M': return 'Modified';
      case 'A': return 'Added';
      case 'D': return 'Deleted';
      case 'U': return 'Untracked';
      default: return 'Unknown';
    }
  };

  return (
    <div className="flex flex-col h-full bg-cosmic-800 text-gray-300">
      {/* Header */}
      <div className="p-3 border-b border-cosmic-700 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <GitBranch className="w-4 h-4 text-cosmic-accent" />
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500">Source Control</span>
        </div>
        <div className="flex items-center gap-1">
          <button onClick={handlePull} className="p-1 hover:bg-cosmic-700 rounded" title="Pull">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={handlePush} className="p-1 hover:bg-cosmic-700 rounded" title="Push">
            <Upload className="w-3.5 h-3.5" />
          </button>
          <button onClick={loadGitData} className="p-1 hover:bg-cosmic-700 rounded" title="Refresh">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Branch Selector */}
      <div className="px-3 py-2 border-b border-cosmic-700">
        <button 
          onClick={() => setShowBranches(!showBranches)}
          className="flex items-center gap-2 text-sm hover:text-white w-full"
        >
          <GitBranch className="w-4 h-4 text-green-400" />
          <span className="font-medium">{currentBranch}</span>
          <ChevronDown className={`w-3 h-3 ml-auto transition-transform ${showBranches ? 'rotate-180' : ''}`} />
        </button>
        
        {showBranches && (
          <div className="mt-2 bg-cosmic-900 rounded border border-cosmic-600 overflow-hidden">
            {branches.map(branch => (
              <button
                key={branch.name}
                onClick={() => handleCheckout(branch.name)}
                className={`w-full px-3 py-1.5 text-left text-sm hover:bg-cosmic-700 flex items-center gap-2 ${
                  branch.current ? 'text-green-400' : 'text-gray-400'
                }`}
              >
                {branch.current && <Check className="w-3 h-3" />}
                <span className={branch.current ? '' : 'ml-5'}>{branch.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Commit Message */}
      <div className="p-3 border-b border-cosmic-700">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs text-gray-500">Commit Message</span>
          <button
            onClick={handleGenerateCommitMsg}
            disabled={isGenerating || modifiedFiles.length === 0}
            className="text-[10px] px-2 py-0.5 bg-cosmic-accent/20 text-cosmic-accent rounded hover:bg-cosmic-accent/30 disabled:opacity-50"
          >
            {isGenerating ? 'Generating...' : '✨ AI Generate'}
          </button>
        </div>
        <textarea
          value={commitMsg}
          onChange={(e) => setCommitMsg(e.target.value)}
          placeholder="Enter commit message..."
          className="w-full h-20 bg-cosmic-900 border border-cosmic-600 rounded p-2 text-sm resize-none focus:border-cosmic-accent outline-none"
        />
        <button
          onClick={handleCommit}
          disabled={!commitMsg.trim() || stagedFiles.length === 0}
          className="w-full mt-2 py-1.5 bg-green-600 hover:bg-green-500 text-white text-sm rounded flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Check className="w-3.5 h-3.5" />
          Commit ({stagedFiles.length} files)
        </button>
      </div>

      {/* Staged Changes */}
      <div className="flex-1 overflow-y-auto">
        {/* Staged Section */}
        <div className="border-b border-cosmic-700">
          <div className="px-3 py-2 flex items-center justify-between bg-cosmic-900/50">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Staged Changes ({stagedFiles.length})
            </span>
            {stagedFiles.length > 0 && (
              <button onClick={handleUnstageAll} className="text-[10px] text-gray-500 hover:text-white">
                Unstage All
              </button>
            )}
          </div>
          {stagedFiles.length > 0 ? (
            <div className="px-2 py-1">
              {modifiedFiles.filter(f => stagedFiles.includes(f.id)).map(file => (
                <div 
                  key={file.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-cosmic-700 rounded group"
                >
                  <span className="text-green-400 font-mono text-xs w-4">M</span>
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <button 
                    onClick={() => handleStageFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-cosmic-600 rounded"
                    title="Unstage"
                  >
                    <Minus className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-gray-600 italic">No staged changes</div>
          )}
        </div>

        {/* Changes Section */}
        <div>
          <div className="px-3 py-2 flex items-center justify-between bg-cosmic-900/50">
            <span className="text-xs font-bold text-gray-500 uppercase">
              Changes ({modifiedFiles.length - stagedFiles.length})
            </span>
            {modifiedFiles.length > stagedFiles.length && (
              <button onClick={handleStageAll} className="text-[10px] text-gray-500 hover:text-white">
                Stage All
              </button>
            )}
          </div>
          {modifiedFiles.filter(f => !stagedFiles.includes(f.id)).length > 0 ? (
            <div className="px-2 py-1">
              {modifiedFiles.filter(f => !stagedFiles.includes(f.id)).map(file => (
                <div 
                  key={file.id}
                  className="flex items-center gap-2 px-2 py-1 hover:bg-cosmic-700 rounded group"
                >
                  <span className="text-yellow-400 font-mono text-xs w-4">M</span>
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <button 
                    onClick={() => handleStageFile(file.id)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-cosmic-600 rounded"
                    title="Stage"
                  >
                    <Plus className="w-3 h-3" />
                  </button>
                  <button 
                    className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-cosmic-600 rounded"
                    title="Discard"
                  >
                    <RotateCcw className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="px-3 py-2 text-xs text-gray-600 italic">No unstaged changes</div>
          )}
        </div>

        {/* Commit History */}
        <div className="border-t border-cosmic-700 mt-2">
          <button 
            onClick={() => setShowHistory(!showHistory)}
            className="w-full px-3 py-2 flex items-center justify-between bg-cosmic-900/50 hover:bg-cosmic-700"
          >
            <span className="text-xs font-bold text-gray-500 uppercase flex items-center gap-2">
              <GitCommit className="w-3 h-3" />
              Recent Commits
            </span>
            <ChevronRight className={`w-3 h-3 transition-transform ${showHistory ? 'rotate-90' : ''}`} />
          </button>
          
          {showHistory && (
            <div className="px-2 py-1">
              {commits.map(commit => (
                <div key={commit.oid} className="px-2 py-2 hover:bg-cosmic-700 rounded cursor-pointer">
                  <div className="flex items-center gap-2">
                    <span className="text-cosmic-accent font-mono text-xs">{commit.oid.slice(0, 7)}</span>
                    <span className="text-sm truncate flex-1">{commit.message}</span>
                  </div>
                  <div className="text-[10px] text-gray-600 mt-1">
                    {commit.author.name} • {new Date(commit.author.timestamp).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default GitPanel;
