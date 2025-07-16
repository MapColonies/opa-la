interface BackgroundPatternProps {
  variant?: 'subtle' | 'vibrant';
  className?: string;
}

export function BackgroundPattern({ variant = 'subtle', className = '' }: BackgroundPatternProps) {
  const patternVariants = {
    subtle: 'opacity-30',
    vibrant: 'opacity-50',
  };

  return (
    <div className={`absolute inset-0 overflow-hidden pointer-events-none ${className}`}>
      {/* Gradient Orbs */}
      <div className={`absolute top-1/4 left-1/4 w-72 h-72 bg-primary/20 rounded-full blur-3xl ${patternVariants[variant]}`} />
      <div className={`absolute bottom-1/4 right-1/4 w-96 h-96 bg-secondary/20 rounded-full blur-3xl ${patternVariants[variant]}`} />
      <div className={`absolute top-3/4 left-3/4 w-48 h-48 bg-accent/20 rounded-full blur-2xl ${patternVariants[variant]}`} />

      {/* Grid Pattern */}
      <div
        className={`absolute inset-0 ${patternVariants[variant]}`}
        style={{
          backgroundImage: `
            linear-gradient(rgba(var(--primary), 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(var(--primary), 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />
    </div>
  );
}
