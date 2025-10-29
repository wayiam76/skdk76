export interface Player {
  id: string;
  uniqueId: number;
  name: string;
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
  teamAScore: number;
  teamBScore: number;
  date: string;
}

export interface Ranking {
  playerId: string;
  playerName: string;
  matchesPlayed: number;
  wins: number;
  winPercentage: number;
}
