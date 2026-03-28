/**
 * API service for anonymous messaging logic.
 * This encapsulates fetch calls to the backend.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  /**
   * Sends an anonymous message via the API.
   * @param {Object} messageData { recipientId, senderId, text }
   */
  async sendMessage(messageData) {
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(messageData),
      });

      if (!response.ok) {
        throw new Error('Failed to send message via API');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (sendMessage):', error);
      throw error;
    }
  },

  /**
   * Fetches messages for a specific user from the API.
   * @param {string} userId
   */
  async getMessages(userId) {
    try {
      const response = await fetch(`${API_URL}/messages?recipientId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch messages from API');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error (getMessages):', error);
      throw error;
    }
  },

  /**
   * Reports a message
   * @param {Object} reportData { messageId, recipientId, text, senderId }
   */
  async reportMessage(reportData) {
    try {
      const response = await fetch(`${API_URL}/messages/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(reportData),
      });

      if (!response.ok) {
        throw new Error('Failed to report message via API');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (reportMessage):', error);
      throw error;
    }
  },

  /**
   * Likes a message
   * @param {string} recipientId
   * @param {string} messageId
   */
  async likeMessage(recipientId, messageId) {
    try {
      const response = await fetch(`${API_URL}/messages/like`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId, messageId }),
      });

      if (!response.ok) {
        throw new Error('Failed to like message via API');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (likeMessage):', error);
      throw error;
    }
  },

  /**
   * Reacts to a message with an emoji.
   * @param {string} recipientId
   * @param {string} messageId
   * @param {string} reaction
   */
  async reactToMessage(recipientId, messageId, reaction) {
    try {
      const response = await fetch(`${API_URL}/messages/react`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId, messageId, reaction }),
      });

      if (!response.ok) {
        throw new Error('Failed to react via API');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (reactToMessage):', error);
      throw error;
    }
  },

  /**
   * Marks all messages for a recipient as read.
   * @param {string} recipientId
   */
  async markAllAsRead(recipientId) {
    try {
      const response = await fetch(`${API_URL}/messages/read-all`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ recipientId }),
      });

      if (!response.ok) {
        throw new Error('Failed to mark all as read via API');
      }

      return await response.json();
    } catch (error) {
      console.error('API Error (markAllAsRead):', error);
      throw error;
    }
  },

  /**
   * Fetches notifications for a sender.
   * @param {string} senderId
   */
  async getNotifications(senderId) {
    try {
      const response = await fetch(`${API_URL}/notifications?senderId=${senderId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch notifications via API');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error (getNotifications):', error);
      throw error;
    }
  },

  /**
   * Clears notifications for a sender.
   * @param {string} senderId
   */
  async clearNotifications(senderId) {
    try {
      const response = await fetch(`${API_URL}/notifications?senderId=${senderId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('Failed to clear notifications via API');
      }
      return await response.json();
    } catch (error) {
      console.error('API Error (clearNotifications):', error);
      throw error;
    }
  }
};
