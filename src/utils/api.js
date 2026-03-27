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
  }
};
