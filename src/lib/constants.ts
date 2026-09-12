export const EMOTIONAL_STATES = [
  { value: 'confident', label: 'Confident', emoji: '😎' },
  { value: 'calm', label: 'Calm', emoji: '😌' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'fomo', label: 'FOMO', emoji: '🤤' },
  { value: 'revenge', label: 'Revenge', emoji: '🤬' },
  { value: 'tilted', label: 'Tilted', emoji: '💥' },
  { value: 'disciplined', label: 'Disciplined', emoji: '🧘' },
  { value: 'overconfident', label: 'Overconfident', emoji: '🦁' },
  { value: 'fearful', label: 'Fearful', emoji: '😨' },
  { value: 'neutral', label: 'Neutral', emoji: '😐' },
] as const;

export const ASSET_CLASSES = [
  { value: 'FOREX', label: 'Forex' },
  { value: 'STOCKS', label: 'Stocks' },
  { value: 'CRYPTO', label: 'Crypto' },
  { value: 'FUTURES', label: 'Futures' },
  { value: 'OPTIONS', label: 'Options' },
] as const;

export const TRADE_SOURCES = ['MANUAL', 'MT5', 'NINJATRADER'] as const;

export const DEFAULT_USER_ID = 'default-user';

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp'];
