
import React, { useState, useMemo, useCallback } from 'react';
import { Player, Court, Match, Ranking } from './types';
import Modal from './components/Modal';
import { TrophyIcon, UsersIcon, CourtIcon, ClipboardListIcon, PlusIcon, TrashIcon, SearchIcon } from './components/icons';

// --- INITIAL DATA ---
const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', uniqueId: 1, name: 'Alice' },
  { id: 'p2', uniqueId: 2, name: 'Bob' },
  { id: 'p3', uniqueId: 3, name: 'Charlie' },
  { id: 'p4', uniqueId: 4, name: 'Diana' },
  { id: 'p5', uniqueId: 5, name: 'Ethan' },
  { id: 'p6', uniqueId: 6, name: 'Fiona' },
];

const INITIAL_COURTS: Court[] = [
  { id: 'c1', name: 'Court 1' },
  { id: 'c2', name: 'Court 2' },
  { id: 'c3', name: 'Court 3' },
];

const INITIAL_MATCHES: Match[] = [
  { id: 'm1', courtId: 'c1', teamAPlayers: ['p1', 'p2'], teamBPlayers: ['p3', 'p4'], teamAScore: 21, teamBScore: 18, date: new Date().toISOString() },
  { id: 'm2', courtId: 'c2', teamAPlayers: ['p5', 'p6'], teamBPlayers: ['p1', 'p3'], teamAScore: 15, teamBScore: 21, date: new Date().toISOString() },
  { id: 'm3', courtId: 'c1', teamAPlayers: ['p2', 'p4'], teamBPlayers: ['p5', 'p6'], teamAScore: 22, teamBScore: 20, date: new Date().toISOString() },
];

enum Tab {
  DASHBOARD,
  PLAYERS,
  COURTS,
  MATCHES
}

// --- App Component ---
export default function App() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isAddPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [isAddCourtModalOpen, setAddCourtModalOpen] = useState(false);
  const [newCourtName, setNewCourtName] = useState('');
  const [isRecordMatchModalOpen, setRecordMatchModalOpen] = useState(false);
  
  const [matchForm, setMatchForm] = useState({
    courtId: '',
    teamAPlayer1: '',
    teamAPlayer2: '',
    teamBPlayer1: '',
    teamBPlayer2: '',
    teamAScore: '',
    teamBScore: ''
  });
  
  const getPlayerDisplayName = useCallback((id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return 'Unknown';
    return `${player.name} #${player.uniqueId}`;
  }, [players]);

  const getCourtName = useCallback((id: string) => courts.find(c => c.id === id)?.name || 'Unknown', [courts]);


  const rankings = useMemo<Ranking[]>(() => {
    const playerStats: { [key: string]: { wins: number; matchesPlayed: number } } = {};

    players.forEach(p => {
      playerStats[p.id] = { wins: 0, matchesPlayed: 0 };
    });

    matches.forEach(match => {
      const allPlayers = [...match.teamAPlayers, ...match.teamBPlayers];
      allPlayers.forEach(playerId => {
        if (playerStats[playerId]) {
          playerStats[playerId].matchesPlayed += 1;
        }
      });

      const winners = match.teamAScore > match.teamBScore ? match.teamAPlayers : match.teamBPlayers;
      winners.forEach(winnerId => {
        if (playerStats[winnerId]) {
          playerStats[winnerId].wins += 1;
        }
      });
    });

    return players
      .map(player => {
        const stats = playerStats[player.id];
        return {
          playerId: player.id,
          playerName: `${player.name} #${player.uniqueId}`,
          matchesPlayed: stats.matchesPlayed,
          wins: stats.wins,
          winPercentage: stats.matchesPlayed > 0 ? (stats.wins / stats.matchesPlayed) * 100 : 0,
        };
      })
      .sort((a, b) => b.winPercentage - a.winPercentage || b.wins - a.wins);
  }, [players, matches]);
  
  // --- FILTERED DATA ---
  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  const filteredRankings = useMemo(() => {
    if (!lowerCaseSearchTerm) return rankings;
    return rankings.filter(r => r.playerName.toLowerCase().includes(lowerCaseSearchTerm));
  }, [rankings, lowerCaseSearchTerm]);
  
  const filteredPlayers = useMemo(() => {
    if (!lowerCaseSearchTerm) return players;
    return players.filter(p => `${p.name} #${p.uniqueId}`.toLowerCase().includes(lowerCaseSearchTerm));
  }, [players, lowerCaseSearchTerm]);

  const filteredCourts = useMemo(() => {
    if (!lowerCaseSearchTerm) return courts;
    return courts.filter(c => c.name.toLowerCase().includes(lowerCaseSearchTerm));
  }, [courts, lowerCaseSearchTerm]);
  
  const filteredMatches = useMemo(() => {
    if (!lowerCaseSearchTerm) return matches;
    return matches.filter(match => {
        const courtName = getCourtName(match.courtId).toLowerCase();
        const teamAPlayer1Name = getPlayerDisplayName(match.teamAPlayers[0]).toLowerCase();
        const teamAPlayer2Name = getPlayerDisplayName(match.teamAPlayers[1]).toLowerCase();
        const teamBPlayer1Name = getPlayerDisplayName(match.teamBPlayers[0]).toLowerCase();
        const teamBPlayer2Name = getPlayerDisplayName(match.teamBPlayers[1]).toLowerCase();

        return courtName.includes(lowerCaseSearchTerm) ||
               teamAPlayer1Name.includes(lowerCaseSearchTerm) ||
               teamAPlayer2Name.includes(lowerCaseSearchTerm) ||
               teamBPlayer1Name.includes(lowerCaseSearchTerm) ||
               teamBPlayer2Name.includes(lowerCaseSearchTerm);
    });
  }, [matches, lowerCaseSearchTerm, getCourtName, getPlayerDisplayName]);


  const handleAddPlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPlayerName.trim()) {
      const nextUniqueId = players.length > 0 ? Math.max(...players.map(p => p.uniqueId)) + 1 : 1;
      const newPlayer: Player = { 
        id: `p${Date.now()}`, 
        uniqueId: nextUniqueId,
        name: newPlayerName.trim() 
      };
      setPlayers([...players, newPlayer]);
      setNewPlayerName('');
      setAddPlayerModalOpen(false);
    }
  };
  
  const handleDeletePlayer = (id: string) => {
    if (window.confirm('Are you sure you want to delete this player? This will not delete past matches.')) {
        setPlayers(players.filter(p => p.id !== id));
    }
  }

  const handleAddCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (newCourtName.trim()) {
      const newCourt: Court = { id: `c${Date.now()}`, name: newCourtName.trim() };
      setCourts([...courts, newCourt]);
      setNewCourtName('');
      setAddCourtModalOpen(false);
    }
  };
  
  const handleDeleteCourt = (id: string) => {
      if (window.confirm('Are you sure you want to delete this court? Matches on this court will remain.')) {
          setCourts(courts.filter(c => c.id !== id));
      }
  }

  const handleRecordMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const { courtId, teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2, teamAScore, teamBScore } = matchForm;
    const allPlayers = [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2];
    
    if (new Set(allPlayers).size !== 4 || allPlayers.some(p => !p) || !courtId || !teamAScore || !teamBScore) {
        alert("Please select 4 unique players, a court, and enter scores.");
        return;
    }

    const newMatch: Match = {
        id: `m${Date.now()}`,
        courtId,
        teamAPlayers: [teamAPlayer1, teamAPlayer2],
        teamBPlayers: [teamBPlayer1, teamBPlayer2],
        teamAScore: Number(teamAScore),
        teamBScore: Number(teamBScore),
        date: new Date().toISOString()
    };
    setMatches([newMatch, ...matches]);
    setRecordMatchModalOpen(false);
    setMatchForm({ courtId: '', teamAPlayer1: '', teamAPlayer2: '', teamBPlayer1: '', teamBPlayer2: '', teamAScore: '', teamBScore: '' });
  };
  
  const handleDeleteMatch = (id: string) => {
      if (window.confirm('Are you sure you want to delete this match record?')) {
          setMatches(matches.filter(m => m.id !== id));
      }
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return <RankingTable rankings={filteredRankings} />;
      case Tab.PLAYERS:
        return (
            <div>
                <ActionButton onClick={() => setAddPlayerModalOpen(true)}>Add Player</ActionButton>
                <PlayerList players={filteredPlayers} onDelete={handleDeletePlayer} />
            </div>
        );
      case Tab.COURTS:
        return (
            <div>
                <ActionButton onClick={() => setAddCourtModalOpen(true)}>Add Court</ActionButton>
                <CourtList courts={filteredCourts} onDelete={handleDeleteCourt} />
            </div>
        );
      case Tab.MATCHES:
        return (
            <div>
                <ActionButton onClick={() => setRecordMatchModalOpen(true)}>Record Match</ActionButton>
                <MatchHistory matches={filteredMatches} getPlayerDisplayName={getPlayerDisplayName} getCourtName={getCourtName} onDelete={handleDeleteMatch} />
            </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 font-sans p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto">
        <header className="mb-6">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-sky-600">
              Badminton Group Manager
            </h1>
            <p className="text-slate-400 mt-2">Manage players, courts, matches, and rankings with ease.</p>
          </div>
          
          <div className="mt-6 max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <SearchIcon />
                </div>
                <input
                  type="text"
                  placeholder="Search rankings, players, courts, or matches..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-slate-800 text-white p-3 pl-10 rounded-lg focus:ring-2 focus:ring-cyan-500 outline-none border border-slate-700 shadow-sm transition-all"
                  aria-label="Search"
                />
              </div>
          </div>
        </header>

        <nav className="mb-8 flex flex-wrap justify-center gap-2 sm:gap-4 bg-slate-800 p-2 rounded-lg">
          <TabButton
            label="Rankings"
            icon={<TrophyIcon />}
            isActive={activeTab === Tab.DASHBOARD}
            onClick={() => setActiveTab(Tab.DASHBOARD)}
          />
          <TabButton
            label="Players"
            icon={<UsersIcon />}
            isActive={activeTab === Tab.PLAYERS}
            onClick={() => setActiveTab(Tab.PLAYERS)}
          />
          <TabButton
            label="Courts"
            icon={<CourtIcon />}
            isActive={activeTab === Tab.COURTS}
            onClick={() => setActiveTab(Tab.COURTS)}
          />
          <TabButton
            label="Matches"
            icon={<ClipboardListIcon />}
            isActive={activeTab === Tab.MATCHES}
            onClick={() => setActiveTab(Tab.MATCHES)}
          />
        </nav>

        <main className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-white/10">
            {renderContent()}
        </main>
      </div>
      
      {/* --- Modals --- */}
      <Modal isOpen={isAddPlayerModalOpen} onClose={() => setAddPlayerModalOpen(false)} title="Add New Player">
          <form onSubmit={handleAddPlayer} className="space-y-4">
              <input type="text" value={newPlayerName} onChange={(e) => setNewPlayerName(e.target.value)} placeholder="Player Name" className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required />
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">Add Player</button>
          </form>
      </Modal>

      <Modal isOpen={isAddCourtModalOpen} onClose={() => setAddCourtModalOpen(false)} title="Add New Court">
          <form onSubmit={handleAddCourt} className="space-y-4">
              <input type="text" value={newCourtName} onChange={(e) => setNewCourtName(e.target.value)} placeholder="Court Name" className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required />
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">Add Court</button>
          </form>
      </Modal>

      <Modal isOpen={isRecordMatchModalOpen} onClose={() => setRecordMatchModalOpen(false)} title="Record New Match">
          <form onSubmit={handleRecordMatch} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team A */}
                  <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                      <h3 className="font-bold text-sky-400">Team A</h3>
                      <PlayerSelect players={players} value={matchForm.teamAPlayer1} onChange={(e) => setMatchForm({...matchForm, teamAPlayer1: e.target.value})} placeholder="Player 1" />
                      <PlayerSelect players={players} value={matchForm.teamAPlayer2} onChange={(e) => setMatchForm({...matchForm, teamAPlayer2: e.target.value})} placeholder="Player 2" />
                      <input type="number" value={matchForm.teamAScore} onChange={(e) => setMatchForm({...matchForm, teamAScore: e.target.value})} placeholder="Score" className="w-full bg-slate-700 text-white p-2 rounded-md focus:ring-2 focus:ring-sky-500 outline-none" required />
                  </div>
                  {/* Team B */}
                  <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                      <h3 className="font-bold text-red-400">Team B</h3>
                      <PlayerSelect players={players} value={matchForm.teamBPlayer1} onChange={(e) => setMatchForm({...matchForm, teamBPlayer1: e.target.value})} placeholder="Player 1" />
                      <PlayerSelect players={players} value={matchForm.teamBPlayer2} onChange={(e) => setMatchForm({...matchForm, teamBPlayer2: e.target.value})} placeholder="Player 2" />
                      <input type="number" value={matchForm.teamBScore} onChange={(e) => setMatchForm({...matchForm, teamBScore: e.target.value})} placeholder="Score" className="w-full bg-slate-700 text-white p-2 rounded-md focus:ring-2 focus:ring-red-500 outline-none" required />
                  </div>
              </div>
              <select value={matchForm.courtId} onChange={(e) => setMatchForm({...matchForm, courtId: e.target.value})} className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required>
                  <option value="">Select Court</option>
                  {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">Record Match</button>
          </form>
      </Modal>
    </div>
  );
}

// --- Helper & UI Components ---
const TabButton: React.FC<{ label: string; icon: React.ReactNode; isActive: boolean; onClick: () => void }> = ({ label, icon, isActive, onClick }) => (
    <button
        onClick={onClick}
        className={`flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
            isActive ? 'bg-cyan-600 text-white shadow-md' : 'text-slate-300 hover:bg-slate-700 hover:text-white'
        }`}
    >
        {icon}
        <span className="hidden sm:inline">{label}</span>
    </button>
);

const ActionButton: React.FC<{ children: React.ReactNode; onClick: () => void }> = ({ children, onClick }) => (
    <button onClick={onClick} className="mb-4 inline-flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg">
        <PlusIcon /> {children}
    </button>
);

const RankingTable: React.FC<{ rankings: Ranking[] }> = ({ rankings }) => (
    <div className="overflow-x-auto">
        <table className="w-full text-left">
            <thead className="bg-slate-700/50">
                <tr>
                    <th className="p-3 font-semibold">Rank</th>
                    <th className="p-3 font-semibold">Player</th>
                    <th className="p-3 font-semibold text-center">Played</th>
                    <th className="p-3 font-semibold text-center">Wins</th>
                    <th className="p-3 font-semibold text-right">Win %</th>
                </tr>
            </thead>
            <tbody>
                {rankings.length > 0 ? rankings.map((r, index) => (
                    <tr key={r.playerId} className="border-b border-slate-700 last:border-0 hover:bg-slate-700/30">
                        <td className="p-3 font-bold text-lg">{index + 1}</td>
                        <td className="p-3 text-cyan-400 font-medium">{r.playerName}</td>
                        <td className="p-3 text-center">{r.matchesPlayed}</td>
                        <td className="p-3 text-center text-green-400">{r.wins}</td>
                        <td className="p-3 text-right font-mono">{r.winPercentage.toFixed(1)}%</td>
                    </tr>
                )) : (
                    <tr>
                        <td colSpan={5} className="text-center p-8 text-slate-500">No rankings found.</td>
                    </tr>
                )}
            </tbody>
        </table>
    </div>
);

const PlayerList: React.FC<{ players: Player[], onDelete: (id: string) => void }> = ({ players, onDelete }) => {
    const sortedPlayers = [...players].sort((a,b) => a.name.localeCompare(b.name));
    if (sortedPlayers.length === 0) {
        return <div className="text-center p-8 text-slate-500">No players found.</div>
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sortedPlayers.map(player => (
                <div key={player.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center shadow">
                    <span className="font-medium text-slate-300">{player.name} #{player.uniqueId}</span>
                    <button onClick={() => onDelete(player.id)} className="text-slate-500 hover:text-red-400 transition-colors"><TrashIcon /></button>
                </div>
            ))}
        </div>
    );
};

const CourtList: React.FC<{ courts: Court[], onDelete: (id: string) => void }> = ({ courts, onDelete }) => {
    const sortedCourts = [...courts].sort((a,b) => a.name.localeCompare(b.name));
    if (sortedCourts.length === 0) {
        return <div className="text-center p-8 text-slate-500">No courts found.</div>
    }
    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {sortedCourts.map(court => (
                <div key={court.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center shadow">
                    <span className="font-medium text-slate-300">{court.name}</span>
                    <button onClick={() => onDelete(court.id)} className="text-slate-500 hover:text-red-400 transition-colors"><TrashIcon /></button>
                </div>
            ))}
        </div>
    );
};

const MatchHistory: React.FC<{ matches: Match[], getPlayerDisplayName: (id: string) => string, getCourtName: (id: string) => string, onDelete: (id: string) => void }> = ({ matches, getPlayerDisplayName, getCourtName, onDelete }) => {
    if (matches.length === 0) {
        return <div className="text-center p-8 text-slate-500">No matches found.</div>
    }
    return (
        <div className="space-y-4">
            {matches.map(match => {
                const teamAWon = match.teamAScore > match.teamBScore;
                return (
                    <div key={match.id} className="bg-slate-700/50 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center">
                        <div className="flex-grow">
                            <div className="flex justify-between items-baseline mb-2">
                                <span className="font-bold text-slate-400">{getCourtName(match.courtId)}</span>
                                <span className="text-xs text-slate-500">{new Date(match.date).toLocaleDateString()}</span>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between gap-4">
                                <div className={`p-2 rounded ${teamAWon ? 'bg-green-500/10' : ''}`}>
                                    <p className={teamAWon ? 'font-bold text-sky-400' : 'text-slate-300'}>Team A: {getPlayerDisplayName(match.teamAPlayers[0])} & {getPlayerDisplayName(match.teamAPlayers[1])}</p>
                                </div>
                                <div className="flex items-center justify-center font-extrabold text-2xl">
                                    <span className={teamAWon ? 'text-green-400' : 'text-slate-400'}>{match.teamAScore}</span>
                                    <span className="mx-2 text-slate-500">-</span>
                                    <span className={!teamAWon ? 'text-green-400' : 'text-slate-400'}>{match.teamBScore}</span>
                                </div>
                                <div className={`p-2 rounded ${!teamAWon ? 'bg-green-500/10' : ''}`}>
                                    <p className={`text-right ${!teamAWon ? 'font-bold text-red-400' : 'text-slate-300'}`}>Team B: {getPlayerDisplayName(match.teamBPlayers[0])} & {getPlayerDisplayName(match.teamBPlayers[1])}</p>
                                </div>
                            </div>
                        </div>
                        <button onClick={() => onDelete(match.id)} className="mt-4 sm:mt-0 sm:ml-4 text-slate-500 hover:text-red-400 transition-colors self-end sm:self-center"><TrashIcon /></button>
                    </div>
                )
            })}
        </div>
    );
};

const PlayerSelect: React.FC<{ players: Player[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, placeholder: string }> = ({ players, value, onChange, placeholder }) => (
    <select value={value} onChange={onChange} className="w-full bg-slate-700 text-white p-2 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required>
        <option value="">{placeholder}</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name} #{p.uniqueId}</option>)}
    </select>
);
