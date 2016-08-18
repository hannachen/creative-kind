var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Quilt = mongoose.model('Quilt'),
    Patch = mongoose.model('Patch');

var _ = require('lodash');

module.exports = function (app) {
  app.use('/', router);
};

router.get('/', function (req, res, next) {
  console.log('INDEX');

  Quilt.find({'type': 'public'})
    .populate('_theme')
    .deepPopulate('_theme.colors')
    .exec(function (err, quilts) {
      if (err) return next(err);

      _.forEach(quilts, function(quilt) {
        Patch.find({'_quilt': quilt.id}, function(err, patches) {
          if (err) return next(err);
          _.forEach(patches, function(patch) {
            if (patch._user && req.user &&
              String(req.user.id) === String(patch._user) &&
              patch.status === 'progress') {
              patch.status = 'mine';
            }
          });
          quilt.patchData = JSON.stringify(patches);
        });
      });

      res.render('index', {
        title: 'Quilting Bee',
        quilts: quilts
      });
    });
});
