import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, Mail, Phone, MapPin, Package, Heart, 
  Settings, LogOut, Edit2, Save, X, Plus, Trash2 
} from 'lucide-react';
import { RootState, AppDispatch } from '../store';
import { logout, fetchProfile } from '../store/slices/authSlice';
import toast from 'react-hot-toast';
import api from '../services/api';

const profileSchema = z.object({
  first_name: z.string().min(2, 'First name is required'),
  last_name: z.string().min(2, 'Last name is required'),
  phone: z.string().min(10, 'Valid phone number required'),
  email: z.string().email('Invalid email'),
});

const addressSchema = z.object({
  type: z.enum(['home', 'work', 'other']),
  line1: z.string().min(1, 'Address is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postal_code: z.string().min(6, 'Postal code required'),
  country: z.string().default('India'),
  phone: z.string().min(10, 'Phone number required'),
  is_default: z.boolean(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type AddressFormData = z.infer<typeof addressSchema>;

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState('profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    reset: resetProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
  });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    formState: { errors: addressErrors },
    reset: resetAddress,
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
    } else {
      dispatch(fetchProfile());
    }
  }, [isAuthenticated, navigate, dispatch]);

  useEffect(() => {
    if (user) {
      resetProfile({
        first_name: user.profile.first_name,
        last_name: user.profile.last_name,
        phone: user.profile.phone,
        email: user.email,
      });
    }
  }, [user, resetProfile]);

  const handleProfileUpdate = async (data: ProfileFormData) => {
    try {
      await api.put('/profile', {
        profile: {
          first_name: data.first_name,
          last_name: data.last_name,
          phone: data.phone,
        },
      });
      toast.success('Profile updated successfully');
      setIsEditing(false);
      dispatch(fetchProfile());
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const handleAddressSubmitForm = async (data: AddressFormData) => {
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress}`, data);
        toast.success('Address updated successfully');
      } else {
        await api.post('/addresses', data);
        toast.success('Address added successfully');
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddress();
      dispatch(fetchProfile());
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
      try {
        await api.delete(`/addresses/${addressId}`);
        toast.success('Address deleted successfully');
        dispatch(fetchProfile());
      } catch (error) {
        toast.error('Failed to delete address');
      }
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out successfully');
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'profile', name: 'Profile', icon: User },
    { id: 'addresses', name: 'Addresses', icon: MapPin },
    { id: 'orders', name: 'Orders', icon: Package },
    { id: 'wishlist', name: 'Wishlist', icon: Heart },
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={40} className="text-primary-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold">
                    {user.profile.first_name} {user.profile.last_name}
                  </h1>
                  <p className="text-gray-600">{user.email}</p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 text-red-600 hover:text-red-700"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          <div className="flex">
            <div className="w-64 border-r">
              <nav className="p-4">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-md transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary-50 text-primary-600'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <tab.icon size={20} />
                    <span>{tab.name}</span>
                  </button>
                ))}
              </nav>
            </div>

            <div className="flex-1 p-6">
              {activeTab === 'profile' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Personal Information</h2>
                    {!isEditing ? (
                      <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                      >
                        <Edit2 size={18} />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
                      >
                        <X size={18} />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-500">First Name</label>
                          <p className="mt-1 text-lg">{user.profile.first_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Last Name</label>
                          <p className="mt-1 text-lg">{user.profile.last_name}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Email</label>
                          <p className="mt-1 text-lg">{user.email}</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-500">Phone</label>
                          <p className="mt-1 text-lg">{user.profile.phone || 'Not provided'}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleProfileSubmit(handleProfileUpdate)} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            First Name
                          </label>
                          <input
                            {...registerProfile('first_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          {profileErrors.first_name && (
                            <p className="text-red-500 text-sm mt-1">{profileErrors.first_name.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Last Name
                          </label>
                          <input
                            {...registerProfile('last_name')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          {profileErrors.last_name && (
                            <p className="text-red-500 text-sm mt-1">{profileErrors.last_name.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Email
                          </label>
                          <input
                            {...registerProfile('email')}
                            disabled
                            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Phone
                          </label>
                          <input
                            {...registerProfile('phone')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          {profileErrors.phone && (
                            <p className="text-red-500 text-sm mt-1">{profileErrors.phone.message}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-3">
                        <button
                          type="submit"
                          className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                        >
                          <Save size={18} />
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Saved Addresses</h2>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                    >
                      <Plus size={18} />
                      <span>Add New Address</span>
                    </button>
                  </div>

                  {showAddressForm && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-semibold mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <form onSubmit={handleAddressSubmit(handleAddressSubmitForm)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Type
                            </label>
                            <select
                              {...registerAddress('type')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            >
                              <option value="home">Home</option>
                              <option value="work">Work</option>
                              <option value="other">Other</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <input
                              {...registerAddress('phone')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Line 1
                          </label>
                          <input
                            {...registerAddress('line1')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Line 2
                          </label>
                          <input
                            {...registerAddress('line2')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              {...registerAddress('city')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State
                            </label>
                            <input
                              {...registerAddress('state')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postal Code
                            </label>
                            <input
                              {...registerAddress('postal_code')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="flex items-center">
                            <input
                              {...registerAddress('is_default')}
                              type="checkbox"
                              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                            />
                            <span className="ml-2 text-sm text-gray-600">Set as default address</span>
                          </label>
                        </div>
                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                          >
                            Save Address
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                              resetAddress();
                            }}
                            className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {user.addresses?.map((address) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="inline-block px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded-md capitalize">
                              {address.type}
                            </span>
                            {address.is_default && (
                              <span className="ml-2 inline-block px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-md">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingAddress(address.id);
                                setShowAddressForm(true);
                                resetAddress(address);
                              }}
                              className="text-gray-600 hover:text-primary-600"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={() => handleDeleteAddress(address.id)}
                              className="text-gray-600 hover:text-red-600"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <p className="text-sm text-gray-800">
                          {address.line1}
                          {address.line2 && `, ${address.line2}`}
                        </p>
                        <p className="text-sm text-gray-800">
                          {address.city}, {address.state} - {address.postal_code}
                        </p>
                        <p className="text-sm text-gray-600 mt-2">
                          <Phone size={14} className="inline mr-1" />
                          {address.phone}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'orders' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Order History</h2>
                  <p className="text-gray-600">You can view your order history on the Orders page.</p>
                  <button
                    onClick={() => navigate('/orders')}
                    className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                  >
                    View Orders
                  </button>
                </div>
              )}

              {activeTab === 'wishlist' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Your Wishlist</h2>
                  <p className="text-gray-600">Manage your saved items on the Wishlist page.</p>
                  <button
                    onClick={() => navigate('/wishlist')}
                    className="mt-4 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                  >
                    View Wishlist
                  </button>
                </div>
              )}

              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                  <div className="space-y-6">
                    <div>
                      <h3 className="text-lg font-medium mb-3">Email Preferences</h3>
                      <div className="space-y-2">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-600">Newsletter subscription</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-600">Order updates</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded border-gray-300 text-primary-600 focus:ring-primary-500" />
                          <span className="ml-2 text-sm text-gray-600">Promotional offers</span>
                        </label>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3">Security</h3>
                      <button className="text-primary-600 hover:text-primary-700">
                        Change Password
                      </button>
                    </div>

                    <div>
                      <h3 className="text-lg font-medium mb-3 text-red-600">Danger Zone</h3>
                      <button className="text-red-600 hover:text-red-700">
                        Delete Account
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}