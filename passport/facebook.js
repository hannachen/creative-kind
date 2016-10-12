var mongoose = require('mongoose'),
    User = mongoose.model('User'),
    fbConfig = require('../config/fb.js'),
    FacebookStrategy = require('passport-facebook').Strategy;

module.exports = function(passport) {
  var env = process.env.NODE_ENV || 'development';

  passport.use('facebook', new FacebookStrategy({
      clientID          : fbConfig[env].appID,
      clientSecret      : fbConfig[env].appSecret,
      callbackURL       : fbConfig[env].callbackUrl,
      profileFields     : ['id', 'email',  'name'],
      enableProof       : true
    },

    // facebook will send back the tokens and profile
    function(access_token, refresh_token, profile, done) {

      console.log('Refresh token', refresh_token);
      console.log('profile ???', profile);

      // asynchronous
      process.nextTick(function() {

        // find the user in the database based on their email
        User.findOne({'email': profile.emails[0].value }, function(err, user) {

          // if there is an error, stop everything and return that
          // ie an error connecting to the database
          if (err)
            return done(err);

          // if the user is found, then log them in
          if (user) {
            // if the found user doesn't have a facebook login saved, add facebook details
            if (!user.fb.id) {
              user.fb.id    = profile.id;
              user.fb.access_token = access_token;
              user.fb.email = profile.emails[0].value;
              user.save();
            }
            return done(null, user); // user found, return that user
          } else {
            // if there is no user found with that facebook id, create them
            var newUser = new User();

            newUser.username = profile.id; // set the users facebook id as username
            newUser.email = profile.emails[0].value;

            // set all of the facebook information in our user model
            newUser.fb.id    = profile.id; // set the users facebook id
            newUser.fb.access_token = access_token; // we will save the token that facebook provides to the user
            newUser.fb.email = profile.emails[0].value; // facebook can return multiple emails so we'll take the first

            // save our user to the database
            newUser.save(function(err) {
              if (err)
                throw err;

              // if successful, return the new user
              return done(null, newUser);
            });
          }

        });
      });

    }));

};