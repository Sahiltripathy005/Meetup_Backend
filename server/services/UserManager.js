export class UserManager {
  constructor() {
    this.users = new Map();
    this.emailToId = new Map();
  }

  async createUser(userData) {
    const id = Date.now().toString() + Math.random().toString(36).substr(2, 9);
    const user = {
      id,
      ...userData
    };

    this.users.set(id, user);
    this.emailToId.set(userData.email, id);
    
    return user;
  }

  async getUser(userId) {
    return this.users.get(userId);
  }

  async getUserByEmail(email) {
    const userId = this.emailToId.get(email);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  async updateUser(userId, updates) {
    const user = this.users.get(userId);
    if (!user) return null;

    const updatedUser = { ...user, ...updates };
    this.users.set(userId, updatedUser);
    
    return updatedUser;
  }

  async deleteUser(userId) {
    const user = this.users.get(userId);
    if (!user) return false;

    this.users.delete(userId);
    this.emailToId.delete(user.email);
    
    return true;
  }

  async searchUsers(query, page = 1, limit = 20) {
    const results = [];
    const lowerQuery = query.toLowerCase();

    for (const user of this.users.values()) {
      if (user.name.toLowerCase().includes(lowerQuery) || 
          user.email.toLowerCase().includes(lowerQuery)) {
        results.push(user);
      }
    }

    // Simple pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    
    return results.slice(startIndex, endIndex);
  }

  getUserCount() {
    return this.users.size;
  }

  getAllUsers() {
    return Array.from(this.users.values());
  }
}