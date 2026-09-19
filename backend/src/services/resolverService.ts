import { db } from '../db/database';
import { ResolvedDisplayConfig, Screen, Campaign, PlaylistItem } from '../types';

export class ResolverService {
  /**
   * Resolves the active display configuration for a given screen.
   * Priority order:
   * 1. Emergency Override (Campaign with type 'emergency', priority 100)
   * 2. Global High Priority Campaign (type 'global', targets 'all', priority >= 70)
   * 3. Screen-specific Campaign (type 'screen', targetIds includes screenId)
   * 4. Department Campaign (type 'department', targetIds includes screen.departmentId)
   * 5. Assigned Screen Playlist or Department Default Playlist
   * 6. Fallback to Queue-only
   */
  public resolveScreenConfig(screenId: string): ResolvedDisplayConfig {
    const screen = db.getScreenById(screenId);
    if (!screen) {
      throw new Error(`Screen with ID ${screenId} not found`);
    }

    const department = db.getDepartmentById(screen.departmentId);
    const departmentName = department?.name || 'Hospital Department';
    const queueUrl = screen.queueUrl || department?.defaultQueueUrl || 'https://hms.jjmhospitalkashipur.com/qd/DOC038';

    const now = new Date();
    const currentDate = now.toISOString().split('T')[0];
    const currentDay = now.getDay(); // 0 = Sun, 6 = Sat
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    const allCampaigns = db.getCampaigns().filter(c => c.status === 'active');

    // Filter campaigns that match current schedule window
    const eligibleCampaigns = allCampaigns.filter(c => {
      if (c.startDate && c.startDate > currentDate) return false;
      if (c.endDate && c.endDate < currentDate) return false;
      if (c.daysOfWeek && !c.daysOfWeek.includes(currentDay)) return false;
      if (c.startTime && c.startTime > currentTime) return false;
      if (c.endTime && c.endTime < currentTime) return false;
      return true;
    });

    // Check 1: Emergency Override
    const emergencyCampaign = eligibleCampaigns.find(c => c.type === 'emergency');
    if (emergencyCampaign) {
      return this.buildConfigFromCampaign(screen, departmentName, queueUrl, emergencyCampaign, 'fade');
    }

    // Check 2: Screen-specific campaign (Highest specificity)
    const screenCampaign = eligibleCampaigns
      .filter(c => c.type === 'screen' && c.targetIds.includes(screenId))
      .sort((a, b) => b.priority - a.priority)[0];

    // Check 3: Department campaign
    const deptCampaign = eligibleCampaigns
      .filter(c => c.type === 'department' && c.targetIds.includes(screen.departmentId))
      .sort((a, b) => b.priority - a.priority)[0];

    // Check 4: Global campaign
    const globalCampaign = eligibleCampaigns
      .filter(c => c.type === 'global' && (c.targetIds.includes('all') || c.targetIds.includes(screenId)))
      .sort((a, b) => b.priority - a.priority)[0];

    // Select candidate with highest priority
    const candidates = [
      screenCampaign ? { ...screenCampaign, effectivePriority: screenCampaign.priority + 10 } : null,
      globalCampaign ? { ...globalCampaign, effectivePriority: globalCampaign.priority } : null,
      deptCampaign ? { ...deptCampaign, effectivePriority: deptCampaign.priority } : null,
    ].filter((c): c is Campaign & { effectivePriority: number } => c !== null);

    candidates.sort((a, b) => b.effectivePriority - a.effectivePriority);

    const winningCampaign = candidates[0];

    if (winningCampaign) {
      return this.buildConfigFromCampaign(screen, departmentName, queueUrl, winningCampaign, 'fade');
    }

    // Default Playlist resolution
    let playlist = db.getPlaylistById(screen.playlistId || '');
    if (!playlist && department?.defaultPlaylistId) {
      playlist = db.getPlaylistById(department.defaultPlaylistId);
    }
    if (!playlist) {
      playlist = db.getPlaylists().find(p => p.isDefault) || db.getPlaylists()[0];
    }

    const playlistItems: PlaylistItem[] = playlist?.items.length
      ? playlist.items
      : [
          { id: 'item-1', type: 'queue', title: 'Doctor Live Token Queue', duration: 30, order: 1 },
        ];

    const emergency = db.getEmergencyAnnouncement();

    return {
      screenId: screen.id,
      screenName: screen.name,
      departmentId: screen.departmentId,
      departmentName,
      queueUrl,
      activeCampaign: null,
      playlist: playlistItems,
      settings: {
        transition: 'fade',
        heartbeatSeconds: 20,
        offlineMediaCached: true,
        isPaused: !!screen.isPaused,
        emergencyAnnouncement:
          emergency && (emergency.active || (emergency as any).isActive)
            ? {
                ...emergency,
                active: true,
                isActive: true,
                status: 'active',
                highlightScreen: (emergency as any).highlightScreen !== false,
                screenHighlight: (emergency as any).highlightScreen !== false,
              }
            : null,
      },
      resolvedAt: new Date().toISOString(),
    };
  }

  private buildConfigFromCampaign(
    screen: Screen,
    departmentName: string,
    queueUrl: string,
    campaign: Campaign,
    transition: 'fade' | 'slide' | 'none'
  ): ResolvedDisplayConfig {
    let items: PlaylistItem[] = [];

    if (campaign.contentType === 'only_queue') {
      items = [{ id: 'camp-q-only', type: 'queue', title: 'Doctor Live Token Queue', duration: 30, order: 1 }];
    } else if (campaign.contentType === 'single_image_only') {
      const media = campaign.mediaId ? db.getMediaById(campaign.mediaId) : undefined;
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
      const media = campaign.mediaId ? db.getMediaById(campaign.mediaId) : undefined;
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
      const pl = db.getPlaylistById(campaign.playlistId);
      if (pl && pl.items.length) {
        items = pl.items;
      }
    }

    if (!items.length) {
      items = [{ id: 'camp-q-only', type: 'queue', title: 'Doctor Live Token Queue', duration: 30, order: 1 }];
    }

    const emergency = db.getEmergencyAnnouncement();

    return {
      screenId: screen.id,
      screenName: screen.name,
      departmentId: screen.departmentId,
      departmentName,
      queueUrl,
      activeCampaign: {
        id: campaign.id,
        name: campaign.name,
        type: campaign.type,
        priority: campaign.priority,
        contentType: campaign.contentType,
      },
      playlist: items,
      settings: {
        transition,
        heartbeatSeconds: 20,
        offlineMediaCached: true,
        isPaused: !!screen.isPaused,
        emergencyAnnouncement:
          emergency && (emergency.active || (emergency as any).isActive)
            ? {
                ...emergency,
                active: true,
                isActive: true,
                status: 'active',
                highlightScreen: (emergency as any).highlightScreen !== false,
                screenHighlight: (emergency as any).highlightScreen !== false,
              }
            : null,
        announcementTicker: campaign.type === 'emergency' ? campaign.name : undefined,
      },
      resolvedAt: new Date().toISOString(),
    };
  }
}

export const resolverService = new ResolverService();
