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
    String(req.user.id) === String(patch._user)) {
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
      console.log('ID?? ', req.params.uid);
      console.log(patch);
      if (err) return next(err);
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

router.get('/edit/:uid*', isAuthenticated, function (req, res, next) {
  Patch.findOne({'uid':req.params.uid })
    .exec(function (err, patch) {
      console.log('ID?? ', req.params.uid);
      console.log(patch);
      if (err) return next(err);
      if (patch && patch._user) {
        console.log("PATCH USER???????:", patch._user);
        console.log("USER???????:", req.user._id);
        if (String(req.user.id) === String(patch._user)) {
          res.render('pages/patch/edit', {
            title: 'Edit Patch',
            patch: patch
          });
        } else {
          res.redirect('/quilts/view/'+patch._quilt);
        }
      } else {
        res.render('pages/patch/start', {
          title: 'Start Patch',
          patch: patch
        });
      }
    });
});

router.post('/edit/:uid*', isAuthenticated, function (req, res, next) {
  var patchData = req.params.patchData;
  Patch.findOne({'uid':req.params.uid })
    .exec(function (err, patch) {
      if (err) return next(err);
      if (isMine(req, res, patch)) {
        //patch.status = 'complete';
        patch.save(function(err) {
          if (err) throw err;
          res.redirect('/quilts/view/'+patch._quilt);
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