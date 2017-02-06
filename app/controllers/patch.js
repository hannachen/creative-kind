var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Quilt = mongoose.model('Quilt'),
    Patch = mongoose.model('Patch'),
    async = require('async'),
    fs = require('fs'),
    gm = require('gm');

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
          patch: patch,
          pageId: 'view-patch'
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
            patch: patch,
            pageId: 'edit-patch'
          });
        } else {
          res.redirect('/quilts/view/'+patch._quilt);
          return;
        }
      } else {

        res.render('pages/patch/start', {
          title: 'Start Patch',
          patch: patch,
          theme: patch._quilt._theme,
          pageId: 'edit-patch'
        });
      }
    });
});

router.post('/save/:uid/:status?', isAuthenticated, function (req, res, next) {
  var patchData = req.body.patchData;
  Patch.findOne({'uid':req.params.uid })
    .populate('_quilt')
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
          switch(patch.status) {
            case 'progress':
              req.flash('success', 'Saved. See you soon!');
              break;
            case 'complete':
              req.session['showPatchActions'] = patch.uid;
              req.flash('success', 'Thanks for contributing!');
              break;
          }
          var url = '/quilts/view/'+patch._quilt.id;
          if (patch.status === 'complete') {
            var filename = patch.uid + '.png',
                filePath = req.config.root + '/public/patches/' + filename;
            savePatchAsPng(patch, filePath, res, next, function() {
              res.json({ url: url });
            });
          } else {
            res.json({ url: url });
          }
        });
      }
    });
});

router.get('/start/:uid*', isAuthenticated, function (req, res, next) {
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

router.get('/download/:uid/:type?', function (req, res, next) {
  var allowedTypes = ['png']; // Only allow PNG for now
  if (allowedTypes.indexOf(req.params.type) < 0) {
    req.params.type = 'png'; // Default to PNG
  }
  async.waterfall([
    function(callback) {

      Patch.findOne({'uid':req.params.uid })
        .exec(function (err, patch) {
          if (err) return next(err);
          callback(null, patch);
          // switch(req.params.type) {
          //   case 'png':
          //   default:
          // }
        });
    },
    function(patch, callback) {
      var filename = patch.uid + '.' + req.params.type,
          filePath = req.config.root + '/public/patches/' + filename;
      var file = {
        name: filename,
        path: filePath
      };

      // Check if file exists
      fs.access(filePath, function(err) {

        // File doesn't exist, create png
        if (err && err.code === 'ENOENT') {
          savePatchAsPng(patch, filePath, res, next, function() {
            callback(null, file);
          });
        } else {
          callback(null, file);
        }
      });
    }
  ], function (err, file) {

    // res.setHeader('content-type', 'image/png; charset=utf-8');
    if (file && Object.keys(file).length) {
      console.log('FILE***', file);
      // Force download if incoming action is download
      res.setHeader('Content-disposition', 'attachment; filename=' + file.name);
      res.sendFile(file.path);
    } else {
      res.sendStatus(404);
    }
  });
});

function savePatchAsPng(patch, filePath, res, next, cb) {
  Quilt
    .findOne({'_id':patch._quilt})
    .populate('_theme')
    .deepPopulate('_theme.colors')
    .exec(function (err, quilt) {
      if (err) return next(err);
      var themeSets = quilt._theme.colors,
        colorSetIndex = parseInt(patch.colorSet),
        patchColors = themeSets[colorSetIndex].colors,
        colorArray = patch.colorIndex.split(','),
        colors = [];
      if (colorArray.length) {
        colors = colorArray.map(function(colorIndex) {
          return '#' + patchColors[colorIndex];
        });
      }

      // Render and get svg as string
      res.render('partials/svg/patch', {
        layout: 'svg',
        lines: false,
        colors: colors
      }, function(err, svg) {

        // Convert svg to png and save to path
        var buf = new Buffer(svg);
        gm(buf, 'patch.svg')
          .resize(1000, 1000)
          .write(filePath, function (err) {
            if (err) {
              console.log('GM error', err);
              return next(err);
            } else {
              cb.call();
            }
          });
      });
    });
}

router.get('/svg/:uid', function (req, res, next) {
  Patch.findOne({'uid':req.params.uid })
    .populate('_quilt')
    .deepPopulate('_quilt._theme.colors')
    .exec(function (err, patch) {
      if (err) return next(err);
      var themeSets = patch._quilt._theme.colors,
          colorSetIndex = parseInt(patch.colorSet),
          patchColors = themeSets[colorSetIndex].colors,
          colorArray = patch.colorIndex.split(','),
          colors = [];
      if (colorArray.length) {
        colors = colorArray.map(function(colorIndex) {
          return '#' + patchColors[colorIndex];
        });
      } else {
        for (var i=0; i<200; i++) {
          colors.push('#828282');
        }
      }
      res.setHeader('content-type', 'image/svg+xml; charset=utf-8');
      res.render('partials/svg/patch', {
        layout: 'svg',
        lines: false,
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