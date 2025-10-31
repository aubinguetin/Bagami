// Shared global user presence manager
class UserPresenceManager {
  private globalUserPresence = new Map<string, Set<string>>() // userId -> Set of connectionIds

  addUserConnection(userId: string, connectionId: string) {
    if (!this.globalUserPresence.has(userId)) {
      this.globalUserPresence.set(userId, new Set())
    }
    this.globalUserPresence.get(userId)!.add(connectionId)
    console.log(`🟢 User ${userId} connected (connection ${connectionId}). Total connections: ${this.globalUserPresence.get(userId)!.size}`)
  }

  removeUserConnection(userId: string, connectionId: string) {
    if (this.globalUserPresence.has(userId)) {
      this.globalUserPresence.get(userId)!.delete(connectionId)
      const remainingConnections = this.globalUserPresence.get(userId)!.size
      
      if (remainingConnections === 0) {
        this.globalUserPresence.delete(userId)
        console.log(`🔴 User ${userId} disconnected (connection ${connectionId}). User is now offline.`)
      } else {
        console.log(`🟡 User ${userId} disconnected (connection ${connectionId}). Still has ${remainingConnections} connections.`)
      }
      
      return remainingConnections === 0 // Return true if user went completely offline
    }
    return false
  }

  isUserOnline(userId: string): boolean {
    return this.globalUserPresence.has(userId) && this.globalUserPresence.get(userId)!.size > 0
  }

  getAllOnlineUsers(): string[] {
    return Array.from(this.globalUserPresence.keys())
  }

  getUserConnectionCount(userId: string): number {
    return this.globalUserPresence.get(userId)?.size || 0
  }

  getPresenceStats() {
    const stats: { [userId: string]: number } = {}
    this.globalUserPresence.forEach((connections, userId) => {
      stats[userId] = connections.size
    })
    return stats
  }
}

// Export a singleton instance
export const userPresenceManager = new UserPresenceManager()