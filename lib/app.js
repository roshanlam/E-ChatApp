const express = require('express');
const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
var mongo = require('mongodb').MongoClient;

exports.app = {
  run(port) {
    server.listen(port, '0.0.0.0', () => {
      console.log('Server listening at port %d', port);
    });
  },
};

const users = new Set();
var usersid = {};

io.on('connection', function onConnection(socket) {
  let username;
  console.log('a user connected');
  console.log(socket.id);
  // mongo.connect('mongodb://127.0.0.1/message', function (err, db) {
  //       var collection = db.collection('messages')
  //       console.log("HereIam:");
  //       collection.find().sort({ _id : -1 }).limit(10).toArray(function(err,res){
  //                   if(err) throw err;
  //                   io.sockets.emit('bulk',res);
  //                   console.log("HereIam:",res);
  //               });
  //             });

  socket.on('message', function onMessage(data) {
    const text = data.text;
    const rec = data.screen;
    mongo.connect('mongodb://127.0.0.1/message', function (err, db) {
            var collection = db.collection('messages');
            collection.insert({ sender:username,receiver: rec,message: text }, function (err, o) {
                if (err) { console.warn(err.message); }
                else { console.log("chat message inserted into db: " + text); }
            });
        });
    if(rec=="common chat"){
      io.sockets.emit('message', { username, text , rec });
    }
    else{
      //io.sockets.socket(usersid[rec]).emit('message',{ username, text , rec });
      socket.to(usersid[rec]).emit('message', { username, text , rec });
    }
  });

  // TODO: validate login!
  // TODO: check if user is already logged in!
  socket.on('login', function onLogin(data) {
    username = data.username;
    let uid = socket.id;
    usersid[username] = socket.id;
    console.log("username:",username,"socketid",socket.id);
    users.add("common chat");
    users.add(username);
    io.sockets.emit('login', { username, users: Array.from(users),usersid });
  });

  socket.on('typing', function onTyping() {
    socket.broadcast.emit('typing', { username });
  });

  socket.on('stop-typing', function onStopTyping() {
    socket.broadcast.emit('stop-typing', { username });
  });

  socket.on('disconnect', function onDisconnect() {
    console.log('user disconnected');
    users.delete(username);
    socket.broadcast.emit('logout', { username, users: Array.from(users) });
  });
});
