import { Header } from "@/ui/containers/Header";
import { Create } from "../actions/Create";
import { Start } from "../actions/Start";
import GameBoard from "../components/GameBoard";
import BackGroundBoard from "../components/BackgroundBoard";
import { AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

import ImageAssets from "@/ui/theme/ImageAssets";
import PalmTree from "../components/PalmTree";
import { useGame } from "@/hooks/useGame";
import { usePlayer } from "@/hooks/usePlayer";
import { useDojo } from "@/dojo/useDojo";
import { useTheme } from "@/ui/elements/theme-provider";
import NextLine from "../components/NextLine";
import { Surrender } from "../actions/Surrender";
import { Content as Leaderboard } from "../modules/Leaderboard";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faKhanda, faStar } from "@fortawesome/free-solid-svg-icons";

export const Home = () => {
  const {
    account: { account },
  } = useDojo();
  const { player } = usePlayer({ playerId: account.address });
  const { game } = useGame({ gameId: player?.game_id || "0x0" });
  const [animationDone, setAnimationDone] = useState(false);

  const testGrid = [
    [0, 0, 0, 0, 0, 0, 0, 0],
    [1, 0, 4, 4, 4, 4, 0, 1],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 3, 3, 3, 0, 0, 0, 0],
    [0, 0, 0, 0, 2, 2, 0, 0],
    [1, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0],
    [0, 4, 4, 4, 4, 0, 0, 1],
    [1, 0, 0, 0, 0, 0, 2, 2],
    [2, 2, 1, 3, 3, 3, 1, 0],
  ];

  const testline = [1, 0, 0, 2, 2, 0, 2, 2];

  const TetrisGrid = () => {
    // Définir les pièces avec leurs positions et tailles
    const pieces = [
      { size: 1, positions: [{ x: 1, y: 1 }] },
      {
        size: 2,
        positions: [
          { x: 3, y: 2 },
          { x: 4, y: 2 },
        ],
      },
      {
        size: 3,
        positions: [
          { x: 5, y: 4 },
          { x: 6, y: 4 },
          { x: 7, y: 4 },
        ],
      },
    ];

    // Fonction pour calculer le bounding box d'une pièce
    const getBoundingBox = (positions) => {
      const xs = positions.map((pos) => pos.x);
      const ys = positions.map((pos) => pos.y);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const minY = Math.min(...ys);
      const maxY = Math.max(...ys);

      return {
        x: minX,
        y: minY,
        width: (maxX - minX + 1) * 40,
        height: (maxY - minY + 1) * 40,
      };
    };

    return (
      <div className="relative w-[320px] h-[400px] bg-gray-800 grid grid-cols-8 grid-rows-10 gap-1">
        {/* Créer les cellules de la grille */}
        {[...Array(80)].map((_, index) => (
          <div
            key={index}
            className="w-full h-full bg-gray-700 border border-gray-600"
          ></div>
        ))}

        {/* Afficher les pièces */}
        {pieces.map((piece, pieceIndex) => {
          const { x, y, width, height } = getBoundingBox(piece.positions);
          return (
            <div
              key={pieceIndex}
              className="absolute bg-blue-500"
              style={{
                top: `${y * 40}px`,
                left: `${x * 40}px`,
                width: `${width}px`,
                height: `${height}px`,
              }}
            >
              {piece.positions.map((pos, cellIndex) => (
                <div
                  key={cellIndex}
                  className="w-8 h-8 bg-blue-500"
                  style={{
                    position: "absolute",
                    top: `${(pos.y - y) * 40}px`,
                    left: `${(pos.x - x) * 40}px`,
                  }}
                ></div>
              ))}
            </div>
          );
        })}
      </div>
    );
  };

  const { theme } = useTheme();
  const imageTotemTheme =
    theme === "dark" ? ImageAssets.imageTotemDark : ImageAssets.imageTotemLight;

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationDone(true);
    }, 4000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative flex flex-col h-screen">
      <Header />

      <BackGroundBoard imageBackground={ImageAssets.imageBackground}>
        <BackGroundBoard
          imageBackground={imageTotemTheme}
          initial={{ scale: 1 }}
          animate={{ scale: [1, 0.995, 1] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatType: "reverse",
            ease: "easeInOut",
          }}
        >
          <div className="relative flex flex-col gap-8 grow items-center justify-start">
            <div className="absolute flex flex-col items-center gap-4 w-full p-4 max-w-4xl">
              <Create />
              <Start />
              {!game && (
                <div className="absolute top translate-y-[100%] bg-slate-900 w-[500px] p-6 rounded-xl">
                  <Leaderboard />
                </div>
              )}
              {!!game && game.over && (
                <div className="flex flex-col gap-4 absolute top translate-y-[325%]">
                  <p className="text-4xl">Game Over</p>
                  <div className="flex gap-4 justify-center items-center">
                    <div className="grow text-4xl flex gap-2 justify-end">
                      {game.score}
                      <FontAwesomeIcon
                        icon={faStar}
                        className="text-yellow-500 ml-2"
                      />
                    </div>
                    <div className="grow text-4xl flex gap-2 justify-end">
                      {game.combo}
                      <FontAwesomeIcon
                        icon={faKhanda}
                        className="text-slate-500 ml-2"
                      />
                    </div>
                  </div>
                </div>
              )}
              {!!game && !game.over && (
                <div className="relative w-full">
                  <div className="flex flex-col items-center">
                    <GameBoard
                      initialGrid={game.blocks}
                      nextLine={game.next_row}
                      score={game.score}
                      combo={game.combo}
                    />
                    <NextLine numbers={game.next_row} />
                  </div>
                  <div className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:bottom-0 sm:mb-4 flex justify-center sm:justify-end w-full">
                    <Surrender />
                  </div>
                </div>
              )}
            </div>
          </div>
          <AnimatePresence>
            {!animationDone && (
              <>
                <>
                  <PalmTree
                    image={ImageAssets.palmRight}
                    initial="visibleRight"
                    animate="hiddenRight"
                    duration={3}
                    position="right"
                  />
                  <PalmTree
                    image={ImageAssets.palmLeft}
                    initial="visibleLeft"
                    animate="hiddenLeft"
                    duration={3}
                    position="left"
                  />
                </>
              </>
            )}
          </AnimatePresence>
        </BackGroundBoard>
      </BackGroundBoard>
    </div>
  );
};
