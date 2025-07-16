import AuditLog from '../models/AuditLog.js';
import User from '../models/User.js';
import { getSecureIP, sanitizeIP } from './secureIP.js';

class AuditLogger {
  static async logUserBan(targetUserId, performedById, reason, req) {
    try {
      const performedBy = await User.findById(performedById);
      const targetUser = await User.findById(targetUserId);
      const secureIP = sanitizeIP(getSecureIP(req));
      
      await AuditLog.create({
        action: 'ban',
        targetType: 'User',
        targetId: targetUserId,
        performedBy: performedById,
        performedByEmail: performedBy?.email || 'unknown',
        details: {
          targetUserEmail: targetUser?.email || 'unknown',
          targetUserName: targetUser ? `${targetUser.first_name} ${targetUser.last_name}` : 'unknown',
          reason: reason,
          ipAddress: secureIP,
          timestamp: new Date()
        }
      });
      
      console.log(`Audit: User ${targetUserId} banned by ${performedById} for: ${reason}`);
    } catch (error) {
      console.error('Error logging user ban:', error);
    }
  }

  static async logUserUnban(targetUserId, performedById, reason, ipAddress) {
    try {
      const performedBy = await User.findById(performedById);
      const targetUser = await User.findById(targetUserId);
      
      await AuditLog.create({
        action: 'unban',
        targetType: 'User',
        targetId: targetUserId,
        performedBy: performedById,
        performedByEmail: performedBy?.email || 'unknown',
        details: {
          targetUserEmail: targetUser?.email || 'unknown',
          targetUserName: targetUser ? `${targetUser.first_name} ${targetUser.last_name}` : 'unknown',
          reason: reason,
          ipAddress: ipAddress,
          timestamp: new Date()
        }
      });
      
      console.log(`Audit: User ${targetUserId} unbanned by ${performedById} for: ${reason}`);
    } catch (error) {
      console.error('Error logging user unban:', error);
    }
  }

  static async logSoftDelete(targetType, targetId, performedById, reason, ipAddress) {
    try {
      const performedBy = await User.findById(performedById);
      
      await AuditLog.create({
        action: 'soft-delete',
        targetType: targetType,
        targetId: targetId,
        performedBy: performedById,
        performedByEmail: performedBy?.email || 'unknown',
        details: {
          reason: reason,
          ipAddress: ipAddress,
          timestamp: new Date()
        }
      });
      
      console.log(`Audit: ${targetType} ${targetId} soft deleted by ${performedById} for: ${reason}`);
    } catch (error) {
      console.error('Error logging soft delete:', error);
    }
  }

  static async logOrderStatusChange(orderId, oldStatus, newStatus, performedById, reason, ipAddress) {
    try {
      const performedBy = await User.findById(performedById);
      
      await AuditLog.create({
        action: 'order-status-change',
        targetType: 'Order',
        targetId: orderId,
        performedBy: performedById,
        performedByEmail: performedBy?.email || 'unknown',
        details: {
          oldStatus: oldStatus,
          newStatus: newStatus,
          reason: reason,
          ipAddress: ipAddress,
          timestamp: new Date()
        }
      });
      
      console.log(`Audit: Order ${orderId} status changed from ${oldStatus} to ${newStatus} by ${performedById}`);
    } catch (error) {
      console.error('Error logging order status change:', error);
    }
  }

  static async logUserRoleChange(targetUserId, oldRole, newRole, performedById, reason, ipAddress) {
    try {
      const performedBy = await User.findById(performedById);
      const targetUser = await User.findById(targetUserId);
      
      await AuditLog.create({
        action: 'role-change',
        targetType: 'User',
        targetId: targetUserId,
        performedBy: performedById,
        performedByEmail: performedBy?.email || 'unknown',
        details: {
          targetUserEmail: targetUser?.email || 'unknown',
          targetUserName: targetUser ? `${targetUser.first_name} ${targetUser.last_name}` : 'unknown',
          oldRole: oldRole,
          newRole: newRole,
          reason: reason,
          ipAddress: ipAddress,
          timestamp: new Date()
        }
      });
      
      console.log(`Audit: User ${targetUserId} role changed from ${oldRole} to ${newRole} by ${performedById}`);
    } catch (error) {
      console.error('Error logging user role change:', error);
    }
  }

  static async logPaymentMethodDelete(paymentMethodId, userId, performedById, reason, ipAddress) {
    try {
      const performedBy = await User.findById(performedById);
      
      await AuditLog.create({
        action: 'payment-method-delete',
        targetType: 'PaymentMethod',
        targetId: paymentMethodId,
        performedBy: performedById,
        performedByEmail: performedBy?.email || 'unknown',
        details: {
          userId: userId,
          reason: reason,
          ipAddress: ipAddress,
          timestamp: new Date()
        }
      });
      
      console.log(`Audit: Payment method ${paymentMethodId} deleted by ${performedById}`);
    } catch (error) {
      console.error('Error logging payment method deletion:', error);
    }
  }

  static async logListingDelete(listingId, sellerId, performedById, reason, ipAddress) {
    try {
      const performedBy = await User.findById(performedById);
      
      await AuditLog.create({
        action: 'listing-delete',
        targetType: 'Listing',
        targetId: listingId,
        performedBy: performedById,
        performedByEmail: performedBy?.email || 'unknown',
        details: {
          sellerId: sellerId,
          reason: reason,
          ipAddress: ipAddress,
          timestamp: new Date()
        }
      });
      
      console.log(`Audit: Listing ${listingId} deleted by ${performedById}`);
    } catch (error) {
      console.error('Error logging listing deletion:', error);
    }
  }

  static async getAuditLogs(filters = {}, page = 1, limit = 50) {
    try {
      const query = {};
      
      if (filters.action) query.action = filters.action;
      if (filters.targetType) query.targetType = filters.targetType;
      if (filters.performedBy) query.performedBy = filters.performedBy;
      if (filters.startDate) query.timestamp = { $gte: new Date(filters.startDate) };
      if (filters.endDate) {
        if (query.timestamp) {
          query.timestamp.$lte = new Date(filters.endDate);
        } else {
          query.timestamp = { $lte: new Date(filters.endDate) };
        }
      }

      const skip = (page - 1) * limit;
      
      const logs = await AuditLog.find(query)
        .populate('performedBy', 'first_name last_name email')
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(limit);

      const total = await AuditLog.countDocuments(query);
      
      return {
        logs,
        total,
        page,
        totalPages: Math.ceil(total / limit)
      };
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      throw error;
    }
  }
}

export default AuditLogger; 