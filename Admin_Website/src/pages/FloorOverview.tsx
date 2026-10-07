import React, { useMemo } from 'react';
import { Screen, Department } from '../types';
import { Monitor, AlertTriangle, Layers, MapPin, Building, CheckCircle2 } from 'lucide-react';

interface FloorOverviewProps {
  screens: Screen[];
  departments: Department[];
}

export const FloorOverview: React.FC<FloorOverviewProps> = ({ screens, departments }) => {
  // Group departments by floor
  const floorData = useMemo(() => {
    const floors: Record<string, {
      name: string;
      departments: Department[];
      totalScreens: number;
      onlineScreens: number;
    }> = {};

    departments.forEach(dept => {
      const floorName = dept.floor || 'Unknown Floor';
      if (!floors[floorName]) {
        floors[floorName] = {
          name: floorName,
          departments: [],
          totalScreens: 0,
          onlineScreens: 0,
        };
      }
      floors[floorName].departments.push(dept);
    });

    // Attach screens and counts
    Object.values(floors).forEach(floor => {
      floor.departments.forEach(dept => {
        const deptScreens = screens.filter(s => s.departmentId === dept.id);
        const online = deptScreens.filter(s => s.connectionStatus === 'online').length;
        
        floor.totalScreens += deptScreens.length;
        floor.onlineScreens += online;
      });
    });

    // Sort floors alphabetically (e.g. Ground Floor, 1st Floor, 2nd Floor...)
    return Object.values(floors).sort((a, b) => a.name.localeCompare(b.name));
  }, [screens, departments]);

  return (
    <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div>
        <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--dark)' }}>
          Hospital Floor Overview
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '4px' }}>
          Overview of TV deployments grouped by building floors and departments.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {floorData.length === 0 ? (
          <div className="card" style={{ padding: '40px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Layers size={48} style={{ opacity: 0.2, margin: '0 auto 16px' }} />
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--dark)' }}>No Floor Data Found</h3>
            <p style={{ fontSize: '13px', marginTop: '8px' }}>Create departments and assign floors to see the overview.</p>
          </div>
        ) : (
          floorData.map((floor) => (
            <div key={floor.name} className="card" style={{ overflow: 'hidden' }}>
              {/* Floor Header */}
              <div style={{ 
                padding: '16px 20px', 
                backgroundColor: 'var(--bg-secondary)', 
                borderBottom: '1px solid var(--border)',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '8px', backgroundColor: 'var(--primary-subtle)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Building size={20} />
                  </div>
                  <div>
                    <h2 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dark)' }}>{floor.name}</h2>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', gap: '16px', marginTop: '2px' }}>
                      <span>{floor.departments.length} Departments</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '16px' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--dark)' }}>{floor.totalScreens}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Total TVs</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: '#0E805E' }}>{floor.onlineScreens}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Online</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ fontSize: '20px', fontWeight: 700, color: 'var(--danger)' }}>{floor.totalScreens - floor.onlineScreens}</div>
                    <div style={{ fontSize: '11px', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Offline</div>
                  </div>
                </div>
              </div>

              {/* Departments inside Floor */}
              <div style={{ padding: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                  {floor.departments.map(dept => {
                    const deptScreens = screens.filter(s => s.departmentId === dept.id);
                    const online = deptScreens.filter(s => s.connectionStatus === 'online').length;
                    const offline = deptScreens.length - online;

                    return (
                      <div key={dept.id} style={{ 
                        border: '1px solid var(--border)', 
                        borderRadius: 'var(--radius-md)', 
                        padding: '16px',
                        backgroundColor: '#fff'
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                          <div>
                            <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'var(--dark)' }}>{dept.name}</h3>
                            <div style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>Code: {dept.code}</div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                          <div style={{ flex: 1, backgroundColor: 'var(--bg-secondary)', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--dark)' }}>{deptScreens.length}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Total</div>
                          </div>
                          <div style={{ flex: 1, backgroundColor: '#E6F6F1', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: '#0E805E' }}>{online}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Online</div>
                          </div>
                          <div style={{ flex: 1, backgroundColor: '#FCE8E8', padding: '8px', borderRadius: '4px', textAlign: 'center' }}>
                            <div style={{ fontSize: '16px', fontWeight: 700, color: 'var(--danger)' }}>{offline}</div>
                            <div style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Offline</div>
                          </div>
                        </div>

                        {deptScreens.length > 0 && (
                          <div>
                            <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase' }}>
                              Installed Screens
                            </div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              {deptScreens.map(s => (
                                <div key={s.id} style={{ 
                                  display: 'flex', 
                                  alignItems: 'center', 
                                  justifyContent: 'space-between',
                                  fontSize: '12px',
                                  padding: '6px 8px',
                                  backgroundColor: 'var(--bg-main)',
                                  borderRadius: '4px'
                                }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                                    <Monitor size={12} color="var(--text-secondary)" />
                                    <span style={{ fontWeight: 500, color: 'var(--dark)' }}>{s.name}</span>
                                  </div>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    {s.connectionStatus === 'online' ? (
                                      <><CheckCircle2 size={12} color="#0E805E" /> <span style={{ color: '#0E805E', fontSize: '11px' }}>Online</span></>
                                    ) : (
                                      <><AlertTriangle size={12} color="var(--danger)" /> <span style={{ color: 'var(--danger)', fontSize: '11px' }}>Offline</span></>
                                    )}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
