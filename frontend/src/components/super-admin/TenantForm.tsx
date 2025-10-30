/**
 * Tenant Form Component
 *
 * Comprehensive form for creating and editing tenants with validation,
 * business hours configuration, and theme settings.
 */

import React, { useState, useEffect } from 'react';
import { Building2, Phone, Mail, MapPin, Globe, Clock, DollarSign } from 'lucide-react';
import { TenantCreateData, TenantUpdateData, TenantProfile } from '@/types/super-admin';

interface TenantFormProps {
  tenant?: TenantProfile;
  onSubmit: (data: TenantCreateData | TenantUpdateData) => Promise<{ success: boolean; error?: string }>;
  onCancel: () => void;
  loading?: boolean;
}

interface BusinessHours {
  monday: string;
  tuesday: string;
  wednesday: string;
  thursday: string;
  friday: string;
  saturday: string;
  sunday: string;
}

const defaultBusinessHours: BusinessHours = {
  monday: '09:00-18:00',
  tuesday: '09:00-18:00',
  wednesday: '09:00-18:00',
  thursday: '09:00-18:00',
  friday: '09:00-18:00',
  saturday: '09:00-15:00',
  sunday: 'Closed'
};

const plans = [
  { value: 'trial', label: 'Trial', description: '14 days free trial' },
  { value: 'free', label: 'Free', description: 'Basic features, limited listings' },
  { value: 'starter', label: 'Starter', description: 'Small businesses' },
  { value: 'growth', label: 'Growth', description: 'Growing businesses' },
  { value: 'pro', label: 'Pro', description: 'Large businesses' }
];

export function TenantForm({ tenant, onSubmit, onCancel, loading = false }: TenantFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    subdomain: '',
    customDomain: '',
    phone: '',
    whatsappNumber: '',
    email: '',
    address: '',
    city: '',
    mapsUrl: '',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    plan: 'trial' as const,
    businessHours: defaultBusinessHours,
    status: 'active' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (tenant) {
      setFormData({
        name: tenant.name,
        subdomain: tenant.subdomain,
        customDomain: tenant.customDomain || '',
        phone: tenant.phone,
        whatsappNumber: tenant.whatsappNumber,
        email: tenant.email || '',
        address: tenant.address || '',
        city: tenant.city || '',
        mapsUrl: tenant.mapsUrl || '',
        primaryColor: tenant.primaryColor || '#2563eb',
        secondaryColor: tenant.secondaryColor || '#1e40af',
        plan: tenant.plan || 'trial',
        businessHours: tenant.businessHours || defaultBusinessHours,
        status: tenant.status
      });
    }
  }, [tenant]);

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBusinessHoursChange = (day: keyof BusinessHours, value: string) => {
    setFormData(prev => ({
      ...prev,
      businessHours: { ...prev.businessHours, [day]: value }
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Business name is required';
    }

    if (!formData.subdomain.trim()) {
      newErrors.subdomain = 'Subdomain is required';
    } else if (!/^[a-z0-9][a-z0-9-]*[a-z0-9]$/.test(formData.subdomain)) {
      newErrors.subdomain = 'Subdomain can only contain lowercase letters, numbers, and hyphens';
    }

    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    }

    if (!formData.whatsappNumber.trim()) {
      newErrors.whatsappNumber = 'WhatsApp number is required';
    }

    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }

    if (formData.customDomain && !/^[a-zA-Z0-9][a-zA-Z0-9-]*[a-zA-Z0-9]*\.[a-zA-Z]{2,}$/.test(formData.customDomain)) {
      newErrors.customDomain = 'Invalid domain format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const submitData = { ...formData };

      // Remove fields that shouldn't be sent during update
      if (tenant) {
        delete (submitData as any).subdomain; // Don't allow changing subdomain
        delete (submitData as any).status;   // Status managed separately
      }

      const result = await onSubmit(submitData);
      if (!result.success) {
        setErrors({ submit: result.error || 'Failed to save tenant' });
      }
    } catch (error) {
      setErrors({ submit: 'An unexpected error occurred' });
    }
  };

  const generateSubdomain = () => {
    const baseName = formData.name
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-');
    setFormData(prev => ({ ...prev, subdomain: baseName }));
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl max-w-4xl mx-auto max-h-[90vh] overflow-y-auto">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <h2 className="text-xl font-semibold text-white">
          {tenant ? 'Edit Tenant' : 'Create New Tenant'}
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          {tenant ? 'Update tenant information and settings' : 'Add a new tenant to the platform'}
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errors.submit && (
          <div className="bg-red-900/20 border border-red-800/50 rounded-lg p-4">
            <p className="text-red-400 text-sm">{errors.submit}</p>
          </div>
        )}

        {/* Basic Information */}
        <div>
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Building2 className="w-5 h-5" />
            <span>Basic Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Business Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter business name"
              />
              {errors.name && <p className="text-red-400 text-xs mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Subdomain *
              </label>
              <div className="flex space-x-2">
                <input
                  type="text"
                  value={formData.subdomain}
                  onChange={(e) => handleInputChange('subdomain', e.target.value)}
                  disabled={!!tenant}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
                  placeholder="business-name"
                />
                {!tenant && (
                  <button
                    type="button"
                    onClick={generateSubdomain}
                    className="px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-slate-300 hover:text-white transition-colors"
                  >
                    Auto
                  </button>
                )}
              </div>
              <p className="text-slate-500 text-xs mt-1">
                .autoleads.com {tenant && '(cannot be changed)'}
              </p>
              {errors.subdomain && <p className="text-red-400 text-xs mt-1">{errors.subdomain}</p>}
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Custom Domain
              </label>
              <input
                type="text"
                value={formData.customDomain}
                onChange={(e) => handleInputChange('customDomain', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="showroom.com"
              />
              {errors.customDomain && <p className="text-red-400 text-xs mt-1">{errors.customDomain}</p>}
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Plan *
              </label>
              <select
                value={formData.plan}
                onChange={(e) => handleInputChange('plan', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
              >
                {plans.map(plan => (
                  <option key={plan.value} value={plan.value}>
                    {plan.label} - {plan.description}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Contact Information */}
        <div>
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Phone className="w-5 h-5" />
            <span>Contact Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Phone Number *
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) => handleInputChange('phone', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="+62 812-3456-7890"
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone}</p>}
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                WhatsApp Number *
              </label>
              <input
                type="tel"
                value={formData.whatsappNumber}
                onChange={(e) => handleInputChange('whatsappNumber', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="+62 812-3456-7890"
              />
              {errors.whatsappNumber && <p className="text-red-400 text-xs mt-1">{errors.whatsappNumber}</p>}
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="contact@showroom.com"
              />
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email}</p>}
            </div>
          </div>
        </div>

        {/* Address Information */}
        <div>
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <MapPin className="w-5 h-5" />
            <span>Address Information</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Address
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Jl. Sudirman No. 123"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                City
              </label>
              <input
                type="text"
                value={formData.city}
                onChange={(e) => handleInputChange('city', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Jakarta"
              />
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Google Maps URL
              </label>
              <input
                type="url"
                value={formData.mapsUrl}
                onChange={(e) => handleInputChange('mapsUrl', e.target.value)}
                className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="https://maps.google.com/..."
              />
            </div>
          </div>
        </div>

        {/* Theme Colors */}
        <div>
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Globe className="w-5 h-5" />
            <span>Theme Colors</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Primary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-slate-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.primaryColor}
                  onChange={(e) => handleInputChange('primaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Secondary Color
              </label>
              <div className="flex items-center space-x-3">
                <input
                  type="color"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="w-12 h-12 rounded-lg border border-slate-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.secondaryColor}
                  onChange={(e) => handleInputChange('secondaryColor', e.target.value)}
                  className="flex-1 px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div>
          <h3 className="text-white font-medium mb-4 flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Business Hours</span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(formData.businessHours).map(([day, hours]) => (
              <div key={day}>
                <label className="block text-slate-300 text-sm font-medium mb-2 capitalize">
                  {day}
                </label>
                <input
                  type="text"
                  value={hours}
                  onChange={(e) => handleBusinessHoursChange(day as keyof BusinessHours, e.target.value)}
                  className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="09:00-18:00 or Closed"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-4 pt-6 border-t border-slate-700">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="px-6 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Saving...' : (tenant ? 'Update Tenant' : 'Create Tenant')}
          </button>
        </div>
      </form>
    </div>
  );
}