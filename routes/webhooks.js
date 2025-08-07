const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Process incoming webhook payloads
router.post('/process', async (req, res) => {
  try {
    const payload = req.body;
    console.log('Received webhook payload:', JSON.stringify(payload, null, 2));

    // Handle different types of webhook payloads
    if (payload.entry && payload.entry.length > 0) {
      for (const entry of payload.entry) {
        if (entry.changes && entry.changes.length > 0) {
          for (const change of entry.changes) {
            if (change.value && change.value.messages) {
              // Process new messages
              for (const message of change.value.messages) {
                await processMessage(message);
              }
            }
            
            if (change.value && change.value.statuses) {
              // Process status updates
              for (const status of change.value.statuses) {
                await processStatusUpdate(status);
              }
            }
          }
        }
      }
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Error processing webhook:', error);
    res.status(500).json({ error: 'Failed to process webhook' });
  }
});

// Process individual message
async function processMessage(message) {
  try {
    const messageData = {
      id: message.id,
      meta_msg_id: message.id,
      wa_id: message.from,
      from: message.from,
      to: message.to || 'unknown',
      timestamp: new Date(parseInt(message.timestamp) * 1000),
      type: message.type,
      status: 'sent',
      isOutgoing: false
    };

    // Handle different message types
    switch (message.type) {
      case 'text':
        messageData.text = { body: message.text.body };
        break;
      case 'image':
        messageData.image = {
          id: message.image.id,
          mime_type: message.image.mime_type,
          sha256: message.image.sha256,
          caption: message.image.caption
        };
        break;
      case 'audio':
        messageData.audio = {
          id: message.audio.id,
          mime_type: message.audio.mime_type,
          sha256: message.audio.sha256,
          voice: message.audio.voice
        };
        break;
      case 'video':
        messageData.video = {
          id: message.video.id,
          mime_type: message.video.mime_type,
          sha256: message.video.sha256,
          caption: message.video.caption
        };
        break;
      case 'document':
        messageData.document = {
          id: message.document.id,
          mime_type: message.document.mime_type,
          sha256: message.document.sha256,
          filename: message.document.filename,
          caption: message.document.caption
        };
        break;
      case 'location':
        messageData.location = {
          latitude: message.location.latitude,
          longitude: message.location.longitude,
          name: message.location.name,
          address: message.location.address
        };
        break;
      case 'contact':
        messageData.contact = message.contact;
        break;
      case 'sticker':
        messageData.sticker = {
          id: message.sticker.id,
          mime_type: message.sticker.mime_type,
          sha256: message.sticker.sha256
        };
        break;
    }

    // Add user info if available
    if (message.context && message.context.from) {
      messageData.userInfo = {
        name: message.context.from.name || 'Unknown',
        number: message.from
      };
    }

    // Check if message already exists
    const existingMessage = await Message.findOne({ id: message.id });
    if (!existingMessage) {
      const newMessage = new Message(messageData);
      await newMessage.save();
      
      // Emit real-time update
      const io = req.app.get('io');
      if (io) {
        io.to(message.from).emit('new-message', newMessage);
      }
      
      console.log('New message saved:', message.id);
    }
  } catch (error) {
    console.error('Error processing message:', error);
  }
}

// Process status updates
async function processStatusUpdate(status) {
  try {
    const messageId = status.id;
    const newStatus = status.status;

    const message = await Message.findOneAndUpdate(
      { $or: [{ id: messageId }, { meta_msg_id: messageId }] },
      { status: newStatus },
      { new: true }
    );

    if (message) {
      // Emit real-time status update
      const io = req.app.get('io');
      if (io) {
        io.to(message.wa_id).emit('message-status-update', {
          messageId: message.id,
          status: message.status
        });
      }
      
      console.log(`Message status updated: ${messageId} -> ${newStatus}`);
    }
  } catch (error) {
    console.error('Error processing status update:', error);
  }
}

// Webhook verification endpoint
router.get('/verify', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  // Verify token (you should set this in your WhatsApp Business API)
  const verifyToken = process.env.WHATSAPP_VERIFY_TOKEN || 'your_verify_token';

  if (mode === 'subscribe' && token === verifyToken) {
    console.log('Webhook verified');
    res.status(200).send(challenge);
  } else {
    res.status(403).send('Forbidden');
  }
});

module.exports = router;
