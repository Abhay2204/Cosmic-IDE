// Simple script to check if dev server is ready before launching Electron
const http = require('http');

const checkServer = (retries = 30) => {
  return new Promise((resolve, reject) => {
    const attempt = () => {
      http.get('http://localhost:3000', (res) => {
        if (res.statusCode === 200) {
          console.log('✓ Dev server ready');
          resolve();
        } else {
          retry();
        }
      }).on('error', retry);
    };

    const retry = () => {
      if (retries > 0) {
        retries--;
        setTimeout(attempt, 1000);
      } else {
        reject(new Error('Dev server failed to start'));
      }
    };

    attempt();
  });
};

checkServer()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('✗', err.message);
    process.exit(1);
  });
