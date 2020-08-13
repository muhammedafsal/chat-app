const socket = io()     

const $messageForm = document.querySelector('#message-form')
const $messageInputText = document.getElementById('message')
const $messageInputBtn = document.getElementById('myButton')
const $locationButton = document.getElementById('send-location')
const $messages = document.getElementById('messages')
const $sideBar = document.getElementById('sideBar')


// Templates
const messageTemplate = document.getElementById('message-template').innerHTML
const locationTemplate = document.getElementById('location-template').innerHTML
const sideBarTemplate = document.getElementById('sidebar-template').innerHTML



// Option QS
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix : true})

socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
    console.log('Joined')
})


socket.on('fromServer', (message) => {
    console.log(message.text, message.createdAt)
})


// auto scroll functionality
const autoScroll = () => {
    // new message element
    const $newMessage = $messages.lastElementChild

    // hight of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin
    
    // visible height
    const visibleHeight = $messages.offsetHeight

    // height of message container
    const containerHeight = $messages.scrollHeight

    // how far I have scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight

    // scrolling logic
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('textMessage', (message) => {
    const html = Mustache.render(messageTemplate, 
        {
            username : message.username,
            message : message.text, 
            createdAt : moment(message.createdAt).format('h:mm a')
        })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})


socket.on('locationMessage', (url) => {
    const html = Mustache.render(locationTemplate, 
        {
            username : url.username,
            url : url.text,
            createdAt : moment(url.createdAt).format('h:mm a')
        })
    $messages.insertAdjacentHTML('beforeend', html)
    autoScroll()
})

socket.on('roomData', ({room, users}) => {
    const html = Mustache.render(sideBarTemplate, { room, users })
    $sideBar.innerHTML = html
})



const msgButton = (e) => {
    e.preventDefault()
    $messageInputBtn.setAttribute('disabled', 'disabled')
    const messsage = $messageInputText.value

    socket.emit('sendMessage', messsage, (error) => {
        $messageInputBtn.removeAttribute('disabled')
        $messageInputText.value = ''
        $messageInputText.focus()
        if(error)
            return console.log(error)
        console.log('Message delivered')    
    })
}

const locationButton = () => {
    if(!navigator.geolocation) 
        return alert("Geolocation is not supporetd")

    $locationButton.setAttribute('disabled', 'disabled')    
    navigator.geolocation.getCurrentPosition((position) => {
        const {latitude, longitude} = position.coords
        const data = {latitude, longitude}

        socket.emit('sendLocation', data, (msg) => {
            $locationButton.removeAttribute('disabled')
            console.log(msg)
        })
    })
        
}

$messageForm.addEventListener("submit", msgButton)
$locationButton.addEventListener("click", locationButton);
