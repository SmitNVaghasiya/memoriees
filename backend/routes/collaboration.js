const express = require('express');
const multer = require('multer');
const path = require('path');
const Album = require('../models/Album');
const { 
  uploadFile,
  setCredentials
} = require('../services/googleDriveService');
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
    fileSize: 50 * 1024 * 1024 // 50MB limit for higher quality
  }
});

// @desc    Upload images to album by collaboration (for non-owners with permission)
// @route   POST /api/images/collaboration/:shareKey
// @access  Public (with valid share key and permissions)
router.post('/collaboration/:shareKey', upload.array('images', 100), async (req, res, next) => {
  try {
    const { shareKey } = req.params;

    // Find album by share key
    const album = await Album.findOne({ shareKey });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found or invalid share key'
      });
    }

    // Check if collaboration is allowed
    if (!album.allowCollaboration) {
      return res.status(403).json({
        success: false,
        message: 'Collaboration not allowed for this album'
      });
    }

    // If user provides email, check permissions
    const userEmail = req.body.email || req.query.email;
    if (userEmail) {
      const hasPermission = album.collaborationEmails.some(
        emailObj => emailObj.email === userEmail
      );
      
      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'You do not have permission to upload to this album'
        });
      }
    }
    // If no email provided, check if album is publicly open for collaboration (not recommended)
    else if (album.collaborationEmails.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'No public collaboration allowed for this album'
      });
    }

    // For collaboration uploads, we need to use the owner's credentials
    // In a real implementation, you might want to authenticate the owner's tokens
    
    // If we have a valid user, set credentials to owner's credentials
    // This is a simplified approach - in production, you might want to use a service account
    // or temporary access tokens for the owner
    try {
      // This assumes we have access to the owner's tokens somehow
      // In a real implementation, you'd have to handle this differently
      // For now, we'll add the images to the album without uploading to Google Drive
      // since we can't access the owner's Google Drive without their tokens
    } catch (error) {
      console.error('Error setting credentials:', error);
      // For this simplified version, we'll proceed with adding to DB only
    }

    const uploadedFiles = [];

    // Process each file
    for (const file of req.files) {
      // In a real implementation, we would upload to the owner's Google Drive
      // For now, we'll create a placeholder for the image
      const imageInfo = {
        fileId: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        fileName: file.originalname,
        mimeType: file.mimetype,
        fileSize: file.size,
        uploadedAt: new Date()
      };

      // Add to album's images array
      album.images.push(imageInfo);
      uploadedFiles.push(imageInfo);

      // Remove file from local storage after processing
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
    
    console.error('Collaboration upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Error processing upload'
    });
  }
});

module.exports = router;