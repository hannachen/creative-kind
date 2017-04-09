var express = require('express');
var glob = require('glob');

var favicon = require('serve-favicon');
var logger = require('morgan');
var session = require('express-session');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var compress = require('compression');
var methodOverride = require('method-override');
var exphbs  = require('express-handlebars');
var flash = require('connect-flash');

var passport = require('passport');
var recaptcha = require('express-recaptcha');

var fbConfig = require('../config/fb.js');

module.exports = function(app, config) {
  var env = process.env.NODE_ENV || 'development';
  app.locals.ENV = env;
  app.locals.ENV_DEVELOPMENT = env == 'development';
  
  app.engine('handlebars', exphbs({
    helpers: {
      'if_eq': function(a, b, opts) { return (a == b) ? opts.fn(this) : opts.inverse(this); },
      'math': function(lvalue, operator, rvalue) {
        lvalue = parseFloat(lvalue);
        rvalue = parseFloat(rvalue);

        return {
          "+": lvalue + rvalue,
          "-": lvalue - rvalue,
          "*": lvalue * rvalue,
          "/": lvalue / rvalue,
          "%": lvalue % rvalue
        }[operator];
      },
      'json': function(context) {
        return JSON.stringify(context);
      },
      'section': function(name, options) {
        if(!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      }
    },
    layoutsDir: config.root + '/app/views/layouts/',
    defaultLayout: 'main',
    partialsDir: [config.root + '/app/views/partials/']
  }));
  app.set('views', config.root + '/app/views');
  app.set('view engine', 'handlebars');

  // app.use(favicon(config.root + '/public/img/favicon.ico'));
  app.use(logger('dev'));
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));
  app.use(cookieParser());
  app.use(session({
    secret: 'beeline',
    resave: true,
    saveUninitialized: true
  }));
  app.use(flash());
  app.use(compress());
  app.use(express.static(config.root + '/public'));
  app.use(methodOverride());

  // Configure passport middleware
  app.use(passport.initialize());
  app.use(passport.session());

  // Initialize Passport
  var initPassport = require('../passport/init');
  initPassport(passport);

  // Make the user object available to all views provided that req.user is available.
  app.use(function(req, res, next) {
    res.locals.user = req.user;
    res.locals.flash = req.flash();
    req.config = config;
    req.fbConfig = fbConfig;
    next();
  });

  // Initialize reCAPTCHA
  recaptcha.init('6LdaWRkTAAAAAA4kTdqU6kzSCv2CgQsfgtKltN2q', '6LdaWRkTAAAAAO9kULf6PhFROv1wOCbSg-AgS6lZ');

  var controllers = glob.sync(config.root + '/app/controllers/*.js');
  controllers.forEach(function (controller) {
    require(controller)(app);
  });

  app.use(function (req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
  });

  if(app.get('env') === 'development') {
    app.use(function (err, req, res, next) {
      res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: err,
        title: 'error'
      });
    });
  }

  app.use(function (err, req, res, next) {
    res.status(err.status || 500);
      res.render('error', {
        message: err.message,
        error: {},
        title: 'error'
      });
  });

};
