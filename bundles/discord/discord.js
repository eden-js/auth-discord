// Require dependencies
const passport = require('passport');

// Require class dependencies
const Strategy = require('passport-discord').Strategy;

// Require local dependencies
const config = require('config');

// Require local class dependencies
const AuthController = require('auth/controllers/auth');

// Require models
const image = model('image');

/**
 * Create Discord Auth Controller class
 *
 * @extends AuthController
 */
class DiscordAuthController extends AuthController {
  /**
   * Construct Discord Auth Controller class
   */
  constructor() {
    // Run super
    super();

    // Bind private methods
    this._build = this._build.bind(this);

    // Run build
    this._build();
  }

  /**
   * Build Discord Auth Controller
   *
   * @private
   */
  _build() {
    // Add Discord strategy to passport
    passport.use(new Strategy({
      clientID          : config.get('discord.oauth.clientID'),
      clientSecret      : config.get('discord.oauth.clientSecret'),
      callbackURL       : `https://${config.get('domain')}/auth/discord`,
      scope             : config.get('discord.oauth.scope'),
      passReqToCallback : true,
    }, async (req, identifier, refreshToken, profile, next) => {
      // Run super authenticate
      return await super._authenticate('discord', req, identifier, refreshToken, profile, next);
    }));

    // Add user pre-register
    this.eden.pre('user.register', async (data) => {
      // Check user and auth
      if (data.user && data.auth && data.auth.get('type') === 'discord') {
        // Set discord id
        data.user.set('discordID', data.auth.get('profile.id'));

        // Check user username
        if (!data.user.get('username')) {
          // Set username
          data.user.set('username', data.auth.get('profile.username'));
        }

        // Check user email
        if (!data.user.get('email')) {
          // Set username
          data.user.set('email', data.auth.get('profile.email'));
        }

        // Find avatar image
        let avatar = await data.user.get('avatar');

        // Check avatar
        if (avatar) {
          // Return
          return;
        }

        // Try/Catch
        try {
          // Create new avatar image
          avatar = new image();

          // Check avatar
          if (data.auth.get('profile.avatar')) {
            // Load avatar from url
            await avatar.fromURL(`https://cdn.discordapp.com/avatars/${data.auth.get('profile.id')}/${data.auth.get('profile.avatar')}.png`);
          }

          // Save image
          await avatar.save();

          // Set user avatar
          data.user.set('avatar', avatar);
        } catch (ignored) {
          // Ignored
        }
      }
    });
  }
}

/**
 * Export Discord Auth Controller class
 *
 * @type {DiscordAuthController}
 */
exports = module.exports = DiscordAuthController;
