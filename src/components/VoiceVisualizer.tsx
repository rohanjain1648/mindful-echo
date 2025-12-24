import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface VoiceVisualizerProps {
  isActive: boolean;
  type: 'assistant' | 'user' | 'idle';
  size?: 'sm' | 'md' | 'lg';
}

export const VoiceVisualizer = ({ isActive, type, size = 'lg' }: VoiceVisualizerProps) => {
  const sizeClasses = {
    sm: 'w-24 h-24',
    md: 'w-40 h-40',
    lg: 'w-56 h-56',
  };

  const colors = {
    assistant: 'from-primary via-primary/80 to-primary/60',
    user: 'from-accent via-accent/80 to-accent/60',
    idle: 'from-muted via-muted/80 to-muted/60',
  };

  return (
    <div className={cn('relative flex items-center justify-center', sizeClasses[size])}>
      {/* Outer glow rings */}
      {isActive && (
        <>
          <motion.div
            className={cn(
              'absolute inset-0 rounded-full bg-gradient-to-br opacity-20 blur-xl',
              colors[type]
            )}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.2, 0.3, 0.2],
            }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
          <motion.div
            className={cn(
              'absolute inset-4 rounded-full bg-gradient-to-br opacity-30 blur-lg',
              colors[type]
            )}
            animate={{
              scale: [1, 1.15, 1],
              opacity: [0.3, 0.4, 0.3],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: 0.2,
            }}
          />
        </>
      )}

      {/* Main orb */}
      <motion.div
        className={cn(
          'relative rounded-full bg-gradient-to-br shadow-lg',
          colors[type],
          size === 'lg' ? 'w-40 h-40' : size === 'md' ? 'w-28 h-28' : 'w-16 h-16'
        )}
        animate={isActive ? {
          scale: [1, 1.05, 1],
        } : {}}
        transition={{
          duration: 0.8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      >
        {/* Inner glow */}
        <div className="absolute inset-4 rounded-full bg-background/20 backdrop-blur-sm" />
        
        {/* Pulse effect when active */}
        {isActive && (
          <motion.div
            className="absolute inset-0 rounded-full bg-white/20"
            animate={{
              scale: [1, 1.5],
              opacity: [0.3, 0],
            }}
            transition={{
              duration: 1,
              repeat: Infinity,
              ease: 'easeOut',
            }}
          />
        )}

        {/* Wave bars for voice activity */}
        {isActive && (
          <div className="absolute inset-0 flex items-center justify-center gap-1">
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 rounded-full bg-white/60"
                animate={{
                  height: ['12px', '28px', '12px'],
                }}
                transition={{
                  duration: 0.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: i * 0.1,
                }}
              />
            ))}
          </div>
        )}

        {/* Status indicator */}
        {!isActive && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-white/60 animate-pulse" />
          </div>
        )}
      </motion.div>
    </div>
  );
};
