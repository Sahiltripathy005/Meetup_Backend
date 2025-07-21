export class Room {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.description = data.description;
    this.ownerId = data.ownerId;
    this.ownerName = data.ownerName;
    this.mapTemplate = data.mapTemplate;
    this.isPrivate = data.isPrivate;
    this.password = data.password;
    this.maxUsers = data.maxUsers;
    this.createdAt = data.createdAt;
    this.isPersistent = true;

    this.users = new Map();
    this.messages = [];
  }

  addUser(user) {
    this.users.set(user.id, user);
  }

  removeUser(userId) {
    this.users.delete(userId);
  }

  hasUser(userId) {
    return this.users.has(userId);
  }

  getUser(userId) {
    return this.users.get(userId);
  }

  getUsers() {
    return Array.from(this.users.values());
  }

  updateUserPosition(userId, position) {
    const user = this.users.get(userId);
    if (user) {
      user.position = position;
    }
  }

  addMessage(message) {
    this.messages.push(message);
    
    // Keep only last 100 messages to prevent memory issues
    if (this.messages.length > 100) {
      this.messages = this.messages.slice(-100);
    }
  }

  getMessages() {
    return this.messages;
  }

  update(updates) {
    if (updates.name !== undefined) this.name = updates.name;
    if (updates.description !== undefined) this.description = updates.description;
    if (updates.isPrivate !== undefined) this.isPrivate = updates.isPrivate;
    if (updates.password !== undefined) this.password = updates.password;
    if (updates.maxUsers !== undefined) this.maxUsers = updates.maxUsers;
  }

  getPublicData() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      ownerId: this.ownerId,
      ownerName: this.ownerName,
      mapTemplate: this.mapTemplate,
      isPrivate: this.isPrivate,
      maxUsers: this.maxUsers,
      currentUsers: this.users.size,
      createdAt: this.createdAt
    };
  }
}
