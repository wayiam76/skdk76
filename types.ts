export interface Player {
  id: string;
  uniqueId: number;
  name: string;
  balance: number;
}

export interface Court {
  id: string;
  name: string;
}

export interface Match {
  id: string;
  courtId: string;
  teamAPlayers: [string, string];
  teamBPlayers: [string, string];
  teamAScore: number | null;
  teamBScore: number | null;
  date: string;
}

export interface Ranking {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  winPercentage: number;
}

export interface QueueItem {
  id: string;
  players: [string, string];
}

export interface Transaction {
  id: string;
  playerId: string;
  amount: number;
  description: string;
  date: string;
}
