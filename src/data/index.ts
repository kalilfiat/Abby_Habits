/** Data layer — public surface. Persistence + local record helpers. */
export * from './storage';
export * from './id';
export {
  ensureNotificationPermission,
  getPermissionStatus,
  requestPermission,
  syncLocalNotifications,
  type PermissionStatus,
} from './notifications';
