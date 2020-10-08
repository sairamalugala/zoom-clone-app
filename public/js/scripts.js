const username_e = document.getElementById('username');
const chatroom_e = document.getElementById('chatroom');
const messageInput = document.getElementById('message-input');
const $message = document.getElementById('messages');
const videoColumn = document.getElementById('video__col');

// templates
const $messageTemplate = document.getElementById('message-template');


const socket = io('/');

const peers = {};

const myPeer = new Peer({
    path: '/peerjs',
    host: '/',
    port: location.port || (location.protocol === 'https:' ? 443 : 80)
})

var peerid, myStream;
myPeer.on('open', (id) => {
    peerid = id;
});


// submit event for join room form
const joinRoom = async(e, form) => {
    e.preventDefault();


    const username = username_e.value.toLowerCase().trim();
    const chatroom = chatroom_e.value.toLowerCase().trim();


    const response = await isJoined({ username, chatroom });
    if (!response.success) {
        alert(response.error);
        return false;
    }

    username_e.value = "";
    chatroom_e.value = "";

    myStream = await getUserStream();
    socket.emit('peer_join', peerid)

    document.querySelector('.centered-form').classList.add('hide');
    document.querySelector('.chat').classList.remove('hide');

    const videoElement = document.createElement('video');
    addVideoStream(videoElement, myStream);

    socket.on('peer_joined', (peerid) => {
        console.log(peerid, myStream);
        const call = myPeer.call(peerid, myStream);
        console.log("call:: ", call)
        const videoElement = document.createElement('video');
        call.on('stream', (remoteStream) => {
            console.log('on stream')
            addVideoStream(videoElement, remoteStream);
        });
        call.on('close', () => {
            videoElement.remove();
        });
        peers[peerid] = call;
    });

    myPeer.on('call', (call) => {
        console.log('inside on call')
        call.answer(myStream);
        const videoElement = document.createElement('video');
        call.on('stream', (remoteStream) => {
            addVideoStream(videoElement, remoteStream)
        });
        call.on('close', () => {
            videoElement.remove();
        })
        peers[call.peer] = call;
    });
    return false;
}

// triggers when message entered
const sendMsg = (ev, element) => {
    if (ev.keyCode == 13) {
        element.setAttribute('disabled', true);
        let msg = element.value || "";
        msg = msg.trim();
        if (!msg) {
            return messageInput.focus();
        }
        socket.emit('on_message', msg, () => {
            element.value = "";
            element.removeAttribute('disabled');
            messageInput.focus();
        });
    }
}

// join the user in room
const isJoined = ({ username, chatroom, peerid }) => {
    return new Promise((resolve, reject) => {
        socket.emit('join_room', { username, chatroom, peerid }, (response) => {
            resolve(response);
        });
    })
}

const getUserStream = async() => {
    var getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia;
    return new Promise((resolve, reject) => {
        getUserMedia({ video: true, audio: true }, function(stream) {
            resolve(stream);
        }, function(err) {
            console.log('Failed to get local stream', err);
            alert('accept user media');
            reject(err);
        });
    })
}

/* render template */
const renderTemplate = (data, template) => {
    return template.replace(/@{([^}]+)}/g, function(match, str, offset, string) {
        match = match.replace("@{", "").replace("}", "");
        return data[match] || "";
    })
}

//scroll down function
const scrollDown = () => {
    //last messageElement
    const $newMessage = $message.lastElementChild;

    //height of the new message
    const $newStyleMargin = parseInt(getComputedStyle($newMessage).marginBottom) || 0;
    const $newMessageHeight = $newMessage.offsetHeight + $newStyleMargin;

    //visible height
    const visibleHeight = $message.offsetHeight;

    //height of messages container
    const containerHeight = $message.scrollHeight;

    //how far i have scrolled?
    const scrollOffset = $message.scrollTop + visibleHeight;
    if (containerHeight - $newMessageHeight <= scrollOffset) {
        $message.scrollTop = $message.scrollHeight;
    }
}


const addVideoStream = (videoElement, stream) => {
    videoColumn.append(videoElement);
    videoElement.srcObject = stream;
    videoElement.onloadedmetadata = () => {
        videoElement.play();
    }
}

const muteUnmute = (src) => {
    const enabled = myStream.getAudioTracks()[0].enabled;
    if (enabled) {
        myStream.getAudioTracks()[0].enabled = false;
        src.classList.remove('fa-microphone');
        src.classList.add('fa-microphone-slash');
        src.parentElement.classList.add('slash');
    } else {
        myStream.getAudioTracks()[0].enabled = true;
        src.classList.add('fa-microphone');
        src.classList.remove('fa-microphone-slash');
        src.parentElement.classList.remove('slash');
    }
}

const palyPause = (src) => {
    const enabled = myStream.getVideoTracks()[0].enabled;
    if (enabled) {
        myStream.getVideoTracks()[0].enabled = false;
        src.classList.remove('fa-video');
        src.classList.add('fa-video-slash');
        src.parentElement.classList.add('slash');
    } else {
        myStream.getVideoTracks()[0].enabled = true;
        src.classList.add('fa-video');
        src.classList.remove('fa-video-slash');
        src.parentElement.classList.remove('slash');
    }
}

const leaveRoom = (e, src) => {
    e.preventDefault();
    document.querySelector('.centered-form').classList.remove('hide');
    document.querySelector('.chat').classList.add('hide');
    myPeer.disconnect();
    socket.emit('forceDisconnect');
    const tracks = myStream.getTracks();
    tracks.forEach(function(track) {
        track.stop();
    });
    myStream = undefined;
}

/* SOCKET EVENTS */
socket.on('on_message', (response) => {
    console.log('insde on_message client', response);
    let template = $messageTemplate.innerHTML;
    template = renderTemplate(response, template);
    $message.insertAdjacentHTML('beforeend', template);
    scrollDown();
});

socket.on('user_disconnect', (peerid) => {
    if (peers[peerid]) {
        console.log('user_disconnect', peerid)
        peers[peerid].close();
        delete peers[peerid];
    }
})