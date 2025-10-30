/**
 * Tenant Card Component
 *
 * Reusable card for displaying tenant information with health indicators,
 * stats, and quick actions. Features interactive elements and status badges.
 */

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Users,
  Car,
  MessageSquare,
  TrendingUp,
  MoreVertical,
  Eye,
  Edit,
  Settings,
  Activity,
  CheckCircle,
  AlertTriangle,
  XCircle,
  Clock
} from 'lucide-react';
import { TenantProfile } from '@/types/super-admin';

interface TenantCardProps {
  tenant: TenantProfile;
  onEdit?: (tenant: TenantProfile) => void;
  onSuspend?: (tenant: TenantProfile) => void;
  onActivate?: (tenant: TenantProfile) => void;
  onViewAnalytics?: (tenant: TenantProfile) => void;
  showActions?: boolean;
}

const getHealthColor = (score: number) => {
  if (score >= 80) return 'text-green-400';
  if (score >= 60) return 'text-yellow-400';
  return 'text-red-400';
};

const getHealthBg = (score: number) => {
  if (score >= 80) return 'bg-green-400/10';
  if (score >= 60) return 'bg-yellow-400/10';
  return 'bg-red-400/10';
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-green-400';
    case 'suspended': return 'bg-red-400';
    case 'trial': return 'bg-blue-400';
    case 'expired': return 'bg-gray-400';
    default: return 'bg-gray-400';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'active': return CheckCircle;
    case 'suspended': return XCircle;
    case 'trial': return Clock;
    case 'expired': return AlertTriangle;
    default: return AlertTriangle;
  }
};

export function TenantCard({
  tenant,
  onEdit,
  onSuspend,
  onActivate,
  onViewAnalytics,
  showActions = true
}: TenantCardProps) {
  const navigate = useNavigate();
  const [showDropdown, setShowDropdown] = useState(false);

  const handleCardClick = () => {
    navigate(`/super-admin/tenants/${tenant.id}`);
  };

  const handleEditClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit?.(tenant);
  };

  const handleSuspendClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSuspend?.(tenant);
  };

  const handleActivateClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onActivate?.(tenant);
  };

  const handleAnalyticsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onViewAnalytics?.(tenant);
  };

  const formatLastActivity = (date: Date | null) => {
    if (!date) return 'Never';
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
    return `${Math.floor(days / 30)} months ago`;
  };

  const StatusIcon = getStatusIcon(tenant.status);

  return (
    <div className="group relative bg-slate-800 border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-all duration-200 hover:shadow-lg cursor-pointer">
      {/* Status Indicator */}
      <div className="absolute top-4 right-4">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${getStatusColor(tenant.status)}`} />
          <StatusIcon className={`w-4 h-4 ${getStatusColor(tenant.status)}`} />
        </div>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-4" onClick={handleCardClick}>
        <div className="flex items-center space-x-3">
          <div className="w-12 h-12 bg-slate-700 rounded-lg flex items-center justify-center">
            <Building2 className="w-6 h-6 text-slate-300" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">{tenant.name}</h3>
            <p className="text-slate-400 text-sm">{tenant.subdomain}.autoleads.com</p>
            {tenant.customDomain && (
              <p className="text-slate-500 text-xs">{tenant.customDomain}</p>
            )}
          </div>
        </div>
      </div>

      {/* Health Score */}
      <div className={`
        flex items-center justify-between p-3 rounded-lg mb-4
        ${getHealthBg(tenant.healthScore)}
      `} onClick={handleCardClick}>
        <div className="flex items-center space-x-2">
          <Activity className={`w-5 h-5 ${getHealthColor(tenant.healthScore)}`} />
          <span className="text-slate-300 text-sm">Health Score</span>
        </div>
        <span className={`font-bold ${getHealthColor(tenant.healthScore)}`}>
          {tenant.healthScore}%
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-4" onClick={handleCardClick}>
        <div className="flex items-center space-x-2">
          <Car className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-white font-medium">{tenant._count.cars}</p>
            <p className="text-slate-500 text-xs">Cars</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <MessageSquare className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-white font-medium">{tenant._count.leads}</p>
            <p className="text-slate-500 text-xs">Leads</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Users className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-white font-medium">{tenant._count.users}</p>
            <p className="text-slate-500 text-xs">Users</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <TrendingUp className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-white font-medium">{tenant._count.soldCars}</p>
            <p className="text-slate-500 text-xs">Sold</p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-slate-700">
        <div className="text-sm text-slate-400">
          Last active: {formatLastActivity(tenant.lastActivity)}
        </div>

        {showActions && (
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowDropdown(!showDropdown);
              }}
              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
            >
              <MoreVertical className="w-4 h-4" />
            </button>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-lg shadow-xl z-10 overflow-hidden">
                <button
                  onClick={handleAnalyticsClick}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span>View Analytics</span>
                </button>
                <button
                  onClick={handleEditClick}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span>Edit Tenant</span>
                </button>
                <button
                  onClick={() => navigate(`/super-admin/tenants/${tenant.id}/theme`)}
                  className="flex items-center space-x-3 w-full px-4 py-3 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors"
                >
                  <Settings className="w-4 h-4" />
                  <span>Theme Settings</span>
                </button>
                <div className="border-t border-slate-700">
                  {tenant.status === 'active' ? (
                    <button
                      onClick={handleSuspendClick}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-red-400 hover:text-red-300 hover:bg-slate-700 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>Suspend Tenant</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleActivateClick}
                      className="flex items-center space-x-3 w-full px-4 py-3 text-green-400 hover:text-green-300 hover:bg-slate-700 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>Activate Tenant</span>
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}