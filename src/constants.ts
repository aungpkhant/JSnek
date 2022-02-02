export const CONSTANTS = {
  ROWS: 30,
  COLS: 30,
  TICK_INTERVAL: 100,
  SQUARE_LENGTH: 10,
} as const;

export const MAX_SNAKE_LENGTH = CONSTANTS.ROWS * CONSTANTS.COLS - 1;

export enum Direction {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right',
}
