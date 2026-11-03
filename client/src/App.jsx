import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map as MapIcon, AlertTriangle, Activity, Home, Settings, ChevronRight, Users, ClipboardList } from 'lucide-react';
import { supabase, updateClusterStatus } from './lib/supabase';


const createClusterCustomIcon = function (cluster) {
  const count = cluster.getChildCount();
  let size = 40;
  let colorClass = 'bg-blue-600 border-blue-300 text-white';
  
  if (count > 5) {
    size = 55;
    colorClass = 'bg-red-600 border-red-300 text-white';
  } else if (count > 2) {
    size = 45;
    colorClass = 'bg-amber-500 border-amber-200 text-white';
  }

  return L.divIcon({
    html: `
      <div 
        class="flex items-center justify-center rounded-full border-2 shadow-[0_4px_20px_rgba(0,0,0,0.8)] ${colorClass} font-extrabold backdrop-blur-md"
        style="width: ${size}px; height: ${size}px; font-size: 14px; text-shadow: 0 1px 3px rgba(0,0,0,0.9);"
      >
        <span>${count}</span>
      </div>
    `,
    className: 'custom-cluster-icon',
    iconSize: L.point(size, size, true),
  });
};
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  const [clusters, setClusters] = useState([]);
  const [debugLog, setDebugLog] = useState('System Online. Dispatch Ready.');
  const [highAccuracyGps, setHighAccuracyGps] = useState(false);

  const loadClusters = async () => {
    // Back to the correct table that holds our GPS coordinates!
    const { data, error } = await supabase
      .from('incident_cluster')
      .select('*')
      .order('updated_at', { ascending: false }); 
      
    if (error) {
      console.error("Supabase Error:", error);
      setDebugLog(`Sync Error: ${error.message}`);
      setClusters([]);
    } else if (data) {
      setClusters(data);
      setDebugLog(`Live sync complete. Tracking ${data.length} active zones.`);
    }
  };

  useEffect(() => { loadClusters(); }, []);

  const handleStatusChange = async (clusterId, newStatus) => {
    setDebugLog(`Updating cluster ${clusterId.substring(0,6)} to ${newStatus}...`);
    try {
      await updateClusterStatus(clusterId, newStatus);
      setDebugLog(`Successfully updated to ${newStatus}.`);
      loadClusters(); // Refresh the table and map instantly
    } catch (error) {
      setDebugLog(`Error updating status: ${error.message}`);
    }
  };

  const createDynamicCircleIcon = (cluster) => {
    const count = cluster.report_count || 1;
    const size = Math.min(120, 30 + (count * 10)); 
    
    let colors = 'bg-blue-500/80 border-blue-400'; 
    if (cluster.severity_level === 'High') colors = 'bg-red-500/80 border-red-400';
    if (cluster.severity_level === 'Medium') colors = 'bg-amber-500/80 border-amber-400';
    
    // Grey out resolved issues
    if (cluster.status === 'Resolved') colors = 'bg-zinc-600/80 border-zinc-500 text-zinc-300';

    return new L.DivIcon({
      className: 'bg-transparent border-0',
      html: `
        <div 
          class="flex items-center justify-center rounded-full border-2 shadow-[0_0_15px_rgba(0,0,0,0.5)] ${colors} font-bold backdrop-blur-sm transition-all duration-300"
          style="width: ${size}px; height: ${size}px; font-size: ${Math.max(12, size/3)}px;"
        >
          ${count}
        </div>
      `,
      iconSize: [size, size],
      iconAnchor: [size / 2, size / 2],
    });
  };

  const NavButton = ({ tab, icon: Icon, label, activeColor, hoverColor }) => (
    <button 
      onClick={() => setActiveTab(tab)} 
      className={`flex items-center gap-1.5 px-3 py-2 rounded-md font-medium transition-all duration-200 text-sm whitespace-nowrap
        ${activeTab === tab ? `bg-${activeColor}-600 text-white shadow-[0_0_10px_rgba(0,0,0,0.3)]` : `bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-700 hover:border-${hoverColor}-500`}`}
    >
      <Icon size={16} /> <span className="hidden sm:inline">{label}</span>
    </button>
  );

  return (
    <div className="flex flex-col h-screen bg-zinc-900 text-zinc-100 font-sans">
      <div className="h-1.5 w-full bg-gradient-to-r from-red-600 via-amber-500 via-emerald-600 to-blue-600"></div>
      
      <header className="flex flex-col p-4 bg-zinc-800 border-b border-zinc-800 shadow-lg shrink-0">
        <div className="flex justify-between items-center w-full mb-4">
          <div className="flex items-center gap-3">
            <div className="bg-zinc-900 p-2 rounded-lg border border-zinc-700"><AlertTriangle className="text-amber-500" size={20} /></div>
            <h1 className="font-extrabold text-lg sm:text-xl tracking-tight text-white">SA Civic Connect - Dispatch</h1>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 custom-scrollbar">
            <NavButton tab="home" icon={Home} label="Home" activeColor="zinc" hoverColor="zinc" />
            <NavButton tab="dispatch" icon={MapIcon} label="Map" activeColor="blue" hoverColor="blue" />
            <NavButton tab="admin" icon={ClipboardList} label="Admin" activeColor="purple" hoverColor="purple" />
            <NavButton tab="settings" icon={Settings} label="Settings" activeColor="zinc" hoverColor="zinc" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-xs text-zinc-400 bg-zinc-950 p-2.5 rounded-md border border-zinc-800/50 shadow-inner">
          <Activity size={14} className="text-emerald-500"/> <span className="font-mono truncate">{debugLog}</span>
        </div>
      </header>

      <main className="flex-1 overflow-hidden relative">
        {activeTab === 'home' && (
          <div className="h-full overflow-y-auto p-6 flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-10">
            <div className="space-y-5">
              <h2 className="text-4xl md:text-5xl font-extrabold text-white tracking-tight">
                Municipal Dispatch <br/> <span className="text-blue-500">Command Center</span>
              </h2>
              <p className="text-lg text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Monitor incoming AI-clustered fault reports, track repair team deployment, and resolve infrastructure issues across Midrand.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full text-left max-w-2xl mx-auto">
              <div className="bg-zinc-800/80 p-6 rounded-2xl border border-zinc-700 shadow-lg">
                <div className="bg-blue-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <MapIcon className="text-blue-400" size={24} />
                </div>
                <h3 className="text-zinc-100 font-bold mb-2">Live Map Tracking</h3>
                <p className="text-sm text-zinc-400">View real-time incident clusters colored by severity to prioritize maintenance dispatches efficiently.</p>
              </div>
              
              <div className="bg-zinc-800/80 p-6 rounded-2xl border border-zinc-700 shadow-lg">
                <div className="bg-purple-500/20 w-12 h-12 rounded-lg flex items-center justify-center mb-4">
                  <ClipboardList className="text-purple-400" size={24} />
                </div>
                <h3 className="text-zinc-100 font-bold mb-2">Administrative Control</h3>
                <p className="text-sm text-zinc-400">Update ticket statuses dynamically. Notify citizens instantly when hazards are actively being resolved.</p>
              </div>
            </div>

            <button onClick={() => setActiveTab('admin')} className="bg-purple-600 hover:bg-purple-500 text-white font-bold py-4 px-10 rounded-full flex items-center gap-2 shadow-[0_0_20px_rgba(147,51,234,0.3)] transition-transform hover:scale-105 mt-4">
              Open Admin Panel <ChevronRight size={22} />
            </button>
          </div>
        )}

        {activeTab === 'dispatch' && (
          <div className="absolute inset-0 bg-zinc-950">
            <MapContainer center={[-25.9800, 28.1260]} zoom={14} style={{ height: '100%', width: '100%' }}>
              <TileLayer 
                attribution='&copy; Google Maps'
                url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
              />
              <MarkerClusterGroup 
              chunkedLoading 
              maxClusterRadius={30} 
              iconCreateFunction={createClusterCustomIcon}
              >
                {clusters
                  .filter(cluster => cluster.latitude && cluster.longitude)
                  .map((cluster) => (
                  <Marker key={cluster.cluster_id} position={[cluster.latitude, cluster.longitude]} icon={createDynamicCircleIcon(cluster)}>
                    <Popup className="bg-zinc-800 text-zinc-900 border-0 rounded-md shadow-xl">
                      <div className="p-2 min-w-[150px]">
                        <strong className="block text-lg border-b border-zinc-300 pb-2 mb-2">{cluster.fault_category}</strong>
                        <div className="flex flex-col gap-1 text-sm">
                          <span>Severity: <strong className="text-amber-600">{cluster.severity_level}</strong></span>
                          <span>Reports: <strong className="text-red-600">{cluster.report_count}</strong></span>
                          <span>Status: <strong className={cluster.status === 'Resolved' ? 'text-emerald-600' : 'text-blue-600'}>{cluster.status}</strong></span>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </MarkerClusterGroup>
            </MapContainer>
          </div>
        )}

        {activeTab === 'admin' && (
          <div className="h-full p-4 md:p-6 max-w-6xl mx-auto overflow-y-auto">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
              <ClipboardList className="text-purple-500" /> Dispatch Administration
            </h2>
            <div className="bg-zinc-800 rounded-xl overflow-hidden border border-zinc-700 shadow-lg overflow-x-auto">
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-zinc-900 text-zinc-400">
                  <tr>
                    <th className="p-4 font-semibold">Fault Type</th>
                    <th className="p-4 font-semibold">Severity</th>
                    <th className="p-4 font-semibold text-center">Reports</th>
                    <th className="p-4 font-semibold">Status</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-700/50">
                  {clusters.length === 0 ? (
                    <tr><td colSpan="5" className="p-6 text-center text-zinc-500">No fault clusters found.</td></tr>
                  ) : (
                    clusters.map(cluster => (
                      <tr key={cluster.cluster_id} className="hover:bg-zinc-700/30 transition-colors">
                        <td className="p-4 font-medium text-zinc-200">{cluster.fault_category}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            cluster.severity_level === 'High' ? 'bg-red-500/20 text-red-400' : 
                            cluster.severity_level === 'Medium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'
                          }`}>
                            {cluster.severity_level}
                          </span>
                        </td>
                        <td className="p-4 text-center font-mono text-zinc-300">{cluster.report_count}</td>
                        <td className="p-4">
                          <span className={`px-2 py-1 rounded text-xs font-bold ${
                            cluster.status === 'Resolved' ? 'bg-emerald-500/20 text-emerald-400' : 
                            cluster.status === 'In Progress' ? 'bg-amber-500/20 text-amber-400' : 'bg-zinc-600/50 text-zinc-300'
                          }`}>
                            {cluster.status || 'Open'}
                          </span>
                        </td>
                        <td className="p-4 flex gap-2">
                          <button 
                            onClick={() => handleStatusChange(cluster.cluster_id, 'In Progress')}
                            disabled={cluster.status === 'In Progress' || cluster.status === 'Resolved'}
                            className="bg-amber-600 hover:bg-amber-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs transition-colors"
                          >
                            In Progress
                          </button>
                          <button 
                            onClick={() => handleStatusChange(cluster.cluster_id, 'Resolved')}
                            disabled={cluster.status === 'Resolved'}
                            className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-xs transition-colors"
                          >
                            Resolve
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'settings' && (
          <div className="h-full p-4 md:p-6 max-w-2xl mx-auto space-y-6">
            <h2 className="text-2xl font-bold text-white mb-6">App Settings</h2>
            <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center border border-zinc-700">
              <div><h4 className="font-medium text-zinc-200">High Accuracy GPS</h4></div>
              <input type="checkbox" checked={highAccuracyGps} onChange={() => setHighAccuracyGps(!highAccuracyGps)} className="w-5 h-5 accent-emerald-500" />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}