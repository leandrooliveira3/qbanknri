import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Question } from '@/types/question';
import { LoadingSkeleton } from '@/components/LoadingSkeleton';
import { QuestionFilters, QuestionFilterType, SortType } from '@/components/QuestionFilters';
import { BatchQuestionEditor } from '@/components/BatchQuestionEditor';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { 
  BookOpen, 
  Edit, 
  Trash2, 
  Eye, 
  Clock,
  Star,
  Tags,
  FileText,
  Edit3,
  Image as ImageIcon,
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
  const { favorites, loading: favoritesLoading, isFavorite, toggleFavorite } = useFavorites();
  
  const [activeFilter, setActiveFilter] = useState<QuestionFilterType>('recent');
  const [sortBy, setSortBy] = useState<SortType>('newest');
  const [showBatchEditor, setShowBatchEditor] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Set<string>>(new Set());

  // Filtrar e ordenar questões
  const filteredAndSortedQuestions = useMemo(() => {
    let filtered = [...questions];

    // Aplicar filtros
    switch (activeFilter) {
      case 'new':
        // Questões nunca respondidas (implementar com dados de tentativas futuramente)
        filtered = filtered.filter(q => !q.isFavorite); // Placeholder
        break;
      case 'most_errors':
        // Questões com mais erros (implementar com estatísticas futuramente)
        filtered = filtered.filter(q => q.dificuldade === 'Difícil'); // Placeholder
        break;
      case 'favorites':
        filtered = filtered.filter(q => isFavorite(q.id));
        break;
      case 'recent':
        // MODO ECONOMIA: 5 últimas + favoritas (reduz egress)
        const recent = [...filtered].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);
        const favorites = filtered.filter(q => isFavorite(q.id));
        const economyMap = new Map();
        [...recent, ...favorites].forEach(q => economyMap.set(q.id, q));
        filtered = Array.from(economyMap.values());
        break;
      case 'all':
      default:
        break;
    }

    // Aplicar ordenação
    switch (sortBy) {
      case 'oldest':
        filtered.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
        break;
      case 'difficulty':
        const difficultyOrder = { 'Fácil': 1, 'Médio': 2, 'Difícil': 3 };
        filtered.sort((a, b) => difficultyOrder[a.dificuldade] - difficultyOrder[b.dificuldade]);
        break;
      case 'category':
        filtered.sort((a, b) => a.categoria.localeCompare(b.categoria));
        break;
      case 'random':
        filtered = filtered.sort(() => Math.random() - 0.5);
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
        break;
    }

    return filtered;
  }, [questions, activeFilter, sortBy, isFavorite]);

  const handleBatchUpdate = async (updates: { id: string; data: Partial<Question> }[]) => {
    try {
      // Implementar updates em lote
      for (const update of updates) {
        await onEdit({ ...questions.find(q => q.id === update.id)!, ...update.data });
      }
      setShowBatchEditor(false);
    } catch (error) {
      toast({
        title: "Erro ao atualizar questões",
        description: "Tente novamente em alguns momentos",
        variant: "destructive"
      });
    }
  };

  const toggleQuestionExpanded = (questionId: string) => {
    const newExpanded = new Set(expandedQuestions);
    if (newExpanded.has(questionId)) {
      newExpanded.delete(questionId);
    } else {
      newExpanded.add(questionId);
    }
    setExpandedQuestions(newExpanded);
  };

  if (loading && questions.length === 0) {
    return <LoadingSkeleton />;
  }

  if (showBatchEditor) {
    return (
      <BatchQuestionEditor
        questions={questions.slice(0, 10)} // Últimas 10 para edição em lote
        onUpdate={handleBatchUpdate}
        onClose={() => setShowBatchEditor(false)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="h-6 w-6" />
            Banco de Questões
          </h2>
          {activeFilter === 'recent' && (
            <Badge variant="outline" className="bg-success/10 text-success border-success/20">
              💚 Modo Economia
            </Badge>
          )}
        </div>
        <div className="flex gap-2">
          {activeFilter === 'recent' ? (
            <Button
              onClick={() => setActiveFilter('all')}
              variant="outline"
              size="sm"
            >
              Ver Todas
            </Button>
          ) : (
            <Button
              onClick={() => setActiveFilter('recent')}
              variant="outline"
              size="sm"
              className="bg-success/10 text-success border-success/20 hover:bg-success/20"
            >
              💚 Ativar Modo Economia
            </Button>
          )}
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setShowBatchEditor(true)}
            className="flex items-center gap-2"
          >
            <Edit3 className="h-4 w-4" />
            Edição em Lote
          </Button>
        </div>
      </div>

      <QuestionFilters
        activeFilter={activeFilter}
        sortBy={sortBy}
        onFilterChange={setActiveFilter}
        onSortChange={setSortBy}
        totalQuestions={questions.length}
        filteredCount={filteredAndSortedQuestions.length}
      />

      <div className="space-y-4">
        {filteredAndSortedQuestions.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-8">
              <Filter className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma questão encontrada</h3>
              <p className="text-sm text-muted-foreground text-center">
                Tente ajustar os filtros ou adicione novas questões
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredAndSortedQuestions.map((question) => (
            <Card key={question.id} className="border-l-4 border-l-primary/20">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{question.categoria}</Badge>
                    <Badge variant={question.dificuldade === 'Fácil' ? 'default' : question.dificuldade === 'Médio' ? 'secondary' : 'destructive'}>
                      {question.dificuldade}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(question.id)}
                      className={isFavorite(question.id) ? 'text-yellow-500' : 'text-muted-foreground'}
                    >
                      <Star className={`h-4 w-4 ${isFavorite(question.id) ? 'fill-current' : ''}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <RichText content={question.enunciado} />
                </div>

                {/* Imagens do enunciado - Responsivas */}
                {question.imagem && question.imagem.length > 0 && (
                  <div className="my-3 sm:my-4 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                    {question.imagem.map((img, index) => (
                      <img 
                        key={index}
                        src={img} 
                        alt={`Imagem da questão ${index + 1}`}
                        className="w-full h-auto max-h-48 sm:max-h-64 md:max-h-80 object-contain rounded-lg border"
                        loading="lazy"
                      />
                    ))}
                  </div>
                )}

                {/* Alternativas - Aristo Style com círculos */}
                <div className="space-y-3">
                  {question.alternativas.map((alt, index) => {
                    const letter = String.fromCharCode(65 + index);
                    const isCorrect = letter === question.gabarito;
                    
                    return (
                      <div
                        key={index}
                        className={`flex items-center gap-4 p-4 rounded-xl border transition-all ${
                          isCorrect 
                            ? 'bg-success/10 border-success' 
                            : 'bg-card border-border'
                        }`}
                      >
                        {/* Letter Circle - Aristo Style */}
                        <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 text-sm font-bold shrink-0 ${
                          isCorrect 
                            ? 'bg-success text-success-foreground border-success' 
                            : 'bg-primary/10 text-primary border-primary'
                        }`}>
                          {letter}
                        </div>
                        
                        <div className="flex-1 text-sm sm:text-base break-words overflow-hidden">
                          <RichText content={alt} />
                        </div>
                        
                        {isCorrect && (
                          <Badge variant="default" className="bg-success text-success-foreground shrink-0">
                            Gabarito
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Comentário Colapsável - Responsivo */}
                <div className="border-t pt-3 sm:pt-4">
                  {expandedQuestions.has(question.id) ? (
                    <div className="space-y-3">
                      <div className="bg-muted/30 p-3 sm:p-4 md:p-5 rounded-lg">
                        <h4 className="font-semibold mb-2 flex items-center gap-2 text-sm sm:text-base">
                          <MessageSquare className="h-4 w-4 shrink-0" />
                          Comentário:
                        </h4>
                        <div className="text-sm sm:text-base break-words overflow-hidden">
                          <RichText content={question.comentario} />
                        </div>
                      </div>
                      
                      {/* Imagens do comentário - Responsivas */}
                      {question.comentarioImagem && question.comentarioImagem.length > 0 && (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                          {question.comentarioImagem.map((img, index) => (
                            <img 
                              key={index}
                              src={img} 
                              alt={`Imagem do comentário ${index + 1}`}
                              className="w-full h-auto max-h-48 sm:max-h-64 md:max-h-80 object-contain rounded-lg border"
                              loading="lazy"
                            />
                          ))}
                        </div>
                      )}
                      
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleQuestionExpanded(question.id)}
                        className="w-full text-xs sm:text-sm"
                      >
                        <ChevronUp className="h-4 w-4 mr-2" />
                        Ocultar Comentário
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleQuestionExpanded(question.id)}
                      className="w-full text-xs sm:text-sm"
                    >
                      <ChevronDown className="h-4 w-4 mr-2" />
                      Ver Comentário
                    </Button>
                  )}
                </div>

                {/* Tags */}
                {question.tags && question.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {question.tags.map((tag, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        <Tags className="h-3 w-3 mr-1" />
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Ações - Responsivas */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-3 sm:pt-4">
                  <div className="text-xs sm:text-sm text-muted-foreground break-words max-w-full sm:max-w-[60%]">
                    {question.fonte && <span>Fonte: {question.fonte}</span>}
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" size="sm" onClick={() => onEdit(question)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                      <Edit className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Editar
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => onDelete(question.id)} className="flex-1 sm:flex-none text-xs sm:text-sm">
                      <Trash2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      Excluir
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}

        {hasMore && (
          <div className="flex justify-center">
            <Button onClick={onLoadMore} disabled={loading}>
              {loading ? 'Carregando...' : 'Carregar Mais'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};