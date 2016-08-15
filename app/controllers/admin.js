var express = require('express'),
    router = express.Router(),
    mongoose = require('mongoose'),
    Quilt = mongoose.model('Quilt'),
    Color = mongoose.model('Color'),
    Theme = mongoose.model('Theme'),
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

module.exports = function (app) {
  app.use('/qb-admin', router);
};

router.get('/', isAuthenticated, function (req, res, next) {

  Theme.find({})
    .populate('colors')
    .exec(function (err, themes) {
      if (err) return next(err);

      Color
        .find({})
        .exec(function(err, colors) {
          if (err) return next(err);
          res.render('pages/admin/index', {
            layout: 'admin',
            title: 'Admin Home',
            themes: themes,
            colors: colors
          });
        });
    });
});

router.get('/patches/view', isAuthenticated, function (req, res, next) {
  Patch
    .find({ status: { $in: ['complete', 'progress'] }, colors: {$exists: true} })
    .populate('_quilt')
    .exec(function(err, patches) {
      if (err) return next(err);
      console.log(patches);
      res.render('pages/admin/patches-view', {
        layout: 'admin',
        title: 'Patches',
        patches: patches
      });
    });
});

router.get('/quilts/view', isAuthenticated, function (req, res, next) {
  Quilt.find({})
    .exec(function(err, quilts) {
      if (err) return next(err);
      res.render('pages/quilts/list', {
        layout: 'admin',
        title: 'Quilts',
        quilts: quilts
      });
    });
});

router.get('/color/create', isAuthenticated, function (req, res, next) {
  res.render('pages/admin/color-create', {
    layout: 'admin',
    title: 'New colour set'
  });
});

router.get('/color/edit/:id?', isAuthenticated, function (req, res, next) {
  if (!req.params.id) {
    res.redirect('/qb-admin');
    return;
  }
  Color.findOne({'_id':req.params.id})
    .exec(function (err, color) {
      if (err) return next(err);
      res.render('pages/admin/color-edit', {
        layout: 'admin',
        title: 'Edit Colour Set',
        color: color
      });
    });
});

router.post('/color/edit/:id?', isAuthenticated, function (req, res, next) {
  var colorData = {
    'name': req.body.name,
    'colors': req.body.color
  };
  console.log('creating/editing color', colorData);
  // create or edit color set
  if (req.params.id) {
    Color.update({'_id':req.params.id}, colorData)
      .exec(function (err, color) {
        if (err) throw err;
        console.log('Color set updated successfully!', color);
        res.redirect('/qb-admin');
      });
  } else {
    var newColor = new Color(colorData);
    newColor.save(function(err, color) {
      if (err) throw err;
      console.log('Color set created successfully!');
      res.redirect('/qb-admin/color/create');
    });
  }
});

router.get('/theme/create', isAuthenticated, function (req, res, next) {
  Color
    .find({})
    .exec(function(err, colors) {
      if (err) return next(err);
      res.render('pages/admin/theme-create', {
        layout: 'admin',
        title: 'New Theme',
        colors: colors
      });
    });
});

router.get('/theme/edit/:id?', isAuthenticated, function (req, res, next) {
  if (!req.params.id) {
    res.redirect('/qb-admin');
    return;
  }
  Color.findOne({'_id':req.params.id})
    .exec(function (err, color) {
      if (err) return next(err);
      res.render('pages/admin/theme-edit', {
        layout: 'admin',
        title: 'Edit Theme',
        color: color
      });
    });
});

router.post('/theme/edit/:id?', isAuthenticated, function (req, res, next) {
  var themeData = {
    'name': req.body.name,
    'colors': req.body.set
  };
  console.log('creating/editing theme', themeData);
  // create or edit color set
  if (req.params.id) {
    Theme.update({'_id':req.params.id}, themeData)
      .exec(function (err, theme) {
        if (err) throw err;
        console.log('Color set updated successfully!', theme);
        res.redirect('/qb-admin');
      });
  } else {
    console.log(themeData.colors.length);
    if (themeData.colors.length) {
      // Color.create(themeData.colors, function(err, color) {
      //   if (err) throw err;
      //   console.log(color);
      // });
      Color.collection.insert(req.body.set, {ordered: true}, function(err, color) {
        if (err) throw err;
        console.log(color);
        var newTheme = new Theme({
          name: themeData.name,
          colors: color.insertedIds
        });
        newTheme.save(function(err, theme) {
          if (err) throw err;
          console.log('Theme created successfully!');
          res.redirect('/qb-admin');
        });
      })
    }
  }
});