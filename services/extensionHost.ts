
import { Diagnostic, FileNode } from '../types';

// Simple Event Emitter implementation
type Listener<T> = (data: T) => void;
class EventEmitter<T> {
    private listeners: Listener<T>[] = [];
    on(listener: Listener<T>) { this.listeners.push(listener); }
    emit(data: T) { this.listeners.forEach(l => l(data)); }
}

// --- The Mock "vscode" API Namespace ---
// This allows us to write "extensions" that look like they use the real API
export class ExtensionAPI {
    // State
    private _diagnostics: Diagnostic[] = [];
    private _outputChannels: Map<string, string[]> = new Map();
    
    // Events
    public onDidChangeDiagnostics = new EventEmitter<Diagnostic[]>();
    public onDidChangeOutput = new EventEmitter<Map<string, string[]>>();

    constructor() {
        this._outputChannels.set('Extension Host', ['Extension Host started...', 'Loading extensions...']);
    }

    // --- vscode.window ---
    public window = {
        createOutputChannel: (name: string) => {
            if (!this._outputChannels.has(name)) {
                this._outputChannels.set(name, []);
                this.notifyOutput();
            }
            return {
                appendLine: (value: string) => {
                    const current = this._outputChannels.get(name) || [];
                    current.push(value);
                    this._outputChannels.set(name, current);
                    this.notifyOutput();
                },
                clear: () => {
                    this._outputChannels.set(name, []);
                    this.notifyOutput();
                },
                show: () => { /* Logic to switch tab could go here */ }
            };
        },
        showInformationMessage: (message: string) => {
            console.log(`[Info] ${message}`);
            // Log to 'Extension Host' channel
            this.logToHost(`[Info] ${message}`);
        },
        showErrorMessage: (message: string) => {
            console.error(`[Error] ${message}`);
            this.logToHost(`[Error] ${message}`);
        }
    };

    // --- vscode.languages ---
    public languages = {
        createDiagnosticCollection: (name: string) => {
            return {
                set: (uri: string, diagnostics: Diagnostic[]) => {
                    // Remove existing diagnostics for this specific source/file combo
                    this._diagnostics = this._diagnostics.filter(d => !(d.source === name && d.fileName === uri));
                    // Add new ones
                    this._diagnostics.push(...diagnostics);
                    this.onDidChangeDiagnostics.emit(this._diagnostics);
                },
                clear: () => {
                    this._diagnostics = this._diagnostics.filter(d => d.source !== name);
                    this.onDidChangeDiagnostics.emit(this._diagnostics);
                }
            };
        }
    };

    // --- vscode.commands ---
    private commandsMap = new Map<string, (...args: any[]) => any>();
    public commands = {
        registerCommand: (command: string, callback: (...args: any[]) => any) => {
            this.commandsMap.set(command, callback);
            this.logToHost(`Command registered: ${command}`);
        },
        executeCommand: (command: string, ...args: any[]) => {
            const cb = this.commandsMap.get(command);
            if (cb) return cb(...args);
            this.logToHost(`Command not found: ${command}`);
        }
    };

    // Internal Helpers
    private notifyOutput() {
        this.onDidChangeOutput.emit(new Map(this._outputChannels));
    }
    
    private logToHost(msg: string) {
        const current = this._outputChannels.get('Extension Host') || [];
        current.push(msg);
        this._outputChannels.set('Extension Host', current);
        this.notifyOutput();
    }
}

export const extensionHost = new ExtensionAPI();
