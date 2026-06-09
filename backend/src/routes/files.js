import express from 'express';
import { authMiddleware } from '../middleware/auth.js';
import upload from '../middleware/upload.js';
import { 
  uploadFile, 
  getRoomFiles, 
  downloadFile, 
  deleteFile 
} from '../controllers/fileController.js';

const router = express.Router();

// Upload a file
router.post('/upload', authMiddleware, upload.single('file'), uploadFile);

// Get files for a specific room
router.get('/room/:roomId', authMiddleware, getRoomFiles);

// Download a file
router.get('/download/:fileId', authMiddleware, downloadFile);

// Delete a file
router.delete('/:fileId', authMiddleware, deleteFile);

export default router;
