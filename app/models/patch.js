var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate')(mongoose),
    Schema = mongoose.Schema;

var PatchSchema = new Schema({
      _user : { type: Schema.Types.ObjectId, ref: 'User' },
      _quilt: { type: Schema.Types.ObjectId, ref: 'Quilt' },
      uid: String,
      colors: [],
      status: String,
      svg: String,
      theme: String
    }, { collection: 'patches' });

PatchSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

PatchSchema.plugin(deepPopulate);

mongoose.model('Patch', PatchSchema);

