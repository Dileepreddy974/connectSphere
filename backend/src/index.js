{
  "name": "connectsphere-backend",
  "version": "1.0.0",
  "description": "ConnectSphere - Real-time video conferencing backend",
  "main": "src/index.js",
  "type": "module",
  "scripts": {
    "dev": "nodemon src/index.js",
    "start": "node src/index.js",
    "build": "echo \"No build needed for Node.js backend\"",
    "test": "jest --watchAll=false",
    "test:watch": "jest"
  },
  "keywords": [
    "video",
    "conferencing",
    "webrtc",
    "socket.io",
    "collaboration"
  ],
  "author": "",
  "license": "MIT",
  "dependencies": {
    "bcryptjs": "^2.4.3",
    "compression": "^1.8.1",
    "cors": "^2.8.5",
    "dotenv": "^16.0.3",
    "express": "^4.18.2",
    "express-rate-limit": "^6.7.0",
    "ioredis": "^5.3.2",
    "rate-limit-redis": "^2.1.0",
    "prom-client": "^14.1.1",
    "express-validator": "^7.0.0",
    "helmet": "^8.2.0",
    "jsonwebtoken": "^9.0.0",
    "mongoose": "^7.0.3",
    "morgan": "^1.10.1",
    "multer": "^1.4.5-lts.1",
    "socket.io": "^4.6.1"
  },
  "devDependencies": {
    "eslint": "^8.38.0",
    "jest": "^29.5.0",
    "mongodb-memory-server": "^11.1.0",
    "nodemon": "^2.0.20",
    "supertest": "^6.3.3"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
