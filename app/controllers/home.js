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

  Quilt.find()
    .exec(function (err, quilts) {
      if (err) return next(err);

      _.forEach(quilts, function(quilt) {
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
          quilt.quiltData = JSON.stringify(simplePatchData);
        });
      });

      res.render('index', {
        title: 'Quilting Bee',
        quilts: quilts
      });
    });
});
