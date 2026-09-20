export type ScreenStatus = 'active' | 'inactive';
export type ConnectionStatus = 'online' | 'offline';

export interface Department {
  id: string;
  name: string;
  code: string;
  floor: string;
  description: string;
  defaultQueueUrl: string;
  defaultPlaylistId?: string;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface Screen {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  location: string;
  queueUrl: string;
  status: ScreenStatus;
  connectionStatus: ConnectionStatus;
  lastHeartbeat: string | null;
  currentContent: string;
  currentCampaignId: string | null;
  playlistId: string | null;
  deviceToken: string | null;
  playerVersion: string;
  isPaused?: boolean;
  powerState?: 'on' | 'off';
  latestSnapshot?: string;
  latestSnapshotTime?: string;
  deviceMetadata?: {
    platform?: string;
    model?: string;
    screenResolution?: string;
    ipAddress?: string;
  };
  createdAt: string;
}

export interface PairingSession {
  pairingCode: string;
  socketId?: string;
  expiresAt: number;
  status: 'pending' | 'paired' | 'expired';
  screenId?: string;
  deviceToken?: string;
  deviceMetadata?: Record<string, any>;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'announcement';
  url: string;
  duration: number; // in seconds
  size: number;
  dimensions?: string;
  tags: string[];
  category: string;
  createdAt: string;
}

export interface PlaylistItem {
  id: string;
  type: 'queue' | 'image' | 'video' | 'announcement';
  mediaId?: string;
  mediaUrl?: string;
  title: string;
  duration: number; // in seconds
  order: number;
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  items: PlaylistItem[];
  isDefault: boolean;
  createdAt: string;
}

export interface Campaign {
  id: string;
  name: string;
  description: string;
  type: 'global' | 'department' | 'screen' | 'emergency';
  contentType?: 'playlist' | 'single_image' | 'single_image_only' | 'only_queue';
  targetIds: string[]; // ["all"] or department IDs or screen IDs
  mediaId?: string;
  mediaUrl?: string;
  playlistId?: string;
  priority: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek: number[]; // 0 = Sunday, 6 = Saturday
  status: 'active' | 'scheduled' | 'paused' | 'expired';
  createdAt: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity: string;
  entityId: string;
  details: string;
  timestamp: string;
  userId?: string;
}

export interface EmergencyAnnouncement {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  displayMode: 'takeover' | 'banner' | 'both';
  highlightScreen: boolean;
  screenHighlight?: boolean;
  active: boolean;
  isActive?: boolean;
  status?: string;
  durationSeconds?: number;
  expiresAt?: number;
  createdAt: string;
}

export interface ResolvedDisplayConfig {
  screenId: string;
  screenName: string;
  departmentId: string;
  departmentName: string;
  queueUrl: string;
  activeCampaign: {
    id: string;
    name: string;
    type: string;
    priority: number;
    contentType?: string;
  } | null;
  playlist: PlaylistItem[];
  settings: {
    transition: 'fade' | 'slide' | 'none';
    heartbeatSeconds: number;
    offlineMediaCached: boolean;
    announcementTicker?: string;
    isPaused?: boolean;
    powerState?: 'on' | 'off';
    emergencyAnnouncement?: EmergencyAnnouncement | null;
  };
  resolvedAt: string;
}
