$(document).ready(() => {
  const localhost = 0
  const socket = localhost ? io() : io('https://basic-node-chat-deploy.herokuapp.com/')
  const usernameInput = document.querySelector('#username-input')
  const messageInput = document.querySelector('#message-input')
  const messageContainer = document.querySelector('#message-container')
  const sendMessageButton = document.querySelector('#send-message-button')
  const loginStatus = document.querySelector('#login-status')
  const connectionStatus = document.querySelector('#connection-status')
  const commandHistory = []

  let commandIndex = 0
  let uID = localStorage && localStorage.getItem('node-chat-userID')

  function sendMessage(message) {
    socket.emit('message', message)

    commandHistory[commandHistory.length - 1] = message
    commandHistory.push('')

    commandIndex = commandHistory.length - 1
    messageInput.value = ''
  }

  function addMessage(m, isServer) {
    const id = Date.now() + Math.random().toString(16).substr(2, 8)
    const stickToBottom = messageContainer.scrollTop >= messageContainer.scrollHeight - messageContainer.offsetHeight

    messageContainer.innerHTML += isServer ?
      `<span class='text-center' id='${id}'>${m}</span>`
      : `<span>
          ${m.sender}
          <span class="mini">#${m.uID}</span> | <time datetime="${Date.now()}">${(new Date().toLocaleTimeString())}</time>
        </span>
        <p id="${id}"${(m.uID === uID ? ' class="my-message"' : '')}>
          ${m.message}
        </p>`

    m.yelling && document.getElementById(id).classList.add('yelling')

    if (stickToBottom) messageContainer.scrollTop = messageContainer.scrollHeight
  }

  $('#my-modal').modal({ backdrop: 'static', keyboard: false })
  $('#my-modal').on('shown.bs.modal', () => usernameInput.focus())

  socket.on('login_fail', m => {
    loginStatus.classList.add('text-danger')
    loginStatus.classList.remove('invisible')
    loginStatus.innerHTML = m
  })
  socket.on('authenticated', m => {
   connectionStatus.classList.remove('text-warning')
   connectionStatus.classList.add('text-success')
   connectionStatus.innerHTML = '&#9679; online'

    $('#my-modal').modal('hide')
    messageInput.focus()

    localStorage.setItem('node-chat-userID', m.id)
    socket.confirmed = true
  })
  socket.on('reconnect_fail', () => {
    localStorage.removeItem('node-chat-userID')
    $('#my-modal').modal('show')
  })
  socket.on('server_notif', m => addMessage(m, 1))
  socket.on('message', m => addMessage(m))

  uID ? socket.emit('reconnect', uID) : $('#my-modal').modal('show')

  usernameInput.addEventListener('keyup', (event) => {
    loginStatus.classList.remove('text-danger')
    loginStatus.classList.add('invisible')

    event.key === 'Enter' && socket.emit('login', { username: usernameInput.value })
  })

  messageInput.addEventListener('keydown', event => {
    if (event.key === 'Enter')
      sendMessage(messageInput.value)
    else if (event.key === 'ArrowUp' && messageInput.selectionStart === 0)
      messageInput.value = commandHistory[commandIndex = Math.max(0, --commandIndex)]
    else if (event.key === 'ArrowDown' && messageInput.selectionStart === messageInput.value.length)
      messageInput.value = commandHistory[commandIndex = Math.min(commandHistory.length - 1, ++commandIndex)]
    else
      commandHistory[commandIndex] = messageInput.value
  })

  sendMessageButton.addEventListener('click', () => sendMessage(messageInput.value))
})