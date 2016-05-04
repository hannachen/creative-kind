var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    passport = require('passport'),
    recaptcha = require('express-recaptcha'),
    async = require('async'),
    nodemailer = require('nodemailer'),
    sgTransport = require('nodemailer-sendgrid-transport'),
    crypto = require('crypto'),
    User = mongoose.model('User'),
    Quilt = mongoose.model('Quilt'),
    Patch = mongoose.model('Patch');

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
    
    Patch
      .find({'_user': req.user.id})
      .populate('_quilt')
      .exec(function(err, patches) {
        if (err) return next(err);
        res.render('account', {
          title: 'Account',
          quilts: quilts,
          patches: patches
        });
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

router.post('/recover-password', recaptcha.middleware.verify, function(req, res, next, config) {
  console.log(req.body.user.email);
  if (!req.recaptcha.error) {
    console.log('captcha success');
    async.waterfall([
      function(done) {
        crypto.randomBytes(20, function(err, buf) {
          var token = buf.toString('hex');
          done(err, token);
        });
      },
      function(token, done) {
        User.findOne({ email: req.body.user.email }, function(err, user) {
          if (!user) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/account/recover-password/');
          }

          user.resetPasswordToken = token;
          user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

          user.save(function(err) {
            done(err, token, user);
          });
        });
      },
      function(token, user, done) {
        var smtpTransport = nodemailer.createTransport(sgTransport(config.nodemailer));
        var mailOptions = {
          to: user.email,
          from: 'passwordreset@demo.com',
          subject: 'Quilting Bee Password Reset',
          text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/account/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
          done(err, 'done');
        });
      }
    ], function(err) {
      if (err) return next(err);
      res.redirect('/account/recover-password/');
    });
    // res.render('pages/recover-password/confirm');
  } else {
    console.log('captcha error');
    res.render('pages/recover-password/index', { captcha: recaptcha.render() });
  }
});

router.get('/reset/:token', function(req, res) {
  User.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() }
    }, function(err, user) {
    if (!user) {
      req.flash('error', 'Password reset token is invalid or has expired.');
      return res.redirect('/account/recover-password/');
    }
    res.render('pages/recover-password/reset', {
      user: req.user
    });
  });
});

router.post('/reset/:token', function(req, res, config) {
  async.waterfall([
    function(done) {
      User.findOne({
          resetPasswordToken: req.params.token,
          resetPasswordExpires: { $gt: Date.now() }
        }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }

        user.password = req.body.password;
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;

        user.save(function(err) {
          req.logIn(user, function(err) {
            done(err, user);
          });
        });
      });
    },
    function(user, done) {
      var smtpTransport = nodemailer.createTransport(sgTransport(config.nodemailer));
      var mailOptions = {
        to: user.email,
        from: 'passwordreset@demo.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
        'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
    res.redirect('/');
  });
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
  res.render('account');
});