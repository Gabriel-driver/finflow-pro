import '../server.js';

// Import the Express app from server.js
// The server.js exports the app as default
import app from '../server.js';

// Export as serverless function for Vercel
export default app;
