import React, { useRef, useEffect, useState } from 'react';
import { FileNode } from '../types';
import { generateAutocomplete } from '../services/geminiService';

interface EditorProps {
  file: FileNode | undefined;
  onContentChange: (id: string, content: string) => void;
  fontSize: number;
}

export const Editor: React.FC<EditorProps> = ({ file, onContentChange, fontSize }) => {
  const [ghostText, setGhostText] = useState('');
  const [cursorPos, setCursorPos] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setGhostText('');
    if (textareaRef.current) {
        textareaRef.current.value = file?.content || '';
    }
  }, [file?.id]);

  // Handle Tab to accept ghost text
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Tab' && ghostText) {
      e.preventDefault();
      if (!file) return;
      
      const newContent = file.content.slice(0, cursorPos) + ghostText + file.content.slice(cursorPos);
      onContentChange(file.id, newContent);
      
      // Move cursor
      setTimeout(() => {
        if (textareaRef.current) {
            textareaRef.current.selectionStart = cursorPos + ghostText.length;
            textareaRef.current.selectionEnd = cursorPos + ghostText.length;
        }
      }, 0);
      setGhostText('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    if (!file) return;
    const newContent = e.target.value;
    const newCursorPos = e.target.selectionStart;
    
    onContentChange(file.id, newContent);
    setCursorPos(newCursorPos);
    setGhostText('');

    // Debounce AI Autocomplete
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    
    // Only trigger if we are at the end of a line or typing significantly
    timeoutRef.current = setTimeout(async () => {
        if (newContent.length > 10) {
            const suggestion = await generateAutocomplete(newContent, newCursorPos, file.type);
            if (suggestion) {
                setGhostText(suggestion);
            }
        }
    }, 800);
  };

  if (!file) {
    return (
      <div className="h-full flex items-center justify-center text-gray-500 bg-cosmic-900">
        <div className="text-center">
            <h3 className="text-xl mb-2">Cosmic IDE</h3>
            <p className="text-sm">Select a file to start coding</p>
            <p className="text-xs mt-4 text-cosmic-accent">CMD+K to open palette</p>
        </div>
      </div>
    );
  }

  const lineCount = file.content.split('\n').length;

  return (
    <div className="h-full flex flex-col relative bg-cosmic-900 text-gray-300 font-mono" style={{ fontSize: `${fontSize}px` }}>
      {/* Tab Header */}
      <div className="flex bg-cosmic-800 border-b border-cosmic-700 overflow-x-auto">
        <div className="px-4 py-2 bg-cosmic-900 border-t-2 border-cosmic-accent text-white flex items-center gap-2 text-sm min-w-[150px]">
            <span>{file.name}</span>
            {file.isModified && <span className="w-2 h-2 rounded-full bg-white/50"></span>}
        </div>
      </div>

      <div className="flex-1 relative flex overflow-hidden">
        {/* Line Numbers */}
        <div className="w-12 bg-cosmic-900 border-r border-cosmic-700 text-gray-600 text-right pr-2 pt-4 select-none" style={{ fontFamily: 'inherit', lineHeight: '1.5rem' }}>
          {Array.from({ length: Math.max(lineCount, 20) }).map((_, i) => (
            <div key={i} className="h-6 leading-6">{i + 1}</div>
          ))}
        </div>

        {/* Editor Area */}
        <div className="flex-1 relative h-full">
            {/* Visual Layer (Syntax Highlighting placeholder) */}
            <pre 
                className="absolute inset-0 p-4 m-0 pointer-events-none whitespace-pre-wrap break-all leading-6 text-transparent"
                aria-hidden="true"
            >
                {file.content.slice(0, cursorPos)}
                <span className="text-gray-500 italic opacity-60">{ghostText}</span>
                {file.content.slice(cursorPos)}
            </pre>

            {/* Input Layer */}
            <textarea
                ref={textareaRef}
                className="absolute inset-0 w-full h-full bg-transparent text-gray-200 p-4 outline-none resize-none whitespace-pre-wrap break-all leading-6"
                value={file.content}
                onChange={handleChange}
                onKeyDown={handleKeyDown}
                onClick={(e) => setCursorPos(e.currentTarget.selectionStart)}
                spellCheck={false}
            />
            
            {/* Ghost Text Overlay (Visual only, positioned absolutely) */}
             {ghostText && (
                <div 
                    className="absolute pointer-events-none bg-cosmic-700/20 p-2 rounded border border-cosmic-accent/30 text-xs text-cosmic-accent animate-pulse"
                    style={{ bottom: '20px', right: '20px', zIndex: 10 }}
                >
                    Press Tab to complete
                </div>
            )}
        </div>
      </div>
    </div>
  );
};