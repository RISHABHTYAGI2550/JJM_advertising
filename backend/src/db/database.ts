import fs from 'fs';
import path from 'path';
import { Department, Screen, PairingSession, MediaItem, Playlist, Campaign, AuditLog } from '../types';

interface DatabaseSchema {
  departments: Department[];
  screens: Screen[];
  pairingSessions: PairingSession[];
  media: MediaItem[];
  playlists: Playlist[];
  campaigns: Campaign[];
  auditLogs: AuditLog[];
}

const DATA_DIR = path.join(__dirname, '../../data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

const INITIAL_DEPARTMENTS: Department[] = [];
const INITIAL_MEDIA: MediaItem[] = [];
const INITIAL_PLAYLISTS: Playlist[] = [];
const INITIAL_SCREENS: Screen[] = [];
const INITIAL_CAMPAIGNS: Campaign[] = [];

class Database {
  private data: DatabaseSchema;

  constructor() {
    this.ensureDirectory();
    this.data = this.loadData();
  }

  private ensureDirectory() {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
  }

  private loadData(): DatabaseSchema {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        return JSON.parse(raw);
      } catch (err) {
        console.error('Failed to parse database file, resetting to initial seed:', err);
      }
    }

    const initial: DatabaseSchema = {
      departments: INITIAL_DEPARTMENTS,
      screens: INITIAL_SCREENS,
      pairingSessions: [],
      media: INITIAL_MEDIA,
      playlists: INITIAL_PLAYLISTS,
      campaigns: INITIAL_CAMPAIGNS,
      auditLogs: [
        {
          id: 'AUD-001',
          action: 'SYSTEM_INIT',
          entity: 'System',
          entityId: 'SYS',
          details: 'Initialized Hospital Queue + Digital Signage System with JJM Hospital presets',
          timestamp: new Date().toISOString(),
        },
      ],
    };

    this.saveData(initial);
    return initial;
  }

  public saveData(data?: DatabaseSchema) {
    if (data) {
      this.data = data;
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
  }

  // Departments
  public getDepartments(): Department[] {
    return this.data.departments;
  }

  public getDepartmentById(id: string): Department | undefined {
    return this.data.departments.find(d => d.id === id);
  }

  public createDepartment(dept: Omit<Department, 'id' | 'createdAt'>): Department {
    const newDept: Department = {
      ...dept,
      id: `DEP-${dept.code.toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.departments.push(newDept);
    this.saveData();
    this.logAudit('CREATE_DEPARTMENT', 'Department', newDept.id, `Created department: ${newDept.name}`);
    return newDept;
  }

  public updateDepartment(id: string, updates: Partial<Department>): Department | null {
    const index = this.data.departments.findIndex(d => d.id === id);
    if (index === -1) return null;
    this.data.departments[index] = { ...this.data.departments[index], ...updates };
    this.saveData();
    this.logAudit('UPDATE_DEPARTMENT', 'Department', id, `Updated department: ${id}`);
    return this.data.departments[index];
  }

  public deleteDepartment(id: string): boolean {
    const prevLen = this.data.departments.length;
    this.data.departments = this.data.departments.filter(d => d.id !== id);
    if (this.data.departments.length !== prevLen) {
      this.saveData();
      this.logAudit('DELETE_DEPARTMENT', 'Department', id, `Deleted department: ${id}`);
      return true;
    }
    return false;
  }

  // Screens
  public getScreens(): Screen[] {
    return this.data.screens;
  }

  public getScreenById(id: string): Screen | undefined {
    return this.data.screens.find(s => s.id === id);
  }

  public getScreenByToken(token: string): Screen | undefined {
    return this.data.screens.find(s => s.deviceToken === token);
  }

  public createScreen(screen: Omit<Screen, 'createdAt'>): Screen {
    const newScreen: Screen = {
      ...screen,
      createdAt: new Date().toISOString(),
    };
    this.data.screens.push(newScreen);
    this.saveData();
    this.logAudit('CREATE_SCREEN', 'Screen', newScreen.id, `Created screen: ${newScreen.name} (${newScreen.queueUrl})`);
    return newScreen;
  }

  public updateScreen(id: string, updates: Partial<Screen>): Screen | null {
    const index = this.data.screens.findIndex(s => s.id === id);
    if (index === -1) return null;
    this.data.screens[index] = { ...this.data.screens[index], ...updates };
    this.saveData();
    return this.data.screens[index];
  }

  public deleteScreen(id: string): boolean {
    const prevLen = this.data.screens.length;
    this.data.screens = this.data.screens.filter(s => s.id !== id);
    if (this.data.screens.length !== prevLen) {
      this.saveData();
      this.logAudit('DELETE_SCREEN', 'Screen', id, `Deleted screen: ${id}`);
      return true;
    }
    return false;
  }

  // Pairing Sessions
  public getPairingSessions(): PairingSession[] {
    return this.data.pairingSessions;
  }

  public getPairingSession(code: string): PairingSession | undefined {
    return this.data.pairingSessions.find(p => p.pairingCode === code);
  }

  public savePairingSession(session: PairingSession) {
    this.data.pairingSessions = this.data.pairingSessions.filter(p => p.pairingCode !== session.pairingCode);
    this.data.pairingSessions.push(session);
    this.saveData();
  }

  // Media
  public getMedia(): MediaItem[] {
    return this.data.media;
  }

  public getMediaById(id: string): MediaItem | undefined {
    return this.data.media.find(m => m.id === id);
  }

  public createMedia(item: Omit<MediaItem, 'id' | 'createdAt'>): MediaItem {
    const newItem: MediaItem = {
      ...item,
      id: `MED-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.media.push(newItem);
    this.saveData();
    this.logAudit('UPLOAD_MEDIA', 'Media', newItem.id, `Uploaded media: ${newItem.title}`);
    return newItem;
  }

  public deleteMedia(id: string): boolean {
    const prevLen = this.data.media.length;
    this.data.media = this.data.media.filter(m => m.id !== id);
    if (this.data.media.length !== prevLen) {
      this.saveData();
      this.logAudit('DELETE_MEDIA', 'Media', id, `Deleted media: ${id}`);
      return true;
    }
    return false;
  }

  // Playlists
  public getPlaylists(): Playlist[] {
    return this.data.playlists;
  }

  public getPlaylistById(id: string): Playlist | undefined {
    return this.data.playlists.find(p => p.id === id);
  }

  public createPlaylist(playlist: Omit<Playlist, 'id' | 'createdAt'>): Playlist {
    const newPlaylist: Playlist = {
      ...playlist,
      id: `PL-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.playlists.push(newPlaylist);
    this.saveData();
    this.logAudit('CREATE_PLAYLIST', 'Playlist', newPlaylist.id, `Created playlist: ${newPlaylist.name}`);
    return newPlaylist;
  }

  public updatePlaylist(id: string, updates: Partial<Playlist>): Playlist | null {
    const index = this.data.playlists.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.playlists[index] = { ...this.data.playlists[index], ...updates };
    this.saveData();
    return this.data.playlists[index];
  }

  public deletePlaylist(id: string): boolean {
    const prevLen = this.data.playlists.length;
    this.data.playlists = this.data.playlists.filter(p => p.id !== id);
    if (this.data.playlists.length !== prevLen) {
      this.saveData();
      this.logAudit('DELETE_PLAYLIST', 'Playlist', id, `Deleted playlist: ${id}`);
      return true;
    }
    return false;
  }

  // Campaigns
  public getCampaigns(): Campaign[] {
    return this.data.campaigns;
  }

  public getCampaignById(id: string): Campaign | undefined {
    return this.data.campaigns.find(c => c.id === id);
  }

  public createCampaign(campaign: Omit<Campaign, 'id' | 'createdAt'>): Campaign {
    const newCampaign: Campaign = {
      ...campaign,
      id: `CAMP-${Date.now().toString(36).toUpperCase()}`,
      createdAt: new Date().toISOString(),
    };
    this.data.campaigns.push(newCampaign);
    this.saveData();
    this.logAudit('CREATE_CAMPAIGN', 'Campaign', newCampaign.id, `Created ${newCampaign.type} campaign: ${newCampaign.name}`);
    return newCampaign;
  }

  public updateCampaign(id: string, updates: Partial<Campaign>): Campaign | null {
    const index = this.data.campaigns.findIndex(c => c.id === id);
    if (index === -1) return null;
    this.data.campaigns[index] = { ...this.data.campaigns[index], ...updates };
    this.saveData();
    this.logAudit('UPDATE_CAMPAIGN', 'Campaign', id, `Updated campaign status to: ${this.data.campaigns[index].status}`);
    return this.data.campaigns[index];
  }

  public deleteCampaign(id: string): boolean {
    const prevLen = this.data.campaigns.length;
    this.data.campaigns = this.data.campaigns.filter(c => c.id !== id);
    if (this.data.campaigns.length !== prevLen) {
      this.saveData();
      this.logAudit('DELETE_CAMPAIGN', 'Campaign', id, `Deleted campaign: ${id}`);
      return true;
    }
    return false;
  }

  // Audit Logs
  public getAuditLogs(): AuditLog[] {
    return [...this.data.auditLogs].reverse();
  }

  public logAudit(action: string, entity: string, entityId: string, details: string, userId?: string) {
    const log: AuditLog = {
      id: `AUD-${Date.now().toString(36).toUpperCase()}`,
      action,
      entity,
      entityId,
      details,
      timestamp: new Date().toISOString(),
      userId,
    };
    this.data.auditLogs.push(log);
    // Keep last 1000 logs
    if (this.data.auditLogs.length > 1000) {
      this.data.auditLogs.shift();
    }
    this.saveData();
  }
}

export const db = new Database();
