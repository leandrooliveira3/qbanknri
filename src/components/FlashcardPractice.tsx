import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft, RotateCcw, Check, X, ChevronRight } from 'lucide-react';
import { Flashcard } from '@/hooks/useFlashcards';

interface FlashcardPracticeProps {
  flashcards: Flashcard[];
  onReview: (id: string, quality: 'again' | 'hard' | 'good' | 'easy') => Promise<void>;
  onFinish: () => void;
}

export const FlashcardPractice: React.FC<FlashcardPracticeProps> = ({
  flashcards,
  onReview,
  onFinish
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewed, setReviewed] = useState(0);

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex) / flashcards.length) * 100;

  useEffect(() => {
    setIsFlipped(false);
  }, [currentIndex]);

  const handleReview = async (quality: 'again' | 'hard' | 'good' | 'easy') => {
    await onReview(currentCard.id, quality);
    setReviewed(prev => prev + 1);
    
    if (currentIndex < flashcards.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      onFinish();
    }
  };

  if (!currentCard) {
    return (
      <div className="text-center py-12">
        <Check className="h-16 w-16 text-success mx-auto mb-4" />
        <h2 className="text-xl font-bold mb-2">Parabéns!</h2>
        <p className="text-muted-foreground mb-4">Você revisou todos os flashcards.</p>
        <Button onClick={onFinish}>Voltar</Button>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onFinish}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Sair
        </Button>
        <div className="text-sm text-muted-foreground">
          {currentIndex + 1} / {flashcards.length}
        </div>
      </div>

      {/* Progress */}
      <Progress value={progress} className="h-2" />

      {/* Card */}
      <div
        className="perspective-1000 cursor-pointer min-h-[300px]"
        onClick={() => setIsFlipped(!isFlipped)}
      >
        <Card className={`transition-all duration-300 ${isFlipped ? 'bg-primary/5' : ''}`}>
          <CardContent className="p-8 min-h-[300px] flex flex-col justify-center">
            {!isFlipped ? (
              <div className="text-center space-y-4">
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Pergunta</p>
                <p className="text-xl font-medium text-foreground leading-relaxed">
                  {currentCard.front}
                </p>
                <p className="text-sm text-muted-foreground mt-8">
                  Toque para ver a resposta
                </p>
              </div>
            ) : (
              <div className="text-center space-y-4">
                <p className="text-xs text-primary uppercase tracking-wide">Resposta</p>
                <p className="text-lg text-foreground leading-relaxed whitespace-pre-wrap">
                  {currentCard.back}
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Category */}
      {currentCard.category && (
        <div className="text-center">
          <span className="text-xs text-primary bg-primary/10 px-3 py-1 rounded-full">
            {currentCard.category}
          </span>
        </div>
      )}

      {/* Actions */}
      {isFlipped ? (
        <div className="space-y-3">
          <p className="text-center text-sm text-muted-foreground">Como foi?</p>
          <div className="grid grid-cols-4 gap-2">
            <Button
              variant="outline"
              onClick={() => handleReview('again')}
              className="flex flex-col h-auto py-3 border-destructive/50 text-destructive hover:bg-destructive hover:text-destructive-foreground"
            >
              <X className="h-5 w-5 mb-1" />
              <span className="text-xs">Errei</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReview('hard')}
              className="flex flex-col h-auto py-3 border-warning/50 text-warning hover:bg-warning hover:text-warning-foreground"
            >
              <RotateCcw className="h-5 w-5 mb-1" />
              <span className="text-xs">Difícil</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReview('good')}
              className="flex flex-col h-auto py-3 border-success/50 text-success hover:bg-success hover:text-success-foreground"
            >
              <Check className="h-5 w-5 mb-1" />
              <span className="text-xs">Bom</span>
            </Button>
            <Button
              variant="outline"
              onClick={() => handleReview('easy')}
              className="flex flex-col h-auto py-3 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground"
            >
              <ChevronRight className="h-5 w-5 mb-1" />
              <span className="text-xs">Fácil</span>
            </Button>
          </div>
        </div>
      ) : (
        <Button className="w-full" onClick={() => setIsFlipped(true)}>
          Mostrar Resposta
        </Button>
      )}
    </div>
  );
};
