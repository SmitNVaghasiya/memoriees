const { drive, oauth2Client } = require('../config/googleDrive');
const Album = require('../models/Album');

// Set credentials for OAuth2 client
const setCredentials = (accessToken, refreshToken) => {
  oauth2Client.setCredentials({
    access_token: accessToken,
    refresh_token: refreshToken
  });
};

// Create a new folder in Google Drive
const createFolder = async (folderName, parentFolderId = null) => {
  try {
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder'
    };

    if (parentFolderId) {
      fileMetadata.parents = [parentFolderId];
    }

    const response = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });

    return response.data.id;
  } catch (error) {
    console.error('Error creating folder:', error);
    throw error;
  }
};

// Upload a file to Google Drive
const uploadFile = async (filePath, fileName, mimeType, folderId) => {
  try {
    const response = await drive.files.create({
      resource: {
        name: fileName,
        parents: [folderId]
      },
      media: {
        mimeType: mimeType,
        body: require('fs').createReadStream(filePath)
      },
      fields: 'id, webViewLink, thumbnailLink, mimeType, size'
    });

    return response.data;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// List files in a folder
const listFiles = async (folderId, mimeType = null) => {
  try {
    let query = `'${folderId}' in parents and trashed=false`;
    
    if (mimeType) {
      query += ` and mimeType contains '${mimeType}'`;
    }

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name, mimeType, webViewLink, thumbnailLink, size, createdTime)',
      orderBy: 'createdTime'
    });

    return response.data.files;
  } catch (error) {
    console.error('Error listing files:', error);
    throw error;
  }
};

// Delete a file from Google Drive
const deleteFile = async (fileId) => {
  try {
    await drive.files.delete({
      fileId: fileId
    });
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

// Delete a folder from Google Drive
const deleteFolder = async (folderId) => {
  try {
    await drive.files.delete({
      fileId: folderId
    });
  } catch (error) {
    console.error('Error deleting folder:', error);
    throw error;
  }
};

// Get file information
const getFile = async (fileId) => {
  try {
    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, webViewLink, thumbnailLink, size, createdTime'
    });

    return response.data;
  } catch (error) {
    console.error('Error getting file:', error);
    throw error;
  }
};

// Make a file or folder publicly accessible
const makePublic = async (fileId) => {
  try {
    await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
  } catch (error) {
    console.error('Error making file public:', error);
    throw error;
  }
};

// Share file with specific users
const shareWithUsers = async (fileId, emails, role = 'reader') => {
  try {
    const permissions = [];
    
    for (const email of emails) {
      const response = await drive.permissions.create({
        fileId: fileId,
        requestBody: {
          role: role,
          type: 'user',
          emailAddress: email
        },
        sendNotificationEmail: false
      });
      permissions.push({
        email: email,
        permissionId: response.data.id,
        role: role
      });
    }
    
    return permissions;
  } catch (error) {
    console.error('Error sharing with users:', error);
    throw error;
  }
};

// Remove sharing permissions
const removeSharing = async (fileId, permissionId) => {
  try {
    await drive.permissions.delete({
      fileId: fileId,
      permissionId: permissionId
    });
  } catch (error) {
    console.error('Error removing sharing:', error);
    throw error;
  }
};

module.exports = {
  setCredentials,
  createFolder,
  uploadFile,
  listFiles,
  deleteFile,
  deleteFolder,
  getFile,
  makePublic,
  shareWithUsers,
  removeSharing
};