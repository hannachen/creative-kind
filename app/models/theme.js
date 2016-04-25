var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ThemeSchema = new Schema({
  name: String,
  colors: [{ type: Schema.Types.ObjectId, ref: 'Color'}]
});

mongoose.model('Theme', ThemeSchema);
