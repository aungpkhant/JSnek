import './assets/css/styles.css';

import { fromEvent, interval, merge } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';

type Key = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'Space';
type Event = 'keydown';

const CONSTANTS = {
  ROWS: 30,
  COLS: 30,
  TICK_INTERVAL: 100,
  SQUARE_LENGTH: 10,
} as const;

enum Direction {
  Up = 'UP',
  Down = 'DOWN',
  Left = 'LEFT',
  Right = 'RIGHT',
}

type Coordinate = [number, number];

type Snake = {
  positions: Coordinate[];
  direction: Direction;
};

// Two types of game state transitions
class Tick {
  constructor() {}
}
class Turn {
  constructor(public readonly direction: keyof typeof Direction) {}
}

type GameState = Readonly<{
  // TODO type
  squares: Map<string, HTMLDivElement>;
  snake: Snake;
  foodPosition: Coordinate;
  gameOver: boolean;
}>;

function stringifyPos(x: number, y: number) {
  return `${x}_${y}`;
}

// ! Impure function
function initialiseBoard() {
  let squareMap = new Map();
  let canvas = document.getElementById('canvas');
  for (let i = 0; i < CONSTANTS.ROWS; i++) {
    for (let j = 0; j < CONSTANTS.COLS; j++) {
      let square = document.createElement('div');
      square.style.position = 'absolute';
      square.style.border = '1px solid gray';
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

function game() {
  const initialState: GameState = {
    squares: initialiseBoard(),
    snake: {
      positions: [[2, 2]],
      direction: Direction.Right,
    },
    foodPosition: [1, 1],
    gameOver: false,
  };

  const gameTick = interval(CONSTANTS.TICK_INTERVAL).pipe(map(_ => new Tick()));

  const nextSnake = (snake: Snake, foodPosition: GameState['foodPosition']) => {
    // Snake ate food
    if () {
      
    }

  }

  const tick = (gameState: GameState) => {
    return {
      ...gameState,

    }
  }

  const reduceGameState = (gameState:GameState, e: Tick | Turn) => {
    if (e instanceof Tick){
      return 
    }
    if (e instanceof Turn) {
      return
    }
    throw new Error("Unhandled event")
  }

  function updateView(gameState: GameState) {
    const { squares, snake, foodPosition } = gameState;

    // Reset cells to orginal color
    squares.forEach((square, pos) => {
      square.style.background = 'var(--cell-empty)';
    });

    // Color snake cells
    snake.positions.forEach(([x, y]) => {
      let square = squares.get(stringifyPos(x, y));
      square.style.background = 'var(--cell-snake)';
    });

    // Color food cells
    const [foodX, foodY] = foodPosition;
    let foodSquare = squares.get(stringifyPos(foodX, foodY));
    foodSquare.style.background = 'var(--cell-food)';
  }

  const subscription = merge(
    gameTick
  ).pipe(scan(reduceGameState, initialState))

}

game();
