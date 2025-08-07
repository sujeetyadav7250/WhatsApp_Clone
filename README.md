# WhatsApp Web Clone

A real-time WhatsApp Web clone built with Node.js, Express, Socket.IO, and MongoDB. This application simulates WhatsApp Web functionality with webhook processing, real-time messaging, and a responsive UI.

## Features

### ✅ Core Features
- **Real-time messaging** using Socket.IO
- **WhatsApp-like UI** with responsive design
- **Webhook processing** for WhatsApp Business API payloads
- **Message status tracking** (sent, delivered, read)
- **Conversation management** with search functionality
- **Mobile-friendly** responsive design
- **Message types support** (text, image, audio, video, document, location, contact, sticker)

### ✅ Technical Features
- **MongoDB integration** with Mongoose ODM
- **RESTful API** endpoints
- **Real-time updates** via WebSocket
- **Webhook payload processing**
- **Sample data generation**
- **Status indicators** for messages
- **Date grouping** for messages
- **Search and filter** conversations

## Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (MongoDB Atlas)
- **Real-time**: Socket.IO
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla)
- **Styling**: Custom CSS with WhatsApp-like design
- **Icons**: Font Awesome
- **Fonts**: Inter (Google Fonts)

## Prerequisites

- Node.js (v14 or higher)
- MongoDB Atlas account (or local MongoDB)
- npm or yarn package manager

## Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd whatsapp-web-clone
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` file with your MongoDB connection string:
   ```
   MONGODB_URI=mongodb+srv://your-username:your-password@your-cluster.mongodb.net/whatsapp?retryWrites=true&w=majority
   PORT=3000
   NODE_ENV=development
   ```

4. **Set up MongoDB Atlas**
   - Create a MongoDB Atlas account
   - Create a new cluster
   - Get your connection string
   - Update the `.env` file with your connection string

5. **Process sample data**
   ```bash
   npm run process-webhooks
   ```
   This will create sample conversations and messages in your database.

6. **Start the application**
   ```bash
   npm start
   ```
   
   For development with auto-reload:
   ```bash
   npm run dev
   ```

7. **Access the application**
   Open your browser and navigate to `http://localhost:3000`

## API Endpoints

### Messages
- `GET /api/messages/conversations` - Get all conversations
- `GET /api/messages/conversation/:waId` - Get messages for a specific user
- `POST /api/messages/send` - Send a new message
- `PUT /api/messages/status/:messageId` - Update message status

### Webhooks
- `POST /api/webhooks/process` - Process incoming webhook payloads
- `GET /api/webhooks/verify` - Webhook verification endpoint

## Webhook Processing

The application can process WhatsApp Business API webhook payloads. To use with real webhook data:

1. **Place webhook JSON files** in the `webhooks/` directory
2. **Run the processing script**:
   ```bash
   npm run process-webhooks
   ```

3. **Or send webhook payloads** to the API endpoint:
   ```bash
   POST /api/webhooks/process
   ```

## Real-time Features

- **Live message updates** via Socket.IO
- **Status updates** (sent → delivered → read)
- **New conversation detection**
- **Real-time chat room joining**

## Deployment

### Option 1: Render (Recommended)

1. **Create a Render account**
2. **Connect your GitHub repository**
3. **Configure the service**:
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add your `MONGODB_URI`

### Option 2: Heroku

1. **Install Heroku CLI**
2. **Create Heroku app**:
   ```bash
   heroku create your-app-name
   ```
3. **Set environment variables**:
   ```bash
   heroku config:set MONGODB_URI=your-mongodb-uri
   ```
4. **Deploy**:
   ```bash
   git push heroku main
   ```

### Option 3: Vercel

1. **Install Vercel CLI**
2. **Deploy**:
   ```bash
   vercel
   ```

## Project Structure

```
whatsapp-web-clone/
├── public/
│   ├── index.html          # Main HTML file
│   ├── styles.css          # CSS styles
│   └── app.js             # Frontend JavaScript
├── models/
│   └── Message.js         # MongoDB schema
├── routes/
│   ├── messages.js        # Message API routes
│   └── webhooks.js        # Webhook processing routes
├── scripts/
│   └── processWebhooks.js # Webhook processing script
├── server.js              # Main server file
├── package.json           # Dependencies
└── README.md             # This file
```

## Features in Detail

### Message Types Support
- **Text messages** with proper formatting
- **Media messages** (images, audio, video, documents)
- **Location sharing** with coordinates
- **Contact sharing** with phone numbers
- **Stickers** and emojis

### UI Features
- **Responsive design** for mobile and desktop
- **WhatsApp-like styling** with proper colors and fonts
- **Message bubbles** with different styles for incoming/outgoing
- **Status indicators** (✓, ✓✓, ✓✓ for read)
- **Date separators** in conversations
- **Search functionality** for conversations
- **Loading states** and error handling

### Real-time Features
- **Instant message delivery** via WebSocket
- **Live status updates** for message delivery
- **Real-time conversation updates**
- **Automatic scrolling** to latest messages

## Customization

### Adding New Message Types
1. Update the `Message.js` schema
2. Modify the webhook processing in `routes/webhooks.js`
3. Update the frontend display logic in `app.js`

### Styling Changes
- Edit `public/styles.css` for visual changes
- Modify color variables for theme customization
- Update responsive breakpoints as needed

### Database Schema
The main collection is `processed_messages` with the following structure:
- `id`: Unique message identifier
- `meta_msg_id`: WhatsApp message ID
- `wa_id`: WhatsApp user ID
- `from/to`: Message sender/receiver
- `timestamp`: Message timestamp
- `type`: Message type (text, image, etc.)
- `status`: Message status (sent, delivered, read)
- `isOutgoing`: Boolean for message direction
- `userInfo`: User information object

## Troubleshooting

### Common Issues

1. **MongoDB Connection Error**
   - Check your connection string in `.env`
   - Ensure your IP is whitelisted in MongoDB Atlas
   - Verify network connectivity

2. **Socket.IO Connection Issues**
   - Check if the server is running
   - Verify CORS settings
   - Check browser console for errors

3. **Webhook Processing Errors**
   - Ensure JSON files are valid
   - Check file permissions
   - Verify MongoDB connection

### Development Tips

- Use `npm run dev` for development with auto-reload
- Check browser console for frontend errors
- Monitor server logs for backend issues
- Use MongoDB Compass for database inspection

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- Check the troubleshooting section
- Review the API documentation
- Test with the sample data first

---

**Note**: This is a demonstration project. No real WhatsApp messages are sent or received. The application simulates WhatsApp Web functionality for educational purposes.
