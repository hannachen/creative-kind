var express = require('express'),
    router = express.Router(),
    moment = require('moment'),
    mongoose = require('mongoose'),
    passport = require('passport'),
    recaptcha = require('express-recaptcha'),
    async = require('async'),
    fs = require('fs'),
    _ = require('lodash'),
    nodemailer = require('nodemailer'),
    mgTransport = require('nodemailer-mailgun-transport'),
    crypto = require('crypto'),
    User = mongoose.model('User'),
    Quilt = mongoose.model('Quilt'),
    Patch = mongoose.model('Patch'),
    hbs = require('nodemailer-express-handlebars');

var isAuthenticated = function (req, res, next) {
  // if user is authenticated in the session, call the next() to call the next request handler
  // Passport adds this method to request object. A middleware is allowed to add properties to
  // request and response objects
  if (req.isAuthenticated())
    return next();
  // if the user is not authenticated then redirect him to the login page
  res.redirect('/');
}

module.exports = function (app) {
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

router.get('/patches', isAuthenticated, function(req, res) {
  Patch
    .find({'_user': req.user.id})
    .populate('_quilt')
    .exec(function(err, patches) {
      if (err) return next(err);
      var sortedPatch = {
        'progress': [],
        'complete': []
      };

      for (var i=0; i<patches.length; i++) {
        var patch = patches[i];
        switch(patch.status) {
          case 'progress':
            sortedPatch.progress.push(patch);
            break;
          case 'complete':
            sortedPatch.complete.push(patch);
            break;
        }
      }
      res.render('pages/account/patches', {
        pageId: 'my-squares',
        title: 'My Squares',
        patches: sortedPatch
      });
    });
});

router.get('/quilts', isAuthenticated, function(req, res) {

  Quilt.find({'_user': req.user.id}, function(err, quilts) {
    if (err) return next(err);

    res.render('pages/account/quilts', {
      title: 'My Quilts',
      quilts: quilts,
      pageId: 'my-quilts'
    });
  });
});

// Login/signup routes
var loginRoutes = ['/login', '/signup'];
_.forEach(loginRoutes, function(routeName) {
  router.get(routeName, function(req, res) {
    if (req.isAuthenticated()) {
      res.redirect('/account');
    } else {
      var cb = req.query.cb,
          action = routeName.replace('/', '');
      res.render(action, {
        title: 'Creative KIND',
        pageId: action,
        returnHeader: true, // Replace user menu toggle with back link
        cb: cb
      });
    }
  });
});

router.post('/signup', function(req, res) {
  var userdata = {
    'username': req.body.username,
    'email': req.body.email
  };
  User.register(new User(userdata), req.body.password, function(err, user) {
    var cb = req.body.cb,
        failRedirect = '/signup' + cb ? '?cb=' + cb : '';
    if (err) {
      console.log('error while registering user.', err);
      req.flash('error', err.message);
      return res.redirect(failRedirect);
    }
    // log the user in after it is created
    passport.authenticate('local')(req, res, function() {
      if (cb) {
        res.redirect(cb);
      } else {
        res.redirect('/account');
      }
    });
  });
});

router.get('/recover-password', recaptcha.middleware.render, function(req, res) {
  res.render('pages/recover-password/index', {
    title: 'Forgot Password',
    captcha: req.recaptcha,
    pageId: 'forgot-password'
  });
});

router.post('/recover-password', recaptcha.middleware.verify, function(req, res, next) {

  if (!req.recaptcha.error) {
    async.waterfall([
      function(done) {
        User.findOne({ email: req.body.user.email }, 'email hash username', function(err, user) {
          if (!user || !user.hash || !user.username) {
            req.flash('error', 'No account with that email address exists.');
            return res.redirect('/account/recover-password/');
          }
          done(err, user);
        });
      },
      function(user, done) {
        var pwdHash = crypto.createHash('sha256').update(user.hash),
            oldPwd = pwdHash.digest('hex').substring(0, 15),
            queryString = 'username=' + encodeURIComponent(user.username) + '&old=' + oldPwd + '&expire=' + moment().add(1, 'week'),
            signer = crypto.createSign('RSA-SHA256');
        signer.update(queryString);
        signer.end();

        var signature = signer.sign(fs.readFileSync(req.config.private_key)),
            token = signature.toString('hex'),
            url = queryString + '&token=' + token;
        done(null, url, user);
      },
      function(url, user, done) {
        var smtpTransport = nodemailer.createTransport(mgTransport(req.config.nodemailer));
        var templateOptions = {
          viewEngine: {
            layoutsDir: req.config.root + '/app/views/email/',
            defaultLayout : 'template',
            partialsDir : req.config.root + '/app/views/partials/'
          },
          viewPath: req.config.root + '/app/views/email/'
        };
        smtpTransport.use('compile', hbs(templateOptions));
        var mailOptions = {
          to: user.email,
          from: 'passwordreset@demo.com',
          subject: 'Creative KIND Password Reset',
          'h:Reply-To': 'local@localhost',
          template: 'email.body.reset-password',
          context: {
            actionType: 'ViewAction',
            actionLabel: 'Reset Password',
            actionDesc: 'Reset your password.',
            name: user.username,
            cta : 'http://' + req.headers.host + '/account/reset/?' + url
          }
        };
        smtpTransport.sendMail(mailOptions, function(err) {
          if (err) {
            console.log(err);
          }
          if (err) return next(err);
          smtpTransport.close();
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

router.get('/reset', function(req, res) {
  var queryString = 'username=' + encodeURIComponent(req.query.username) + '&old=' + req.query.old + '&expire=' + req.query.expire,
      token = req.query.token,
      verifier = crypto.createVerify('RSA-SHA256');
  verifier.update(queryString);
  verifier.end();

  // Verify token
  console.log('expired:', parseInt(req.query.expire) < parseInt(moment().unix()));
  console.log('expires:', parseInt(req.query.expire));
  console.log('date:', parseInt(moment().unix()));

  // No good
  if (!verifier.verify(fs.readFileSync(req.config.public_key), token, 'hex') || // Verification failed
    parseInt(req.query.expire) < parseInt(moment().unix())) { // Expired

    req.flash('error', 'Password reset token expired or invalid token.');
    return res.redirect('/account/recover-password/');

  // Continue on
  } else {
    User.findOne({username: req.query.username}, function(err, user) {
      if (!user) {
        req.flash('error', 'Password reset token is invalid or has expired.');
        return res.redirect('back');
      }
      res.render('pages/recover-password/reset', {
        username: user.username
      });
    });
  }
});

router.post('/reset', function(req, res, next) {
  console.log('**REQUEST BODY**',req.body);
  console.log('username', req.body.username);

  User.findByUsername(req.body.username).then(function(user) {
    if (user) {
      user.setPassword(req.body.password, function () {
        user.save();
        req.flash('success', 'Success! Your password has been changed.');
        res.redirect('/account/');
      });
    } else {
      req.flash('error', 'Unable to update password, please reset your password again.');
      res.redirect('back');
    }
  });
});


router.get('/login', function(req, res) {
  var cb = req.query.cb;
  res.redirect('/login-signup/'+(cb?'?cb='+cb:'')+'#login');
});

router.post('/login', passport.authenticate('local'), function(req, res) {
  var cb = req.body.cb;
  if (cb) {
    res.redirect(cb);
  } else {
    res.redirect('/');
  }
});


router.get('/logout', function(req, res) {
  req.logout();
  res.redirect('/');
});


// route for facebook authentication and login
// different scopes while logging in
router.get('/login/facebook', function(req, res, next) {
  var callbackUrl = (req.query.cb) ? req.query.cb : '';
  if (callbackUrl) {
    res.cookie('redirect', callbackUrl, {maxAge : 9999});
  }
  console.log('FACEBOOK CALLBACK', callbackUrl);
  passport.authenticate('facebook', {
    scope : ['email']
  })(req, res, next);
});


// handle the callback after facebook has authenticated the user
router.get('/login/facebook/callback', function(req, res, next) {
  console.log(req.cookies.redirect);
  var callbackUrl = (req.cookies && req.cookies.redirect) ? decodeURI(req.cookies.redirect) : '/';
  // res.redirect(callbackUrl);
  passport.authenticate('facebook', {
    scope : ['email'],
    successRedirect: callbackUrl,
    failureRedirect: '/'
  })(req, res, next);
  console.log('FB CALLBACK 2', callbackUrl);
});


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
  res.redirect('/');
});
