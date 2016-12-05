var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate')(mongoose),
    Schema = mongoose.Schema;

var InviteSchema = new Schema({
  _quilt: { type: Schema.Types.ObjectId, ref: 'Quilt' },
  sender : { type: Schema.Types.ObjectId, ref: 'User' },
  recipient : { type: Schema.Types.ObjectId, ref: 'User' },
  key: String,
  email: String
});

InviteSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

InviteSchema.plugin(deepPopulate);

InviteSchema.index({ sender: 1, _quilt: 1, email: 1}, { unique: true });

mongoose.model('Invite', InviteSchema);
