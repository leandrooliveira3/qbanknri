import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Flame, Target, TrendingDown, TrendingUp, AlertTriangle } from 'lucide-react';
import { CategoryStats } from '@/types/statistics';

interface PerformanceHeatmapProps {
  categoryStats: CategoryStats[];
  onTrainWeaknesses: (categories: string[]) => void;
}

export const PerformanceHeatmap: React.FC<PerformanceHeatmapProps> = ({
  categoryStats,
  onTrainWeaknesses
}) => {
  // Categorizar por performance
  const getHeatColor = (accuracy: number) => {
    if (accuracy < 50) return { bg: 'bg-rose-500/20', border: 'border-rose-500/40', text: 'text-rose-600 dark:text-rose-400', label: 'Crítico' };
    if (accuracy < 70) return { bg: 'bg-amber-500/20', border: 'border-amber-500/40', text: 'text-amber-600 dark:text-amber-400', label: 'Atenção' };
    return { bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-600 dark:text-emerald-400', label: 'Bom' };
  };

  const getHeatIcon = (accuracy: number) => {
    if (accuracy < 50) return <TrendingDown className="h-4 w-4" />;
    if (accuracy < 70) return <AlertTriangle className="h-4 w-4" />;
    return <TrendingUp className="h-4 w-4" />;
  };

  // Filtrar categorias com tentativas
  const categoriesWithAttempts = categoryStats.filter(cat => cat.total_attempts > 0);
  
  // Ordenar por accuracy (pior primeiro)
  const sortedCategories = [...categoriesWithAttempts].sort((a, b) => a.accuracy - b.accuracy);

  // Categorias críticas (< 50%)
  const criticalCategories = sortedCategories.filter(cat => cat.accuracy < 50);

  const handleTrainWeaknesses = () => {
    const weakCategories = criticalCategories.map(cat => cat.categoria);
    onTrainWeaknesses(weakCategories);
  };

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Flame className="h-5 w-5 text-primary" />
            Mapa de Performance
          </CardTitle>
          {criticalCategories.length > 0 && (
            <Button 
              onClick={handleTrainWeaknesses}
              size="sm"
              className="bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700"
            >
              <Target className="h-4 w-4 mr-2" />
              Treinar Fraquezas ({criticalCategories.length})
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {sortedCategories.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Flame className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>Responda algumas questões para ver seu mapa de performance</p>
          </div>
        ) : (
          <>
            {/* Legenda */}
            <div className="flex items-center justify-center gap-6 pb-4 mb-4 border-b border-border/50">
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-rose-500/60" />
                <span>&lt;50% Crítico</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-amber-500/60" />
                <span>50-70% Atenção</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <div className="w-3 h-3 rounded bg-emerald-500/60" />
                <span>&gt;70% Bom</span>
              </div>
            </div>

            {/* Grid de categorias */}
            <div className="grid gap-3">
              {sortedCategories.map((category) => {
                const heat = getHeatColor(category.accuracy);
                
                return (
                  <div
                    key={category.categoria}
                    className={`p-4 rounded-xl border-2 ${heat.bg} ${heat.border} transition-all hover:scale-[1.01]`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className={heat.text}>{getHeatIcon(category.accuracy)}</span>
                        <span className="font-medium text-sm truncate">{category.categoria}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className={`${heat.text} border-current`}>
                          {category.accuracy.toFixed(0)}%
                        </Badge>
                      </div>
                    </div>
                    
                    <Progress 
                      value={category.accuracy} 
                      className="h-2 mb-2"
                    />
                    
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>
                        {category.correct_attempts}/{category.total_attempts} acertos
                      </span>
                      <span>
                        {category.questions_remaining} restantes
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Resumo */}
            <div className="pt-4 mt-4 border-t border-border/50 grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">
                  {sortedCategories.filter(c => c.accuracy >= 70).length}
                </p>
                <p className="text-xs text-muted-foreground">Dominadas</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/10">
                <p className="text-xl font-bold text-amber-600 dark:text-amber-400">
                  {sortedCategories.filter(c => c.accuracy >= 50 && c.accuracy < 70).length}
                </p>
                <p className="text-xs text-muted-foreground">Em progresso</p>
              </div>
              <div className="p-3 rounded-lg bg-rose-500/10">
                <p className="text-xl font-bold text-rose-600 dark:text-rose-400">
                  {criticalCategories.length}
                </p>
                <p className="text-xs text-muted-foreground">Precisam atenção</p>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};
