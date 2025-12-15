// AI Agent Service - Advanced AI capabilities for Cosmic IDE
import { FileNode, Message } from '../types';
import { generateChatResponse } from './aiService';

// AI Agent Actions
export interface AIAction {
  type: 'create_file' | 'modify_file' | 'fix_error' | 'analyze_project';
  filename?: string;
  content?: string;
  language?: string;
  description: string;
}

// Parse AI response for actionable instructions
export const parseAIActions = (aiResponse: string, userRequest: string): AIAction[] => {
  const actions: AIAction[] = [];
  
  // Extract code blocks with better regex that handles multiline
  const codeBlocks = aiResponse.match(/```(\w+)?\s*\n([\s\S]*?)\n```/g) || [];
  
  console.log('Found code blocks:', codeBlocks.length);
  
  codeBlocks.forEach((block, index) => {
    const match = block.match(/```(\w+)?\s*\n([\s\S]*?)\n```/);
    if (match) {
      const language = match[1] || 'txt';
      const code = match[2].trim();
      
      // Look for filename in the code content (like // src/App.tsx)
      let filename = '';
      const fileCommentMatch = code.match(/^\/\/\s*([^\n]+\.(tsx?|jsx?|html|css|js|ts|py|java|rs|go|cpp|c|rb|php|swift|kt))/m);
      if (fileCommentMatch) {
        filename = fileCommentMatch[1].replace('src/', '');
      } else {
        // Fallback to smart filename detection
        filename = determineFilename(language, userRequest, index, aiResponse);
      }
      
      console.log(`Parsed file: ${filename} (${language}), content length: ${code.length}`);
      
      actions.push({
        type: 'create_file',
        filename,
        content: code,
        language,
        description: `Create ${filename} with ${language} code`
      });
    }
  });
  
  return actions;
};

// Smart filename detection
const determineFilename = (language: string, userRequest: string, index: number, aiResponse: string): string => {
  const request = userRequest.toLowerCase();
  
  // Extract filename from AI response if mentioned
  const filenameMatch = aiResponse.match(/(?:file|save|create).*?["`']([^"`']+\.[a-zA-Z0-9]+)["`']/i);
  if (filenameMatch) {
    return filenameMatch[1];
  }
  
  // Smart filename based on request and language
  if (request.includes('snake game')) {
    return language === 'python' ? 'snake_game.py' : 
           language === 'javascript' ? 'snake_game.js' : 
           language === 'html' ? 'snake_game.html' : `snake_game.${language}`;
  }
  
  if (request.includes('hotel') || request.includes('gulmohar')) {
    if (language === 'html') return 'gulmohar-hotel.html';
    if (language === 'css') return 'gulmohar-styles.css';
    if (language === 'javascript') return 'gulmohar-script.js';
    if (language === 'tsx') return `${index === 0 ? 'App' : 'Component' + index}.tsx`;
    if (language === 'typescript') return `${index === 0 ? 'App' : 'Component' + index}.tsx`;
  }
  
  if (request.includes('todo') || request.includes('task')) {
    if (language === 'html') return 'todo.html';
    if (language === 'css') return 'todo.css';
    if (language === 'javascript') return 'todo.js';
    if (language === 'python') return 'todo.py';
  }
  
  // Default naming
  const extensions: Record<string, string> = {
    python: 'py', javascript: 'js', typescript: 'ts', html: 'html',
    css: 'css', java: 'java', cpp: 'cpp', rust: 'rs', go: 'go',
    php: 'php', ruby: 'rb', swift: 'swift', kotlin: 'kt'
  };
  
  const ext = extensions[language] || language;
  return `ai_generated_${Date.now()}_${index}.${ext}`;
};

// Analyze project for errors and improvements
export const analyzeProject = async (
  files: FileNode[],
  modelId: string,
  apiKeys: Record<string, string>,
  customProviders: any[] = []
): Promise<string> => {
  const projectContext = files.map(f => 
    `File: ${f.name}\nPath: ${f.path}\nContent:\n${f.content}\n---`
  ).join('\n');
  
  const analysisPrompt = `Analyze this entire project for:
1. Syntax errors
2. Logic bugs
3. Performance issues
4. Security vulnerabilities
5. Code quality improvements
6. Missing dependencies
7. Best practice violations

Project Files:
${projectContext}

Provide a detailed analysis with specific fixes and improvements.`;

  const messages: Message[] = [{
    id: '1',
    role: 'user',
    content: analysisPrompt,
    timestamp: Date.now()
  }];

  return await generateChatResponse(messages, analysisPrompt, files, modelId, apiKeys, customProviders);
};

// Fix specific error in code
export const fixCodeError = async (
  errorMessage: string,
  fileName: string,
  fileContent: string,
  modelId: string,
  apiKeys: Record<string, string>,
  customProviders: any[] = []
): Promise<string> => {
  const fixPrompt = `Fix this error in the code:

Error: ${errorMessage}
File: ${fileName}
Code:
${fileContent}

Provide the corrected code with explanation of the fix.`;

  const messages: Message[] = [{
    id: '1',
    role: 'user',
    content: fixPrompt,
    timestamp: Date.now()
  }];

  return await generateChatResponse(messages, fixPrompt, [], modelId, apiKeys, customProviders);
};

// Generate multi-file project templates
export const generateProjectTemplate = (projectType: string): AIAction[] => {
  const templates: Record<string, AIAction[]> = {
    'hotel_portfolio': [
      {
        type: 'create_file',
        filename: 'index.html',
        language: 'html',
        description: 'Main HTML structure for hotel portfolio',
        content: `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Luxury Hotel Portfolio</title>
    <link rel="stylesheet" href="styles.css">
</head>
<body>
    <header>
        <nav>
            <div class="logo">LuxuryStay</div>
            <ul>
                <li><a href="#home">Home</a></li>
                <li><a href="#rooms">Rooms</a></li>
                <li><a href="#amenities">Amenities</a></li>
                <li><a href="#contact">Contact</a></li>
            </ul>
        </nav>
    </header>
    
    <main>
        <section id="home" class="hero">
            <h1>Welcome to LuxuryStay</h1>
            <p>Experience unparalleled comfort and elegance</p>
            <button class="cta-button">Book Now</button>
        </section>
        
        <section id="rooms" class="rooms">
            <h2>Our Rooms</h2>
            <div class="room-grid">
                <div class="room-card">
                    <img src="room1.jpg" alt="Deluxe Suite">
                    <h3>Deluxe Suite</h3>
                    <p>Spacious suite with city view</p>
                    <span class="price">$299/night</span>
                </div>
            </div>
        </section>
    </main>
    
    <script src="script.js"></script>
</body>
</html>`
      },
      {
        type: 'create_file',
        filename: 'styles.css',
        language: 'css',
        description: 'CSS styles for hotel portfolio',
        content: `* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Arial', sans-serif;
    line-height: 1.6;
    color: #333;
}

header {
    background: #1a1a1a;
    color: white;
    padding: 1rem 0;
    position: fixed;
    width: 100%;
    top: 0;
    z-index: 1000;
}

nav {
    display: flex;
    justify-content: space-between;
    align-items: center;
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 2rem;
}

.logo {
    font-size: 1.5rem;
    font-weight: bold;
}

nav ul {
    display: flex;
    list-style: none;
}

nav ul li {
    margin-left: 2rem;
}

nav ul li a {
    color: white;
    text-decoration: none;
    transition: color 0.3s;
}

nav ul li a:hover {
    color: #gold;
}

.hero {
    background: linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url('hero-bg.jpg');
    background-size: cover;
    background-position: center;
    height: 100vh;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    text-align: center;
    color: white;
}

.hero h1 {
    font-size: 3rem;
    margin-bottom: 1rem;
}

.cta-button {
    background: #gold;
    color: #1a1a1a;
    padding: 1rem 2rem;
    border: none;
    border-radius: 5px;
    font-size: 1.1rem;
    cursor: pointer;
    transition: transform 0.3s;
}

.cta-button:hover {
    transform: translateY(-2px);
}

.rooms {
    padding: 4rem 2rem;
    max-width: 1200px;
    margin: 0 auto;
}

.room-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 2rem;
    margin-top: 2rem;
}

.room-card {
    border: 1px solid #ddd;
    border-radius: 10px;
    overflow: hidden;
    transition: transform 0.3s;
}

.room-card:hover {
    transform: translateY(-5px);
}

.room-card img {
    width: 100%;
    height: 200px;
    object-fit: cover;
}

.room-card h3 {
    padding: 1rem;
    font-size: 1.2rem;
}

.room-card p {
    padding: 0 1rem;
    color: #666;
}

.price {
    display: block;
    padding: 1rem;
    font-weight: bold;
    color: #gold;
    font-size: 1.1rem;
}`
      },
      {
        type: 'create_file',
        filename: 'script.js',
        language: 'javascript',
        description: 'JavaScript functionality for hotel portfolio',
        content: `// Hotel Portfolio JavaScript

// Smooth scrolling for navigation links
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth',
                block: 'start'
            });
        }
    });
});

// Header background change on scroll
window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (window.scrollY > 100) {
        header.style.background = 'rgba(26, 26, 26, 0.95)';
    } else {
        header.style.background = '#1a1a1a';
    }
});

// Room booking functionality
document.addEventListener('DOMContentLoaded', () => {
    const ctaButton = document.querySelector('.cta-button');
    
    ctaButton.addEventListener('click', () => {
        // Simple booking modal or redirect
        alert('Booking system would be integrated here!');
        // In a real application, this would open a booking form or redirect to a booking page
    });
    
    // Add room cards interaction
    const roomCards = document.querySelectorAll('.room-card');
    roomCards.forEach(card => {
        card.addEventListener('click', () => {
            const roomName = card.querySelector('h3').textContent;
            alert(\`You selected: \${roomName}\`);
            // In a real application, this would show room details or booking options
        });
    });
});

// Simple image lazy loading
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const imageObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
        }
    });
}, observerOptions);

// Observe all images with data-src attribute
document.querySelectorAll('img[data-src]').forEach(img => {
    imageObserver.observe(img);
});`
      }
    ]
  };
  
  return templates[projectType] || [];
};