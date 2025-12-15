import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, Calendar } from 'lucide-react';
import { format, subDays, subMonths, isAfter, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type TimeRange = '7d' | '30d' | '6m' | 'all';

interface Session {
  completed_at: string | Date;
  total_questions: number;
  correct_answers: number;
}

interface ProgressChartProps {
  sessions: Session[];
}

export const ProgressChart: React.FC<ProgressChartProps> = ({ sessions }) => {
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');

  const filteredData = useMemo(() => {
    if (!sessions || sessions.length === 0) return [];

    const now = new Date();
    let cutoffDate: Date;

    switch (timeRange) {
      case '7d':
        cutoffDate = subDays(now, 7);
        break;
      case '30d':
        cutoffDate = subDays(now, 30);
        break;
      case '6m':
        cutoffDate = subMonths(now, 6);
        break;
      default:
        cutoffDate = new Date(0); // All time
    }

    // Filtrar sessões por data
    const filtered = sessions.filter(session => {
      const sessionDate = typeof session.completed_at === 'string' 
        ? parseISO(session.completed_at) 
        : session.completed_at;
      return isAfter(sessionDate, cutoffDate);
    });

    // Agrupar por dia
    const groupedByDay = filtered.reduce((acc, session) => {
      const sessionDate = typeof session.completed_at === 'string' 
        ? parseISO(session.completed_at) 
        : session.completed_at;
      const date = format(sessionDate, 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { total: 0, correct: 0, sessions: 0 };
      }
      acc[date].total += session.total_questions;
      acc[date].correct += session.correct_answers;
      acc[date].sessions += 1;
      return acc;
    }, {} as Record<string, { total: number; correct: number; sessions: number }>);

    // Converter para array e formatar
    return Object.entries(groupedByDay)
      .map(([date, data]) => ({
        date,
        displayDate: format(parseISO(date), timeRange === '7d' ? 'EEE' : 'dd/MM', { locale: ptBR }),
        questoes: data.total,
        acuracia: Math.round((data.correct / data.total) * 100),
        sessoes: data.sessions
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [sessions, timeRange]);

  const timeRangeOptions: { value: TimeRange; label: string }[] = [
    { value: '7d', label: '7 dias' },
    { value: '30d', label: '30 dias' },
    { value: '6m', label: '6 meses' },
    { value: 'all', label: 'Tudo' }
  ];

  if (!sessions || sessions.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Progresso ao Longo do Tempo
          </CardTitle>
        </CardHeader>
        <CardContent className="py-12 text-center">
          <Calendar className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">
            Complete sessões de estudo para visualizar seu progresso
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle className="flex items-center gap-2 text-lg">
              <TrendingUp className="h-5 w-5 text-primary" />
              Progresso ao Longo do Tempo
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Questões respondidas por dia
            </p>
          </div>
          <div className="flex gap-1 bg-muted rounded-lg p-1">
            {timeRangeOptions.map(option => (
              <Button
                key={option.value}
                variant={timeRange === option.value ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setTimeRange(option.value)}
                className={`text-xs px-3 ${
                  timeRange === option.value 
                    ? 'bg-primary text-primary-foreground shadow-sm' 
                    : 'hover:bg-background'
                }`}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {filteredData.length > 0 ? (
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={filteredData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorQuestoes" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
              <XAxis 
                dataKey="displayDate" 
                tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={false}
              />
              <YAxis 
                tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                axisLine={false}
                tickLine={false}
                width={45}
                tickFormatter={(value) => `${value}`}
                allowDecimals={false}
              />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-popover border border-border rounded-lg shadow-xl p-3">
                        <p className="font-semibold text-foreground text-sm mb-2">{data.date}</p>
                        <div className="space-y-1 text-sm">
                          <p>
                            <span className="text-muted-foreground">Questões:</span>{' '}
                            <span className="font-medium text-primary">{data.questoes}</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Acurácia:</span>{' '}
                            <span className="font-medium text-success">{data.acuracia}%</span>
                          </p>
                          <p>
                            <span className="text-muted-foreground">Sessões:</span>{' '}
                            <span className="font-medium">{data.sessoes}</span>
                          </p>
                        </div>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey="questoes"
                stroke="hsl(var(--primary))"
                strokeWidth={2.5}
                fillOpacity={1}
                fill="url(#colorQuestoes)"
                dot={{ r: 4, fill: 'hsl(var(--primary))', strokeWidth: 0 }}
                activeDot={{ r: 6, fill: 'hsl(var(--primary))', strokeWidth: 2, stroke: 'white' }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-50" />
              <p>Nenhum dado para o período selecionado</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
