/**
 * Device detection — single file, single purpose.
 * Used server-side in Next.js layouts/pages via headers().get('user-agent').
 * Never import this in client components; use useMediaQuery hook instead.
 */

const MOBILE_PATTERN =
  /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile|mobile/i;

const TABLET_PATTERN =
  /iPad|Android(?!.*Mobile)|Tablet|tablet/i;

/** Returns true when the UA string belongs to a phone or small tablet. */
export function isMobileDevice(userAgent: string): boolean {
  return MOBILE_PATTERN.test(userAgent);
}

/** Returns true for iPad-class tablets. */
export function isTabletDevice(userAgent: string): boolean {
  return TABLET_PATTERN.test(userAgent);
}

/**
 * Returns 'mobile' | 'tablet' | 'desktop'.
 * Desktop is the fallback (favours desktop on unknown UAs).
 */
export type DeviceType = "mobile" | "tablet" | "desktop";

export function getDeviceType(userAgent: string): DeviceType {
  if (isMobileDevice(userAgent) && !isTabletDevice(userAgent)) return "mobile";
  if (isTabletDevice(userAgent)) return "tablet";
  return "desktop";
}
