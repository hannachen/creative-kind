var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate')(mongoose),
    Schema = mongoose.Schema;

var PatchSchema = new Schema({
      _user : { type: Schema.Types.ObjectId, ref: 'User' },
      _quilt: { type: Schema.Types.ObjectId, ref: 'Quilt' },
      uid: String,
      status: String,
      colorSet: {
        type: Number, // Index of the colour set within a theme, keep it vague so that a quilt's theme may be switched
        default: 0
      },
      colorIndex: String,
      colors: String
    }, { collection: 'patches' });

PatchSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

PatchSchema.plugin(deepPopulate);

mongoose.model('Patch', PatchSchema);

