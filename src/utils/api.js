/**
 * API service for anonymous messaging logic.
 * This encapsulates fetch calls to the backend.
 */

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

export const api = {
  /**
   * Sends an anonymous message via the API.
   * @param {Object} messageData { recipientId, senderId, text }
   * @param {string} idToken Firebase ID token for authentication
   */
  async sendMessage(messageData, idToken) {
    try {
      const response = await fetch(`${API_URL}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
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
  },
  /**
   * Fetches warning/block status for the current user.
   * @param {string} userId
   */
  async getMyInfractions(userId) {
    try {
      const response = await fetch(`${API_URL}/my-infractions?userId=${userId}`);
      if (!response.ok) throw new Error('Failed to fetch infractions');
      return await response.json();
    } catch (error) {
      console.error('API Error (getMyInfractions):', error);
      throw error;
    }
  },
  /**
   * Admin: Fetches all reports.
   * @param {string} adminPassword
   */
  async getAdminReports(adminPassword) {
    try {
      const response = await fetch(`${API_URL}/admin/reports`, {
        headers: {
          'Authorization': adminPassword
        }
      });
      if (!response.ok) throw new Error('Unauthorized or failed to fetch reports');
      return await response.json();
    } catch (error) {
      console.error('API Error (getAdminReports):', error);
      throw error;
    }
  },
  /**
   * Admin: Issues a warning to a user.
   * @param {string} adminPassword
   * @param {string} userId
   */
  async issueWarning(adminPassword, userId) {
    try {
      const response = await fetch(`${API_URL}/admin/warning`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminPassword
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to issue warning');
      return await response.json();
    } catch (error) {
      console.error('API Error (issueWarning):', error);
      throw error;
    }
  },
  /**
   * Admin: Blocks a user.
   * @param {string} adminPassword
   * @param {string} userId
   */
  async blockUser(adminPassword, userId) {
    try {
      const response = await fetch(`${API_URL}/admin/block`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminPassword
        },
        body: JSON.stringify({ userId }),
      });
      if (!response.ok) throw new Error('Failed to block user');
      return await response.json();
    } catch (error) {
      console.error('API Error (blockUser):', error);
      throw error;
    }
  },
  /**
   * Admin: Fetches infraction data for a user.
   * @param {string} adminPassword
   * @param {string} userId
   */
  async getInfractions(adminPassword, userId) {
    try {
      const response = await fetch(`${API_URL}/admin/infractions/${userId}`, {
        headers: {
          'Authorization': adminPassword
        }
      });
      if (!response.ok) throw new Error('Failed to fetch infractions');
      return await response.json();
    } catch (error) {
      console.error('API Error (getInfractions):', error);
      throw error;
    }
  },
  /**
   * Admin: Deletes a message from a user's inbox.
   * @param {string} adminPassword
   * @param {string} recipientId
   * @param {string} messageId
   * @param {string} reportId
   */
  async deleteMessage(adminPassword, recipientId, messageId, reportId) {
    try {
      const response = await fetch(`${API_URL}/admin/messages`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': adminPassword
        },
        body: JSON.stringify({ recipientId, messageId, reportId }),
      });
      if (!response.ok) throw new Error('Failed to delete message');
      return await response.json();
    } catch (error) {
      console.error('API Error (deleteMessage):', error);
      throw error;
    }
  },
  /**
   * Admin: Deletes ALL reported messages and clears reports.
   * @param {string} adminPassword
   */
  async deleteAllReportedMessages(adminPassword) {
    try {
      const response = await fetch(`${API_URL}/admin/reports/clear`, {
        method: 'DELETE',
        headers: {
          'Authorization': adminPassword
        }
      });
      if (!response.ok) throw new Error('Failed to clear reported messages');
      return await response.json();
    } catch (error) {
      console.error('API Error (deleteAllReportedMessages):', error);
      throw error;
    }
  },
  /**
   * Throws a new paper ball into the global pool.
   * @param {string} text
   * @param {string} senderId
   */
  async throwPaperBall(text, senderId) {
    try {
      const response = await fetch(`${API_URL}/paper-balls/throw`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text, senderId }),
      });
      if (!response.ok) throw new Error('Failed to throw paper ball');
      return await response.json();
    } catch (error) {
      console.error('API Error (throwPaperBall):', error);
      throw error;
    }
  },
  /**
   * Catches a random paper ball from the global pool.
   */
  async catchPaperBall() {
    try {
      const response = await fetch(`${API_URL}/paper-balls/catch`);
      if (!response.ok) throw new Error('Failed to catch paper ball');
      return await response.json();
    } catch (error) {
      console.error('API Error (catchPaperBall):', error);
      throw error;
    }
  }
};
