import React, { useState } from 'react';
import {
  Megaphone,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  PauseCircle,
  PlayCircle,
  ListVideo,
  Image as ImageIcon,
  Clock,
  Tv,
} from 'lucide-react';
import { Campaign, MediaItem, Department, Screen, Playlist } from '../types';
import { api } from '../services/api';

interface CampaignsPageProps {
  campaigns: Campaign[];
  media: MediaItem[];
  departments: Department[];
  screens: Screen[];
  playlists?: Playlist[];
  onOpenGlobalModal: () => void;
  onRefresh: () => void;
}

export const CampaignsPage: React.FC<CampaignsPageProps> = ({
  campaigns,
  media,
  departments,
  screens,
  playlists = [],
  onOpenGlobalModal,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [campaignContentType, setCampaignContentType] = useState<
    'playlist' | 'single_image' | 'only_queue'
  >('single_image');
  const [targetScope, setTargetScope] = useState<'global' | 'department' | 'screen'>('global');
  const [targetId, setTargetId] = useState('');
  const [selectedMediaId, setSelectedMediaId] = useState(media[0]?.id || '');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState(playlists[0]?.id || '');
  const [priority, setPriority] = useState(70);
  const [loading, setLoading] = useState(false);

  const openCreateModal = () => {
    setName('');
    setDescription('');
    setCampaignContentType('single_image');
    setTargetScope('global');
    setTargetId('');
    setSelectedMediaId(media[0]?.id || '');
    setSelectedPlaylistId(playlists[0]?.id || '');
    setPriority(70);
    setShowAddModal(true);
  };

  const openEditModal = (c: Campaign) => {
    setEditingCampaign(c);
    setName(c.name);
    setDescription(c.description || '');
    setCampaignContentType(
      c.contentType || (c.playlistId ? 'playlist' : c.mediaId ? 'single_image' : 'only_queue')
    );
    setTargetScope(
      c.type === 'global' ? 'global' : c.type === 'screen' ? 'screen' : 'department'
    );
    setTargetId(c.targetIds && c.targetIds[0] !== 'all' ? c.targetIds[0] : '');
    setSelectedMediaId(c.mediaId || media[0]?.id || '');
    setSelectedPlaylistId(c.playlistId || playlists[0]?.id || '');
    setPriority(c.priority || 70);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const selectedMedia = media.find((m) => m.id === selectedMediaId);
      const targetIds =
        targetScope === 'global' ? ['all'] : targetId ? [targetId] : [];

      await api.post('/campaigns', {
        name,
        description,
        type: targetScope === 'global' ? 'global' : targetScope,
        contentType: campaignContentType,
        targetIds,
        mediaId: campaignContentType === 'single_image' ? selectedMedia?.id : undefined,
        mediaUrl: campaignContentType === 'single_image' ? selectedMedia?.url : undefined,
        playlistId: campaignContentType === 'playlist' ? selectedPlaylistId : undefined,
        priority: Number(priority),
        status: 'active',
      });

      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error creating campaign: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCampaign) return;
    setLoading(true);
    try {
      const selectedMedia = media.find((m) => m.id === selectedMediaId);
      const targetIds =
        targetScope === 'global' ? ['all'] : targetId ? [targetId] : [];

      await api.patch(`/campaigns/${editingCampaign.id}`, {
        name,
        description,
        type: targetScope === 'global' ? 'global' : targetScope,
        contentType: campaignContentType,
        targetIds,
        mediaId: campaignContentType === 'single_image' ? selectedMedia?.id : undefined,
        mediaUrl: campaignContentType === 'single_image' ? selectedMedia?.url : undefined,
        playlistId: campaignContentType === 'playlist' ? selectedPlaylistId : undefined,
        priority: Number(priority),
      });

      setEditingCampaign(null);
      onRefresh();
    } catch (err: any) {
      alert(`Error updating campaign: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleStatus = async (c: Campaign) => {
    try {
      const newStatus = c.status === 'active' ? 'paused' : 'active';
      await api.patch(`/campaigns/${c.id}`, { status: newStatus });
      onRefresh();
    } catch (err: any) {
      alert(`Status update failed: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      onRefresh();
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h3
            style={{
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Campaigns & Advertisement Schedules
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Choose from 3 Campaign Types: Playlist Rotation, Single Image Poster, or Only Queue Display
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-secondary" onClick={onOpenGlobalModal}>
            <Megaphone size={16} /> 1-Click Global Ad
          </button>
          <button className="btn btn-primary" onClick={openCreateModal}>
            <Plus size={16} /> New Campaign
          </button>
        </div>
      </div>

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Megaphone size={42} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Campaigns Created Yet</h4>
          <p style={{ fontSize: '0.825rem', marginTop: '4px' }}>Click "New Campaign" above to schedule playlist sequences, image ads, or queue mode.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: '18px',
          }}
        >
          {campaigns.map((c) => {
            const typeLabel =
              c.contentType === 'only_queue'
                ? 'Only Queue Display'
                : c.contentType === 'playlist' || c.playlistId
                ? 'Playlist Sequence'
                : 'Single Image Poster';

            return (
            <div
              key={c.id}
              className="glass-card"
              style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor: 'rgba(107, 58, 138, 0.12)',
                        color: 'var(--primary)',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {typeLabel}
                    </span>
                    <span
                      style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        backgroundColor:
                          c.type === 'global'
                            ? 'rgba(16, 185, 129, 0.12)'
                            : 'rgba(245, 158, 11, 0.12)',
                        color: c.type === 'global' ? '#047857' : '#b45309',
                        fontSize: '0.7rem',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {c.type} Target
                    </span>
                  </div>
                  <h4
                    style={{
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      color: 'var(--text-main)',
                      marginTop: '8px',
                    }}
                  >
                    {c.name}
                  </h4>
                </div>

                <button
                  onClick={() => handleToggleStatus(c)}
                  style={{
                    padding: '4px 10px',
                    borderRadius: '20px',
                    border: 'none',
                    backgroundColor:
                      c.status === 'active'
                        ? 'rgba(16, 185, 129, 0.12)'
                        : 'rgba(239, 68, 68, 0.12)',
                    color: c.status === 'active' ? '#047857' : '#b91c1c',
                    fontSize: '0.725rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                  }}
                  title="Click to toggle Active/Paused"
                >
                  {c.status === 'active' ? <PlayCircle size={13} /> : <PauseCircle size={13} />}
                  {c.status.toUpperCase()}
                </button>
              </div>

              {c.description && (
                <p style={{ fontSize: '0.785rem', color: 'var(--text-muted)' }}>
                  {c.description}
                </p>
              )}

              {/* Media preview if single image */}
              {c.mediaUrl && c.contentType !== 'only_queue' && (
                <div
                  style={{
                    height: '110px',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    backgroundImage: `url(${c.mediaUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    border: '1px solid var(--border-color)',
                  }}
                />
              )}

              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  fontSize: '0.75rem',
                  color: 'var(--text-subtle)',
                  marginTop: '4px',
                }}
              >
                <span>Priority: <strong style={{ color: 'var(--primary)' }}>{c.priority}</strong></span>
                <span>Targets: {c.targetIds?.includes('all') ? 'All Hospital TVs' : `${c.targetIds?.length || 1} target(s)`}</span>
              </div>

              {/* Action Buttons: Edit / Delete */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '12px',
                }}
              >
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => openEditModal(c)}
                >
                  <Edit2 size={13} />
                  <span>Edit</span>
                </button>
                <button
                  className="btn btn-danger btn-sm"
                  onClick={() => handleDelete(c.id)}
                >
                  <Trash2 size={13} />
                  <span>Delete</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
      )}

      {/* Add Campaign Modal (with 3 Campaign Types) */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '26px' }}>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginBottom: '18px',
                fontFamily: 'var(--font-display)',
              }}
            >
              Create New Signage Campaign
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Campaign Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Free Eye Checkup Camp, Heart Health Week..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* 3 Campaign Types Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Campaign Type (3 Modes)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCampaignContentType('playlist')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border:
                        campaignContentType === 'playlist'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                      backgroundColor:
                        campaignContentType === 'playlist'
                          ? 'rgba(107, 58, 138, 0.12)'
                          : '#FFFFFF',
                      color:
                        campaignContentType === 'playlist'
                          ? 'var(--primary)'
                          : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ListVideo size={20} />
                    <span>Playlist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCampaignContentType('single_image')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border:
                        campaignContentType === 'single_image'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                      backgroundColor:
                        campaignContentType === 'single_image'
                          ? 'rgba(107, 58, 138, 0.12)'
                          : '#FFFFFF',
                      color:
                        campaignContentType === 'single_image'
                          ? 'var(--primary)'
                          : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ImageIcon size={20} />
                    <span>Single Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCampaignContentType('only_queue')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border:
                        campaignContentType === 'only_queue'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                      backgroundColor:
                        campaignContentType === 'only_queue'
                          ? 'rgba(107, 58, 138, 0.12)'
                          : '#FFFFFF',
                      color:
                        campaignContentType === 'only_queue'
                          ? 'var(--primary)'
                          : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Tv size={20} />
                    <span>Only Queue</span>
                  </button>
                </div>
              </div>

              {/* Conditional Content Inputs based on Campaign Type */}
              {campaignContentType === 'playlist' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Select Display Playlist
                  </label>
                  <select
                    className="input-field"
                    value={selectedPlaylistId}
                    onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  >
                    {playlists.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.items.length} slides)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {campaignContentType === 'single_image' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Select Image from Media Assets
                  </label>
                  <select
                    className="input-field"
                    value={selectedMediaId}
                    onChange={(e) => setSelectedMediaId(e.target.value)}
                  >
                    {media.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {campaignContentType === 'only_queue' && (
                <div
                  style={{
                    padding: '12px 14px',
                    borderRadius: '8px',
                    backgroundColor: 'rgba(16, 185, 129, 0.12)',
                    color: '#065f46',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}
                >
                  ✓ "Only Queue" mode ensures uninterrupted live patient OPD token screen display on targeted TV screens without advertisement interruptions.
                </div>
              )}

              {/* Target Scope */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Broadcast Target Scope
                  </label>
                  <select
                    className="input-field"
                    value={targetScope}
                    onChange={(e) => setTargetScope(e.target.value as any)}
                  >
                    <option value="global">All Hospital TVs (Global)</option>
                    <option value="department">Specific Department</option>
                    <option value="screen">Specific TV Screen</option>
                  </select>
                </div>

                {targetScope === 'department' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                      Select Department
                    </label>
                    <select
                      className="input-field"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                    >
                      <option value="">Choose Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetScope === 'screen' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                      Select TV Screen
                    </label>
                    <select
                      className="input-field"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                    >
                      <option value="">Choose Screen</option>
                      {screens.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Priority (10 - 100)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  min={10}
                  max={100}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Campaign Modal (Requested by User) */}
      {editingCampaign && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ padding: '26px' }}>
            <h3
              style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-main)',
                marginBottom: '18px',
                fontFamily: 'var(--font-display)',
              }}
            >
              Edit Campaign: {editingCampaign.name}
            </h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Campaign Title
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              {/* 3 Campaign Types Selection */}
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                  Campaign Type (3 Modes)
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  <button
                    type="button"
                    onClick={() => setCampaignContentType('playlist')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border:
                        campaignContentType === 'playlist'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                      backgroundColor:
                        campaignContentType === 'playlist'
                          ? 'rgba(107, 58, 138, 0.12)'
                          : '#FFFFFF',
                      color:
                        campaignContentType === 'playlist'
                          ? 'var(--primary)'
                          : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ListVideo size={20} />
                    <span>Playlist</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCampaignContentType('single_image')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border:
                        campaignContentType === 'single_image'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                      backgroundColor:
                        campaignContentType === 'single_image'
                          ? 'rgba(107, 58, 138, 0.12)'
                          : '#FFFFFF',
                      color:
                        campaignContentType === 'single_image'
                          ? 'var(--primary)'
                          : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <ImageIcon size={20} />
                    <span>Single Image</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setCampaignContentType('only_queue')}
                    style={{
                      padding: '12px 10px',
                      borderRadius: '10px',
                      border:
                        campaignContentType === 'only_queue'
                          ? '2px solid var(--primary)'
                          : '1px solid var(--border-color)',
                      backgroundColor:
                        campaignContentType === 'only_queue'
                          ? 'rgba(107, 58, 138, 0.12)'
                          : '#FFFFFF',
                      color:
                        campaignContentType === 'only_queue'
                          ? 'var(--primary)'
                          : 'var(--text-main)',
                      fontWeight: 700,
                      fontSize: '0.8rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      gap: '6px',
                    }}
                  >
                    <Tv size={20} />
                    <span>Only Queue</span>
                  </button>
                </div>
              </div>

              {campaignContentType === 'playlist' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Select Display Playlist
                  </label>
                  <select
                    className="input-field"
                    value={selectedPlaylistId}
                    onChange={(e) => setSelectedPlaylistId(e.target.value)}
                  >
                    {playlists.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.items.length} slides)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {campaignContentType === 'single_image' && (
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Select Image from Media Assets
                  </label>
                  <select
                    className="input-field"
                    value={selectedMediaId}
                    onChange={(e) => setSelectedMediaId(e.target.value)}
                  >
                    {media.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Target Scope */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Broadcast Target Scope
                  </label>
                  <select
                    className="input-field"
                    value={targetScope}
                    onChange={(e) => setTargetScope(e.target.value as any)}
                  >
                    <option value="global">All Hospital TVs (Global)</option>
                    <option value="department">Specific Department</option>
                    <option value="screen">Specific TV Screen</option>
                  </select>
                </div>

                {targetScope === 'department' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                      Select Department
                    </label>
                    <select
                      className="input-field"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                    >
                      <option value="">Choose Department</option>
                      {departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetScope === 'screen' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                      Select TV Screen
                    </label>
                    <select
                      className="input-field"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                    >
                      <option value="">Choose Screen</option>
                      {screens.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Priority (10 - 100)
                </label>
                <input
                  type="number"
                  className="input-field"
                  value={priority}
                  onChange={(e) => setPriority(Number(e.target.value))}
                  min={10}
                  max={100}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingCampaign(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
