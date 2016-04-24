var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ThemeSchema = new Schema({
  name: String,
  colors: []
}, { collection: 'themes' });

mongoose.model('Theme', ThemeSchema);

