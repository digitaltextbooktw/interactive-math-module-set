// Stub — game state not implemented yet
export function useGame() {
  return {
    save: { playerName: '玩家' },
    saveProgress: (_levelId: string, _score: number) => {},
    getProgress: (_levelId: string): number | null => null,
  };
}
