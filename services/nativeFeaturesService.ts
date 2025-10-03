/**
 * Native Features Service
 * Provides access to device native features (Camera, GPS, Contacts, etc.)
 */

import { logger } from '../lib/logging/logger';

/**
 * CameraOptions Interface
 *
 * @interface CameraOptions
 */
export interface CameraOptions {
  facingMode?: 'user' | 'environment';
  width?: number;
  height?: number;
  quality?: number;
}

/**
 * GeolocationOptions Interface
 *
 * @interface GeolocationOptions
 */
export interface GeolocationOptions {
  enableHighAccuracy?: boolean;
  timeout?: number;
  maximumAge?: number;
}

/**
 * ContactInfo Interface
 *
 * @interface ContactInfo
 */
export interface ContactInfo {
  name?: string;
  phone?: string;
  email?: string;
}

/**
 * DeviceCapabilities Interface
 *
 * @interface DeviceCapabilities
 */
export interface DeviceCapabilities {
  camera: boolean;
  geolocation: boolean;
  contacts: boolean;
  vibration: boolean;
  notification: boolean;
  fileSystem: boolean;
  clipboard: boolean;
  share: boolean;
}

class NativeFeaturesService {
  private stream: MediaStream | null = null;

  /**
   * Check device capabilities
   */
  getDeviceCapabilities(): DeviceCapabilities {
    return {
      camera: 'mediaDevices' in navigator && 'getUserMedia' in navigator.mediaDevices,
      geolocation: 'geolocation' in navigator,
      contacts: 'contacts' in navigator && 'ContactsManager' in window,
      vibration: 'vibrate' in navigator,
      notification: 'Notification' in window,
      fileSystem: 'showOpenFilePicker' in window,
      clipboard: 'clipboard' in navigator,
      share: 'share' in navigator,
    };
  }

  /**
   * Access device camera
   */
  async accessCamera(options: CameraOptions = {}): Promise<MediaStream> {
    try {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error('Camera access not supported');
      }

      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: options.facingMode ?? 'environment',
          width: options.width ?? 1280,
          height: options.height ?? 720,
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      return this.stream;
    } catch (error) {
      logger.error('Camera access failed:', error);
      throw new Error(
        `Camera access failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Capture photo from camera
   */
  async capturePhoto(options: CameraOptions = {}): Promise<string> {
    try {
      const stream = await this.accessCamera(options);

      // Create video element to capture frame
      const video = document.createElement('video');
      video.srcObject = stream;
      video.autoplay = true;

      // Wait for video to be ready
      await new Promise<void>((resolve) => {
        video.onloadedmetadata = () => {
          resolve();
        };
      });

      // Create canvas to capture frame
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d')!;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      // Draw current frame to canvas
      context.drawImage(video, 0, 0, canvas.width, canvas.height);

      // Convert to base64
      const dataURL = canvas.toDataURL('image/jpeg', options.quality ?? 0.8);

      // Clean up
      this.stopCamera();

      return dataURL;
    } catch (error) {
      this.stopCamera();
      logger.error('Photo capture failed:', error);
      throw new Error(
        `Photo capture failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Stop camera stream
   */
  stopCamera(): void {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        track.stop();
      });
      this.stream = null;
    }
  }

  /**
   * Get current location
   */
  async getCurrentLocation(options: GeolocationOptions = {}): Promise<GeolocationPosition> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation not supported'));
        return;
      }

      const defaultOptions: GeolocationOptions = {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
        ...options,
      };

      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve(position);
        },
        (error) => {
          logger.error('Geolocation error:', error);
          reject(new Error(`Geolocation failed: ${error.message}`));
        },
        defaultOptions,
      );
    });
  }

  /**
   * Watch location changes
   */
  watchLocation(
    callback: (position: GeolocationPosition) => void,
    errorCallback?: (error: GeolocationPositionError) => void,
    options: GeolocationOptions = {},
  ): number | null {
    if (!navigator.geolocation) {
      logger.error('Geolocation not supported');
      return null;
    }

    const defaultOptions: GeolocationOptions = {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 60000,
      ...options,
    };

    return navigator.geolocation.watchPosition(callback, errorCallback, defaultOptions);
  }

  /**
   * Stop watching location
   */
  stopWatchingLocation(watchId: number): void {
    navigator.geolocation.clearWatch(watchId);
  }

  /**
   * Access contacts (experimental - limited browser support)
   */
  async accessContacts(): Promise<ContactInfo[]> {
    try {
      // Check if Contacts API is available
      if (!('contacts' in navigator) || !('ContactsManager' in window)) {
        throw new Error('Contacts API not supported');
      }

      // Request contacts access
      const contacts = await (navigator as any).contacts.select(['name', 'email', 'tel']);

      return contacts.map((contact: any) => ({
        name: contact.name?.[0] ?? '',
        phone: contact.tel?.[0] ?? '',
        email: contact.email?.[0] ?? '',
      }));
    } catch (error) {
      logger.error('Contacts access failed:', error);
      throw new Error(
        `Contacts access failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Trigger device vibration (public interface)
   */
  vibrate(pattern: number | number[]): boolean {
    const patternArray = Array.isArray(pattern) ? pattern : [pattern];
    return this.vibrateInternal(patternArray);
  }

  /**
   * Copy text to clipboard
   */
  async copyToClipboard(text: string): Promise<boolean> {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(text);
        return true;
      }
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();

      const result = document.execCommand('copy');
      document.body.removeChild(textArea);
      return result;
    } catch (error) {
      logger.error('Clipboard access failed:', error);
      return false;
    }
  }

  /**
   * Read from clipboard
   */
  async readFromClipboard(): Promise<string> {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        return await navigator.clipboard.readText();
      }
      throw new Error('Clipboard read not supported');
    } catch (error) {
      logger.error('Clipboard read failed:', error);
      throw new Error(
        `Clipboard read failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Share content using Web Share API
   */
  async shareContent(data: {
    title?: string;
    text?: string;
    url?: string;
    files?: File[];
  }): Promise<boolean> {
    try {
      if (!navigator.share) {
        throw new Error('Web Share API not supported');
      }

      await navigator.share(data);
      return true;
    } catch (error) {
      logger.error('Share failed:', error);
      return false;
    }
  }

  /**
   * Open file picker
   */
  async openFilePicker(
    options: {
      multiple?: boolean;
      accept?: string[];
      excludeAcceptAllOption?: boolean;
    } = {},
  ): Promise<FileSystemFileHandle[]> {
    try {
      if (!('showOpenFilePicker' in window)) {
        throw new Error('File System Access API not supported');
      }

      const fileHandles = await (window as any).showOpenFilePicker({
        multiple: options.multiple ?? false,
        types: options.accept
          ? [
              {
                description: 'Allowed files',
                accept: options.accept.reduce<Record<string, string[]>>((acc, type) => {
                  acc[type] = [];
                  return acc;
                }, {}),
              },
            ]
          : undefined,
        excludeAcceptAllOption: options.excludeAcceptAllOption ?? false,
      });

      return fileHandles;
    } catch (error) {
      logger.error('File picker failed:', error);
      throw new Error(
        `File picker failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Save file to device
   */
  async saveFile(content: string, filename: string, mimeType = 'text/plain'): Promise<boolean> {
    try {
      if ('showSaveFilePicker' in window) {
        // Use File System Access API if available
        const fileHandle = await (window as any).showSaveFilePicker({
          suggestedName: filename,
          types: [
            {
              description: 'File',
              accept: {
                [mimeType]: [`.${filename.split('.').pop()}`],
              },
            },
          ],
        });

        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();

        return true;
      }
      // Fallback to download
      const blob = new Blob([content], { type: mimeType });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return true;
    } catch (error) {
      logger.error('File save failed:', error);
      return false;
    }
  }

  /**
   * Request device orientation permission (iOS)
   */
  async requestOrientationPermission(): Promise<boolean> {
    try {
      if (
        'DeviceOrientationEvent' in window &&
        typeof (DeviceOrientationEvent as any).requestPermission === 'function'
      ) {
        const permission = await (DeviceOrientationEvent as any).requestPermission();
        return permission === 'granted';
      }
      return true; // Permission not required on this device
    } catch (error) {
      logger.error('Orientation permission request failed:', error);
      return false;
    }
  }

  /**
   * Get device orientation
   */
  getDeviceOrientation(): Promise<DeviceOrientationEvent> {
    return new Promise((resolve, reject) => {
      if (!('DeviceOrientationEvent' in window)) {
        reject(new Error('Device orientation not supported'));
        return;
      }

      const handleOrientation = (event: DeviceOrientationEvent) => {
        window.removeEventListener('deviceorientation', handleOrientation);
        resolve(event);
      };

      window.addEventListener('deviceorientation', handleOrientation);

      // Timeout after 5 seconds
      setTimeout(() => {
        window.removeEventListener('deviceorientation', handleOrientation);
        reject(new Error('Device orientation timeout'));
      }, 5000);
    });
  }

  /**
   * Check if running in standalone mode (installed PWA)
   */
  isStandalone(): boolean {
    return (
      (window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone) ??
      document.referrer.includes('android-app://')
    );
  }

  /**
   * Get device info
   */
  getDeviceInfo(): {
    userAgent: string;
    platform: string;
    language: string;
    cookieEnabled: boolean;
    onLine: boolean;
    screenResolution: string;
    windowSize: string;
    deviceMemory?: number;
    connection?: any;
    standalone: boolean;
  } {
    return {
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      cookieEnabled: navigator.cookieEnabled,
      onLine: navigator.onLine,
      screenResolution: `${screen.width}x${screen.height}`,
      windowSize: `${window.innerWidth}x${window.innerHeight}`,
      deviceMemory: (navigator as any).deviceMemory,
      connection: (navigator as any).connection,
      standalone: this.isStandalone(),
    };
  }

  /**
   * Request fullscreen
   */
  async requestFullscreen(element?: Element): Promise<boolean> {
    try {
      const target = element ?? document.documentElement;

      if (target.requestFullscreen) {
        await target.requestFullscreen();
      } else if ((target as any).webkitRequestFullscreen) {
        await (target as any).webkitRequestFullscreen();
      } else if ((target as any).msRequestFullscreen) {
        await (target as any).msRequestFullscreen();
      } else {
        throw new Error('Fullscreen not supported');
      }

      return true;
    } catch (error) {
      logger.error('Fullscreen request failed:', error);
      return false;
    }
  }

  /**
   * Exit fullscreen
   */
  async exitFullscreen(): Promise<boolean> {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      } else {
        throw new Error('Exit fullscreen not supported');
      }

      return true;
    } catch (error) {
      logger.error('Exit fullscreen failed:', error);
      return false;
    }
  }

  /**
   * Check if in fullscreen mode
   */
  isFullscreen(): boolean {
    return Boolean(
      document.fullscreenElement ||
        (document as any).webkitFullscreenElement ||
        (document as any).msFullscreenElement,
    );
  }

  /**
   * Wake lock (keep screen on)
   */
  async requestWakeLock(): Promise<WakeLockSentinel | null> {
    try {
      if ('wakeLock' in navigator) {
        const wakeLock = await navigator.wakeLock.request('screen');
        return wakeLock;
      }
      logger.warn('Wake Lock API not supported');
      return null;
    } catch (error) {
      logger.error('Wake lock request failed:', error);
      return null;
    }
  }

  /**
   * Battery status (experimental)
   */
  async getBatteryStatus(): Promise<any> {
    try {
      if ('getBattery' in navigator) {
        const battery = await (navigator as any).getBattery();
        return {
          charging: battery.charging,
          chargingTime: battery.chargingTime,
          dischargingTime: battery.dischargingTime,
          level: Math.round(battery.level * 100),
        };
      }
      throw new Error('Battery Status API not supported');
    } catch (error) {
      logger.error('Battery status failed:', error);
      return null;
    }
  }

  /**
   * Network information
   */
  getNetworkInfo(): any {
    try {
      const connection =
        (navigator as any).connection ||
        (navigator as any).mozConnection ||
        (navigator as any).webkitConnection;

      if (connection) {
        return {
          effectiveType: connection.effectiveType,
          downlink: connection.downlink,
          rtt: connection.rtt,
          saveData: connection.saveData,
        };
      }
      return null;
    } catch (error) {
      logger.error('Network info failed:', error);
      return null;
    }
  }

  /**
   * Haptic feedback patterns
   */
  hapticFeedback = {
    light: () => this.vibrate([10]),
    medium: () => this.vibrate([50]),
    heavy: () => this.vibrate([100]),
    success: () => this.vibrate([50, 30, 50]),
    error: () => this.vibrate([100, 50, 100, 50, 100]),
    warning: () => this.vibrate([80, 40, 80]),
    notification: () => this.vibrate([200, 100, 200]),
  };

  /**
   * Internal vibration implementation
   */
  private vibrateInternal(pattern: number[]): boolean {
    try {
      if (navigator.vibrate) {
        navigator.vibrate(pattern);
        return true;
      }
      return false;
    } catch (error) {
      logger.error('Vibration failed:', error);
      return false;
    }
  }
}

// Export singleton instance
export const nativeFeaturesService = new NativeFeaturesService();
export default nativeFeaturesService;
