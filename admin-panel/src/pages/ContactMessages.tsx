import { useState, useEffect } from 'react';
import {
  Mail,
  Phone,
  Calendar,
  MessageSquare,
  Search,
  Filter,
  Eye,
  Reply,
  Trash2,
  CheckCircle,
  Clock,
  X,
} from 'lucide-react';
import { format } from 'date-fns';
import toast from 'react-hot-toast';
import { contactAPI } from '../services/api';

interface ContactMessage {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  status: 'new' | 'read' | 'replied';
  is_read: boolean;
  reply?: string;
  replied_at?: string;
  created_at: string;
}

export default function ContactMessages() {
  const [messages, setMessages] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedMessage, setSelectedMessage] = useState<ContactMessage | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const response = await contactAPI.getAll({ status: selectedStatus !== 'all' ? selectedStatus : undefined });
      setMessages(response.data.messages || []);
      setUnreadCount(response.data.unread_count || 0);
    } catch (error) {
      console.error('Error fetching messages:', error);
      toast.error('Failed to fetch messages');
    } finally {
      setLoading(false);
    }
  };

  const handleViewMessage = async (message: ContactMessage) => {
    setSelectedMessage(message);
    setShowDetailModal(true);
    
    if (!message.is_read) {
      try {
        await contactAPI.getById(message.id);
        // Update local state
        setMessages(messages.map(m => 
          m.id === message.id ? { ...m, is_read: true, status: 'read' } : m
        ));
        setUnreadCount(prev => Math.max(0, prev - 1));
      } catch (error) {
        console.error('Error marking message as read:', error);
      }
    }
  };

  const handleReply = (message: ContactMessage) => {
    setSelectedMessage(message);
    setReplyText('');
    setShowReplyModal(true);
  };

  const handleSendReply = async () => {
    if (!selectedMessage || !replyText.trim()) return;
    
    setSendingReply(true);
    try {
      await contactAPI.update(selectedMessage.id, {
        status: 'replied',
        reply: replyText,
      });
      
      toast.success('Reply sent successfully');
      setShowReplyModal(false);
      fetchMessages();
    } catch (error) {
      toast.error('Failed to send reply');
    } finally {
      setSendingReply(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this message?')) return;
    
    try {
      await contactAPI.delete(id);
      toast.success('Message deleted successfully');
      fetchMessages();
    } catch (error) {
      toast.error('Failed to delete message');
    }
  };

  const filteredMessages = messages.filter((message) => {
    const matchesSearch = 
      message.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      message.subject.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || message.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'new':
        return 'bg-blue-100 text-blue-800';
      case 'read':
        return 'bg-gray-100 text-gray-800';
      case 'replied':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'new':
        return <Clock size={14} />;
      case 'read':
        return <Eye size={14} />;
      case 'replied':
        return <CheckCircle size={14} />;
      default:
        return null;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Contact Messages</h1>
          <p className="text-gray-600">
            Manage customer inquiries and messages
            {unreadCount > 0 && (
              <span className="ml-2 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                {unreadCount} unread
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
            />
            <Search className="absolute left-3 top-2.5 text-gray-400" size={20} />
          </div>
          
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
          >
            <option value="all">All Messages</option>
            <option value="new">New</option>
            <option value="read">Read</option>
            <option value="replied">Replied</option>
          </select>
          
          <button className="flex items-center justify-center space-x-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
            <Filter size={20} />
            <span>More Filters</span>
          </button>
        </div>
      </div>

      {/* Messages List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="text-center py-12 text-gray-500">
            Loading messages...
          </div>
        ) : filteredMessages.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            No messages found
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredMessages.map((message) => (
              <div
                key={message.id}
                className={`p-4 hover:bg-gray-50 ${!message.is_read ? 'bg-blue-50' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center mb-2">
                      <h3 className="font-semibold text-gray-900 mr-3">{message.name}</h3>
                      <span className={`inline-flex items-center px-2 py-1 text-xs rounded-full ${getStatusBadge(message.status)}`}>
                        {getStatusIcon(message.status)}
                        <span className="ml-1">{message.status}</span>
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{message.subject}</p>
                    <p className="text-sm text-gray-500 line-clamp-2">{message.message}</p>
                    <div className="flex items-center mt-2 text-xs text-gray-400 space-x-4">
                      <span className="flex items-center">
                        <Mail size={12} className="mr-1" />
                        {message.email}
                      </span>
                      {message.phone && (
                        <span className="flex items-center">
                          <Phone size={12} className="mr-1" />
                          {message.phone}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Calendar size={12} className="mr-1" />
                        {format(new Date(message.created_at), 'MMM dd, yyyy h:mm a')}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewMessage(message)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                      title="View Message"
                    >
                      <Eye size={18} />
                    </button>
                    <button
                      onClick={() => handleReply(message)}
                      className="p-2 text-gray-600 hover:text-primary-600 hover:bg-gray-100 rounded-lg"
                      title="Reply"
                    >
                      <Reply size={18} />
                    </button>
                    <button
                      onClick={() => handleDelete(message.id)}
                      className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg"
                      title="Delete"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message Detail Modal */}
      {showDetailModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-3xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Message Details</h2>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">{selectedMessage.subject}</h3>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm ${getStatusBadge(selectedMessage.status)}`}>
                    {getStatusIcon(selectedMessage.status)}
                    <span className="ml-1">{selectedMessage.status}</span>
                  </span>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm text-gray-500">From</label>
                    <p className="font-medium">{selectedMessage.name}</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Email</label>
                    <p className="font-medium">{selectedMessage.email}</p>
                  </div>
                  {selectedMessage.phone && (
                    <div>
                      <label className="text-sm text-gray-500">Phone</label>
                      <p className="font-medium">{selectedMessage.phone}</p>
                    </div>
                  )}
                  <div>
                    <label className="text-sm text-gray-500">Received</label>
                    <p className="font-medium">
                      {format(new Date(selectedMessage.created_at), 'MMMM d, yyyy h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="mb-6">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Message</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.message}</p>
                </div>
              </div>
              
              {selectedMessage.reply && (
                <div className="mb-6">
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Reply</h4>
                  <div className="bg-green-50 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">{selectedMessage.reply}</p>
                    {selectedMessage.replied_at && (
                      <p className="text-xs text-gray-500 mt-2">
                        Replied on {format(new Date(selectedMessage.replied_at), 'MMMM d, yyyy h:mm a')}
                      </p>
                    )}
                  </div>
                </div>
              )}
              
              <div className="flex justify-end space-x-3">
                {selectedMessage.status !== 'replied' && (
                  <button
                    onClick={() => {
                      setShowDetailModal(false);
                      handleReply(selectedMessage);
                    }}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Reply to Message
                  </button>
                )}
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reply Modal */}
      {showReplyModal && selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Reply to Message</h2>
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm text-gray-600">Replying to: <strong>{selectedMessage.name}</strong></p>
                <p className="text-sm text-gray-600">Subject: <strong>{selectedMessage.subject}</strong></p>
              </div>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Your Reply</label>
                <textarea
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  rows={8}
                  placeholder="Type your reply here..."
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setShowReplyModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                  disabled={sendingReply}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendReply}
                  disabled={!replyText.trim() || sendingReply}
                  className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:bg-gray-400"
                >
                  {sendingReply ? 'Sending...' : 'Send Reply'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}