import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Question } from '@/types/question';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { QuestionFilters, QuestionFilterType, SortType } from '@/components/QuestionFilters';
import { BatchQuestionEditor } from '@/components/BatchQuestionEditor';
import { 
  BookOpen, 
  Edit, 
  Trash2, 
  Star,
  Tags,
  Edit3,
  Filter,
  MessageSquare,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { RichText } from '@/components/RichText';
import { useToast } from '@/hooks/use-toast';
import { useFavorites } from '@/hooks/useFavorites';

interface QuestionBankProps {
  questions: Question[];
  loading: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onEdit: (question: Question) => void;
  onDelete: (id: string) => void;
}

export const QuestionBank: React.FC<QuestionBankProps> = ({
  questions,
  loading,
  hasMore,
  onLoadMore,
  onEdit,
  onDelete
}) => {
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();

  const [activeFilter, setActiveFilter] = useState<QuestionFilterType>('recent');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showBatchEditor, setShowBatchEditor] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  const getTime = (q: Question) =>
    q.created_at ? new Date(q.created_at).getTime() : 0;

  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = [...questions];

    switch (activeFilter) {
      case 'favorites':
        filtered = filtered.filter(q => isFavorite(q.id));
        break;

      case 'recent': {
        const recent = [...filtered]
          .sort((a, b) => getTime(b) - getTime(a))
          .slice(0, 5);

        const favorites = filtered.filter(q => isFavorite(q.id));
        const map = new Map<string, Question>();
        [...recent, ...favorites].forEach(q => map.set(q.id, q));
        filtered = Array.from(map.values());
        break;
      }

      default:
        break;
    }

    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => getTime(a) - getTime(b));
        break;

      case 'difficulty': {
        const order = { 'Fácil': 1, 'Médio': 2, 'Difícil': 3 };
        filtered.sort((a, b) => order[a.dificuldade] - order[b.dificuldade]);
        break;
      }

      case 'category':
        filtered.sort((a, b) => a.categoria.localeCompare(b.categoria));
        break;

      case 'random':
        filtered.sort(() => Math.random() - 0.5);
        break;

      case 'newest':
      default:
        filtered.sort((a, b) => getTime(b) - getTime(a));
        break;
    }

    return filtered;
  }, [questions, activeFilter, sortBy, isFavorite]);

  const toggleExpanded = (id: string) => {
    setExpandedQuestions(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  if (loading && questions.length === 0) {
    return <LoadingSkeleton />;
  }

  if (showBatchEditor) {
    return (
      <BatchQuestionEditor
        questions={questions.slice(0, 10)}
        onUpdate={async () => setShowBatchEditor(false)}
        onClose={() => setShowBatchEditor(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <BookOpen className="h-6 w-6" />
          Banco de Questões
        </h2>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowBatchEditor(true)}
        >
          <Edit3 className="h-4 w-4 mr-2" />
          Edição em lote
        </Button>
      </div>

      <QuestionFilters
        activeFilter={activeFilter}
        sortBy={sortBy}
        onFilterChange={setActiveFilter}
        onSortChange={setSortBy}
        totalQuestions={questions.length}
        filteredCount={filteredAndSortedQuestions.length}
      />

      {filteredAndSortedQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-10 text-center">
            <Filter className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhuma questão encontrada</p>
          </CardContent>
        </Card>
      ) : (
        filteredAndSortedQuestions.map(q => (
          <Card key={q.id} className="border-l-4 border-l-primary/30">
            <CardHeader className="flex flex-row justify-between items-center">
              <div className="flex gap-2">
                <Badge variant="outline">{q.categoria}</Badge>
                <Badge>{q.dificuldade}</Badge>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => toggleFavorite(q.id)}
                className={isFavorite(q.id) ? 'text-yellow-500' : ''}
              >
                <Star className={`h-4 w-4 ${isFavorite(q.id) ? 'fill-current' : ''}`} />
              </Button>
            </CardHeader>

            <CardContent className="space-y-4">
              <RichText content={q.enunciado} />

              <div className="space-y-2">
                {(q.alternativas ?? []).map((alt, i) => {
                  const letter = String.fromCharCode(65 + i);
                  const correct = letter === q.gabarito;

                  return (
                    <div
                      key={i}
                      className={`p-3 rounded border ${
                        correct ? 'bg-success/10 border-success' : ''
                      }`}
                    >
                      <strong>{letter})</strong> <RichText content={alt} />
                    </div>
                  );
                })}
              </div>

              <div>
                {expandedQuestions.has(q.id) ? (
                  <>
                    <div className="bg-muted/40 p-4 rounded">
                      <MessageSquare className="inline mr-2 h-4 w-4" />
                      <RichText content={q.comentario} />
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleExpanded(q.id)}
                    >
                      <ChevronUp className="h-4 w-4 mr-2" />
                      Ocultar comentário
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleExpanded(q.id)}
                  >
                    <ChevronDown className="h-4 w-4 mr-2" />
                    Ver comentário
                  </Button>
                )}
              </div>

              {q.tags?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {q.tags.map((tag, i) => (
                    <Badge key={i} variant="outline">
                      <Tags className="h-3 w-3 mr-1" />
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <div className="flex gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => onEdit(q)}>
                  <Edit className="h-4 w-4 mr-1" /> Editar
                </Button>
                <Button size="sm" variant="outline" onClick={() => onDelete(q.id)}>
                  <Trash2 className="h-4 w-4 mr-1" /> Excluir
                </Button>
              </div>
            </CardContent>
          </Card>
        ))
      )}

      {hasMore && (
        <div className="flex justify-center">
          <Button onClick={onLoadMore} disabled={loading}>
            {loading ? 'Carregando…' : 'Carregar mais'}
          </Button>
        </div>
      )}
    </div>
  );
};
