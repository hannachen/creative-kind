var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Quilt = mongoose.model('Quilt'),
    Patch = mongoose.model('Patch');

var _ = require('lodash'),
    uuid = require('node-uuid');

var totalPatch = 41;

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

router.get('/view/:id*', function (req, res, next) {
  Quilt.findOne({'_id':req.params.id})
    .populate('_user')
    .exec(function (err, quilt) {
      if (err) return next(err);
      Patch.find({'_quilt': quilt.id}, function(err, patches) {
        if (err) return next(err);
        var simplePatchData = new Array();
        _.forEach(patches, function(patch) {
          if (patch._user && req.user &&
              String(req.user.id) === String(patch._user) &&
              patch.status === 'progress') {
            patch.status = 'mine';
          }
          var simplePatch = {
            uid: patch.uid,
            status: patch.status
          };
          simplePatchData.push(simplePatch);
        });
        res.render('pages/quilts/view', {
          title: 'View Quilt',
          quilt: quilt,
          quiltData: JSON.stringify(simplePatchData),
          userData: JSON.stringify(req.user),
          patches: patches
        });
      });
    });
});


router.get('/create', isAuthenticated, function (req, res, next) {
  res.render('pages/quilts/create', {
    title: 'Create a quilt'
  });
});

router.post('/create', isAuthenticated, function (req, res, next) {
  console.log('creating quilt');
  var quiltData = {
    '_user': req.user.id,
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
      res.redirect('/account');
    }
  });
});