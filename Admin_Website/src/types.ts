export interface Department {
  id: string;
  name: string;
  code: string;
  floor: string;
  description: string;
  defaultQueueUrl: string;
  defaultPlaylistId?: string;
  status: 'active' | 'inactive';
  screenCount?: number;
  createdAt: string;
}

export interface Screen {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  location: string;
  queueUrl: string;
  status: 'active' | 'inactive';
  connectionStatus: 'online' | 'offline';
  lastHeartbeat: string | null;
  currentContent: string;
  currentCampaignId: string | null;
  playlistId: string | null;
  deviceToken: string | null;
  playerVersion: string;
  deviceMetadata?: {
    platform?: string;
    model?: string;
    screenResolution?: string;
    ipAddress?: string;
  };
  createdAt: string;
}

export interface MediaItem {
  id: string;
  title: string;
  type: 'image' | 'video' | 'announcement';
  url: string;
  duration: number;
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
  duration: number;
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
  contentType?: 'playlist' | 'single_image' | 'only_queue';
  targetIds: string[];
  mediaId?: string;
  mediaUrl?: string;
  playlistId?: string;
  priority: number;
  startDate?: string;
  endDate?: string;
  startTime?: string;
  endTime?: string;
  daysOfWeek: number[];
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
