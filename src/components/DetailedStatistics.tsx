import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useStatistics } from '@/hooks/useStatistics';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { PerformanceHeatmap } from '@/components/PerformanceHeatmap';
import { BarChart3, Target, TrendingUp, Clock, Award, AlertCircle } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import ErrorBoundary from '@/components/ErrorBoundary';

interface DetailedStatisticsProps {
  onTrainWeaknesses?: (categories: string[]) => void;
}

export const DetailedStatistics: React.FC<DetailedStatisticsProps> = ({ onTrainWeaknesses }) => {
  const { stats, loading } = useStatistics();

  if (loading) {
    return <LoadingSkeleton />;
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhuma estatística disponível</h3>
          <p className="text-sm text-muted-foreground text-center">
            Complete algumas questões para ver suas estatísticas detalhadas
          </p>
        </CardContent>
      </Card>
    );
  }

  // Usar estatísticas reais do backend (sem hooks para evitar erro #310)
  const questionStats = (() => {
    const totalUniqueQuestions = stats?.unique_questions_answered ?? 0;
    const questionsAnsweredOnce = stats?.questions_answered_once ?? 0;
    const questionsAnsweredMultiple = stats?.questions_answered_multiple ?? 0;
    const questionsNeverSeen = Math.max(0, (stats?.category_stats || []).reduce((sum, cat) => sum + cat.questions_remaining, 0));
    return { totalUniqueQuestions, questionsAnsweredOnce, questionsAnsweredMultiple, questionsNeverSeen };
  })();

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getAccuracyColor = (accuracy: number): string => {
    if (accuracy >= 80) return 'text-success';
    if (accuracy >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <ErrorBoundary fallback={(
      <Card>
        <CardContent className="py-8 text-center">
          <p className="font-semibold">Não foi possível carregar as estatísticas</p>
          <p className="text-sm text-muted-foreground">Tente novamente mais tarde.</p>
        </CardContent>
      </Card>
    )}>
      <div className="space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="h-6 w-6 text-primary" />
        <h2 className="text-2xl font-bold">Estatísticas Detalhadas</h2>
      </div>

      <Tabs defaultValue="question-breakdown" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="question-breakdown">Por Questão</TabsTrigger>
          <TabsTrigger value="performance-trends">Tendências</TabsTrigger>
          <TabsTrigger value="time-analysis">Tempo</TabsTrigger>
        </TabsList>

        <TabsContent value="question-breakdown" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Cobertura do Banco de Questões
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {questionStats.questionsAnsweredOnce + questionStats.questionsAnsweredMultiple + questionStats.questionsNeverSeen > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Respondidas 1x', value: questionStats.questionsAnsweredOnce, color: 'hsl(var(--success))' },
                            { name: 'Respondidas 2+x', value: questionStats.questionsAnsweredMultiple, color: 'hsl(var(--warning))' },
                            { name: 'Não respondidas', value: questionStats.questionsNeverSeen, color: 'hsl(var(--muted))' }
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ name, percent }) => `${name} ${percent ? (percent * 100).toFixed(0) : '0'}%`}
                        >
                          {[
                            { name: 'Respondidas 1x', value: questionStats.questionsAnsweredOnce, color: 'hsl(var(--success))' },
                            { name: 'Respondidas 2+x', value: questionStats.questionsAnsweredMultiple, color: 'hsl(var(--warning))' },
                            { name: 'Não respondidas', value: questionStats.questionsNeverSeen, color: 'hsl(var(--muted))' }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <p className="text-center text-muted-foreground py-10">Sem dados suficientes para o gráfico</p>
                )}
                
                <div className="grid grid-cols-2 gap-4 pt-4">
                  <div className="text-center p-3 bg-success/10 rounded-lg">
                    <p className="text-2xl font-bold text-success">{questionStats.questionsAnsweredOnce}</p>
                    <p className="text-xs text-muted-foreground">Respondidas 1x</p>
                  </div>
                  <div className="text-center p-3 bg-warning/10 rounded-lg">
                    <p className="text-2xl font-bold text-warning">{questionStats.questionsAnsweredMultiple}</p>
                    <p className="text-xs text-muted-foreground">Respondidas 2+x</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5" />
                  Distribuição de Acertos
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {stats.category_stats.slice(0, 5).map((category) => (
                    <div key={category.categoria} className="space-y-2 p-3 bg-muted/30 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-sm truncate max-w-[200px]">{category.categoria}</span>
                        <span className={`font-medium ${getAccuracyColor(category.accuracy)}`}>
                          {category.accuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-xs">
                        <div className="text-center p-2 bg-success/10 rounded">
                          <p className="font-medium text-success">{category.unique_questions}</p>
                          <p className="text-muted-foreground">Únicas</p>
                        </div>
                        <div className="text-center p-2 bg-warning/10 rounded">
                          <p className="font-medium text-warning">{category.questions_answered_multiple}</p>
                          <p className="text-muted-foreground">Repetidas</p>
                        </div>
                        <div className="text-center p-2 bg-info/10 rounded">
                          <p className="font-medium text-info">{category.questions_remaining}</p>
                          <p className="text-muted-foreground">Restantes</p>
                        </div>
                      </div>
                      <div className="flex gap-2 text-xs text-muted-foreground">
                        <span>{category.correct_attempts}/{category.total_attempts} tentativas</span>
                        <Progress 
                          value={category.accuracy} 
                          className="h-1 flex-1"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Questões que Mais Precisa Estudar</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.category_stats
                  .filter(cat => cat.accuracy < 70)
                  .sort((a, b) => a.accuracy - b.accuracy)
                  .slice(0, 6)
                  .map((category) => (
                    <div key={category.categoria} className="flex items-center justify-between p-3 bg-destructive/5 rounded-lg border border-destructive/20">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{category.categoria}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.correct_attempts} acertos de {category.total_attempts} tentativas • {category.questions_remaining} questões restantes
                        </p>
                      </div>
                      <Badge variant="destructive" className="ml-2">
                        {category.accuracy.toFixed(1)}%
                      </Badge>
                    </div>
                  ))}
                {stats.category_stats.filter(cat => cat.accuracy < 70).length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <Award className="h-12 w-12 mx-auto mb-2 text-success" />
                    <p>Parabéns! Você está indo bem em todas as categorias!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance-trends" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Evolução da Performance
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-primary/10 rounded-lg">
                    <p className="text-2xl font-bold text-primary">{stats.overall_accuracy.toFixed(1)}%</p>
                    <p className="text-sm text-muted-foreground">Precisão Geral</p>
                  </div>
                  <div className="text-center p-4 bg-success/10 rounded-lg">
                    <p className="text-2xl font-bold text-success">{stats.total_practice_sessions}</p>
                    <p className="text-sm text-muted-foreground">Sessões de Prática</p>
                  </div>
                  <div className="text-center p-4 bg-accent/10 rounded-lg">
                    <p className="text-2xl font-bold text-accent">{stats.total_simulados}</p>
                    <p className="text-sm text-muted-foreground">Simulados</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Últimas Sessões</h4>
                  {stats.recent_sessions && stats.recent_sessions.length > 0 ? stats.recent_sessions.slice(0, 8).map((session: any, index) => (
                    <div key={`detail-${session.id}-${index}`} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${session.type === 'practice' ? 'bg-primary' : 'bg-accent'}`} />
                        <div>
                          <p className="text-sm font-medium">
                            {session.session_name || session.config_name || 'Sessão sem nome'}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.completed_at ? new Date(session.completed_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-medium ${getAccuracyColor((session.correct_answers / session.total_questions) * 100)}`}>
                          {((session.correct_answers / session.total_questions) * 100).toFixed(1)}%
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.correct_answers}/{session.total_questions}
                        </p>
                      </div>
                    </div>
                  )) : (
                    <p className="text-center text-muted-foreground py-8">
                      Nenhuma sessão recente disponível
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="time-analysis" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Análise de Tempo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.avg_time_per_question && (
                  <div className="text-center p-6 bg-info/10 rounded-lg">
                    <p className="text-3xl font-bold text-info">
                      {formatTime(Math.round(stats.avg_time_per_question))}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Tempo médio por questão
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {stats.category_stats
                    .filter(cat => cat.avg_time)
                    .sort((a, b) => (b.avg_time || 0) - (a.avg_time || 0))
                    .slice(0, 8)
                    .map((category) => (
                      <div key={category.categoria} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                        <div className="flex-1">
                          <p className="font-medium text-sm truncate max-w-[180px]">{category.categoria}</p>
                          <p className="text-xs text-muted-foreground">
                            {category.total_attempts} questões
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-medium">
                            {category.avg_time ? formatTime(Math.round(category.avg_time)) : '--'}
                          </p>
                          <p className="text-xs text-muted-foreground">tempo médio</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
    </ErrorBoundary>
  );
};