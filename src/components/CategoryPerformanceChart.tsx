import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp } from 'lucide-react';

interface CategoryStat {
  categoria: string;
  accuracy: number;
  total_attempts: number;
  correct_attempts: number;
  unique_questions: number;
}

interface CategoryPerformanceChartProps {
  categoryStats: CategoryStat[];
}

export const CategoryPerformanceChart: React.FC<CategoryPerformanceChartProps> = ({
  categoryStats
}) => {
  // Preparar dados para o gráfico de barras
  const barData = categoryStats
    .filter(cat => cat.total_attempts > 0)
    .sort((a, b) => b.accuracy - a.accuracy)
    .slice(0, 10)
    .map(cat => ({
      name: cat.categoria.length > 20 
        ? cat.categoria.substring(0, 18) + '...' 
        : cat.categoria,
      fullName: cat.categoria,
      accuracy: Math.round(cat.accuracy),
      correct: cat.correct_attempts,
      incorrect: cat.total_attempts - cat.correct_attempts
    }));

  // Preparar dados para o radar chart (top 6 categorias)
  const radarData = categoryStats
    .filter(cat => cat.total_attempts > 0)
    .slice(0, 6)
    .map(cat => ({
      subject: cat.categoria.length > 15 
        ? cat.categoria.substring(0, 13) + '...' 
        : cat.categoria,
      accuracy: Math.round(cat.accuracy),
      fullMark: 100
    }));

  // Cores baseadas na acurácia
  const getBarColor = (accuracy: number) => {
    if (accuracy >= 70) return 'hsl(var(--success))'; // Verde
    if (accuracy >= 50) return 'hsl(var(--warning))'; // Amarelo
    return 'hsl(var(--destructive))'; // Vermelho
  };

  if (barData.length === 0) {
    return (
      <Card className="border-0 shadow-lg">
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">
            Responda questões para ver seu desempenho por categoria
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-lg bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Desempenho por Categoria
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Porcentagem de acertos em cada área de estudo
        </p>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="bar" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="bar">Barras</TabsTrigger>
            <TabsTrigger value="radar">Radar</TabsTrigger>
          </TabsList>

          <TabsContent value="bar">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart
                data={barData}
                layout="vertical"
                margin={{ top: 10, right: 30, left: 10, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" horizontal={true} vertical={false} />
                <XAxis 
                  type="number" 
                  domain={[0, 100]}
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  tickFormatter={(value) => `${value}%`}
                  tickCount={6}
                />
                <YAxis 
                  type="category" 
                  dataKey="name"
                  width={120}
                  tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-popover border border-border rounded-lg shadow-xl p-3">
                          <p className="font-semibold text-foreground text-sm mb-1">{data.fullName}</p>
                          <p className="text-sm">
                            <span className="text-success font-medium">{data.accuracy}%</span> de acertos
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {data.correct} corretas / {data.correct + data.incorrect} tentativas
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar dataKey="accuracy" radius={[0, 6, 6, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={getBarColor(entry.accuracy)} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </TabsContent>

          <TabsContent value="radar">
            {radarData.length >= 3 ? (
              <ResponsiveContainer width="100%" height={350}>
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                  <PolarGrid stroke="hsl(var(--border))" />
                  <PolarAngleAxis 
                    dataKey="subject" 
                    tick={{ fontSize: 11, fill: 'hsl(var(--foreground))' }}
                  />
                  <PolarRadiusAxis 
                    angle={90} 
                    domain={[0, 100]}
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Radar
                    name="Acurácia"
                    dataKey="accuracy"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.4}
                    strokeWidth={2}
                  />
                  <Legend />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="bg-popover border border-border rounded-lg shadow-xl p-3">
                            <p className="font-semibold text-foreground text-sm">
                              {payload[0].payload.subject}
                            </p>
                            <p className="text-sm text-primary font-medium">
                              {payload[0].value}% de acertos
                            </p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[350px] flex items-center justify-center text-muted-foreground">
                Necessário ao menos 3 categorias para o gráfico radar
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-center gap-4 mt-4 pt-4 border-t border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-xs text-muted-foreground">≥70% (Bom)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-xs text-muted-foreground">50-69% (Regular)</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-destructive" />
            <span className="text-xs text-muted-foreground">&lt;50% (Revisar)</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
