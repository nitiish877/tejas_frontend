export const BASE_CLIENT_VERSION = '1.0.1';

export interface AppVersionInfo {
  version: string;
  releaseDate?: string;
  changelog?: string;
  apkDownloadUrl?: string;
}

export function getClientVersion(): string {
  try {
    return localStorage.getItem('tejas_applied_version') || BASE_CLIENT_VERSION;
  } catch {
    return BASE_CLIENT_VERSION;
  }
}

export function setAppliedVersion(version: string): void {
  try {
    localStorage.setItem('tejas_applied_version', version);
    localStorage.removeItem('tejas_dismissed_version');
  } catch {
    // ignore
  }
}

export function dismissVersion(version: string): void {
  try {
    localStorage.setItem('tejas_dismissed_version', version);
  } catch {
    // ignore
  }
}

export function isVersionDismissed(version: string): boolean {
  try {
    return localStorage.getItem('tejas_dismissed_version') === version;
  } catch {
    return false;
  }
}
