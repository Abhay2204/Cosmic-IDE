
import { extensionHost } from './extensionHost';
import { FileNode, FileType } from '../types';

// --- PYTHON EXTENSION ---
// Simulates a linter that checks for Python 2 style print statements
export const activatePythonExtension = () => {
    const output = extensionHost.window.createOutputChannel('Python');
    const diagnostics = extensionHost.languages.createDiagnosticCollection('python-linter');

    output.appendLine('Python Extension Activated');
    output.appendLine('Linter ready. Watching for .py files...');

    // Return a listener that App.tsx will call on file change
    return (file: FileNode) => {
        if (file.type !== FileType.Python && !file.name.endsWith('.py')) return;

        const errors: any[] = [];
        const lines = file.content.split('\n');

        lines.forEach((line, index) => {
            // Check: print "hello" vs print("hello")
            if (line.trim().startsWith('print ') && !line.includes('(')) {
                errors.push({
                    id: `py-${index}`,
                    fileId: file.id,
                    fileName: file.name,
                    line: index + 1,
                    message: 'Missing parentheses in call to "print". Did you mean print(...)?',
                    severity: 'error',
                    source: 'python-linter'
                });
            }
            // Check for missing colon
            if ((line.trim().startsWith('def ') || line.trim().startsWith('if ') || line.trim().startsWith('for ')) && !line.trim().endsWith(':')) {
                 errors.push({
                    id: `py-syn-${index}`,
                    fileId: file.id,
                    fileName: file.name,
                    line: index + 1,
                    message: 'Expected ":"',
                    severity: 'error',
                    source: 'python-linter'
                });
            }
        });

        diagnostics.set(file.name, errors);
    };
};

// --- PRETTIER EXTENSION ---
export const activatePrettierExtension = () => {
    const output = extensionHost.window.createOutputChannel('Prettier');
    output.appendLine('Prettier activated.');

    extensionHost.commands.registerCommand('prettier.format', (file: FileNode) => {
        output.appendLine(`Formatting ${file.name}...`);
        return file.content; // In a real app, this would return formatted text
    });
};

// --- ESLINT EXTENSION ---
export const activateESLintExtension = () => {
    const diagnostics = extensionHost.languages.createDiagnosticCollection('eslint');
    
    return (file: FileNode) => {
        if (file.type !== FileType.TypeScript && file.type !== FileType.JSON) return;
        
        const errors: any[] = [];
        const lines = file.content.split('\n');
        
        lines.forEach((line, index) => {
            if (line.includes('console.log')) {
                 errors.push({
                    id: `eslint-${index}`,
                    fileId: file.id,
                    fileName: file.name,
                    line: index + 1,
                    message: 'Unexpected console statement.',
                    severity: 'warning',
                    source: 'eslint'
                });
            }
             if (line.includes('any')) {
                 errors.push({
                    id: `eslint-any-${index}`,
                    fileId: file.id,
                    fileName: file.name,
                    line: index + 1,
                    message: 'Unexpected usage of "any" type.',
                    severity: 'warning',
                    source: 'eslint'
                });
            }
        });
        diagnostics.set(file.name, errors);
    };
};
