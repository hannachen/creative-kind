var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';

var config = {
  development: {
    root: rootPath,
    app: {
      name: 'qb-test'
    },
    port: 3000,
    db: 'mongodb://localhost/quilting-bee'
  },

  test: {
    root: rootPath,
    app: {
      name: 'qb-test'
    },
    port: 3000,
    db: 'mongodb://localhost/qb-test-test'
  },

  staging: {
    root: rootPath,
    app: {
      name: 'qb-stg'
    },
    port: 8080,
    db: 'mongodb://localhost/quilting-bee'
  },

  production: {
    root: rootPath,
    app: {
      name: 'qb-test'
    },
    port: 8080,
    db: 'mongodb://localhost/quilting-bee'
  }
};

module.exports = config[env];
