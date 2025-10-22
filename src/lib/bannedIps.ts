import { api } from './api';

export interface BannedIP {
  ip: string;
  bannedAt: number;
  reason?: string;
}

let cachedBans: BannedIP[] = [];

export const getBannedIPs = async (): Promise<BannedIP[]> => {
  const bans = await api.get<BannedIP[]>('/banned-ips', { auth: true });
  cachedBans = bans;
  return bans;
};

export const isIPBanned = (ip: string, bans?: BannedIP[]): boolean => {
  const list = bans ?? cachedBans;
  return list.some((entry) => entry.ip === ip);
};

export const banIP = async (ip: string, reason?: string): Promise<BannedIP> => {
  const entry = await api.post<BannedIP>('/banned-ips', { ip, reason }, { auth: true });
  cachedBans = [...cachedBans, entry];
  return entry;
};

export const unbanIP = async (ip: string): Promise<void> => {
  await api.delete(`/banned-ips/${encodeURIComponent(ip)}`, { auth: true });
  cachedBans = cachedBans.filter((entry) => entry.ip !== ip);
};
