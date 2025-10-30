const express = require('express');
const Album = require('../models/Album');
const { 
  listFiles,
  setCredentials
} = require('../services/googleDriveService');
const { ErrorResponse } = require('../utils/errorHandler');
const router = express.Router();

// @desc    Get album by share key (public access)
// @route   GET /api/shares/album/:shareKey
// @access  Public
router.get('/album/:shareKey', async (req, res, next) => {
  try {
    const { shareKey } = req.params;

    // Find album by share key
    const album = await Album.findOne({ shareKey });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Check if album is public or has been shared with specific users
    if (!album.isPublic && album.sharedWith.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Return album info (excluding sensitive data)
    const albumInfo = {
      _id: album._id,
      title: album.title,
      description: album.description,
      owner: album.owner,
      isPublic: album.isPublic,
      createdAt: album.createdAt,
      updatedAt: album.updatedAt
    };

    res.status(200).json({
      success: true,
      data: albumInfo
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get images from shared album
// @route   GET /api/shares/album/:shareKey/images
// @access  Public
router.get('/album/:shareKey/images', async (req, res, next) => {
  try {
    const { shareKey } = req.params;

    // Find album by share key
    const album = await Album.findOne({ shareKey });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Check if album is public or has been shared with specific users
    if (!album.isPublic && album.sharedWith.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // For public access, we need to use a service account or the owner's credentials
    // In a real implementation, you might want to create temporary access tokens
    // For now, we'll just return the stored image information
    const images = album.images.map(img => ({
      fileId: img.fileId,
      fileName: img.fileName,
      mimeType: img.mimeType,
      webViewLink: img.webViewLink,
      thumbnailLink: img.thumbnailLink,
      fileSize: img.fileSize,
      uploadedAt: img.uploadedAt
    }));

    res.status(200).json({
      success: true,
      count: images.length,
      data: images
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get image by ID from shared album
// @route   GET /api/shares/image/:fileId
// @access  Public
router.get('/image/:fileId', async (req, res, next) => {
  try {
    const { fileId } = req.params;

    // Find album containing this file
    const album = await Album.findOne({ 'images.fileId': fileId });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    // Check if album is public or has been shared with specific users
    if (!album.isPublic && album.sharedWith.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find the specific image
    const image = album.images.find(img => img.fileId === fileId);

    if (!image) {
      return res.status(404).json({
        success: false,
        message: 'Image not found'
      });
    }

    res.status(200).json({
      success: true,
      data: image
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get collections from shared album
// @route   GET /api/shares/album/:shareKey/collections
// @access  Public
router.get('/album/:shareKey/collections', async (req, res, next) => {
  try {
    const { shareKey } = req.params;

    // Find album by share key
    const album = await Album.findOne({ shareKey });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Check if album is public or has been shared with specific users
    if (!album.isPublic && album.sharedWith.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.status(200).json({
      success: true,
      count: album.collections.length,
      data: album.collections.map(collection => ({
        _id: collection._id,
        name: collection.name,
        imageCount: collection.images.length,
        createdAt: collection.createdAt
      }))
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get specific collection from shared album
// @route   GET /api/shares/album/:shareKey/collections/:collectionId
// @access  Public
router.get('/album/:shareKey/collections/:collectionId', async (req, res, next) => {
  try {
    const { shareKey, collectionId } = req.params;

    // Find album by share key
    const album = await Album.findOne({ shareKey });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Check if album is public or has been shared with specific users
    if (!album.isPublic && album.sharedWith.length === 0) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find the specific collection
    const collection = album.collections.find(col => 
      col._id.toString() === collectionId
    );

    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Return collection with images
    res.status(200).json({
      success: true,
      data: {
        _id: collection._id,
        name: collection.name,
        images: collection.images,
        createdAt: collection.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;