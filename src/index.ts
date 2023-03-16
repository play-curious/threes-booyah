import * as _ from "underscore";

import * as chip from "booyah/src/chip";
import * as running from "booyah/src/running";
import * as input from "booyah/src/input";

interface Point {
  x: number;
  y: number;
}

const tileSize = { x: 80, y: 100 };
const margin = 20;

class Game extends chip.Composite {
  private _htmlContainer: HTMLElement;
  private _tiles: number[][];

  protected _onActivate(): void {
    this._htmlContainer = document.getElementById("game-parent");

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        const html = `<div class="placeholder" style="left: ${
          i * (tileSize.x + margin)
        }px; top: ${j * (tileSize.y + margin)}px; width: ${
          tileSize.x
        }px; height: ${tileSize.y}px"></div>`;
        this._htmlContainer.insertAdjacentHTML("beforeend", html);
      }
    }

    // Make grid
    this._tiles = makeTiles();
    let tileCount = 0;
    while (tileCount < 9) {
      const i = _.random(3);
      const j = _.random(3);
      if (this._tiles[i][j] === 0) {
        this._tiles[i][j] = makeRandomTile();
        tileCount++;
      }
    }

    this._updateTiles();
  }

  private _updateTiles() {
    // @ts-ignore
    for (const element of this._htmlContainer.querySelectorAll(".tile")) {
      element.remove();
    }

    for (let i = 0; i < 4; i++) {
      for (let j = 0; j < 4; j++) {
        if (this._tiles[i][j] <= 0) continue;

        const html = `<div class="tile" style="left: ${
          j * (tileSize.x + margin)
        }px; top: ${i * (tileSize.y + margin)}px; width: ${
          tileSize.x
        }px; height: ${tileSize.y}px">${this._tiles[i][j]}</div>`;
        this._htmlContainer.insertAdjacentHTML("beforeend", html);
      }
    }
  }

  protected _onTick(): void {
    const keyboard = this.chipContext.keyboard as input.Keyboard;

    if (keyboard.keysJustDown["ArrowLeft"]) {
      const newTiles = [];
      for (let i = 0; i < 4; i++) {
        newTiles[i] = combineLine(this._tiles[i]);
        completeLine(newTiles[i]);
      }

      placeNewTileIfPossible(newTiles, _.random(3), 3);

      this._tiles = newTiles;

      this._updateTiles();
    } else if (keyboard.keysJustDown["ArrowRight"]) {
      const newTiles = [];
      for (let i = 0; i < 4; i++) {
        let row = this._tiles[i];
        row.reverse();
        row = combineLine(row);
        completeLine(row);
        row.reverse();
        newTiles[i] = row;
      }

      placeNewTileIfPossible(newTiles, _.random(3), 0);

      this._tiles = newTiles;

      this._updateTiles();
    } else if (keyboard.keysJustDown["ArrowUp"]) {
      const newTiles: number[][] = makeTiles();
      for (let j = 0; j < 4; j++) {
        let column = getColumn(this._tiles, j);
        column = combineLine(column);
        completeLine(column);
        setColumn(newTiles, j, column);
      }

      placeNewTileIfPossible(newTiles, 3, _.random(3));

      this._tiles = newTiles;

      this._updateTiles();
    } else if (keyboard.keysJustDown["ArrowDown"]) {
      const newTiles: number[][] = makeTiles();
      for (let j = 0; j < 4; j++) {
        let column = getColumn(this._tiles, j);
        column.reverse();
        column = combineLine(column);
        completeLine(column);
        column.reverse();
        setColumn(newTiles, j, column);
      }

      placeNewTileIfPossible(newTiles, 0, _.random(3));

      this._tiles = newTiles;

      this._updateTiles();
    }
  }
}

function makeTiles(): number[][] {
  const tiles: number[][] = [];
  for (let i = 0; i < 4; i++) {
    tiles.push([0, 0, 0, 0]);
  }
  return tiles;
}

function makeRandomTile() {
  const choices = [1, 2, 3];
  return _.shuffle(choices)[0];
}

function getColumn(tiles: number[][], index: number): number[] {
  const column = [];
  for (let i = 0; i < 4; i++) {
    column.push(tiles[i][index]);
  }
  return column;
}

function setColumn(tiles: number[][], index: number, column: number[]): void {
  for (let i = 0; i < 4; i++) {
    tiles[i][index] = column[i];
  }
}

function combineLine(tiles: number[]): number[] {
  if (tiles.length === 0) return [];

  if (tiles[0] === 0) {
    // Shift everything
    return _.rest(tiles);
  } else if (canCombine(tiles[0], tiles[1])) {
    return [tiles[0] + tiles[1], ..._.rest(tiles, 2)];
  } else {
    return [tiles[0], ...combineLine(_.rest(tiles))];
  }
}

function completeLine(tiles: number[]): void {
  while (tiles.length < 4) tiles.push(0);
}

function canCombine(a: number, b: number): boolean {
  if (a === 0 || b === 0) return;
  if ((a === 1 && b === 2) || (a === 2 && b === 1)) return true;
  return a === b;
}

function placeNewTileIfPossible(
  tiles: number[][],
  i: number,
  j: number
): boolean {
  if (tiles[i][j] === 0) {
    tiles[i][j] = makeRandomTile();
    return true;
  } else {
    return false;
  }
}

// Setup keyboard input in the root context
const rootContextChips = {
  keyboard: new input.Keyboard(document.getElementById("game-parent")),
};
const rootChip = new chip.ContextProvider(rootContextChips, new Game());

const runner = new running.Runner({
  rootChip,
});

runner.start();
