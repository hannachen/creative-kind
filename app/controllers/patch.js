var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
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

var isMine = function (req, res, patch) {
  if (patch._user && req.user &&
    String(req.user.id) === String(patch._user) ||
    req.user.isAdmin) {
    return true;
  } else {
    res.redirect('/quilts/view/'+patch._quilt);
  }
}

module.exports = function (app) {
  app.use('/patch', router);
};

router.get('/', function (req, res, next) {
  Quilt.find({}, function (err, quilts) {
    if (err) return next(err);
    res.render('pages/patch/list', {
      title: 'Patch',
      quilts: quilts
    });
  });
});

router.get('/view/:uid*', function (req, res, next) {
  Patch.findOne({'uid':req.params.uid })
    .populate('_user')
    .populate('_quilt')
    .exec(function (err, patch) {
      if (err) return next(err);
      console.log('EDIT PATCH');
      if (patch._user) {
        res.render('pages/patch/view', {
          title: 'View Patch',
          patch: patch
        });
      } else {
        res.redirect('/quilts/view/'+patch._quilt.id);
      }
    });
});

router.get('/json/:uid*', function (req, res, next) {
  console.log(req.params.uid);
  Patch.findOne({'uid':req.params.uid })
    .populate('_user')
    .populate('_quilt')
    .exec(function (err, patch) {
      if (err) return next(err);
      console.log('PATCH DATA JSON', patch);
      // Make sure this patch has been initialized by checking for an owner
      if (patch && patch._user) {
        res.json({ patch: patch });
      } else {
        res.sendStatus(400);
      }
    });
});

router.get('/edit/:uid*', isAuthenticated, function (req, res, next) {
  Patch.findOne({'uid':req.params.uid })
    .populate('_quilt')
    .deepPopulate('_quilt._theme.colors')
    .exec(function (err, patch) {
      if (err) return next(err);
      if (patch.status === 'complete' && !req.user.isAdmin) {
        res.redirect('/quilts/view/'+patch._quilt);
        return;
      }
      if (patch && patch._user) {
        if (String(req.user.id) === String(patch._user) || req.user.isAdmin) {
          res.render('pages/patch/edit', {
            title: 'Edit Patch',
            patch: patch
          });
        } else {
          res.redirect('/quilts/view/'+patch._quilt);
          return;
        }
      } else {

        res.render('pages/patch/start', {
          title: 'Start Patch',
          patch: patch,
          theme: patch._quilt._theme
        });
      }
    });
});

router.post('/save/:uid/:status?', isAuthenticated, function (req, res, next) {
  var patchData = req.body.patchData;
  Patch.findOne({'uid':req.params.uid })
    .exec(function (err, patch) {
      if (err) return next(err);
      if (isMine(req, res, patch) || req.user.isAdmin) {
        console.log('COLORSET', patchData.colorSet);
        patch.colors = patchData.colors;
        patch.colorIndex = patchData.colorIndexData;
        patch.colorSet = patchData.colorSet;
        patch.status = req.params.status || 'progress';
        patch.save(function(err) {
          if (err) return next(err);
          console.log('STATUS', patch.status);
          var url = '/';
          switch(patch.status) {
            case 'progress':
              req.flash('success', 'Patch saved, see you soon.');
              url = '/patch/edit/'+patch.uid;
              break;
            case 'complete':
              req.flash('success', 'Patch complete, thank you.');
              url = '/quilts/view/'+patch._quilt;
              break;
          }
          console.log('URL', url);
          res.json({ url: url });
        });
      }
    });
});

router.post('/start/:uid*', isAuthenticated, function (req, res, next) {
  Patch.findOne({'uid':req.params.uid })
    .exec(function (err, patch) {
      if (err) return next(err);
      if (patch._user === null) {
        patch._user = req.user.id;
        patch.status = 'progress';
        patch.save(function(err) {
          if (err) throw err;
          console.log('patch saved.');
          res.redirect('/patch/edit/'+patch.uid);
        });
      } else {
        res.redirect('/quilts/view/'+patch._quilt.id);
      }
    });
});


router.get('/svg/:uid', function (req, res, next) {
  res.setHeader('content-type', 'image/svg+xml; charset=utf-8');
  Patch.findOne({'uid':req.params.uid })
    .exec(function (err, patch) {
      if (err) return next(err);
      var colors = [],
          colorArray = patch.colors.split(',');
      if (colorArray.length) {
        colors = colorArray;
      } else {
        for (var i=0; i<200; i++) {
          colors.push('#828282');
        }
      }
      res.render('partials/svg/patch', {
        title: 'View Patch',
        layout: 'svg',
        lines: false,
        patch: patch,
        colors: colors
      });
    });
});

router.get('/dev-static', function (req, res, next) {
  Quilt.find({}, function (err, quilts) {
    if (err) return next(err);
    res.render('pages/patch/edit', {
      title: 'Patch'
    });
  });
});