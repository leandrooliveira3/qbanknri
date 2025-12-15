import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Question, NeuroCategory } from '@/types/question';
import { ArrowLeft, ArrowRight, RotateCcw, CheckCircle, XCircle, Book, Pause, Play, Square, Save, Star, BookOpen, Menu, Edit } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStatistics } from '@/hooks/useStatistics';
import { useFavorites } from '@/hooks/useFavorites';
import { CommentWithImage } from '@/components/CommentWithImage';
import { QuestionEditor } from '@/components/QuestionEditor';
import { supabase } from '@/lib/supabaseClient';
import { useSidebar } from '@/components/ui/sidebar';

interface PracticeModeProps {
  questions: Question[];
  onBack: () => void;
  onUpdateQuestion?: (id: string, questionData: Partial<Question>) => Promise<void>;
}

export const PracticeMode: React.FC<PracticeModeProps> = ({ questions: initialQuestions, onBack, onUpdateQuestion }) => {
  const { toast } = useToast();
  const { recordAttempt, createPracticeSession } = useStatistics();
  const { toggleFavorite, isFavorite } = useFavorites();
  const { toggleSidebar } = useSidebar();
  const [questions, setQuestions] = useState<Question[]>(initialQuestions);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [showAnswer, setShowAnswer] = useState(false);
  const [answeredQuestions, setAnsweredQuestions] = useState<Set<number>>(new Set());
  const [correctAnswers, setCorrectAnswers] = useState<Set<number>>(new Set());
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [isPaused, setIsPaused] = useState(false);
  const [practiceStartTime] = useState<number>(Date.now());

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;

  useEffect(() => {
    setSelectedAnswer('');
    setShowAnswer(false);
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  // Carregar progresso salvo (se existir)
  useEffect(() => {
    const savedProgress = localStorage.getItem('practiceProgress');
    if (savedProgress) {
      try {
        const progressData = JSON.parse(savedProgress);
        setCurrentIndex(progressData.currentIndex || 0);
        setAnsweredQuestions(new Set(progressData.answeredQuestions || []));
        setCorrectAnswers(new Set(progressData.correctAnswers || []));
        setSessionId(progressData.sessionId);
        
        toast({
          title: "Progresso restaurado",
          description: "Continuando de onde você parou"
        });
      } catch (error) {
        console.error('Erro ao carregar progresso:', error);
      }
    }
  }, [toast]);

  // Criar sessão ao iniciar
  useEffect(() => {
    const initSession = async () => {
      if (questions.length > 0 && !sessionId) {
        const newSessionId = await createPracticeSession(
          `Prática - ${new Date().toLocaleDateString('pt-BR')}`,
          questions.length,
          0
        );
        setSessionId(newSessionId);
      }
    };
    initSession();
  }, [questions, createPracticeSession, sessionId]);

  const handleAnswerSubmit = async () => {
    if (!selectedAnswer) {
      toast({
        title: "Selecione uma alternativa",
        description: "Escolha uma das opções antes de verificar a resposta",
        variant: "destructive"
      });
      return;
    }

    const isCorrect = selectedAnswer === currentQuestion.gabarito;
    const attemptTime = Math.floor((Date.now() - questionStartTime) / 1000);

    setShowAnswer(true);
    setAnsweredQuestions(prev => new Set([...prev, currentIndex]));

    if (isCorrect) {
      setCorrectAnswers(prev => new Set([...prev, currentIndex]));
      toast({
        title: "Correto! 🎉",
        description: "Parabéns, você acertou!",
        variant: "default"
      });
    } else {
      toast({
        title: "Incorreto",
        description: `A resposta correta é: ${currentQuestion.gabarito}`,
        variant: "destructive"
      });
    }

    // Registrar tentativa
    if (sessionId) {
      await recordAttempt(
        currentQuestion.id,
        selectedAnswer,
        isCorrect,
        attemptTime,
        sessionId,
        'practice'
      );
    }
  };

  const nextQuestion = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  const previousQuestion = () => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1);
    }
  };

  const resetPractice = () => {
    setCurrentIndex(0);
    setSelectedAnswer('');
    setShowAnswer(false);
    setAnsweredQuestions(new Set());
    setCorrectAnswers(new Set());
    setIsPaused(false);
  };

  const handlePausePractice = () => {
    setIsPaused(!isPaused);
    toast({
      title: isPaused ? "Prática retomada" : "Prática pausada",
      description: isPaused ? "Continue onde parou!" : "Você pode retomar a qualquer momento"
    });
  };

  const handleSaveProgress = () => {
    // Salvar progresso no localStorage para retomar depois
    const progressData = {
      currentIndex,
      answeredQuestions: Array.from(answeredQuestions),
      correctAnswers: Array.from(correctAnswers),
      sessionId,
      timestamp: Date.now()
    };
    localStorage.setItem('practiceProgress', JSON.stringify(progressData));
    
    toast({
      title: "Progresso salvo",
      description: "Você pode retomar sua prática mais tarde"
    });
  };

  const handleFinishPractice = async () => {
    const totalTime = Math.floor((Date.now() - practiceStartTime) / 1000);
    
    // Atualizar sessão final no banco
    if (sessionId) {
      try {
        await supabase
          .from('practice_sessions')
          .update({
            correct_answers: correctAnswers.size,
            total_time: totalTime
          })
          .eq('id', sessionId);
      } catch (error) {
        console.error('Erro ao finalizar sessão:', error);
      }
    }
    
    toast({
      title: "Prática finalizada!",
      description: `Você respondeu ${answeredQuestions.size} questões com ${correctAnswers.size} acertos em ${Math.floor(totalTime / 60)}min ${totalTime % 60}s`
    });
    
    // Limpar progresso salvo
    localStorage.removeItem('practiceProgress');
    onBack();
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil': return 'bg-success text-success-foreground';
      case 'Médio': return 'bg-warning text-warning-foreground';
      case 'Difícil': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  const handleEditQuestion = async (id: string, questionData: Partial<Question>) => {
    // Atualizar localmente na lista de questões
    setQuestions(prev => prev.map(q => q.id === id ? { ...q, ...questionData } : q));
    
    // Atualizar no banco se callback disponível
    if (onUpdateQuestion) {
      await onUpdateQuestion(id, questionData);
    }
    
    setIsEditDialogOpen(false);
    toast({
      title: "Questão atualizada",
      description: "As alterações foram salvas com sucesso"
    });
  };

  if (questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="py-8 text-center">
          <Book className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma questão disponível</h3>
          <p className="text-muted-foreground mb-4">
            Adicione questões ao banco para começar a praticar
          </p>
          <Button onClick={onBack} variant="outline">
            Voltar ao Dashboard
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header with Progress and Navigation - All in one compact bar */}
      <Card className="sticky top-0 z-10 bg-card/95 backdrop-blur-sm">
        <CardContent className="py-3 px-4">
          {/* Row 1: Progress info + Navigation buttons */}
          <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button onClick={toggleSidebar} variant="ghost" size="sm" className="shrink-0">
                <Menu className="h-4 w-4" />
              </Button>
              <span className="text-sm text-muted-foreground">
                {currentIndex + 1}/{questions.length} • {correctAnswers.size} acertos
              </span>
            </div>
            
            {/* Navigation - Moved to top */}
            <div className="flex items-center gap-2 w-full sm:w-auto sm:ml-auto">
              <Button
                onClick={previousQuestion}
                disabled={currentIndex === 0}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <ArrowLeft className="h-4 w-4 mr-1" />
                <span className="hidden xs:inline">Anterior</span>
              </Button>
              <Button
                onClick={nextQuestion}
                disabled={currentIndex === questions.length - 1}
                variant="outline"
                size="sm"
                className="flex-1 sm:flex-none"
              >
                <span className="hidden xs:inline">Próxima</span>
                <ArrowRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          </div>
          
          {/* Row 2: Progress bar */}
          <Progress value={progress} className="h-1.5" />
          
          {/* Row 3: Action buttons - Compact */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button onClick={handlePausePractice} variant="ghost" size="sm" className="h-8 px-2">
              {isPaused ? <Play className="h-3.5 w-3.5" /> : <Pause className="h-3.5 w-3.5" />}
            </Button>
            <Button onClick={handleSaveProgress} variant="ghost" size="sm" className="h-8 px-2">
              <Save className="h-3.5 w-3.5" />
            </Button>
            <Button onClick={resetPractice} variant="ghost" size="sm" className="h-8 px-2">
              <RotateCcw className="h-3.5 w-3.5" />
            </Button>
            <div className="flex-1" />
            <Button onClick={handleFinishPractice} variant="outline" size="sm" className="h-8">
              <Square className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Finalizar</span>
            </Button>
            <Button onClick={onBack} variant="outline" size="sm" className="h-8">
              <ArrowLeft className="h-3.5 w-3.5 mr-1" />
              <span className="hidden sm:inline">Voltar</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Question - Mobile optimized */}
      <Card className="compact-card">
        <CardHeader className="pb-4">
          <div className="flex flex-col sm:flex-row justify-between items-start gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline" className="text-xs">{currentQuestion.categoria}</Badge>
              {currentQuestion.subcategoria && (
                <Badge variant="secondary" className="text-xs">{currentQuestion.subcategoria}</Badge>
              )}
              <Badge className={`${getDifficultyColor(currentQuestion.dificuldade)} text-xs`}>
                {currentQuestion.dificuldade}
              </Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              #{currentIndex + 1}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 md:space-y-6">
          <div className="question-content">
            <div className="flex justify-between items-start gap-4 mb-4">
              <div className="flex-1">
                <div dangerouslySetInnerHTML={{ __html: currentQuestion.enunciado }}
                  className="text-base md:text-lg font-medium question-text" 
                />
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => setIsEditDialogOpen(true)}
                  title="Editar questão"
                >
                  <Edit className="h-5 w-5 text-muted-foreground hover:text-primary" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => toggleFavorite(currentQuestion.id)}
                  className={`favorite-btn ${isFavorite(currentQuestion.id) ? 'active' : ''}`}
                >
                  <Star 
                    className={`h-5 w-5 ${isFavorite(currentQuestion.id) ? 'fill-yellow-500 text-yellow-500' : 'text-muted-foreground'}`} 
                  />
                </Button>
              </div>
            </div>
            
            
              {currentQuestion.imagem && currentQuestion.imagem.length > 0 && (
                <div className="my-4 space-y-2">
                  {currentQuestion.imagem.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Imagem da questão ${index + 1}`}
                      className="max-w-full max-h-48 md:max-h-64 rounded-md border mx-auto object-contain"
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  ))}
                </div>
              )}
          </div>

          <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer} disabled={showAnswer}>
            <div className="space-y-3">
              {currentQuestion.alternativas.map((alternativa, index) => {
                const letter = String.fromCharCode(65 + index);
                const isCorrect = letter === currentQuestion.gabarito;
                const isSelected = selectedAnswer === letter;
                
                return (
                  <div
                    key={index}
                    onClick={() => !showAnswer && setSelectedAnswer(letter)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      showAnswer
                        ? isCorrect
                          ? 'bg-success/10 border-success'
                          : isSelected
                          ? 'bg-destructive/10 border-destructive'
                          : 'bg-card border-border'
                        : isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {/* Letter Circle - Aristo Style */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold shrink-0 transition-colors ${
                      showAnswer
                        ? isCorrect
                          ? 'bg-success text-success-foreground border-success'
                          : isSelected
                          ? 'bg-destructive text-destructive-foreground border-destructive'
                          : 'bg-primary/10 text-primary border-primary'
                        : isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {letter}
                    </div>
                    
                    {/* Alternative Text */}
                    <Label className="flex-1 cursor-pointer text-sm md:text-base leading-relaxed">
                      <span dangerouslySetInnerHTML={{ __html: alternativa }} className="question-text" />
                    </Label>
                    
                    {/* Result Icons */}
                    {showAnswer && isCorrect && (
                      <CheckCircle className="h-5 w-5 text-success shrink-0" />
                    )}
                    {showAnswer && isSelected && !isCorrect && (
                      <XCircle className="h-5 w-5 text-destructive shrink-0" />
                    )}
                    
                    {/* Hidden Radio for accessibility */}
                    <RadioGroupItem value={letter} id={`option-${letter}`} className="sr-only" />
                  </div>
                );
              })}
            </div>
          </RadioGroup>

          {!showAnswer ? (
            <div className="flex justify-end">
              <Button 
                onClick={handleAnswerSubmit}
                disabled={!selectedAnswer}
                className="bg-primary hover:bg-primary/90 px-8"
              >
                <RotateCcw className="h-4 w-4 mr-2" />
                Responder
              </Button>
            </div>
          ) : (
            <CommentWithImage
              comment={currentQuestion.comentario}
              commentImages={currentQuestion.comentarioImagem}
              tags={currentQuestion.tags}
              fonte={currentQuestion.fonte}
              referencias={currentQuestion.referencias}
              questionId={currentQuestion.id}
              isEditable={false}
            />
          )}
        </CardContent>
      </Card>

      {/* Navigation - Mobile optimized */}
      {/* Navigation removed from bottom - now in header */}

      {/* Dialog para editar questão */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Editar Questão</DialogTitle>
          </DialogHeader>
          {currentQuestion && (
            <QuestionEditor
              question={currentQuestion}
              onUpdateQuestion={handleEditQuestion}
              onCancel={() => setIsEditDialogOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
