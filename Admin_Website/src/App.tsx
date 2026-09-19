import React, { useState, useEffect } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Dashboard } from './pages/Dashboard';
import { ScreensPage } from './pages/Screens';
import { DepartmentsPage } from './pages/Departments';
import { MediaLibraryPage } from './pages/MediaLibrary';
import { PlaylistsPage } from './pages/Playlists';
import { CampaignsPage } from './pages/Campaigns';
import { AuditLogsPage } from './pages/AuditLogs';
import { LiveFeeds } from './pages/LiveFeeds';
import { EmergencyAnnouncements } from './pages/EmergencyAnnouncements';
import { Login } from './pages/Login';
import { PairScreenModal } from './components/PairScreenModal';
import { ScreenDetailModal } from './components/ScreenDetailModal';
import { OneClickGlobalModal } from './components/OneClickGlobalModal';
import { Screen, Department, MediaItem, Playlist, Campaign, AuditLog } from './types';
import { api } from './services/api';
import { getSocket } from './services/socket';

export const App: React.FC = () => {
  // Authentication check: Must authenticate with ID JJMads@Vibesoft.in & Pass JJM@#ads & PIN 935989
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    try {
      return !!localStorage.getItem('jjm_auth_user');
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState('dashboard');
  const [screens, setScreens] = useState<Screen[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [hasActiveEmergency, setHasActiveEmergency] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Modals state
  const [isPairModalOpen, setIsPairModalOpen] = useState(false);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [selectedScreen, setSelectedScreen] = useState<Screen | null>(null);

  const handleLogout = () => {
    try {
      localStorage.removeItem('jjm_auth_user');
    } catch {}
    setIsAuthenticated(false);
  };

  // Fetch all initial data
  const fetchData = async () => {
    try {
      const [screensRes, deptsRes, mediaRes, plRes, campRes, auditRes, emRes] = await Promise.all([
        api.get('/screens'),
        api.get('/departments'),
        api.get('/media'),
        api.get('/playlists'),
        api.get('/campaigns'),
        api.get('/audit-logs'),
        api.get('/emergency').catch(() => ({ data: { success: false } })),
      ]);

      if (screensRes.data.success) setScreens(screensRes.data.screens);
      if (deptsRes.data.success) setDepartments(deptsRes.data.departments);
      if (mediaRes.data.success) setMedia(mediaRes.data.media);
      if (plRes.data.success) setPlaylists(plRes.data.playlists);
      if (campRes.data.success) setCampaigns(campRes.data.campaigns);
      if (auditRes.data.success) setAuditLogs(auditRes.data.logs);
      if (emRes.data?.success && emRes.data.announcement?.isActive) {
        setHasActiveEmergency(true);
      } else {
        setHasActiveEmergency(false);
      }
    } catch (err) {
      console.error('Error fetching admin data:', err);
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    fetchData();

    // Setup real-time Socket.IO listeners
    const socket = getSocket();

    socket.on('screens:changed', () => {
      fetchData();
    });

    socket.on('screen:status_change', ({ screenId, status }) => {
      setScreens((prev) =>
        prev.map((s) => (s.id === screenId ? { ...s, connectionStatus: status } : s))
      );
    });

    socket.on('screen:heartbeat_received', ({ screenId, status, currentContent }) => {
      setScreens((prev) =>
        prev.map((s) =>
          s.id === screenId
            ? {
                ...s,
                connectionStatus: 'online',
                lastHeartbeat: new Date().toISOString(),
                currentContent: currentContent || s.currentContent,
              }
            : s
        )
      );
    });

    socket.on('emergency:broadcast', () => {
      setHasActiveEmergency(true);
    });

    socket.on('emergency:dismiss', () => {
      setHasActiveEmergency(false);
    });

    return () => {
      socket.off('screens:changed');
      socket.off('screen:status_change');
      socket.off('screen:heartbeat_received');
      socket.off('emergency:broadcast');
      socket.off('emergency:dismiss');
    };
  }, [isAuthenticated]);

  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  const onlineScreensCount = screens.filter((s) => s.connectionStatus === 'online').length;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: 'var(--bg-main)' }}>
      {/* Left Navigation Sidebar */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          setActiveTab(tab);
          setIsMobileOpen(false);
        }}
        onlineScreensCount={onlineScreensCount}
        totalScreensCount={screens.length}
        hasActiveEmergency={hasActiveEmergency}
        onLogout={handleLogout}
        isMobileOpen={isMobileOpen}
        onCloseMobile={() => setIsMobileOpen(false)}
      />

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <Header
          title={
            activeTab === 'dashboard'
              ? 'Hospital Overview & Operations'
              : activeTab === 'emergency'
              ? 'Emergency Announcement Broadcast Center'
              : activeTab === 'live-feeds'
              ? 'Live Screen Feeds (CCTV Monitoring)'
              : activeTab === 'screens'
              ? 'Screens & TV Displays'
              : activeTab === 'departments'
              ? 'Hospital Departments'
              : activeTab === 'media'
              ? 'Media Assets Library'
              : activeTab === 'playlists'
              ? 'Display Sequence Playlists'
              : activeTab === 'campaigns'
              ? 'Promotions & Campaigns'
              : 'Audit Trail & Activity'
          }
          subtitle={
            activeTab === 'emergency'
              ? 'Live emergency alerts, ticker broadcasts, and visual overrides across all hospital TV displays'
              : activeTab === 'live-feeds'
              ? 'Real-time CCTV matrix monitoring active TV screen campaigns and live OPD queues'
              : 'JJM Hospital Kashipur Central Signage Control Plane'
          }
          onOpenPairModal={() => setIsPairModalOpen(true)}
          onOpenGlobalAdModal={() => setIsGlobalModalOpen(true)}
          onLogout={handleLogout}
          onToggleMobileMenu={() => setIsMobileOpen((prev) => !prev)}
        />

        <main style={{ flex: 1, overflowY: 'auto' }}>
          {activeTab === 'dashboard' && (
            <Dashboard
              screens={screens}
              departments={departments}
              media={media}
              campaigns={campaigns}
              onSelectScreen={(s) => setSelectedScreen(s)}
              onOpenPairModal={() => setIsPairModalOpen(true)}
              onOpenGlobalModal={() => setIsGlobalModalOpen(true)}
              onNavigateToLiveFeeds={() => setActiveTab('live-feeds')}
            />
          )}

          {activeTab === 'emergency' && (
            <EmergencyAnnouncements screens={screens} onRefresh={fetchData} />
          )}

          {activeTab === 'live-feeds' && (
            <LiveFeeds
              screens={screens}
              departments={departments}
              campaigns={campaigns}
              playlists={playlists}
              media={media}
              onRefresh={fetchData}
              onOpenGlobalModal={() => setIsGlobalModalOpen(true)}
              onSelectScreen={(s) => setSelectedScreen(s)}
            />
          )}

          {activeTab === 'screens' && (
            <ScreensPage
              screens={screens}
              departments={departments}
              onSelectScreen={(s) => setSelectedScreen(s)}
              onOpenPairModal={() => setIsPairModalOpen(true)}
              onRefreshScreens={fetchData}
            />
          )}

          {activeTab === 'departments' && (
            <DepartmentsPage departments={departments} onRefresh={fetchData} />
          )}

          {activeTab === 'media' && (
            <MediaLibraryPage media={media} onRefresh={fetchData} />
          )}

          {activeTab === 'playlists' && (
            <PlaylistsPage playlists={playlists} media={media} onRefresh={fetchData} />
          )}

          {activeTab === 'campaigns' && (
            <CampaignsPage
              campaigns={campaigns}
              media={media}
              departments={departments}
              screens={screens}
              playlists={playlists}
              onOpenGlobalModal={() => setIsGlobalModalOpen(true)}
              onRefresh={fetchData}
            />
          )}

          {activeTab === 'audit' && <AuditLogsPage logs={auditLogs} />}
        </main>
      </div>

      {/* Modals */}
      <PairScreenModal
        isOpen={isPairModalOpen}
        onClose={() => setIsPairModalOpen(false)}
        departments={departments}
        onScreenPaired={fetchData}
      />

      <ScreenDetailModal
        screen={selectedScreen}
        departments={departments}
        isOpen={!!selectedScreen}
        onClose={() => setSelectedScreen(null)}
        onRefreshList={fetchData}
      />

      <OneClickGlobalModal
        isOpen={isGlobalModalOpen}
        onClose={() => setIsGlobalModalOpen(false)}
        mediaList={media}
        onBroadcastSuccess={fetchData}
      />
    </div>
  );
};
