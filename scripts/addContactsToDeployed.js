const mongoose = require('mongoose');
const Message = require('../models/Message');
require('dotenv').config();

async function addContactsToDeployed() {
  try {
    // Use the production MongoDB connection string
    const mongoUri = 'mongodb+srv://sy340190:sujeet12345@cluster0.lyzoqy2.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0';
    
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('Connected to deployed MongoDB for adding sample contacts');

    const sampleContacts = [
      {
        wa_id: '919876543210',
        name: 'John Doe',
        number: '+91 98765 43210',
        lastMessage: 'Hey, how are you?'
      },
      {
        wa_id: '919876543211',
        name: 'Sarah Wilson',
        number: '+91 98765 43211',
        lastMessage: 'Meeting at 3 PM today'
      },
      {
        wa_id: '919876543212',
        name: 'Mike Johnson',
        number: '+91 98765 43212',
        lastMessage: 'Thanks for the help!'
      },
      {
        wa_id: '919876543213',
        name: 'Emma Davis',
        number: '+91 98765 43213',
        lastMessage: 'Can you send the files?'
      },
      {
        wa_id: '919876543214',
        name: 'Alex Brown',
        number: '+91 98765 43214',
        lastMessage: 'Great work on the project!'
      },
      {
        wa_id: '919876543215',
        name: 'Lisa Garcia',
        number: '+91 98765 43215',
        lastMessage: 'Happy birthday! 🎉'
      },
      {
        wa_id: '919876543216',
        name: 'David Miller',
        number: '+91 98765 43216',
        lastMessage: 'See you tomorrow'
      },
      {
        wa_id: '919876543217',
        name: 'Anna Taylor',
        number: '+91 98765 43217',
        lastMessage: 'The presentation was excellent'
      }
    ];

    for (const contact of sampleContacts) {
      // Create a sample message for each contact
      const messageData = {
        id: `deployed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        meta_msg_id: `deployed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        wa_id: contact.wa_id,
        from: contact.wa_id,
        to: 'demo_user',
        timestamp: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000), // Random time in last 7 days
        type: 'text',
        text: { body: contact.lastMessage },
        status: 'read',
        isOutgoing: false,
        userInfo: { name: contact.name, number: contact.number }
      };

      const existingMessage = await Message.findOne({ wa_id: contact.wa_id });
      if (!existingMessage) {
        const newMessage = new Message(messageData);
        await newMessage.save();
        console.log(`Added contact to deployed app: ${contact.name} (${contact.wa_id})`);
      } else {
        console.log(`Contact already exists in deployed app: ${contact.name} (${contact.wa_id})`);
      }
    }

    console.log('Sample contacts added to deployed app successfully!');
    console.log('Refresh your deployed app to see the contacts.');
    process.exit(0);
  } catch (error) {
    console.error('Error adding sample contacts to deployed app:', error);
    process.exit(1);
  }
}

addContactsToDeployed();
