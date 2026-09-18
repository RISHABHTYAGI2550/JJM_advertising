import { db } from '../db/database';
import { PairingSession, Screen } from '../types';
import { v4 as uuidv4 } from 'uuid';

export class PairingService {
  // Generate a random 6-digit numeric pairing code
  public createPairingSession(socketId?: string, deviceMetadata?: Record<string, any>): PairingSession {
    // 6-digit number between 100000 and 999999
    const pairingCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = Date.now() + 15 * 60 * 1000; // 15 minutes validity

    const session: PairingSession = {
      pairingCode,
      socketId,
      expiresAt,
      status: 'pending',
      deviceMetadata,
    };

    db.savePairingSession(session);
    return session;
  }

  // Admin approves pairing
  public pairScreen(
    pairingCode: string,
    data: {
      name: string;
      code?: string;
      departmentId: string;
      location: string;
      queueUrl: string;
    }
  ): { screen: Screen; session: PairingSession } {
    const session = db.getPairingSession(pairingCode);
    if (!session) {
      throw new Error('Invalid or expired pairing code');
    }

    if (session.status !== 'pending' || session.expiresAt < Date.now()) {
      throw new Error('Pairing code has expired or is already used');
    }

    const screenCode = data.code || `SCR-${Math.floor(100 + Math.random() * 900)}`;
    const screenId = `SCR-${screenCode}`;
    const deviceToken = `DEV-${uuidv4()}`;

    // Create or update screen in database
    let screen = db.getScreenById(screenId);
    if (screen) {
      screen = db.updateScreen(screenId, {
        name: data.name,
        departmentId: data.departmentId,
        location: data.location,
        queueUrl: data.queueUrl,
        deviceToken,
        connectionStatus: 'online',
        lastHeartbeat: new Date().toISOString(),
        status: 'active',
      })!;
    } else {
      screen = db.createScreen({
        id: screenId,
        name: data.name,
        code: screenCode,
        departmentId: data.departmentId,
        location: data.location,
        queueUrl: data.queueUrl,
        status: 'active',
        connectionStatus: 'online',
        lastHeartbeat: new Date().toISOString(),
        currentContent: 'queue',
        currentCampaignId: null,
        playlistId: 'PL-DEFAULT',
        deviceToken,
        playerVersion: '1.0.0',
        deviceMetadata: session.deviceMetadata,
      });
    }

    // Update session
    session.status = 'paired';
    session.screenId = screen.id;
    session.deviceToken = deviceToken;
    db.savePairingSession(session);
    db.logAudit('PAIR_DEVICE', 'Screen', screen.id, `Device paired with code ${pairingCode} as ${screen.name}`);

    return { screen, session };
  }

  public unpairScreen(screenId: string): Screen | null {
    const screen = db.getScreenById(screenId);
    if (!screen) return null;

    const updated = db.updateScreen(screenId, {
      deviceToken: null,
      connectionStatus: 'offline',
      status: 'inactive',
    });

    db.logAudit('UNPAIR_DEVICE', 'Screen', screenId, `Device revoked/unpaired`);
    return updated;
  }
}

export const pairingService = new PairingService();
