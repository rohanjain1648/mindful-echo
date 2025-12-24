import { useEffect, useRef } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Brain, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TranscriptItem {
  role: 'user' | 'assistant';
  text: string;
  timestamp: number;
}

interface LiveTranscriptProps {
  transcript: TranscriptItem[];
  className?: string;
}

export const LiveTranscript = ({ transcript, className }: LiveTranscriptProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [transcript]);

  if (transcript.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        <p className="text-sm">Conversation will appear here...</p>
      </div>
    );
  }

  return (
    <ScrollArea className={cn('h-full', className)} ref={scrollRef}>
      <div className="space-y-4 p-4">
        {transcript.map((item, index) => (
          <div
            key={index}
            className={cn(
              'flex gap-3',
              item.role === 'user' ? 'flex-row-reverse' : ''
            )}
          >
            {/* Avatar */}
            <div
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center shrink-0',
                item.role === 'assistant' 
                  ? 'bg-primary/20 text-primary' 
                  : 'bg-accent/20 text-accent-foreground'
              )}
            >
              {item.role === 'assistant' ? (
                <Brain className="w-4 h-4" />
              ) : (
                <User className="w-4 h-4" />
              )}
            </div>

            {/* Message bubble */}
            <div
              className={cn(
                'max-w-[80%] rounded-2xl px-4 py-3',
                item.role === 'assistant'
                  ? 'bg-muted text-foreground rounded-tl-sm'
                  : 'bg-primary text-primary-foreground rounded-tr-sm'
              )}
            >
              <p className="text-sm leading-relaxed">{item.text}</p>
              <span className="text-xs opacity-60 mt-1 block">
                {new Date(item.timestamp).toLocaleTimeString([], { 
                  hour: '2-digit', 
                  minute: '2-digit' 
                })}
              </span>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};
