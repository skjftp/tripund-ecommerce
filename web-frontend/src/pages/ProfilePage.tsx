import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { 
  User, Mail, Phone, MapPin, Package, Heart, 
  Settings, LogOut, Edit2, Save, X, Plus, Trash2, Navigation
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

// Indian States for dropdown
const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat',
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh',
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab',
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh',
  'Uttarakhand', 'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh',
  'Dadra and Nagar Haveli and Daman and Diu', 'Delhi', 'Jammu and Kashmir', 'Ladakh',
  'Lakshadweep', 'Puducherry'
];

export default function ProfilePage() {
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // Check URL parameter for tab
  const tabFromUrl = searchParams.get('tab');
  const [activeTab, setActiveTab] = useState(tabFromUrl || 'profile');
  const [isEditing, setIsEditing] = useState(false);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<string | null>(null);
  const [gettingLocation, setGettingLocation] = useState(false);

  const {
    register: registerProfile,
    handleSubmit: handleProfileSubmit,
    formState: { errors: profileErrors },
    setValue: setProfileValue,
    watch: watchProfile,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      first_name: user?.profile.first_name || '',
      last_name: user?.profile.last_name || '',
      phone: user?.mobile_number || '',
      email: user?.email || '',
    },
  });

  const {
    register: registerAddress,
    handleSubmit: handleAddressSubmit,
    formState: { errors: addressErrors },
    setValue: setAddressValue,
    reset: resetAddress,
  } = useForm({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      type: 'home',
      line1: '',
      line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India',
      phone: '',
      is_default: false,
    },
  });

  const [addresses, setAddresses] = useState<any[]>([]);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    dispatch(fetchProfile());
    fetchAddresses();
  }, [isAuthenticated, navigate, dispatch]);

  useEffect(() => {
    if (user) {
      setProfileValue('first_name', user.profile.first_name || '');
      setProfileValue('last_name', user.profile.last_name || '');
      setProfileValue('phone', user.mobile_number || '');
      setProfileValue('email', user.email || '');
    }
  }, [user, setProfileValue]);

  const fetchAddresses = async () => {
    try {
      const response = await api.get('/profile/addresses');
      setAddresses(response.data.addresses || []);
    } catch (error) {
      console.error('Error fetching addresses:', error);
    }
  };


  const onProfileSubmit = async (data: ProfileFormData) => {
    try {
      await api.put('/profile', data);
      toast.success('Profile updated successfully');
      setIsEditing(false);
      dispatch(fetchProfile());
    } catch (error) {
      toast.error('Failed to update profile');
    }
  };

  const onAddressSubmit = async (data: any) => {
    try {
      if (editingAddress) {
        await api.put(`/profile/addresses/${editingAddress}`, data);
        toast.success('Address updated successfully');
      } else {
        await api.post('/profile/addresses', data);
        toast.success('Address added successfully');
      }
      setShowAddressForm(false);
      setEditingAddress(null);
      resetAddress();
      fetchAddresses();
    } catch (error) {
      toast.error('Failed to save address');
    }
  };

  const handleLogout = () => {
    dispatch(logout());
    navigate('/');
    toast.success('Logged out successfully');
  };

  // Get user's current location and auto-populate address
  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported by this browser');
      return;
    }

    setGettingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          
          // Use reverse geocoding to get address details
          const response = await fetch(
            `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
          );
          
          if (response.ok) {
            const locationData = await response.json();
            
            // Auto-populate form fields
            setAddressValue('line1', locationData.locality || '');
            setAddressValue('line2', locationData.localityInfo?.informative?.[0]?.description || '');
            setAddressValue('city', locationData.city || '');
            setAddressValue('state', locationData.principalSubdivision || '');
            setAddressValue('postal_code', locationData.postcode || '');
            setAddressValue('country', 'India');
            
            toast.success('Location detected and address populated');
          } else {
            toast.error('Failed to get address from location');
          }
        } catch (error) {
          console.error('Geocoding error:', error);
          toast.error('Failed to process location');
        } finally {
          setGettingLocation(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        toast.error('Unable to get your location. Please enter address manually.');
        setGettingLocation(false);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000
      }
    );
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
    { id: 'settings', name: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8">
      <div className="max-w-7xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-4 sm:p-6 border-b">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-primary-100 rounded-full flex items-center justify-center">
                  <User size={32} className="text-primary-600 sm:w-10 sm:h-10" />
                </div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-bold">
                    {user.name || (user.profile?.first_name && user.profile?.last_name ? user.profile.first_name + ' ' + user.profile.last_name : 'User')}
                  </h1>
                  <p className="text-gray-600 text-sm sm:text-base">
                    {user.mobile_number || user.email || 'Contact not available'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleLogout}
                className="flex items-center justify-center space-x-2 text-red-600 hover:text-red-700 px-4 py-2 rounded-md border border-red-200 hover:bg-red-50 w-full sm:w-auto"
              >
                <LogOut size={20} />
                <span>Logout</span>
              </button>
            </div>
          </div>

          {/* Mobile Tab Navigation */}
          <div className="lg:hidden border-b">
            <nav className="flex overflow-x-auto p-2 space-x-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md transition-colors whitespace-nowrap text-sm ${
                    activeTab === tab.id
                      ? 'bg-primary-50 text-primary-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.name}</span>
                </button>
              ))}
            </nav>
          </div>

          {/* Desktop Layout */}
          <div className="hidden lg:flex">
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
                        <Edit2 size={20} />
                        <span>Edit</span>
                      </button>
                    ) : (
                      <button
                        onClick={() => setIsEditing(false)}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
                      >
                        <X size={20} />
                        <span>Cancel</span>
                      </button>
                    )}
                  </div>

                  {!isEditing ? (
                    <div className="space-y-4">
                      <div className="space-y-4">
                        {/* Name Field - Handle both mobile and email users */}
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Name
                          </label>
                          <p className="text-gray-900">
                            {user.name || (user.profile?.first_name && user.profile?.last_name ? user.profile.first_name + ' ' + user.profile.last_name : 'Not provided')}
                          </p>
                        </div>
                        
                        {/* Contact Information */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Mobile Number
                            </label>
                            <p className="text-gray-900">{user.mobile_number || 'Not provided'}</p>
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Email
                            </label>
                            <p className="text-gray-900">{user.email || 'Not provided'}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                            type="email"
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
                          <Save size={20} />
                          <span>Save Changes</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setIsEditing(false)}
                          className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 px-4 py-2 border rounded-md"
                        >
                          <X size={20} />
                          <span>Cancel</span>
                        </button>
                      </div>
                    </form>
                  )}
                </div>
              )}

              {activeTab === 'addresses' && (
                <div>
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold">Delivery Addresses</h2>
                    <button
                      onClick={() => setShowAddressForm(true)}
                      className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                    >
                      <Plus size={20} />
                      <span>Add Address</span>
                    </button>
                  </div>

                  {showAddressForm && (
                    <div className="bg-gray-50 p-6 rounded-lg mb-6">
                      <h3 className="text-lg font-medium mb-4">
                        {editingAddress ? 'Edit Address' : 'Add New Address'}
                      </h3>
                      <form onSubmit={handleAddressSubmit(onAddressSubmit as any)} className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                          <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Address Line 1
                            </label>
                            <input
                              {...registerAddress('line1')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                              placeholder="Street address, apartment, etc."
                            />
                            {addressErrors.line1 && (
                              <p className="text-red-500 text-sm mt-1">{addressErrors.line1.message}</p>
                            )}
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            Address Line 2
                          </label>
                          <input
                            {...registerAddress('line2')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            placeholder="Apartment, suite, etc. (optional)"
                          />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              City
                            </label>
                            <input
                              {...registerAddress('city')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            {addressErrors.city && (
                              <p className="text-red-500 text-sm mt-1">{addressErrors.city.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              State
                            </label>
                            <input
                              {...registerAddress('state')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            {addressErrors.state && (
                              <p className="text-red-500 text-sm mt-1">{addressErrors.state.message}</p>
                            )}
                          </div>
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Postal Code
                            </label>
                            <input
                              {...registerAddress('postal_code')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            {addressErrors.postal_code && (
                              <p className="text-red-500 text-sm mt-1">{addressErrors.postal_code.message}</p>
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                              Phone
                            </label>
                            <input
                              {...registerAddress('phone')}
                              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                            />
                            {addressErrors.phone && (
                              <p className="text-red-500 text-sm mt-1">{addressErrors.phone.message}</p>
                            )}
                          </div>
                          <div className="flex items-center pt-6">
                            <label className="flex items-center">
                              <input
                                {...registerAddress('is_default')}
                                type="checkbox"
                                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                              />
                              <span className="ml-2 text-sm text-gray-700">Set as default address</span>
                            </label>
                          </div>
                        </div>

                        <div className="flex space-x-3">
                          <button
                            type="submit"
                            className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                          >
                            {editingAddress ? 'Update' : 'Add'} Address
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddressForm(false);
                              setEditingAddress(null);
                              resetAddress();
                            }}
                            className="text-gray-600 hover:text-gray-700 px-4 py-2 border rounded-md"
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    </div>
                  )}

                  <div className="space-y-4">
                    {addresses.map((address) => (
                      <div key={address.id} className="border rounded-lg p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mb-2">
                              {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                            </span>
                            {address.is_default && (
                              <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full ml-2">
                                Default
                              </span>
                            )}
                          </div>
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setEditingAddress(address.id);
                                setShowAddressForm(true);
                                Object.keys(address).forEach(key => {
                                  if (key !== 'id') {
                                    setAddressValue(key as any, address[key]);
                                  }
                                });
                              }}
                              className="text-primary-600 hover:text-primary-700"
                            >
                              <Edit2 size={16} />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await api.delete(`/profile/addresses/${address.id}`);
                                  toast.success('Address deleted successfully');
                                  fetchAddresses();
                                } catch (error) {
                                  toast.error('Failed to delete address');
                                }
                              }}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </div>
                        <div className="text-gray-700">
                          <p>{address.line1}</p>
                          {address.line2 && <p>{address.line2}</p>}
                          <p>{address.city}, {address.state} {address.postal_code}</p>
                          <p className="text-sm text-gray-500 mt-1">Phone: {address.phone}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}



              {activeTab === 'settings' && (
                <div>
                  <h2 className="text-xl font-semibold mb-6">Account Settings</h2>
                  <div className="space-y-6">
                    <div className="border rounded-lg p-4">
                      <h3 className="font-medium mb-4">Notification Preferences</h3>
                      <div className="space-y-3">
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="ml-2 text-sm">Email notifications for orders</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded" defaultChecked />
                          <span className="ml-2 text-sm">SMS notifications</span>
                        </label>
                        <label className="flex items-center">
                          <input type="checkbox" className="rounded" />
                          <span className="ml-2 text-sm">Promotional emails</span>
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Mobile Content */}
          <div className="lg:hidden p-4">
            {activeTab === 'profile' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">Personal Information</h2>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 text-primary-600 hover:text-primary-700"
                    >
                      <Edit2 size={18} />
                      <span className="text-sm">Edit</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => setIsEditing(false)}
                      className="flex items-center space-x-2 text-gray-600 hover:text-gray-700"
                    >
                      <X size={18} />
                      <span className="text-sm">Cancel</span>
                    </button>
                  )}
                </div>

                {!isEditing ? (
                  <div className="space-y-4">
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          First Name
                        </label>
                        <p className="text-gray-900">{user.profile.first_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Last Name
                        </label>
                        <p className="text-gray-900">{user.profile.last_name}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Email
                        </label>
                        <p className="text-gray-900">{user.email}</p>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <p className="text-gray-900">{user.mobile_number || 'Not provided'}</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
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
                        type="email"
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
                    <div className="flex flex-col space-y-2">
                      <button
                        type="submit"
                        className="flex items-center justify-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                      >
                        <Save size={18} />
                        <span>Save Changes</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditing(false)}
                        className="flex items-center justify-center space-x-2 text-gray-600 hover:text-gray-700 px-4 py-2 border rounded-md"
                      >
                        <X size={18} />
                        <span>Cancel</span>
                      </button>
                    </div>
                  </form>
                )}
              </div>
            )}

            {activeTab === 'addresses' && (
              <div>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-lg font-semibold">Addresses</h2>
                  <button
                    onClick={() => setShowAddressForm(true)}
                    className="flex items-center space-x-2 bg-primary-600 text-white px-3 py-2 rounded-md hover:bg-primary-700 text-sm"
                  >
                    <Plus size={16} />
                    <span>Add</span>
                  </button>
                </div>

                {showAddressForm && (
                  <div className="bg-gray-50 p-4 rounded-lg mb-6">
                    <h3 className="text-lg font-medium mb-4">
                      {editingAddress ? 'Edit Address' : 'Add New Address'}
                    </h3>
                    
                    {/* Location Button */}
                    <div className="mb-4">
                      <button
                        type="button"
                        onClick={getCurrentLocation}
                        disabled={gettingLocation}
                        className="w-full bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-center justify-center space-x-2 text-blue-700 hover:bg-blue-100 disabled:bg-gray-100"
                      >
                        <Navigation className={`w-5 h-5 ${gettingLocation ? 'animate-spin' : ''}`} />
                        <span>{gettingLocation ? 'Getting location...' : '📍 Use My Current Location'}</span>
                      </button>
                      <p className="text-xs text-gray-500 mt-1 text-center">
                        Auto-populate address from your location
                      </p>
                    </div>

                    <form onSubmit={handleAddressSubmit(onAddressSubmit)} className="space-y-4">
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
                          Address Line 1
                        </label>
                        <input
                          {...registerAddress('line1')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Street address, apartment, etc."
                        />
                        {addressErrors.line1 && (
                          <p className="text-red-500 text-sm mt-1">{addressErrors.line1.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Address Line 2
                        </label>
                        <input
                          {...registerAddress('line2')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          placeholder="Apartment, suite, etc. (optional)"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            City
                          </label>
                          <input
                            {...registerAddress('city')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          />
                          {addressErrors.city && (
                            <p className="text-red-500 text-sm mt-1">{addressErrors.city.message}</p>
                          )}
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-1">
                            State
                          </label>
                          <select
                            {...registerAddress('state')}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                          >
                            <option value="">Select State</option>
                            {INDIAN_STATES.map((state) => (
                              <option key={state} value={state}>
                                {state}
                              </option>
                            ))}
                          </select>
                          {addressErrors.state && (
                            <p className="text-red-500 text-sm mt-1">{addressErrors.state.message}</p>
                          )}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Postal Code
                        </label>
                        <input
                          {...registerAddress('postal_code')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {addressErrors.postal_code && (
                          <p className="text-red-500 text-sm mt-1">{addressErrors.postal_code.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          {...registerAddress('phone')}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                        />
                        {addressErrors.phone && (
                          <p className="text-red-500 text-sm mt-1">{addressErrors.phone.message}</p>
                        )}
                      </div>
                      <div>
                        <label className="flex items-center">
                          <input
                            {...registerAddress('is_default')}
                            type="checkbox"
                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                          />
                          <span className="ml-2 text-sm text-gray-700">Set as default address</span>
                        </label>
                      </div>
                      <div className="flex flex-col space-y-2">
                        <button
                          type="submit"
                          className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700"
                        >
                          {editingAddress ? 'Update' : 'Add'} Address
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowAddressForm(false);
                            setEditingAddress(null);
                            resetAddress();
                          }}
                          className="text-gray-600 hover:text-gray-700 px-4 py-2 border rounded-md"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                <div className="space-y-4">
                  {addresses.map((address) => (
                    <div key={address.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <span className="inline-block bg-gray-100 text-gray-800 text-xs px-2 py-1 rounded-full mb-2">
                            {address.type.charAt(0).toUpperCase() + address.type.slice(1)}
                          </span>
                          {address.is_default && (
                            <span className="inline-block bg-primary-100 text-primary-800 text-xs px-2 py-1 rounded-full ml-2">
                              Default
                            </span>
                          )}
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => {
                              setEditingAddress(address.id);
                              setShowAddressForm(true);
                              Object.keys(address).forEach(key => {
                                if (key !== 'id') {
                                  setAddressValue(key as any, address[key]);
                                }
                              });
                            }}
                            className="text-primary-600 hover:text-primary-700"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={async () => {
                              try {
                                await api.delete(`/profile/addresses/${address.id}`);
                                toast.success('Address deleted successfully');
                                fetchAddresses();
                              } catch (error) {
                                toast.error('Failed to delete address');
                              }
                            }}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                      <div className="text-gray-700 text-sm">
                        <p>{address.line1}</p>
                        {address.line2 && <p>{address.line2}</p>}
                        <p>{address.city}, {address.state} {address.postal_code}</p>
                        <p className="text-gray-500 mt-1">Phone: {address.phone}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}



            {activeTab === 'settings' && (
              <div>
                <h2 className="text-lg font-semibold mb-4">Account Settings</h2>
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-4">Notification Preferences</h3>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="ml-2 text-sm">Email notifications for orders</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" defaultChecked />
                      <span className="ml-2 text-sm">SMS notifications</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="rounded" />
                      <span className="ml-2 text-sm">Promotional emails</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}