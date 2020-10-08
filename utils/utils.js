// users stack
var users = [];

const util = {
    isuserExist(username) {
        let user = users.find((user) => {
            return user.username == username;
        });
        return user ? true : false;
    },
    pushUser(user) {
        users.push(user);
    },
    removeUser(id) {
        const index = users.findIndex((user) => {
            return user.id === id;
        });

        if (index != -1) {
            const user = users[index]
            users.splice(index, 1);
            return user;
        }
        return;
    },
    getUser(id) {
        return users.find((user) => {
            return user.id == id;
        });
    },
    formatAMPM(date) {
        var hours = date.getHours();
        var minutes = date.getMinutes();
        var ampm = hours >= 12 ? 'pm' : 'am';
        hours = hours % 12;
        hours = hours ? hours : 12; // the hour '0' should be '12'
        minutes = minutes < 10 ? '0' + minutes : minutes;
        var strTime = hours + ':' + minutes + ' ' + ampm;
        return strTime;
    },
    getMessageDate(message, username) {
        return {
            message,
            "username": username,
            "deliveredAt": this.formatAMPM(new Date())
        }
    },
    addPeerId(id, peerid) {
        return users.find((user) => {
            if (user.id == id) {
                user.peerid = peerid;
                return user;
            }
        });
    }
}


module.exports = util;