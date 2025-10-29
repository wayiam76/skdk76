

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Player, Court, Match, Ranking, QueueItem, Transaction } from './types';
import Modal from './components/Modal';
import { TrophyIcon, UsersIcon, CourtIcon, ClipboardListIcon, QueueListIcon, PlusIcon, TrashIcon, SearchIcon, EditIcon, AutoAssignIcon, DollarIcon, SettingsIcon } from './components/icons';

// --- INITIAL DATA ---
const INITIAL_PLAYERS: Player[] = [
  { id: 'p1', uniqueId: 1, name: 'Alice', balance: 10 },
  { id: 'p2', uniqueId: 2, name: 'Bob', balance: -5 },
  { id: 'p3', uniqueId: 3, name: 'Charlie', balance: 20 },
  { id: 'p4', uniqueId: 4, name: 'Diana', balance: 0 },
  { id: 'p5', uniqueId: 5, name: 'Ethan', balance: 0 },
  { id: 'p6', uniqueId: 6, name: 'Fiona', balance: 15 },
  { id: 'p7', uniqueId: 7, name: 'George', balance: -2.5 },
  { id: 'p8', uniqueId: 8, name: 'Heidi', balance: 0 },
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
  QUEUE,
  SETTINGS
}

enum PlayerStatus {
  AVAILABLE = 'Available',
  IN_QUEUE = 'In Queue',
  PLAYING = 'Playing',
}

type MatchFormState = {
    courtId: string;
    teamAPlayer1: string;
    teamAPlayer2: string;
    teamBPlayer1: string;
    teamBPlayer2: string;
    teamAScore: string;
    teamBScore: string;
};

// --- Validation Helper ---
const validateMatchForm = (form: MatchFormState): string | null => {
    const { courtId, teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2, teamAScore, teamBScore } = form;

    if (!courtId) {
        return "Please select a court.";
    }

    const allPlayers = [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2];
    if (allPlayers.some(p => !p)) {
        return "Please select all 4 players for the match.";
    }

    if (new Set(allPlayers).size !== 4) {
        return "All four players must be unique.";
    }

    const isTeamAScoreEntered = teamAScore.trim() !== '';
    const isTeamBScoreEntered = teamBScore.trim() !== '';

    if (isTeamAScoreEntered !== isTeamBScoreEntered) {
        return "Please enter scores for both teams or leave both blank.";
    }

    if (isTeamAScoreEntered) {
        const scoreA = Number(teamAScore);
        const scoreB = Number(teamBScore);
        if (isNaN(scoreA) || scoreA < 0 || isNaN(scoreB) || scoreB < 0) {
            return "Scores must be valid, non-negative numbers.";
        }
    }

    return null; // No errors
};


// --- App Component ---
export default function App() {
  const [players, setPlayers] = useState<Player[]>(INITIAL_PLAYERS);
  const [courts, setCourts] = useState<Court[]>(INITIAL_COURTS);
  const [matches, setMatches] = useState<Match[]>(INITIAL_MATCHES);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>(Tab.DASHBOARD);
  const [searchTerm, setSearchTerm] = useState('');

  // --- Admin & Fee Settings ---
  const [joiningFee, setJoiningFee] = useState(10.00);
  const [perGameFee, setPerGameFee] = useState(2.50);

  // Modal States
  const [isPlayerModalOpen, setPlayerModalOpen] = useState(false);
  const [isCourtModalOpen, setCourtModalOpen] = useState(false);
  const [isMatchModalOpen, setMatchModalOpen] = useState(false);
  const [isQueueModalOpen, setQueueModalOpen] = useState(false);
  const [isPaymentModalOpen, setPaymentModalOpen] = useState(false);
  const [matchAlert, setMatchAlert] = useState<{ courtName: string; teamA: [string, string]; teamB: [string, string] } | null>(null);
  const [matchModalError, setMatchModalError] = useState<string | null>(null);
  
  // Editing & Form States
  const [editingPlayer, setEditingPlayer] = useState<Player | null>(null);
  const [editingCourt, setEditingCourt] = useState<Court | null>(null);
  const [editingMatch, setEditingMatch] = useState<Match | null>(null);
  const [payingPlayer, setPayingPlayer] = useState<Player | null>(null);
  
  // Form States
  const [playerName, setPlayerName] = useState('');
  const [playerInitialBalance, setPlayerInitialBalance] = useState('0');
  const [isJoiningFeePaid, setIsJoiningFeePaid] = useState(true);
  const [courtName, setCourtName] = useState('');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [matchForm, setMatchForm] = useState<MatchFormState>({
    courtId: '',
    teamAPlayer1: '',
    teamAPlayer2: '',
    teamBPlayer1: '',
    teamBPlayer2: '',
    teamAScore: '',
    teamBScore: ''
  });
  const [queueForm, setQueueForm] = useState({ player1: '', player2: '' });
  
  // For new players, automatically set balance based on fee status
  useEffect(() => {
    if (!editingPlayer) {
      setPlayerInitialBalance(isJoiningFeePaid ? '0' : String(-joiningFee));
    }
  }, [isJoiningFeePaid, joiningFee, editingPlayer]);


  const getPlayerDisplayName = useCallback((id: string) => {
    const player = players.find(p => p.id === id);
    if (!player) return 'Unknown';
    return `${player.name} #${player.uniqueId}`;
  }, [players]);

  const getCourtName = useCallback((id: string) => courts.find(c => c.id === id)?.name || 'Unknown', [courts]);

  const playerStatuses = useMemo(() => {
    const statuses = new Map<string, PlayerStatus>();
    const playersInGame = new Set<string>();
    matches.filter(m => m.teamAScore === null).forEach(m => {
        m.teamAPlayers.forEach(pId => playersInGame.add(pId));
        m.teamBPlayers.forEach(pId => playersInGame.add(pId));
    });

    const playersInQueue = new Set<string>();
    queue.forEach(item => {
        item.players.forEach(pId => playersInQueue.add(pId));
    });

    players.forEach(p => {
        if (playersInGame.has(p.id)) {
            statuses.set(p.id, PlayerStatus.PLAYING);
        } else if (playersInQueue.has(p.id)) {
            statuses.set(p.id, PlayerStatus.IN_QUEUE);
        } else {
            statuses.set(p.id, PlayerStatus.AVAILABLE);
        }
    });
    return statuses;
  }, [players, matches, queue]);


  const unscoredMatchCourtIds = useMemo(() => 
    new Set(matches.filter(m => m.teamAScore === null).map(m => m.courtId)),
    [matches]);

  const availableCourts = useMemo(() => 
    courts.filter(c => !unscoredMatchCourtIds.has(c.id)),
    [courts, unscoredMatchCourtIds]);


  const handleAutoAssignMatches = useCallback(() => {
    if (availableCourts.length > 0 && queue.length >= 2) {
      const courtsToFill = [...availableCourts];
      const teamsToMatch = [...queue];
      const newMatches: Match[] = [];
      const teamsToRemove: string[] = [];
      
      while(courtsToFill.length > 0 && teamsToMatch.length >= 2) {
        const court = courtsToFill.shift()!;
        const teamA = teamsToMatch.shift()!;
        const teamB = teamsToMatch.shift()!;
        
        const newMatch: Match = {
          id: `m${Date.now()}-${court.id}`,
          courtId: court.id,
          teamAPlayers: teamA.players,
          teamBPlayers: teamB.players,
          teamAScore: null,
          teamBScore: null,
          date: new Date().toISOString()
        };
        newMatches.push(newMatch);
        teamsToRemove.push(teamA.id, teamB.id);
      }

      if(newMatches.length > 0) {
        const firstMatch = newMatches[0];
        setMatchAlert({
            courtName: getCourtName(firstMatch.courtId),
            teamA: [getPlayerDisplayName(firstMatch.teamAPlayers[0]), getPlayerDisplayName(firstMatch.teamAPlayers[1])],
            teamB: [getPlayerDisplayName(firstMatch.teamBPlayers[0]), getPlayerDisplayName(firstMatch.teamBPlayers[1])]
        });

        setMatches(prev => [...newMatches, ...prev]);
        setQueue(prev => prev.filter(item => !teamsToRemove.includes(item.id)));
      }
    }
  }, [availableCourts, queue, getCourtName, getPlayerDisplayName]);

  // --- Modal Opening/Closing Handlers ---

  const openPlayerModal = (player: Player | null = null) => {
    setEditingPlayer(player);
    setPlayerName(player ? player.name : '');
    setPlayerInitialBalance(player ? String(player.balance) : '0');
    if (!player) {
        setIsJoiningFeePaid(true); // Reset for new player form
    }
    setPlayerModalOpen(true);
  };

  const closePlayerModal = () => {
    setPlayerModalOpen(false);
    setEditingPlayer(null);
    setPlayerName('');
    setPlayerInitialBalance('0');
    setIsJoiningFeePaid(true);
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
    setMatchModalError(null);
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
    setMatchModalError(null);
  };
  
  const openQueueModal = () => setQueueModalOpen(true);
  const closeQueueModal = () => {
      setQueueModalOpen(false);
      setQueueForm({ player1: '', player2: '' });
  }
  
  const openPaymentModal = (player: Player) => {
      setPayingPlayer(player);
      setPaymentModalOpen(true);
  };
  
  const closePaymentModal = () => {
      setPayingPlayer(null);
      setPaymentAmount('');
      setPaymentModalOpen(false);
  };

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
      const balance = parseFloat(playerInitialBalance) || 0;
      if (editingPlayer) {
        setPlayers(players.map(p => p.id === editingPlayer.id ? { ...p, name: playerName.trim(), balance } : p));
      } else {
        const nextUniqueId = players.length > 0 ? Math.max(...players.map(p => p.uniqueId)) + 1 : 1;
        const newPlayer: Player = { 
          id: `p${Date.now()}`, 
          uniqueId: nextUniqueId,
          name: playerName.trim(),
          balance
        };
        setPlayers([...players, newPlayer]);
        if (balance !== 0) {
            const newTransaction: Transaction = {
                id: `t${Date.now()}`,
                playerId: newPlayer.id,
                amount: balance,
                description: "Initial balance",
                date: new Date().toISOString()
            };
            setTransactions(prev => [...prev, newTransaction]);
        }
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
  
  const applyMatchFee = (playerIds: string[], fee: number, description: string) => {
      setPlayers(currentPlayers => 
          currentPlayers.map(p => 
              playerIds.includes(p.id) ? { ...p, balance: p.balance + fee } : p
          )
      );
      const newTransactions = playerIds.map(pId => ({
          id: `t${Date.now()}-${pId}`,
          playerId: pId,
          amount: fee,
          description,
          date: new Date().toISOString(),
      }));
      setTransactions(prev => [...prev, ...newTransactions]);
  };


  const handleSaveMatch = (e: React.FormEvent) => {
    e.preventDefault();

    const errorMessage = validateMatchForm(matchForm);
    if (errorMessage) {
      setMatchModalError(errorMessage);
      return;
    }
    
    setMatchModalError(null);

    const { courtId, teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2, teamAScore, teamBScore } = matchForm;
    
    const playersInMatch = [teamAPlayer1, teamAPlayer2, teamBPlayer1, teamBPlayer2];
    setQueue(prevQueue => prevQueue.filter(item => !item.players.some(p => playersInMatch.includes(p))));

    const finalTeamAScore = teamAScore.trim() !== '' ? Number(teamAScore) : null;
    const finalTeamBScore = teamBScore.trim() !== '' ? Number(teamBScore) : null;
    
    const wasScored = editingMatch && editingMatch.teamAScore !== null;
    const isNowScored = finalTeamAScore !== null;

    if (!wasScored && isNowScored) {
        applyMatchFee(playersInMatch, -perGameFee, `Match fee on ${getCourtName(courtId)}`);
    } else if (wasScored && !isNowScored) {
        applyMatchFee(playersInMatch, perGameFee, `Refund for match on ${getCourtName(courtId)}`);
    }

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
          const matchToDelete = matches.find(m => m.id === id);
          if (matchToDelete && matchToDelete.teamAScore !== null) {
              const playersInMatch = [...matchToDelete.teamAPlayers, ...matchToDelete.teamBPlayers];
              applyMatchFee(playersInMatch, perGameFee, `Refund for deleted match on ${getCourtName(matchToDelete.courtId)}`);
          }
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

    if (playerStatuses.get(player1) !== PlayerStatus.AVAILABLE || playerStatuses.get(player2) !== PlayerStatus.AVAILABLE) {
      alert("One or both selected players are not available (already playing or in queue).");
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
  
  const handleAssignFromQueue = () => {
    if (queue.length < 2) return;
    const teamA = queue[0];
    const teamB = queue[1];
    setMatchForm(prev => ({
        ...prev,
        teamAPlayer1: teamA.players[0],
        teamAPlayer2: teamA.players[1],
        teamBPlayer1: teamB.players[0],
        teamBPlayer2: teamB.players[1],
    }));
  };
  
  const handleSavePayment = (e: React.FormEvent) => {
      e.preventDefault();
      const amount = parseFloat(paymentAmount);
      if (payingPlayer && !isNaN(amount) && amount > 0) {
          applyMatchFee([payingPlayer.id], amount, "Manual payment");
          closePaymentModal();
      } else {
          alert("Please enter a valid positive amount.");
      }
  };

  const unavailablePlayerIdsForQueue = useMemo(() => {
    const ids = new Set<string>();
    for (const [playerId, status] of playerStatuses.entries()) {
        if (status === PlayerStatus.PLAYING || status === PlayerStatus.IN_QUEUE) {
            ids.add(playerId);
        }
    }
    return ids;
  }, [playerStatuses]);

  const disabledForQueueP1 = new Set([...unavailablePlayerIdsForQueue, queueForm.player2].filter(Boolean));
  const disabledForQueueP2 = new Set([...unavailablePlayerIdsForQueue, queueForm.player1].filter(Boolean));

  const renderContent = () => {
    switch (activeTab) {
      case Tab.DASHBOARD:
        return (
            <div>
                <FinancialSummary players={players} />
                <RankingTable rankings={filteredRankings} />
            </div>
        );
      case Tab.PLAYERS:
        return (
            <div>
                <ActionButton onClick={() => openPlayerModal()}>Add Player</ActionButton>
                <PlayerList players={filteredPlayers} playerStatuses={playerStatuses} onEdit={openPlayerModal} onDelete={handleDeletePlayer} onAddPayment={openPaymentModal}/>
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
                <MatchHistory matches={filteredMatches} getPlayerDisplayName={getPlayerDisplayName} getCourtName={getCourtName} onEdit={openMatchModal} onDelete={handleDeleteMatch} playerStatuses={playerStatuses} />
            </div>
        );
      case Tab.QUEUE: {
        const isAutoAssignDisabled = availableCourts.length === 0 || queue.length < 2;
        return (
            <div>
                <div className="flex flex-wrap items-start gap-4 mb-4">
                    <ActionButton onClick={openQueueModal}>Add Team to Queue</ActionButton>
                    
                    <div className="relative group"> {/* Tooltip container */}
                        <button
                            onClick={handleAutoAssignMatches}
                            disabled={isAutoAssignDisabled}
                            className="inline-flex items-center justify-center bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg disabled:bg-slate-600 disabled:cursor-not-allowed"
                            aria-label="Auto-assign next match"
                        >
                            <AutoAssignIcon />
                            <span className="ml-2">Auto-Assign Next Match</span>
                        </button>
                        {isAutoAssignDisabled && (
                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                                Needs at least 2 teams in queue and 1 available court.
                            </div>
                        )}
                    </div>
                </div>
                <QueueList queue={filteredQueue} getPlayerDisplayName={getPlayerDisplayName} onRemove={handleRemoveFromQueue} playerStatuses={playerStatuses} />
            </div>
        );
      }
      case Tab.SETTINGS:
        return (
            <SettingsPanel
                joiningFee={joiningFee}
                setJoiningFee={setJoiningFee}
                perGameFee={perGameFee}
                setPerGameFee={setPerGameFee}
            />
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
          <TabButton
            label="Settings"
            icon={<SettingsIcon />}
            isActive={activeTab === Tab.SETTINGS}
            onClick={() => setActiveTab(Tab.SETTINGS)}
          />
        </nav>

        <main className="bg-slate-800/50 p-4 sm:p-6 rounded-xl shadow-lg ring-1 ring-white/10">
            {renderContent()}
        </main>
      </div>
      
      {/* --- Modals --- */}
      <Modal isOpen={isPlayerModalOpen} onClose={closePlayerModal} title={editingPlayer ? "Edit Player" : "Add New Player"}>
          <form onSubmit={handleSavePlayer} className="space-y-4">
              <div>
                  <label htmlFor="playerName" className="block text-sm font-medium text-slate-400 mb-1">Player Name</label>
                  <input id="playerName" type="text" value={playerName} onChange={(e) => setPlayerName(e.target.value)} placeholder="Player Name" className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" required />
              </div>
              
              {!editingPlayer && (
                  <div className="flex items-center">
                      <input
                          id="feePaid"
                          type="checkbox"
                          checked={isJoiningFeePaid}
                          onChange={(e) => setIsJoiningFeePaid(e.target.checked)}
                          className="h-4 w-4 rounded border-slate-600 bg-slate-700 text-cyan-600 focus:ring-cyan-500"
                      />
                      <label htmlFor="feePaid" className="ml-2 block text-sm text-slate-300">
                          Joining Fee Paid
                      </label>
                  </div>
              )}

              <div>
                  <label htmlFor="initialBalance" className="block text-sm font-medium text-slate-400 mb-1">{editingPlayer ? 'Balance ($)' : 'Initial Balance ($)'}</label>
                  <input 
                    id="initialBalance" 
                    type="number" 
                    step="0.01" 
                    value={playerInitialBalance} 
                    onChange={(e) => setPlayerInitialBalance(e.target.value)} 
                    placeholder="0.00" 
                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-slate-800 disabled:cursor-not-allowed"
                    disabled={!editingPlayer}
                  />
                  {!editingPlayer ? (
                      <p className="text-xs text-slate-500 mt-1">Balance is determined by the "Joining Fee Paid" status and the Joining Fee set in Settings.</p>
                  ) : (
                      <p className="text-xs text-slate-500 mt-1">Adjust the player's current balance.</p>
                  )}
              </div>
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
              {matchModalError && (
                  <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded-lg text-sm">
                      {matchModalError}
                  </div>
              )}
              <div className="relative group">
                <button 
                    type="button" 
                    onClick={handleAssignFromQueue}
                    disabled={queue.length < 2}
                    className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-md transition-colors mb-4 disabled:bg-slate-600 disabled:cursor-not-allowed"
                >
                    <AutoAssignIcon />
                    Assign from Queue
                </button>
                {queue.length < 2 && (
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-1 bg-slate-900 text-white text-xs rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                        At least two teams are needed in the queue.
                    </div>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Team A */}
                  <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                      <h3 className="font-bold text-sky-400">Team A</h3>
                      <PlayerSelect players={players} playerStatuses={playerStatuses} value={matchForm.teamAPlayer1} onChange={(e) => setMatchForm({...matchForm, teamAPlayer1: e.target.value})} placeholder="Player 1" />
                      <PlayerSelect players={players} playerStatuses={playerStatuses} value={matchForm.teamAPlayer2} onChange={(e) => setMatchForm({...matchForm, teamAPlayer2: e.target.value})} placeholder="Player 2" />
                      <ScoreStepper
                          value={matchForm.teamAScore}
                          onChange={(newScore) => setMatchForm({...matchForm, teamAScore: newScore})}
                          teamColor="sky"
                      />
                  </div>
                  {/* Team B */}
                  <div className="space-y-2 p-3 bg-slate-700/50 rounded-lg">
                      <h3 className="font-bold text-red-400">Team B</h3>
                      <PlayerSelect players={players} playerStatuses={playerStatuses} value={matchForm.teamBPlayer1} onChange={(e) => setMatchForm({...matchForm, teamBPlayer1: e.target.value})} placeholder="Player 1" />
                      <PlayerSelect players={players} playerStatuses={playerStatuses} value={matchForm.teamBPlayer2} onChange={(e) => setMatchForm({...matchForm, teamBPlayer2: e.target.value})} placeholder="Player 2" />
                      <ScoreStepper
                          value={matchForm.teamBScore}
                          onChange={(newScore) => setMatchForm({...matchForm, teamBScore: newScore})}
                          teamColor="red"
                      />
                  </div>
              </div>
              <select value={matchForm.courtId} onChange={(e) => setMatchForm({...matchForm, courtId: e.target.value})} className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none">
                  <option value="">Select Court</option>
                  {courts.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">{editingMatch ? "Save Changes" : "Record Match"}</button>
          </form>
      </Modal>

      <Modal isOpen={isQueueModalOpen} onClose={closeQueueModal} title="Add Team to Queue">
        <form onSubmit={handleAddToQueue} className="space-y-4">
            <PlayerSelect players={players} playerStatuses={playerStatuses} disabledPlayerIds={disabledForQueueP1} value={queueForm.player1} onChange={(e) => setQueueForm({...queueForm, player1: e.target.value})} placeholder="Select Player 1" />
            <PlayerSelect players={players} playerStatuses={playerStatuses} disabledPlayerIds={disabledForQueueP2} value={queueForm.player2} onChange={(e) => setQueueForm({...queueForm, player2: e.target.value})} placeholder="Select Player 2" />
            <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">Add to Queue</button>
        </form>
      </Modal>

      <Modal isOpen={isPaymentModalOpen} onClose={closePaymentModal} title={`Add Payment for ${payingPlayer?.name}`}>
          <form onSubmit={handleSavePayment} className="space-y-4">
               <div>
                  <label htmlFor="paymentAmount" className="block text-sm font-medium text-slate-400 mb-1">Payment Amount ($)</label>
                  <input 
                    id="paymentAmount" 
                    type="number" 
                    step="0.01" 
                    min="0.01"
                    value={paymentAmount} 
                    onChange={(e) => setPaymentAmount(e.target.value)} 
                    placeholder="20.00" 
                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none" 
                    required 
                    autoFocus
                  />
              </div>
              <button type="submit" className="w-full bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-3 px-4 rounded-md transition-colors">Record Payment</button>
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
const SettingsPanel: React.FC<{
    joiningFee: number;
    setJoiningFee: (fee: number) => void;
    perGameFee: number;
    setPerGameFee: (fee: number) => void;
}> = ({ joiningFee, setJoiningFee, perGameFee, setPerGameFee }) => (
    <div>
        <h2 className="text-2xl font-bold text-cyan-400 mb-6">Fee Settings</h2>
        <div className="max-w-md space-y-6">
            <div>
                <label htmlFor="joiningFee" className="block text-sm font-medium text-slate-400 mb-1">Joining Fee ($)</label>
                <input
                    id="joiningFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={joiningFee}
                    onChange={(e) => setJoiningFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none"
                />
                <p className="text-xs text-slate-500 mt-1">Fee for new players. Set to 0 to disable.</p>
            </div>
            <div>
                <label htmlFor="perGameFee" className="block text-sm font-medium text-slate-400 mb-1">Per-Game Fee (per player) ($)</label>
                <input
                    id="perGameFee"
                    type="number"
                    step="0.01"
                    min="0"
                    value={perGameFee}
                    onChange={(e) => setPerGameFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-slate-700 text-white p-3 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none"
                />
                 <p className="text-xs text-slate-500 mt-1">Amount deducted from each player's balance after a scored match.</p>
            </div>
        </div>
    </div>
);

const FinancialSummary: React.FC<{ players: Player[] }> = ({ players }) => {
  const { totalCredit, totalOwed } = useMemo(() => {
    return players.reduce(
      (acc, player) => {
        if (player.balance > 0) {
          acc.totalCredit += player.balance;
        } else if (player.balance < 0) {
          acc.totalOwed += Math.abs(player.balance);
        }
        return acc;
      },
      { totalCredit: 0, totalOwed: 0 }
    );
  }, [players]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      <div className="bg-slate-700/50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-slate-400">Total Player Credit</h3>
        <p className="text-2xl font-bold text-green-400">${totalCredit.toFixed(2)}</p>
      </div>
      <div className="bg-slate-700/50 p-4 rounded-lg">
        <h3 className="text-sm font-medium text-slate-400">Total Owed by Players</h3>
        <p className="text-2xl font-bold text-red-400">${totalOwed.toFixed(2)}</p>
      </div>
    </div>
  );
};


const PlayerStatusIndicator: React.FC<{ status: PlayerStatus }> = ({ status }) => {
  const baseClasses = "w-2.5 h-2.5 rounded-full inline-block flex-shrink-0";
  const statusConfig = {
    [PlayerStatus.AVAILABLE]: { classes: "bg-green-500", title: "Available" },
    [PlayerStatus.IN_QUEUE]: { classes: "bg-sky-500", title: "In Queue" },
    [PlayerStatus.PLAYING]: { classes: "bg-amber-500 animate-pulse", title: "Playing" },
  };
  const config = statusConfig[status];

  return <span title={config.title} className={`${baseClasses} ${config.classes}`} />;
};


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
    <button onClick={onClick} className="inline-flex items-center justify-center bg-cyan-600 hover:bg-cyan-700 text-white font-bold py-2 px-4 rounded-lg transition-colors shadow-lg">
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

const PlayerList: React.FC<{ players: Player[], playerStatuses: Map<string, PlayerStatus>, onEdit: (player: Player) => void, onDelete: (id: string) => void, onAddPayment: (player: Player) => void }> = ({ players, playerStatuses, onEdit, onDelete, onAddPayment }) => {
    const sortedPlayers = [...players].sort((a,b) => a.name.localeCompare(b.name));
    if (sortedPlayers.length === 0) {
        return <div className="text-center p-8 text-slate-500">No players found.</div>
    }
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {sortedPlayers.map(player => {
                const balanceColor = player.balance > 0 ? 'text-green-400' : player.balance < 0 ? 'text-red-400' : 'text-slate-400';
                return (
                    <div key={player.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center shadow">
                        <div>
                            <div className="flex items-center gap-2">
                                <PlayerStatusIndicator status={playerStatuses.get(player.id) || PlayerStatus.AVAILABLE} />
                                <span className="font-medium text-slate-300">{player.name} #{player.uniqueId}</span>
                            </div>
                            <div className={`text-sm font-mono mt-1 ${balanceColor}`}>
                                Balance: ${player.balance.toFixed(2)}
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button onClick={() => onAddPayment(player)} className="text-slate-500 hover:text-green-400 transition-colors" title="Add Payment"><DollarIcon /></button>
                            <button onClick={() => onEdit(player)} className="text-slate-500 hover:text-cyan-400 transition-colors" title="Edit Player"><EditIcon /></button>
                            <button onClick={() => onDelete(player.id)} className="text-slate-500 hover:text-red-400 transition-colors" title="Delete Player"><TrashIcon /></button>
                        </div>
                    </div>
                )
            })}
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

const MatchHistory: React.FC<{ matches: Match[], getPlayerDisplayName: (id: string) => string, getCourtName: (id: string) => string, onEdit: (match: Match) => void, onDelete: (id: string) => void, playerStatuses: Map<string, PlayerStatus> }> = ({ matches, getPlayerDisplayName, getCourtName, onEdit, onDelete, playerStatuses }) => {
    if (matches.length === 0) {
        return <div className="text-center p-8 text-slate-500">No matches found.</div>
    }
    const PlayerNameWithStatus: React.FC<{playerId: string}> = ({playerId}) => {
        const status = playerStatuses.get(playerId) || PlayerStatus.AVAILABLE;
        const isPlaying = status === PlayerStatus.PLAYING;
        return (
            <div className={`inline-flex items-center gap-2 transition-all rounded px-1 my-0.5 ${isPlaying ? 'bg-amber-500/10 ring-1 ring-amber-500/30' : ''}`}>
                <PlayerStatusIndicator status={status} />
                <span>{getPlayerDisplayName(playerId)}</span>
            </div>
        );
    };

    return (
        <div className="space-y-4">
            {matches.map(match => {
                const hasScore = match.teamAScore !== null && match.teamBScore !== null;
                const teamAWon = hasScore && match.teamAScore! > match.teamBScore!;
                const teamBWon = hasScore && match.teamBScore! > match.teamAScore!;

                return (
                    <div key={match.id} className={`bg-slate-800/50 p-4 rounded-lg shadow-md flex flex-col sm:flex-row justify-between items-start sm:items-center transition-all duration-200 border-l-4 ${!hasScore ? 'border-amber-500' : (teamAWon || teamBWon) ? 'border-green-500' : 'border-slate-600'}`}>
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
                                <div className={`flex-1 p-3 rounded-lg w-full transition-colors flex justify-between items-center ${teamAWon ? 'bg-green-500/20' : ''}`}>
                                    <div className={`${teamAWon ? 'font-bold text-green-400' : 'text-slate-300'}`}>
                                        <PlayerNameWithStatus playerId={match.teamAPlayers[0]} />
                                        <br/>
                                        <PlayerNameWithStatus playerId={match.teamAPlayers[1]} />
                                    </div>
                                    {teamAWon && <span className="bg-green-500 text-white font-bold text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">WINNER</span>}
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
                                <div className={`flex-1 p-3 rounded-lg w-full transition-colors flex justify-between items-center ${teamBWon ? 'bg-green-500/20' : ''}`}>
                                    {teamBWon && <span className="bg-green-500 text-white font-bold text-[10px] px-2 py-1 rounded-full uppercase tracking-wider">WINNER</span>}
                                    <div className={`text-right w-full ${teamBWon ? 'font-bold text-green-400' : 'text-slate-300'}`}>
                                       <PlayerNameWithStatus playerId={match.teamBPlayers[0]} />
                                       <br/>
                                       <PlayerNameWithStatus playerId={match.teamBPlayers[1]} />
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

const QueueList: React.FC<{ queue: QueueItem[], getPlayerDisplayName: (id: string) => string, onRemove: (id: string) => void, playerStatuses: Map<string, PlayerStatus> }> = ({ queue, getPlayerDisplayName, onRemove, playerStatuses }) => {
    if (queue.length === 0) {
        return <div className="text-center p-8 text-slate-500">The queue is empty. Add a team to get started!</div>
    }
    const PlayerNameWithStatus: React.FC<{playerId: string}> = ({playerId}) => (
        <div className="flex items-center gap-2">
            <PlayerStatusIndicator status={playerStatuses.get(playerId) || PlayerStatus.AVAILABLE} />
            <span className="font-medium text-slate-300">{getPlayerDisplayName(playerId)}</span>
        </div>
    );
    return (
        <div className="space-y-3">
            {queue.map((item, index) => (
                <div key={item.id} className="bg-slate-700/50 p-4 rounded-lg flex justify-between items-center shadow transition-all duration-300">
                    <div className="flex items-center gap-4">
                        <span className="text-2xl font-bold text-cyan-400">{index + 1}</span>
                        <div>
                           <PlayerNameWithStatus playerId={item.players[0]} />
                           <PlayerNameWithStatus playerId={item.players[1]} />
                        </div>
                    </div>
                    <button onClick={() => onRemove(item.id)} className="text-slate-500 hover:text-red-400 transition-colors" aria-label="Remove team from queue"><TrashIcon /></button>
                </div>
            ))}
        </div>
    );
};

const ScoreStepper: React.FC<{
  value: string;
  onChange: (newValue: string) => void;
  teamColor: 'sky' | 'red';
}> = ({ value, onChange, teamColor }) => {
  const score = value === '' ? null : Number(value);

  const handleIncrement = () => {
    const newScore = score === null ? 1 : Math.min(score + 1, 99);
    onChange(String(newScore));
  };

  const handleDecrement = () => {
    if (score === null || score <= 0) {
      onChange('');
    } else {
      onChange(String(score - 1));
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    if (rawValue === '') {
      onChange('');
      return;
    }
    const numValue = parseInt(rawValue, 10);
    if (!isNaN(numValue) && numValue >= 0 && numValue <= 99) {
      onChange(String(numValue));
    }
  };

  const colorClasses = {
    sky: {
      ring: 'focus-within:ring-sky-500',
      buttonHover: 'hover:bg-sky-500/20',
      buttonActive: 'active:bg-sky-500/30',
      text: 'text-sky-400',
    },
    red: {
      ring: 'focus-within:ring-red-500',
      buttonHover: 'hover:bg-red-500/20',
      buttonActive: 'active:bg-red-500/30',
      text: 'text-red-400',
    },
  };
  const selectedColor = colorClasses[teamColor];

  return (
    <div className={`flex items-center justify-between bg-slate-700 rounded-md ring-2 ring-transparent transition-shadow ${selectedColor.ring}`}>
      <button
        type="button"
        onClick={handleDecrement}
        disabled={score === null || score === 0}
        className={`px-3 py-2 text-2xl font-bold rounded-l-md transition-colors ${selectedColor.buttonHover} ${selectedColor.buttonActive} disabled:text-slate-500 disabled:bg-transparent disabled:cursor-not-allowed`}
        aria-label="Decrement score"
      >
        -
      </button>
      <input
        type="number"
        min="0"
        max="99"
        value={value}
        onChange={handleChange}
        placeholder="Score"
        className="w-full bg-transparent text-white text-center font-bold text-lg p-2 outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
      />
      <button
        type="button"
        onClick={handleIncrement}
        disabled={score !== null && score >= 99}
        className={`px-3 py-2 text-2xl font-bold rounded-r-md transition-colors ${selectedColor.buttonHover} ${selectedColor.buttonActive} disabled:text-slate-500 disabled:bg-transparent disabled:cursor-not-allowed`}
        aria-label="Increment score"
      >
        +
      </button>
    </div>
  );
};

interface PlayerSelectProps {
  players: Player[];
  value: string;
  onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  placeholder: string;
  playerStatuses: Map<string, PlayerStatus>;
  disabledPlayerIds?: Set<string>;
}

const PlayerSelect: React.FC<PlayerSelectProps> = ({ players, value, onChange, placeholder, playerStatuses, disabledPlayerIds = new Set() }) => (
    <select value={value} onChange={onChange} className="w-full bg-slate-700 text-white p-2 rounded-md focus:ring-2 focus:ring-cyan-500 outline-none disabled:bg-slate-800 disabled:text-slate-500">
        <option value="">{placeholder}</option>
        {players.sort((a, b) => a.name.localeCompare(b.name)).map(p => {
            const status = playerStatuses.get(p.id) || PlayerStatus.AVAILABLE;
            const isDisabled = disabledPlayerIds.has(p.id);
            let statusText = '';
            if (status === PlayerStatus.PLAYING) statusText = ' (Playing)';
            if (status === PlayerStatus.IN_QUEUE) statusText = ' (In Queue)';

            return (
                <option key={p.id} value={p.id} disabled={isDisabled}>
                    {p.name} #{p.uniqueId}{statusText}
                </option>
            );
        })}
    </select>
);