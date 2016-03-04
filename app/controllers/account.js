var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    passport = require('passport'),
    recaptcha = require('express-recaptcha'),
    User = mongoose.model('User'),
    Quilt = mongoose.model('Quilt');

var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/');
}

module.exports = function (app, config) {
  app.use('/account', router);
};

router.get('/', isAuthenticated, function (req, res, next) {
  Quilt.find({'_user': req.user.id}, function(err, quilts) {
    if (err) return next(err);
    res.render('account', {
      title: 'Account',
      user: req.user,
      quilts: quilts
    });
  });
});


router.get('/register', function(req, res) {
  res.redirect('/login-signup/#signup');
});

router.post('/register', function(req, res, next) {
  console.log('registering user');
  var userdata = {
    'username': req.body.user.username,
    'email': req.body.user.email
  };
  User.register(new User(userdata), req.body.user.password, function(err) {
    if (err) {
      console.log('error while user register!', err);
      return next(err);
    }

    console.log('user registered!');

    res.redirect('/account');
  });
});



router.get('/recover-password', recaptcha.middleware.render, function(req, res) {
  res.render('pages/recover-password/index', { captcha:req.recaptcha });
});

router.post('/recover-password', recaptcha.middleware.verify, function(req, res) {
  console.log(req.body.user.email);
  if (!req.recaptcha.error) {
    console.log('captcha success');
    res.render('pages/recover-password/confirm');
  } else {
    console.log('captcha error');
    res.render('pages/recover-password/index', { captcha: recaptcha.render() });
  }
});



router.get('/login', function(req, res) {
  res.redirect('/login-signup/#login');
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  res.redirect('/account/');
});


router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


// route for facebook authentication and login
// different scopes while logging in
router.get('/login/facebook',
  passport.authenticate('facebook', { scope : 'email' }
));

// handle the callback after facebook has authenticated the user
router.get('/login/facebook/callback',
  passport.authenticate('facebook', {
    successRedirect : '/account/',
    failureRedirect : '/'
  })
);


// route for twitter authentication and login
// different scopes while logging in
router.get('/login/twitter',
  passport.authenticate('twitter'));

// handle the callback after facebook has authenticated the user
router.get('/login/twitter/callback',
  passport.authenticate('twitter', {
    successRedirect : '/account/twitter',
    failureRedirect : '/'
  })
);

/* GET Twitter View Page */
router.get('/twitter', isAuthenticated, function(req, res) {
  res.render('account', { user: req.user });
});