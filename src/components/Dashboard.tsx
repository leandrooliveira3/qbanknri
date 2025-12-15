import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Plus, Play, Target, Upload, TrendingUp, Brain, Award, Calendar, CheckCircle2, Zap, Layers } from 'lucide-react';
import { Question } from '@/types/question';
import { useDailyReview } from '@/hooks/useDailyReview';
import { useSmartReview } from '@/hooks/useSmartReview';

interface DashboardProps {
  questions: Question[];
  onCreateSimulado: () => void;
  onAddQuestion: () => void;
  onStartPractice: () => void;
  onImportQuestions: () => void;
  onStartSmartReview?: (questions: Question[]) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  questions,
  onCreateSimulado,
  onAddQuestion,
  onStartPractice,
  onImportQuestions,
  onStartSmartReview
}) => {
  const { hasReview, dailyReview } = useDailyReview();
  const { generateSmartReview, getSmartReviewCount, loading: smartLoading } = useSmartReview();
  const [smartReviewCount, setSmartReviewCount] = useState(0);
  
  const totalQuestions = questions.length;
  const categorias = new Set(questions.map(q => q.categoria)).size;
  const questoesFaceis = questions.filter(q => q.dificuldade === 'Fácil').length;
  const questoesMedias = questions.filter(q => q.dificuldade === 'Médio').length;
  const questoesDificeis = questions.filter(q => q.dificuldade === 'Difícil').length;

  // Buscar contagem de questões para Smart Review
  useEffect(() => {
    const fetchCount = async () => {
      const count = await getSmartReviewCount(questions);
      setSmartReviewCount(count);
    };
    if (questions.length > 0) {
      fetchCount();
    }
  }, [questions, getSmartReviewCount]);

  const handleSmartReview = async () => {
    const smartQuestions = await generateSmartReview(questions);
    if (smartQuestions.length > 0 && onStartSmartReview) {
      onStartSmartReview(smartQuestions);
    }
  };

  return (
    <div className="space-y-8">
      {/* Quick Action Circles - Aristo Style */}
      <div className="flex justify-center gap-6 py-6">
        <button
          onClick={onStartPractice}
          className="flex flex-col items-center gap-2 group"
          disabled={totalQuestions === 0}
        >
          <div className="w-16 h-16 rounded-full bg-primary/10 border-2 border-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-200">
            <FileText className="h-7 w-7 text-primary group-hover:text-primary-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">Estudo</span>
        </button>

        <button
          onClick={onCreateSimulado}
          className="flex flex-col items-center gap-2 group"
          disabled={totalQuestions < 5}
        >
          <div className="w-16 h-16 rounded-full bg-warning/10 border-2 border-warning flex items-center justify-center group-hover:bg-warning group-hover:text-warning-foreground transition-all duration-200">
            <Target className="h-7 w-7 text-warning group-hover:text-warning-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">Simulado</span>
        </button>

        <button
          onClick={handleSmartReview}
          className="flex flex-col items-center gap-2 group"
          disabled={smartReviewCount === 0 || smartLoading}
        >
          <div className={`w-16 h-16 rounded-full border-2 flex items-center justify-center transition-all duration-200 ${
            smartReviewCount > 0 
              ? 'bg-primary border-primary group-hover:bg-primary/80' 
              : 'bg-muted border-border'
          }`}>
            <Zap className={`h-7 w-7 ${smartReviewCount > 0 ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
          </div>
          <span className="text-sm font-medium text-foreground">Revisão</span>
        </button>

        <button
          onClick={onAddQuestion}
          className="flex flex-col items-center gap-2 group"
        >
          <div className="w-16 h-16 rounded-full bg-accent/10 border-2 border-accent flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-all duration-200">
            <Plus className="h-7 w-7 text-accent group-hover:text-accent-foreground" />
          </div>
          <span className="text-sm font-medium text-foreground">Adicionar</span>
        </button>
      </div>

      {/* Stats Cards - Clean Design */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Total
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{totalQuestions}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Categorias
            </CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold">{categorias}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Fácil
            </CardTitle>
            <Award className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-success">{questoesFaceis}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Médio
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-info" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-info">{questoesMedias}</div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium text-muted-foreground">
              Difícil
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold text-warning">{questoesDificeis}</div>
          </CardContent>
        </Card>
      </div>

      {/* Smart Review Card */}
      {smartReviewCount > 0 && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Zap className="h-4 w-4 text-primary" />
              Revisão Inteligente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {smartReviewCount} questões para revisar baseadas nos seus erros.
            </p>
            <Button 
              onClick={handleSmartReview}
              disabled={smartLoading}
              className="w-full"
              size="sm"
            >
              <Zap className="h-4 w-4 mr-2" />
              {smartLoading ? 'Gerando...' : `Iniciar Revisão (${smartReviewCount})`}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Card de Revisão Diária */}
      {hasReview && dailyReview && (
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Calendar className="h-4 w-4 text-warning" />
              Revisão do Dia
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-muted-foreground">
              {dailyReview.question_ids.length} questões selecionadas para hoje.
            </p>
            <Button 
              onClick={onStartPractice} 
              variant="outline"
              className="w-full"
              size="sm"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Iniciar Revisão
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Play className="h-4 w-4 text-primary" />
              Iniciar Estudos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Pratique com questões ou configure um simulado.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={onStartPractice} 
                className="flex-1"
                disabled={totalQuestions === 0}
              >
                <Play className="h-4 w-4 mr-2" />
                Prática
              </Button>
              <Button 
                onClick={onCreateSimulado} 
                variant="outline"
                className="flex-1"
                disabled={totalQuestions < 5}
              >
                <Target className="h-4 w-4 mr-2" />
                Simulado
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base font-medium">
              <Layers className="h-4 w-4 text-accent" />
              Gerenciar Conteúdo
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Adicione ou importe questões para seu banco.
            </p>
            <div className="flex gap-3">
              <Button 
                onClick={onAddQuestion} 
                variant="outline"
                className="flex-1"
              >
                <Plus className="h-4 w-4 mr-2" />
                Nova
              </Button>
              <Button 
                onClick={onImportQuestions} 
                variant="outline"
                className="flex-1"
              >
                <Upload className="h-4 w-4 mr-2" />
                Importar
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Welcome Message */}
      {totalQuestions === 0 && (
        <Card className="border-2 border-dashed">
          <CardContent className="py-10 text-center space-y-4">
            <Brain className="h-12 w-12 mx-auto text-muted-foreground" />
            <div className="space-y-2">
              <h3 className="text-lg font-semibold">Bem-vindo ao NeuroQBank</h3>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                Comece adicionando questões para criar simulados e estudar.
              </p>
            </div>
            <Button onClick={onAddQuestion}>
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Questão
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
