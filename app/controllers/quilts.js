var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
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
      console.log('ID?? ', req.param('id'));
      console.log(quilt);
      if (err) return next(err);
      res.render('pages/quilts/view', {
        title: 'View Quilt',
        quilt: quilt
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
  console.log(quiltData);
  // create a new quilt
  var newQuilt = new Quilt(quiltData);
  newQuilt.save(function(err) {
    if (err) throw err;
    console.log('Quilt saved successfully!');
    res.redirect('/account');
  });
});