var facebook = require('./facebook');
    twitter = require('./twitter'),
    mongoose = require('mongoose'),
    User = mongoose.model('User'),
    LocalStrategy = require('passport-local').Strategy;

module.exports = function(passport) {

  // use static authenticate method of model in LocalStrategy
  passport.use(User.createStrategy());

  // use static serialize and deserialize of model for passport session support
  passport.serializeUser(User.serializeUser());
  passport.deserializeUser(User.deserializeUser());

  // Setting up Passport Strategies for Facebook and Twitter
  facebook(passport);
  twitter(passport);
}
