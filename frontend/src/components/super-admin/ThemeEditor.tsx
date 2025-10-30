/**
 * Theme Editor Component
 *
 * Interactive theme customization interface with color picker,
 * logo upload, and live preview. Supports real-time preview and
 * preset themes.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  Palette,
  Upload,
  Download,
  RotateCcw,
  Eye,
  Save,
  Image as ImageIcon,
  Droplet
} from 'lucide-react';
import { TenantProfile, ThemeUpdateData } from '@/types/super-admin';

interface ThemeEditorProps {
  tenant: TenantProfile;
  initialTheme?: {
    primaryColor?: string;
    secondaryColor?: string;
    logoUrl?: string;
  };
  onSave: (themeData: ThemeUpdateData) => Promise<{ success: boolean; error?: string }>;
  onCancel?: () => void;
}

interface ThemePreset {
  name: string;
  primaryColor: string;
  secondaryColor: string;
  description: string;
}

const themePresets: ThemePreset[] = [
  {
    name: 'Ocean Blue',
    primaryColor: '#2563eb',
    secondaryColor: '#1e40af',
    description: 'Professional blue theme'
  },
  {
    name: 'Forest Green',
    primaryColor: '#059669',
    secondaryColor: '#047857',
    description: 'Natural green theme'
  },
  {
    name: 'Sunset Orange',
    primaryColor: '#ea580c',
    secondaryColor: '#dc2626',
    description: 'Warm orange theme'
  },
  {
    name: 'Royal Purple',
    primaryColor: '#7c3aed',
    secondaryColor: '#6d28d9',
    description: 'Elegant purple theme'
  },
  {
    name: 'Monochrome',
    primaryColor: '#374151',
    secondaryColor: '#1f2937',
    description: 'Classic gray theme'
  },
  {
    name: 'Ruby Red',
    primaryColor: '#dc2626',
    secondaryColor: '#b91c1c',
    description: 'Bold red theme'
  }
];

export function ThemeEditor({ tenant, initialTheme, onSave, onCancel }: ThemeEditorProps) {
  const [theme, setTheme] = useState({
    primaryColor: initialTheme?.primaryColor || tenant.primaryColor || '#2563eb',
    secondaryColor: initialTheme?.secondaryColor || tenant.secondaryColor || '#1e40af',
    logoUrl: initialTheme?.logoUrl || tenant.logoUrl || ''
  });
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'logo' | 'preview'>('colors');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (theme.logoUrl) {
      setLogoPreview(theme.logoUrl);
    }
  }, [theme.logoUrl]);

  const handleColorChange = (colorType: 'primaryColor' | 'secondaryColor', value: string) => {
    setTheme(prev => ({ ...prev, [colorType]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type and size
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        alert('Image size should be less than 5MB');
        return;
      }

      setLogoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setLogoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePresetSelect = (preset: ThemePreset) => {
    setTheme(prev => ({
      ...prev,
      primaryColor: preset.primaryColor,
      secondaryColor: preset.secondaryColor
    }));
  };

  const handleReset = () => {
    setTheme({
      primaryColor: '#2563eb',
      secondaryColor: '#1e40af',
      logoUrl: ''
    });
    setLogoFile(null);
    setLogoPreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const themeData: ThemeUpdateData = {
        primaryColor: theme.primaryColor,
        secondaryColor: theme.secondaryColor,
      };

      // Handle logo upload if there's a new file
      if (logoFile) {
        // In a real implementation, you'd upload the file to the server
        // and get the URL back. For now, we'll use the preview URL.
        themeData.logoUrl = logoPreview;
      } else if (theme.logoUrl) {
        themeData.logoUrl = theme.logoUrl;
      }

      const result = await onSave(themeData);
      if (!result.success) {
        alert(result.error || 'Failed to save theme');
      }
    } catch (error) {
      console.error('Theme save error:', error);
      alert('Failed to save theme');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl">
      {/* Header */}
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center space-x-2">
              <Palette className="w-5 h-5" />
              <span>Theme Editor</span>
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              Customize the appearance for {tenant.name}
            </p>
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleReset}
              className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Reset</span>
            </button>
            {onCancel && (
              <button
                onClick={onCancel}
                className="px-4 py-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
              >
                Cancel
              </button>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Saving...' : 'Save Theme'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: 'colors', label: 'Colors', icon: Droplet },
          { id: 'logo', label: 'Logo', icon: ImageIcon },
          { id: 'preview', label: 'Preview', icon: Eye }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center space-x-2 px-6 py-3 text-sm font-medium transition-colors
                ${activeTab === tab.id
                  ? 'text-blue-400 border-b-2 border-blue-400 bg-slate-700/50'
                  : 'text-slate-400 hover:text-white hover:bg-slate-700/30'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <div className="p-6">
        {/* Colors Tab */}
        {activeTab === 'colors' && (
          <div className="space-y-6">
            {/* Custom Colors */}
            <div>
              <h3 className="text-white font-medium mb-4">Custom Colors</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Primary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={theme.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className="w-16 h-16 rounded-lg border-2 border-slate-600 cursor-pointer"
                      />
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          backgroundColor: theme.primaryColor,
                          mixBlendMode: 'multiply'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={theme.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="#2563eb"
                      />
                      <p className="text-slate-500 text-xs mt-1">Primary brand color</p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Secondary Color
                  </label>
                  <div className="flex items-center space-x-3">
                    <div className="relative">
                      <input
                        type="color"
                        value={theme.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        className="w-16 h-16 rounded-lg border-2 border-slate-600 cursor-pointer"
                      />
                      <div
                        className="absolute inset-0 rounded-lg pointer-events-none"
                        style={{
                          backgroundColor: theme.secondaryColor,
                          mixBlendMode: 'multiply'
                        }}
                      />
                    </div>
                    <div className="flex-1">
                      <input
                        type="text"
                        value={theme.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        className="w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white"
                        placeholder="#1e40af"
                      />
                      <p className="text-slate-500 text-xs mt-1">Secondary accent color</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Preset Themes */}
            <div>
              <h3 className="text-white font-medium mb-4">Preset Themes</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {themePresets.map((preset) => (
                  <button
                    key={preset.name}
                    onClick={() => handlePresetSelect(preset)}
                    className="p-4 bg-slate-700 border border-slate-600 rounded-lg hover:border-slate-500 transition-colors text-left"
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="flex space-x-1">
                        <div
                          className="w-6 h-6 rounded border border-slate-500"
                          style={{ backgroundColor: preset.primaryColor }}
                        />
                        <div
                          className="w-6 h-6 rounded border border-slate-500"
                          style={{ backgroundColor: preset.secondaryColor }}
                        />
                      </div>
                      <span className="text-white font-medium">{preset.name}</span>
                    </div>
                    <p className="text-slate-400 text-sm">{preset.description}</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Logo Tab */}
        {activeTab === 'logo' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-white font-medium mb-4">Company Logo</h3>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Upload Section */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Upload Logo
                  </label>
                  <div className="border-2 border-dashed border-slate-600 rounded-lg p-8 text-center hover:border-slate-500 transition-colors">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                      id="logo-upload"
                    />
                    <label
                      htmlFor="logo-upload"
                      className="cursor-pointer flex flex-col items-center space-y-3"
                    >
                      <Upload className="w-12 h-12 text-slate-400" />
                      <div>
                        <p className="text-white font-medium">Click to upload logo</p>
                        <p className="text-slate-500 text-sm">PNG, JPG, GIF up to 5MB</p>
                      </div>
                    </label>
                  </div>
                  <p className="text-slate-500 text-xs mt-2">
                    Recommended size: 200x60px, transparent background
                  </p>
                </div>

                {/* Preview Section */}
                <div>
                  <label className="block text-slate-300 text-sm font-medium mb-2">
                    Preview
                  </label>
                  <div className="bg-slate-700 border border-slate-600 rounded-lg p-6 flex items-center justify-center min-h-[120px]">
                    {logoPreview ? (
                      <img
                        src={logoPreview}
                        alt="Logo preview"
                        className="max-w-full max-h-20 object-contain"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-12 h-12 text-slate-500 mx-auto mb-2" />
                        <p className="text-slate-500 text-sm">No logo uploaded</p>
                      </div>
                    )}
                  </div>
                  {logoPreview && (
                    <button
                      onClick={() => {
                        setLogoPreview('');
                        setLogoFile(null);
                        if (fileInputRef.current) fileInputRef.current.value = '';
                      }}
                      className="mt-3 text-red-400 hover:text-red-300 text-sm"
                    >
                      Remove logo
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Preview Tab */}
        {activeTab === 'preview' && (
          <div className="space-y-6">
            <h3 className="text-white font-medium mb-4">Live Preview</h3>

            {/* Website Preview */}
            <div>
              <p className="text-slate-400 text-sm mb-4">Website Header Preview</p>
              <div className="bg-white border border-slate-700 rounded-lg overflow-hidden">
                <div
                  className="p-4 text-white"
                  style={{ backgroundColor: theme.primaryColor }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      {logoPreview ? (
                        <img
                          src={logoPreview}
                          alt="Logo"
                          className="h-8 object-contain"
                        />
                      ) : (
                        <div className="w-32 h-8 bg-white/20 rounded flex items-center justify-center">
                          <span className="text-sm font-medium">LOGO</span>
                        </div>
                      )}
                      <nav className="hidden md:flex space-x-6">
                        <span className="hover:opacity-80 cursor-pointer">Home</span>
                        <span className="hover:opacity-80 cursor-pointer">Cars</span>
                        <span className="hover:opacity-80 cursor-pointer">About</span>
                        <span className="hover:opacity-80 cursor-pointer">Contact</span>
                      </nav>
                    </div>
                    <button
                      className="px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                      style={{ backgroundColor: theme.secondaryColor }}
                    >
                      Contact Us
                    </button>
                  </div>
                </div>
                <div className="p-8 text-gray-800">
                  <h4 className="text-2xl font-bold mb-4">Welcome to {tenant.name}</h4>
                  <p className="text-gray-600">
                    This is how your website will appear with the selected theme colors and logo.
                    The primary color is used for the main header and important elements,
                    while the secondary color is used for buttons and accents.
                  </p>
                </div>
              </div>
            </div>

            {/* Color Palette */}
            <div>
              <p className="text-slate-400 text-sm mb-4">Color Palette</p>
              <div className="flex space-x-4">
                <div className="text-center">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-slate-600"
                    style={{ backgroundColor: theme.primaryColor }}
                  />
                  <p className="text-slate-400 text-xs mt-2">Primary</p>
                  <p className="text-white text-sm font-mono">{theme.primaryColor}</p>
                </div>
                <div className="text-center">
                  <div
                    className="w-20 h-20 rounded-lg border-2 border-slate-600"
                    style={{ backgroundColor: theme.secondaryColor }}
                  />
                  <p className="text-slate-400 text-xs mt-2">Secondary</p>
                  <p className="text-white text-sm font-mono">{theme.secondaryColor}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}