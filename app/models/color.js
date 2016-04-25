var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var ColorSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Please enter a name for this colour set']
  },
  colors: {
    type: [{
      type: String,
      required: true
    }],
    validate: [arrayLimit, '{PATH} requires 5 colours']
  }

});

mongoose.model('Color', ColorSchema);

function arrayLimit(val) {
  return val.length == 5;
}
