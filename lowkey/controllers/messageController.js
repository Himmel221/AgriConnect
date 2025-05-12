import Message from '../models/Message.js';
import User from '../models/User.js';
import mongoose from 'mongoose';

export const getConversations = async (req, res) => {
  const { senderId } = req.params;

  try {
    const senderObjectId = await User.findOne({ userId: senderId }).select('_id'); 
    if (!senderObjectId) {
      return res.status(404).json({ error: 'User not found' });
    }

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { senderId: new mongoose.Types.ObjectId(senderId) },
            { recipientId: new mongoose.Types.ObjectId(senderId) },
          ],
        },
      },
      {
        $group: {
          _id: {
            $cond: [
              { $eq: ['$senderId', senderObjectId._id] },
              '$recipientId',
              '$senderId',
            ],
          },
          latestMessage: { $last: '$$ROOT' },
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'participantDetails',
        },
      },
      {
        $project: {
          _id: 0,
          participantId: '$_id',
          latestMessage: 1,
          participantDetails: { $arrayElemAt: ['$participantDetails', 0] },
        },
      },
    ]);

    res.status(200).json(conversations);
  } catch (error) {
    console.error('Error fetching conversations:', error.message);
    res.status(500).json({ error: 'Failed to fetch conversations' });
  }
};

export const getMessages = async (req, res) => {
  const { senderId, recipientId } = req.params;

  console.log("Raw senderId:", senderId);
  console.log("Raw recipientId:", recipientId);

  try {
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

    console.log("Converted senderId (ObjectId):", senderObjectId);
    console.log("Converted recipientId (ObjectId):", recipientObjectId);

    const messages = await Message.find({
      $or: [
        { senderId: senderObjectId, recipientId: recipientObjectId },
        { senderId: recipientObjectId, recipientId: senderObjectId },
      ],
    }).sort({ timestamp: 1 });

    console.log("Fetched messages:", messages);
    res.status(200).json(messages);
  } catch (error) {
    console.error("Error fetching messages:", error.message);
    res.status(500).json({ error: "Failed to fetch messages" });
  }
};

export const sendMessage = async (req, res) => {
  const { senderId, recipientId, content, imageUrl } = req.body;

  try {
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);
    
    const senderObject = await User.findById(senderObjectId).select("_id isVerified");
    const recipientObject = await User.findById(recipientObjectId).select("_id");
    
    console.log("Sender Found:", senderObject);
    console.log("Recipient Found:", recipientObject);
    console.log("Message data:", { content, imageUrl });

    if (!senderObject || !recipientObject) {
      return res.status(404).json({ error: "User not found" });
    }

    if (!senderObject.isVerified) {
      return res.status(403).json({ error: "Please verify your email address to send messages" });
    }

    const newMessage = new Message({
      senderId: senderObject._id, 
      recipientId: recipientObject._id, 
      content,
      imageUrl,
      timestamp: new Date(),
    });

    await newMessage.save();
    console.log("Saved message:", newMessage);
    res.status(201).json(newMessage);
  } catch (error) {
    console.error("Error creating message:", error.message);
    res.status(500).json({ error: "Failed to send message" });
  }
};

export const addReaction = async (req, res) => {
  const { messageId } = req.params;
  const { emoji, userId } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    const existingReaction = message.reactions.find(
      reaction => reaction.userId.toString() === userId && reaction.emoji === emoji
    );

    if (existingReaction) {
      message.reactions = message.reactions.filter(
        reaction => !(reaction.userId.toString() === userId && reaction.emoji === emoji)
      );
    } else {
      message.reactions.push({ userId, emoji });
    }

    await message.save();
    res.status(200).json(message);
  } catch (error) {
    console.error('Error adding reaction:', error.message);
    res.status(500).json({ error: 'Failed to add reaction' });
  }
};

export const removeReaction = async (req, res) => {
  const { messageId } = req.params;
  const { emoji, userId } = req.body;

  try {
    const message = await Message.findById(messageId);
    if (!message) {
      return res.status(404).json({ error: 'Message not found' });
    }

    message.reactions = message.reactions.filter(
      reaction => !(reaction.userId.toString() === userId && reaction.emoji === emoji)
    );

    await message.save();
    res.status(200).json(message);
  } catch (error) {
    console.error('Error removing reaction:', error.message);
    res.status(500).json({ error: 'Failed to remove reaction' });
  }
};

export const markMessagesAsRead = async (req, res) => {
  const { senderId, recipientId } = req.params;

  try {
    const senderObjectId = new mongoose.Types.ObjectId(senderId);
    const recipientObjectId = new mongoose.Types.ObjectId(recipientId);

    const result = await Message.updateMany(
      {
        senderId: recipientObjectId,
        recipientId: senderObjectId,
        isRead: false
      },
      {
        $set: { isRead: true }
      }
    );

    console.log("Marked messages as read:", result);
    res.status(200).json({ message: "Messages marked as read", updatedCount: result.modifiedCount });
  } catch (error) {
    console.error("Error marking messages as read:", error.message);
    res.status(500).json({ error: "Failed to mark messages as read" });
  }
};
