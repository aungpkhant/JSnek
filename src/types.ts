import { Direction } from './constants';

export type Coordinate = [number, number];

export type Snake = {
  positions: Coordinate[];
  direction: Direction;
  directionQueue: Direction[];
};
