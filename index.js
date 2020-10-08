const express = require('express');
const http = require('http');
const util = require('./utils/utils');
const app = express();
const server = http.createServer(app);
const io = require('socket.io')(server);
const { ExpressPeerServer } = require('peer');



const peerServer = ExpressPeerServer(server, {
    debug: true
});



//set static files
app.use(express.static('public'));

//set view engine
app.set('view engine', 'ejs');

const PORT = process.env.PORT || 3000;

app.use('/peerjs', peerServer);

app.get('/', (req, res) => {
    res.render('index', {
        "title": "WEB CAM"
    });
})

io.on('connection', (socket) => {
    console.log('conncted');

    socket.on('join_room', ({ username, chatroom, }, callback) => {
        console.log("inside join", username, chatroom);
        if (util.isuserExist(username)) {
            return callback({ "success": false, "error": "user already exist" });
        }
        callback({ "success": true, "error": "" });
        util.pushUser({
            username,
            chatroom,
            "id": socket.id,
        })
        socket.join(chatroom);
        socket.emit('on_message', util.getMessageDate(`Welcome, ${username}`, 'Admin'))
        socket.broadcast.to(chatroom).emit('on_message', util.getMessageDate(`${username} has joined`, 'Admin'));
    });

    socket.on('peer_join', (peerid) => {
        const user = util.addPeerId(socket.id, peerid);
        socket.broadcast.to(user.chatroom).emit('peer_joined', peerid);
    });

    socket.on('on_message', (message, callback) => {
        const user = util.getUser(socket.id);
        io.to(user.chatroom).emit('on_message', util.getMessageDate(message, user.username));
        callback();
    });

    socket.on('forceDisconnect', function() {
        socket.disconnect();
    });

    // when socket get disconncted
    socket.on('disconnect', () => {
        console.log("disconnected");
        const user = util.removeUser(socket.id);
        if (user) {
            socket.broadcast.to(user.chatroom).emit('on_message', util.getMessageDate(`${user.username} has left`, 'Admin'));
            socket.broadcast.to(user.chatroom).emit('user_disconnect', user.peerid);
        }
    });
});

server.listen(PORT, function() {
    console.log(`listening on ${PORT}`);
})