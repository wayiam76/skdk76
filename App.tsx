
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Player, Court, Match, Ranking, QueueItem } from './types';
import Modal from './components/Modal';
import { TrophyIcon, UsersIcon, CourtIcon, ClipboardListIcon, QueueListIcon, PlusIcon, TrashIcon, SearchIcon, EditIcon } from './components/icons';

// --- INITIAL DATA ---
const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', uniqueId: 1, name: 'Alice' },
  { id: 'p2', uniqueId: 2, name: 'Bob' },
  { id: 'p3', uniqueId: 3, name: 'Charlie' },
  { id: 'p4', uniqueId: 4, name: 'Diana' },
  { id: 'p5', uniqueId: 5, name: 'Ethan' },
  { id: 'p6', uniqueId: 6, name: 'Fiona' },
  { id: 'p7', uniqueId: 7, name: 'George' },
  { id: 'p8', uniqueId: 8, name: 'Heidi' },
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
  MATCHES,
  QUEUE
}

// --- App Component ---
export default function App() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isPlayerModalOpen, setPlayerModalOpen] = useState(false);
  const [isCourtModalOpen, setCourtModalOpen] = useState(false);
  const [isMatchModalOpen, setMatchModalOpen] = useState(false);
  const [isQueueModalOpen, setQueueModalOpen] = useState(false);
  const [matchAlert, setMatchAlert] = useState<{ courtName: string; teamA: [string, string]; teamB: [string, string] } | null>(null);
  
  // Editing States
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);

  // Form States
  const [playerName, setPlayerName] = useState('');
  const [courtName, setCourtName] = useState('');
  const [matchForm, setMatchForm] = useState({
    courtId: '',
    teamAPlayer1: '',
    teamAPlayer2: '',
    teamBPlayer1: '',
    teamBPlayer2: '',
    teamAScore: '',
    teamBScore: ''
  });
  const [queueForm, setQueueForm] = useState({ player1: '', player2: '' });

  const getPlayerDisplayName = useCallback((id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return 'Unknown';
    return `${player.name} #${player.uniqueId}`;
  }, [players]);

  const getCourtName = useCallback((id: string) => courts.find(c => c.id === id)?.name || 'Unknown', [courts]);

  // --- Automatic Match Creation from Queue ---
  useEffect(() => {
    const unscoredMatchCourtIds = new Set(matches.filter(m => m.teamAScore === null).map(m => m.courtId));
    const availableCourtIds = courts.filter(c => !unscoredMatchCourtIds.has(c.id)).map(c => c.id);
    
    if (availableCourtIds.length > 0 && queue.length >= 2) {
      const courtsToFill = [...availableCourtIds];
      const teamsToMatch = [...queue];
      const newMatches: Match[] = [];
      const teamsToRemove: string[] = [];
      
      while(courtsToFill.length > 0 && teamsToMatch.length >= 2) {
        const courtId = courtsToFill.shift()!;
        const teamA = teamsToMatch.shift()!;
        const teamB = teamsToMatch.shift()!;
        
        const newMatch: Match = {
          id: `m${Date.now()}-${courtId}`,
          courtId,
          teamAPlayers: teamA.players,
          teamBPlayers: teamB.players,
          teamAScore: null,
          teamBScore: null,
          date: new Date().toISOString()
        };
        newMatches.push(newMatch);
        teamsToRemove.push(teamA.id, teamB.id);

        setMatchAlert({
            courtName: getCourtName(courtId),
            teamA: [getPlayerDisplayName(teamA.players[0]), getPlayerDisplayName(teamA.players[1])],
            teamB: [getPlayerDisplayName(teamB.players[0]), getPlayerDisplayName(teamB.players[1])]
        });
      }

      if(newMatches.length > 0) {
        setMatches(prev => [...newMatches, ...prev]);
        setQueue(prev => prev.filter(item => !teamsToRemove.includes(item.id)));
      }
    }
  }, [matches, courts, queue, players, getCourtName, getPlayerDisplayName]);


  // --- Modal Opening/Closing Handlers ---

  const openPlayerModal = (player: Player | null = null) => {
    setEditingPlayer(player);
    setPlayerName(player ? player.name : '');
    setPlayerModalOpen(true);
  };

  const closePlayerModal = () => {
    setPlayerModalOpen(false);
    setEditingPlayer(null);
    setPlayerName('');
  };

  const openCourtModal = (court: Court | null = null) => {
    setEditingCourt(court);
    setCourtName(court ? court.name : '');
    setCourtModalOpen(true);
  };

  const closeCourtModal = () => {
    setCourtModalOpen(false);
    setEditingCourt(null);
    setCourtName('');
  };

  const openMatchModal = (match: Match | null = null) => {
    setEditingMatch(match);
    setMatchForm(match ? {
        courtId: match.courtId,
        teamAPlayer1: match.teamAPlayers[0],
        teamAPlayer2: match.teamAPlayers[1],
        teamBPlayer1: match.teamBPlayers[0],
        teamBPlayer2: match.teamBPlayers[1],
        teamAScore: match.teamAScore === null ? '' : String(match.teamAScore),
        teamBScore: match.teamBScore === null ? '' : String(match.teamBScore),
    } : {
        courtId: '', teamAPlayer1: '', teamAPlayer2: '', teamBPlayer1: '', teamBPlayer2: '', teamAScore: '', teamBScore: ''
    });
    setMatchModalOpen(true);
  };

  const closeMatchModal = () => {
    setMatchModalOpen(false);
    setEditingMatch(null);
    setMatchForm({ courtId: '', teamAPlayer1: '', teamAPlayer2: '', teamBPlayer1: '', teamBPlayer2: '', teamAScore: '', teamBScore: '' });
  };
  
  const openQueueModal = () => setQueueModalOpen(true);
  const closeQueueModal = () => {
      setQueueModalOpen(false);
      setQueueForm({ player1: '', player2: '' });
  }

  const rankings = useMemo<Ranking[]>(() => {
    const playerStats: { [key: string]: { wins: number; matchesPlayed: number } } = {};

    players.forEach(p => {
      playerStats[p.id] = { wins: 0, matchesPlayed: 0 };
    });

    matches.forEach(match => {
      if (match.teamAScore === null || match.teamBScore === null) return;

      const allPlayers = [...match.teamAPlayers, ...match.teamBPlayers];
      allPlayers.forEach(playerId => {
        if (playerStats[playerId]) {
          playerStats[playerId].matchesPlayed += 1;
        }
      });

      if (match.teamAScore !== match.teamBScore) {
          const winners = match.teamAScore > match.teamBScore ? match.teamAPlayers : match.teamBPlayers;
          winners.forEach(winnerId => {
            if (playerStats[winnerId]) {
              playerStats[winnerId].wins += 1;
            }
          });
      }
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

  const filteredQueue = useMemo(() => {
    if (!lowerCaseSearchTerm) return queue;
    return queue.filter(item => {
      const player1Name = getPlayerDisplayName(item.players[0]).toLowerCase();
      const player2Name = getPlayerDisplayName(item.players[1]).toLowerCase();
      return player1Name.includes(lowerCaseSearchTerm) || player2Name.includes(lowerCaseSearchTerm);
    });
  }, [queue, lowerCaseSearchTerm, getPlayerDisplayName]);

  // --- CRUD Handlers ---

  const handleSavePlayer = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      if (editingPlayer) {
        setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, name: playerName.trim() } : p));
      } else {
        const nextUniqueId = players.length > 0 ? Math.max(...players.map(p => p.uniqueId)) + 1 : 1;
        const newPlayer: Player = { 
          id: `p${Date.now()}`, 
          uniqueId: nextUniqueId,
          name: playerName.trim() 
        };
        setPlayers([...players, newPlayer]);
      }
      closePlayerModal();
    }
  };
  
  const handleDeletePlayer = (id: string) => {
    if (window.confirm('Are you sure you want to delete this player? This will not delete past matches but will remove them from the queue.')) {
        setPlayers(players.filter(p => p.id !== id));
        setQueue(q => q.filter(item => !item.players.includes(id)));
    }
  }

  const handleSaveCourt = (e: React.FormEvent) => {
    e.preventDefault();
    if (courtName.trim()) {
        if (editingCourt) {
            setCourts(courts.map(c => c.id === editingCourt.id ? { ...c, name: courtName.trim() } : c));
        } else {
            const newCourt: Court = { id: `c${Date.now()}`, name: courtName.trim() };
            setCourts([...courts, newCourt]);
        }
        closeCourtModal();
    }
  };
  
  const handleDeleteCourt = (id: string) => {
      if (window.confirm('Are you sure you want to delete this court? Matches on this court will remain.')) {
          setCourts(courts.filter(c => c.id !== id));
      }
  }

  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();
    const { courtId, teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2, teamAScore, teamBScore } = matchForm;
    const allPlayers = [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2];
    
    if (new Set(allPlayers).size !== 4 || allPlayers.some(p => !p) || !courtId) {
        alert("Please select 4 unique players and a court.");
        return;
    }

    const finalTeamAScore = teamAScore.trim() === '' ? null : Number(teamAScore);
    const finalTeamBScore = teamBScore.trim() === '' ? null : Number(teamBScore);

    if (editingMatch) {
        const updatedMatch: Match = {
            ...editingMatch,
            courtId,
            teamAPlayers: [teamAPlayer1, teamAPlayer2],
            teamBPlayers: [teamBPlayer1, teamBPlayer2],
            teamAScore: finalTeamAScore,
            teamBScore: finalTeamBScore,
        };
        setMatches(matches.map(m => m.id === editingMatch.id ? updatedMatch : m));
    } else {
        const newMatch: Match = {
            id: `m${Date.now()}`,
            courtId,
            teamAPlayers: [teamAPlayer1, teamAPlayer2],
            teamBPlayers: [teamBPlayer1, teamBPlayer2],
            teamAScore: finalTeamAScore,
            teamBScore: finalTeamBScore,
            date: new Date().toISOString()
        };
        setMatches([newMatch, ...matches]);
    }
    closeMatchModal();
  };
  
  const handleDeleteMatch = (id: string) => {
      if (window.confirm('Are you sure you want to delete this match record?')) {
          setMatches(matches.filter(m => m.id !== id));
      }
  }

  const handleAddToQueue = (e: React.FormEvent) => {
    e.preventDefault();
    const { player1, player2 } = queueForm;

    if (!player1 || !player2 || player1 === player2) {
      alert("Please select two different players.");
      return;
    }

    const playersInQueue = new Set(queue.flatMap(item => item.players));
    if (playersInQueue.has(player1) || playersInQueue.has(player2)) {
      alert("One or both players are already in the queue.");
      return;
    }
    
    const newQueueItem: QueueItem = {
      id: `q${Date.now()}`,
      players: [player1, player2]
    };
    setQueue([...queue, newQueueItem]);
    closeQueueModal();
  };

  const handleRemoveFromQueue = (id: string) => {
    setQueue(queue.filter(item => item.id !== id));
  }

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return <RankingTable rankings={filteredRankings} />;
      case Tab.PLAYERS:
        return (
            <div>
                <ActionButton onClick={() => openPlayerModal()}>Add Player</ActionButton>
                <PlayerList players={filteredPlayers} onEdit={openPlayerModal} onDelete={handleDeletePlayer} />
            </div>
        );
      case Tab.COURTS:
        return (
            <div>
                <ActionButton onClick={() => openCourtModal()}>Add Court</ActionButton>
                <CourtList courts={filteredCourts} onEdit={openCourtModal} onDelete={handleDeleteCourt} />
            </div>
        );
      case Tab.MATCHES:
        return (
            <div>
                <ActionButton onClick={() => openMatchModal()}>Record Match</ActionButton>
                <MatchHistory matches={filteredMatches} getPlayerDisplayName={getPlayerDisplayName} getCourtName={getCourtName} onEdit={openMatchModal} onDelete={handleDeleteMatch} />
            </div>
        );
      case Tab.QUEUE:
        return (
            <div>
                <ActionButton onClick={openQueueModal}>Add Team to Queue</ActionButton>
                <QueueList queue={filteredQueue} getPlayerDisplayName={getPlayerDisplayName} onRemove={handleRemoveFromQueue} />
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
          <TabButton
            label="Queue"
            icon={<QueueListIcon />}
            isActive={activeTab === Tab.QUEUE}
            onClick={() => setActiveTab(Tab.QUEUE)}
          />
        </nav>

        <main className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-white/10">
            {renderContent()}
        </main>
      </div>
      
      {/* --- Modals --- */}
      <Modal isOpen={isPlayerModalOpen} onClose={closePlayerModal} title={editingPlayer ? "Edit Player" : "Add New Player"}>
          <form onSubmit={handleSavePlayer} className="space-y-4">
              <input type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player Name" className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required />
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">{editingPlayer ? "Save Changes" : "Add Player"}</button>
          </form>
      </Modal>

      <Modal isOpen={isCourtModalOpen} onClose={closeCourtModal} title={editingCourt ? "Edit Court" : "Add New Court"}>
          <form onSubmit={handleSaveCourt} className="space-y-4">
              <input type="text" value={courtName} onChange={(e) => setCourtName(e.target.value)} placeholder="Court Name" className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required />
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">{editingCourt ? "Save Changes" : "Add Court"}</button>
          </form>
      </Modal>

      <Modal isOpen={isMatchModalOpen} onClose={closeMatchModal} title={editingMatch ? "Edit Match" : "Record New Match"}>
          <form onSubmit={handleSaveMatch} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team A */}
                  <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                      <h3 className="font-bold text-sky-400">Team A</h3>
                      <PlayerSelect players={players} value={matchForm.teamAPlayer1} onChange={(e) => setMatchForm({...matchForm, teamAPlayer1: e.target.value})} placeholder="Player 1" />
                      <PlayerSelect players={players} value={matchForm.teamAPlayer2} onChange={(e) => setMatchForm({...matchForm, teamAPlayer2: e.target.value})} placeholder="Player 2" />
                      <input type="number" value={matchForm.teamAScore} onChange={(e) => setMatchForm({...matchForm, teamAScore: e.target.value})} placeholder="Score" className="w-full bg-slate-700 text-white p-2 rounded-md focus:ring-2 focus:ring-sky-500 outline-none" />
                  </div>
                  {/* Team B */}
                  <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                      <h3 className="font-bold text-red-400">Team B</h3>
                      <PlayerSelect players={players} value={matchForm.teamBPlayer1} onChange={(e) => setMatchForm({...matchForm, teamBPlayer1: e.target.value})} placeholder="Player 1" />
                      <PlayerSelect players={players} value={matchForm.teamBPlayer2} onChange={(e) => setMatchForm({...matchForm, teamBPlayer2: e.target.value})} placeholder="Player 2" />
                      <input type="number" value={matchForm.teamBScore} onChange={(e) => setMatchForm({...matchForm, teamBScore: e.target.value})} placeholder="Score" className="w-full bg-slate-700 text-white p-2 rounded-md focus:ring-2 focus:ring-red-500 outline-none" />
                  </div>
              </div>
              <select value={matchForm.courtId} onChange={(e) => setMatchForm({...matchForm, courtId: e.target.value})} className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required>
                  <option value="">Select Court</option>
                  {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">{editingMatch ? "Save Changes" : "Record Match"}</button>
          </form>
      </Modal>

      <Modal isOpen={isQueueModalOpen} onClose={closeQueueModal} title="Add Team to Queue">
        <form onSubmit={handleAddToQueue} className="space-y-4">
            <PlayerSelect players={players} value={queueForm.player1} onChange={(e) => setQueueForm({...queueForm, player1: e.target.value})} placeholder="Select Player 1" />
            <PlayerSelect players={players} value={queueForm.player2} onChange={(e) => setQueueForm({...queueForm, player2: e.target.value})} placeholder="Select Player 2" />
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">Add to Queue</button>
        </form>
      </Modal>

      <Modal isOpen={!!matchAlert} onClose={() => setMatchAlert(null)} title="Match Ready!">
        {matchAlert && (
            <div className="text-center space-y-4">
                <p className="text-2xl font-bold text-cyan-400">
                    Next Match on <span className="text-white">{matchAlert.courtName}</span>!
                </p>
                <div className="flex justify-around items-center text-slate-300">
                    <div className="font-medium">
                        <p>{matchAlert.teamA[0]}</p>
                        <p>{matchAlert.teamA[1]}</p>
                    </div>
                    <p className="text-2xl font-bold text-slate-500">VS</p>
                    <div className="font-medium">
                        <p>{matchAlert.teamB[0]}</p>
                        <p>{matchAlert.teamB[1]}</p>
                    </div>
                </div>
                 <button onClick={() => setMatchAlert(null)} className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-md transition-colors mt-4">
                    Got it!
                </button>
            </div>
        )}
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

const PlayerList: React.FC<{ players: Player[], onEdit: (player: Player) => void, onDelete: (id: string) => void }> = ({ players, onEdit, onDelete }) => {
    const sortedPlayers = [...players].sort((a,b) => a.name.localeCompare(b.name));
    if (sortedPlayers.length === 0) {
        return <div className="text-center p-8 text-slate-500">No players found.</div>
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedPlayers.map(player => (
                <div key={player.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center shadow">
                    <span className="font-medium text-slate-300">{player.name} #{player.uniqueId}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(player)} className="text-slate-500 hover:text-cyan-400 transition-colors"><EditIcon /></button>
                        <button onClick={() => onDelete(player.id)} className="text-slate-500 hover:text-red-400 transition-colors"><TrashIcon /></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const CourtList: React.FC<{ courts: Court[], onEdit: (court: Court) => void, onDelete: (id: string) => void }> = ({ courts, onEdit, onDelete }) => {
    const sortedCourts = [...courts].sort((a,b) => a.name.localeCompare(b.name));
    if (sortedCourts.length === 0) {
        return <div className="text-center p-8 text-slate-500">No courts found.</div>
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedCourts.map(court => (
                <div key={court.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center shadow">
                    <span className="font-medium text-slate-300">{court.name}</span>
                    <div className="flex items-center gap-2">
                        <button onClick={() => onEdit(court)} className="text-slate-500 hover:text-cyan-400 transition-colors"><EditIcon /></button>
                        <button onClick={() => onDelete(court.id)} className="text-slate-500 hover:text-red-400 transition-colors"><TrashIcon /></button>
                    </div>
                </div>
            ))}
        </div>
    );
};

const MatchHistory: React.FC<{ matches: Match[], getPlayerDisplayName: (id: string) => string, getCourtName: (id: string) => string, onEdit: (match: Match) => void, onDelete: (id: string) => void }> = ({ matches, getPlayerDisplayName, getCourtName, onEdit, onDelete }) => {
    if (matches.length === 0) {
        return <div className="text-center p-8 text-slate-500">No matches found.</div>
    }
    return (
        <div className="space-y-4">
            {matches.map(match => {
                const hasScore = match.teamAScore !== null && match.teamBScore !== null;
                const teamAWon = hasScore && match.teamAScore! > match.teamBScore!;
                const teamBWon = hasScore && match.teamBScore! > match.teamAScore!;

                return (
                    <div key={match.id} className={`bg-slate-800/50 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-200 ${!hasScore ? 'border-l-4 border-amber-500' : (teamAWon || teamBWon ? 'border-l-4 border-green-500' : '')}`}>
                        <div className="flex-grow w-full">
                            <div className="flex justify-between items-baseline mb-3">
                                <span className="font-bold text-slate-400">{getCourtName(match.courtId)}</span>
                                <div className="flex items-center gap-2">
                                  {!hasScore && (
                                      <span className="text-xs font-semibold bg-amber-500/20 text-amber-400 px-2 py-1 rounded-full">Score Pending</span>
                                  )}
                                  <span className="text-xs text-slate-500">{new Date(match.date).toLocaleDateString()}</span>
                                </div>
                            </div>
                            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                                {/* Team A */}
                                <div className={`flex-1 p-3 rounded-lg w-full transition-colors ${teamAWon ? 'bg-green-900/30' : ''}`}>
                                    <div className="flex justify-between items-center">
                                      <div className={`${teamAWon ? 'font-bold text-green-400' : 'text-slate-300'}`}>
                                          <p>{getPlayerDisplayName(match.teamAPlayers[0])}</p>
                                          <p>{getPlayerDisplayName(match.teamAPlayers[1])}</p>
                                      </div>
                                      {teamAWon && <span className="text-xs font-bold text-green-300 uppercase tracking-wider ml-2">Winner</span>}
                                    </div>
                                </div>

                                {/* Score */}
                                <div className="flex items-center justify-center font-extrabold text-2xl my-2 md:my-0">
                                  {hasScore ? (
                                    <>
                                      <span className={teamAWon ? 'text-green-400' : 'text-slate-400'}>{match.teamAScore}</span>
                                      <span className="mx-2 text-slate-500">-</span>
                                      <span className={teamBWon ? 'text-green-400' : 'text-slate-400'}>{match.teamBScore}</span>
                                    </>
                                  ) : (
                                    <span className="text-slate-500 text-lg font-bold">VS</span>
                                  )}
                                </div>
                                
                                {/* Team B */}
                                <div className={`flex-1 p-3 rounded-lg w-full transition-colors ${teamBWon ? 'bg-green-900/30' : ''}`}>
                                    <div className="flex justify-between items-center">
                                      {teamBWon && <span className="text-xs font-bold text-green-300 uppercase tracking-wider mr-2">Winner</span>}
                                      <div className={`w-full md:text-right ${teamBWon ? 'font-bold text-green-400' : 'text-slate-300'}`}>
                                          <p>{getPlayerDisplayName(match.teamBPlayers[0])}</p>
                                          <p>{getPlayerDisplayName(match.teamBPlayers[1])}</p>
                                      </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 mt-4 sm:mt-0 sm:ml-4 self-end sm:self-center">
                           <button onClick={() => onEdit(match)} className="p-1 rounded-full text-slate-400 hover:text-cyan-400 hover:bg-slate-700 transition-colors" aria-label={`Edit match on ${getCourtName(match.courtId)}`}><EditIcon /></button>
                           <button onClick={() => onDelete(match.id)} className="p-1 rounded-full text-slate-400 hover:text-red-400 hover:bg-slate-700 transition-colors" aria-label={`Delete match on ${getCourtName(match.courtId)}`}><TrashIcon /></button>
                        </div>
                    </div>
                )
            })}
        </div>
    );
};

const QueueList: React.FC<{ queue: QueueItem[], getPlayerDisplayName: (id: string) => string, onRemove: (id: string) => void }> = ({ queue, getPlayerDisplayName, onRemove }) => {
    if (queue.length === 0) {
        return <div className="text-center p-8 text-slate-500">The queue is empty. Add a team to get started!</div>
    }
    return (
        <div className="space-y-3">
            {queue.map((item, index) => (
                <div key={item.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center shadow transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-cyan-400">{index + 1}</span>
                        <div>
                            <p className="font-medium text-slate-300">{getPlayerDisplayName(item.players[0])}</p>
                            <p className="font-medium text-slate-300">{getPlayerDisplayName(item.players[1])}</p>
                        </div>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="text-slate-500 hover:text-red-400 transition-colors" aria-label="Remove team from queue"><TrashIcon /></button>
                </div>
            ))}
        </div>
    );
};


const PlayerSelect: React.FC<{ players: Player[], value: string, onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void, placeholder: string }> = ({ players, value, onChange, placeholder }) => (
    <select value={value} onChange={onChange} className="w-full bg-slate-700 text-white p-2 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required>
        <option value="">{placeholder}</option>
        {players.map(p => <option key={p.id} value={p.id}>{p.name} #{p.uniqueId}</option>)}
    </select>
);