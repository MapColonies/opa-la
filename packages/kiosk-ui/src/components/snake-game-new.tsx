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

  const drawGame = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const gameState = gameStateRef.current;

    // Clear canvas with gradient background
    const gradient = ctx.createLinearGradient(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid (subtle)
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
    ctx.lineWidth = 0.5;
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

    // Draw snake with improved graphics
    gameState.snake.forEach((segment, index) => {
      const x = segment.x * GRID_SIZE;
      const y = segment.y * GRID_SIZE;

      if (index === 0) {
        // Snake head with gradient
        const headGradient = ctx.createRadialGradient(x + GRID_SIZE / 2, y + GRID_SIZE / 2, 0, x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 2);
        headGradient.addColorStop(0, '#4ade80');
        headGradient.addColorStop(1, '#22c55e');
        ctx.fillStyle = headGradient;

        // Rounded rectangle for head
        ctx.beginPath();
        ctx.roundRect(x + 1, y + 1, GRID_SIZE - 2, GRID_SIZE - 2, 6);
        ctx.fill();

        // Eyes
        ctx.fillStyle = '#000';
        ctx.beginPath();
        ctx.arc(x + 6, y + 6, 2, 0, Math.PI * 2);
        ctx.arc(x + 14, y + 6, 2, 0, Math.PI * 2);
        ctx.fill();
      } else {
        // Snake body with gradient
        const bodyGradient = ctx.createRadialGradient(x + GRID_SIZE / 2, y + GRID_SIZE / 2, 0, x + GRID_SIZE / 2, y + GRID_SIZE / 2, GRID_SIZE / 2);
        bodyGradient.addColorStop(0, '#65dc8b');
        bodyGradient.addColorStop(1, '#16a34a');
        ctx.fillStyle = bodyGradient;

        ctx.beginPath();
        ctx.roundRect(x + 2, y + 2, GRID_SIZE - 4, GRID_SIZE - 4, 4);
        ctx.fill();

        // Body segment border
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 1;
        ctx.stroke();
      }
    });

    // Draw food with improved graphics
    const foodX = gameState.food.x * GRID_SIZE;
    const foodY = gameState.food.y * GRID_SIZE;

    // Food with pulsing effect
    const time = Date.now() * 0.005;
    const pulseSize = Math.sin(time) * 2;

    const foodGradient = ctx.createRadialGradient(
      foodX + GRID_SIZE / 2,
      foodY + GRID_SIZE / 2,
      0,
      foodX + GRID_SIZE / 2,
      foodY + GRID_SIZE / 2,
      GRID_SIZE / 2 + pulseSize
    );
    foodGradient.addColorStop(0, '#ff6b6b');
    foodGradient.addColorStop(0.7, '#ee5a52');
    foodGradient.addColorStop(1, '#dc2626');

    ctx.fillStyle = foodGradient;
    ctx.beginPath();
    ctx.arc(foodX + GRID_SIZE / 2, foodY + GRID_SIZE / 2, GRID_SIZE / 2 - 2 + pulseSize, 0, Math.PI * 2);
    ctx.fill();

    // Food highlight
    ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.beginPath();
    ctx.arc(foodX + GRID_SIZE / 2 - 3, foodY + GRID_SIZE / 2 - 3, 3, 0, Math.PI * 2);
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
    drawGame();
  }, [checkCollision, generateFood, drawGame]);

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
    };

    setDisplayScore(0);
    setDisplayGameOver(false);
    setDisplayIsPlaying(true);

    drawGame();
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
      drawGame();
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

  // Animation loop for smooth food pulsing
  useEffect(() => {
    let animationFrame: number;

    const animate = () => {
      if (isVisible && !gameStateRef.current.gameOver) {
        drawGame();
      }
      animationFrame = requestAnimationFrame(animate);
    };

    if (isVisible) {
      animate();
    }

    return () => {
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isVisible, drawGame]);

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2">🐍 Snake Game</h2>
        <p className="text-sm text-muted-foreground mb-4">Use WASD or Arrow Keys to move</p>
        <div className="text-lg font-semibold">Score: {displayScore}</div>
      </div>

      <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} className="border-2 border-border rounded-lg shadow-lg" />

      {displayGameOver && (
        <div className="text-center space-y-2">
          <div className="text-xl font-bold text-destructive">Game Over!</div>
          <div className="text-sm text-muted-foreground">Final Score: {displayScore}</div>
          <button onClick={resetGame} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
            Play Again
          </button>
        </div>
      )}

      {!displayIsPlaying && !displayGameOver && (
        <button onClick={resetGame} className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
          Start Game
        </button>
      )}
    </div>
  );
}
