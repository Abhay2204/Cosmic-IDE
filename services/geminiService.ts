import { GoogleGenAI } from "@google/genai";
import { Message, FileNode } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to construct context from files
const getContextFromFiles = (files: FileNode[]): string => {
  return files.map(f => `File: ${f.name} (${f.path})\nContent:\n${f.content}\n---`).join('\n');
};

export const generateChatResponse = async (
  history: Message[], 
  currentInput: string, 
  contextFiles: FileNode[],
  modelId: string
): Promise<string> => {
  try {
    const fileContext = getContextFromFiles(contextFiles);
    
    // Map UI model selection to actual API model
    // Using 'gemini-2.5-flash' as the workhorse for most things to be fast and efficient
    // Using 'gemini-3-pro-preview' for the heavy lifters if requested (simulated)
    let apiModel = 'gemini-2.5-flash';
    if (modelId.includes('pro') || modelId.includes('opus') || modelId.includes('gpt-5')) {
        // We use the most powerful available Gemini model to simulate these "frontier" models
        apiModel = 'gemini-3-pro-preview';
    }

    const systemPrompt = `You are the AI engine for Cosmic IDE, a futuristic coding environment.
    You represent the model: ${modelId}.
    You have access to the user's codebase.
    When answering, be concise, technical, and practical.
    If providing code, use markdown code blocks.
    Current Open Files Context:
    ${fileContext}
    
    If the user uses @Files, reference the specific file content provided above.
    If the user uses @Web, pretend to have searched the web for the latest info.
    `;

    const response = await ai.models.generateContent({
      model: apiModel,
      contents: [
        ...history.filter(h => h.role !== 'system').map(h => ({
            role: h.role,
            parts: [{ text: h.content }]
        })),
        { role: 'user', parts: [{ text: currentInput }] }
      ],
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return response.text || "I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Error connecting to Cosmic Intelligence. Please check your network or API key.";
  }
};

export const generateAutocomplete = async (
  fileContent: string,
  cursorOffset: number,
  language: string
): Promise<string> => {
  try {
    const prefix = fileContent.slice(0, cursorOffset);
    const suffix = fileContent.slice(cursorOffset);

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are a super-fast code completion engine (Tab Autocomplete). 
      Complete the code at the cursor position. 
      Only return the completion text, nothing else. No markdown.
      
      Language: ${language}
      Code Prefix:
      ${prefix}
      
      Code Suffix:
      ${suffix}`,
    });

    return response.text?.trimEnd() || "";
  } catch (error) {
    return "";
  }
};

export const generateCommitMessage = async (diff: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Generate a conventional commit message (max 1 line, lowercase) for the following changes:\n${diff}`
        });
        return response.text?.trim() || "update: codebase changes";
    } catch (e) {
        return "chore: update files";
    }
}

export const reviewCode = async (code: string, fileName: string): Promise<string> => {
    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `You are BugBot, an automated code review agent. 
            Analyze the following code for bugs, security issues, and performance improvements.
            File: ${fileName}
            
            Code:
            ${code}
            
            Format the response as a concise markdown list of issues. If the code looks good, say so.`
        });
        return response.text || "No issues found.";
    } catch (e) {
        return "Unable to scan code at this time.";
    }
}