const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
var listUser = [];

const app = express();

const http = require('http');
const server = http.createServer(app);
const io = require('socket.io').listen(server);
var accountOnline = [];

const MongoClient = require('mongodb').MongoClient;
const uri = "mongodb://codefulltime:Abcdabcd1@mongodb-2073-0.cloudclusters.net:10011/codefulltime?authSource=admin";
const client = new MongoClient(uri, {useNewUrlParser: true});

function checkExist(accOnline, acc) {
    for (let i = 0; i < accOnline.length; i++) {
        if (accOnline[i].id === acc.id) {
            return true;
        }
    }
    return false;
}

io.on('connection', function (socket) {

    console.log("Co nguoi ket noi" + socket.id);

    socket.on('client-loggedIn', function (data) {
        if (!checkExist(accountOnline, data))
            accountOnline.push(data);
        io.sockets.emit('server-send-list-online', accountOnline);
    });

    socket.on('client-request-create-room', function (data) {
        socket.join(data);
    });

    socket.on('client-request-list-message', function (data) {
        const room = data.room;
        client.connect(err => {
            const collection = client.db("codefulltime").collection('message');
            collection.find({'room': room}).toArray(function (err, docs) {
                socket.emit('server-send-list-message', {
                    docs,
                    room
                });
                console.log(docs.length);
            });
        });
    });

    socket.on('notify-for-friends', function (data) {
        io.sockets.emit('handle-server-send-chat-when-not-open-box-chat', data);
    });

    socket.on('client-chat', function (data) {
        console.log('        -----------------------------------------------------------------------------\n');
        io.sockets.in(data.room).emit('server-send-client-chat', {
            message: data.message,
            account: data.account,
            time: data.time,
            room: data.room
        });


        client.connect(err => {
            const collection = client.db("codefulltime").collection('message');
            // perform actions on the collection object
            collection.insertOne({
                message: data.message,
                account: data.account,
                time: data.time,
                room: data.room
            }).then(value => {

            }).catch(error => console.log(error));
        });
    });
    socket.on('disconnect', function () {
        console.log("Co nguoi ngat ket noi")
    });
});


app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));


app.use(function (req, res, next) {
    next(createError(404));
});

app.use(function (err, req, res, next) {
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(err.status || 500);
    res.render('error');
});

server.listen(process.env.PORT || '3000');


module.exports = app;
