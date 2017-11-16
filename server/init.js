'use strict';

var server = require('http').createServer(function (req, res) {});

server.listen(1025, '198.211.110.180');
console.log('server onnnnnnnnnnn!!!!!');

var io = require('socket.io')(server, {});

var usernameArray = [];
var socketArray = [];

io.sockets.on('connection', function(socket){
    socket.on("login", function(m){
        let userIndex = usernameArray.indexOf(m.message);
        
        if(userIndex === -1){
            socket.confirmed = true;
            socket.username = m.message;
            socket.id = socketArray.length;
            
            socketArray[socketArray.length] = socket;
            usernameArray[usernameArray.length] = m.message;
            
            socket.emit('server_notif', {message: "login_success", reason: m.message});
            
            broadcastMessage("server_notif", {message: socket.username + " has joined the chat"});
        }else{
            socket.emit('server_notif', {message: "login_fail", reason: "That username is taken :("});
        }
    });
    
    socket.on("message", function(m){
        if(socket.confirmed){
            if(m.message.startsWith("/")){
                console.log("it a command!");
            }else{
                broadcastMessage('new_message', m);

                switch(m.message){
                    case "hi":
                        socket.emit('server_notif', {message:"Hello, " + m.sender + "."});
                         break;
                    case "bye":
                        socket.emit('server_notif', {message:"Goodbye, " + m.sender + "."});
                        break;
                    case "XD":
                        socket.emit('server_notif', {message:m.sender + " has been banned temporarily for use of " + m.message});
                        break;
                    default:
                        break;
                }
            }
        }
    });
    
    socket.on("new_message", function(m){
        console.log("server receives emissions");
    })
    
    socket.on("disconnect", function(m){
        if(socket.confirmed){
            socketArray.splice(socket.id, 1);
            usernameArray.splice(socket.id, 1);
            
            broadcastMessage("server_notif", {sender: "SERVER", message: socket.username + " has disconnected"});
        }
    });
});

function broadcastMessage(messageType, message){
    let i = socketArray.length;
    
    while(i--){
        socketArray[i].emit(messageType, message)
    }
}