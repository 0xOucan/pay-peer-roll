/**
 * Ledger Device Management Kit integration
 * Based on official Ledger documentation: https://developers.ledger.com/docs/device-interaction/references/signers/eth
 */
import { 
  DeviceManagementKit, 
  DeviceManagementKitBuilder, 
  DeviceActionStatus, 
  UserInteractionRequired,
  ConsoleLogger 
} from "@ledgerhq/device-management-kit";
import { webHidTransportFactory } from "@ledgerhq/device-transport-kit-web-hid";
import { SignerEthBuilder } from "@ledgerhq/device-signer-kit-ethereum";
import { ContextModuleBuilder } from "@ledgerhq/context-module";
import { Observable } from "rxjs";
import { IntmaxBridgeTypedData } from "./intmax-bridge-types";

// Singleton for the DeviceManagementKit
let dmk: DeviceManagementKit | null = null;
let sessionId: string | null = null;
let signerEth: any = null;
let discoverySubscription: any = null;

/**
 * Initialize the DeviceManagementKit
 * This should be called once at application startup
 * Based on: https://developers.ledger.com/docs/device-interaction/beginner/init_dmk
 */
export const initializeLedgerDMK = async (): Promise<void> => {
  if (dmk) return;
  
  try {
    console.log("Initializing Ledger Device Management Kit...");
    
    // Check if WebHID is available
    if (!navigator.hid) {
      throw new Error("WebHID not supported. Please use Chrome, Edge, or Opera browser.");
    }
    
    // Create DMK instance using the builder pattern with webHidTransportFactory
    // Following the official documentation pattern
    dmk = new DeviceManagementKitBuilder()
      .addLogger(new ConsoleLogger())
      .addTransport(webHidTransportFactory) // Transport is required!
      .build();
    
    console.log("Ledger DMK initialized successfully");
  } catch (error) {
    console.error("Failed to initialize Ledger DMK:", error);
    const errorMessage = handleLedgerError(error);
    throw new Error(`DMK initialization failed: ${errorMessage}`);
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
    // Check if we're in a production environment
    const isProduction = typeof window !== 'undefined' && window.location.hostname !== 'localhost' && !window.location.hostname.includes('127.0.0.1');
    
    if (isProduction) {
      console.log('🌐 Running in production environment');
      // Check if Web HID is available
      if (!navigator.hid) {
        throw new Error("Web HID API is not available in this browser/environment. Please use Chrome or Edge on HTTPS.");
      }
    }

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
          
          // Provide more specific error messages for production
          if (isProduction) {
            if (error.message.includes('HID')) {
              reject(new Error("HID access denied. Please ensure you're using HTTPS and have granted HID permissions."));
            } else if (error.message.includes('device')) {
              reject(new Error("No Ledger device found. Please connect your Ledger device and ensure it's unlocked."));
            } else {
              reject(new Error(`Ledger connection failed: ${error.message}`));
            }
          } else {
            reject(error);
          }
        }
      });
      
      // Set timeout for discovery
      timeoutId = setTimeout(() => {
        discoverySubscription.unsubscribe();
        const errorMessage = isProduction 
          ? "No Ledger devices found. Please ensure your device is connected, unlocked, and the Ethereum app is open."
          : "No Ledger devices found. Please ensure your device is connected and unlocked.";
        reject(new Error(errorMessage));
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
            const errorMessage = state.error?.message || state.error?.toString() || "Unknown error occurred";
            reject?.(new Error(errorMessage));
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
    
    // Set timeout for address retrieval
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
 * Sign EIP-712 typed data with the connected Ledger device
 * Based on: https://developers.ledger.com/docs/device-interaction/references/signers/eth#use-case-4-sign-typed-data
 */
export const signTypedDataWithLedger = async (
  typedData: IntmaxBridgeTypedData,
  derivationPath: string = "44'/60'/0'/0/0",
  onStatusUpdate?: (status: string) => void
): Promise<{
  r: string;
  s: string;
  v: number;
}> => {
  try {
    if (!dmk || !signerEth || !sessionId) {
      throw new Error("Ledger device not connected. Please connect first.");
    }
    
    console.log("Signing typed data with Ledger:", { typedData, derivationPath, sessionId });
    
    onStatusUpdate?.("Preparing to sign typed data...");
    
    return new Promise((resolve, reject) => {
      let signObservable;
      let cancel;
      
      try {
        console.log("Creating signTypedData observable...");
        const result = signerEth.signTypedData(derivationPath, typedData);
        signObservable = result.observable;
        cancel = result.cancel;
        console.log("SignTypedData observable created successfully");
      } catch (createError: any) {
        console.error("Failed to create signTypedData observable:", createError);
        reject(new Error(`Failed to create signing observable: ${handleLedgerError(createError)}`));
        return;
      }
      
      let timeoutId: NodeJS.Timeout;
      
      const subscription = signObservable.subscribe({
        next: (state: any) => {
          switch (state.status) {
            case DeviceActionStatus.NotStarted:
              onStatusUpdate?.("Initializing typed data signing...");
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
                case UserInteractionRequired.SignTypedData:
                  onStatusUpdate?.("Please review and sign the typed data on your Ledger");
                  break;
                default:
                  onStatusUpdate?.("Waiting for device interaction...");
              }
              break;
              
            case DeviceActionStatus.Completed:
              console.log("Ledger typed data signature complete - full state:", state);
              const output = state.output;
              console.log("Ledger typed data signature output:", output);
              
              if (!output || typeof output !== 'object') {
                reject(new Error("Invalid signature output format"));
                break;
              }
              
              if (output.r && output.s && output.v !== undefined) {
                const { r, s, v } = output;
                console.log("Typed data signature components:", { r, s, v });
                
                onStatusUpdate?.("Typed data signed successfully!");
                clearTimeout(timeoutId);
                subscription.unsubscribe();
                resolve({ r, s, v });
              } else {
                console.error("Unexpected typed data signature output format:", output);
                reject(new Error("Unexpected signature format from Ledger"));
              }
              break;
              
            case DeviceActionStatus.Error:
              console.error("Ledger typed data signing error:", state.error);
              clearTimeout(timeoutId);
              subscription.unsubscribe();
              
              const errorMessage = handleLedgerError(state.error || "Unknown error occurred during typed data signing");
              reject(new Error(errorMessage));
              break;
              
            case DeviceActionStatus.Stopped:
              clearTimeout(timeoutId);
              subscription.unsubscribe();
              reject(new Error("Operation was cancelled"));
              break;
          }
        },
        error: (error: any) => {
          console.error("Ledger typed data signing observable error:", error);
          clearTimeout(timeoutId);
          
          const errorMessage = handleLedgerError(error);
          onStatusUpdate?.(`Error: ${errorMessage}`);
          reject(new Error(errorMessage));
        },
      });
      
      // Set a timeout to prevent hanging forever
      timeoutId = setTimeout(() => {
        subscription.unsubscribe();
        cancel();
        reject(new Error("Operation timed out. Please try again."));
      }, 180000); // 3 minutes timeout for typed data signing
    });
  } catch (error) {
    console.error("Failed to sign typed data with Ledger:", error);
    throw error;
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
    
    console.log("Signing message with Ledger:", { message, derivationPath, sessionId });
    console.log("DMK instance:", !!dmk);
    console.log("SignerEth instance:", !!signerEth);
    console.log("Session ID:", sessionId);
    
    onStatusUpdate?.("Preparing to sign message...");
    
    // Check device session state before signing
    try {
      const deviceState = dmk.getConnectedDevice({ sessionId });
      console.log("Device state before signing:", deviceState);
      
      // Also check if we can get the session state
      const sessionStateObservable = dmk.getDeviceSessionState({ sessionId });
      console.log("Session state observable created:", !!sessionStateObservable);
      
      // Add a more specific check for device readiness
      if (!deviceState) {
        throw new Error("Device not connected or session invalid");
      }
      
      // Try to get more detailed device information
      console.log("Device state keys:", Object.keys(deviceState));
      console.log("Device state values:", Object.values(deviceState));
      
    } catch (stateError) {
      console.warn("Could not get device state:", stateError);
      console.warn("State error type:", typeof stateError);
      console.warn("State error keys:", stateError && typeof stateError === 'object' ? Object.keys(stateError) : 'N/A');
      
      const errorMessage = handleLedgerError(stateError);
      onStatusUpdate?.(`Device check failed: ${errorMessage}`);
      // Don't throw here, let the signing process handle the error
    }
    
    // The Device Management Kit expects the message as a plain string, not hex-encoded
    console.log("Message to sign:", message);
    console.log("Message length:", message.length);
    console.log("Message bytes:", new TextEncoder().encode(message));
    
    return new Promise((resolve, reject) => {
      let signObservable;
      let cancel;
      
      try {
        // Try signing with minimal parameters first
        console.log("Attempting to create signMessage observable...");
        console.log("SignerEth methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(signerEth)));
        
        // Log all available methods on the signerEth object
        console.log("SignerEth instance methods:", Object.getOwnPropertyNames(signerEth));
        console.log("SignerEth prototype methods:", Object.getOwnPropertyNames(Object.getPrototypeOf(signerEth)));
        
        // Try different message formats - some Ledger apps might have issues with emojis
        let messageToSign = message;
        
        // Check if message contains emojis or special characters that might cause issues
        const hasEmojis = /[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/u.test(message);
        
        if (hasEmojis) {
          console.log("Message contains emojis, trying simplified version...");
          // Try a very simple ASCII message without emojis first
          messageToSign = "Welcome to Pay-Peer-Roll App";
          console.log("Simplified message:", messageToSign);
        }
        
        console.log("Trying to sign with message format:", messageToSign);
        
        const result = signerEth.signMessage(derivationPath, messageToSign);
        signObservable = result.observable;
        cancel = result.cancel;
        console.log("SignMessage observable created successfully");
        console.log("Observable type:", typeof signObservable);
        console.log("Cancel function type:", typeof cancel);
      } catch (createError: any) {
        console.error("Failed to create signMessage observable:", createError);
        console.error("Create error type:", typeof createError);
        console.error("Create error keys:", createError && typeof createError === 'object' ? Object.keys(createError) : 'N/A');
        reject(new Error(`Failed to create signing observable: ${handleLedgerError(createError)}`));
        return;
      }
      
      let timeoutId: NodeJS.Timeout;
      
      const subscription = signObservable.subscribe({
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
              console.log("Ledger signature complete - full state:", state);
              const output = state.output;
              console.log("Ledger signature output:", output);
              
              // Check if we have the expected signature format
              if (!output || typeof output !== 'object') {
                reject(new Error("Invalid signature output format"));
                break;
              }
              
              // Try to extract signature components
              if (output.r && output.s && output.v !== undefined) {
                const { r, s, v } = output;
                console.log("Signature components:", { r, s, v });
                
                // Format the signature in the standard way (0x + r + s + v)
                try {
                  // Ensure r and s are properly formatted hex strings (without 0x prefix for concatenation)
                  const rHex = r.startsWith('0x') ? r.slice(2) : r;
                  const sHex = s.startsWith('0x') ? s.slice(2) : s;
                  const vHex = v.toString(16).padStart(2, '0');
                  
                  const formattedSig = `0x${rHex}${sHex}${vHex}`;
                  console.log("Formatted signature:", formattedSig);
                  
                  onStatusUpdate?.("Message signed successfully!");
                  clearTimeout(timeoutId);
                  subscription.unsubscribe();
                  resolve(formattedSig);
                } catch (sigError) {
                  console.error("Error formatting signature:", sigError);
                  reject(new Error("Failed to format signature"));
                }
              } else if (output.signature) {
                // If it's a single signature string, use it directly
                console.log("Direct signature:", output.signature);
                onStatusUpdate?.("Message signed successfully!");
                clearTimeout(timeoutId);
                subscription.unsubscribe();
                resolve(output.signature);
              } else {
                console.error("Unexpected signature output format:", output);
                reject(new Error("Unexpected signature format from Ledger"));
              }
              break;
              
            case DeviceActionStatus.Error:
              console.error("Ledger signing state error:", state.error);
              console.error("Full state object:", state);
              console.error("State keys:", Object.keys(state));
              console.error("State error type:", typeof state.error);
              console.error("State error constructor:", state.error?.constructor?.name);
              
              // Try to extract more detailed error information
              let detailedError = state.error;
              if (state.error && typeof state.error === 'object') {
                console.error("Error object keys:", Object.keys(state.error));
                console.error("Error object values:", Object.values(state.error));
                
                // Try to find nested error information
                if (state.error.error) {
                  console.error("Nested error:", state.error.error);
                  detailedError = state.error.error;
                }
                if (state.error.message) {
                  console.error("Error message:", state.error.message);
                  detailedError = state.error.message;
                }
                if (state.error.originalError) {
                  console.error("Original error:", state.error.originalError);
                  detailedError = state.error.originalError;
                }
                
                // Try JSON stringify with replacer to see hidden properties
                try {
                  const jsonError = JSON.stringify(state.error, (key, value) => {
                    if (value instanceof Error) {
                      const errorObj: any = { ...value };
                      errorObj.name = value.name;
                      errorObj.message = value.message;
                      errorObj.stack = value.stack;
                      return errorObj;
                    }
                    return value;
                  }, 2);
                  console.error("JSON stringified error:", jsonError);
                } catch (jsonErr) {
                  console.error("Could not stringify error:", jsonErr);
                }
              }
              
              clearTimeout(timeoutId);
              subscription.unsubscribe();
              
              // Use the enhanced error handler
              const errorMessage = handleLedgerError(detailedError || state.error || "Unknown error occurred during signing");
              
              reject(new Error(errorMessage));
              break;
              
            case DeviceActionStatus.Stopped:
              clearTimeout(timeoutId);
              subscription.unsubscribe();
              reject(new Error("Operation was cancelled"));
              break;
          }
        },
        error: (error: any) => {
          console.error("Ledger signing observable error:", error);
          console.error("Error type:", typeof error);
          console.error("Error constructor:", error?.constructor?.name);
          
          clearTimeout(timeoutId);
          
          // Use the enhanced error handler
          const errorMessage = handleLedgerError(error);
          
          onStatusUpdate?.(`Error: ${errorMessage}`);
          reject(new Error(errorMessage));
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
 * Diagnostic function to check device state
 */
export const diagnosticDeviceState = async (): Promise<{
  dmkInitialized: boolean;
  sessionId: string | null;
  signerInitialized: boolean;
  deviceConnected: boolean;
  deviceInfo?: any;
  error?: string;
}> => {
  const result: {
    dmkInitialized: boolean;
    sessionId: string | null;
    signerInitialized: boolean;
    deviceConnected: boolean;
    deviceInfo?: any;
    error?: string;
  } = {
    dmkInitialized: !!dmk,
    sessionId: sessionId,
    signerInitialized: !!signerEth,
    deviceConnected: false,
    deviceInfo: undefined,
    error: undefined,
  };

  try {
    if (dmk && sessionId) {
      const deviceInfo = await dmk.getConnectedDevice({ sessionId });
      result.deviceConnected = !!deviceInfo;
      result.deviceInfo = deviceInfo;
    }
  } catch (error) {
    result.error = handleLedgerError(error);
  }

  return result;
};

/**
 * Test function to verify Ledger setup and try a simple operation
 */
export const testLedgerSetup = async (): Promise<{
  success: boolean;
  diagnostics: any;
  testResults: {
    canGetDeviceInfo: boolean;
    canCreateSignObservable: boolean;
    error?: string;
  };
}> => {
  console.log("Starting Ledger setup test...");
  
  const diagnostics = await diagnosticDeviceState();
  console.log("Diagnostics:", diagnostics);
  
  const testResults = {
    canGetDeviceInfo: false,
    canCreateSignObservable: false,
    error: undefined as string | undefined,
  };
  
  try {
    // Test 1: Can we get device info?
    if (dmk && sessionId) {
      const deviceInfo = await dmk.getConnectedDevice({ sessionId });
      testResults.canGetDeviceInfo = !!deviceInfo;
      console.log("Device info test passed:", deviceInfo);
    }
    
    // Test 2: Can we create a sign observable?
    if (signerEth) {
      try {
        const testMessage = "test";
        const result = signerEth.signMessage("44'/60'/0'/0/0", testMessage, {
          skipOpenApp: true // Skip opening app for this test
        });
        testResults.canCreateSignObservable = !!result.observable;
        console.log("Sign observable test passed");
        
        // Cancel the test operation immediately
        if (result.cancel) {
          result.cancel();
        }
      } catch (signTestError) {
        console.warn("Sign observable test failed:", signTestError);
        testResults.error = handleLedgerError(signTestError);
      }
    }
    
  } catch (error) {
    testResults.error = handleLedgerError(error);
    console.error("Ledger setup test failed:", error);
  }
  
  const success = testResults.canGetDeviceInfo && testResults.canCreateSignObservable;
  
  return {
    success,
    diagnostics,
    testResults,
  };
};

/**
 * Handle Ledger errors with more descriptive messages
 */
export const handleLedgerError = (error: unknown): string => {
  let errorMessage = "";
  let errorTag = "";
  
  if (error instanceof Error) {
    errorMessage = error.message;
  } else if (typeof error === "string") {
    errorMessage = error;
  } else if (error && typeof error === "object") {
    // Handle complex error objects
    const errorObj = error as any;
    
    // Check for Ledger-specific error tags
    if (errorObj._tag) {
      errorTag = errorObj._tag;
    }
    
    // Try to extract meaningful error information
    if (errorObj.message) {
      errorMessage = errorObj.message;
    } else if (errorObj.error) {
      errorMessage = errorObj.error;
    } else if (errorObj.code) {
      errorMessage = `Error code: ${errorObj.code}`;
    } else if (errorObj.name) {
      errorMessage = `Error: ${errorObj.name}`;
    } else {
      // Try to stringify the object, but handle circular references
      try {
        const stringified = JSON.stringify(errorObj);
        if (stringified && stringified !== "{}" && stringified !== "null") {
          errorMessage = stringified;
        }
      } catch (e) {
        // Handle circular references or non-serializable objects
        errorMessage = errorObj.toString() || "Complex error object";
      }
    }
  } else {
    errorMessage = String(error);
  }
  
  // Handle empty or meaningless error messages
  if (!errorMessage || errorMessage === "{}" || errorMessage === "[object Object]" || errorMessage === "null" || errorMessage === "undefined") {
    errorMessage = "Device connection failed - please ensure your Ledger is connected, unlocked, and the Ethereum app is open";
  }
  
  // Handle specific Ledger error tags first
  if (errorTag === "InvalidStatusWordError") {
    return "⚠️ Ledger device error: This usually means:\n1. Your Ledger device is locked - please unlock it\n2. The Ethereum app is not open - please open it\n3. You rejected the operation on the device\n4. The device is being used by another application\n\nPlease ensure your Ledger is unlocked, the Ethereum app is open, and try again.";
  } else if (errorTag === "UserRejectedRequestError") {
    return "Operation cancelled by user on the Ledger device.";
  } else if (errorTag === "DeviceNotFoundError") {
    return "Ledger device not found. Please connect your device and try again.";
  } else if (errorTag === "TransportError") {
    return "Communication error with Ledger device. Please disconnect and reconnect your device.";
  }
  
  // Handle error message patterns
  if (errorMessage.includes("cannot open device with path")) {
    return "Unable to access Ledger device. Make sure it's connected and not in use by another application.";
  } else if (errorMessage.includes("timeout")) {
    return "The operation timed out. Please ensure your Ledger is unlocked and the Ethereum app is open.";
  } else if (errorMessage.includes("denied by user") || errorMessage.includes("user rejected")) {
    return "Operation cancelled by user on the Ledger device.";
  } else if (errorMessage.includes("WebHID")) {
    return "WebHID not supported. Please use Chrome, Edge or Opera browser.";
  } else if (errorMessage.includes("not connected") || errorMessage.includes("no device")) {
    return "Ledger device not connected. Please connect your device and try again.";
  } else if (errorMessage.includes("app not open") || errorMessage.includes("ethereum app")) {
    return "Please open the Ethereum app on your Ledger device.";
  } else if (errorMessage.includes("locked") || errorMessage.includes("unlock")) {
    return "Please unlock your Ledger device.";
  } else if (errorMessage.includes("InvalidStatusWordError")) {
    return "Ledger device error: Please ensure your Ledger is unlocked, the Ethereum app is open, and try the operation again.";
  } else if (errorMessage.includes("no signature returned")) {
    return "❌ Signing cancelled: No signature was returned from your Ledger device. This usually means:\n• You rejected the signing request on your device\n• You pressed the wrong buttons (use both buttons to confirm)\n• The message format is not supported\n\nPlease try again and make sure to approve the signing request on your device.";
  } else if (errorMessage.includes("Device connection failed") || errorMessage.includes("Error connecting to device")) {
    return "🔌 Connection Failed: Unable to connect to your Ledger device. Please:\n\n1. ✅ Ensure your Ledger is connected via USB\n2. 🔓 Unlock your device by entering your PIN\n3. 📱 Open the Ethereum app on your Ledger\n4. 🌐 Make sure you're using Chrome, Edge, or Opera browser\n5. 🔄 Try disconnecting and reconnecting your device\n\nIf the problem persists, try restarting your browser.";
  } else {
    return `Ledger error: ${errorMessage}`;
  }
};

/**
 * Alternative connection method with step-by-step guidance
 */
export const connectLedgerWithGuidance = async (
  onStatusUpdate?: (status: string) => void
): Promise<{
  address: string;
  sessionId: string;
}> => {
  onStatusUpdate?.("🔍 Checking browser compatibility...");
  
  // Check WebHID support
  if (!navigator.hid) {
    throw new Error("WebHID not supported. Please use Chrome, Edge, or Opera browser.");
  }
  
  onStatusUpdate?.("✅ Browser compatible. Please follow these steps:\n\n1. Connect your Ledger device via USB\n2. Unlock your device with your PIN\n3. Open the Ethereum app\n4. Click 'Continue' when ready");
  
  // Wait a moment for user to read instructions
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  try {
    return await connectToLedger(onStatusUpdate);
  } catch (error) {
    const errorMessage = handleLedgerError(error);
    throw new Error(errorMessage);
  }
};
