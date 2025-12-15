import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Question, SimuladoConfig, SimuladoResult } from '@/types/question';
import { ArrowLeft, ArrowRight, Clock, CheckCircle, XCircle, Target, Flag } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useStatistics } from '@/hooks/useStatistics';

interface SimuladoModeProps {
  questions: Question[];
  config: SimuladoConfig;
  onFinish: (result: SimuladoResult) => void;
  onBack: () => void;
}

export const SimuladoMode: React.FC<SimuladoModeProps> = ({ 
  questions, 
  config, 
  onFinish, 
  onBack 
}) => {
  const { toast } = useToast();
  const { recordAttempt, createSimuladoSession } = useStatistics();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [timeLeft, setTimeLeft] = useState(config.tempo ? config.tempo * 60 : 0);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const totalRespostas = Object.keys(respostas).length;

  // Timer
  useEffect(() => {
    if (config.tempo && timeLeft > 0 && !isFinished) {
      const timer = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            finishSimulado();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [timeLeft, isFinished, config.tempo]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswer = (questionId: string, answer: string) => {
    setRespostas(prev => ({
      ...prev,
      [questionId]: answer
    }));
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

  const finishSimulado = async () => {
    setIsFinished(true);
    setShowResults(true);
    
    // Calcular pontuação
    let pontuacao = 0;
    questions.forEach(question => {
      if (respostas[question.id] === question.gabarito) {
        pontuacao++;
      }
    });

    const totalTime = config.tempo ? (config.tempo * 60) - timeLeft : 0;

    // Criar sessão no banco se ainda não existe
    let currentSessionId = sessionId;
    if (!currentSessionId) {
      currentSessionId = await createSimuladoSession(
        config.nome,
        config.categorias,
        questions.length,
        pontuacao,
        totalTime,
        config.tempo ? config.tempo * 60 : undefined
      );
    }

    // Registrar todas as tentativas
    if (currentSessionId) {
      for (const question of questions) {
        const selectedAnswer = respostas[question.id];
        if (selectedAnswer) {
          const isCorrect = selectedAnswer === question.gabarito;
          await recordAttempt(
            question.id,
            selectedAnswer,
            isCorrect,
            undefined, // tempo por questão não está sendo medido no simulado
            currentSessionId,
            'simulado'
          );
        }
      }
    }

    const result: SimuladoResult = {
      id: Date.now().toString(),
      config,
      questoes: questions,
      respostas,
      pontuacao,
      tempo: totalTime,
      completedAt: new Date()
    };

    // Salvar resultado no localStorage por enquanto
    const savedResults = JSON.parse(localStorage.getItem('simuladoResults') || '[]');
    savedResults.push(result);
    localStorage.setItem('simuladoResults', JSON.stringify(savedResults));

    onFinish(result);
  };

  const goToQuestion = (index: number) => {
    setCurrentIndex(index);
  };

  if (showResults) {
    const pontuacao = questions.reduce((acc, question) => {
      return acc + (respostas[question.id] === question.gabarito ? 1 : 0);
    }, 0);
    
    const percentual = Math.round((pontuacao / questions.length) * 100);

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-medical mb-4">Simulado Concluído!</h1>
          <div className="text-6xl font-bold text-medical mb-4">{percentual}%</div>
          <p className="text-lg text-muted-foreground mb-6">
            Você acertou {pontuacao} de {questions.length} questões
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Resultado Detalhado</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Questões totais:</span>
                <span className="font-medium ml-2">{questions.length}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Acertos:</span>
                <span className="font-medium ml-2 text-success">{pontuacao}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Erros:</span>
                <span className="font-medium ml-2 text-destructive">{questions.length - pontuacao}</span>
              </div>
              <div>
                <span className="text-muted-foreground">Tempo gasto:</span>
                <span className="font-medium ml-2">
                  {config.tempo ? formatTime((config.tempo * 60) - timeLeft) : 'Sem limite'}
                </span>
              </div>
            </div>

            <Progress value={percentual} className="h-3" />

            <div className="flex justify-center space-x-4 pt-4">
              <Button onClick={onBack} variant="outline">
                Voltar ao Menu
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-medical flex items-center gap-2">
            <Target className="h-6 w-6" />
            {config.nome}
          </h1>
          <p className="text-muted-foreground mt-1">
            Questão {currentIndex + 1} de {questions.length}
          </p>
        </div>
        <div className="flex items-center gap-4">
          {config.tempo && (
            <div className="flex items-center gap-2 text-sm">
              <Clock className="h-4 w-4" />
              <span className={timeLeft < 300 ? 'text-destructive font-bold' : ''}>
                {formatTime(timeLeft)}
              </span>
            </div>
          )}
          <Button onClick={finishSimulado} variant="outline" size="sm">
            <Flag className="h-4 w-4 mr-2" />
            Finalizar
          </Button>
        </div>
      </div>

      {/* Progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progresso</span>
              <span>{Math.round(progress)}% • {totalRespostas} respondidas</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Question */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex flex-wrap gap-2">
              <Badge variant="outline">{currentQuestion.categoria}</Badge>
              {currentQuestion.subcategoria && (
                <Badge variant="secondary">{currentQuestion.subcategoria}</Badge>
              )}
              <Badge variant="outline">{currentQuestion.dificuldade}</Badge>
            </div>
            <div className="text-sm text-muted-foreground">
              #{currentIndex + 1}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">{currentQuestion.enunciado}</h3>
            
              {currentQuestion.imagem && currentQuestion.imagem.length > 0 && (
                <div className="my-4 space-y-2">
                  {currentQuestion.imagem.map((img, index) => (
                    <img
                      key={index}
                      src={img}
                      alt={`Imagem da questão ${index + 1}`}
                      className="max-w-full max-h-64 rounded-md border mx-auto"
                      loading="lazy"
                    />
                  ))}
                 </div>
              )}
          </div>

          <RadioGroup 
            value={respostas[currentQuestion.id] || ''} 
            onValueChange={(value) => handleAnswer(currentQuestion.id, value)}
          >
            <div className="space-y-3">
              {currentQuestion.alternativas.map((alternativa, index) => {
                const letter = String.fromCharCode(65 + index);
                const isSelected = respostas[currentQuestion.id] === letter;
                
                return (
                  <div
                    key={index}
                    onClick={() => handleAnswer(currentQuestion.id, letter)}
                    className={`flex items-center gap-4 p-4 rounded-xl border cursor-pointer transition-all duration-200 ${
                      isSelected
                        ? 'bg-primary/10 border-primary'
                        : 'bg-card border-border hover:border-primary/50 hover:bg-muted/50'
                    }`}
                  >
                    {/* Letter Circle - Aristo Style */}
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold shrink-0 transition-colors ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary'
                        : 'bg-muted text-muted-foreground border-border'
                    }`}>
                      {letter}
                    </div>
                    
                    {/* Alternative Text */}
                    <Label className="flex-1 cursor-pointer text-sm md:text-base leading-relaxed">
                      {alternativa}
                    </Label>
                    
                    {/* Hidden Radio for accessibility */}
                    <RadioGroupItem value={letter} id={`option-${letter}`} className="sr-only" />
                  </div>
                );
              })}
            </div>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button
          onClick={previousQuestion}
          disabled={currentIndex === 0}
          variant="outline"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Anterior
        </Button>
        <Button
          onClick={nextQuestion}
          disabled={currentIndex === questions.length - 1}
          variant="outline"
        >
          Próxima
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      {/* Question Navigator */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Navegação Rápida</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-10 gap-2">
            {questions.map((_, index) => {
              const isAnswered = Object.keys(respostas).includes(questions[index].id);
              const isCurrent = index === currentIndex;
              
              return (
                <Button
                  key={index}
                  size="sm"
                  variant={isCurrent ? "default" : isAnswered ? "secondary" : "outline"}
                  onClick={() => goToQuestion(index)}
                  className="h-8 w-8 p-0"
                >
                  {index + 1}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};