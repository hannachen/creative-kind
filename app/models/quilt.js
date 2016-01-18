var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var QuiltSchema = new Schema({
  _user : { type: Schema.Types.ObjectId, ref: 'User' },
  title: String,
  type: String,
  status: String,
  theme: String
});

QuiltSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('Quilt', QuiltSchema);

