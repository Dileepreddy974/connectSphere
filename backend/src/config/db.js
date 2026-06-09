import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import config from '../config.js';

let mongod = null;

const connectionOptions = {
  maxPoolSize: config.mongoMaxPoolSize,
  minPoolSize: config.mongoMinPoolSize,
  serverSelectionTimeoutMS: 5000
};

export const connectDB = async () => {
  try {
    if (config.mongoUri !== 'mongodb://localhost:27017/connectsphere') {
      try {
        await mongoose.connect(config.mongoUri, connectionOptions);
        console.log('Connected to MongoDB Atlas/Custom');
        return;
      } catch (error) {
        if (config.nodeEnv === 'production') throw error;
        console.log('Could not connect to MONGODB_URI, falling back to local/memory...');
      }
    }

    try {
      await mongoose.connect('mongodb://localhost:27017/connectsphere', {
        ...connectionOptions,
        serverSelectionTimeoutMS: 2000
      });
      console.log('Connected to Local MongoDB');
    } catch (error) {
      if (config.nodeEnv === 'production') throw error;

      console.log('Local MongoDB not found. Starting in-memory MongoDB for development...');
      mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri(), connectionOptions);
      console.log('Connected to in-memory MongoDB (development only)');
    }
  } catch (error) {
    console.error('Database connection error:', error.message);
    process.exit(1);
  }
};

export const closeDB = async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongod) {
    await mongod.stop();
  }
};
