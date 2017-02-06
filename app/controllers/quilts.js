var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Invite = mongoose.model('Invite'),
    Quilt = mongoose.model('Quilt'),
    Patch = mongoose.model('Patch'),
    Theme = mongoose.model('Theme'),
    Color = mongoose.model('Color');

var _ = require('lodash'),
    fs = require('fs'),
    uuid = require('uuid'),
    crypto = require('crypto'),
    nodemailer = require('nodemailer'),
    mgTransport = require('nodemailer-mailgun-transport'),
    smtpTransport = require('nodemailer-smtp-transport'),
    hbs = require('nodemailer-express-handlebars');

var totalPatch = 25;

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
  app.use('/quilts', router);
};

router.get('/', function (req, res, next) {
  Quilt.find({}, function (err, quilts) {
    if (err) return next(err);
    res.render('pages/quilts/list', {
      title: 'Quilts',
      quilts: quilts
    });
  });
});

router.delete('/:id', isAuthenticated, function (req, res) {
  var query = {'_id':req.params.id};
  // Non admin users can only delete their own quilts
  if (!req.user.isAdmin) {
    query._user = req._user;
  }
  Quilt.findByIdAndRemove(query)
    .exec(function (err, removed) {
      if (err) {
        res.sendStatus(400);
      } else {
        Patch.find({ _quilt: removed })
          .exec(function(err, patches) {
            if (err) {
              res.sendStatus(400);
            } else {
              _.forEach(patches, function (patch) {
                patch.remove();
              });
              res.sendStatus(204);
            }
          });
      }
    });
});

router.get('/view/:id/:patchid?', function (req, res, next) {
  Quilt
    .findOne({'_id':req.params.id})
    .populate('_user')
    .populate('_theme')
    .deepPopulate('_theme.colors')
    .exec(function (err, quilt) {
      if (err) return next(err);
      if (!quilt) {
        return res.redirect('/');
      }
      Theme.find({})
        .populate('colors')
        .exec(function (err, themes) {
          if (err) return next(err);
          if (themes.length) {
            themes[0]['active'] = 'active';
          }
          Patch.find({'_quilt': quilt.id}, null, {sort: {'_id': -1}}, function(err, patches) {
            if (err) return next(err);
            var simplePatchData = new Array();
            _.forEach(patches, function(patch) {
              if (patch._user && req.user &&
                String(req.user.id) === String(patch._user) &&
                patch.status === 'progress') {
                patch.status = 'mine';
              }
              // Make sure the upcoming patch is new
              if (patch.uid === req.params.patchid && patch.status !== 'new') {
                req.params.patchid = '';
              }
              var simplePatch = {
                uid: patch.uid,
                status: patch.status
              };
              simplePatchData.push(simplePatch);
            });
            var showPatchActions = req.session['showPatchActions'];
            req.session['showPatchActions'] = null;
            res.render('pages/quilts/view', {
              pageId: 'view-quilt',
              title: 'View Quilt',
              quilt: quilt,
              quiltData: JSON.stringify(simplePatchData),
              patches: patches,
              themes: themes,
              newPatch: req.params.patchid,
              showActions: showPatchActions
            });
          });
        });
    });
});

/**
 * Update the theme of a quilt. AJAX.
 */
router.post('/update/:id/theme/', isAuthenticated, function (req, res, next) {
  var query = {'_id':req.params.id},
      update = { $set: {'_theme':req.body.theme}};
  console.log(req.body);
  Quilt.update(query, update, function(err, quilt) {
    console.log('UPDATED QUILT***', quilt);
    if (err) {
      res.sendStatus(400);
    } else {
      var data = {};
      res.sendStatus(200);
      // res.send(data);
    }
  });
});

router.post('/rename/:id', isAuthenticated, function (req, res) {
  console.log('renaming quilt');
  var query = {'_id':req.params.id},
      update = {'title':req.body.title},
      options = {'muti': false};
  Quilt.update(query, update, options, function(err) {
    if (err) {
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});

router.get('/create', isAuthenticated, function (req, res, next) {
  Theme.find({})
    .populate('colors')
    .exec(function (err, themes) {
      if (err) return next(err);
      if (themes.length) {
        themes[0]['active'] = 'active';
      }
      res.render('pages/quilts/create', {
        title: 'Create your own',
        themes: themes
      });
    });
});

router.post('/create', isAuthenticated, function (req, res, next) {
  var quiltData = {
    '_user': req.user.id,
    '_theme': req.body.theme,
    'title': req.body.title,
    'type': req.body.type
  };
  // create a new quilt
  var newQuilt = new Quilt(quiltData);
  newQuilt.save(function(err, quilt) {
    if (err) throw err;
    console.log('Quilt saved successfully!');
    if (quilt) { // Add patches
      for (var i=0; i<totalPatch; i++) {
        var patchData = {
          'uid': uuid.v1(),
          '_quilt': quilt.id,
          '_user': null,
          'colors': [],
          'status': 'new',
          'theme': ''
        };
        var patch = new Patch(patchData);
        patch.save(function(err) {
          if (err) throw err;
          console.log('patch saved.');
        });
      }

      // Handle invites
      var emails = req.body.invites ? req.body.invites.split(',') : {};
      if (emails.length) {
        sendInvitation(req, quilt, emails, function() {
          res.json({ quiltId: quilt.id });
        });
      }
    } else {
      req.flash('info', 'Quilt created!');
      res.json({ quiltId: quilt.id });
    }
  });
});

function sendInvitation(req, quilt, emails, cb) {

  var invitesVariables = {};
  _.forEach(emails, function (invite) {
    var key = uuid.v1(),
      inviteData = {
        '_quilt': quilt.id,
        'sender': req.user,
        'email': invite.trim(),
        'key': key
      };
    invitesVariables[inviteData.email] = {
      'cta': 'http://' + req.headers.host + '/quilts/invite/' + key
    };
    User.findOne({email: invite})
      .exec(function (err, user) {
        if (user) {
          inviteData.recipient = user;
        }
        console.log('INVITE DATA---', inviteData);
        var newInvite = new Invite(inviteData);
        newInvite.save(function (err, invite) {
          console.log('SAVED**', invite);
        });
      });
  });

  var transport = req.config.nodemailer.service === 'Smtp' ? smtpTransport(req.config.nodemailer) : mgTransport(req.config.nodemailer);
  var mailTransport = nodemailer.createTransport(transport);
  var templateOptions = {
    viewEngine: {
      layoutsDir: req.config.root + '/app/views/email/',
      defaultLayout : 'template',
      partialsDir : req.config.root + '/app/views/partials/'
    },
    viewPath: req.config.root + '/app/views/email/'
  };
  mailTransport.use('compile', hbs(templateOptions));
  var mailOptions = {
    to: emails,
    from: 'invite@creative-kind.com',
    subject: 'You\'ve been invited',
    'h:Reply-To': 'local@localhost',
    template: 'email.body.invite',
    'recipient-variables': invitesVariables,
    'X-Mailgun-Recipient-Variables': invitesVariables,
    context: {
      name: req.user.username,
      message: req.body.message
    }
  };
  mailTransport.sendMail(mailOptions, function(err) {
    if (err) {
      console.log(err);
    }
    if (err) return next(err);
    mailTransport.close();
    req.flash('info', 'Invitations sent!');
    // res.json({ postData: quiltData });
    // res.json({ quiltId: quilt.id });
    cb.call();
  });
}

router.get('/invite/:id', function(req, res) {
  console.log('INVITE-- ', req.params);
  Invite.findOne({'key':req.params.id})
    .populate('_quilt')
    .populate('sender')
    .deepPopulate('_quilt._user')
    .exec(function (err, invite) {
      if (err) throw err;
      console.log('INVITE***', invite);
      Patch.find({'_quilt': invite._quilt.id}, null, {sort: {'_id': -1}}, function(err, patches) {
        if (err) return next(err);
        var simplePatchData = new Array();
        _.forEach(patches, function(patch) {
          if (patch._user && req.user &&
            String(req.user.id) === String(patch._user) &&
            patch.status === 'progress') {
            patch.status = 'mine';
          }
          // Make sure the upcoming patch is new
          if (patch.uid === req.params.patchid && patch.status !== 'new') {
            req.params.patchid = '';
          }
          var simplePatch = {
            uid: patch.uid,
            status: patch.status
          };
          simplePatchData.push(simplePatch);
        });
        res.render('pages/quilts/view', {
          pageId: 'join-quilt',
          title: 'Join Quilt',
          sender: invite.sender,
          quilt: invite._quilt,
          quiltData: JSON.stringify(simplePatchData),
          patches: patches
        });
      });
    });
});

router.post('/invite/:id', isAuthenticated, function (req, res, next) {
  Quilt
    .findOne({'_id':req.params.id})
    .exec(function (err, quilt) {
      if (err) return next(err);
      if (!quilt) {
        return res.redirect('/');
      }
      var emails = req.body.invites ? req.body.invites.split(',') : {};
      if (emails.length) {
        sendInvitation(req, quilt, emails, function() {
          return res.redirect('/quilts/view/'+quilt.id);
        });
      } else {
        return res.redirect('/');
      }
    });
});

router.get('/invitee', function(req, res) {
  console.log('INVITE-- ', req.query);
  var queryString = 'email=' + encodeURIComponent(req.query.email) + '&quilt=' + req.query.quilt,
      token = req.query.token,
      verifier = crypto.createVerify('RSA-SHA256'),
      pub = fs.readFileSync(req.config.public_key).toString();
  console.log('INCOMING** ', queryString);
  verifier.update(queryString);

  // Verify token
  // No good
  if (!verifier.verify(pub, token, 'hex')) { // Verification failed
    req.flash('error', 'Invalid token.');
    return res.redirect('/');

    // Continue on
  } else {

    User.findOne({email: req.body.email}, function(err, user) {
      if (!user) {
        return res.redirect('/signup');
      }
      Quilt.findOne({'_id':req.params.id})
        .populate('_theme')
        .deepPopulate('_theme.colors')
        .exec(function (err, quilt) {
          if (err) return next(err);
          Theme.find({})
            .populate('colors')
            .exec(function (err, themes) {
              if (err) return next(err);
              if (themes.length) {
                themes[0]['active'] = 'active';
              }
              Patch.find({'_quilt': quilt.id}, null, {sort: {'_id': -1}}, function(err, patches) {
                if (err) return next(err);
                var simplePatchData = new Array();
                _.forEach(patches, function(patch) {
                  if (patch._user && req.user &&
                    String(req.user.id) === String(patch._user) &&
                    patch.status === 'progress') {
                    patch.status = 'mine';
                  }
                  // Make sure the upcoming patch is new
                  if (patch.uid === req.params.patchid && patch.status !== 'new') {
                    req.params.patchid = '';
                  }
                  var simplePatch = {
                    uid: patch.uid,
                    status: patch.status
                  };
                  simplePatchData.push(simplePatch);
                });
                res.render('pages/quilts/view', {
                  pageId: 'join-quilt',
                  title: 'Join Quilt',
                  quilt: quilt,
                  quiltData: JSON.stringify(simplePatchData),
                  patches: patches
                });
              });
            });
        });
    });
  }
});

function onInsert(err, docs) {
  if (err) {
    throw err;
  } else {
    console.info('%d potatoes were successfully stored.', docs.length);
  }
}