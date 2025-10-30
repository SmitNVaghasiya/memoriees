const express = require('express');
const multer = require('multer');
const path = require('path');
const { protect } = require('../middleware/auth');
const Album = require('../models/Album');
const User = require('../models/User');
const { 
  uploadFile,
  listFiles,
  deleteFile,
  setCredentials
} = require('../services/googleDriveService');
const { ErrorResponse } = require('../utils/errorHandler');
const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    // Create a unique filename
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// @desc    Upload images to album
// @route   POST /api/images/upload/:albumId
// @access  Private
router.post('/upload/:albumId', protect, upload.array('images', 100), async (req, res, next) => {
  try {
    const { albumId } = req.params;

    // Find album and ensure user owns it
    const album = await Album.findOne({
      _id: albumId,
      owner: req.user.id
    });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // If no files were uploaded
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files were uploaded'
      });
    }

    // Set credentials for Google Drive API
    setCredentials(req.user.googleAccessToken, req.user.googleRefreshToken);

    const uploadedFiles = [];

    // Upload each file to Google Drive
    for (const file of req.files) {
      const driveFile = await uploadFile(
        file.path,
        file.originalname,
        file.mimetype,
        album.googleDriveFolderId
      );

      // Store file info in album's images array
      album.images.push({
        fileId: driveFile.id,
        fileName: driveFile.name,
        mimeType: file.mimetype,
        webViewLink: driveFile.webViewLink,
        thumbnailLink: driveFile.thumbnailLink,
        fileSize: parseInt(driveFile.size)
      });

      uploadedFiles.push(driveFile);

      // Remove file from local storage after upload
      const fs = require('fs');
      fs.unlinkSync(file.path);
    }

    // Save updated album
    await album.save();

    res.status(200).json({
      success: true,
      message: `${uploadedFiles.length} file(s) uploaded successfully`,
      data: uploadedFiles
    });
  } catch (error) {
    // Remove uploaded files if there was an error
    if (req.files) {
      req.files.forEach(file => {
        const fs = require('fs');
        try {
          fs.unlinkSync(file.path);
        } catch (err) {
          console.error('Error removing file:', err);
        }
      });
    }
    
    next(error);
  }
});

// @desc    Get images from album
// @route   GET /api/images/album/:albumId
// @access  Private
router.get('/album/:albumId', protect, async (req, res, next) => {
  try {
    const { albumId } = req.params;

    // Find album and ensure user owns it
    const album = await Album.findOne({
      _id: albumId,
      owner: req.user.id
    });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Set credentials for Google Drive API
    setCredentials(req.user.googleAccessToken, req.user.googleRefreshToken);

    // Get files from Google Drive
    const files = await listFiles(album.googleDriveFolderId, 'image');

    res.status(200).json({
      success: true,
      count: files.length,
      data: files
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete image from album
// @route   DELETE /api/images/:id/:fileId
// @access  Private
router.delete('/:id/:fileId', protect, async (req, res, next) => {
  try {
    const { id, fileId } = req.params;

    // Find album and ensure user owns it
    const album = await Album.findOne({
      _id: id,
      owner: req.user.id
    });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Set credentials for Google Drive API
    setCredentials(req.user.googleAccessToken, req.user.googleRefreshToken);

    // Delete file from Google Drive
    await deleteFile(fileId);

    // Remove file from album's images array
    album.images = album.images.filter(image => image.fileId !== fileId);
    await album.save();

    res.status(200).json({
      success: true,
      message: 'Image deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;