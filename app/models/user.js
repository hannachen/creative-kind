var mongoose = require('mongoose'),
    Schema = mongoose.Schema,
    mongooseValidation = require('mongoose-beautiful-unique-validation'),
    passportLocalMongoose = require('passport-local-mongoose');

var UserSchema = new Schema({
      username: {
        type: String,
        required: true,
        unique: 'Username is taken, please select another.'
      },
      usertype: String,
      email: {
        type: String,
        required: true,
        unique: 'There is already an account with the same email, please log in or use a different email.'
      },
      fb: {
        id: String,
        access_token: String,
        email: String
      },
      twitter: {
        id: String,
        token: String,
        username: String,
        displayName: String,
        lastStatus: String
      }
    });

UserSchema.plugin(mongooseValidation);
UserSchema.plugin(passportLocalMongoose);

UserSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

UserSchema.virtual('isAdmin')
  .get(function() {
    return (this.usertype === 'admin');
  });

mongoose.model('User', UserSchema);
