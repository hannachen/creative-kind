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

InviteSchema.index({ _user: 1, _quilt: 1, recipient: 1}, { unique: true });

mongoose.model('Invite', InviteSchema);
