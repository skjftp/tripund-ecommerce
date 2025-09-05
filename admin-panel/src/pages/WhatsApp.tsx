import React, { useState, useEffect } from 'react';
import {
  MessageCircle,
  Send,
  Users,
  FileText,
  Upload,
  Download,
  Eye,
  Plus,
  Search,
  Filter,
  Calendar,
  BarChart3,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
} from 'lucide-react';

interface WhatsAppTemplate {
  id: string;
  name: string;
  language: string;
  status: string;
  category: string;
  components: TemplateComponent[];
}

interface TemplateComponent {
  type: string;
  text?: string;
  format?: string;
  parameters?: TemplateParameter[];
  buttons?: TemplateButton[];
}

interface TemplateParameter {
  type: string;
  text?: string;
}

interface TemplateButton {
  type: string;
  text: string;
  url?: string;
}

interface WhatsAppMessage {
  id: string;
  message_id: string;
  phone_number: string;
  direction: 'incoming' | 'outgoing';
  type: string;
  content: string;
  template_id?: string;
  status: string;
  timestamp: string;
}

interface WhatsAppContact {
  id: string;
  phone_number: string;
  name: string;
  profile_name?: string;
  is_blocked: boolean;
  tags: string[];
  last_message: string;
}

interface Campaign {
  id: string;
  name: string;
  template_id: string;
  recipients: string[];
  status: string;
  sent: number;
  failed: number;
  created_at: string;
  completed_at?: string;
}

export default function WhatsApp() {
  const [activeTab, setActiveTab] = useState('messages');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>([]);
  const [messages, setMessages] = useState<WhatsAppMessage[]>([]);
  const [contacts, setContacts] = useState<WhatsAppContact[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  // Message sending states
  const [sendMessageData, setSendMessageData] = useState({
    phone_number: '',
    message: '',
    type: 'text',
    template_id: '',
    parameters: [] as { type: string; text: string }[],
  });
  const [isSending, setIsSending] = useState(false);

  // Bulk message states
  const [bulkMessageData, setBulkMessageData] = useState({
    template_id: '',
    csv_data: '',
  });
  const [isSendingBulk, setIsSendingBulk] = useState(false);

  // Template creation states
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [templateData, setTemplateData] = useState({
    name: '',
    language: 'en_US',
    category: 'MARKETING',
    components: [{ type: 'BODY', text: '' }],
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchTemplates(),
        fetchMessages(),
        fetchContacts(),
        fetchCampaigns(),
      ]);
    } catch (error) {
      console.error('Error fetching WhatsApp data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/whatsapp/templates`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setTemplates(data.templates || []);
    } catch (error) {
      console.error('Error fetching templates:', error);
    }
  };

  const fetchMessages = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/whatsapp/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setMessages(data.messages || []);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const fetchContacts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/whatsapp/contacts`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setContacts(data.contacts || []);
    } catch (error) {
      console.error('Error fetching contacts:', error);
    }
  };

  const fetchCampaigns = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/whatsapp/campaigns`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
      });
      const data = await response.json();
      setCampaigns(data.campaigns || []);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSending(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/whatsapp/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(sendMessageData),
      });

      if (response.ok) {
        alert('Message sent successfully!');
        setSendMessageData({
          phone_number: '',
          message: '',
          type: 'text',
          template_id: '',
          parameters: [],
        });
        fetchMessages();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending message:', error);
      alert('Error sending message');
    } finally {
      setIsSending(false);
    }
  };

  const handleSendBulkMessages = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingBulk(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/whatsapp/send-bulk`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(bulkMessageData),
      });

      if (response.ok) {
        const result = await response.json();
        alert(`Bulk messages processed! Sent: ${result.sent}, Failed: ${result.failed}`);
        setBulkMessageData({
          template_id: '',
          csv_data: '',
        });
        fetchMessages();
        fetchCampaigns();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error sending bulk messages:', error);
      alert('Error sending bulk messages');
    } finally {
      setIsSendingBulk(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'https://tripund-backend-665685012221.asia-south1.run.app/api/v1'}/admin/whatsapp/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('adminToken')}`,
        },
        body: JSON.stringify(templateData),
      });

      if (response.ok) {
        alert('Template created successfully! Please wait for Facebook approval.');
        setShowCreateTemplate(false);
        setTemplateData({
          name: '',
          language: 'en_US',
          category: 'MARKETING',
          components: [{ type: 'BODY', text: '' }],
        });
        fetchTemplates();
      } else {
        const error = await response.json();
        alert(`Error: ${error.error}`);
      }
    } catch (error) {
      console.error('Error creating template:', error);
      alert('Error creating template');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
      case 'delivered':
      case 'read':
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-500" />;
    }
  };

  const filteredMessages = messages.filter(message =>
    message.phone_number.includes(searchTerm) ||
    message.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredContacts = contacts.filter(contact =>
    contact.phone_number.includes(searchTerm) ||
    contact.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">WhatsApp Business</h1>
          <p className="text-gray-600">Manage WhatsApp templates, messages, and campaigns</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowCreateTemplate(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md flex items-center"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Template
          </button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <MessageCircle className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Messages</p>
              <p className="text-2xl font-bold text-gray-900">{messages.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Contacts</p>
              <p className="text-2xl font-bold text-gray-900">{contacts.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <FileText className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Templates</p>
              <p className="text-2xl font-bold text-gray-900">{templates.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <BarChart3 className="w-8 h-8 text-yellow-600" />
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Campaigns</p>
              <p className="text-2xl font-bold text-gray-900">{campaigns.length}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {['messages', 'send', 'bulk', 'templates', 'contacts', 'campaigns'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                activeTab === tab
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab === 'send' ? 'Send Message' : tab === 'bulk' ? 'Bulk Messages' : tab}
            </button>
          ))}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'messages' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Messages</h3>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Message
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Time
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMessages.map((message) => (
                    <tr key={message.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {message.phone_number}
                          </div>
                          <div className="text-sm text-gray-500">
                            {message.direction === 'incoming' ? 'Incoming' : 'Outgoing'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900 max-w-md truncate">
                          {message.content}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <span className="capitalize">{message.type}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          {getStatusIcon(message.status)}
                          <span className="ml-2 text-sm text-gray-900 capitalize">
                            {message.status}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(message.timestamp).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'send' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Send Individual Message</h3>
            <form onSubmit={handleSendMessage} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={sendMessageData.phone_number}
                    onChange={(e) => setSendMessageData({
                      ...sendMessageData,
                      phone_number: e.target.value
                    })}
                    placeholder="+919711441830"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Type
                  </label>
                  <select
                    value={sendMessageData.type}
                    onChange={(e) => setSendMessageData({
                      ...sendMessageData,
                      type: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="text">Text Message</option>
                    <option value="template">Template Message</option>
                  </select>
                </div>
              </div>

              {sendMessageData.type === 'template' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Template
                    </label>
                    <select
                      value={sendMessageData.template_id}
                      onChange={(e) => setSendMessageData({
                        ...sendMessageData,
                        template_id: e.target.value
                      })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                      required
                    >
                      <option value="">Select a template</option>
                      {templates.filter(t => t.status === 'APPROVED').map((template) => (
                        <option key={template.id} value={template.name}>
                          {template.name} ({template.language})
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  {sendMessageData.template_id === 'order_management_1' && (
                    <div className="grid grid-cols-1 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Customer Name
                        </label>
                        <input
                          type="text"
                          placeholder="John Doe"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          onChange={(e) => setSendMessageData({
                            ...sendMessageData,
                            parameters: [
                              { type: 'text', text: e.target.value },
                              sendMessageData.parameters?.[1] || { type: 'text', text: '' },
                              sendMessageData.parameters?.[2] || { type: 'text', text: '' }
                            ]
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Order Number
                        </label>
                        <input
                          type="text"
                          placeholder="TRP001234"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          onChange={(e) => setSendMessageData({
                            ...sendMessageData,
                            parameters: [
                              sendMessageData.parameters?.[0] || { type: 'text', text: '' },
                              { type: 'text', text: e.target.value },
                              sendMessageData.parameters?.[2] || { type: 'text', text: '' }
                            ]
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Delivery Date
                        </label>
                        <input
                          type="text"
                          placeholder="3-7 business days"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                          onChange={(e) => setSendMessageData({
                            ...sendMessageData,
                            parameters: [
                              sendMessageData.parameters?.[0] || { type: 'text', text: '' },
                              sendMessageData.parameters?.[1] || { type: 'text', text: '' },
                              { type: 'text', text: e.target.value }
                            ]
                          })}
                        />
                      </div>
                    </div>
                  )}
                </>
              )}

              {sendMessageData.type === 'text' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message
                  </label>
                  <textarea
                    value={sendMessageData.message}
                    onChange={(e) => setSendMessageData({
                      ...sendMessageData,
                      message: e.target.value
                    })}
                    rows={4}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              )}

              <button
                type="submit"
                disabled={isSending}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md flex items-center"
              >
                <Send className="w-4 h-4 mr-2" />
                {isSending ? 'Sending...' : 'Send Message'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'bulk' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Send Bulk Messages</h3>
            <div className="bg-blue-50 p-4 rounded-md mb-4">
              <p className="text-sm text-blue-800">
                <strong>CSV Format:</strong> phone_number,name,param1,param2,...<br/>
                Example: +919711441830,John Doe,Order123,₹1500
              </p>
            </div>

            <form onSubmit={handleSendBulkMessages} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Template
                </label>
                <select
                  value={bulkMessageData.template_id}
                  onChange={(e) => setBulkMessageData({
                    ...bulkMessageData,
                    template_id: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                >
                  <option value="">Select a template</option>
                  {templates.filter(t => t.status === 'APPROVED').map((template) => (
                    <option key={template.id} value={template.name}>
                      {template.name} ({template.language})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  CSV Data
                </label>
                <textarea
                  value={bulkMessageData.csv_data}
                  onChange={(e) => setBulkMessageData({
                    ...bulkMessageData,
                    csv_data: e.target.value
                  })}
                  rows={8}
                  placeholder={`phone_number,name,order_id,amount\n+919711441830,John Doe,TRP001,₹1500\n+919876543210,Jane Smith,TRP002,₹2200`}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={isSendingBulk}
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-md flex items-center"
              >
                <Upload className="w-4 h-4 mr-2" />
                {isSendingBulk ? 'Sending...' : 'Send Bulk Messages'}
              </button>
            </form>
          </div>
        )}

        {activeTab === 'templates' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Message Templates</h3>
            </div>

            <div className="grid gap-4">
              {templates.map((template) => (
                <div key={template.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h4 className="font-medium text-gray-900">{template.name}</h4>
                        <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-600">
                          {template.language}
                        </span>
                        <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-600">
                          {template.category}
                        </span>
                      </div>
                      <div className="space-y-2">
                        {template.components.map((component, index) => (
                          <div key={index} className="text-sm text-gray-600">
                            <strong className="capitalize">{component.type}:</strong> {component.text}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="flex items-center ml-4">
                      {getStatusIcon(template.status)}
                      <span className="ml-2 text-sm text-gray-900 capitalize">
                        {template.status}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'contacts' && (
          <div className="p-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-medium">Contacts</h3>
              <div className="relative">
                <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search contacts..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="grid gap-4">
              {filteredContacts.map((contact) => (
                <div key={contact.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center">
                    <div>
                      <h4 className="font-medium text-gray-900">{contact.name}</h4>
                      <p className="text-sm text-gray-600">{contact.phone_number}</p>
                      {contact.profile_name && (
                        <p className="text-sm text-gray-500">Profile: {contact.profile_name}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500">
                        Last Message: {new Date(contact.last_message).toLocaleString()}
                      </p>
                      {contact.is_blocked && (
                        <span className="px-2 py-1 text-xs bg-red-100 text-red-600 rounded-full">
                          Blocked
                        </span>
                      )}
                    </div>
                  </div>
                  {contact.tags.length > 0 && (
                    <div className="mt-2">
                      <div className="flex flex-wrap gap-1">
                        {contact.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'campaigns' && (
          <div className="p-6">
            <h3 className="text-lg font-medium mb-4">Campaigns</h3>
            <div className="grid gap-4">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{campaign.name}</h4>
                      <p className="text-sm text-gray-600">Template: {campaign.template_id}</p>
                      <p className="text-sm text-gray-500">Recipients: {campaign.recipients.length}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center mb-1">
                        {getStatusIcon(campaign.status)}
                        <span className="ml-2 text-sm text-gray-900 capitalize">
                          {campaign.status}
                        </span>
                      </div>
                      <div className="text-sm text-gray-600">
                        Sent: {campaign.sent} | Failed: {campaign.failed}
                      </div>
                      <p className="text-xs text-gray-500">
                        Created: {new Date(campaign.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Create Template Modal */}
      {showCreateTemplate && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h3 className="text-lg font-medium mb-4">Create WhatsApp Template</h3>
              <form onSubmit={handleCreateTemplate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={templateData.name}
                    onChange={(e) => setTemplateData({
                      ...templateData,
                      name: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Language
                  </label>
                  <select
                    value={templateData.language}
                    onChange={(e) => setTemplateData({
                      ...templateData,
                      language: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="en_US">English (US)</option>
                    <option value="hi">Hindi</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={templateData.category}
                    onChange={(e) => setTemplateData({
                      ...templateData,
                      category: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                  >
                    <option value="MARKETING">Marketing</option>
                    <option value="UTILITY">Utility</option>
                    <option value="AUTHENTICATION">Authentication</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Body
                  </label>
                  <textarea
                    value={templateData.components[0]?.text || ''}
                    onChange={(e) => setTemplateData({
                      ...templateData,
                      components: [{ type: 'BODY', text: e.target.value }]
                    })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
                    placeholder="Use {{1}}, {{2}} for dynamic parameters"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setShowCreateTemplate(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-md"
                  >
                    Create Template
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}