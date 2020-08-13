const http = require('http')
const express = require('express')
const socketio = require('socket.io')
const helmet = require('helmet')
const Filter = require('bad-words')
const { generateMessage } = require('./utils/messages')
const { addUser, removeUser, getUser, getUserInRoom } = require('./utils/users')

const app = express()
const server = http.createServer(app)
const io = socketio(server)


app.use(express.static('public'))
app.use(express.json())
app.use(express.urlencoded({extended : false}))


io.on('connect', (socket) => {

    // Join in rooms
    socket.on('join', ({username, room}, callback) => {
        const { error, user } = addUser({id : socket.id, username, room})

        if(error)
            return callback(error)

        socket.join(user.room)    

        socket.emit('textMessage', generateMessage('Admin', `Welcome, you have joined the room - ${(user.room).toUpperCase()}`))
        socket.broadcast.to(user.room).emit('textMessage', generateMessage('Admin', `${user.username} joined the conversation`))
        
        io.to(user.room).emit('roomData', {
            room : user.room,
            users : getUserInRoom(user.room)
        })
        
        callback()
    })


    socket.on('sendMessage', (message, callback) => {
        const {id, username, room} = getUser(socket.id)
        const filter = new Filter()

        if(filter.isProfane(message))
            return callback('No badword please')

        io.to(room).emit('textMessage', generateMessage(username, message))
        callback()
    })


    socket.on('sendLocation', (data, callback) => {
        const {id, username, room} = getUser(socket.id)
        io.to(room).emit('locationMessage', generateMessage(username, `https://google.com/maps?q=${data.latitude},${data.longitude}`))
        callback('Location has shared')
    })

    socket.on('disconnect', () => {
        const user = removeUser(socket.id)

        if(user !== undefined && user !== null && user !== '') {
            io.to(user.room).emit('textMessage', generateMessage('Admin' ,`${user.username} left`))
            io.to(user.room).emit('roomData', {
                room : user.room,
                users : getUserInRoom(user.room)
            })
        }
    })
    
})



const port = process.env.PORT || 3000
server.listen(port, () => console.log('Node server is up and running'))
