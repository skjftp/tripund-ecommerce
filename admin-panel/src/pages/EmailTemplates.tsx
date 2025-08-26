import React, { useState, useEffect } from 'react';
import {
  Mail,
  Plus,
  Edit,
  Trash2,
  Send,
  Eye,
  Check,
  Copy,
  Star,
  Code,
  Palette,
  Save
} from 'lucide-react';
import api from '../services/api';

interface TemplateVariable {
  key: string;
  label: string;
  type: string;
  required: boolean;
  defaultValue?: string;
  description?: string;
  example?: string;
}

interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  type: string;
  html_content: string;
  variables: TemplateVariable[];
  is_active: boolean;
  is_default: boolean;
  preview?: string;
  category: string;
  created_at: string;
  updated_at: string;
}

interface PredefinedTemplate {
  id: string;
  name: string;
  description: string;
  type: string;
  thumbnail?: string;
  subject: string;
  html_content: string;
  variables: TemplateVariable[];
  category: string;
}

const EmailTemplates = () => {
  const [templates, setTemplates] = useState<EmailTemplate[]>([]);
  const [predefinedTemplates, setPredefinedTemplates] = useState<PredefinedTemplate[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<EmailTemplate | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(false);
  const [testEmail, setTestEmail] = useState('');
  const [testData, setTestData] = useState<Record<string, any>>({});
  const [activeTab, setActiveTab] = useState<'custom' | 'predefined'>('custom');
  const [editingTemplate, setEditingTemplate] = useState<Partial<EmailTemplate>>({
    name: '',
    subject: '',
    type: 'order_confirmation',
    html_content: '',
    variables: [],
    is_active: true,
    category: 'transactional'
  });

  useEffect(() => {
    fetchTemplates();
    fetchPredefinedTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const response = await api.get('/admin/email-templates');
      setTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch templates:', error);
    }
  };

  const fetchPredefinedTemplates = async () => {
    try {
      const response = await api.get('/admin/email-templates/predefined');
      setPredefinedTemplates(response.data.templates || []);
    } catch (error) {
      console.error('Failed to fetch predefined templates:', error);
    }
  };

  const handleCreateTemplate = () => {
    setEditingTemplate({
      name: '',
      subject: '',
      type: 'order_confirmation',
      html_content: '',
      variables: [],
      is_active: true,
      category: 'transactional'
    });
    setShowEditor(true);
  };

  const handleEditTemplate = (template: EmailTemplate) => {
    setEditingTemplate(template);
    setShowEditor(true);
  };

  const handleSaveTemplate = async () => {
    setLoading(true);
    try {
      if (editingTemplate.id) {
        await api.put(`/admin/email-templates/${editingTemplate.id}`, editingTemplate);
      } else {
        await api.post('/admin/email-templates', editingTemplate);
      }
      await fetchTemplates();
      setShowEditor(false);
      setEditingTemplate({});
    } catch (error) {
      console.error('Failed to save template:', error);
      alert('Failed to save template');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    
    try {
      await api.delete(`/admin/email-templates/${id}`);
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to delete template:', error);
      alert('Failed to delete template');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await api.post(`/admin/email-templates/${id}/set-default`);
      await fetchTemplates();
    } catch (error) {
      console.error('Failed to set default template:', error);
      alert('Failed to set default template');
    }
  };

  const handleTestEmail = async () => {
    if (!selectedTemplate || !testEmail) {
      alert('Please select a template and enter an email address');
      return;
    }

    setLoading(true);
    try {
      await api.post('/admin/email-templates/test', {
        template_id: selectedTemplate.id,
        to_email: testEmail,
        test_data: testData
      });
      alert('Test email sent successfully!');
      setShowTestModal(false);
      setTestEmail('');
      setTestData({});
    } catch (error) {
      console.error('Failed to send test email:', error);
      alert('Failed to send test email');
    } finally {
      setLoading(false);
    }
  };

  const handleUsePredefinedTemplate = (template: PredefinedTemplate) => {
    setEditingTemplate({
      name: template.name,
      subject: template.subject,
      type: template.type,
      html_content: template.html_content,
      variables: template.variables,
      is_active: true,
      category: template.category
    });
    setShowEditor(true);
  };

  const addVariable = () => {
    setEditingTemplate({
      ...editingTemplate,
      variables: [
        ...(editingTemplate.variables || []),
        {
          key: '',
          label: '',
          type: 'string',
          required: false,
          defaultValue: '',
          description: '',
          example: ''
        }
      ]
    });
  };

  const updateVariable = (index: number, field: keyof TemplateVariable, value: any) => {
    const variables = [...(editingTemplate.variables || [])];
    variables[index] = { ...variables[index], [field]: value };
    setEditingTemplate({ ...editingTemplate, variables });
  };

  const removeVariable = (index: number) => {
    const variables = [...(editingTemplate.variables || [])];
    variables.splice(index, 1);
    setEditingTemplate({ ...editingTemplate, variables });
  };

  const generateTestData = (template: EmailTemplate) => {
    const data: Record<string, any> = {};
    template.variables.forEach(variable => {
      if (variable.example) {
        data[variable.key] = variable.example;
      } else if (variable.defaultValue) {
        data[variable.key] = variable.defaultValue;
      } else {
        switch (variable.type) {
          case 'string':
            data[variable.key] = 'Test Value';
            break;
          case 'number':
            data[variable.key] = 100;
            break;
          case 'date':
            data[variable.key] = new Date().toLocaleDateString();
            break;
          case 'array':
            data[variable.key] = [];
            break;
          case 'object':
            data[variable.key] = {};
            break;
        }
      }
    });
    setTestData(data);
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Mail className="h-6 w-6" />
            Email Templates
          </h1>
          <button
            onClick={handleCreateTemplate}
            className="bg-brown-600 text-white px-4 py-2 rounded-md hover:bg-brown-700 flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Create Template
          </button>
        </div>
        
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
          <p className="text-sm text-yellow-800">
            <strong>Tip:</strong> Create custom email templates with dynamic variables. 
            You can use predefined templates as a starting point or create your own from scratch.
          </p>
        </div>

        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('custom')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'custom'
                ? 'bg-brown-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Custom Templates
          </button>
          <button
            onClick={() => setActiveTab('predefined')}
            className={`px-4 py-2 rounded-md ${
              activeTab === 'predefined'
                ? 'bg-brown-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            <Palette className="h-4 w-4 inline mr-2" />
            Template Gallery
          </button>
        </div>
      </div>

      {activeTab === 'custom' ? (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Template
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {templates.map((template) => (
                <tr key={template.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {template.name}
                          {template.is_default && (
                            <Star className="h-4 w-4 inline ml-2 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="text-sm text-gray-500">{template.subject}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-sm text-gray-900">
                      {template.type.replace('_', ' ').charAt(0).toUpperCase() + 
                       template.type.replace('_', ' ').slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {template.category}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {template.is_active ? (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        Active
                      </span>
                    ) : (
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEditTemplate(template)}
                        className="text-brown-600 hover:text-brown-900"
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          setShowPreview(true);
                        }}
                        className="text-blue-600 hover:text-blue-900"
                        title="Preview"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedTemplate(template);
                          generateTestData(template);
                          setShowTestModal(true);
                        }}
                        className="text-green-600 hover:text-green-900"
                        title="Send Test"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      {!template.is_default && (
                        <button
                          onClick={() => handleSetDefault(template.id)}
                          className="text-yellow-600 hover:text-yellow-900"
                          title="Set as Default"
                        >
                          <Star className="h-4 w-4" />
                        </button>
                      )}
                      {!template.is_default && (
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {predefinedTemplates.map((template) => (
            <div
              key={template.id}
              className="bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => handleUsePredefinedTemplate(template)}
            >
              <div className="h-48 bg-gradient-to-br from-brown-100 to-brown-200 rounded-t-lg flex items-center justify-center">
                <Mail className="h-24 w-24 text-brown-600 opacity-50" />
              </div>
              <div className="p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-4">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs bg-gray-100 text-gray-800 px-2 py-1 rounded">
                    {template.type.replace('_', ' ')}
                  </span>
                  <button className="text-brown-600 hover:text-brown-700 flex items-center gap-1 text-sm">
                    <Copy className="h-4 w-4" />
                    Use Template
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      {showEditor && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                {editingTemplate.id ? 'Edit Template' : 'Create Template'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Template Name
                  </label>
                  <input
                    type="text"
                    value={editingTemplate.name || ''}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brown-500 focus:border-brown-500"
                    placeholder="e.g., Order Confirmation"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Type
                  </label>
                  <select
                    value={editingTemplate.type || 'order_confirmation'}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, type: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brown-500 focus:border-brown-500"
                  >
                    <option value="order_confirmation">Order Confirmation</option>
                    <option value="shipping_confirmation">Shipping Confirmation</option>
                    <option value="payment_received">Payment Received</option>
                    <option value="order_cancelled">Order Cancelled</option>
                    <option value="promotional">Promotional</option>
                  </select>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={editingTemplate.subject || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, subject: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brown-500 focus:border-brown-500"
                  placeholder="e.g., Order Confirmation - {{.OrderNumber}}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {"{{.VariableName}}"} syntax for dynamic variables
                </p>
              </div>

              <div className="mb-6">
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Template Variables
                  </label>
                  <button
                    type="button"
                    onClick={addVariable}
                    className="text-sm text-brown-600 hover:text-brown-700 flex items-center gap-1"
                  >
                    <Plus className="h-4 w-4" />
                    Add Variable
                  </button>
                </div>
                
                {editingTemplate.variables && editingTemplate.variables.length > 0 && (
                  <div className="space-y-3">
                    {editingTemplate.variables.map((variable, index) => (
                      <div key={index} className="bg-gray-50 p-4 rounded-md">
                        <div className="grid grid-cols-3 gap-3">
                          <input
                            type="text"
                            value={variable.key}
                            onChange={(e) => updateVariable(index, 'key', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Variable Key"
                          />
                          <input
                            type="text"
                            value={variable.label}
                            onChange={(e) => updateVariable(index, 'label', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Display Label"
                          />
                          <div className="flex gap-2">
                            <select
                              value={variable.type}
                              onChange={(e) => updateVariable(index, 'type', e.target.value)}
                              className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
                            >
                              <option value="string">String</option>
                              <option value="number">Number</option>
                              <option value="date">Date</option>
                              <option value="array">Array</option>
                              <option value="object">Object</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => removeVariable(index)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-5 w-5" />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-3">
                          <input
                            type="text"
                            value={variable.example || ''}
                            onChange={(e) => updateVariable(index, 'example', e.target.value)}
                            className="px-3 py-2 border border-gray-300 rounded-md"
                            placeholder="Example Value"
                          />
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={variable.required}
                              onChange={(e) => updateVariable(index, 'required', e.target.checked)}
                              className="rounded text-brown-600"
                            />
                            <label className="text-sm text-gray-700">Required</label>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  HTML Template
                </label>
                <textarea
                  value={editingTemplate.html_content || ''}
                  onChange={(e) => setEditingTemplate({ ...editingTemplate, html_content: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brown-500 focus:border-brown-500 font-mono text-sm"
                  rows={15}
                  placeholder="Enter your HTML template here..."
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use Go template syntax: {"{{.VariableName}}"} for variables, {"{{range .Items}}"} for loops
                </p>
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={editingTemplate.is_active}
                    onChange={(e) => setEditingTemplate({ ...editingTemplate, is_active: e.target.checked })}
                    className="rounded text-brown-600"
                  />
                  <span className="text-sm text-gray-700">Active</span>
                </label>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowEditor(false);
                  setEditingTemplate({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveTemplate}
                disabled={loading}
                className="bg-brown-600 text-white px-4 py-2 rounded-md hover:bg-brown-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Save className="h-4 w-4" />
                {loading ? 'Saving...' : 'Save Template'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Test Email Modal */}
      {showTestModal && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">
                Send Test Email
              </h2>
            </div>
            
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template: {selectedTemplate.name}
                </label>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send To Email
                </label>
                <input
                  type="email"
                  value={testEmail}
                  onChange={(e) => setTestEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brown-500 focus:border-brown-500"
                  placeholder="test@example.com"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Test Data (JSON)
                </label>
                <textarea
                  value={JSON.stringify(testData, null, 2)}
                  onChange={(e) => {
                    try {
                      setTestData(JSON.parse(e.target.value));
                    } catch (error) {
                      // Invalid JSON, ignore
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-brown-500 focus:border-brown-500 font-mono text-sm"
                  rows={10}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Edit the test data to customize the email content
                </p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowTestModal(false);
                  setTestEmail('');
                  setTestData({});
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleTestEmail}
                disabled={loading || !testEmail}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <Send className="h-4 w-4" />
                {loading ? 'Sending...' : 'Send Test Email'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {showPreview && selectedTemplate && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Template Preview: {selectedTemplate.name}
              </h2>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                ×
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject: {selectedTemplate.subject}
                </label>
              </div>
              
              <div className="border border-gray-300 rounded-md p-4 bg-gray-50">
                <div dangerouslySetInnerHTML={{ __html: selectedTemplate.html_content }} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmailTemplates;