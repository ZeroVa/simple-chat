var mongoose = require('mongoose');
var MessageSchema = require('./message.js').schema;

var ChatSchema = new mongoose.Schema({
  messages: [MessageSchema],
  started: {
      type: Date,
      required: true,
      trim: true
  },
  lastUpdated: {
    type: Date,
    trim: true
  }
});


var Chat = mongoose.model('Chat', ChatSchema);
module.exports = Chat;
