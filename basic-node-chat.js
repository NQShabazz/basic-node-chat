'use strict';

const title = 'Basic Node Chat';

module.exports = (port) => {
  // console.log(`----- Initializing ${title} -----`)

  const express = require('express')
  const app = express()
  const server = require('http').Server(app)
  const io = require('socket.io')(server, { cors: { origin: '*' } })
  // console.log('Libraries and packages imported...')

  app.use('/',(req, res, next) => {
    const validRequests = ['/', '/main.js','/assets/css/style.css','/assets/img/LOGO_sm.png','/assets/img/favicon.png']
    
    validRequests.includes(req.url)
      ? next()
      : res.status(404).send('nah fam')
  }, express.static(__dirname))
  // console.log('File request fulfillment initialized...')

  const badExpression = /shit|cunt|bitch|nigger|chink|faggot|whore|twat|prick|nigga|pussy|slut|cock|coon|dyke|fag|homo|prick|tit|turd|wank|smegma|ass|dick/
  const defaultRoom = 'main'
  const serverNotif = 'server_notif'
  const disconnectedSocketArray = []
  // console.log('Outer variables initialized...')

  const checkExpression = message =>
    badExpression.test(message.toLowerCase())

  // thanks to bjornd of StackOverflow for this! <3 https://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
  const sanitize = rawText => {
    return rawText ? rawText
         .replace(/&/g, "&amp;")
         .replace(/</g, "&lt;")
         .replace(/>/g, "&gt;")
         .replace(/"/g, "&quot;")
         .replace(/'/g, "&#039;")
         .trim() : ''
  }

  const checkValidity = message => {
    const length = message.trim().length

    return !length ? 'empty... YEET' : length > 50 ? 'way too long' : checkExpression(message) ? 'kinda vulgar :(' : 0
  }

  function attemptReconnect(socket, uID) {
    let index = disconnectedSocketArray.findIndex(socket => socket.id === uID)
    // console.log('reconnecting')

    if (index >= 0) {
      const socketData = disconnectedSocketArray[index]

      clearTimeout(socketData.timeout)
      initializeSocket(socket, socketData.username, socketData.rooms)

      disconnectedSocketArray.splice(index, 1)

      // console.log('reconnection successful!')
      return 1
    }

    // console.log('no preexisting sockets found')
  }

  function initializeSocket(socket, username, roomArray = []) {
    socket.username = username

    roomArray.forEach(room => socket.join(room))

    socket.emit('authenticated', { id: socket.id, username: socket.username })
    roomArray.length && io.in(roomArray[0]).emit(serverNotif, `${socket.username} has joined the chat!`)

    socket.on('disconnecting', () => {
      const timeout = setTimeout(() => disconnectedSocketArray.splice(disconnectedSocketArray.findIndex(s => s.id === socket.id), 1), 30000)

      disconnectedSocketArray.push({ id: socket.id, username: socket.username, rooms: [...socket.rooms].slice(1), timeout })
      roomArray.length && io.in(roomArray[0]).emit(serverNotif, `${socket.username} has disconnected!`)
      // console.log('disconnect initiated')
    })

    socket.on('message', (m = '') => {
      // console.log(`message received: ${m}`)

      const resp = {
        message: sanitize(m),
        uID: socket.id,
        sender: socket.username
      }

      if (m.startsWith('/')) {
        const space = m.trim().indexOf(' ')
        const command = m.substring(1, space >= 0 ? space : undefined).trim()

        resp.message = sanitize(m.substring(m.indexOf(" ")))

        if (command === 'yell') {
          resp.yelling = 1
          socket.rooms.size === 2 && io.in([...socket.rooms][1]).emit('message', resp)
        } else if (command === 'setname') {
          const isInValid = checkValidity(resp.message)

          if (isInValid) {
            socket.emit(serverNotif, `That username is ${isInValid}`)
          } else {
            socket.rooms.size === 2 && io.in([...socket.rooms][1]).emit(serverNotif, `${socket.username}'s name is now ${resp.message}`)
            socket.username = resp.message
          }
        } else if (command === 'hint') {
          const hintArr = [
            'hint: press up / down arrows to cycle through previous commands',
            'drink water to increase lifespan by up to three days!'
          ]

          socket.emit(serverNotif, hintArr[(Math.random() * hintArr.length) | 0])
        } else if (command === 'help')
          socket.emit(serverNotif, 'available commands: /setname [NAME], /yell [MESSAGE], /hint')
      } else {
        socket.rooms.size === 2 && io.in([...socket.rooms][1]).emit('message', resp)

        if (resp.message === 'hi') socket.emit(serverNotif, `Hello, ${resp.sender}. ^_^`)
        else if (resp.message === 'bye') socket.emit(serverNotif, `Goodbye, ${resp.sender}. ^_^`)
        else if (['copious', 'rawr', 'uwu'].includes(resp.message)) socket.emit(serverNotif, `You are banned for this: "${resp.message}". (lol jk)`)
      }
    })
  }

  // console.log('Outer functions initialized')

  io.sockets.on('connection', socket => {
    // console.log('new socket connection made')

    socket.on('login', m => {
      const isInvalid = checkValidity(m.username = sanitize(m.username))

      isInvalid ?
        socket.emit('login_fail', `That username is ${isInvalid}`)
        : initializeSocket(socket, m.username.trim(), [defaultRoom])
    })

    socket.on('reconnect', uID =>
      attemptReconnect(socket, uID) ?
        socket.emit(serverNotif, `Welcome back, ${socket.username}! ^_^`)
        : socket.emit('reconnect_fail', 'reconnect_failed - 404'))
  });

  console.log(`---- ${title} Initialized ----`)
  server.listen(port, () => console.log(`\n>> Server active on local port ${port}\n`));
}