import File from '../models/File.js';
import path from 'path';
import fs from 'fs/promises';
import { getPagination } from '../utils/pagination.js';

/**
 * Upload a file
 */
export const uploadFile = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file'
      });
    }
    const { roomId } = req.body;
    if (!roomId) {
      return res.status(400).json({ success: false, message: 'roomId is required' });
    }
    const file = await File.create({
      fileName: req.file.originalname,
      fileUrl: req.file.path,
      fileSize: req.file.size,
      fileType: req.file.mimetype,
      roomId,
      uploadedBy: req.user.id
    });

    return res.status(201).json({
      success: true,
      message: 'File uploaded successfully',
      data: file
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get files for a room
 */
export const getRoomFiles = async (req, res, next) => {
  try {
    const { roomId } = req.params;
    const { page, limit, skip } = getPagination(req.query, 25, 100);
    const files = await File.find({ roomId })
      .populate('uploadedBy', 'name email')
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // Map uploadedAt -> createdAt for frontend compatibility
    const mapped = files.map(f => ({
      ...f,
      createdAt: f.uploadedAt
    }));

    return res.status(200).json({
      success: true,
      data: mapped,
      pagination: { page, limit }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Download a file
 */
export const downloadFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    const absolutePath = path.resolve(file.fileUrl);

    try {
      await fs.access(absolutePath);
    } catch {
      return res.status(404).json({
        success: false,
        message: 'Physical file not found on server'
      });
    }

    res.download(absolutePath, file.fileName);
  } catch (error) {
    next(error);
  }
};

/**
 * Delete a file
 */
export const deleteFile = async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const file = await File.findById(fileId);

    if (!file) {
      return res.status(404).json({
        success: false,
        message: 'File not found'
      });
    }

    // Only sender can delete
    if (file.uploadedBy.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this file'
      });
    }

    // Delete physical file
    const absolutePath = path.resolve(file.fileUrl);
    try {
      await fs.unlink(absolutePath);
    } catch (error) {
      if (error.code !== 'ENOENT') throw error;
    }

    await file.deleteOne();

    return res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
