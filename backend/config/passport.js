const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/User');
const Tenant = require('../models/Tenant');

passport.use(
  new GoogleStrategy(
    {
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: `${process.env.API_URL || 'http://localhost:5000'}/api/v1/auth/google/callback`,
      scope: ['profile', 'email']
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({
          email: profile.emails[0].value
        });

        if (user) {
          return done(null, user);
        }
        const tenantName = profile.displayName.split(' ')[0] + "'s Workspace";
        const tenantSlug = tenantName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');

        const tenant = await Tenant.create({
          name: tenantName,
          slug: tenantSlug
        });

        // Create new user
        user = await User.create({
          name: profile.displayName,
          email: profile.emails[0].value,
          password: accessToken.slice(0, 10),
          googleId: profile.id,
          tenantId: tenant._id,
          role: 'admin'
        });

        return done(null, user);
      } catch (error) {
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

module.exports = passport;
