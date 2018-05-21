'use strict';

module.exports = {
  title: "Basic Node Chat",
  servPort: 1025,
  init: function () {
    console.log("----- Initializing '" + this.title + "' -----");

    let server = require('http').createServer(function (req, res) {});
    server.listen(this.servPort, '198.211.110.180');

    console.log("Server active on local port " + this.servPort + "...");

    this.io = require('socket.io')(server, {});

    console.log("Acquired Socket.io...");

    let uIDArray = [];
    let socketArray = [];
    let broadcastMessage = function (messageType, message) {
      var i = socketArray.length;

      while (i--) {
        socketArray[i].emit(messageType, message)
      }
    };

    const badExpression = /shit|cunt|bitch|nigger|chink|faggot|whore|twat|prick|nigga|pussy|vagina|slut|anal|boob|butt|cock|coon|dildo|dyke|fag|homo|prick|queer|tit|turd|wank|smegma|ass|dick|penis/;

    console.log("Outer variables initialized. Establishing socket functionality...");

    this.io.sockets.on('connection', function (socket) {
      socket.on("login", function (m) {
        if (m.message.trim().length === 0) {
          socket.emit('server_notif', {
            message: "login_fail",
            reason: "No username detected"
          });
        } else if (m.message.trim().length > 50) {
          socket.emit('server_notif', {
            message: "login_fail",
            reason: "That username is too long"
          });
        } else if (badExpression.test(m.message.toLowerCase())) {
          socket.emit('server_notif', {
            message: "login_fail",
            reason: "That username is kinda vulgar :/"
          });
        } else {
          socket.confirmed = true;
          socket.uID = m.uID;
          socket.username = m.message;
          socket.index = socketArray.length;

          socketArray[socketArray.length] = socket;
          uIDArray[uIDArray.length] = socket.uID;

          var i = uIDArray.length;
          
          while (i--)
            if (uIDArray[i] === m.uID){
              socketArray[i].username = m.message;
              socketArray[i].emit('server_notif', {
                message: "login_success",
                reason: m.message
              });
            }

          broadcastMessage("server_notif", {
            message: "#" + socket.uID + " is now " + socket.username
          });
        }
      });

      console.log("Socket login handler initialized...");

      socket.on("message", function (m) {
        if (socket.confirmed) {
          m.uID = socket.uID;
          m.sender = socket.username;

          if (m.message.startsWith("/")) {
            switch (m.message.substring(0, m.message.indexOf(" "))) {
              case "/yell":
                m.message = m.message.substring(m.message.indexOf(" "));
                m.yelling = 1;

                broadcastMessage("new_message", m);

                break;
              case "/setuser":
                let newName = m.message.substring(m.message.indexOf(" ")).trim();

                if (newName.length === 0) {
                  socket.emit('server_notif', {
                    message: "login_fail",
                    reason: "No username detected: " + newName
                  });
                } else if (newName.length > 50) {
                  socket.emit('server_notif', {
                    message: "login_fail",
                    reason: "That username is too long: " + newName
                  });
                } else if (badExpression.test(newName.toLowerCase())) {
                  socket.emit('server_notif', {
                    message: "login_fail",
                    reason: "That username is kinda vulgar: " + newName
                  });
                } else {
                  var i = uIDArray.length;
                  
                  while (i--)
                    if (uIDArray[i] === m.uID){
                      socketArray[i].username = newName;
                      socketArray[i].emit('server_notif', {
                        message: "login_success",
                        reason: newName
                      });
                    }
                  
                  broadcastMessage("server_notif", {
                    message: "#" + socket.uID + " is now " + socket.username
                  });
                }
                break;
              default:
                socket.emit('server_notif', {
                  message: "The command '" + m.message + "' is not recognized"
                });
                break;
            }
          } else {
            broadcastMessage('new_message', m);

            switch (m.message) {
              case "hi":
                socket.emit('server_notif', {
                  message: "Hello, " + m.sender + "."
                });
                break;
              case "bye":
                socket.emit('server_notif', {
                  message: "Goodbye, " + m.sender + "."
                });
                break;
              case "XD":
                socket.emit('server_notif', {
                  message: m.sender + " has been banned temporarily for use of " + m.message
                });
                break;
              default:
                break;
            }
          }
        }
      });

      console.log("Socket message handler initialized...");

      socket.on("disconnect", function (m) {
        if (socket.confirmed) {
          uIDArray.splice(socket.index, 1);
          socketArray.splice(socket.index, 1);

          if(uIDArray.indexOf(socket.uID) === -1)
            broadcastMessage("server_notif", {
              sender: "SERVER",
              message: socket.username + " has disconnected"
            });
        }

        socket.disconnect(0);
      });

      console.log("Socket disconnect handler initialized...");
    });

    console.log("Initialization complete. Running " + this.title + "... \n");
  }
}