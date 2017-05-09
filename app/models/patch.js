var mongoose = require('mongoose'),
    deepPopulate = require('mongoose-deep-populate')(mongoose),
    Schema = mongoose.Schema,
    config = require('../../config/config.js'),
    fs = require('fs');

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
    }, {
      collection: 'patches',
      timestamps: {
        createdAt: 'created_at',
        updatedAt: 'updated_at'
      }
    });

PatchSchema.post('remove', function(doc) {
  var filePath = config.root + '/public/patches/' + doc.uid + '.png';
  fs.unlink(filePath, function(err) {});
});

PatchSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

PatchSchema.plugin(deepPopulate);

mongoose.model('Patch', PatchSchema);

