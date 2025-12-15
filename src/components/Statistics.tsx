import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useStatistics } from '@/hooks/useStatistics';
import { DetailedStatistics } from './DetailedStatistics';
import { CategoryPerformanceChart } from './CategoryPerformanceChart';
import { ProgressChart } from './ProgressChart';
import { 
  BarChart3, 
  Target, 
  Clock, 
  TrendingUp, 
  Brain,
  Calendar,
  Award,
  Activity,
  BookOpen,
  HelpCircle
} from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import ErrorBoundary from '@/components/ErrorBoundary';

export const Statistics: React.FC = () => {
  const { stats, loading } = useStatistics();

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-medical">Carregando Estatísticas...</h1>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="space-y-6">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-medical mb-4">Estatísticas</h1>
          <p className="text-muted-foreground">Nenhuma estatística disponível ainda.</p>
          <p className="text-sm text-muted-foreground mt-2">
            Comece respondendo questões para ver seu desempenho!
          </p>
        </div>
      </div>
    );
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  const getAccuracyColor = (accuracy: number) => {
    if (accuracy >= 80) return 'text-success';
    if (accuracy >= 60) return 'text-warning';
    return 'text-destructive';
  };

  // Dados para gráfico de pizza - Progresso Geral (sem hooks)
  const progressPieData = (() => [
    { name: 'Respondidas', value: stats?.unique_questions_answered ?? 0, color: 'hsl(var(--primary))' },
    { name: 'Não Respondidas', value: Math.max(0, (stats?.category_stats || []).reduce((sum, cat) => sum + cat.questions_remaining, 0)), color: 'hsl(var(--muted))' }
  ])();

  // Dados para gráfico de pizza - Desempenho (sem hooks)
  const performancePieData = (() => [
    { name: 'Corretas', value: stats?.total_correct ?? 0, color: 'hsl(var(--success))' },
    { name: 'Incorretas', value: Math.max(0, (stats?.total_attempts ?? 0) - (stats?.total_correct ?? 0)), color: 'hsl(var(--destructive))' }
  ])();

  return (
    <ErrorBoundary fallback={(
      <Card>
        <CardContent className="py-8 text-center">
          <p className="font-semibold">Não foi possível carregar as estatísticas</p>
          <p className="text-sm text-muted-foreground">Tente novamente mais tarde.</p>
        </CardContent>
      </Card>
    )}>
      {(() => {
        try {
          return (
    <div className="space-y-6">
      <div className="text-center py-6">
        <h1 className="text-4xl font-bold flex items-center justify-center gap-3 text-primary">
          <BarChart3 className="h-10 w-10" />
          Estatísticas de Desempenho
        </h1>
        <p className="text-muted-foreground mt-3 text-lg">
          Acompanhe sua evolução e desempenho nas questões
        </p>
      </div>

      {/* Cards de Resumo Modernos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        <Card className="border-0 shadow-lg bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col space-y-2">
                  <p className="text-xs font-bold text-primary uppercase tracking-wider">Questões Únicas</p>
                  <p className="text-4xl font-bold text-primary">{stats.unique_questions_answered}</p>
                </div>
                <div className="p-3 rounded-2xl bg-primary/20">
                  <Brain className="h-6 w-6 text-primary" />
                </div>
              </div>
              <p className="text-sm text-primary/70 font-medium">
                {stats.total_attempts} tentativas no total
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-success/10 to-success/5">
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col space-y-2">
                  <p className="text-xs font-bold text-success uppercase tracking-wider">Acurácia Geral</p>
                  <p className="text-4xl font-bold text-success">
                    {stats.overall_accuracy.toFixed(1)}%
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-success/20">
                  <Target className="h-6 w-6 text-success" />
                </div>
              </div>
              <p className="text-sm text-success/70 font-medium">
                {stats.total_correct} respostas corretas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-info/10 to-info/5">
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col space-y-2">
                  <p className="text-xs font-bold text-info uppercase tracking-wider">Sessões de Prática</p>
                  <p className="text-4xl font-bold text-info">{stats.total_practice_sessions}</p>
                </div>
                <div className="p-3 rounded-2xl bg-info/20">
                  <Activity className="h-6 w-6 text-info" />
                </div>
              </div>
              <p className="text-sm text-info/70 font-medium">
                Concluídas
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg bg-gradient-to-br from-warning/10 to-warning/5">
          <CardContent className="pt-6">
            <div className="flex flex-col space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex flex-col space-y-2">
                  <p className="text-xs font-bold text-warning uppercase tracking-wider">Simulados</p>
                  <p className="text-4xl font-bold text-warning">{stats.total_simulados}</p>
                </div>
                <div className="p-3 rounded-2xl bg-warning/20">
                  <Award className="h-6 w-6 text-warning" />
                </div>
              </div>
              <p className="text-sm text-warning/70 font-medium">
                Realizados
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="categories">Por Categoria</TabsTrigger>
          <TabsTrigger value="sessions">Sessões</TabsTrigger>
          <TabsTrigger value="detailed">Detalhada</TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          {/* Gráfico de Progresso com Filtros */}
          <ProgressChart sessions={stats.recent_sessions || []} />

          <div className="grid gap-6 md:grid-cols-2">
            {/* Gráfico de Pizza - Progresso Geral */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Cobertura do Banco</CardTitle>
                <p className="text-xs text-muted-foreground">Questões respondidas de {progressPieData.reduce((sum, d) => sum + d.value, 0)} no total</p>
              </CardHeader>
              <CardContent>
                {progressPieData.reduce((sum, d) => sum + d.value, 0) > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={progressPieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {progressPieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-xl p-2">
                                <p className="text-sm font-medium">{payload[0].name}: {payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    Nenhum dado disponível ainda
                  </div>
                )}
                <div className="flex justify-center gap-6 mt-2">
                  {progressPieData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Gráfico de Pizza - Desempenho */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-base">Desempenho Geral</CardTitle>
                <p className="text-xs text-muted-foreground">Respostas Corretas vs Incorretas</p>
              </CardHeader>
              <CardContent>
                {stats.total_attempts > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={performancePieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        paddingAngle={2}
                      >
                        {performancePieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            return (
                              <div className="bg-popover border border-border rounded-lg shadow-xl p-2">
                                <p className="text-sm font-medium">{payload[0].name}: {payload[0].value}</p>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="text-center text-muted-foreground py-10">
                    Nenhum dado disponível ainda
                  </div>
                )}
                <div className="flex justify-center gap-6 mt-2">
                  {performancePieData.map((entry, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="text-xs text-muted-foreground">{entry.name}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          {/* Gráfico de Barras/Radar por Categoria */}
          <CategoryPerformanceChart categoryStats={stats.category_stats} />

          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-base">Lista Detalhada por Categoria</CardTitle>
              <p className="text-xs text-muted-foreground">Porcentagem de acerto por área de estudo</p>
            </CardHeader>
            <CardContent>
              {stats.category_stats.length > 0 ? (
                <div className="space-y-3">
                  {stats.category_stats.slice(0, 12).map((category) => (
                    <div key={category.categoria} className="flex items-center justify-between p-3 bg-muted/30 rounded-xl hover:bg-muted/50 transition-colors">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{category.categoria}</p>
                        <p className="text-xs text-muted-foreground">
                          {category.correct_attempts}/{category.total_attempts} acertos • {category.unique_questions} únicas • {category.questions_remaining} restantes
                        </p>
                      </div>
                      <div className="text-right">
                        <p className={`text-sm font-bold ${getAccuracyColor(category.accuracy)}`}>{category.accuracy.toFixed(1)}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-center text-muted-foreground py-8">
                  Nenhuma categoria com dados ainda
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Sessões Recentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recent_sessions && stats.recent_sessions.length > 0 ? stats.recent_sessions.map((session: any, index) => (
                  <div key={`${session.id}-${index}`} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Badge variant={session.type === 'practice' ? 'secondary' : 'default'}>
                        {session.type === 'practice' ? 'Prática' : 'Simulado'}
                      </Badge>
                      <div>
                        <p className="font-medium text-sm">
                          {session.session_name || session.config_name || 'Sessão sem nome'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.completed_at ? new Date(session.completed_at).toLocaleDateString('pt-BR') : 'Data não disponível'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-medium ${getAccuracyColor((session.correct_answers / session.total_questions) * 100)}`}>
                        {session.correct_answers}/{session.total_questions}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {((session.correct_answers / session.total_questions) * 100).toFixed(1)}%
                      </p>
                      {session.total_time && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTime(session.total_time)}
                        </p>
                      )}
                    </div>
                  </div>
                )) : (
                  <p className="text-center text-muted-foreground py-8">
                    Nenhuma sessão concluída ainda
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="detailed">
          <DetailedStatistics />
        </TabsContent>
      </Tabs>

      {stats.avg_time_per_question && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tempo Médio por Questão
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center">
              <p className="text-3xl font-bold text-medical">
                {formatTime(Math.round(stats.avg_time_per_question))}
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Com base em {stats.total_attempts} tentativas
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
          );
        } catch (e) {
          console.error('Statistics render error', e);
          throw e;
        }
      })()}
    </ErrorBoundary>
  );
};