/**
 * Ledger Device Management Kit integration
 * Based on official Ledger documentation: https://developers.ledger.com/docs/device-interaction/references/signers/eth
 */
import { DeviceManagementKit, DeviceManagementKitBuilder, DeviceActionStatus, UserInteractionRequired } from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { ContextModuleBuilder } from "@ledgerhq/context-module";
import { Observable } from "rxjs";

// Singleton for the DeviceManagementKit
let dmk: DeviceManagementKit | null = null;
let sessionId: string | null = null;
let signerEth: any = null;

/**
 * Initialize the DeviceManagementKit
 * This should be called once at application startup
 */
export const initializeLedgerDMK = async (): Promise<void> => {
  if (dmk) return;
  
  try {
    // Create DMK instance using the builder pattern with webHidTransportFactory
    dmk = new DeviceManagementKitBuilder()
      .addTransport(webHidTransportFactory)
      .build();
    
    console.log("Ledger DMK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Ledger DMK:", error);
    throw error;
  }
};

/**
 * Connect to a Ledger device and create a session
 */
export const connectToLedger = async (
  onStatusUpdate?: (status: string) => void
): Promise<{
  address: string;
  sessionId: string;
}> => {
  try {
    if (!dmk) {
      onStatusUpdate?.("Initializing Ledger DMK...");
      await initializeLedgerDMK();
    }

    if (!dmk) {
      throw new Error("Failed to initialize DeviceManagementKit");
    }

    onStatusUpdate?.("Discovering Ledger devices...");
    
    // First discover devices
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout;
      let discoverySubscription: any;
      
      const discoveryObservable = dmk!.startDiscovering({});
      
      discoverySubscription = discoveryObservable.subscribe({
        next: (device: any) => {
          console.log("Discovered device:", device);
          
          // Automatically connect to the first discovered device
          connectToDiscoveredDevice(device, onStatusUpdate, resolve, reject);
          clearTimeout(timeoutId);
          discoverySubscription.unsubscribe();
        },
        error: (error: Error) => {
          console.error("Device discovery error:", error);
          clearTimeout(timeoutId);
          reject(error);
        }
      });
      
      // Set timeout for discovery
      timeoutId = setTimeout(() => {
        discoverySubscription.unsubscribe();
        reject(new Error("No Ledger devices found. Please ensure your device is connected and unlocked."));
      }, 10000); // 10 seconds timeout
    });
  } catch (error) {
    console.error("Failed to connect to Ledger:", error);
    throw error;
  }
};

/**
 * Connect to a specific discovered device
 */
const connectToDiscoveredDevice = async (
  device: any,
  onStatusUpdate?: (status: string) => void,
  resolve?: (value: { address: string; sessionId: string }) => void,
  reject?: (reason?: any) => void
): Promise<void> => {
  try {
    if (!dmk) {
      throw new Error("DeviceManagementKit not initialized");
    }

    onStatusUpdate?.("Connecting to Ledger device...");
    // Connect to device and get session ID
    const newSessionId = await dmk.connect({ device });
    sessionId = newSessionId;
    
    // Create the Ethereum signer
    onStatusUpdate?.("Creating Ethereum signer...");
    const contextModule = new ContextModuleBuilder({
      originToken: "pay-peer-roll-app" // Your app's origin token
    }).build();
    
    signerEth = new SignerEthBuilder({
      dmk,
      sessionId: newSessionId,
    }).withContextModule(contextModule).build();
    
    // Get address from device using standard derivation path
    onStatusUpdate?.("Getting Ethereum address...");
    const derivationPath = "44'/60'/0'/0/0"; // Standard Ethereum derivation path
    
    if (!signerEth) {
      reject?.(new Error("Failed to create Ethereum signer"));
      return;
    }
    
    const { observable, cancel } = signerEth.getAddress(derivationPath, {
      checkOnDevice: true, // This will display the address on the device for verification
    });
    
    let timeoutId: NodeJS.Timeout;
    
    const subscription = observable.subscribe({
      next: (state: any) => {
        switch (state.status) {
          case DeviceActionStatus.NotStarted:
            onStatusUpdate?.("Initializing address retrieval...");
            break;
            
          case DeviceActionStatus.Pending:
            const { requiredUserInteraction } = state.intermediateValue || {};
            
            switch (requiredUserInteraction) {
              case UserInteractionRequired.UnlockDevice:
                onStatusUpdate?.("Please unlock your Ledger device");
                break;
              case UserInteractionRequired.ConfirmOpenApp:
                onStatusUpdate?.("Please open the Ethereum app on your Ledger");
                break;
              case UserInteractionRequired.VerifyAddress:
                onStatusUpdate?.("Please verify the address on your Ledger screen");
                break;
              default:
                onStatusUpdate?.("Waiting for device interaction...");
            }
            break;
            
          case DeviceActionStatus.Completed:
            const { address } = state.output;
            onStatusUpdate?.(`Address retrieved: ${address}`);
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            resolve?.({ address, sessionId: newSessionId });
            break;
            
          case DeviceActionStatus.Error:
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            reject?.(state.error);
            break;
            
          case DeviceActionStatus.Stopped:
            clearTimeout(timeoutId);
            subscription.unsubscribe();
            reject?.(new Error("Operation was cancelled"));
            break;
        }
      },
      error: (error: Error) => {
        clearTimeout(timeoutId);
        onStatusUpdate?.(`Error: ${error.message}`);
        reject?.(error);
      },
    });
    
    // Set a timeout to prevent hanging forever
    timeoutId = setTimeout(() => {
      subscription.unsubscribe();
      cancel();
      reject?.(new Error("Operation timed out. Please try again."));
    }, 120000); // 2 minutes timeout
  } catch (error) {
    console.error("Failed to connect to discovered device:", error);
    reject?.(error);
  }
};

/**
 * Sign a message with the connected Ledger device
 */
export const signMessageWithLedger = async (
  message: string,
  derivationPath: string = "44'/60'/0'/0/0",
  onStatusUpdate?: (status: string) => void
): Promise<string> => {
  try {
    if (!dmk || !signerEth || !sessionId) {
      throw new Error("Ledger device not connected. Please connect first.");
    }
    
    onStatusUpdate?.("Preparing to sign message...");
    
    return new Promise((resolve, reject) => {
      const { observable, cancel } = signerEth.signMessage(derivationPath, message);
      
      let timeoutId: NodeJS.Timeout;
      
      const subscription = observable.subscribe({
        next: (state: any) => {
          switch (state.status) {
            case DeviceActionStatus.NotStarted:
              onStatusUpdate?.("Initializing message signing...");
              break;
              
            case DeviceActionStatus.Pending:
              const { requiredUserInteraction } = state.intermediateValue || {};
              
              switch (requiredUserInteraction) {
                case UserInteractionRequired.UnlockDevice:
                  onStatusUpdate?.("Please unlock your Ledger device");
                  break;
                case UserInteractionRequired.ConfirmOpenApp:
                  onStatusUpdate?.("Please open the Ethereum app on your Ledger");
                  break;
                case UserInteractionRequired.SignPersonalMessage:
                  onStatusUpdate?.("Please review and sign the message on your Ledger");
                  break;
                default:
                  onStatusUpdate?.("Waiting for device interaction...");
              }
              break;
              
            case DeviceActionStatus.Completed:
              const { r, s, v } = state.output;
              
              // Format the signature in the standard way
              const formattedSig = r + s.slice(2) + v.toString(16).padStart(2, '0');
              
              onStatusUpdate?.("Message signed successfully!");
              clearTimeout(timeoutId);
              subscription.unsubscribe();
              resolve(formattedSig);
              break;
              
            case DeviceActionStatus.Error:
              clearTimeout(timeoutId);
              subscription.unsubscribe();
              reject(state.error);
              break;
              
            case DeviceActionStatus.Stopped:
              clearTimeout(timeoutId);
              subscription.unsubscribe();
              reject(new Error("Operation was cancelled"));
              break;
          }
        },
        error: (error: Error) => {
          clearTimeout(timeoutId);
          onStatusUpdate?.(`Error: ${error.message}`);
          reject(error);
        },
      });
      
      // Set a timeout to prevent hanging forever
      timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        cancel();
        reject(new Error("Operation timed out. Please try again."));
      }, 120000); // 2 minutes timeout
    });
  } catch (error) {
    console.error("Failed to sign message with Ledger:", error);
    throw error;
  }
};

/**
 * Disconnect from Ledger device and clean up resources
 */
export const disconnectLedger = async (): Promise<void> => {
  try {
    if (dmk && sessionId) {
      await dmk.disconnect({ sessionId });
      console.log("Disconnected from Ledger device");
    }
    
    sessionId = null;
    signerEth = null;
  } catch (error) {
    console.error("Error disconnecting from Ledger:", error);
    throw error;
  }
};

/**
 * Check if a Ledger is currently connected
 */
export const isLedgerConnected = (): boolean => {
  return !!dmk && !!sessionId && !!signerEth;
};

/**
 * Handle Ledger errors with more descriptive messages
 */
export const handleLedgerError = (error: unknown): string => {
  const errorMessage = error instanceof Error ? error.message : String(error);
  
  if (errorMessage.includes("cannot open device with path")) {
    return "Unable to access Ledger device. Make sure it's connected and not in use by another application.";
  } else if (errorMessage.includes("timeout")) {
    return "The operation timed out. Please ensure your Ledger is unlocked and the Ethereum app is open.";
  } else if (errorMessage.includes("denied by user")) {
    return "Operation cancelled by user on the Ledger device.";
  } else if (errorMessage.includes("WebHID")) {
    return "WebHID not supported. Please use Chrome, Edge or Opera browser.";
  } else {
    return `Ledger error: ${errorMessage}`;
  }
};
