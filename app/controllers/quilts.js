var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Invite = mongoose.model('Invite'),
    Quilt = mongoose.model('Quilt'),
    Patch = mongoose.model('Patch'),
    Theme = mongoose.model('Theme'),
    Color = mongoose.model('Color');

var _ = require('lodash'),
    uuid = require('node-uuid')
    nodemailer = require('nodemailer'),
    mgTransport = require('nodemailer-mailgun-transport'),
    smtpTransport = require('nodemailer-smtp-transport'),
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

router.get('/view/:id/:patchid?', function (req, res, next) {
  Quilt.findOne({'_id':req.params.id})
    .populate('_user')
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
          Patch.find({'_quilt': quilt.id}, function(err, patches) {
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
              pageId: 'view-quilt',
              title: 'View Quilt',
              quilt: quilt,
              quiltData: JSON.stringify(simplePatchData),
              patches: patches,
              themes: themes,
              newPatch: req.params.patchid,
              expressFlash: req.flash('message')
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
      update = {'_theme':req.body.theme},
      options = {'muti': false};
  console.log(req.body);
  Quilt.update(query, update, options, function(err, quilt) {
    if (err) {
      res.sendStatus(400);
    } else {
      var data = {};
      res.sendStatus(200);
      // res.send(data);
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

function onInsert(err, docs) {
  if (err) {
    if (err) throw err;
  } else {
    console.info('%d potatoes were successfully stored.', docs.length);
  }
}

router.post('/create', isAuthenticated, function (req, res, next) {
  var quiltData = {
    '_user': req.user.id,
    '_theme': req.body.theme,
    'title': req.body.title,
    'type': req.body.type
  };
  // create a new quilt
  console.log('creating quilt');
  // if (invites.length) {
  //   var inviteData = invites.map(function(inputData) {
  //         var returnData = {
  //           '_user': req.user,
  //           '_quilt': '123',
  //           'recipient': inputData
  //         };
  //         return returnData;
  //       });
  //   console.log('RETURN DATA ---', returnData);
  //   Invite.insertMany(inviteData)
  //     .then(function(docs) {
  //       // do something with docs
  //       console.log('DOCS**', docs);
  //     })
  //     .catch(function(err) {
  //       // error handling here
  //       if (err) throw err;
  //     });
  // }

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
      var invites = req.body.invites ? req.body.invites.split(',') : {};
      if (invites.length) {
        var inviteData = {
          '_user': req.user,
          '_quilt': '571edd9fe84b406c7b2b4814'
        };
        _.forEach(invites, function (invite) {
          inviteData.recipient = invite.trim();
          var newInvite = new Invite(inviteData);
          newInvite.save(function (err, invite) {
            console.log('SAVED**', invite);
            // if (err) throw err;
          });
        });
      }
      var invitesVariables = {};
      if (inviteData) {
        var emails = inviteData.split(',');
        _.forEach(emails, function(email) {
          email = email.trim();
          invitesVariables[email]  = { 'testString': '123' };
        });
      }
      var transport = req.config.nodemailer.service === 'Smtp' ? smtpTransport(req.config.nodemailer) : mgTransport(req.config.nodemailer);
      var mailTransport = nodemailer.createTransport(transport);
      var templateOptions = {
        viewEngine: {
          layoutsDir: 'app/views/email/',
          defaultLayout : 'template',
          partialsDir : 'app/views/partials/'
        },
        viewPath: 'app/views/email/'
      };
      mailTransport.use('compile', hbs(templateOptions));
      var mailOptions = {
        to: emails,
        from: 'invite@quilting-bee.com',
        subject: 'You\'ve been invited',
        'h:Reply-To': 'local@localhost',
        template: 'email.body.invite',
        'recipient-variables': invitesVariables,
        'X-Mailgun-Recipient-Variables': invitesVariables,
        context: {
          name: req.user.username,
          message: req.body.message,
          cta : 'http://' + req.headers.host + '/signup/?'
        }
      };
      mailTransport.sendMail(mailOptions, function(err) {
        if (err) {
          console.log(err);
        }
        if (err) return next(err);
        mailTransport.close();
        req.flash('info', 'Invitations sent to: ' + quiltData.invites + '.');
        // res.redirect('/account');
        res.json({ postData: quiltData });
      });
    }
  });
  res.json({ postData: 'asdf' });
});

router.post('/rename/:id', isAuthenticated, function (req, res, next) {
  console.log('renaming quilt');
  var query = {'_id':req.params.id},
      update = {'title':req.body.title},
      options = {'muti': false};
  Quilt.update(query, update, options, function(err, quilt) {
    if (err) {
      res.sendStatus(400);
    } else {
      res.sendStatus(200);
    }
  });
});