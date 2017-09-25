var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
var io = require('socket.io')(3005);
var mongoose = require('mongoose');

var Chat = require('./models/chat');
var Message = require('./models/message');

var index = require('./routes/index');
var users = require('./routes/users');

if(!process.env.mongoUrl) {
  throw new Error('You need to specify a mongodb connection url!');
}

mongoose.connect(process.env.mongoUrl, { useMongoClient: true, promiseLibrary: global.Promise });
console.log('db connection requested');
// ?chat=59c6312268b8823d0ed32862
// ?chat=59c6d548723f4b485f276ffb
// ?chat=59c6d733723f4b485f277001
// ?chat=59c6d73a723f4b485f277002
// ?chat=59c6d75b723f4b485f277003

var app = express();
console.log('express app instantiated');

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
  console.log('a user connected');

  socket.on('startChat', function (chatId) {
    if (chatId == undefined) {
      var newChat = new Chat({
        started: new Date(),
        lastUpdated: new Date(),
      });
      newChat.save((err) => {
        if (!err) {
          console.log('saved new chat ' + newChat._id);
          socket.join(newChat._id);
          socket.emit('startChat', newChat);
        }
        else {
          console.log(err);
        }
      });
    }
    else {
      var thisChatOne = Chat.findById(chatId, (err, chat) => {
        console.log("getting it simply");
      });
      var thisChat = Chat.findById(chatId).populate().exec((err, chat) => {
        if (err) {
          console.log(err);
          return;
        }
        console.log('sending out chat ' + chat._id);
        socket.join(chat._id);
        console.log("joining socket ");
        console.log(socket);
        socket.emit('startChat', chat);
      });
    }
  });

  socket.on('newMessage', (msg) => {
    Chat.findById(msg.chatId, (err, chat) => {
      if(err){
        console.log(err);
        return;
      }
      var newMessage = new Message({
        sender: 'anon',
        messageText: msg.messageText,
        sent: msg.sent,
      });
      console.log('here is your chat');
      console.log(chat);
      chat.update( {$push: {messages: newMessage}}, (err, done) => {
        console.log("here's the done object");
        console.log(err || done);
        io.sockets.in(chat._id).emit('newMessage', newMessage);
        // socket.broadcast.to(chat._id).emit('newMessage', newMessage);
        // socket.emit('newMessage', newMessage);
      });
    });
  });

  socket.on('disconnect', function () {
    console.log('user disconnected');
  });
  socket.on('chat message', function (msg) {

  });
});

module.exports = app;
