var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var QuiltSchema = new Schema({
      _user : { type: Schema.Types.ObjectId, ref: 'User' },
      _patches: [{ type: Schema.Types.ObjectId, ref: 'Patch' }],
      _theme: {type: Schema.Types.ObjectId, ref: 'Theme'},
      title: String,
      type: String,
      status: String
    });

QuiltSchema.virtual('date')
  .get(function(){
    return this._id.getTimestamp();
  });

mongoose.model('Quilt', QuiltSchema);

