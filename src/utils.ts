import { CONSTANTS } from './constants';
import { Coordinate } from './types';

export function stringifyPos(x: number | [number, number], y?: number): string {
  if (Array.isArray(x)) {
    const [xPos, yPos] = x;
    return `${xPos}_${yPos}`;
  }

  return `${x}_${y}`;
}

// ! Impure function
export function initialiseSquares() {
  let squareMap = new Map<string, HTMLDivElement>();
  let canvas = document.getElementById('canvas');
  for (let i = 0; i < CONSTANTS.ROWS; i++) {
    for (let j = 0; j < CONSTANTS.COLS; j++) {
      let square = document.createElement('div');
      square.style.position = 'absolute';
      square.style.width = `${CONSTANTS.SQUARE_LENGTH}px`;
      square.style.height = `${CONSTANTS.SQUARE_LENGTH}px`;
      square.style.left = `${j * CONSTANTS.SQUARE_LENGTH}px`;
      square.style.top = `${i * CONSTANTS.SQUARE_LENGTH}px`;
      squareMap.set(stringifyPos(i, j), square);
      canvas.append(square);
    }
  }
  return squareMap;
}

export function initialiseBoard() {
  let board = [];
  for (let i = 0; i < CONSTANTS.ROWS; i++) {
    for (let j = 0; j < CONSTANTS.COLS; j++) {
      board.push([i, j] as Coordinate);
    }
  }
  return board;
}
