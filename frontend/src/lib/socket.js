import { io } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.connected = false;
    this.joinedRooms = new Set();
  }

  connect() {
    if (this.socket?.connected) {
      return this.socket;
    }

    if (this.socket && !this.socket.connected) {
      this.socket.connect();
      return this.socket;
    }

    this.socket = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 10,
      timeout: 10000,
      forceNew: false
    });

    this.socket.on('connect', () => {
      this.connected = true;
      this.joinedRooms.forEach(room => {
        if (room.startsWith('campaign:')) {
          const campaignId = room.replace('campaign:', '');
          this.socket.emit('join-campaign', campaignId);
        } else if (room.startsWith('user:')) {
          const userId = room.replace('user:', '');
          this.socket.emit('join', userId);
        }
      });
    });

    this.socket.on('disconnect', () => {
      this.connected = false;
    });

    this.socket.on('connect_error', () => {
      this.connected = false;
    });

    return this.socket;
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.joinedRooms.clear();
    }
  }

  async waitForConnection(timeout = 10000) {
    if (this.socket?.connected) {
      return true;
    }

    if (!this.socket) {
      return false;
    }

    const startTime = Date.now();
    const pollInterval = 100;

    while (Date.now() - startTime < timeout) {
      if (this.socket?.connected) {
        return true;
      }
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    }

    return false;
  }

  async joinUser(userId) {
    await this.waitForConnection();
    if (this.socket?.connected) {
      this.socket.emit('join', userId);
      this.joinedRooms.add(`user:${userId}`);
    }
  }

  async joinCampaign(campaignId) {
    const connected = await this.waitForConnection();
    if (connected && this.socket?.connected) {
      this.socket.emit('join-campaign', campaignId);
      this.joinedRooms.add(`campaign:${campaignId}`);
      return true;
    }
    return false;
  }

  leaveCampaign(campaignId) {
    if (this.socket?.connected) {
      this.socket.emit('leave-campaign', campaignId);
      this.joinedRooms.delete(`campaign:${campaignId}`);
    }
  }

  on(event, callback) {
    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket?.connected) {
      this.socket.emit(event, data);
    }
  }

  isConnected() {
    return this.connected && this.socket?.connected;
  }
}

const socketService = new SocketService();
export default socketService;
