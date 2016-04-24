var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Color = mongoose.model('Color'),
    Theme = mongoose.model('Theme');

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
  app.use('/qb-admin', router);
};

router.get('/', isAuthenticated, function (req, res, next) {
  Theme.find({}, function (err, themes) {
    if (err) return next(err);
    res.render('pages/admin/index', {
      title: 'Admin Home',
      themes: themes
    });
  });
});

router.get('/color/create', isAuthenticated, function (req, res, next) {
  res.render('pages/admin/color-create', {
    title: 'Create Colour Set'
  });
});

router.post('/color/create', isAuthenticated, function (req, res, next) {
  console.log('creating color');
  var colorData = {
    'name': req.body.name,
    'colors': req.body.color
  };
  // create a new color set
  var newColor = new Color(colorData);
  newColor.save(function(err, color) {
    if (err) throw err;
    console.log('Color set saved successfully!');
    res.redirect('/qb-admin/color/create');
  });
});