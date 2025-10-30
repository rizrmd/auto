/**
 * Super Admin Monitoring Page
 *
 * System monitoring dashboard with health status, performance metrics,
  * WhatsApp bot analytics, and error tracking.
 */

import React, { useState, useEffect } from 'react';
import {
  Activity,
  Server,
  Database,
  Wifi,
  HardDrive,
  Cpu,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Download,
  Filter,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Minus
} from 'lucide-react';
import { useSuperAdminApi } from '@/context/SuperAdminAuthContext';
import { AnalyticsChart } from '@/components/super-admin/AnalyticsChart';
import { SystemHealth, WhatsAppBotMetrics, StorageMetrics } from '@/types/super-admin';

function MonitoringPage() {
  const { apiCall } = useSuperAdminApi();
  const [activeTab, setActiveTab] = useState<'health' | 'performance' | 'whatsapp' | 'storage' | 'logs'>('health');
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null);
  const [whatsappMetrics, setWhatsappMetrics] = useState<WhatsAppBotMetrics | null>(null);
  const [storageMetrics, setStorageMetrics] = useState<StorageMetrics | null>(null);
  const [errorLogs, setErrorLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    let interval: NodeJS.Timeout;
    if (autoRefresh) {
      interval = setInterval(loadMonitoringData, 30000); // Refresh every 30 seconds
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTab, autoRefresh]);

  const loadMonitoringData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [healthRes, whatsappRes, storageRes, logsRes] = await Promise.all([
        apiCall('/monitoring/health'),
        apiCall('/monitoring/whatsapp'),
        apiCall('/monitoring/storage'),
        apiCall('/monitoring/logs?limit=50')
      ]);

      if (healthRes?.success) {
        setSystemHealth(healthRes.data);
      }

      if (whatsappRes?.success) {
        setWhatsappMetrics(whatsappRes.data);
      }

      if (storageRes?.success) {
        setStorageMetrics(storageRes.data);
      }

      if (logsRes?.success) {
        setErrorLogs(logsRes.data.items || []);
      }
    } catch (err) {
      setError('Failed to load monitoring data');
      console.error('Monitoring data loading error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'text-green-400';
      case 'degraded': return 'text-yellow-400';
      case 'down': return 'text-red-400';
      default: return 'text-slate-400';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-400/10';
      case 'degraded': return 'bg-yellow-400/10';
      case 'down': return 'bg-red-400/10';
      default: return 'bg-slate-700/10';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy': return CheckCircle;
      case 'degraded': return AlertTriangle;
      case 'down': return XCircle;
      default: return Minus;
    }
  };

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  const mockPerformanceData = [
    { name: '00:00', cpu: 45, memory: 62, disk: 38, network: 25 },
    { name: '04:00', cpu: 38, memory: 58, disk: 37, network: 18 },
    { name: '08:00', cpu: 72, memory: 78, disk: 41, network: 65 },
    { name: '12:00', cpu: 85, memory: 82, disk: 44, network: 78 },
    { name: '16:00', cpu: 68, memory: 75, disk: 42, network: 58 },
    { name: '20:00', cpu: 52, memory: 68, disk: 39, network: 42 },
  ];

  const mockWhatsAppData = [
    { name: 'Mon', messages: 245, success: 98.2 },
    { name: 'Tue', messages: 312, success: 97.8 },
    { name: 'Wed', messages: 289, success: 99.1 },
    { name: 'Thu', messages: 356, success: 96.5 },
    { name: 'Fri', messages: 423, success: 97.2 },
    { name: 'Sat', messages: 198, success: 98.8 },
    { name: 'Sun', messages: 167, success: 99.4 },
  ];

  const getServiceIcon = (service: string) => {
    switch (service) {
      case 'database': return Database;
      case 'api': return Server;
      case 'whatsapp': return MessageSquare;
      case 'storage': return HardDrive;
      case 'cache': return Cpu;
      default: return Server;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">System Monitoring</h1>
          <p className="text-slate-400">Real-time system health and performance metrics</p>
        </div>
        <div className="flex items-center space-x-3">
          <label className="flex items-center space-x-2 text-slate-300">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-slate-600 bg-slate-700 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm">Auto Refresh</span>
          </label>
          <button
            onClick={loadMonitoringData}
            disabled={loading}
            className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* System Status Overview */}
      {systemHealth && (
        <div className={`
          border rounded-xl p-6
          ${getStatusBg(systemHealth.status)}
          border-${systemHealth.status === 'healthy' ? 'green' : systemHealth.status === 'degraded' ? 'yellow' : 'red'}-800/50
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              {(() => {
                const StatusIcon = getStatusIcon(systemHealth.status);
                return <StatusIcon className={`w-8 h-8 ${getStatusColor(systemHealth.status)}`} />;
              })()}
              <div>
                <h2 className="text-xl font-semibold text-white">
                  System Status: {systemHealth.status.toUpperCase()}
                </h2>
                <p className="text-slate-400 text-sm">
                  Last checked: {new Date(systemHealth.timestamp).toLocaleString()}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-slate-400 text-sm">Uptime</p>
                <p className="text-white font-medium">{formatUptime(systemHealth.performance.uptime)}</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Response Time</p>
                <p className="text-white font-medium">{systemHealth.performance.avgResponseTime}ms</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Error Rate</p>
                <p className="text-white font-medium">{systemHealth.performance.errorRate}%</p>
              </div>
              <div>
                <p className="text-slate-400 text-sm">Request Rate</p>
                <p className="text-white font-medium">{systemHealth.performance.requestRate}/s</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        {[
          { id: 'health', label: 'Service Health', icon: Activity },
          { id: 'performance', label: 'Performance', icon: TrendingUp },
          { id: 'whatsapp', label: 'WhatsApp Bot', icon: MessageSquare },
          { id: 'storage', label: 'Storage', icon: HardDrive },
          { id: 'logs', label: 'Error Logs', icon: AlertTriangle }
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

      {/* Health Tab */}
      {activeTab === 'health' && systemHealth && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Object.entries(systemHealth.services).map(([service, health]) => {
            const ServiceIcon = getServiceIcon(service);
            return (
              <div key={service} className="bg-slate-800 border border-slate-700 rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <ServiceIcon className="w-6 h-6 text-slate-400" />
                    <h3 className="text-white font-medium capitalize">{service}</h3>
                  </div>
                  {(() => {
                    const StatusIcon = getStatusIcon(health.status);
                    return <StatusIcon className={`w-5 h-5 ${getStatusColor(health.status)}`} />;
                  })()}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Status</span>
                    <span className={`text-sm font-medium ${getStatusColor(health.status)}`}>
                      {health.status.toUpperCase()}
                    </span>
                  </div>
                  {health.responseTime && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-sm">Response Time</span>
                      <span className="text-white text-sm">{health.responseTime}ms</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-400 text-sm">Last Check</span>
                    <span className="text-white text-sm">
                      {new Date(health.lastCheck).toLocaleTimeString()}
                    </span>
                  </div>
                  {health.error && (
                    <div className="mt-3 p-2 bg-red-900/20 border border-red-800/50 rounded">
                      <p className="text-red-400 text-xs">{health.error}</p>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Performance Tab */}
      {activeTab === 'performance' && systemHealth && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Cpu className="w-8 h-8 text-blue-400" />
                <span className="text-blue-400 text-2xl font-bold">
                  {systemHealth.resources.cpuUsage}%
                </span>
              </div>
              <p className="text-slate-400">CPU Usage</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Database className="w-8 h-8 text-green-400" />
                <span className="text-green-400 text-2xl font-bold">
                  {systemHealth.resources.memoryUsage}%
                </span>
              </div>
              <p className="text-slate-400">Memory Usage</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <HardDrive className="w-8 h-8 text-yellow-400" />
                <span className="text-yellow-400 text-2xl font-bold">
                  {systemHealth.resources.diskUsage}%
                </span>
              </div>
              <p className="text-slate-400">Disk Usage</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Wifi className="w-8 h-8 text-purple-400" />
                <span className="text-purple-400 text-2xl font-bold">
                  {systemHealth.resources.networkIO}MB/s
                </span>
              </div>
              <p className="text-slate-400">Network I/O</p>
            </div>
          </div>

          <AnalyticsChart
            type="area"
            title="Resource Usage Trends"
            subtitle="Last 24 hours"
            data={mockPerformanceData}
            series={[
              { key: 'cpu', name: 'CPU %', color: '#3b82f6' },
              { key: 'memory', name: 'Memory %', color: '#10b981' },
              { key: 'disk', name: 'Disk %', color: '#f59e0b' }
            ]}
            height={300}
          />
        </div>
      )}

      {/* WhatsApp Tab */}
      {activeTab === 'whatsapp' && whatsappMetrics && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <MessageSquare className="w-8 h-8 text-green-400" />
                <span className="text-green-400 text-2xl font-bold">
                  {whatsappMetrics.totalMessages}
                </span>
              </div>
              <p className="text-slate-400">Total Messages</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-8 h-8 text-blue-400" />
                <span className="text-blue-400 text-2xl font-bold">
                  {whatsappMetrics.successRate}%
                </span>
              </div>
              <p className="text-slate-400">Success Rate</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-8 h-8 text-yellow-400" />
                <span className="text-yellow-400 text-2xl font-bold">
                  {whatsappMetrics.averageResponseTime}s
                </span>
              </div>
              <p className="text-slate-400">Avg Response Time</p>
            </div>
            <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <AlertTriangle className="w-8 h-8 text-red-400" />
                <span className="text-red-400 text-2xl font-bold">
                  {whatsappMetrics.errorCount}
                </span>
              </div>
              <p className="text-slate-400">Error Count</p>
            </div>
          </div>

          <AnalyticsChart
            type="bar"
            title="WhatsApp Message Volume"
            subtitle="Daily message count and success rates"
            data={mockWhatsAppData}
            series={[
              { key: 'messages', name: 'Messages', color: '#25d366' },
              { key: 'success', name: 'Success Rate %', color: '#128c7e' }
            ]}
            height={300}
          />

          {/* Top Commands */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Top Commands</h3>
            <div className="space-y-3">
              {whatsappMetrics.topCommands.map((command, index) => (
                <div key={command.command} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <span className="text-slate-400 text-sm w-6">#{index + 1}</span>
                    <code className="text-white font-mono">{command.command}</code>
                  </div>
                  <span className="text-blue-400 font-medium">{command.count} uses</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Storage Tab */}
      {activeTab === 'storage' && storageMetrics && (
        <div className="space-y-6">
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-white">Storage Usage</h3>
              <span className="text-blue-400 text-xl font-bold">
                {(storageMetrics.totalUsage / 1024 / 1024 / 1024).toFixed(2)} GB
              </span>
            </div>
            <div className="w-full bg-slate-700 rounded-full h-4 mb-6">
              <div
                className="bg-blue-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${Math.min((storageMetrics.totalUsage / (100 * 1024 * 1024 * 1024)) * 100, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {storageMetrics.fileTypes.map((type) => (
                <div key={type.type} className="flex items-center justify-between p-3 bg-slate-700/30 rounded-lg">
                  <span className="text-white">{type.type.toUpperCase()}</span>
                  <div className="text-right">
                    <p className="text-blue-400 font-medium">
                      {(type.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <p className="text-slate-500 text-xs">{type.count} files</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tenant Usage */}
          <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Storage by Tenant</h3>
            <div className="space-y-3">
              {storageMetrics.tenantUsage.slice(0, 10).map((tenant) => (
                <div key={tenant.tenantId} className="flex items-center justify-between">
                  <span className="text-white">{tenant.tenantName}</span>
                  <div className="text-right">
                    <p className="text-blue-400 font-medium">
                      {(tenant.usage / 1024 / 1024).toFixed(1)} MB
                    </p>
                    <p className="text-slate-500 text-xs">{tenant.fileCount} files</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Logs Tab */}
      {activeTab === 'logs' && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Recent Error Logs</h3>
            <button
              onClick={loadMonitoringData}
              className="px-4 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors flex items-center space-x-2"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Refresh Logs</span>
            </button>
          </div>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {errorLogs.length > 0 ? (
              errorLogs.map((log, index) => (
                <div key={index} className="p-4 bg-slate-700/30 rounded-lg border border-slate-600">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <AlertTriangle className="w-4 h-4 text-red-400" />
                        <span className="text-red-400 font-medium">{log.level}</span>
                        <span className="text-slate-500 text-sm">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-white font-mono text-sm">{log.message}</p>
                      {log.stack && (
                        <details className="mt-2">
                          <summary className="text-slate-400 text-sm cursor-pointer">Stack Trace</summary>
                          <pre className="mt-2 text-slate-500 text-xs overflow-x-auto">
                            {log.stack}
                          </pre>
                        </details>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
                <p className="text-green-400 font-medium">No errors detected</p>
                <p className="text-slate-400 text-sm">System is running smoothly</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-900/20 border border-red-800/50 rounded-xl p-6">
          <div className="flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default MonitoringPage;