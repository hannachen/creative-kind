var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';
// var secretKey = process.env.QUILTING_BEE_SECRET_KEY;
var secretKey = process.env.SECRET_KEY || '3BxR7DFG9Hm4';

var config = {
  development: {
    root: rootPath,
    public_key: 'certs/public.pem',
    app: {
      name: 'qb-test'
    },
    port: 3000,
    db: 'mongodb://localhost/quilting-bee',
    secret: secretKey,
    nodemailer: {
      service: 'Mailgun',
      auth: {
        api_key: 'api:key-ad0790abff28a38aab14bda682df47a1',
        domain: 'sandbox5ddedd142de24091b958d347bad4d895.mailgun.org'
      }
    }
  },

  test: {
    root: rootPath,
    public_key: 'certs/public.pem',
    app: {
      name: 'qb-test'
    },
    port: 3000,
    db: 'mongodb://localhost/qb-test-test',
    secret: secretKey,
    nodemailer: {
      service: 'Mailgun',
      auth: {
        api_key: 'key-29e6f0358d5b5d79c64c4252c5c891ae',
        domain: 'sandbox54110b86e96f44ceb96aa9b85d4bb923.mailgun.org'
      }
    }
  },

  staging: {
    root: rootPath,
    public_key: 'certs/public.pem',
    app: {
      name: 'qb-stg'
    },
    port: 8080,
    db: 'mongodb://localhost/quilting-bee',
    secret: secretKey,
    nodemailer: {
      service: 'Mailgun',
      auth: {
        api_key: 'key-29e6f0358d5b5d79c64c4252c5c891ae',
        domain: 'sandbox54110b86e96f44ceb96aa9b85d4bb923.mailgun.org'
      }
    }
  },

  production: {
    root: rootPath,
    public_key: 'certs/public.pem',
    app: {
      name: 'qb-test'
    },
    port: 8080,
    db: 'mongodb://localhost/quilting-bee',
    secret: secretKey, // Use environment variables (save in bash_profile??)
    nodemailer: {
      service: 'Mailgun',
      auth: {
        api_key: 'key-29e6f0358d5b5d79c64c4252c5c891ae',
        domain: 'sandbox54110b86e96f44ceb96aa9b85d4bb923.mailgun.org'
      }
    }
  }
};

module.exports = config[env];
