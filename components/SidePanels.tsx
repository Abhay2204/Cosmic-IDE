
import React, { useState } from 'react';
import { Search, GitCommit, Bug, Blocks, Download, Check, AlertTriangle, Play, RefreshCw, X, Loader2 } from 'lucide-react';
import { FileNode, Settings } from '../types';
import { reviewCode } from '../services/aiService';

// --- SEARCH PANEL ---
interface SearchPanelProps {
    files: FileNode[];
    onFileSelect: (id: string) => void;
}

export const SearchPanel: React.FC<SearchPanelProps> = ({ files, onFileSelect }) => {
    const [query, setQuery] = useState('');
    const [replaceQuery, setReplaceQuery] = useState('');
    const [results, setResults] = useState<{fileId: string, fileName: string, line: number, content: string, match: string}[]>([]);
    const [isRegex, setIsRegex] = useState(false);
    const [isCaseSensitive, setIsCaseSensitive] = useState(false);
    const [isWholeWord, setIsWholeWord] = useState(false);
    const [showReplace, setShowReplace] = useState(false);
    const [searchHistory, setSearchHistory] = useState<string[]>([]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const q = e.target.value;
        setQuery(q);
        if (!q) {
            setResults([]);
            return;
        }

        // Add to search history
        if (q && !searchHistory.includes(q)) {
            setSearchHistory(prev => [q, ...prev.slice(0, 9)]); // Keep last 10 searches
        }

        const newResults: typeof results = [];
        
        try {
            let searchRegex: RegExp;
            
            if (isRegex) {
                const flags = isCaseSensitive ? 'g' : 'gi';
                searchRegex = new RegExp(q, flags);
            } else {
                const escapedQuery = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                const pattern = isWholeWord ? `\\b${escapedQuery}\\b` : escapedQuery;
                const flags = isCaseSensitive ? 'g' : 'gi';
                searchRegex = new RegExp(pattern, flags);
            }

            files.forEach(f => {
                if (!f.content) return;
                
                const lines = f.content.split('\n');
                lines.forEach((line, idx) => {
                    const matches = Array.from(line.matchAll(searchRegex));
                    matches.forEach(match => {
                        newResults.push({
                            fileId: f.id,
                            fileName: f.name,
                            line: idx + 1,
                            content: line.trim(),
                            match: match[0]
                        });
                    });
                });
            });
        } catch (error) {
            // Invalid regex, fall back to simple search
            files.forEach(f => {
                if (!f.content) return;
                
                const lines = f.content.split('\n');
                lines.forEach((line, idx) => {
                    const searchText = isCaseSensitive ? line : line.toLowerCase();
                    const queryText = isCaseSensitive ? q : q.toLowerCase();
                    
                    if (searchText.includes(queryText)) {
                        newResults.push({
                            fileId: f.id,
                            fileName: f.name,
                            line: idx + 1,
                            content: line.trim(),
                            match: q
                        });
                    }
                });
            });
        }
        
        setResults(newResults);
    };

    return (
        <div className="flex flex-col h-full bg-cosmic-800 text-gray-300">
            <div className="p-3 uppercase text-xs font-bold text-gray-500 tracking-wider flex justify-between items-center">
                <span>Search</span>
                <div className="flex gap-1">
                    <button 
                        onClick={() => setShowReplace(!showReplace)}
                        className={`p-1 rounded text-xs ${showReplace ? 'bg-cosmic-accent text-white' : 'text-gray-500 hover:text-white'}`}
                        title="Toggle Replace"
                    >
                        ↔
                    </button>
                </div>
            </div>
            <div className="px-4 pb-4 flex flex-col h-full">
                {/* Search Input */}
                <div className="relative mb-2">
                    <input 
                        type="text" 
                        value={query}
                        onChange={handleSearch}
                        placeholder="Search (use /regex/ for regex)" 
                        className="w-full bg-black/20 border border-cosmic-600 text-sm text-white p-1.5 pl-2 pr-8 rounded-sm focus:border-cosmic-accent outline-none placeholder:text-gray-600"
                        list="search-history"
                    />
                    <datalist id="search-history">
                        {searchHistory.map((item, i) => (
                            <option key={i} value={item} />
                        ))}
                    </datalist>
                </div>

                {/* Replace Input */}
                {showReplace && (
                    <div className="relative mb-2">
                        <input 
                            type="text" 
                            value={replaceQuery}
                            onChange={(e) => setReplaceQuery(e.target.value)}
                            placeholder="Replace" 
                            className="w-full bg-black/20 border border-cosmic-600 text-sm text-white p-1.5 pl-2 rounded-sm focus:border-cosmic-accent outline-none placeholder:text-gray-600"
                        />
                    </div>
                )}

                {/* Search Options */}
                <div className="flex gap-1 mb-4 text-xs">
                    <button 
                        onClick={() => setIsCaseSensitive(!isCaseSensitive)}
                        className={`px-2 py-1 rounded border ${isCaseSensitive ? 'bg-cosmic-accent text-white border-cosmic-accent' : 'border-cosmic-600 text-gray-400 hover:text-white'}`}
                        title="Case Sensitive"
                    >
                        Aa
                    </button>
                    <button 
                        onClick={() => setIsWholeWord(!isWholeWord)}
                        className={`px-2 py-1 rounded border ${isWholeWord ? 'bg-cosmic-accent text-white border-cosmic-accent' : 'border-cosmic-600 text-gray-400 hover:text-white'}`}
                        title="Whole Word"
                    >
                        Ab
                    </button>
                    <button 
                        onClick={() => setIsRegex(!isRegex)}
                        className={`px-2 py-1 rounded border ${isRegex ? 'bg-cosmic-accent text-white border-cosmic-accent' : 'border-cosmic-600 text-gray-400 hover:text-white'}`}
                        title="Regular Expression"
                    >
                        .*
                    </button>
                </div>

                {/* Results Summary */}
                {query && (
                    <div className="text-xs text-gray-500 mb-2">
                        {results.length} results in {new Set(results.map(r => r.fileId)).size} files
                    </div>
                )}
                
                {/* Results List */}
                <div className="flex-1 overflow-y-auto">
                    {query && results.length === 0 && (
                        <div className="text-center text-xs text-gray-500 mt-4">No results found.</div>
                    )}
                    
                    {results.map((res, i) => (
                        <div 
                            key={i} 
                            onClick={() => onFileSelect(res.fileId)}
                            className="group flex flex-col gap-1 p-2 hover:bg-cosmic-700 rounded cursor-pointer mb-2 border border-transparent hover:border-cosmic-600"
                        >
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                                <span>{res.fileName}</span>
                                <span className="bg-cosmic-900 px-1 rounded text-cosmic-accent">:{res.line}</span>
                            </div>
                            <div className="text-sm font-mono text-gray-300 opacity-80 group-hover:opacity-100">
                                {res.content.replace(res.match, `→${res.match}←`)}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
};

// --- EXTENSIONS PANEL ---
interface ExtensionItem {
  id: string;
  name: string;
  desc: string;
  downloads: string;
  installed: boolean;
  settingKey?: keyof Settings; // Key to toggle in settings if installed
}

const EXTENSIONS_DATA: ExtensionItem[] = [
  { id: '1', name: 'Python', desc: 'Linting, Debugging (IntelliSense)', downloads: '102M', installed: false },
  { id: '2', name: 'Prettier', desc: 'Code formatter', downloads: '45M', installed: true },
  { id: '3', name: 'Rust Analyzer', desc: 'Rust language support', downloads: '5M', installed: false },
  { id: '4', name: 'Docker', desc: 'Build and manage containers', downloads: '28M', installed: false },
  { id: '5', name: 'Vim', desc: 'Vim emulation for Cosmic IDE', downloads: '12M', installed: false, settingKey: 'vimMode' },
  { id: '6', name: 'Tailwind CSS', desc: 'Intelligent Tailwind tooling', downloads: '12M', installed: true },
];

interface ExtensionsPanelProps {
    settings: Settings;
    onUpdateSettings: (s: Settings) => void;
    onActivateExtension: (id: string) => void;
}

export const ExtensionsPanel: React.FC<ExtensionsPanelProps> = ({ settings, onUpdateSettings, onActivateExtension }) => {
    const [extensions, setExtensions] = useState(EXTENSIONS_DATA);
    const [installing, setInstalling] = useState<string | null>(null);

    const toggleInstall = (ext: ExtensionItem) => {
        if (!ext.installed) {
            setInstalling(ext.id);
            setTimeout(() => {
                setExtensions(prev => prev.map(e => e.id === ext.id ? { ...e, installed: true } : e));
                setInstalling(null);
                
                // Call parent to activate logic in ExtensionHost
                onActivateExtension(ext.id);

                // Actually apply effect if linked to a setting
                if (ext.settingKey) {
                    onUpdateSettings({ ...settings, [ext.settingKey]: true });
                }
            }, 1000);
        } else {
            setExtensions(prev => prev.map(e => e.id === ext.id ? { ...e, installed: false } : e));
            if (ext.settingKey) {
                onUpdateSettings({ ...settings, [ext.settingKey]: false });
            }
        }
    }

    // Sync state with settings (e.g. if Vim is enabled in settings, show installed)
    React.useEffect(() => {
        if (settings.vimMode) {
            setExtensions(prev => prev.map(e => e.name === 'Vim' ? {...e, installed: true} : e));
        } else {
            setExtensions(prev => prev.map(e => e.name === 'Vim' ? {...e, installed: false} : e));
        }
    }, [settings.vimMode]);

    return (
        <div className="flex flex-col h-full bg-cosmic-800 text-gray-300">
            <div className="p-3 uppercase text-xs font-bold text-gray-500 tracking-wider flex justify-between items-center">
                <span>Extensions</span>
                <RefreshCw className="w-3 h-3 cursor-pointer hover:text-white" />
            </div>
            <div className="px-2 pb-2">
                <input 
                    type="text" 
                    placeholder="Search Extensions" 
                    className="w-full bg-black/20 border border-cosmic-600 text-sm text-white p-1.5 rounded-sm focus:border-cosmic-accent outline-none placeholder:text-gray-600"
                />
            </div>
            <div className="flex-1 overflow-y-auto px-2">
                {extensions.map(ext => (
                    <div key={ext.id} className="flex gap-3 p-2 hover:bg-cosmic-700/50 rounded mb-1 group cursor-pointer">
                        <div className="w-10 h-10 bg-cosmic-600 rounded flex items-center justify-center shrink-0">
                            <Blocks className="w-6 h-6 text-cosmic-accent opacity-80" />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start">
                                <span className="font-semibold text-sm text-gray-200 truncate">{ext.name}</span>
                                {ext.installed && <span className="text-[10px] bg-cosmic-700 text-gray-400 px-1 rounded">v1.0</span>}
                            </div>
                            <p className="text-xs text-gray-500 truncate">{ext.desc}</p>
                            <div className="flex justify-between items-center mt-2">
                                <span className="text-[10px] text-gray-600 flex items-center gap-1"><Download className="w-2 h-2"/> {ext.downloads}</span>
                                <button 
                                    onClick={(e) => { e.stopPropagation(); toggleInstall(ext); }}
                                    disabled={installing === ext.id}
                                    className={`text-[10px] px-2 py-0.5 rounded border transition-colors flex items-center gap-1 ${
                                        ext.installed 
                                        ? 'bg-cosmic-700 border-cosmic-600 text-gray-300 hover:bg-red-900/30 hover:text-red-400 hover:border-red-900' 
                                        : 'bg-green-700/20 border-green-700 text-green-400 hover:bg-green-600/30'
                                    }`}
                                >
                                    {installing === ext.id ? <Loader2 className="w-3 h-3 animate-spin"/> : null}
                                    {installing === ext.id ? 'Installing...' : (ext.installed ? 'Manage' : 'Install')}
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

// --- SOURCE CONTROL PANEL ---
interface GitPanelProps {
    modifiedFiles: FileNode[];
    onCommit: () => void;
}

export const GitPanel: React.FC<GitPanelProps> = ({ modifiedFiles, onCommit }) => {
    const [msg, setMsg] = useState('');
    const [selectedFile, setSelectedFile] = useState<FileNode | null>(null);
    const [showDiff, setShowDiff] = useState(false);
    const [stagedFiles, setStagedFiles] = useState<Set<string>>(new Set());
    const [branches, setBranches] = useState(['main', 'develop', 'feature/new-ui']);
    const [currentBranch, setCurrentBranch] = useState('main');
    const [gitStatus, setGitStatus] = useState<'clean' | 'dirty' | 'ahead' | 'behind'>('dirty');

    const toggleStage = (fileId: string) => {
        setStagedFiles(prev => {
            const newSet = new Set(prev);
            if (newSet.has(fileId)) {
                newSet.delete(fileId);
            } else {
                newSet.add(fileId);
            }
            return newSet;
        });
    };

    const stageAll = () => {
        setStagedFiles(new Set(modifiedFiles.map(f => f.id)));
    };

    const unstageAll = () => {
        setStagedFiles(new Set());
    };

    const showFileDiff = (file: FileNode) => {
        setSelectedFile(file);
        setShowDiff(true);
    };

    const generateDiff = (file: FileNode) => {
        // Simple diff simulation - in real implementation, this would use git diff
        const lines = file.content.split('\n');
        return lines.map((line, i) => ({
            lineNumber: i + 1,
            type: Math.random() > 0.7 ? (Math.random() > 0.5 ? 'added' : 'removed') : 'unchanged',
            content: line
        }));
    };

    return (
        <div className="flex flex-col h-full bg-cosmic-800 text-gray-300">
            <div className="p-3 uppercase text-xs font-bold text-gray-500 tracking-wider flex justify-between items-center">
                <span>Source Control</span>
                <div className="flex gap-2">
                    <span title="Refresh"><RefreshCw className="w-3 h-3 cursor-pointer hover:text-white" /></span>
                    <span title="View History"><GitCommit className="w-3 h-3 cursor-pointer hover:text-white" /></span>
                </div>
            </div>

            {/* Branch Selector */}
            <div className="px-3 mb-3">
                <select 
                    value={currentBranch}
                    onChange={(e) => setCurrentBranch(e.target.value)}
                    className="w-full bg-black/20 border border-cosmic-600 text-sm text-white p-1.5 rounded-sm focus:border-cosmic-accent outline-none"
                >
                    {branches.map(branch => (
                        <option key={branch} value={branch}>{branch}</option>
                    ))}
                </select>
            </div>

            {/* Git Status */}
            <div className="px-3 mb-3">
                <div className={`text-xs px-2 py-1 rounded ${
                    gitStatus === 'clean' ? 'bg-green-900/30 text-green-400' :
                    gitStatus === 'ahead' ? 'bg-blue-900/30 text-blue-400' :
                    gitStatus === 'behind' ? 'bg-orange-900/30 text-orange-400' :
                    'bg-yellow-900/30 text-yellow-400'
                }`}>
                    {gitStatus === 'clean' ? '✓ Working tree clean' :
                     gitStatus === 'ahead' ? '↑ 2 commits ahead' :
                     gitStatus === 'behind' ? '↓ 1 commit behind' :
                     `${modifiedFiles.length} files changed`}
                </div>
            </div>
            
            <div className="px-3 pb-4 space-y-3 flex-1 overflow-y-auto">
                {/* Commit Message */}
                <div className="flex flex-col gap-2">
                    <textarea 
                        className="w-full h-20 bg-black/20 border border-cosmic-600 rounded-sm p-2 text-sm resize-none focus:border-cosmic-accent outline-none placeholder:text-gray-600"
                        placeholder="Commit message (Ctrl+Enter to commit)"
                        value={msg}
                        onChange={(e) => setMsg(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.ctrlKey && e.key === 'Enter') {
                                onCommit();
                            }
                        }}
                    />
                    <div className="flex gap-2">
                        <button 
                            onClick={onCommit}
                            disabled={stagedFiles.size === 0 || !msg.trim()}
                            className="flex-1 bg-green-600 hover:bg-green-500 text-white text-sm py-1.5 rounded-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Check className="w-3.5 h-3.5" /> Commit ({stagedFiles.size})
                        </button>
                    </div>
                </div>

                {/* Staged Changes */}
                {stagedFiles.size > 0 && (
                    <div>
                        <div className="text-xs uppercase text-gray-500 font-bold mb-2 flex justify-between items-center">
                            <span>Staged Changes</span>
                            <div className="flex gap-1">
                                <span className="bg-green-700 px-1.5 rounded-full text-white">{stagedFiles.size}</span>
                                <button 
                                    onClick={unstageAll}
                                    className="text-xs text-gray-400 hover:text-white"
                                    title="Unstage All"
                                >
                                    −
                                </button>
                            </div>
                        </div>
                        <div className="space-y-1 mb-4">
                            {modifiedFiles.filter(f => stagedFiles.has(f.id)).map(f => (
                                <div key={f.id} className="flex items-center gap-2 text-sm hover:bg-cosmic-700 p-1 rounded cursor-pointer">
                                    <button 
                                        onClick={() => toggleStage(f.id)}
                                        className="w-4 h-4 bg-green-600 text-white rounded-sm flex items-center justify-center text-xs"
                                        title="Unstage"
                                    >
                                        ✓
                                    </button>
                                    <span className="font-mono text-green-400">A</span>
                                    <span className="text-gray-300 flex-1">{f.name}</span>
                                    <button 
                                        onClick={() => showFileDiff(f)}
                                        className="text-xs text-gray-400 hover:text-white"
                                        title="View Diff"
                                    >
                                        diff
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Changes */}
                <div>
                    <div className="text-xs uppercase text-gray-500 font-bold mb-2 flex justify-between items-center">
                        <span>Changes</span>
                        <div className="flex gap-1">
                            <span className="bg-cosmic-700 px-1.5 rounded-full text-white">{modifiedFiles.length - stagedFiles.size}</span>
                            <button 
                                onClick={stageAll}
                                className="text-xs text-gray-400 hover:text-white"
                                title="Stage All"
                            >
                                +
                            </button>
                        </div>
                    </div>
                    {modifiedFiles.length === 0 ? (
                        <div className="text-xs text-gray-500 italic py-4 text-center">No changes detected.</div>
                    ) : (
                        <div className="space-y-1">
                            {modifiedFiles.filter(f => !stagedFiles.has(f.id)).map(f => (
                                <div key={f.id} className="flex items-center gap-2 text-sm hover:bg-cosmic-700 p-1 rounded cursor-pointer">
                                    <button 
                                        onClick={() => toggleStage(f.id)}
                                        className="w-4 h-4 border border-cosmic-600 rounded-sm flex items-center justify-center text-xs hover:bg-cosmic-600"
                                        title="Stage"
                                    >
                                        +
                                    </button>
                                    <span className="font-mono text-yellow-400">M</span>
                                    <span className="text-gray-300 flex-1">{f.name}</span>
                                    <button 
                                        onClick={() => showFileDiff(f)}
                                        className="text-xs text-gray-400 hover:text-white"
                                        title="View Diff"
                                    >
                                        diff
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Diff Modal */}
            {showDiff && selectedFile && (
                <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-50">
                    <div className="bg-cosmic-900 border border-cosmic-600 rounded-lg w-4/5 h-4/5 flex flex-col">
                        <div className="p-4 border-b border-cosmic-600 flex justify-between items-center">
                            <h3 className="font-semibold">Diff: {selectedFile.name}</h3>
                            <button 
                                onClick={() => setShowDiff(false)}
                                className="text-gray-400 hover:text-white"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 font-mono text-sm">
                            {generateDiff(selectedFile).map((line, i) => (
                                <div key={i} className={`flex gap-4 ${
                                    line.type === 'added' ? 'bg-green-900/20 text-green-300' :
                                    line.type === 'removed' ? 'bg-red-900/20 text-red-300' :
                                    'text-gray-300'
                                }`}>
                                    <span className="text-gray-500 w-8 text-right">{line.lineNumber}</span>
                                    <span className="w-4">
                                        {line.type === 'added' ? '+' : line.type === 'removed' ? '-' : ' '}
                                    </span>
                                    <span>{line.content}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// --- BUGBOT PANEL ---
interface BugBotPanelProps {
    activeFile: FileNode | undefined;
    settings?: Settings;
}

export const BugBotPanel: React.FC<BugBotPanelProps> = ({ activeFile, settings }) => {
    const [scanning, setScanning] = useState(false);
    const [report, setReport] = useState<string | null>(null);
    
    const runScan = async () => {
        if (!activeFile) return;
        setScanning(true);
        setReport(null);
        
        const result = await reviewCode(
            activeFile.content, 
            activeFile.name, 
            settings?.defaultModel || 'gemini-1.5-flash',
            settings?.aiProviders || {},
            settings?.customProviders || []
        );
        
        setReport(result);
        setScanning(false);
    }

    return (
        <div className="flex flex-col h-full bg-cosmic-800 text-gray-300">
             <div className="p-3 uppercase text-xs font-bold text-gray-500 tracking-wider">BugBot Scanner</div>
             
             <div className="flex-1 p-4 flex flex-col items-center overflow-y-auto">
                 <div className="w-full bg-cosmic-900 rounded-lg p-6 border border-cosmic-700 flex flex-col items-center gap-4 shrink-0">
                     <div className={`w-16 h-16 rounded-full bg-cosmic-700 flex items-center justify-center ${scanning ? 'animate-pulse' : ''}`}>
                         <Bug className={`w-8 h-8 ${scanning ? 'text-yellow-400' : 'text-gray-400'}`} />
                     </div>
                     <div className="text-center">
                         <h3 className="font-semibold text-white">Automated Code Review</h3>
                         <p className="text-xs text-gray-500 mt-1">
                            {activeFile ? `Scan ${activeFile.name}` : 'Open a file to scan'}
                         </p>
                     </div>
                     <button 
                        onClick={runScan}
                        disabled={scanning || !activeFile}
                        className="bg-cosmic-accent hover:bg-indigo-500 text-white px-6 py-2 rounded text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                     >
                         {scanning ? <RefreshCw className="w-4 h-4 animate-spin"/> : <Play className="w-4 h-4"/>}
                         {scanning ? 'Analyzing...' : 'Start Scan'}
                     </button>
                 </div>

                 {report && (
                     <div className="w-full mt-6">
                        <h4 className="text-xs font-bold text-gray-500 uppercase mb-2">Scan Results</h4>
                        <div className="bg-cosmic-900 border border-cosmic-700 rounded p-4 text-sm leading-relaxed space-y-3">
                            {report.split('\n').map((line, i) => {
                                // Section headers with emojis
                                if (line.includes('🔍 OVERVIEW') || line.includes('🐛 BUGS') || 
                                    line.includes('⚠️ SECURITY') || line.includes('⚡ PERFORMANCE') ||
                                    line.includes('💡 SUGGESTIONS') || line.includes('📊 SCORE')) {
                                    return <div key={i} className="font-bold text-cosmic-accent mt-4 first:mt-0 border-b border-cosmic-700 pb-1">{line}</div>;
                                }
                                // Bullet points
                                if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
                                    return <div key={i} className="pl-4 text-gray-300">{line}</div>;
                                }
                                // Empty lines
                                if (!line.trim()) {
                                    return <div key={i} className="h-2"></div>;
                                }
                                // Regular text
                                return <div key={i} className="text-gray-400">{line}</div>;
                            })}
                        </div>
                     </div>
                 )}
             </div>
        </div>
    );
}
