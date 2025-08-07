const fs = require('fs-extra');
const path = require('path');
const mongoose = require('mongoose');
const Message = require('../models/Message');
require('dotenv').config();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/whatsapp', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('Connected to MongoDB for webhook processing'))
.catch(err => console.error('MongoDB connection error:', err));

// Process webhook payloads from JSON files
async function processWebhookFiles() {
  try {
    const webhooksDir = path.join(__dirname, '..', 'webhooks');
    
    // Check if webhooks directory exists
    if (!await fs.pathExists(webhooksDir)) {
      console.log('Webhooks directory not found. Creating sample data...');
      await createSampleData();
      return;
    }

    const files = await fs.readdir(webhooksDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));

    console.log(`Found ${jsonFiles.length} JSON files to process`);

    for (const file of jsonFiles) {
      console.log(`Processing ${file}...`);
      const filePath = path.join(webhooksDir, file);
      const payload = await fs.readJson(filePath);
      
      await processWebhookPayload(payload);
    }

    console.log('All webhook files processed successfully!');
  } catch (error) {
    console.error('Error processing webhook files:', error);
  } finally {
    mongoose.connection.close();
  }
}

// Process a single webhook payload
async function processWebhookPayload(payload) {
  try {
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
  } catch (error) {
    console.error('Error processing webhook payload:', error);
  }
}

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
      console.log('New message saved:', message.id);
    } else {
      console.log('Message already exists:', message.id);
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
      console.log(`Message status updated: ${messageId} -> ${newStatus}`);
    } else {
      console.log(`Message not found for status update: ${messageId}`);
    }
  } catch (error) {
    console.error('Error processing status update:', error);
  }
}

// Create sample data if no webhook files exist
async function createSampleData() {
  try {
    console.log('Creating sample WhatsApp data...');

    const sampleMessages = [
      {
        id: 'sample_1',
        meta_msg_id: 'sample_1',
        wa_id: '919876543210',
        from: '919876543210',
        to: '919876543211',
        timestamp: new Date(Date.now() - 3600000), // 1 hour ago
        type: 'text',
        text: { body: 'Hey! How are you doing?' },
        status: 'read',
        isOutgoing: false,
        userInfo: { name: 'John Doe', number: '919876543210' }
      },
      {
        id: 'sample_2',
        meta_msg_id: 'sample_2',
        wa_id: '919876543210',
        from: '919876543211',
        to: '919876543210',
        timestamp: new Date(Date.now() - 3000000), // 50 minutes ago
        type: 'text',
        text: { body: 'I\'m doing great! Thanks for asking. How about you?' },
        status: 'read',
        isOutgoing: true,
        userInfo: { name: 'Demo User', number: '919876543211' }
      },
      {
        id: 'sample_3',
        meta_msg_id: 'sample_3',
        wa_id: '919876543210',
        from: '919876543210',
        to: '919876543211',
        timestamp: new Date(Date.now() - 2400000), // 40 minutes ago
        type: 'text',
        text: { body: 'Pretty good! Working on some interesting projects.' },
        status: 'delivered',
        isOutgoing: false,
        userInfo: { name: 'John Doe', number: '919876543210' }
      },
      {
        id: 'sample_4',
        meta_msg_id: 'sample_4',
        wa_id: '919876543211',
        from: '919876543211',
        to: '919876543212',
        timestamp: new Date(Date.now() - 1800000), // 30 minutes ago
        type: 'text',
        text: { body: 'Hello! Are you available for a quick call?' },
        status: 'sent',
        isOutgoing: false,
        userInfo: { name: 'Alice Smith', number: '919876543211' }
      },
      {
        id: 'sample_5',
        meta_msg_id: 'sample_5',
        wa_id: '919876543211',
        from: '919876543212',
        to: '919876543211',
        timestamp: new Date(Date.now() - 1200000), // 20 minutes ago
        type: 'text',
        text: { body: 'Sure! I\'ll call you in 5 minutes.' },
        status: 'read',
        isOutgoing: true,
        userInfo: { name: 'Bob Johnson', number: '919876543212' }
      }
    ];

    for (const messageData of sampleMessages) {
      const existingMessage = await Message.findOne({ id: messageData.id });
      if (!existingMessage) {
        const newMessage = new Message(messageData);
        await newMessage.save();
        console.log('Sample message saved:', messageData.id);
      }
    }

    console.log('Sample data created successfully!');
  } catch (error) {
    console.error('Error creating sample data:', error);
  }
}

// Run the script
if (require.main === module) {
  processWebhookFiles();
}

module.exports = { processWebhookFiles, processWebhookPayload };
