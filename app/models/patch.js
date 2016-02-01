var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var PatchSchema = new Schema({
      _user : { type: Schema.Types.ObjectId, ref: 'User' },
      _quilt: { type: Schema.Types.ObjectId, ref: 'Quilt' },
      uid: String,
      colors: [],
      status: String,
      theme: String
    }, { collection: 'patches' });

PatchSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('Patch', PatchSchema);

