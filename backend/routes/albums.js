const express = require('express');
const { protect } = require('../middleware/auth');
const Album = require('../models/Album');
const User = require('../models/User');
const { 
  createFolder,
  makePublic,
  shareWithUsers,
  listFiles,
  setCredentials
} = require('../services/googleDriveService');
const { ErrorResponse } = require('../utils/errorHandler');
const router = express.Router();

// @desc    Create a new album
// @route   POST /api/albums
// @access  Private
router.post('/', protect, async (req, res, next) => {
  try {
    const { title, description, isPublic } = req.body;

    // Validate required fields
    if (!title) {
      return res.status(400).json({ message: 'Title is required' });
    }

    // Set credentials for Google Drive API using user's tokens
    setCredentials(req.user.googleAccessToken, req.user.googleRefreshToken);

    // Create folder in Google Drive
    const folderId = await createFolder(title);

    // Generate a unique share key
    const shareKey = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Create album in database
    const album = await Album.create({
      title,
      description,
      owner: req.user.id,
      googleDriveFolderId: folderId,
      isPublic: isPublic || false,
      shareKey
    });

    // If album is public, make the Google Drive folder public
    if (isPublic) {
      await makePublic(folderId);
    }

    // Update user's default folder if not set
    if (!req.user.googleDriveFolderId) {
      await User.findByIdAndUpdate(req.user.id, {
        googleDriveFolderId: folderId
      });
    }

    res.status(201).json({
      success: true,
      data: album
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get user's albums
// @route   GET /api/albums
// @access  Private
router.get('/', protect, async (req, res, next) => {
  try {
    const albums = await Album.find({ owner: req.user.id }).sort({ createdAt: -1 });
    
    res.status(200).json({
      success: true,
      count: albums.length,
      data: albums
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get album by ID
// @route   GET /api/albums/:id
// @access  Private
router.get('/:id', protect, async (req, res, next) => {
  try {
    const album = await Album.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    res.status(200).json({
      success: true,
      data: album
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update album
// @route   PUT /api/albums/:id
// @access  Private
router.put('/:id', protect, async (req, res, next) => {
  try {
    const { title, description, isPublic } = req.body;

    const album = await Album.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // If isPublic changed, update Google Drive permissions
    if (album.isPublic !== isPublic) {
      setCredentials(req.user.googleAccessToken, req.user.googleRefreshToken);
      
      if (isPublic) {
        await makePublic(album.googleDriveFolderId);
      }
      // For now, we won't automatically remove public access when isPublic becomes false
      // since that might affect existing shares
    }

    // Update album
    album.title = title || album.title;
    album.description = description || album.description;
    album.isPublic = isPublic !== undefined ? isPublic : album.isPublic;

    await album.save();

    res.status(200).json({
      success: true,
      data: album
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete album
// @route   DELETE /api/albums/:id
// @access  Private
router.delete('/:id', protect, async (req, res, next) => {
  try {
    const album = await Album.findOne({
      _id: req.params.id,
      owner: req.user.id
    });

    if (!album) {
      return res.status(404).json({
        success: false,
        message: 'Album not found'
      });
    }

    // Remove from Google Drive
    setCredentials(req.user.googleAccessToken, req.user.googleRefreshToken);
    const { deleteFolder } = require('../services/googleDriveService');
    await deleteFolder(album.googleDriveFolderId);

    // Remove from database
    await Album.deleteOne({ _id: req.params.id });

    res.status(200).json({
      success: true,
      message: 'Album deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Share album with specific users
// @route   POST /api/albums/:id/share
// @access  Private
router.post('/:id/share', protect, async (req, res, next) => {
  try {
    const { emails, role } = req.body;
    const { id } = req.params;

    if (!emails || !Array.isArray(emails) || emails.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Emails array is required'
      });
    }

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

    // Share the folder with specified emails
    const permissions = await shareWithUsers(
      album.googleDriveFolderId,
      emails,
      role || 'reader'
    );

    // Update album with shared information
    album.sharedWith = [...album.sharedWith, ...permissions];
    await album.save();

    res.status(200).json({
      success: true,
      message: 'Album shared successfully',
      data: permissions
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Enable/disable collaboration for album
// @route   PUT /api/albums/:id/collaboration
// @access  Private
router.put('/:id/collaboration', protect, async (req, res, next) => {
  try {
    const { allowCollaboration, collaborationEmails } = req.body;
    const { id } = req.params;

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

    // Update collaboration settings
    album.allowCollaboration = allowCollaboration || false;
    
    if (collaborationEmails && Array.isArray(collaborationEmails)) {
      album.collaborationEmails = collaborationEmails.map(email => ({
        email,
        invitedAt: new Date()
      }));
    }

    await album.save();

    res.status(200).json({
      success: true,
      message: 'Collaboration settings updated successfully',
      data: {
        allowCollaboration: album.allowCollaboration,
        collaborationEmails: album.collaborationEmails
      }
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Create a collection within an album
// @route   POST /api/albums/:id/collections
// @access  Private
router.post('/:id/collections', protect, async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, imageIds } = req.body;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: 'Collection name is required'
      });
    }

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

    // Find specified images in the album
    const imagesToAdd = album.images.filter(img => 
      imageIds.includes(img.fileId) || imageIds.includes(img._id.toString())
    );

    // Create new collection
    const newCollection = {
      name,
      images: imagesToAdd,
      createdAt: new Date()
    };

    album.collections.push(newCollection);
    await album.save();

    res.status(201).json({
      success: true,
      message: 'Collection created successfully',
      data: newCollection
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get all collections in an album
// @route   GET /api/albums/:id/collections
// @access  Private
router.get('/:id/collections', protect, async (req, res, next) => {
  try {
    const { id } = req.params;

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

    res.status(200).json({
      success: true,
      count: album.collections.length,
      data: album.collections
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Get a specific collection
// @route   GET /api/albums/:id/collections/:collectionId
// @access  Private
router.get('/:id/collections/:collectionId', protect, async (req, res, next) => {
  try {
    const { id, collectionId } = req.params;

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

    const collection = album.collections.id(collectionId);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    res.status(200).json({
      success: true,
      data: collection
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Update a collection
// @route   PUT /api/albums/:id/collections/:collectionId
// @access  Private
router.put('/:id/collections/:collectionId', protect, async (req, res, next) => {
  try {
    const { id, collectionId } = req.params;
    const { name, imageIds } = req.body;

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

    const collection = album.collections.id(collectionId);
    if (!collection) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    // Update collection name if provided
    if (name) {
      collection.name = name;
    }

    // Update collection images if provided
    if (imageIds && Array.isArray(imageIds)) {
      const imagesToAdd = album.images.filter(img => 
        imageIds.includes(img.fileId) || imageIds.includes(img._id.toString())
      );
      collection.images = imagesToAdd;
    }

    await album.save();

    res.status(200).json({
      success: true,
      message: 'Collection updated successfully',
      data: collection
    });
  } catch (error) {
    next(error);
  }
});

// @desc    Delete a collection
// @route   DELETE /api/albums/:id/collections/:collectionId
// @access  Private
router.delete('/:id/collections/:collectionId', protect, async (req, res, next) => {
  try {
    const { id, collectionId } = req.params;

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

    const collectionIndex = album.collections.findIndex(
      collection => collection._id.toString() === collectionId
    );

    if (collectionIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Collection not found'
      });
    }

    album.collections.splice(collectionIndex, 1);
    await album.save();

    res.status(200).json({
      success: true,
      message: 'Collection deleted successfully'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;