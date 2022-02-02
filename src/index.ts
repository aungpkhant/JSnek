import './assets/css/styles.css';

import { Subscription, fromEvent, interval, merge } from 'rxjs';
import { map, filter, scan } from 'rxjs/operators';
import isEqual = require('lodash/isEqual');

import { Coordinate, Snake } from './types';
import { stringifyPos, initialiseSquares, initialiseBoard } from './utils';
import { CONSTANTS, MAX_SNAKE_LENGTH, Direction } from './constants';

type Key = 'ArrowLeft' | 'ArrowRight' | 'ArrowUp' | 'ArrowDown';
type Event = 'keydown';

let subscription: Subscription | undefined = undefined;
const isDebugMode = window.location.search === '?debug';

// Two types of game state transitions
class Tick {
  constructor() {}
}
class Turn {
  constructor(public readonly direction: keyof typeof Direction) {}
}

type GameState = Readonly<{
  board: Coordinate[];
  squares: Map<string, HTMLDivElement>;
  snake: Snake;
  foodPosition: Coordinate;
  gameOver: boolean;
}>;

function keyObservable<TGameEvent>(event: Event, pressedKeyCode: Key, result: () => TGameEvent) {
  return fromEvent<KeyboardEvent>(document, event).pipe(
    filter(event => event.code === pressedKeyCode),
    filter(event => !event.repeat),
    map(result),
  );
}

function game() {
  const initBoard = initialiseBoard();
  const snakeInitPos = [
    [15, 14],
    [15, 15],
    [15, 16],
  ] as Coordinate[];

  // TODO optimize by tracking a list of cells not taken by snake with board instead of computing everytime
  const generateFoodPos = (board: Coordinate[], snakePositions: Coordinate[]) => {
    let boardWithoutSnake = [...board];
    snakePositions.forEach(snakeCell => {
      boardWithoutSnake = boardWithoutSnake.filter(boardCell => !isEqual(boardCell, snakeCell));
    });

    return boardWithoutSnake[Math.floor(Math.random() * boardWithoutSnake.length)];
  };

  const initialState: GameState = {
    board: initBoard,
    squares: initialiseSquares(),
    snake: {
      // Head is to the right
      positions: snakeInitPos,
      direction: Direction.Right,
      directionQueue: [],
    },
    foodPosition: generateFoodPos(initBoard, snakeInitPos),
    gameOver: false,
  };

  const turnDown = keyObservable('keydown', 'ArrowDown', () => new Turn(Direction.Down));
  const turnUp = keyObservable('keydown', 'ArrowUp', () => new Turn(Direction.Up));
  const turnLeft = keyObservable('keydown', 'ArrowLeft', () => new Turn(Direction.Left));
  const turnRight = keyObservable('keydown', 'ArrowRight', () => new Turn(Direction.Right));

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

  const handleCollisions = (gameState: GameState) => {
    const { board, snake, foodPosition } = gameState;

    const [foodPosX, foodPosY] = foodPosition;

    // * Note that we only need to check if head hits some object since by the mechanics
    // * of the snake game, only the head can truly hit another object
    // * We save alot of computation by not checking all the snake cells

    const snakeHead = snake.positions[snake.positions.length - 1];
    const [headPosX, headPosY] = snakeHead;

    // Checks if head hits wall
    const snakeCollideWithWalls = () => {
      return headPosX < 0 || headPosY < 0 || headPosX >= CONSTANTS.ROWS || headPosY >= CONSTANTS.COLS;
    };

    const snakeCollideWithItself = () => {
      // Check if head position is found twice in snake
      return snake.positions
        .slice(0, snake.positions.length - 1)
        .some(([snakeBodyCellX, snakeBodyCellY]) => snakeBodyCellX === headPosX && snakeBodyCellY === headPosY);
    };

    const snakeCollideWithApple = () => {
      return headPosX === foodPosX && headPosY === foodPosY;
    };

    const snakeIsFull = snake.positions.length >= MAX_SNAKE_LENGTH;

    // Checks if head hits itself
    return {
      ...gameState,
      gameOver: snakeCollideWithWalls() || snakeCollideWithItself() || snakeIsFull,
      foodPosition: snakeCollideWithApple()
        ? snakeIsFull
          ? null
          : generateFoodPos(board, snake.positions)
        : foodPosition,
    };
  };

  const moveSnake = (snake: Snake, foodPosition: GameState['foodPosition']): Snake => {
    const foodPosStr = stringifyPos(foodPosition);
    const newSnakePos = [...snake.positions];
    const nextHead = calcNextHeadPos(newSnakePos[newSnakePos.length - 1], snake.direction);

    newSnakePos.push(nextHead);

    // Dont grow if food not in snake
    // ! Can this code be refactored to handleCollisions?
    if (!(stringifyPos(nextHead) === foodPosStr)) {
      newSnakePos.shift();
    }

    let nextDirectionQueue = snake.directionQueue;
    let nextDirection = snake.direction;
    if (snake.directionQueue.length > 0) {
      const [first, ...rest] = snake.directionQueue;
      nextDirection = isOpposingDirections(first, snake.direction) ? snake.direction : first;
      nextDirectionQueue = rest;
    }

    return {
      ...snake,
      positions: newSnakePos,
      direction: nextDirection,
      directionQueue: nextDirectionQueue,
    };
  };

  const tick = (gameState: GameState) => {
    const { snake, foodPosition } = gameState;
    return handleCollisions({
      ...gameState,
      snake: moveSnake(snake, foodPosition),
    });
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

    if (gameState.gameOver) {
      subscription.unsubscribe();

      let GameOverScreen = document.getElementById('game__gameOver');
      GameOverScreen.style.display = 'flex';

      return;
    }

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
    if (foodPosition) {
      const [foodX, foodY] = foodPosition;
      let foodSquare = squares.get(stringifyPos(foodX, foodY));
      foodSquare.style.background = 'var(--cell-food)';
    }

    let gameScoreValue = document.getElementById('game__scoreValue');
    gameScoreValue.innerText = snake.positions.length + '';

    // Debug Direction Queue
    if (isDebugMode) {
      let debugText = document.getElementById('debug__text');
      debugText.innerHTML = snake.directionQueue.join(', ');
    }
  }

  subscription = merge(gameTick, turnDown, turnUp, turnLeft, turnRight)
    .pipe(scan(reduceGameState, initialState))
    .subscribe(updateView);
}

game();
