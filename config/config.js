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
    db: 'mongodb://localhost/quilting-bee',
    nodemailer: {
      service: 'SendGrid',
      auth: {
        api_key: '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'
      }
    }
  },

  test: {
    root: rootPath,
    app: {
      name: 'qb-test'
    },
    port: 3000,
    db: 'mongodb://localhost/qb-test-test',
    nodemailer: {
      service: 'SendGrid',
      auth: {
        api_key: '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'
      }
    }
  },

  staging: {
    root: rootPath,
    app: {
      name: 'qb-stg'
    },
    port: 8080,
    db: 'mongodb://localhost/quilting-bee',
    nodemailer: {
      service: 'SendGrid',
      auth: {
        api_key: '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'
      }
    }
  },

  production: {
    root: rootPath,
    app: {
      name: 'qb-test'
    },
    port: 8080,
    db: 'mongodb://localhost/quilting-bee',
    nodemailer: {
      service: 'SendGrid',
      auth: {
        api_key: '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'
      }
    }
  }
};

module.exports = config[env];
