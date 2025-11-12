// Simple logger for WhatsApp service manager
const serviceLogger = {
  info: (message: string) => console.log(`[WHATSAPP SERVICE] ${message}`),
  warn: (message: string) => console.warn(`[WHATSAPP SERVICE] ${message}`),
  error: (message: string) => console.error(`[WHATSAPP SERVICE] ${message}`)
};

interface WhatsAppServiceState {
  isPairing: boolean;
  isPaired: boolean;
  pairingStartTime?: number;
  currentDeviceId?: string;
  activeConnections: number;
}

interface TenantConnection {
  tenantId: string;
  instanceId: string;
  isPaired: boolean;
  deviceId?: string;
  pairingStartTime?: number;
  activeConnections: number;
  pairingTimeout?: NodeJS.Timeout;
}

class WhatsAppServiceManager {
  private static instance: WhatsAppServiceManager;
  private state: WhatsAppServiceState;
  private pairingTimeout: NodeJS.Timeout | null = null;
  private readonly PAIRING_TIMEOUT = 120000; // 2 minutes
  private readonly MAX_CONNECTIONS = 50; // ✅ ENHANCED: Support multiple tenants

  // ✅ NEW: Multi-tenant connection management
  private tenantConnections = new Map<string, TenantConnection>();
  private readonly MAX_CONNECTIONS_PER_TENANT = 1;

  private constructor() {
    this.state = {
      isPairing: false,
      isPaired: false,
      activeConnections: 0,
    };
  }

  public static getInstance(): WhatsAppServiceManager {
    if (!WhatsAppServiceManager.instance) {
      WhatsAppServiceManager.instance = new WhatsAppServiceManager();
    }
    return WhatsAppServiceManager.instance;
  }

  public async startPairing(tenantId: string): Promise<{ success: boolean; message: string }> {
    // ✅ ENHANCED: Multi-tenant support
    const tenantConnection = this.tenantConnections.get(tenantId);

    // Check if tenant is already pairing
    if (tenantConnection?.isPairing) {
      return {
        success: false,
        message: `Tenant ${tenantId} already pairing (started ${tenantConnection.pairingStartTime ?
          `${Math.floor((Date.now() - tenantConnection.pairingStartTime) / 1000)}s ago` : 'unknown duration'}).`
      };
    }

    // Check total connection limit
    const totalActiveConnections = Array.from(this.tenantConnections.values())
      .reduce((sum, conn) => sum + conn.activeConnections, 0);
    if (totalActiveConnections >= this.MAX_CONNECTIONS) {
      return {
        success: false,
        message: `Maximum total connections (${this.MAX_CONNECTIONS}) reached. Please disconnect some devices first.`
      };
    }

    // Check per-tenant connection limit
    if (tenantConnection?.activeConnections >= this.MAX_CONNECTIONS_PER_TENANT) {
      return {
        success: false,
        message: `Maximum connections per tenant (${this.MAX_CONNECTIONS_PER_TENANT}) reached for ${tenantId}.`
      };
    }

    // Create or update tenant connection
    const instanceId = `tenant-${tenantId}-${Date.now()}`;
    const newConnection: TenantConnection = {
      tenantId,
      instanceId,
      isPaired: false,
      pairingStartTime: Date.now(),
      activeConnections: 1,
      pairingTimeout: null
    };

    // Set timeout for this tenant's pairing
    newConnection.pairingTimeout = setTimeout(() => {
      this.resetTenantPairingState(tenantId);
    }, this.PAIRING_TIMEOUT);

    this.tenantConnections.set(tenantId, newConnection);

    serviceLogger.info(`[MULTI-TENANT] Starting pairing for tenant: ${tenantId} (instance: ${instanceId})`);

    return {
      success: true,
      message: `Multi-tenant pairing initiated for ${tenantId}`,
      data: { instanceId }
    };
  }

  // ✅ NEW: Complete pairing for specific tenant
  public async completeTenantPairing(tenantId: string, deviceId: string, instanceId: string): Promise<void> {
    const tenantConnection = this.tenantConnections.get(tenantId);
    if (!tenantConnection || !tenantConnection.isPairing) {
      serviceLogger.warn(`[${tenantId}] Pairing completion received but no active pairing process`);
      return;
    }

    tenantConnection.isPairing = false;
    tenantConnection.isPaired = true;
    tenantConnection.deviceId = deviceId;
    tenantConnection.activeConnections = 1;

    if (tenantConnection.pairingTimeout) {
      clearTimeout(tenantConnection.pairingTimeout);
      tenantConnection.pairingTimeout = null;
    }

    // Update global state for backward compatibility
    this.state.activeConnections = Array.from(this.tenantConnections.values())
      .reduce((sum, conn) => sum + conn.activeConnections, 0);

    serviceLogger.info(`[${tenantId}] Pairing completed successfully for device: ${deviceId} (instance: ${instanceId})`);
  }

  public async completePairing(deviceId: string): Promise<void> {
    if (!this.state.isPairing) {
      serviceLogger.warn(`Pairing completion received but no active pairing process`);
      return;
    }

    this.state.isPairing = false;
    this.state.isPaired = true;
    this.state.currentDeviceId = deviceId;

    if (this.pairingTimeout) {
      clearTimeout(this.pairingTimeout);
      this.pairingTimeout = null;
    }

    serviceLogger.info(`Pairing completed successfully for device: ${deviceId}`);
  }

  // ✅ NEW: Reset pairing state for specific tenant
  public async resetTenantPairingState(tenantId: string): Promise<void> {
    const tenantConnection = this.tenantConnections.get(tenantId);
    if (tenantConnection) {
      if (tenantConnection.pairingTimeout) {
        clearTimeout(tenantConnection.pairingTimeout);
      }

      // Remove tenant connection
      this.tenantConnections.delete(tenantId);

      // Update global state for backward compatibility
      this.state.activeConnections = Array.from(this.tenantConnections.values())
        .reduce((sum, conn) => sum + conn.activeConnections, 0);

      serviceLogger.info(`[${tenantId}] Tenant pairing state reset`);
    }
  }

  public async disconnectPairing(reason: string): Promise<void> {
    serviceLogger.info(`Disconnecting pairing. Reason: ${reason}`);
    await this.resetPairingState();
  }

  private async resetPairingState(): Promise<void> {
    this.state.isPairing = false;
    this.state.isPaired = false;
    this.state.currentDeviceId = undefined;
    this.state.activeConnections = Math.max(0, this.state.activeConnections - 1);

    if (this.pairingTimeout) {
      clearTimeout(this.pairingTimeout);
      this.pairingTimeout = null;
    }
  }

  public getState(): WhatsAppServiceState {
    return { ...this.state };
  }

  public isActive(): boolean {
    return this.state.isPairing || this.state.isPaired;
  }

  // ✅ NEW: Get tenant connection info
  public getTenantConnection(tenantId: string): TenantConnection | undefined {
    return this.tenantConnections.get(tenantId);
  }

  // ✅ NEW: Get all tenant connections
  public getAllTenantConnections(): Map<string, TenantConnection> {
    return new Map(this.tenantConnections);
  }

  // ✅ NEW: Check if tenant can start new pairing
  public canTenantStartPairing(tenantId: string): boolean {
    const tenantConnection = this.tenantConnections.get(tenantId);
    const totalActiveConnections = Array.from(this.tenantConnections.values())
      .reduce((sum, conn) => sum + conn.activeConnections, 0);

    return !tenantConnection?.isPairing &&
           totalActiveConnections < this.MAX_CONNECTIONS &&
           (tenantConnection?.activeConnections || 0) < this.MAX_CONNECTIONS_PER_TENANT;
  }

  public canStartNewPairing(): boolean {
    return !this.state.isPairing && this.state.activeConnections < this.MAX_CONNECTIONS;
  }
}

export default WhatsAppServiceManager;