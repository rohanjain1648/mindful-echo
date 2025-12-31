import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, BookOpen, Plus, Trash2, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useJournal } from '@/hooks/useJournal';
import { format } from 'date-fns';

const moodOptions = [
  { value: 'great', label: '😊 Great', color: 'bg-green-500/20 text-green-400' },
  { value: 'good', label: '🙂 Good', color: 'bg-blue-500/20 text-blue-400' },
  { value: 'okay', label: '😐 Okay', color: 'bg-yellow-500/20 text-yellow-400' },
  { value: 'low', label: '😔 Low', color: 'bg-orange-500/20 text-orange-400' },
  { value: 'anxious', label: '😰 Anxious', color: 'bg-purple-500/20 text-purple-400' },
  { value: 'overwhelmed', label: '😵 Overwhelmed', color: 'bg-red-500/20 text-red-400' },
];

const categoryColors: Record<string, string> = {
  reflection: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  gratitude: 'bg-green-500/20 text-green-400 border-green-500/30',
  growth: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  grounding: 'bg-teal-500/20 text-teal-400 border-teal-500/30',
  celebration: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
};

export default function JournalPage() {
  const navigate = useNavigate();
  const { entries, loading, prompts, encouragement, loadingPrompts, fetchPrompts, saveEntry, deleteEntry } = useJournal();
  
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [selectedPrompt, setSelectedPrompt] = useState<string>('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [isWriting, setIsWriting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPastEntries, setShowPastEntries] = useState(false);

  const handleMoodSelect = (mood: string) => {
    setSelectedMood(mood);
    fetchPrompts(mood);
  };

  const handlePromptSelect = (prompt: string) => {
    setSelectedPrompt(prompt);
    setIsWriting(true);
  };

  const handleSave = async () => {
    if (!content.trim()) return;
    
    setSaving(true);
    const saved = await saveEntry({
      title: title.trim() || null,
      content: content.trim(),
      mood: selectedMood || null,
      ai_prompt: selectedPrompt || null,
    });
    
    if (saved) {
      setTitle('');
      setContent('');
      setSelectedPrompt('');
      setIsWriting(false);
      setSelectedMood('');
    }
    setSaving(false);
  };

  const handleStartFresh = () => {
    setSelectedPrompt('');
    setIsWriting(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-muted/20">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/toolkit')}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-semibold flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Journal
          </h1>
          <div className="w-10" />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <AnimatePresence mode="wait">
          {!isWriting ? (
            <motion.div
              key="mood-selection"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-8"
            >
              {/* Mood Selection */}
              <section className="space-y-4">
                <h2 className="text-lg font-medium text-center">How are you feeling right now?</h2>
                <div className="grid grid-cols-3 gap-3">
                  {moodOptions.map((mood) => (
                    <motion.button
                      key={mood.value}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleMoodSelect(mood.value)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedMood === mood.value
                          ? 'border-primary bg-primary/10'
                          : 'border-border/50 hover:border-primary/50'
                      }`}
                    >
                      <span className="text-2xl block mb-1">{mood.label.split(' ')[0]}</span>
                      <span className="text-xs text-muted-foreground">{mood.label.split(' ')[1]}</span>
                    </motion.button>
                  ))}
                </div>
              </section>

              {/* AI Prompts */}
              {selectedMood && (
                <motion.section
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-4"
                >
                  <div className="flex items-center gap-2 justify-center">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <h3 className="text-sm font-medium text-muted-foreground">AI-Guided Prompts</h3>
                  </div>

                  {loadingPrompts ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : (
                    <>
                      {encouragement && (
                        <p className="text-center text-sm text-muted-foreground italic">
                          "{encouragement}"
                        </p>
                      )}
                      <div className="space-y-3">
                        {prompts.map((prompt, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card
                              className="cursor-pointer hover:border-primary/50 transition-colors"
                              onClick={() => handlePromptSelect(prompt.prompt)}
                            >
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1">
                                    <Badge variant="outline" className={categoryColors[prompt.category]}>
                                      {prompt.category}
                                    </Badge>
                                    <h4 className="font-medium mt-2">{prompt.title}</h4>
                                    <p className="text-sm text-muted-foreground mt-1">{prompt.prompt}</p>
                                  </div>
                                  <Plus className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  )}

                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={handleStartFresh}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Write freely without a prompt
                  </Button>
                </motion.section>
              )}

              {/* Past Entries */}
              {entries.length > 0 && (
                <Collapsible open={showPastEntries} onOpenChange={setShowPastEntries}>
                  <CollapsibleTrigger asChild>
                    <Button variant="ghost" className="w-full justify-between">
                      <span>Past Entries ({entries.length})</span>
                      <ChevronDown className={`h-4 w-4 transition-transform ${showPastEntries ? 'rotate-180' : ''}`} />
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-3 mt-4">
                    {entries.slice(0, 5).map((entry) => (
                      <Card key={entry.id} className="relative group">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-sm font-medium">
                                {entry.title || 'Untitled Entry'}
                              </CardTitle>
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(entry.created_at), 'MMM d, yyyy • h:mm a')}
                              </p>
                            </div>
                            {entry.mood && (
                              <Badge variant="outline" className={moodOptions.find(m => m.value === entry.mood)?.color}>
                                {moodOptions.find(m => m.value === entry.mood)?.label}
                              </Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="pt-0">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {entry.content}
                          </p>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => deleteEntry(entry.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                    {entries.length > 5 && (
                      <Button variant="link" className="w-full" onClick={() => navigate('/history')}>
                        View all entries
                      </Button>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="writing"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Writing Area */}
              {selectedPrompt && (
                <Card className="bg-primary/5 border-primary/20">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-2">
                      <Sparkles className="h-4 w-4 text-primary mt-0.5" />
                      <p className="text-sm">{selectedPrompt}</p>
                    </div>
                  </CardContent>
                </Card>
              )}

              <Input
                placeholder="Give your entry a title (optional)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-lg font-medium"
              />

              <Textarea
                placeholder="Start writing..."
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="min-h-[300px] resize-none text-base leading-relaxed"
                autoFocus
              />

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => {
                    setIsWriting(false);
                    setContent('');
                    setTitle('');
                    setSelectedPrompt('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleSave}
                  disabled={!content.trim() || saving}
                >
                  {saving ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    'Save Entry'
                  )}
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
