# Memories - Google Drive Sharing Platform

A web application that allows users to create albums, upload images to Google Drive, and share them with others through secure links.

## Features

- **Google OAuth Authentication**: Secure login with Google accounts
- **Album Management**: Create and manage photo albums
- **Image Upload**: Upload multiple images to Google Drive in original quality
- **Sharing**: Share albums with specific users or make them public
- **Collections**: Organize photos by people/groups (like Google Photos)
- **Collaboration**: Allow others to upload images to your albums
- **Image Gallery**: View and browse images in albums
- **Responsive Design**: Works on desktop and mobile devices

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (Atlas)
- **Authentication**: Passport.js with Google OAuth 2.0
- **Google APIs**: Google Drive API, Google OAuth2 API
- **Other**: JWT, Mongoose, Multer, Bcrypt, CORS, Helmet

## Installation

### Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account
- Google Cloud Platform account with Google Drive API enabled

### Setup

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/memories-backend.git
   cd memories-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory with the following variables:
   ```env
   # Server Configuration
   PORT=5000
   NODE_ENV=development
   
   # Database
   MONGODB_URI=your_mongodb_atlas_connection_string
   
   # JWT
   JWT_SECRET=your_jwt_secret
   JWT_EXPIRE=7d
   
   # Google OAuth
   GOOGLE_CLIENT_ID=your_google_client_id
   GOOGLE_CLIENT_SECRET=your_google_client_secret
   GOOGLE_REDIRECT_URI=http://localhost:5000/api/auth/google/callback
   
   # Session
   SESSION_SECRET=your_session_secret
   
   # Frontend URL
   CLIENT_URL=http://localhost:3000
   ```

4. Create Google OAuth credentials:
   - Go to the [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project or select an existing one
   - Enable the Google Drive API and Google+ API
   - Go to "Credentials" and create OAuth 2.0 Client IDs
   - Add authorized redirect URIs: `http://localhost:5000/api/auth/google/callback`
   - Download the credentials and add them to your `.env` file

5. Run the application:
   ```bash
   # For development
   npm run dev
   
   # For production
   npm start
   ```

## API Endpoints

### Authentication
- `GET /api/auth/google` - Initiate Google OAuth
- `GET /api/auth/google/callback` - Google OAuth callback
- `GET /api/auth/me` - Get current user info
- `GET /api/auth/logout` - Logout user

### Albums
- `POST /api/albums` - Create a new album
- `GET /api/albums` - Get user's albums
- `GET /api/albums/:id` - Get specific album
- `PUT /api/albums/:id` - Update album
- `DELETE /api/albums/:id` - Delete album
- `POST /api/albums/:id/share` - Share album with users
- `PUT /api/albums/:id/collaboration` - Set collaboration settings
- `POST /api/albums/:id/collections` - Create a collection within album
- `GET /api/albums/:id/collections` - Get all collections in album
- `GET /api/albums/:id/collections/:collectionId` - Get specific collection
- `PUT /api/albums/:id/collections/:collectionId` - Update collection
- `DELETE /api/albums/:id/collections/:collectionId` - Delete collection

### Images
- `POST /api/images/upload/:albumId` - Upload images to album
- `GET /api/images/album/:albumId` - Get images from album
- `DELETE /api/images/:id/:fileId` - Delete image from album

### Collaboration
- `POST /api/collaboration/:shareKey` - Upload images to album by collaboration

### Sharing
- `GET /api/shares/album/:shareKey` - Get shared album by key
- `GET /api/shares/album/:shareKey/images` - Get images from shared album
- `GET /api/shares/image/:fileId` - Get specific shared image
- `GET /api/shares/album/:shareKey/collections` - Get collections from shared album
- `GET /api/shares/album/:shareKey/collections/:collectionId` - Get specific collection from shared album

## Environment Variables

The application requires the following environment variables:

- `MONGODB_URI`: Connection string for MongoDB Atlas
- `JWT_SECRET`: Secret for signing JWT tokens
- `GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_CLIENT_SECRET`: Google OAuth client secret
- `GOOGLE_REDIRECT_URI`: Redirect URI for Google OAuth
- `SESSION_SECRET`: Secret for session encryption
- `CLIENT_URL`: URL of the frontend application

## Database Models

### User
- `googleId`: Google account ID
- `displayName`: User's display name
- `email`: User's email address
- `firstName`, `lastName`: User's first and last name
- `profilePicture`: URL to profile picture
- `googleAccessToken`, `googleRefreshToken`: Google API tokens
- `googleDriveFolderId`: Default folder ID in Google Drive

### Album
- `title`: Album title
- `description`: Album description
- `owner`: Reference to user who owns the album
- `googleDriveFolderId`: Folder ID in Google Drive
- `images`: Array of image objects
- `isPublic`: Whether the album is public
- `shareKey`: Unique key for sharing
- `sharedWith`: Array of users with access

## Security

- Passwords are hashed using bcrypt
- Sessions are stored in MongoDB with secure configuration
- Input validation and sanitization
- Rate limiting to prevent abuse
- CORS configured for secure cross-origin requests
- Helmet middleware for security headers

## Error Handling

The application uses comprehensive error handling with:

- Try-catch blocks for async operations
- Custom error classes
- Centralized error middleware
- Detailed error messages in development mode

## Deployment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use a process manager like PM2
3. Set up SSL certificates for HTTPS
4. Configure proxy settings if using a reverse proxy

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a pull request

## License

This project is licensed under the ISC License.

## Support

If you encounter any issues or have questions, please file an issue on the GitHub repository.