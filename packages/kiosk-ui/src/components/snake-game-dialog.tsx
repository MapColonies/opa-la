import { SnakeGame } from '@/components/snake-game';
import { useSnakeEasterEgg } from '@/hooks/use-snake-easter-egg';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

export function SnakeGameDialog() {
  const { isSnakeGameOpen, closeSnakeGame } = useSnakeEasterEgg();

  return (
    <Dialog open={isSnakeGameOpen} onOpenChange={(open) => !open && closeSnakeGame()}>
      <DialogContent className="max-w-md min-h-[600px] flex flex-col" showCloseButton={true}>
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="text-center">🎮 Snake Game Easter Egg!</DialogTitle>
        </DialogHeader>
        <div className="flex-1 flex items-center justify-center">
          <SnakeGame isVisible={isSnakeGameOpen} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
