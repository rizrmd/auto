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

class WhatsAppServiceManager {
  private static instance: WhatsAppServiceManager;
  private state: WhatsAppServiceState;
  private pairingTimeout: NodeJS.Timeout | null = null;
  private readonly PAIRING_TIMEOUT = 120000; // 2 minutes
  private readonly MAX_CONNECTIONS = 1;

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
    // Prevent concurrent pairing requests
    if (this.state.isPairing) {
      return {
        success: false,
        message: `Pairing already in progress for ${this.state.pairingStartTime ?
          `${Math.floor((Date.now() - this.state.pairingStartTime) / 1000)}s ago` : 'unknown duration'}.
          Please wait or cancel current session.`
      };
    }

    // Prevent multiple active connections
    if (this.state.activeConnections >= this.MAX_CONNECTIONS) {
      return {
        success: false,
        message: `Maximum connections (${this.MAX_CONNECTIONS}) already active.
          Please disconnect existing devices first.`
      };
    }

    // Start pairing process
    this.state.isPairing = true;
    this.state.pairingStartTime = Date.now();
    this.state.activeConnections++;

    // Set timeout to prevent indefinite pairing
    this.pairingTimeout = setTimeout(() => {
      this.resetPairingState();
    }, this.PAIRING_TIMEOUT);

    serviceLogger.info(`Starting pairing for tenant: ${tenantId}`);

    return {
      success: true,
      message: "Pairing initiated successfully"
    };
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

  public canStartNewPairing(): boolean {
    return !this.state.isPairing && this.state.activeConnections < this.MAX_CONNECTIONS;
  }
}

export default WhatsAppServiceManager;