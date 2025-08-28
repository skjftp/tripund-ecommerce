import 'dart:async';
import 'package:flutter/foundation.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import '../models/notification.dart';

class NotificationProvider extends ChangeNotifier {
  FirebaseFirestore? _firestore;
  List<NotificationModel> _notifications = [];
  bool _isLoading = false;
  String? _currentUserId;
  StreamSubscription<QuerySnapshot>? _notificationSubscription;
  bool _firebaseAvailable = false;
  
  NotificationProvider() {
    _initializeFirestore();
  }
  
  void _initializeFirestore() {
    try {
      _firestore = FirebaseFirestore.instance;
      _firebaseAvailable = true;
    } catch (e) {
      print('Firestore not available: $e');
      _firebaseAvailable = false;
    }
  }

  List<NotificationModel> get notifications => [..._notifications];
  bool get isLoading => _isLoading;
  int get unreadCount => _notifications.where((n) => !n.isRead).length;
  
  // Initialize with user ID and start listening to notifications
  void initializeForUser(String userId) {
    if (_currentUserId == userId) return; // Already initialized for this user
    
    _currentUserId = userId;
    _listenToNotifications();
  }

  // Listen to real-time notification updates
  void _listenToNotifications() {
    if (_currentUserId == null || !_firebaseAvailable || _firestore == null) return;
    
    // Cancel previous subscription if exists
    _notificationSubscription?.cancel();
    
    _isLoading = true;
    notifyListeners();
    
    _notificationSubscription = _firestore!
        .collection('notifications')
        .where('userId', isEqualTo: _currentUserId)
        .orderBy('timestamp', descending: true)
        .limit(50) // Limit to last 50 notifications
        .snapshots()
        .listen((snapshot) {
      _notifications = snapshot.docs
          .map((doc) => NotificationModel.fromFirestore(doc))
          .toList();
      
      _isLoading = false;
      notifyListeners();
    }, onError: (error) {
      print('Error listening to notifications: $error');
      _isLoading = false;
      notifyListeners();
    });
  }

  // Mark a notification as read
  Future<void> markAsRead(String notificationId) async {
    if (!_firebaseAvailable || _firestore == null) return;
    
    try {
      await _firestore!
          .collection('notifications')
          .doc(notificationId)
          .update({'isRead': true});
      
      // Update local list
      final index = _notifications.indexWhere((n) => n.id == notificationId);
      if (index != -1) {
        _notifications[index] = _notifications[index].copyWith(isRead: true);
        notifyListeners();
      }
    } catch (e) {
      print('Error marking notification as read: $e');
    }
  }

  // Mark all notifications as read
  Future<void> markAllAsRead() async {
    if (!_firebaseAvailable || _firestore == null) return;
    
    try {
      // Get all unread notification IDs
      final unreadIds = _notifications
          .where((n) => !n.isRead)
          .map((n) => n.id)
          .toList();
      
      if (unreadIds.isEmpty) return;
      
      // Batch update in Firestore
      final batch = _firestore!.batch();
      for (final id in unreadIds) {
        final docRef = _firestore!.collection('notifications').doc(id);
        batch.update(docRef, {'isRead': true});
      }
      await batch.commit();
      
      // Update local list
      _notifications = _notifications.map((n) {
        if (!n.isRead) {
          return n.copyWith(isRead: true);
        }
        return n;
      }).toList();
      notifyListeners();
    } catch (e) {
      print('Error marking all notifications as read: $e');
    }
  }

  // Delete a notification
  Future<void> deleteNotification(String notificationId) async {
    if (!_firebaseAvailable || _firestore == null) return;
    
    try {
      await _firestore!
          .collection('notifications')
          .doc(notificationId)
          .delete();
      
      // Update local list
      _notifications.removeWhere((n) => n.id == notificationId);
      notifyListeners();
    } catch (e) {
      print('Error deleting notification: $e');
    }
  }

  // Create a new notification (usually called from backend or other parts of the app)
  Future<void> createNotification({
    required String userId,
    required String title,
    required String message,
    required NotificationType type,
    Map<String, dynamic>? data,
  }) async {
    if (!_firebaseAvailable || _firestore == null) return;
    
    try {
      final notification = NotificationModel(
        id: '', // Will be set by Firestore
        userId: userId,
        title: title,
        message: message,
        type: type,
        timestamp: DateTime.now(),
        isRead: false,
        data: data,
      );
      
      await _firestore!
          .collection('notifications')
          .add(notification.toFirestore());
    } catch (e) {
      print('Error creating notification: $e');
    }
  }

  // Create notification for order status update
  Future<void> createOrderNotification({
    required String userId,
    required String orderId,
    required String orderStatus,
  }) async {
    String title;
    String message;
    
    switch (orderStatus.toLowerCase()) {
      case 'confirmed':
        title = 'Order Confirmed!';
        message = 'Your order #$orderId has been confirmed and is being processed.';
        break;
      case 'shipped':
        title = 'Order Shipped!';
        message = 'Your order #$orderId has been shipped and will arrive soon.';
        break;
      case 'delivered':
        title = 'Order Delivered!';
        message = 'Your order #$orderId has been successfully delivered.';
        break;
      case 'cancelled':
        title = 'Order Cancelled';
        message = 'Your order #$orderId has been cancelled.';
        break;
      default:
        title = 'Order Update';
        message = 'Your order #$orderId status has been updated.';
    }
    
    await createNotification(
      userId: userId,
      title: title,
      message: message,
      type: NotificationType.order,
      data: {'orderId': orderId, 'status': orderStatus},
    );
  }

  // Create notification for wishlist item back in stock
  Future<void> createWishlistNotification({
    required String userId,
    required String productId,
    required String productName,
  }) async {
    await createNotification(
      userId: userId,
      title: 'Back in Stock!',
      message: 'The "$productName" you wishlisted is now back in stock.',
      type: NotificationType.wishlist,
      data: {'productId': productId},
    );
  }

  // Create promotion notification
  Future<void> createPromotionNotification({
    required String userId,
    required String promoTitle,
    required String promoMessage,
    String? promoCode,
  }) async {
    await createNotification(
      userId: userId,
      title: promoTitle,
      message: promoMessage,
      type: NotificationType.promotion,
      data: promoCode != null ? {'promoCode': promoCode} : null,
    );
  }

  // Clear all notifications for the current user
  Future<void> clearAllNotifications() async {
    if (_currentUserId == null || !_firebaseAvailable || _firestore == null) return;
    
    try {
      // Get all notification IDs for the user
      final snapshot = await _firestore!
          .collection('notifications')
          .where('userId', isEqualTo: _currentUserId)
          .get();
      
      // Batch delete
      final batch = _firestore!.batch();
      for (final doc in snapshot.docs) {
        batch.delete(doc.reference);
      }
      await batch.commit();
      
      // Clear local list
      _notifications.clear();
      notifyListeners();
    } catch (e) {
      print('Error clearing all notifications: $e');
    }
  }

  // Clean up when disposing
  void cleanup() {
    _notificationSubscription?.cancel();
    _notifications.clear();
    _currentUserId = null;
  }

  @override
  void dispose() {
    cleanup();
    super.dispose();
  }
}