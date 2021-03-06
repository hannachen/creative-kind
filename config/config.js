var path = require('path'),
    rootPath = path.normalize(__dirname + '/..'),
    env = process.env.NODE_ENV || 'development';
// var secretKey = process.env.QUILTING_BEE_SECRET_KEY;
var secretKey = process.env.SECRET_KEY || '3BxR7DFG9Hm4';

/*
nodemailer: {
  service: 'Smtp',
    host: 'mailtrap.io',
    port: 2525,
    auth: {
    user: 'ff27f37f3e2377',
      pass: '89d93467781621'
  }
}
*/

var config = {
  development: {
    host: 'localhost',
    root: rootPath,
    public_key: rootPath + '/config/certs/public.pem',
    private_key: rootPath + '/config/certs/private.pem',
    app: {
      name: 'qb-test'
    },
    port: 3000,
    db: 'mongodb://localhost/creative-kind',
    secret: secretKey,
    nodemailer: {
      service: 'Mailgun',
      auth: {
        api_key: 'key-ad0790abff28a38aab14bda682df47a1',
        domain: 'sandbox5ddedd142de24091b958d347bad4d895.mailgun.org'
      }
    }
  },

  test: {
    host: 'localhost',
    root: rootPath,
    public_key: rootPath + '/config/certs/public.pem',
    private_key: rootPath + '/config/certs/private.pem',
    app: {
      name: 'qb-test'
    },
    port: 3000,
    db: 'mongodb://localhost/qb-test-test',
    secret: secretKey,
    nodemailer: {
      service: 'Mailgun',
      auth: {
        api_key: 'key-ad0790abff28a38aab14bda682df47a1',
        domain: 'creative-kind.fpo.website'
      }
    }
  },

  staging: {
    host: 'creative-kind.fpo.website',
    root: rootPath,
    public_key: rootPath + '/config/certs/public.pem',
    private_key: rootPath + '/config/certs/private.pem',
    app: {
      name: 'qb-stg'
    },
    port: 8080,
    db: 'mongodb://queenbee:#1c2W87U$zl2@localhost:27007/creative-kind',
    secret: secretKey,
    nodemailer: {
      service: 'Mailgun',
      auth: {
        api_key: 'key-ad0790abff28a38aab14bda682df47a1',
        domain: 'creative-kind.fpo.website'
      }
    }
  },

  production: {
    host: 'creative-kind.com',
    root: rootPath,
    public_key: rootPath + '/config/certs/public.pem',
    private_key: rootPath + '/config/certs/private.pem',
    app: {
      name: 'qb-test'
    },
    port: 8080,
    db: 'mongodb://localhost/quilting-bee',
    secret: secretKey, // Use environment variables (save in bash_profile??)
    nodemailer: {
      service: 'Mailgun',
      auth: {
        api_key: 'key-ad0790abff28a38aab14bda682df47a1',
        domain: 'creative-kind.fpo.website'
      }
    }
  }
};

module.exports = config[env];
