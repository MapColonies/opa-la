import { useEffect, useRef, useState, useCallback } from 'react';

interface Position {
  x: number;
  y: number;
}

interface SnakeGameProps {
  isVisible: boolean;
}

interface GameState {
  snake: Position[];
  food: Position;
  direction: Position;
  gameOver: boolean;
  score: number;
  isPlaying: boolean;
  interpolationProgress: number;
  lastUpdateTime: number;
}

const GRID_SIZE = 20;
const CANVAS_WIDTH = 400;
const CANVAS_HEIGHT = 400;
const GAME_SPEED = 150;

export function SnakeGame({ isVisible }: SnakeGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameStateRef = useRef<GameState>({
    snake: [{ x: 10, y: 10 }],
    food: { x: 15, y: 15 },
    direction: { x: 0, y: -1 },
    gameOver: false,
    score: 0,
    isPlaying: false,
    interpolationProgress: 0,
    lastUpdateTime: 0,
  });
  const gameLoopRef = useRef<NodeJS.Timeout | null>(null);
  const [displayScore, setDisplayScore] = useState(0);
  const [displayGameOver, setDisplayGameOver] = useState(false);
  const [displayIsPlaying, setDisplayIsPlaying] = useState(false);

  const generateFood = useCallback((currentSnake: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * (CANVAS_WIDTH / GRID_SIZE)),
        y: Math.floor(Math.random() * (CANVAS_HEIGHT / GRID_SIZE)),
      };
    } while (currentSnake.some((segment) => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  const checkCollision = useCallback((head: Position, snakeBody: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= CANVAS_WIDTH / GRID_SIZE || head.y < 0 || head.y >= CANVAS_HEIGHT / GRID_SIZE) {
      return true;
    }
    // Self collision
    return snakeBody.some((segment) => segment.x === head.x && segment.y === head.y);
  }, []);

  const drawGame = useCallback((interpolationProgress = 0) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameState = gameStateRef.current;

    // Clear canvas with improved dark mode background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#0f172a'); // slate-900
    gradient.addColorStop(0.5, '#1e293b'); // slate-800
    gradient.addColorStop(1, '#334155'); // slate-700
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid with better visibility
    ctx.strokeStyle = 'rgba(148, 163, 184, 0.2)'; // slate-400 with opacity
    ctx.lineWidth = 1;
    for (let i = 0; i <= CANVAS_WIDTH; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i, CANVAS_HEIGHT);
      ctx.stroke();
    }
    for (let i = 0; i <= CANVAS_HEIGHT; i += GRID_SIZE) {
      ctx.beginPath();
      ctx.moveTo(0, i);
      ctx.lineTo(CANVAS_WIDTH, i);
      ctx.stroke();
    }

    // Calculate interpolated positions for smooth movement
    const interpolatedSnake = gameState.snake.map((segment, index) => {
      if (index === 0 && gameState.isPlaying && !gameState.gameOver) {
        // Interpolate head position based on direction and progress
        const baseX = segment.x * GRID_SIZE;
        const baseY = segment.y * GRID_SIZE;
        const offsetX = gameState.direction.x * GRID_SIZE * interpolationProgress;
        const offsetY = gameState.direction.y * GRID_SIZE * interpolationProgress;

        return {
          x: baseX + offsetX,
          y: baseY + offsetY,
          gridX: segment.x,
          gridY: segment.y,
        };
      } else if (index > 0 && gameState.isPlaying && !gameState.gameOver) {
        // Body segments follow smoothly
        const prevSegment = gameState.snake[index - 1];
        const currentSegment = segment;

        if (prevSegment) {
          const baseX = segment.x * GRID_SIZE;
          const baseY = segment.y * GRID_SIZE;

          // Calculate direction from current to previous segment
          const dirX = prevSegment.x - currentSegment.x;
          const dirY = prevSegment.y - currentSegment.y;

          // Apply smaller interpolation for body segments
          const offsetX = dirX * GRID_SIZE * interpolationProgress * 0.8;
          const offsetY = dirY * GRID_SIZE * interpolationProgress * 0.8;

          return {
            x: baseX + offsetX,
            y: baseY + offsetY,
            gridX: segment.x,
            gridY: segment.y,
          };
        }
      }

      // Static position for non-moving segments
      return {
        x: segment.x * GRID_SIZE,
        y: segment.y * GRID_SIZE,
        gridX: segment.x,
        gridY: segment.y,
      };
    });

    // Draw snake with smooth interpolated positions
    interpolatedSnake.forEach((segment, index) => {
      const x = segment.x;
      const y = segment.y;

      if (index === 0) {
        // Snake head with bright green gradient
        const headGradient = ctx.createRadialGradient(x + GRID_SIZE / 2, y + GRID_SIZE / 2, 0, x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 2);
        headGradient.addColorStop(0, '#10b981'); // emerald-500
        headGradient.addColorStop(1, '#059669'); // emerald-600
        ctx.fillStyle = headGradient;

        // Rounded rectangle for head with glow effect
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 8;
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 6);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Eyes with better contrast - adjust position based on direction
        const eyeOffsetX = gameState.direction.x * 2;
        const eyeOffsetY = gameState.direction.y * 2;

        ctx.fillStyle = '#1f2937'; // gray-800
        ctx.beginPath();
        ctx.arc(x + 6 + eyeOffsetX, y + 6 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.arc(x + 14 + eyeOffsetX, y + 6 + eyeOffsetY, 2, 0, Math.PI * 2);
        ctx.fill();

        // Eye highlights
        ctx.fillStyle = '#f9fafb'; // gray-50
        ctx.beginPath();
        ctx.arc(x + 7 + eyeOffsetX, y + 5 + eyeOffsetY, 0.8, 0, Math.PI * 2);
        ctx.arc(x + 15 + eyeOffsetX, y + 5 + eyeOffsetY, 0.8, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Snake body with bright green gradient
        const bodyGradient = ctx.createRadialGradient(x + GRID_SIZE / 2, y + GRID_SIZE / 2, 0, x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 2);
        bodyGradient.addColorStop(0, '#34d399'); // emerald-400
        bodyGradient.addColorStop(1, '#10b981'); // emerald-500
        ctx.fillStyle = bodyGradient;

        // Body segment with subtle glow
        ctx.shadowColor = '#10b981';
        ctx.shadowBlur = 4;
        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4, 4);
        ctx.fill();
        ctx.shadowBlur = 0;

        // Body segment border for definition
        ctx.strokeStyle = '#059669'; // emerald-600
        ctx.lineWidth = 1.5;
        ctx.stroke();
      }
    });

    // Draw food with improved graphics and better visibility
    const foodX = gameState.food.x * GRID_SIZE;
    const foodY = gameState.food.y * GRID_SIZE;

    // Food with enhanced pulsing effect
    const time = Date.now() * 0.008;
    const pulseSize = Math.sin(time) * 3;
    const pulseOpacity = 0.3 + Math.sin(time) * 0.2;

    // Food gradient with brighter colors
    const foodGradient = ctx.createRadialGradient(
      foodX + GRID_SIZE / 2,
      foodY + GRID_SIZE / 2,
      0,
      foodX + GRID_SIZE / 2,
      foodY + GRID_SIZE / 2,
      GRID_SIZE / 2 + pulseSize
    );
    foodGradient.addColorStop(0, '#f87171'); // red-400
    foodGradient.addColorStop(0.6, '#ef4444'); // red-500
    foodGradient.addColorStop(1, '#dc2626'); // red-600

    // Food glow effect
    ctx.shadowColor = '#ef4444';
    ctx.shadowBlur = 12 + pulseSize;
    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(foodX + GRID_SIZE / 2, foodY + GRID_SIZE / 2, GRID_SIZE / 2 - 1 + pulseSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Food highlight with dynamic opacity
    ctx.fillStyle = `rgba(248, 250, 252, ${pulseOpacity})`; // slate-50 with dynamic opacity
    ctx.beginPath();
    ctx.arc(foodX + GRID_SIZE / 2 - 2, foodY + GRID_SIZE / 2 - 2, 4, 0, Math.PI * 2);
    ctx.fill();

    // Additional sparkle effect
    ctx.fillStyle = `rgba(255, 255, 255, ${pulseOpacity * 0.8})`;
    ctx.beginPath();
    ctx.arc(foodX + GRID_SIZE / 2 + 3, foodY + GRID_SIZE / 2 - 3, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }, []);

  const gameLoop = useCallback(() => {
    const gameState = gameStateRef.current;

    if (gameState.gameOver || !gameState.isPlaying) return;

    const newSnake = [...gameState.snake];
    const currentHead = newSnake[0];

    if (!currentHead) return;

    const head: Position = {
      x: currentHead.x + gameState.direction.x,
      y: currentHead.y + gameState.direction.y,
    };

    // Check collision
    if (checkCollision(head, newSnake)) {
      gameState.gameOver = true;
      gameState.isPlaying = false;
      setDisplayGameOver(true);
      setDisplayIsPlaying(false);
      return;
    }

    newSnake.unshift(head);

    // Check food collision
    if (head.x === gameState.food.x && head.y === gameState.food.y) {
      gameState.score += 10;
      setDisplayScore(gameState.score);
      gameState.food = generateFood(newSnake);
    } else {
      newSnake.pop();
    }

    gameState.snake = newSnake;
    gameState.lastUpdateTime = performance.now();
    gameState.interpolationProgress = 0;
  }, [checkCollision, generateFood]);

  const resetGame = useCallback(() => {
    if (gameLoopRef.current) {
      clearInterval(gameLoopRef.current);
    }

    gameStateRef.current = {
      snake: [{ x: 10, y: 10 }],
      food: { x: 15, y: 15 },
      direction: { x: 0, y: -1 },
      gameOver: false,
      score: 0,
      isPlaying: true,
      interpolationProgress: 0,
      lastUpdateTime: performance.now(),
    };

    setDisplayScore(0);
    setDisplayGameOver(false);
    setDisplayIsPlaying(true);

    drawGame(0);
    gameLoopRef.current = setInterval(gameLoop, GAME_SPEED);
  }, [drawGame, gameLoop]);

  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    const gameState = gameStateRef.current;
    if (!gameState.isPlaying || gameState.gameOver) return;

    const { key } = e;
    const currentDirection = gameState.direction;

    switch (key.toLowerCase()) {
      case 'w':
      case 'arrowup':
        if (currentDirection.y === 0) gameState.direction = { x: 0, y: -1 };
        break;
      case 's':
      case 'arrowdown':
        if (currentDirection.y === 0) gameState.direction = { x: 0, y: 1 };
        break;
      case 'a':
      case 'arrowleft':
        if (currentDirection.x === 0) gameState.direction = { x: -1, y: 0 };
        break;
      case 'd':
      case 'arrowright':
        if (currentDirection.x === 0) gameState.direction = { x: 1, y: 0 };
        break;
    }
  }, []);

  // Initialize game when visible
  useEffect(() => {
    if (isVisible) {
      drawGame(0);
      document.addEventListener('keydown', handleKeyPress);

      return () => {
        document.removeEventListener('keydown', handleKeyPress);
        if (gameLoopRef.current) {
          clearInterval(gameLoopRef.current);
        }
      };
    } else {
      // Stop game when dialog is closed
      if (gameLoopRef.current) {
        clearInterval(gameLoopRef.current);
      }
      gameStateRef.current.isPlaying = false;
      setDisplayIsPlaying(false);
    }
  }, [isVisible, drawGame, handleKeyPress]);

  // Animation loop for smooth movement and food pulsing
  useEffect(() => {
    let animationFrame: number;

    const animate = (currentTime: number) => {
      if (isVisible) {
        const gameState = gameStateRef.current;

        if (gameState.isPlaying && !gameState.gameOver) {
          // Calculate interpolation progress based on time since last update
          const timeSinceUpdate = currentTime - gameState.lastUpdateTime;
          const progress = Math.min(timeSinceUpdate / GAME_SPEED, 1);
          gameState.interpolationProgress = progress;

          // Draw with current interpolation
          drawGame(progress);
        } else {
          // Draw static game when not playing
          drawGame(0);
        }
      }
      animationFrame = requestAnimationFrame(animate);
    };

    if (isVisible) {
      animate(performance.now());
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, drawGame]);

  return (
    <div className="flex flex-col items-center space-y-4">
      {/* Fixed header section */}
      <div className="text-center">
        {/* <h2 className="text-2xl font-bold mb-2 text-slate-100">🐍 Snake Game</h2> */}
        <p className="text-sm text-slate-400 mb-4">Use WASD or Arrow Keys to move</p>
        <div className="text-xl font-bold text-emerald-400 bg-slate-800 px-4 py-2 rounded-lg border border-slate-600">Score: {displayScore}</div>
      </div>

      {/* Fixed game area container */}
      <div className="relative">
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="border-2 border-slate-600 rounded-lg shadow-2xl bg-slate-900"
        />

        {/* Game over overlay - positioned absolutely to prevent layout shift */}
        {displayGameOver && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm rounded-lg flex items-center justify-center border-2 border-slate-600">
            <div className="text-center space-y-4 text-white p-6">
              <div className="text-3xl font-bold text-red-400 drop-shadow-lg">Game Over!</div>
              <div className="text-xl text-slate-200">Final Score: {displayScore}</div>
              <button
                onClick={resetGame}
                className="px-8 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-lg transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 hover:scale-105"
              >
                Play Again
              </button>
            </div>
          </div>
        )}

        {/* Start game overlay - positioned absolutely to prevent layout shift */}
        {!displayIsPlaying && !displayGameOver && (
          <div className="absolute inset-0 bg-slate-900/95 backdrop-blur-sm rounded-lg flex items-center justify-center border-2 border-slate-600">
            <button
              onClick={resetGame}
              className="px-10 py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-2xl transition-all duration-200 shadow-lg hover:shadow-emerald-500/25 hover:scale-105"
            >
              Start Game
            </button>
          </div>
        )}
      </div>

      {/* Fixed bottom space to maintain consistent dialog height */}
      <div className="h-4"></div>
    </div>
  );
}
