// Global variables
let socket;
let currentChat = null;
let conversations = [];
let messages = {};

// DOM elements
const loadingOverlay = document.getElementById('loadingOverlay');
const chatList = document.getElementById('chatList');
const welcomeScreen = document.getElementById('welcomeScreen');
const chatInterface = document.getElementById('chatInterface');
const messagesContainer = document.getElementById('messagesContainer');
const messageInput = document.getElementById('messageInput');
const sendBtn = document.getElementById('sendBtn');
const searchInput = document.getElementById('searchInput');
const chatUserName = document.getElementById('chatUserName');
const chatUserStatus = document.getElementById('chatUserStatus');

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    initializeSocket();
    loadConversations();
    setupEventListeners();
    hideLoading();
});

// Initialize Socket.IO connection
function initializeSocket() {
    socket = io();
    
    socket.on('connect', () => {
        console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
        console.log('Disconnected from server');
    });
    
    // Listen for new messages
    socket.on('new-message', (message) => {
        handleNewMessage(message);
    });
    
    // Listen for status updates
    socket.on('message-status-update', (update) => {
        handleStatusUpdate(update);
    });
}

// Setup event listeners
function setupEventListeners() {
    // Send message on Enter key
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
    
    // Send message on button click
    sendBtn.addEventListener('click', sendMessage);
    
    // Search functionality
    searchInput.addEventListener('input', (e) => {
        filterConversations(e.target.value);
    });
}

// Load conversations from API
async function loadConversations() {
    try {
        const response = await fetch('/api/messages/conversations');
        if (!response.ok) throw new Error('Failed to load conversations');
        
        conversations = await response.json();
        renderConversations();
    } catch (error) {
        console.error('Error loading conversations:', error);
        showError('Failed to load conversations');
    }
}

// Render conversations in the sidebar
function renderConversations() {
    chatList.innerHTML = '';
    
    if (conversations.length === 0) {
        chatList.innerHTML = '<div class="no-chats">No conversations yet</div>';
        return;
    }
    
    conversations.forEach(conversation => {
        const chatItem = createChatItem(conversation);
        chatList.appendChild(chatItem);
    });
}

// Create a chat item element
function createChatItem(conversation) {
    const chatItem = document.createElement('div');
    chatItem.className = 'chat-item';
    chatItem.dataset.waId = conversation._id;
    
    const lastMessage = conversation.lastMessage;
    const userInfo = conversation.userInfo || lastMessage.userInfo;
    const messageText = getMessageText(lastMessage);
    const messageTime = formatTime(lastMessage.timestamp);
    
    chatItem.innerHTML = `
        <div class="chat-item-avatar">
            <i class="fas fa-user"></i>
        </div>
        <div class="chat-item-content">
            <div class="chat-item-header">
                <div class="chat-item-name">${userInfo?.name || 'Unknown User'}</div>
                <div class="chat-item-time">${messageTime}</div>
            </div>
            <div class="chat-item-message">${messageText}</div>
        </div>
    `;
    
    chatItem.addEventListener('click', () => {
        selectChat(conversation._id);
    });
    
    return chatItem;
}

// Get message text for display
function getMessageText(message) {
    if (!message) return '';
    
    switch (message.type) {
        case 'text':
            return message.text?.body || '';
        case 'image':
            return '📷 Image' + (message.image?.caption ? `: ${message.image.caption}` : '');
        case 'audio':
            return '🎵 Audio';
        case 'video':
            return '🎥 Video' + (message.video?.caption ? `: ${message.video.caption}` : '');
        case 'document':
            return '📄 Document' + (message.document?.filename ? `: ${message.document.filename}` : '');
        case 'location':
            return '📍 Location';
        case 'contact':
            return '👤 Contact';
        case 'sticker':
            return '😀 Sticker';
        default:
            return '';
    }
}

// Select a chat
async function selectChat(waId) {
    try {
        // Update active state
        document.querySelectorAll('.chat-item').forEach(item => {
            item.classList.remove('active');
        });
        document.querySelector(`[data-wa-id="${waId}"]`)?.classList.add('active');
        
        currentChat = waId;
        
        // Join the chat room for real-time updates
        socket.emit('join-chat', waId);
        
        // Load messages
        await loadMessages(waId);
        
        // Show chat interface
        showChatInterface();
        
        // Update chat header
        updateChatHeader(waId);
        
    } catch (error) {
        console.error('Error selecting chat:', error);
        showError('Failed to load chat');
    }
}

// Load messages for a specific chat
async function loadMessages(waId) {
    try {
        const response = await fetch(`/api/messages/conversation/${waId}`);
        if (!response.ok) throw new Error('Failed to load messages');
        
        const messagesData = await response.json();
        messages[waId] = messagesData;
        renderMessages(waId);
    } catch (error) {
        console.error('Error loading messages:', error);
        showError('Failed to load messages');
    }
}

// Render messages in the chat
function renderMessages(waId) {
    const messagesData = messages[waId] || [];
    messagesContainer.innerHTML = '';
    
    if (messagesData.length === 0) {
        messagesContainer.innerHTML = '<div class="no-messages">No messages yet</div>';
        return;
    }
    
    // Group messages by date
    const groupedMessages = groupMessagesByDate(messagesData);
    
    Object.keys(groupedMessages).forEach(date => {
        // Add date separator
        const dateElement = document.createElement('div');
        dateElement.className = 'message-date';
        dateElement.textContent = formatDate(date);
        messagesContainer.appendChild(dateElement);
        
        // Add messages for this date
        groupedMessages[date].forEach(message => {
            const messageElement = createMessageElement(message);
            messagesContainer.appendChild(messageElement);
        });
    });
    
    // Scroll to bottom
    scrollToBottom();
}

// Group messages by date
function groupMessagesByDate(messages) {
    const grouped = {};
    
    messages.forEach(message => {
        const date = new Date(message.timestamp).toDateString();
        if (!grouped[date]) {
            grouped[date] = [];
        }
        grouped[date].push(message);
    });
    
    return grouped;
}

// Create a message element
function createMessageElement(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${message.isOutgoing ? 'outgoing' : ''}`;
    messageDiv.dataset.messageId = message.id;
    
    const messageText = getMessageText(message);
    const messageTime = formatTime(message.timestamp);
    const statusIcon = getStatusIcon(message.status);
    
    messageDiv.innerHTML = `
        <div class="message-content">
            <div class="message-text">${escapeHtml(messageText)}</div>
            <div class="message-time">
                ${messageTime}
                ${message.isOutgoing ? `<span class="message-status ${message.status}">${statusIcon}</span>` : ''}
            </div>
        </div>
    `;
    
    return messageDiv;
}

// Get status icon
function getStatusIcon(status) {
    switch (status) {
        case 'sent':
            return '✓';
        case 'delivered':
            return '✓✓';
        case 'read':
            return '✓✓';
        default:
            return '';
    }
}

// Send a new message
async function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentChat) return;
    
    try {
        const response = await fetch('/api/messages/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                waId: currentChat,
                message: message,
                userInfo: {
                    name: 'Demo User',
                    number: 'demo'
                }
            })
        });
        
        if (!response.ok) throw new Error('Failed to send message');
        
        const sentMessage = await response.json();
        
        // Add message to local state
        if (!messages[currentChat]) {
            messages[currentChat] = [];
        }
        messages[currentChat].push(sentMessage);
        
        // Clear input
        messageInput.value = '';
        
        // Re-render messages
        renderMessages(currentChat);
        
    } catch (error) {
        console.error('Error sending message:', error);
        showError('Failed to send message');
    }
}

// Handle new message from socket
function handleNewMessage(message) {
    if (!messages[message.wa_id]) {
        messages[message.wa_id] = [];
    }
    
    // Check if message already exists
    const existingIndex = messages[message.wa_id].findIndex(m => m.id === message.id);
    if (existingIndex === -1) {
        messages[message.wa_id].push(message);
        
        // Update conversations list
        updateConversationInList(message);
        
        // If this is the current chat, re-render messages
        if (currentChat === message.wa_id) {
            renderMessages(currentChat);
        }
    }
}

// Handle status update from socket
function handleStatusUpdate(update) {
    if (messages[currentChat]) {
        const messageIndex = messages[currentChat].findIndex(m => m.id === update.messageId);
        if (messageIndex !== -1) {
            messages[currentChat][messageIndex].status = update.status;
            
            // Update the message element
            const messageElement = document.querySelector(`[data-message-id="${update.messageId}"]`);
            if (messageElement) {
                const statusElement = messageElement.querySelector('.message-status');
                if (statusElement) {
                    statusElement.textContent = getStatusIcon(update.status);
                    statusElement.className = `message-status ${update.status}`;
                }
            }
        }
    }
}

// Update conversation in the list
function updateConversationInList(message) {
    const conversationIndex = conversations.findIndex(c => c._id === message.wa_id);
    
    if (conversationIndex !== -1) {
        // Update existing conversation
        conversations[conversationIndex].lastMessage = message;
    } else {
        // Add new conversation
        conversations.unshift({
            _id: message.wa_id,
            lastMessage: message,
            messageCount: 1,
            userInfo: message.userInfo
        });
    }
    
    // Re-render conversations
    renderConversations();
}

// Update chat header
function updateChatHeader(waId) {
    const conversation = conversations.find(c => c._id === waId);
    if (conversation) {
        const userInfo = conversation.userInfo || conversation.lastMessage.userInfo;
        chatUserName.textContent = userInfo?.name || 'Unknown User';
        chatUserStatus.textContent = 'online';
    }
}

// Show chat interface
function showChatInterface() {
    welcomeScreen.style.display = 'none';
    chatInterface.style.display = 'flex';
}

// Filter conversations
function filterConversations(searchTerm) {
    const chatItems = document.querySelectorAll('.chat-item');
    
    chatItems.forEach(item => {
        const name = item.querySelector('.chat-item-name').textContent.toLowerCase();
        const message = item.querySelector('.chat-item-message').textContent.toLowerCase();
        const search = searchTerm.toLowerCase();
        
        if (name.includes(search) || message.includes(search)) {
            item.style.display = 'flex';
        } else {
            item.style.display = 'none';
        }
    });
}

// Utility functions
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now - date) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
}

function formatDate(dateString) {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    if (date.toDateString() === today.toDateString()) {
        return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
        return 'Yesterday';
    } else {
        return date.toLocaleDateString();
    }
}

function scrollToBottom() {
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function hideLoading() {
    loadingOverlay.style.display = 'none';
}

function showError(message) {
    // You can implement a proper error notification system here
    console.error(message);
    alert(message);
}
