import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Question, NeuroCategory } from '@/types/question';
import { Search, Edit, Heart, Trash2, BookOpen } from 'lucide-react';
import { useFavorites } from '@/hooks/useFavorites';
import { RichText } from './RichText';
import { CommentWithImage } from './CommentWithImage';
import { supabase } from '@/integrations/supabase/client';
import { LoadingSkeleton } from './LoadingSkeleton';

interface FavoriteQuestionsProps {
  questions: Question[];
  onEditQuestion: (question: Question) => void;
}

export const FavoriteQuestions: React.FC<FavoriteQuestionsProps> = ({
  questions,
  onEditQuestion
}) => {
  const { favoriteIds, toggleFavorite, clearAllFavorites, loading: favoritesLoading } = useFavorites();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | 'all'>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'all' | 'Fácil' | 'Médio' | 'Difícil'>('all');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [favoriteQuestions, setFavoriteQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);

  // ✅ Carregar questões favoritas diretamente do banco
  useEffect(() => {
    const loadFavorites = async () => {
      // Aguardar o hook useFavorites terminar de carregar
      if (favoritesLoading) {
        return;
      }

      if (favoriteIds.length === 0) {
        setFavoriteQuestions([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('questions')
          .select('*')
          .in('id', favoriteIds);

        if (error) throw error;

        const formattedQuestions: Question[] = (data || []).map((q: any) => ({
          id: q.id,
          categoria: q.categoria,
          subcategoria: q.subcategoria,
          enunciado: q.enunciado,
          alternativas: q.alternativas,
          gabarito: q.gabarito,
          comentario: q.comentario,
          comentarioImagem: q.comentario_imagem || [],
          dificuldade: q.dificuldade,
          tags: q.tags,
          fonte: q.fonte,
          imagem: q.imagem || [],
          referencias: q.referencias,
          createdAt: new Date(q.created_at)
        }));

        setFavoriteQuestions(formattedQuestions);
      } catch (error) {
        console.error('Erro ao carregar favoritas:', error);
        setFavoriteQuestions([]);
      } finally {
        setLoading(false);
      }
    };

    loadFavorites();
  }, [favoriteIds, favoritesLoading]);

  const categories = Array.from(new Set(favoriteQuestions.map(q => q.categoria)));

  const filteredQuestions = favoriteQuestions.filter(question => {
    const matchesSearch = question.enunciado.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.comentario.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.tags?.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || question.categoria === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || question.dificuldade === selectedDifficulty;

    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  const toggleComment = (questionId: string) => {
    setExpandedComments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(questionId)) {
        newSet.delete(questionId);
      } else {
        newSet.add(questionId);
      }
      return newSet;
    });
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Fácil': return 'bg-success text-success-foreground';
      case 'Médio': return 'bg-warning text-warning-foreground';
      case 'Difícil': return 'bg-destructive text-destructive-foreground';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (loading || favoritesLoading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-medical flex items-center gap-2">
            <Heart className="h-8 w-8 text-red-500 fill-current" />
            Questões Favoritas
          </h1>
          <p className="text-muted-foreground mt-1">
            {favoriteQuestions.length} questões favoritas • {filteredQuestions.length} filtradas
          </p>
        </div>
        {favoriteQuestions.length > 0 && (
          <Button 
            variant="outline" 
            onClick={clearAllFavorites}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Limpar Favoritos
          </Button>
        )}
      </div>

      {favoriteQuestions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-muted-foreground mb-2">
              Nenhuma questão favorita ainda
            </h2>
            <p className="text-muted-foreground">
              Marque questões como favoritas para vê-las aqui
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Filtros */}
          <Card>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar questões..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                
                <Select value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as string | 'all')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as categorias</SelectItem>
                    {categories.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={selectedDifficulty} onValueChange={(value) => setSelectedDifficulty(value as 'all' | 'Fácil' | 'Médio' | 'Difícil')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Dificuldade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as dificuldades</SelectItem>
                    <SelectItem value="Fácil">Fácil</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Difícil">Difícil</SelectItem>
                  </SelectContent>
                </Select>

                <div className="flex items-center text-sm text-muted-foreground">
                  {filteredQuestions.length} de {favoriteQuestions.length} questões
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lista de Questões */}
          <div className="grid gap-4">
            {filteredQuestions.map((question) => (
              <Card key={question.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline">{question.categoria}</Badge>
                      {question.subcategoria && (
                        <Badge variant="secondary">{question.subcategoria}</Badge>
                      )}
                      <Badge className={getDifficultyColor(question.dificuldade)}>
                        {question.dificuldade}
                      </Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => toggleFavorite(question.id)}
                        className="text-red-500 hover:text-red-600"
                      >
                        <Heart className="h-4 w-4 fill-current" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => onEditQuestion(question)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <RichText content={question.enunciado} />
                    </div>
                    
                    <div className="grid gap-2 text-sm">
                      {question.alternativas.map((alt, index) => {
                        const letter = String.fromCharCode(65 + index);
                        const isCorrect = question.gabarito === letter;
                        return (
                          <div 
                            key={index} 
                            className={`p-3 rounded-lg transition-all ${
                              isCorrect 
                                ? 'bg-success/10 text-success border border-success/20' 
                                : 'bg-muted/30 hover:bg-muted/50'
                            }`}
                          >
                            <span className="font-semibold text-primary">{letter})</span>{' '}
                            <RichText content={alt} />
                          </div>
                        );
                      })}
                    </div>

                    {question.imagem && question.imagem.length > 0 && (
                      <div className="my-4 space-y-2">
                        {question.imagem.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Imagem da questão ${index + 1}`}
                            className="max-w-full max-h-64 rounded-lg border shadow-sm"
                            loading="lazy"
                          />
                        ))}
                      </div>
                    )}

                    {/* Comentário colapsado por padrão (economia egress) */}
                    {question.comentario && (
                      !expandedComments.has(question.id) ? (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleComment(question.id)}
                          className="w-full"
                        >
                          <BookOpen className="h-4 w-4 mr-2" />
                          Ver Comentário
                        </Button>
                      ) : (
                        <div className="space-y-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleComment(question.id)}
                            className="w-full"
                          >
                            Ocultar Comentário
                          </Button>
                          <CommentWithImage 
                            comment={question.comentario}
                            commentImages={question.comentarioImagem}
                            fonte={question.fonte}
                            referencias={question.referencias}
                            questionId={question.id}
                            tags={question.tags}
                          />
                        </div>
                      )
                    )}

                    {question.tags && question.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 pt-2">
                        {question.tags.map(tag => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredQuestions.length === 0 && favoriteQuestions.length > 0 && (
            <Card>
              <CardContent className="py-8 text-center">
                <p className="text-muted-foreground">
                  Nenhuma questão favorita encontrada com os filtros aplicados.
                </p>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
};