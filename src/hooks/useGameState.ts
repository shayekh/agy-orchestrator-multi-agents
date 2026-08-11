import { useReducer, useEffect, useRef, useCallback } from 'react';
import { gameStateReducer, createInitialState } from '../state/gameStateMachine';
import { GameSettings } from '../types/game';
import { getBestMove } from '../logic/minimax';
import { soundEngine } from '../audio/soundEngine';
import { triggerConfetti } from '../effects/confetti';
import {
  loadSettings,
  saveSettings,
  loadStats,
  saveStats,
  clearStats,
} from '../storage/persistence';

export function useGameState() {
  // Load saved state from LocalStorage
  const [state, dispatch] = useReducer(gameStateReducer, undefined, () => {
    const savedSettings = loadSettings();
    const savedStats = loadStats();
    return createInitialState(savedSettings, savedStats);
  });

  const isAiThinkingRef = useRef(false);

  // Sync data-theme attribute to html element & sync state to LocalStorage
  useEffect(() => {
    if (state.settings.theme) {
      document.documentElement.setAttribute('data-theme', state.settings.theme);
    }
    saveSettings(state.settings);
    saveStats({
      playerX: state.playerX.stats,
      playerO: state.playerO.stats,
      history: state.matchHistory,
    });
  }, [state.settings, state.playerX.stats, state.playerO.stats, state.matchHistory]);

  // Sync soundEngine settings when settings change
  useEffect(() => {
    soundEngine.setVolume(state.settings.audio.masterVolume);
    soundEngine.setMuted(!state.settings.audio.sfxEnabled);
  }, [state.settings.audio.masterVolume, state.settings.audio.sfxEnabled]);

  // Effect for triggering audio & fireworks on game win / draw
  const prevStatusRef = useRef(state.status);
  useEffect(() => {
    if (prevStatusRef.current !== state.status) {
      if (state.status === 'VICTORY') {
        soundEngine.playWin();
        triggerConfetti();
      } else if (state.status === 'DRAW') {
        soundEngine.playDraw();
      }
      prevStatusRef.current = state.status;
    }
  }, [state.status]);

  // Turn timer tick effect
  useEffect(() => {
    if (state.status !== 'PLAYING' || state.settings.timeLimitSecondsPerTurn === 0) return;

    const timer = setInterval(() => {
      dispatch({ type: 'TIME_TICK' });
    }, 1000);

    return () => clearInterval(timer);
  }, [state.status, state.settings.timeLimitSecondsPerTurn, state.currentPlayer]);

  // AI Move Automatic Triggering
  useEffect(() => {
    const isAiTurn =
      state.status === 'PLAYING' &&
      state.currentPlayer === 'O' &&
      state.settings.mode.startsWith('AI_');

    if (isAiTurn && !isAiThinkingRef.current) {
      isAiThinkingRef.current = true;

      const timer = setTimeout(() => {
        const bestMoveIndex = getBestMove(
          state.board,
          'O',
          state.settings.mode,
          state.settings.boardSize,
          state.settings.streakToWin
        );

        if (bestMoveIndex !== -1) {
          soundEngine.playMove('O');
          dispatch({ type: 'MAKE_MOVE', index: bestMoveIndex });
        }
        isAiThinkingRef.current = false;
      }, 350);

      return () => {
        clearTimeout(timer);
        isAiThinkingRef.current = false;
      };
    }
  }, [state.status, state.currentPlayer, state.board, state.settings]);

  // Actions wrapped with audio synthesis feedback
  const makeMove = useCallback(
    (index: number) => {
      if (state.status !== 'PLAYING') return;

      // Prevent user from clicking during AI turn
      const isAiTurn = state.currentPlayer === 'O' && state.settings.mode.startsWith('AI_');
      if (isAiTurn) return;

      if (state.board[index] === null) {
        soundEngine.playMove(state.currentPlayer);
        dispatch({ type: 'MAKE_MOVE', index });
      }
    },
    [state.status, state.currentPlayer, state.board, state.settings.mode]
  );

  const startGame = useCallback(() => {
    soundEngine.playReset();
    dispatch({ type: 'START_GAME' });
  }, []);

  const resetGame = useCallback(() => {
    soundEngine.playReset();
    dispatch({ type: 'RESET_GAME' });
  }, []);

  const undoMove = useCallback(() => {
    soundEngine.playUndo();
    dispatch({ type: 'UNDO_MOVE' });
  }, []);

  const showHint = useCallback(() => {
    soundEngine.playHint();
    dispatch({ type: 'SHOW_HINT' });
  }, []);

  const updateSettings = useCallback((settings: Partial<GameSettings>) => {
    soundEngine.playClick();
    dispatch({ type: 'UPDATE_SETTINGS', settings });
  }, []);

  const resetStats = useCallback(() => {
    soundEngine.playClick();
    clearStats();
    dispatch({ type: 'RESET_STATS' });
  }, []);

  const toggleSound = useCallback(() => {
    const nextSfx = !state.settings.audio.sfxEnabled;
    updateSettings({
      audio: {
        ...state.settings.audio,
        sfxEnabled: nextSfx,
      },
    });
  }, [state.settings.audio, updateSettings]);

  return {
    gameState: state,
    dispatch,
    makeMove,
    startGame,
    resetGame,
    undoMove,
    showHint,
    updateSettings,
    resetStats,
    toggleSound,
  };
}
