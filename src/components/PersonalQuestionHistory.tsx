import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { CheckCircle2, XCircle, Calendar, TrendingUp } from 'lucide-react';
import { useSmartReview } from '@/hooks/useSmartReview';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface PersonalQuestionHistoryProps {
  questionId: string;
  currentDifficulty: 'Fácil' | 'Médio' | 'Difícil';
  onDifficultyChange?: (difficulty: 'Fácil' | 'Médio' | 'Difícil') => void;
  isEditable?: boolean;
}

export const PersonalQuestionHistory: React.FC<PersonalQuestionHistoryProps> = ({
  questionId,
  currentDifficulty,
  onDifficultyChange,
  isEditable = true
}) => {
  const { getQuestionHistory } = useSmartReview();
  const [history, setHistory] = useState<{
    correctCount: number;
    incorrectCount: number;
    lastAttempt: Date | null;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      const data = await getQuestionHistory(questionId);
      setHistory(data);
      setLoading(false);
    };
    fetchHistory();
  }, [questionId, getQuestionHistory]);

  if (loading) {
    return (
      <div className="p-4 bg-muted/30 rounded-lg animate-pulse">
        <div className="h-4 bg-muted rounded w-1/2"></div>
      </div>
    );
  }

  const totalAttempts = history ? history.correctCount + history.incorrectCount : 0;
  const accuracy = totalAttempts > 0 ? (history!.correctCount / totalAttempts) * 100 : 0;

  return (
    <Card className="border-0 bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900/50 dark:to-slate-800/50 shadow-sm">
      <CardContent className="pt-4 space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Seu Histórico Pessoal
          </h4>
        </div>

        {history ? (
          <div className="grid grid-cols-2 gap-4">
            {/* Acertos */}
            <div className="flex items-center gap-3 p-3 bg-success/10 rounded-lg">
              <CheckCircle2 className="h-5 w-5 text-success" />
              <div>
                <p className="text-lg font-bold text-success">{history.correctCount}</p>
                <p className="text-xs text-muted-foreground">acerto{history.correctCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Erros */}
            <div className="flex items-center gap-3 p-3 bg-destructive/10 rounded-lg">
              <XCircle className="h-5 w-5 text-destructive" />
              <div>
                <p className="text-lg font-bold text-destructive">{history.incorrectCount}</p>
                <p className="text-xs text-muted-foreground">erro{history.incorrectCount !== 1 ? 's' : ''}</p>
              </div>
            </div>

            {/* Última tentativa */}
            {history.lastAttempt && (
              <div className="col-span-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-4 w-4" />
                <span>
                  Última resposta: {formatDistanceToNow(history.lastAttempt, { addSuffix: true, locale: ptBR })}
                </span>
              </div>
            )}

            {/* Taxa de acerto */}
            <div className="col-span-2">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs text-muted-foreground">Taxa de acerto</span>
                <span className={`text-xs font-semibold ${
                  accuracy >= 70 ? 'text-success' : accuracy >= 50 ? 'text-warning' : 'text-destructive'
                }`}>
                  {accuracy.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all ${
                    accuracy >= 70 ? 'bg-success' : accuracy >= 50 ? 'bg-warning' : 'bg-destructive'
                  }`}
                  style={{ width: `${accuracy}%` }}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-muted-foreground">
            <p className="text-sm">Primeira vez respondendo esta questão</p>
          </div>
        )}

        {/* Seletor de dificuldade manual */}
        {isEditable && (
          <div className="pt-3 border-t border-border/50">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Sua avaliação de dificuldade:</span>
              <Select
                value={currentDifficulty}
                onValueChange={(value) => onDifficultyChange?.(value as 'Fácil' | 'Médio' | 'Difícil')}
              >
                <SelectTrigger className="w-32 h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Fácil">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-success" />
                      Fácil
                    </div>
                  </SelectItem>
                  <SelectItem value="Médio">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-warning" />
                      Médio
                    </div>
                  </SelectItem>
                  <SelectItem value="Difícil">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-destructive" />
                      Difícil
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
