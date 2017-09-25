var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var io = require('socket.io')();
var mongoose = require('mongoose');

var Chat = require('./models/chat');
var Message = require('./models/message');

var index = require('./routes/index');
var users = require('./routes/users');

if (!process.env.mongoUrl) {
  throw new Error('You need to specify a mongodb connection url!');
}

mongoose.connect(process.env.mongoUrl, { useMongoClient: true, promiseLibrary: global.Promise });

var app = express();
app.io = io;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'simple-chat-client/build')));

app.use('/', index);
app.use('/users', users);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

io.on('connection', function (socket) {
  socket.on('startChat', function (chatId) {
    // If no chat specified, make a new chat
    if (chatId == undefined) {
      var newChat = new Chat({
        started: new Date(),
        lastUpdated: new Date(),
      });
      // Save the new chat and send it out
      newChat.save((err) => {
        if (err) return;
        socket.join(newChat._id);
        socket.emit('startChat', newChat);
      });
    } else {
      // Chat exists, find it and send it out, with all messages populated
      Chat.findById(chatId).populate().exec((err, chat) => {
        if (err) return;
        socket.join(chat._id);
        socket.emit('startChat', chat);
      });
    }
  });

  // Someone sent in a new message
  socket.on('newMessage', (msg) => {
    // Find the right chat
    Chat.findById(msg.chatId, (err, chat) => {
      if (err) return;
      // Create a new message
      var newMessage = new Message({
        sender: 'anon',
        messageText: msg.messageText,
        sent: msg.sent,
      });
      // Add the message to the chat, update chat, send message to others in room
      chat.update({ $push: { messages: newMessage } }, (err, done) => {
        io.sockets.in(chat._id).emit('newMessage', newMessage);
      });
    });
  });

  socket.on('disconnect', function () {

  });
});

module.exports = app;
