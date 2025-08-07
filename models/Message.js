const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true,
    unique: true
  },
  meta_msg_id: {
    type: String,
    required: true
  },
  wa_id: {
    type: String,
    required: true,
    index: true
  },
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true,
    default: Date.now
  },
  type: {
    type: String,
    required: true,
    enum: ['text', 'image', 'audio', 'video', 'document', 'location', 'contact', 'sticker']
  },
  text: {
    body: String
  },
  image: {
    id: String,
    mime_type: String,
    sha256: String,
    caption: String
  },
  audio: {
    id: String,
    mime_type: String,
    sha256: String,
    voice: Boolean
  },
  video: {
    id: String,
    mime_type: String,
    sha256: String,
    caption: String
  },
  document: {
    id: String,
    mime_type: String,
    sha256: String,
    filename: String,
    caption: String
  },
  location: {
    latitude: Number,
    longitude: Number,
    name: String,
    address: String
  },
  contact: {
    name: {
      formatted_name: String,
      first_name: String,
      last_name: String
    },
    phones: [{
      phone: String,
      type: String
    }],
    emails: [{
      email: String,
      type: String
    }]
  },
  sticker: {
    id: String,
    mime_type: String,
    sha256: String
  },
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  isOutgoing: {
    type: Boolean,
    default: false
  },
  userInfo: {
    name: String,
    number: String
  }
}, {
  timestamps: true
});

// Index for efficient queries
messageSchema.index({ wa_id: 1, timestamp: -1 });
messageSchema.index({ meta_msg_id: 1 });

module.exports = mongoose.model('Message', messageSchema, 'processed_messages');
