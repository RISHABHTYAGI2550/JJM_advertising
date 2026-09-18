import React, { useState } from 'react';
import { Building2, Plus, Edit2, Trash2, ExternalLink } from 'lucide-react';
import { Department } from '../types';
import { api } from '../services/api';

interface DepartmentsPageProps {
  departments: Department[];
  onRefresh: () => void;
}

export const DepartmentsPage: React.FC<DepartmentsPageProps> = ({
  departments,
  onRefresh,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);

  // Form states for Add/Edit
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [floor, setFloor] = useState('');
  const [description, setDescription] = useState('');
  const [defaultQueueUrl, setDefaultQueueUrl] = useState(
    'https://hms.jjmhospitalkashipur.com/qd/DOC038'
  );
  const [loading, setLoading] = useState(false);

  const openAddModal = () => {
    setName('');
    setCode('');
    setFloor('1st Floor');
    setDescription('');
    setDefaultQueueUrl('https://hms.jjmhospitalkashipur.com/qd/DOC038');
    setShowAddModal(true);
  };

  const openEditModal = (dept: Department) => {
    setEditingDept(dept);
    setName(dept.name);
    setCode(dept.code);
    setFloor(dept.floor || '1st Floor');
    setDescription(dept.description || '');
    setDefaultQueueUrl(dept.defaultQueueUrl || 'https://hms.jjmhospitalkashipur.com/qd/DOC038');
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post('/departments', {
        name,
        code,
        floor,
        description,
        defaultQueueUrl,
      });
      setShowAddModal(false);
      onRefresh();
    } catch (err: any) {
      alert(`Error creating department: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingDept) return;
    setLoading(true);
    try {
      await api.patch(`/departments/${editingDept.id}`, {
        name,
        code,
        floor,
        description,
        defaultQueueUrl,
      });
      setEditingDept(null);
      onRefresh();
    } catch (err: any) {
      alert(`Error updating department: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, deptName: string) => {
    if (!confirm(`Are you sure you want to delete department: ${deptName}?`)) return;
    try {
      await api.delete(`/departments/${id}`);
      onRefresh();
    } catch (err: any) {
      alert(`Error deleting department: ${err.message}`);
    }
  };

  return (
    <div style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h3
            style={{
              fontSize: '1.3rem',
              fontWeight: 800,
              color: 'var(--text-main)',
              fontFamily: 'var(--font-display)',
            }}
          >
            Hospital Departments & Wards
          </h3>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Configure hospital departments, floors, and default doctor queue URLs for assigned TVs
          </p>
        </div>
        <button className="btn btn-primary" onClick={openAddModal}>
          <Plus size={16} /> Add Department
        </button>
      </div>

      {departments.length === 0 ? (
        <div className="glass-card" style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
          <Building2 size={42} color="var(--primary)" style={{ margin: '0 auto 12px', opacity: 0.6 }} />
          <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)' }}>No Departments Added Yet</h4>
          <p style={{ fontSize: '0.825rem', marginTop: '4px' }}>Click "Add Department" above to create your hospital OPD clinics and wards.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))',
            gap: '18px',
          }}
        >
          {departments.map((dept) => (
            <div key={dept.id} className="glass-card">
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start',
                marginBottom: '14px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div
                  style={{
                    width: '42px',
                    height: '42px',
                    borderRadius: '12px',
                    background:
                      'linear-gradient(135deg, rgba(107, 58, 138, 0.15) 0%, rgba(157, 107, 186, 0.2) 100%)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Building2 size={22} color="#6B3A8A" />
                </div>
                <div>
                  <h4 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>
                    {dept.name}
                  </h4>
                  <span style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 700 }}>
                    Code: {dept.code}
                  </span>
                </div>
              </div>
              <span
                style={{
                  padding: '4px 10px',
                  borderRadius: '14px',
                  backgroundColor: 'rgba(107, 58, 138, 0.08)',
                  fontSize: '0.75rem',
                  color: 'var(--primary)',
                  fontWeight: 700,
                }}
              >
                {dept.screenCount ?? 0} Screens
              </span>
            </div>

            <div style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '8px' }}>
              Floor / Ward Location: <strong style={{ color: 'var(--text-main)' }}>{dept.floor}</strong>
            </div>

            {dept.description && (
              <p
                style={{
                  fontSize: '0.775rem',
                  color: 'var(--text-subtle)',
                  marginBottom: '12px',
                  lineHeight: 1.4,
                }}
              >
                {dept.description}
              </p>
            )}

            <div
              style={{
                padding: '10px 12px',
                borderRadius: '8px',
                backgroundColor: 'var(--bg-subtle)',
                border: '1px solid var(--border-color)',
                marginBottom: '14px',
              }}
            >
              <div
                style={{
                  fontSize: '0.675rem',
                  color: 'var(--text-subtle)',
                  textTransform: 'uppercase',
                  fontWeight: 700,
                }}
              >
                Default Doctor Queue URL
              </div>
              <div
                style={{
                  fontSize: '0.75rem',
                  color: 'var(--text-main)',
                  fontFamily: 'monospace',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  marginTop: '3px',
                }}
              >
                {dept.defaultQueueUrl}
              </div>
            </div>

            {/* Edit & Delete Action Buttons */}
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
                onClick={() => openEditModal(dept)}
              >
                <Edit2 size={13} />
                <span>Edit</span>
              </button>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => handleDelete(dept.id, dept.name)}
              >
                <Trash2 size={13} />
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>
      )}

      {/* Add Department Modal */}
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
              Add New Hospital Department
            </h3>
            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Department Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  placeholder="e.g. Cardiology OPD, Radiology..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Department Code
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. CARD, ORTHO"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Floor / Wing
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="e.g. 1st Floor, OPD Wing B"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Default HMS Queue URL
                </label>
                <input
                  type="url"
                  className="input-field"
                  value={defaultQueueUrl}
                  onChange={(e) => setDefaultQueueUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Description (Optional)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Ward description, consulting doctors..."
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowAddModal(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Creating...' : 'Create Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Department Modal (Requested by User) */}
      {editingDept && (
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
              Edit Department: {editingDept.name}
            </h3>
            <form onSubmit={handleUpdate} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Department Name
                </label>
                <input
                  type="text"
                  className="input-field"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Department Code
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                    Floor / Wing
                  </label>
                  <input
                    type="text"
                    className="input-field"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Default HMS Queue URL
                </label>
                <input
                  type="url"
                  className="input-field"
                  value={defaultQueueUrl}
                  onChange={(e) => setDefaultQueueUrl(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.775rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '5px' }}>
                  Description (Optional)
                </label>
                <textarea
                  className="input-field"
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setEditingDept(null)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving Changes...' : 'Save Department'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
