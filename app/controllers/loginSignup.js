var express = require('express'),
    router = express.Router();

module.exports = function (app) {
  app.use('/', router);
};

router.get('/login-signup', function (req, res, next) {
  if (req.isAuthenticated()) {
    res.redirect('/account');
  } else {
    var cb = req.query.cb;
    res.render('login-signup', {
      title: 'Creative KIND',
      pageId: 'login-signup',
      cb: cb
    });
  }
});
