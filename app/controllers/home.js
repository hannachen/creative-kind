var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Quilt = mongoose.model('Quilt');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  console.log('INDEX');

  Quilt.find({}, function (err, quilts) {
    if (err) return next(err);
    res.render('index', {
      title: 'Quilting Bee',
      quilts: quilts
    });
  });
});
