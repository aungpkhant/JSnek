import './assets/css/styles.css';

import { fromEvent, interval, merge } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';

type Key = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'Space';
type Event = 'keydown';

const isDebugMode = window.location.search === '?debug';

const CONSTANTS = {
  ROWS: 30,
  COLS: 30,
  TICK_INTERVAL: 100,
  SQUARE_LENGTH: 10,
} as const;

// TODO type Direction proper in function parameters?
enum Direction {
  Up = 'Up',
  Down = 'Down',
  Left = 'Left',
  Right = 'Right',
}

type Coordinate = [number, number];

type Snake = {
  positions: Coordinate[];
  direction: Direction;
  directionQueue: Direction[];
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

function stringifyPos(x: number | [number, number], y?: number): string {
  if (Array.isArray(x)) {
    const [xPos, yPos] = x;
    return `${xPos}_${yPos}`;
  }

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
      directionQueue: [],
    },
    foodPosition: [1, 1],
    gameOver: false,
  };

  const turnDown = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(event => event.code === 'ArrowDown'),
    filter(event => !event.repeat),
    map(() => new Turn(Direction.Down)),
  );
  const turnUp = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(event => event.code === 'ArrowUp'),
    filter(event => !event.repeat),
    map(() => new Turn(Direction.Up)),
  );
  const turnLeft = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(event => event.code === 'ArrowLeft'),
    filter(event => !event.repeat),
    map(() => new Turn(Direction.Left)),
  );
  const turnRight = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
    filter(event => event.code === 'ArrowRight'),
    filter(event => !event.repeat),
    map(() => new Turn(Direction.Right)),
  );

  const gameTick = interval(CONSTANTS.TICK_INTERVAL).pipe(map(_ => new Tick()));

  const calcNextHeadPos = (currentHead: [number, number], direction: keyof typeof Direction): Coordinate => {
    const [x, y] = currentHead;
    if (direction === 'Up') {
      return [x - 1, y];
    }
    if (direction === 'Down') {
      return [x + 1, y];
    }
    if (direction === 'Left') {
      return [x, y - 1];
    }
    if (direction === 'Right') {
      return [x, y + 1];
    }
    throw new Error('Unhandled direction');
  };

  const moveSnake = (snake: Snake, foodPosition: GameState['foodPosition']): Snake => {
    const foodPosStr = stringifyPos(foodPosition);
    const newSnakePos = [...snake.positions];
    const nextHead = calcNextHeadPos(newSnakePos[newSnakePos.length - 1], snake.direction);

    newSnakePos.push(nextHead);

    // Dont grow if food not in snake
    if (!snake.positions.map(stringifyPos).some(pos => pos === foodPosStr)) {
      newSnakePos.shift();
    }

    return {
      ...snake,
      positions: newSnakePos,
    };
  };

  const tick = (gameState: GameState) => {
    const { snake, foodPosition } = gameState;
    return {
      ...gameState,
      snake: moveSnake(snake, foodPosition),
    };
  };

  const isOpposingDirections = (currentDirection: Direction, newDirection: Direction): boolean => {
    if (currentDirection === Direction.Up) {
      return newDirection === Direction.Down;
    }
    if (currentDirection === Direction.Down) {
      return newDirection === Direction.Up;
    }
    if (currentDirection === Direction.Left) {
      return newDirection === Direction.Right;
    }
    if (currentDirection === Direction.Right) {
      return newDirection === Direction.Left;
    }
    throw new Error('Unhandled direction');
  };

  const onDirectionInput = (gameState: GameState, direction: keyof typeof Direction) => {
    const { snake } = gameState;
    return {
      ...gameState,
      snake: {
        ...snake,
        directionQueue: [...snake.directionQueue, direction],
      },
    };
  };

  const reduceGameState = (gameState: GameState, e: Tick | Turn) => {
    if (e instanceof Tick) {
      return tick(gameState);
    }
    if (e instanceof Turn) {
      return onDirectionInput(gameState, e.direction);
    }
    throw new Error('Unhandled event');
  };

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

    // Debug Direction Queue
    if (isDebugMode) {
      let debugText = document.getElementById('debug__text');
      debugText.innerHTML = snake.directionQueue.join(', ');
    }
  }

  const subscription = merge(gameTick, turnDown, turnUp, turnLeft, turnRight)
    .pipe(scan(reduceGameState, initialState))
    .subscribe(updateView);
}

game();
