import React, { useRef, useEffect, useState } from 'react';
import { FileNode, FileType } from '../types';
import { codeIntelligence, CompletionItem } from '../services/codeIntelligence';
import { formatterService } from '../services/formatterService';

interface FallbackEditorProps {
  file: FileNode | undefined;
  onContentChange: (id: string, content: string) => void;
  fontSize: number;
  vimMode?: boolean;
  allFiles?: FileNode[];
}

export const FallbackEditor: React.FC<FallbackEditorProps> = ({
  file,
  onContentChange,
  fontSize,
  vimMode,
  allFiles = []
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [currentLine, setCurrentLine] = useState(1);
  const [currentColumn, setCurrentColumn] = useState(1);
  const [completions, setCompletions] = useState<CompletionItem[]>([]);
  const [showCompletions, setShowCompletions] = useState(false);
  const [selectedCompletion, setSelectedCompletion] = useState(0);
  const [completionPosition, setCompletionPosition] = useState({ top: 0, left: 0 });
  const [diagnostics, setDiagnostics] = useState<any[]>([]);
  const [showHover, setShowHover] = useState(false);
  const [hoverInfo, setHoverInfo] = useState<string>('');
  const [hoverPosition, setHoverPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (textareaRef.current && file) {
      textareaRef.current.value = file.content;
    }
  }, [file?.id]);

  const handleChange = async (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!file) return;
    const newContent = e.target.value;
    onContentChange(file.id, newContent);
    
    // Update cursor position
    const textarea = e.target;
    const lines = newContent.substring(0, textarea.selectionStart).split('\n');
    const line = lines.length;
    const column = lines[lines.length - 1].length + 1;
    setCurrentLine(line);
    setCurrentColumn(column);

    // Trigger IntelliSense
    await triggerIntelliSense(textarea, newContent, line - 1, column - 1);
    
    // Update diagnostics
    if (file.type) {
      const newDiagnostics = await codeIntelligence.getDiagnostics(newContent, file.name, file.type);
      setDiagnostics(newDiagnostics);
    }
  };

  const triggerIntelliSense = async (textarea: HTMLTextAreaElement, content: string, line: number, column: number) => {
    if (!file) return;

    // Get current word
    const lines = content.split('\n');
    const currentLineText = lines[line] || '';
    const beforeCursor = currentLineText.substring(0, column);
    const wordMatch = beforeCursor.match(/(\w+)$/);
    
    // Only show completions if we're typing a word
    if (wordMatch && wordMatch[1].length > 0) {
      try {
        const completionItems = await codeIntelligence.getCompletions(
          content,
          { line, column },
          file.type || 'text',
          allFiles
        );

        if (completionItems.length > 0) {
          setCompletions(completionItems);
          setSelectedCompletion(0);
          setShowCompletions(true);

          // Calculate position for completion popup
          const rect = textarea.getBoundingClientRect();
          const lineHeight = fontSize * 1.5;
          setCompletionPosition({
            top: rect.top + (line * lineHeight) + lineHeight,
            left: rect.left + (column * fontSize * 0.6)
          });
        } else {
          setShowCompletions(false);
        }
      } catch (error) {
        console.error('IntelliSense error:', error);
        setShowCompletions(false);
      }
    } else {
      setShowCompletions(false);
    }
  };

  const applyCompletion = (completion: CompletionItem) => {
    if (!file || !textareaRef.current) return;

    const textarea = textareaRef.current;
    const content = textarea.value;
    const cursorPos = textarea.selectionStart;
    
    // Find the word being completed
    const lines = content.substring(0, cursorPos).split('\n');
    const currentLineText = lines[lines.length - 1];
    const wordMatch = currentLineText.match(/(\w+)$/);
    
    if (wordMatch) {
      const wordStart = cursorPos - wordMatch[1].length;
      let insertText = completion.insertText || completion.label;
      
      // Handle snippet placeholders
      if (completion.kind === 'snippet') {
        // Replace $1, $2, etc. with empty strings for now
        // In a full implementation, these would be tab stops
        insertText = insertText.replace(/\$\{?\d+:?([^}]*)\}?/g, '$1').replace(/\$\d+/g, '');
      }
      
      // Replace the partial word with the completion
      const newContent = content.substring(0, wordStart) + insertText + content.substring(cursorPos);
      textarea.value = newContent;
      onContentChange(file.id, newContent);
      
      // Position cursor at the end of insertion or at first placeholder
      let newCursorPos = wordStart + insertText.length;
      
      // If it's a snippet with placeholders, try to position at first meaningful location
      if (completion.kind === 'snippet') {
        const firstPlaceholder = insertText.indexOf('()');
        if (firstPlaceholder !== -1) {
          newCursorPos = wordStart + firstPlaceholder + 1;
        }
      }
      
      textarea.selectionStart = textarea.selectionEnd = newCursorPos;
      textarea.focus();
    }
    
    setShowCompletions(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Handle completion navigation
    if (showCompletions) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedCompletion(prev => Math.min(prev + 1, completions.length - 1));
        return;
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedCompletion(prev => Math.max(prev - 1, 0));
        return;
      }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        applyCompletion(completions[selectedCompletion]);
        return;
      }
      if (e.key === 'Escape') {
        setShowCompletions(false);
        return;
      }
    }

    // Ctrl+Space for manual completion trigger
    if (e.ctrlKey && e.key === ' ') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
      triggerIntelliSense(textarea, textarea.value, lines.length - 1, lines[lines.length - 1].length);
      return;
    }

    // Ctrl+Shift+F for format document
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      if (file) {
        const formattedCode = formatterService.formatCode(file.content, file.type);
        if (formattedCode !== file.content) {
          onContentChange(file.id, formattedCode);
          // Update textarea value
          const textarea = e.currentTarget;
          textarea.value = formattedCode;
        }
      }
      return;
    }

    // Tab handling
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const value = textarea.value;
      
      if (e.shiftKey) {
        // Unindent
        const lineStart = value.lastIndexOf('\n', start - 1) + 1;
        const lineEnd = value.indexOf('\n', end);
        const selectedLines = value.substring(lineStart, lineEnd === -1 ? value.length : lineEnd);
        
        if (selectedLines.startsWith('  ')) {
          const newValue = value.substring(0, lineStart) + 
                          selectedLines.replace(/^  /gm, '') + 
                          value.substring(lineEnd === -1 ? value.length : lineEnd);
          textarea.value = newValue;
          onContentChange(file!.id, newValue);
        }
      } else {
        // Indent
        textarea.value = value.substring(0, start) + '  ' + value.substring(end);
        textarea.selectionStart = textarea.selectionEnd = start + 2;
        onContentChange(file!.id, textarea.value);
      }
    }
    
    // Auto-close brackets
    if (['(', '[', '{', '"', "'"].includes(e.key)) {
      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      
      const closingChar = {
        '(': ')',
        '[': ']',
        '{': '}',
        '"': '"',
        "'": "'"
      }[e.key];
      
      if (closingChar && start === end) {
        e.preventDefault();
        const value = textarea.value;
        const newValue = value.substring(0, start) + e.key + closingChar + value.substring(end);
        textarea.value = newValue;
        textarea.selectionStart = textarea.selectionEnd = start + 1;
        onContentChange(file!.id, newValue);
      }
    }
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-cosmic-900">
        <div className="text-center">
          <h3 className="text-xl mb-2">Cosmic IDE</h3>
          <p className="text-sm">Select a file to start coding</p>
          <p className="text-xs mt-4 text-cosmic-accent">Ctrl+K to open palette</p>
        </div>
      </div>
    );
  }

  const lineCount = file.content.split('\n').length;

  return (
    <div className="h-full flex flex-col bg-cosmic-900">
      {/* Tab Header */}
      <div className="flex bg-cosmic-800 border-b border-cosmic-700 overflow-x-auto">
        <div className="px-4 py-2 bg-cosmic-900 border-t-2 border-cosmic-accent text-white flex items-center gap-2 text-sm min-w-[150px]">
          <span>{file.name}</span>
          {file.isModified && <span className="w-2 h-2 rounded-full bg-white/50"></span>}
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Line Numbers */}
        <div 
          className="w-12 bg-cosmic-900 border-r border-cosmic-700 text-gray-600 text-right pr-2 pt-4 select-none font-mono"
          style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}
        >
          {Array.from({ length: Math.max(lineCount, 20) }).map((_, i) => (
            <div key={i} className="h-6 leading-6">{i + 1}</div>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative">
          <textarea
            ref={textareaRef}
            className="absolute inset-0 w-full h-full bg-transparent text-gray-200 p-4 outline-none resize-none font-mono"
            value={file.content}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onClick={(e) => {
              const textarea = e.currentTarget;
              const lines = textarea.value.substring(0, textarea.selectionStart).split('\n');
              setCurrentLine(lines.length);
              setCurrentColumn(lines[lines.length - 1].length + 1);
              setShowCompletions(false);
            }}
            onBlur={() => {
              // Delay hiding completions to allow clicking on them
              setTimeout(() => setShowCompletions(false), 150);
            }}
            spellCheck={false}
            style={{ 
              fontSize: `${fontSize}px`,
              lineHeight: '1.5',
              tabSize: 2
            }}
          />

          {/* Error Squiggles Overlay */}
          {diagnostics.length > 0 && (
            <div className="absolute inset-0 pointer-events-none p-4 font-mono" style={{ fontSize: `${fontSize}px`, lineHeight: '1.5' }}>
              {diagnostics.map((diagnostic, i) => (
                <div
                  key={i}
                  className={`absolute h-0.5 ${diagnostic.severity === 'error' ? 'bg-red-500' : 'bg-yellow-500'}`}
                  style={{
                    top: `${(diagnostic.line - 1) * fontSize * 1.5 + fontSize * 1.3}px`,
                    left: `${diagnostic.column * fontSize * 0.6}px`,
                    width: '100px',
                    borderBottom: `2px wavy ${diagnostic.severity === 'error' ? '#ef4444' : '#eab308'}`
                  }}
                  title={diagnostic.message}
                />
              ))}
            </div>
          )}
        </div>

        {/* IntelliSense Completion Popup */}
        {showCompletions && (
          <div
            className="fixed bg-cosmic-800 border border-cosmic-600 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto"
            style={{
              top: `${completionPosition.top}px`,
              left: `${completionPosition.left}px`,
              minWidth: '250px'
            }}
          >
            {completions.map((completion, index) => (
              <div
                key={index}
                className={`px-3 py-2 cursor-pointer flex items-center gap-3 ${
                  index === selectedCompletion ? 'bg-cosmic-accent text-white' : 'text-gray-300 hover:bg-cosmic-700'
                }`}
                onClick={() => applyCompletion(completion)}
              >
                <div className={`w-4 h-4 rounded text-xs flex items-center justify-center font-bold ${
                  completion.kind === 'function' ? 'bg-blue-600 text-white' :
                  completion.kind === 'variable' ? 'bg-green-600 text-white' :
                  completion.kind === 'class' ? 'bg-purple-600 text-white' :
                  completion.kind === 'method' ? 'bg-blue-500 text-white' :
                  completion.kind === 'property' ? 'bg-orange-600 text-white' :
                  completion.kind === 'keyword' ? 'bg-pink-600 text-white' :
                  'bg-gray-600 text-white'
                }`}>
                  {completion.kind === 'function' ? 'f' :
                   completion.kind === 'variable' ? 'v' :
                   completion.kind === 'class' ? 'C' :
                   completion.kind === 'method' ? 'm' :
                   completion.kind === 'property' ? 'p' :
                   completion.kind === 'keyword' ? 'k' :
                   completion.kind === 'snippet' ? 's' : '?'}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{completion.label}</div>
                  {completion.detail && (
                    <div className="text-xs text-gray-500">{completion.detail}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Hover Information */}
        {showHover && (
          <div
            className="fixed bg-cosmic-800 border border-cosmic-600 rounded-lg shadow-lg z-50 p-3 max-w-md"
            style={{
              top: `${hoverPosition.top}px`,
              left: `${hoverPosition.left}px`
            }}
          >
            <div className="text-sm text-gray-300 whitespace-pre-wrap">{hoverInfo}</div>
          </div>
        )}
      </div>

      {/* Status Bar */}
      <div className="h-6 bg-cosmic-800 border-t border-cosmic-700 flex items-center justify-between px-3 text-xs text-gray-500">
        <span>Ln {currentLine}, Col {currentColumn}</span>
        <span>{file.type} • {file.content.length} chars</span>
      </div>
    </div>
  );
};

export default FallbackEditor;