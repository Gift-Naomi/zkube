import React, { useState, useEffect, useRef, useCallback } from "react";
import { Card } from "@/ui/elements/ui/card";

import stone1Image from "/assets/block-1.png";
import stone2Image from "/assets/block-2.png";
import stone3Image from "/assets/block-3.png";
import stone4Image from "/assets/block-4.png";

interface Piece {
  id: number;
  width: number;
  element: string;
}

const PIECES: Piece[] = [
  { id: 1, width: 1, element: "stone1" },
  { id: 2, width: 2, element: "stone2" },
  { id: 3, width: 3, element: "stone3" },
  { id: 4, width: 4, element: "stone4" },
];

interface Cell {
  id: string;
  pieceId: number | null;
  isStart: boolean;
}

const GameBoard = ({ initialGrid }: { initialGrid: number[][] }) => {
  const [grid, setGrid] = useState<Cell[][]>([]);
  const [draggingPiece, setDraggingPiece] = useState<{
    row: number;
    col: number;
    startX: number;
    currentX: number;
  } | null>(null);
  const rows = 10;
  const cols = 8;
  const gridRef = useRef<HTMLDivElement>(null);

  const [isDragging, setIsDragging] = useState(false);

  useEffect(() => {
    initializeGrid(initialGrid);
  }, [initialGrid]);

  const placePiece = (
    grid: Cell[][],
    row: number,
    col: number,
    piece: Piece,
  ) => {
    for (let j = 0; j < piece.width; j++) {
      grid[row][col + j].pieceId = piece.id;
      grid[row][col + j].isStart = j === 0;
    }
  };

  const checkCollision = (row: number, col: number, piece: Piece) => {
    if (col < 0 || col + piece.width > cols) return true;
    for (let i = 0; i < piece.width; i++) {
      if (col + i >= cols) return true;
      if (
        grid[row][col + i].pieceId !== null &&
        grid[row][col + i].pieceId !== piece.id
      ) {
        return true;
      }
    }
    return false;
  };

  const startDragging = (
    rowIndex: number,
    colIndex: number,
    e: React.MouseEvent,
  ) => {
    const piece = PIECES.find((p) => p.id === grid[rowIndex][colIndex].pieceId);
    if (!piece) return;

    // Trouvez le début de la pièce
    let startCol = colIndex;
    while (startCol > 0 && grid[rowIndex][startCol - 1].pieceId === piece.id) {
      startCol--;
    }

    const gridRect = gridRef.current?.getBoundingClientRect();
    const cellWidth = gridRect ? gridRect.width / cols : 0;
    const startX = gridRect ? gridRect.left + startCol * cellWidth : 0;

    // Calculez le décalage entre le point de clic et le début de la pièce
    const clickOffset = e.clientX - startX;

    setDraggingPiece({
      row: rowIndex,
      col: startCol,
      startX: startX,
      currentX: startX,
      clickOffset: clickOffset,
    });
    setIsDragging(true);
  };

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !draggingPiece || !gridRef.current) return;
      const gridRect = gridRef.current.getBoundingClientRect();
      const cellWidth = gridRect.width / cols;
      const piece = PIECES.find(
        (p) => p.id === grid[draggingPiece.row][draggingPiece.col].pieceId,
      );
      if (!piece) return;

      let newX = e.clientX - draggingPiece.clickOffset;
      const totalDrag = newX - draggingPiece.startX;

      // Calculez la nouvelle colonne, mais ne l'arrondissez pas
      let newCol = draggingPiece.col + totalDrag / cellWidth;

      // Vérifiez les limites
      const minCol = 0;
      const maxCol = cols - piece.width;

      if (newCol < minCol) newCol = minCol;
      if (newCol > maxCol) newCol = maxCol;

      // Vérifiez les collisions
      const leftCol = Math.floor(newCol);
      const rightCol = Math.ceil(newCol);

      if (
        !checkCollision(draggingPiece.row, leftCol, piece) &&
        !checkCollision(draggingPiece.row, rightCol, piece)
      ) {
        // Si pas de collision, mettez à jour la position
        newX = draggingPiece.startX + (newCol - draggingPiece.col) * cellWidth;
        setDraggingPiece({ ...draggingPiece, currentX: newX });
      } else {
        // En cas de collision, trouvez la position valide la plus proche
        let validCol = draggingPiece.col;
        const direction = newCol > draggingPiece.col ? 1 : -1;
        while (
          validCol !== newCol &&
          !checkCollision(draggingPiece.row, validCol, piece)
        ) {
          validCol += direction;
        }
        validCol -= direction; // Reculez d'une case pour obtenir la dernière position valide

        newX =
          draggingPiece.startX + (validCol - draggingPiece.col) * cellWidth;
        setDraggingPiece({ ...draggingPiece, currentX: newX });
      }
    },
    [isDragging, draggingPiece, grid, cols],
  );

  const handleMouseUp = useCallback(() => {
    if (!isDragging || !draggingPiece || !gridRef.current) return;

    const gridRect = gridRef.current.getBoundingClientRect();
    const cellWidth = gridRect.width / cols;
    const totalDrag = draggingPiece.currentX - draggingPiece.startX;
    const draggedCells = Math.round(totalDrag / cellWidth);

    const newCol = Math.max(
      0,
      Math.min(cols - 1, draggingPiece.col + draggedCells),
    );

    const newGrid = [...grid];

    console.log(draggingPiece.row, draggingPiece.col, newCol);
    console.log(grid[draggingPiece.row][draggingPiece.col]);
    const piece = PIECES.find(
      (p) => p.id === grid[draggingPiece.row][draggingPiece.col].pieceId,
    );
    if (piece && !checkCollision(draggingPiece.row, newCol, piece)) {
      // Effacer l'ancienne position
      for (let i = 0; i < piece.width; i++) {
        const oldCol = draggingPiece.col + i;
        if (oldCol < cols) {
          newGrid[draggingPiece.row][oldCol] = {
            id: `${draggingPiece.row}-${oldCol}`,
            pieceId: null,
            isStart: false,
          };
        }
      }

      // Placer à la nouvelle position
      const finalCol = Math.min(newCol, cols - piece.width);
      placePiece(newGrid, draggingPiece.row, finalCol, piece);
      setGrid(newGrid);
    }

    setDraggingPiece(null);
    setIsDragging(false);
  }, [isDragging, draggingPiece, grid, cols]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }
    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const initializeGrid = (initialGrid: number[][]) => {
    const newGrid: Cell[][] = [];
    for (let i = 0; i < rows; i++) {
      const row: Cell[] = [];
      for (let j = 0; j < cols; j++) {
        const value = initialGrid[i][j];
        row.push({
          id: `${i}-${j}`,
          pieceId: value !== 0 ? value : null,
          isStart: false,
        });
      }
      newGrid.push(row);
    }
    markStartingCells(newGrid);
    setGrid(newGrid);
  };

  const markStartingCells = (grid: Cell[][]) => {
    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const pieceId = grid[i][j].pieceId;
        if (pieceId !== null) {
          let isStart = true;
          for (let k = 1; k < pieceId; k++) {
            if (j + k < cols && grid[i][j + k].pieceId === pieceId) {
              grid[i][j + k].isStart = false;
            } else {
              isStart = false;
              break;
            }
          }
          grid[i][j].isStart = isStart;
        }
      }
    }
  };

  const renderCell = (cell: Cell, rowIndex: number, colIndex: number) => {
    const piece = PIECES.find((p) => p.id === cell.pieceId);

    if (cell.isStart && piece) {
      const isDragging =
        draggingPiece?.row === rowIndex &&
        colIndex >= draggingPiece.col &&
        colIndex < draggingPiece.col + piece.width;

      const dragOffset = isDragging
        ? draggingPiece.currentX - draggingPiece.startX
        : 0;

      return (
        <div
          key={cell.id}
          className={`h-12 bg-secondary flex items-center justify-center cursor-move`}
          style={{
            ...getElementStyle(piece.element),
            gridColumn: `span ${piece.width * 4}`,
            transform: `translateX(${dragOffset}px)`,
            transition: isDragging ? "none" : "transform 0.3s ease-out",
          }}
          onMouseDown={(e) => startDragging(rowIndex, colIndex, e)}
        ></div>
      );
    } else if (!cell.pieceId) {
      return (
        <div
          key={cell.id}
          className="h-12 w-12 bg-secondary"
          style={{ gridColumn: "span 4" }}
        />
      );
    }
    return null;
  };

  return (
    <Card className="p-4 bg-slate-800">
      <div ref={gridRef} className="grid grid-cols-[repeat(32,1fr)] gap-1">
        {grid.map((row, rowIndex) => (
          <React.Fragment key={rowIndex}>
            {row.map((cell, colIndex) => renderCell(cell, rowIndex, colIndex))}
          </React.Fragment>
        ))}
      </div>
    </Card>
  );
};

const getElementStyle = (element: string) => {
  switch (element) {
    case "stone1":
      return {
        backgroundImage: `url(${stone1Image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone2":
      return {
        backgroundImage: `url(${stone2Image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone3":
      return {
        backgroundImage: `url(${stone3Image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    case "stone4":
      return {
        backgroundImage: `url(${stone4Image})`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      };
    default:
      return {};
  }
};

export default GameBoard;
