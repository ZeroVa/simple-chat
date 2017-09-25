var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  sender: {
    type: String,
    required: true,
    trim: true,
  },
  messageText: {
    type: String,
    required: true,
    trim: true
  },
  sent: {
      type: Date,
  }
});


var Message = mongoose.model('Message', MessageSchema);
module.exports = Message;
