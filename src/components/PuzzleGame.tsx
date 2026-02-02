'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface PiecePosition {
  id: number;
  currentX: number;
  currentY: number;
  correctX: number;
  correctY: number;
  row: number;
  col: number;
}

interface Confetti {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  rotation: number;
  speedX: number;
  speedY: number;
}

const GRID_SIZE = 3;
const PIECE_SIZE = 100;
const SNAP_THRESHOLD = 25;

export default function PuzzleGame() {
  const [pieces, setPieces] = useState<PiecePosition[]>([]);
  const [selectedPiece, setSelectedPiece] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isComplete, setIsComplete] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [confettis, setConfettis] = useState<Confetti[]>([]);
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showButton, setShowButton] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    document.body.style.position = 'fixed';
    document.body.style.width = '100%';
    document.body.style.height = '100%';
    document.body.style.touchAction = 'none';
    
    return () => {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
      document.body.style.height = '';
      document.body.style.touchAction = '';
    };
  }, []);

  const generateConfettis = useCallback(() => {
    const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF69B4', '#00CED1', '#FF8C00', '#9370DB'];
    const newConfettis: Confetti[] = [];
    
    for (let i = 0; i < 150; i++) {
      newConfettis.push({
        id: i,
        x: Math.random() * 100,
        y: -10 - Math.random() * 100,
        color: colors[Math.floor(Math.random() * colors.length)],
        size: 6 + Math.random() * 12,
        rotation: Math.random() * 360,
        speedX: (Math.random() - 0.5) * 3,
        speedY: 1.5 + Math.random() * 2.5,
      });
    }
    setConfettis(newConfettis);
  }, []);

  // Régénérer les confettis en continu
  useEffect(() => {
    if (!isComplete) return;
    
    const interval = setInterval(() => {
      const colors = ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#FF69B4', '#00CED1'];
      setConfettis((prev) => {
        const newConfettis = [...prev];
        for (let i = 0; i < 5; i++) {
          newConfettis.push({
            id: Date.now() + i,
            x: Math.random() * 100,
            y: -10,
            color: colors[Math.floor(Math.random() * colors.length)],
            size: 6 + Math.random() * 12,
            rotation: Math.random() * 360,
            speedX: (Math.random() - 0.5) * 3,
            speedY: 1.5 + Math.random() * 2.5,
          });
        }
        return newConfettis;
      });
    }, 200);
    
    return () => clearInterval(interval);
  }, [isComplete]);

  useEffect(() => {
    if (confettis.length === 0) return;

    const interval = setInterval(() => {
      setConfettis((prev) =>
        prev
          .map((c) => ({
            ...c,
            x: c.x + c.speedX,
            y: c.y + c.speedY,
            rotation: c.rotation + 5,
          }))
          .filter((c) => c.y < 110)
      );
    }, 50);

    return () => clearInterval(interval);
  }, [confettis.length]);

  useEffect(() => {
    const initializePieces = () => {
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      const centerX = (containerRect.width - PIECE_SIZE * GRID_SIZE) / 2;
      const centerY = (containerRect.height - PIECE_SIZE * GRID_SIZE) / 2;

      const newPieces: PiecePosition[] = [];

      for (let row = 0; row < GRID_SIZE; row++) {
        for (let col = 0; col < GRID_SIZE; col++) {
          const id = row * GRID_SIZE + col;
          const correctX = centerX + col * PIECE_SIZE;
          const correctY = centerY + row * PIECE_SIZE;

          const randomX = Math.random() * (containerRect.width - PIECE_SIZE);
          const randomY = Math.random() * (containerRect.height - PIECE_SIZE);

          newPieces.push({
            id,
            currentX: randomX,
            currentY: randomY,
            correctX,
            correctY,
            row,
            col,
          });
        }
      }

      setPieces(newPieces);
    };

    const img = new Image();
    img.onload = () => {
      setImageLoaded(true);
      initializePieces();
    };
    img.src = '/puzzle-image.jpg';
  }, []);

  useEffect(() => {
    if (pieces.length === 0) return;

    const allCorrect = pieces.every((piece) => {
      const dx = Math.abs(piece.currentX - piece.correctX);
      const dy = Math.abs(piece.currentY - piece.correctY);
      return dx < SNAP_THRESHOLD && dy < SNAP_THRESHOLD;
    });

    if (allCorrect && !isComplete) {
      setIsComplete(true);
      generateConfettis();
      
      // Jouer la musique
      if (audioRef.current) {
        audioRef.current.play().catch(() => {});
      }
      
      // Animations séquentielles
      setTimeout(() => {
        setShowMessage(true);
      }, 1500);
      setTimeout(() => {
        setShowTitle(true);
      }, 2000);
      setTimeout(() => {
        setShowSubtitle(true);
      }, 2800);
      setTimeout(() => {
        setShowButton(true);
      }, 3500);
    }
  }, [pieces, isComplete, generateConfettis]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, pieceId: number) => {
      e.preventDefault();
      const piece = pieces.find((p) => p.id === pieceId);
      if (!piece) return;

      setSelectedPiece(pieceId);
      setIsDragging(true);
      setOffset({
        x: e.clientX - piece.currentX,
        y: e.clientY - piece.currentY,
      });
    },
    [pieces]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!isDragging || selectedPiece === null) return;

      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      let newX = e.clientX - offset.x;
      let newY = e.clientY - offset.y;

      newX = Math.max(0, Math.min(newX, containerRect.width - PIECE_SIZE));
      newY = Math.max(0, Math.min(newY, containerRect.height - PIECE_SIZE));

      setPieces((prev) =>
        prev.map((piece) =>
          piece.id === selectedPiece
            ? { ...piece, currentX: newX, currentY: newY }
            : piece
        )
      );
    },
    [isDragging, selectedPiece, offset]
  );

  const handleMouseUp = useCallback(() => {
    if (selectedPiece === null) return;

    setPieces((prev) =>
      prev.map((piece) => {
        if (piece.id === selectedPiece) {
          const dx = Math.abs(piece.currentX - piece.correctX);
          const dy = Math.abs(piece.currentY - piece.correctY);

          if (dx < SNAP_THRESHOLD && dy < SNAP_THRESHOLD) {
            return {
              ...piece,
              currentX: piece.correctX,
              currentY: piece.correctY,
            };
          }
        }
        return piece;
      })
    );

    setIsDragging(false);
    setSelectedPiece(null);
  }, [selectedPiece]);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, pieceId: number) => {
      e.preventDefault();
      e.stopPropagation();
      
      const touch = e.touches[0];
      const piece = pieces.find((p) => p.id === pieceId);
      if (!piece) return;

      const container = containerRef.current;
      if (!container) return;
      
      const containerRect = container.getBoundingClientRect();

      setSelectedPiece(pieceId);
      setIsDragging(true);
      setOffset({
        x: touch.clientX - containerRect.left - piece.currentX,
        y: touch.clientY - containerRect.top - piece.currentY,
      });
    },
    [pieces]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!isDragging || selectedPiece === null) return;
      
      e.preventDefault();
      e.stopPropagation();

      const touch = e.touches[0];
      const container = containerRef.current;
      if (!container) return;

      const containerRect = container.getBoundingClientRect();
      let newX = touch.clientX - containerRect.left - offset.x;
      let newY = touch.clientY - containerRect.top - offset.y;

      newX = Math.max(0, Math.min(newX, containerRect.width - PIECE_SIZE));
      newY = Math.max(0, Math.min(newY, containerRect.height - PIECE_SIZE));

      setPieces((prev) =>
        prev.map((piece) =>
          piece.id === selectedPiece
            ? { ...piece, currentX: newX, currentY: newY }
            : piece
        )
      );
    },
    [isDragging, selectedPiece, offset]
  );

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    handleMouseUp();
  }, [handleMouseUp]);

  const resetPuzzle = () => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();

    setPieces((prev) =>
      prev.map((piece) => ({
        ...piece,
        currentX: Math.random() * (containerRect.width - PIECE_SIZE),
        currentY: Math.random() * (containerRect.height - PIECE_SIZE),
      }))
    );
    setIsComplete(false);
    setShowMessage(false);
    setShowTitle(false);
    setShowSubtitle(false);
    setShowButton(false);
    setConfettis([]);
    
    // Arrêter la musique
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
  };

  return (
    <div 
      className="min-h-screen flex flex-col items-center justify-center p-4"
      style={{ 
        background: 'linear-gradient(135deg, #E8DDD4 0%, #D4C4B5 50%, #C9B8A8 100%)',
        touchAction: 'none',
      }}
    >
      {/* Audio pour la victoire */}
      <audio ref={audioRef} src="/Happy%20Birthday.mp3" preload="auto" />

      <div
        ref={containerRef}
        className="relative rounded-2xl shadow-xl"
        style={{
          width: '95vw',
          maxWidth: '400px',
          height: '70vh',
          maxHeight: '500px',
          backgroundColor: 'rgba(255, 255, 255, 0.4)',
          border: '2px solid rgba(93, 78, 66, 0.2)',
          touchAction: 'none',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <img
          src="/puzzle-image.jpg"
          alt="puzzle"
          className="hidden"
          onLoad={() => setImageLoaded(true)}
        />

        {imageLoaded && pieces.length > 0 && (
          <div
            className="absolute rounded-lg"
            style={{
              left: pieces[0]?.correctX || 0,
              top: pieces[0]?.correctY || 0,
              width: PIECE_SIZE * GRID_SIZE,
              height: PIECE_SIZE * GRID_SIZE,
              border: '2px dashed rgba(93, 78, 66, 0.3)',
            }}
          />
        )}

        {pieces.map((piece) => (
          <div
            key={piece.id}
            className={`absolute rounded-sm overflow-hidden ${
              selectedPiece === piece.id ? 'z-50' : 'z-10'
            }`}
            style={{
              left: piece.currentX,
              top: piece.currentY,
              width: PIECE_SIZE,
              height: PIECE_SIZE,
              transform: selectedPiece === piece.id ? 'scale(1.08)' : 'scale(1)',
              transition: isDragging && selectedPiece === piece.id 
                ? 'none' 
                : 'transform 0.2s, box-shadow 0.2s',
              boxShadow: selectedPiece === piece.id 
                ? '0 10px 30px rgba(93, 78, 66, 0.4)' 
                : '0 4px 15px rgba(93, 78, 66, 0.2)',
              touchAction: 'none',
            }}
            onMouseDown={(e) => handleMouseDown(e, piece.id)}
            onTouchStart={(e) => handleTouchStart(e, piece.id)}
          >
            <div
              className="w-full h-full rounded-sm"
              style={{
                backgroundImage: 'url(/puzzle-image.jpg)',
                backgroundSize: `${PIECE_SIZE * GRID_SIZE}px ${PIECE_SIZE * GRID_SIZE}px`,
                backgroundPosition: `-${piece.col * PIECE_SIZE}px -${piece.row * PIECE_SIZE}px`,
                border: '2px solid rgba(255, 255, 255, 0.6)',
              }}
            />
          </div>
        ))}

        {isComplete && (
          <div className="absolute inset-0 flex items-center justify-center rounded-2xl z-[100] overflow-hidden">
            {confettis.map((confetti) => (
              <div
                key={confetti.id}
                className="absolute"
                style={{
                  left: `${confetti.x}%`,
                  top: `${confetti.y}%`,
                  width: confetti.size,
                  height: confetti.size,
                  backgroundColor: confetti.color,
                  transform: `rotate(${confetti.rotation}deg)`,
                  borderRadius: confetti.id % 2 === 0 ? '50%' : '0%',
                }}
              />
            ))}

            <div
              className="absolute rounded-lg overflow-hidden"
              style={{
                left: pieces[0]?.correctX || 0,
                top: pieces[0]?.correctY || 0,
                width: PIECE_SIZE * GRID_SIZE,
                height: PIECE_SIZE * GRID_SIZE,
                boxShadow: '0 0 40px rgba(255, 215, 0, 0.6)',
              }}
            >
              <img
                src="/puzzle-image.jpg"
                alt="Puzzle complet"
                className="w-full h-full object-cover"
              />
            </div>

            {showMessage && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div 
                  className="text-center p-8 rounded-3xl shadow-2xl"
                  style={{
                    background: 'linear-gradient(135deg, rgba(255,215,0,0.95) 0%, rgba(255,165,0,0.95) 100%)',
                    backdropFilter: 'blur(10px)',
                    transform: showMessage ? 'scale(1)' : 'scale(0)',
                    opacity: showMessage ? 1 : 0,
                    transition: 'all 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  }}
                >
                  {/* Titre animé */}
                  <div
                    style={{
                      transform: showTitle ? 'translateY(0) scale(1)' : 'translateY(-30px) scale(0.5)',
                      opacity: showTitle ? 1 : 0,
                      transition: 'all 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    }}
                  >
                    <div className="text-5xl mb-2">🎉</div>
                    <h2 
                      className="text-4xl font-bold mb-2"
                      style={{
                        background: 'linear-gradient(135deg, #fff 0%, #ffe4b5 100%)',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 2px 10px rgba(0,0,0,0.1)',
                      }}
                    >
                      Bravo !
                    </h2>
                  </div>
                  
                  {/* Sous-titre animé */}
                  <div
                    style={{
                      transform: showSubtitle ? 'translateY(0)' : 'translateY(20px)',
                      opacity: showSubtitle ? 1 : 0,
                      transition: 'all 0.5s ease-out',
                    }}
                  >
                    <p className="text-xl text-white mb-6 font-medium">
                      Joyeux anniversaire !
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <button
        onClick={resetPuzzle}
        className="mt-4 px-6 py-2 font-bold rounded-full transition-all shadow-lg"
        style={{
          background: 'linear-gradient(135deg, #8B7355 0%, #6B5344 100%)',
          color: 'white',
        }}
      >
        Mélanger
      </button>
    </div>
  );
}
