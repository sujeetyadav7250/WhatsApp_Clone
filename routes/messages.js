const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// Get all conversations (grouped by wa_id)
router.get('/conversations', async (req, res) => {
  try {
    const conversations = await Message.aggregate([
      {
        $group: {
          _id: '$wa_id',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          userInfo: { $first: '$userInfo' }
        }
      },
      {
        $sort: { 'lastMessage.timestamp': -1 }
      }
    ]);

    res.json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
});

// Get messages for a specific user (wa_id)
router.get('/conversation/:waId', async (req, res) => {
  try {
    const { waId } = req.params;
    const messages = await Message.find({ wa_id: waId })
      .sort({ timestamp: 1 })
      .limit(100);

    res.json(messages);
  } catch (error) {
    console.error('Error fetching messages:', error);
    res.status(500).json({ error: 'Failed to fetch messages' });
  }
});

// Send a new message (demo - for storage only)
router.post('/send', async (req, res) => {
  try {
    const { waId, message, userInfo } = req.body;
    
    if (!waId || !message) {
      return res.status(400).json({ error: 'waId and message are required' });
    }

    const newMessage = new Message({
      id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      meta_msg_id: `demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      wa_id: waId,
      from: 'demo_user',
      to: waId,
      timestamp: new Date(),
      type: 'text',
      text: { body: message },
      status: 'sent',
      isOutgoing: true,
      userInfo: userInfo || { name: 'Demo User', number: 'demo' }
    });

    const savedMessage = await newMessage.save();

    // Emit real-time update
    const io = req.app.get('io');
    io.to(waId).emit('new-message', savedMessage);

    res.json(savedMessage);
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
});

// Update message status
router.put('/status/:messageId', async (req, res) => {
  try {
    const { messageId } = req.params;
    const { status } = req.body;

    const message = await Message.findOneAndUpdate(
      { $or: [{ id: messageId }, { meta_msg_id: messageId }] },
      { status },
      { new: true }
    );

    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    // Emit real-time status update
    const io = req.app.get('io');
    io.to(message.wa_id).emit('message-status-update', {
      messageId: message.id,
      status: message.status
    });

    res.json(message);
  } catch (error) {
    console.error('Error updating message status:', error);
    res.status(500).json({ error: 'Failed to update message status' });
  }
});

module.exports = router;
