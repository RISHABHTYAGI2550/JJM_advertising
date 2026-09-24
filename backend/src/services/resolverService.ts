import { screenRepo } from '../db/repositories/screenRepository';
import { departmentRepo } from '../db/repositories/departmentRepository';
import { campaignRepo } from '../db/repositories/campaignRepository';
import { mediaRepo } from '../db/repositories/mediaRepository';
import { playlistRepo } from '../db/repositories/miscRepositories';
import { emergencyRepo } from '../db/repositories/emergencyRepository';
import { ResolvedDisplayConfig, Screen, Campaign, PlaylistItem } from '../types';

export class ResolverService {
  /**
   * Resolves the authoritative display configuration for a given screen from SQLite.
   * Deterministic priority order:
   * 1. Target-aware Emergency Announcement
   * 2. Active Scheduled Campaign (Screen > Department > Global)
   * 3. Assigned Screen Playlist or Department Default Playlist
   * 4. Fallback to Doctor OPD Queue
   */
  public resolveScreenConfig(screenId: string): ResolvedDisplayConfig {
    const screen = screenRepo.getById(screenId);
    if (!screen) {
      throw new Error(`Screen with ID ${screenId} not found`);
    }

    const department = departmentRepo.getById(screen.departmentId);
    const departmentName = department?.name || 'Hospital Department';
    const queueUrl = screen.queueUrl || department?.defaultQueueUrl || 'https://hms.jjmhospitalkashipur.com/qd';
    const staleThresholdSeconds = screen.staleThresholdSeconds || 180;
    const configVersion = screen.targetConfigVersion || 1;
    const mediaManifestVersion = mediaRepo.getManifestVersion();

    // Check target-aware active emergency
    const activeEmergency = emergencyRepo.getActive(screen.id, screen.departmentId);

    // If playback is paused, return queue-only
    if (screen.isPaused) {
      return {
        screenId: screen.id,
        screenName: screen.name,
        departmentId: screen.departmentId,
        departmentName,
        queueUrl,
        staleThresholdSeconds,
        configVersion,
        mediaManifestVersion,
        activeCampaign: null,
        playlist: [
          { id: 'item-pause-queue', type: 'queue', title: 'Doctor Live Token Queue', duration: 9999, order: 1 },
        ],
        settings: {
          transition: 'fade',
          heartbeatSeconds: 20,
          offlineMediaCached: true,
          isPaused: true,
          powerState: screen.powerState || 'on',
          emergencyAnnouncement: activeEmergency,
        },
      };
    }

    // Resolve eligible targeted campaigns
    const eligibleCampaigns = campaignRepo.getActiveForScreen(screen.id, screen.departmentId);

    if (eligibleCampaigns.length > 0) {
      const winningCampaign = eligibleCampaigns[0];
      return this.buildConfigFromCampaign(
        screen,
        departmentName,
        queueUrl,
        staleThresholdSeconds,
        configVersion,
        mediaManifestVersion,
        winningCampaign,
        activeEmergency
      );
    }

    // Default Playlist resolution
    let playlist = playlistRepo.getById(screen.playlistId || '');
    if (!playlist && department?.defaultPlaylistId) {
      playlist = playlistRepo.getById(department.defaultPlaylistId);
    }
    if (!playlist) {
      playlist = playlistRepo.getAll().find(p => p.isDefault) || playlistRepo.getAll()[0];
    }

    const playlistItems: PlaylistItem[] = playlist?.items.length
      ? playlist.items
      : [{ id: 'item-1', type: 'queue', title: 'Doctor Live Token Queue', duration: 30, order: 1 }];

    return {
      screenId: screen.id,
      screenName: screen.name,
      departmentId: screen.departmentId,
      departmentName,
      queueUrl,
      staleThresholdSeconds,
      configVersion,
      mediaManifestVersion,
      activeCampaign: null,
      playlist: playlistItems,
      settings: {
        transition: 'fade',
        heartbeatSeconds: 20,
        offlineMediaCached: true,
        isPaused: !!screen.isPaused,
        powerState: screen.powerState || 'on',
        emergencyAnnouncement: activeEmergency,
      },
    };
  }

  private buildConfigFromCampaign(
    screen: Screen,
    departmentName: string,
    queueUrl: string,
    staleThresholdSeconds: number,
    configVersion: number,
    mediaManifestVersion: number,
    campaign: Campaign,
    emergency: any
  ): ResolvedDisplayConfig {
    let items: PlaylistItem[] = [];

    if (campaign.contentType === 'only_queue') {
      items = [{ id: 'camp-q-only', type: 'queue', title: 'Doctor Live Token Queue', duration: 30, order: 1 }];
    } else if (campaign.contentType === 'single_image_only') {
      const media = campaign.mediaId ? mediaRepo.getById(campaign.mediaId) : undefined;
      const mediaUrl = campaign.mediaUrl || media?.url || '';
      items = [
        {
          id: 'camp-img-only',
          type: 'image',
          mediaId: campaign.mediaId,
          mediaUrl,
          title: campaign.name,
          duration: media?.duration || 20,
          order: 1,
        },
      ];
    } else if (campaign.contentType === 'single_image' || (!campaign.contentType && campaign.mediaId && !campaign.playlistId)) {
      const media = campaign.mediaId ? mediaRepo.getById(campaign.mediaId) : undefined;
      const mediaUrl = campaign.mediaUrl || media?.url || '';
      items = [
        {
          id: 'camp-q-1',
          type: 'queue',
          title: 'Doctor Live Token Queue',
          duration: 30,
          order: 1,
        },
        {
          id: 'camp-img-1',
          type: 'image',
          mediaId: campaign.mediaId,
          mediaUrl,
          title: campaign.name,
          duration: media?.duration || 15,
          order: 2,
        },
      ];
    } else if (campaign.playlistId) {
      const pl = playlistRepo.getById(campaign.playlistId);
      if (pl && pl.items.length) {
        items = pl.items;
      }
    }

    if (!items.length) {
      items = [{ id: 'camp-q-only', type: 'queue', title: 'Doctor Live Token Queue', duration: 30, order: 1 }];
    }

    return {
      screenId: screen.id,
      screenName: screen.name,
      departmentId: screen.departmentId,
      departmentName,
      queueUrl,
      staleThresholdSeconds,
      configVersion,
      mediaManifestVersion,
      activeCampaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        priority: campaign.priority,
        contentType: campaign.contentType,
      },
      playlist: items,
      settings: {
        transition: 'fade',
        heartbeatSeconds: 20,
        offlineMediaCached: true,
        isPaused: !!screen.isPaused,
        powerState: screen.powerState || 'on',
        emergencyAnnouncement: emergency,
        announcementTicker: campaign.type === 'emergency' ? campaign.name : undefined,
      },
    };
  }
}

export const resolverService = new ResolverService();
