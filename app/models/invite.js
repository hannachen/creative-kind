var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var InviteSchema = new Schema({
  _user : { type: Schema.Types.ObjectId, ref: 'User' },
  _quilt: { type: Schema.Types.ObjectId, ref: 'Quilt' },
  recipient: String
});

InviteSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('Invite', InviteSchema);
