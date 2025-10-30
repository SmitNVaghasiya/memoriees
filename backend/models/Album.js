const mongoose = require('mongoose');

const albumSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  googleDriveFolderId: {
    type: String,
    required: true,
    unique: true
  },
  images: [{
    fileId: String,
    fileName: String,
    mimeType: String,
    webViewLink: String,
    thumbnailLink: String,
    fileSize: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
  collections: [{
    name: String,
    images: [{
      fileId: String,
      fileName: String,
      mimeType: String,
      webViewLink: String,
      thumbnailLink: String,
      fileSize: Number,
      uploadedAt: {
        type: Date,
        default: Date.now
      }
    }]
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  allowCollaboration: {
    type: Boolean,
    default: false // Whether others can upload to this album
  },
  collaborationEmails: [{
    email: String,
    permissionId: String,
    role: {
      type: String,
      enum: ['reader', 'writer'],
      default: 'reader'
    },
    invitedAt: {
      type: Date,
      default: Date.now
    }
  }],
  shareKey: {
    type: String,
    unique: true
  },
  sharedWith: [{
    email: String,
    permissionId: String,
    role: {
      type: String,
      enum: ['reader', 'viewer', 'commenter', 'writer'],
      default: 'viewer'
    },
    sharedAt: {
      type: Date,
      default: Date.now
    }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

albumSchema.pre('save', function(next) {
  this.updatedAt = Date.now;
  next();
});

module.exports = mongoose.model('Album', albumSchema);