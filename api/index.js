// api/index.js
import serverless from 'serverless-http';
import { app } from '../backend/src/index.js';

// Export the handler that Vercel will invoke
export default serverless(app);
