var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ColorSchema = new Schema({
  name: String,
  colors: [String]
}, { collection: 'colors' });

mongoose.model('Color', ColorSchema);

