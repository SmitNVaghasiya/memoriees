const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
require('dotenv').config();

module.exports = function(passport) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: '/api/auth/google/callback'
      },
      async (accessToken, refreshToken, profile, done) => {
        const newUser = {
          googleId: profile.id,
          displayName: profile.displayName,
          email: profile.emails[0].value,
          firstName: profile.name.givenName,
          lastName: profile.name.familyName,
          profilePicture: profile.photos[0].value,
          googleAccessToken: accessToken,
          googleRefreshToken: refreshToken
        };

        try {
          let user = await User.findOne({ googleId: profile.id });

          if (user) {
            // Update tokens
            user.googleAccessToken = accessToken;
            user.googleRefreshToken = refreshToken;
            await user.save();
            return done(null, user);
          } else {
            // Create new user
            user = await User.create(newUser);
            return done(null, user);
          }
        } catch (error) {
          console.error(error);
          return done(error, null);
        }
      }
    )
  );

  passport.serializeUser((user, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id, done) => {
    try {
      const user = await User.findById(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });
};