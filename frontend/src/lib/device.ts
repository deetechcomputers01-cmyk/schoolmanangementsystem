/**
 * Device detection — single file, single purpose.
 * Used server-side in Next.js layouts/pages via headers().get('user-agent').
 * Never import this in client components; use useMediaQuery hook instead.
 */

/** Matches phone UAs. Android without "Mobile" = tablet or "Request Desktop Site" → not mobile. */
const MOBILE_UA   = /webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i;
const ANDROID_MOB = /Android.*Mobile/i;

/** Matches tablet UAs including Android without "Mobile" (tablet mode). */
const TABLET_UA   = /iPad|Android(?!.*Mobile)/i;

export function isMobileDevice(ua: string): boolean {
  return MOBILE_UA.test(ua) || ANDROID_MOB.test(ua);
}

export function isTabletDevice(ua: string): boolean {
  return TABLET_UA.test(ua);
}

export type DeviceType = "mobile" | "tablet" | "desktop";

/**
 * Returns 'mobile' | 'tablet' | 'desktop'.
 * Desktop is the safe fallback — favours desktop on unknown UAs and on
 * Android Chrome "Request Desktop Site" (Android UA without "Mobile").
 */
export function getDeviceType(ua: string): DeviceType {
  if (isMobileDevice(ua)) return "mobile";
  if (isTabletDevice(ua)) return "tablet";
  return "desktop";
}
