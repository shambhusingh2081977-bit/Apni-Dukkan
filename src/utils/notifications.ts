/**
 * Browser Notification & In-App Alert Utilities for Low-Stock Alerts
 */

export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) return 'denied';
  return Notification.permission;
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) return 'denied';
  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch {
    return 'denied';
  }
}

export function triggerLowStockBrowserAlert(
  productName: string,
  quantity: number,
  unit: string,
  threshold: number,
  shopName: string = 'Built To Stock'
): boolean {
  if (!isNotificationSupported()) return false;

  if (Notification.permission === 'granted') {
    try {
      const title = `⚠️ Low Stock Alert: ${productName}`;
      const options: NotificationOptions = {
        body: `Only ${quantity} ${unit} left in stock (Threshold: ${threshold} ${unit}). Please reorder soon!`,
        icon: '/favicon.ico',
        tag: `low-stock-${productName}`,
        badge: '/favicon.ico',
      };

      const notification = new Notification(title, options);
      notification.onclick = () => {
        window.focus();
        notification.close();
      };
      return true;
    } catch {
      return false;
    }
  }
  return false;
}

export function triggerTestNotification(shopName: string = 'Built To Stock'): boolean {
  if (!isNotificationSupported()) return false;
  if (Notification.permission === 'granted') {
    try {
      const n = new Notification(`🔔 ${shopName} - Alerts Active`, {
        body: 'Low-stock browser and desktop notifications are working properly!',
      });
      n.onclick = () => {
        window.focus();
        n.close();
      };
      return true;
    } catch {
      return false;
    }
  }
  return false;
}
