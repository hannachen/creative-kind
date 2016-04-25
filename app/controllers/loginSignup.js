var express = require('express'),
    router = express.Router();

module.exports = function (app) {
  app.use('/', router);
};

router.get('/login-signup', function (req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/account');
  } else {
    res.render('login-signup', {
      title: 'Quilting Bee'
    });
  }
});
