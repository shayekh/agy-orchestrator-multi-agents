import { useState } from 'react';
import { useGameState } from './hooks/useGameState';
import { Header } from './components/Header';
import { Controls } from './components/Controls';
import { GameBoard } from './components/GameBoard';
import { ThemeSelector } from './components/ThemeSelector';
import { StatsModal } from './components/StatsModal';
import { GameOverModal } from './components/GameOverModal';
import { HintBanner } from './components/HintBanner';

export default function App() {
  const {
    gameState,
    dispatch,
    makeMove,
    startGame,
    resetGame,
    undoMove,
    showHint,
    updateSettings,
    resetStats,
    toggleSound,
  } = useGameState();

  const [activeTab, setActiveTab] = useState<'PLAY' | 'SETTINGS' | 'STATS'>('PLAY');

  const { currentPlayer, settings } = gameState;
  const isAiTurn = currentPlayer === 'O' && settings.mode.startsWith('AI_');

  return (
    <div
      data-theme={settings.theme}
      className="min-h-screen text-slate-100 flex flex-col items-center p-4 md:p-8 font-sans selection:bg-neon-pink selection:text-white transition-colors duration-500"
    >
      {/* Dynamic Ambient Background Glows */}
      <div className="fixed top-0 left-1/4 w-[30rem] h-[30rem] bg-neon-cyan/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />
      <div className="fixed bottom-0 right-1/4 w-[30rem] h-[30rem] bg-neon-pink/10 rounded-full blur-3xl pointer-events-none animate-pulse-glow" />

      {/* Main App Container */}
      <div className="w-full max-w-4xl flex flex-col gap-6 z-10">
        {/* Navigation & Header Bar */}
        <Header
          gameState={gameState}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          audioEnabled={settings.audio.sfxEnabled}
          onToggleAudio={toggleSound}
          onOpenThemeSelector={() => setActiveTab('SETTINGS')}
        />

        {/* Tab 1: PLAY ARENA */}
        {activeTab === 'PLAY' && (
          <main className="flex flex-col gap-6">
            {/* Control Panel (Status, Mode, Board Size, Game Controls) */}
            <Controls
              gameState={gameState}
              onStartGame={startGame}
              onPauseGame={() => dispatch({ type: 'PAUSE_GAME' })}
              onResumeGame={() => dispatch({ type: 'RESUME_GAME' })}
              onResetGame={resetGame}
              onUndoMove={undoMove}
              onShowHint={showHint}
              onSelectMode={(mode) => updateSettings({ mode })}
              onSelectBoardSize={(boardSize) => updateSettings({ boardSize })}
              onSelectTimeLimit={(timeLimitSecondsPerTurn) => updateSettings({ timeLimitSecondsPerTurn })}
              onSelectVolume={(masterVolume) => updateSettings({ audio: { ...settings.audio, masterVolume } })}
            />

            {/* Tactical AI Hint Banner */}
            <HintBanner gameState={gameState} />

            {/* Main Interactive Game Board */}
            <div className="flex justify-center items-center w-full">
              <GameBoard gameState={gameState} onCellClick={makeMove} isAITurn={isAiTurn} />
            </div>

            {/* Game Over Victory / Draw Popup Modal */}
            <GameOverModal
              gameState={gameState}
              onPlayAgain={resetGame}
              onOpenSettings={() => setActiveTab('SETTINGS')}
              onOpenStats={() => setActiveTab('STATS')}
            />
          </main>
        )}

        {/* Tab 2: ARENA CONFIGURATIONS & THEME ENGINE */}
        {activeTab === 'SETTINGS' && (
          <div className="flex flex-col gap-6">
            {/* Arena Controls Settings */}
            <Controls
              gameState={gameState}
              onStartGame={startGame}
              onPauseGame={() => dispatch({ type: 'PAUSE_GAME' })}
              onResumeGame={() => dispatch({ type: 'RESUME_GAME' })}
              onResetGame={resetGame}
              onUndoMove={undoMove}
              onSelectMode={(mode) => updateSettings({ mode })}
              onSelectBoardSize={(boardSize) => updateSettings({ boardSize })}
              onSelectTimeLimit={(timeLimitSecondsPerTurn) => updateSettings({ timeLimitSecondsPerTurn })}
              onSelectVolume={(masterVolume) => updateSettings({ audio: { ...settings.audio, masterVolume } })}
            />

            {/* 5-Theme Visual Selector Engine */}
            <div className="glass-panel rounded-2xl p-6 flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <h3 className="text-lg font-bold font-display text-white">Visual Theme Atmosphere</h3>
                <p className="text-xs text-slate-400 font-mono">
                  Select across 5 high-fidelity glassmorphism color schemes
                </p>
              </div>

              <ThemeSelector
                currentTheme={settings.theme}
                onSelectTheme={(theme) => updateSettings({ theme })}
              />
            </div>
          </div>
        )}

        {/* Tab 3: LEADERBOARD & STATISTICS MODAL */}
        <StatsModal
          gameState={gameState}
          isOpen={activeTab === 'STATS'}
          onClose={() => setActiveTab('PLAY')}
          onResetStats={resetStats}
        />
      </div>
    </div>
  );
}
