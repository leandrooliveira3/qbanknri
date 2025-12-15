import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Question } from '@/types/question';
import { Settings, Play, RefreshCw, Clock, Star, Target, ArrowLeft } from 'lucide-react';
import { useStatistics } from '@/hooks/useStatistics';
import { useCategories } from '@/hooks/useCategories';
import { useDailyReview } from '@/hooks/useDailyReview';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { ThemeSelectorPopover } from '@/components/ThemeSelectorPopover';

interface PracticeConfigProps {
  questions: Question[];
  loading: boolean;
  loadQuestionsByCategory: (categoria: string, quantidade: number) => Promise<Question[]>;
  getAllCategories: () => Promise<string[]>;
  getAllCategoriesWithCounts: () => Promise<{categoria: string; count: number}[]>; // ✅ Nova prop
  onStartPractice: (filteredQuestions: Question[]) => void;
  onBack: () => void;
}

const QUESTION_COUNTS = [5, 10, 15, 20, 25, 30];

export const PracticeConfig: React.FC<PracticeConfigProps> = ({ 
  questions, 
  loading,
  loadQuestionsByCategory,
  getAllCategories,
  getAllCategoriesWithCounts, // ✅ Nova prop
  onStartPractice, 
  onBack 
}) => {
  const { stats, getAnsweredQuestionIds, getMostMissedQuestionIds } = useStatistics();
  const { toast } = useToast();
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedSubcategories, setSelectedSubcategories] = useState<string[]>([]);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [questionMode, setQuestionMode] = useState<'all' | 'new' | 'reviewed' | 'most_errors' | 'daily_review'>('all');
  const { dailyReview, hasReview, getReviewQuestions, generateDailyReview } = useDailyReview();
  const [questionCount, setQuestionCount] = useState<number>(10);
  const [selectedTypes, setSelectedTypes] = useState({
    novas: true,
    dificuldade: false
  });
  const [loadingMore, setLoadingMore] = useState<string | null>(null);
  const [allCategories, setAllCategories] = useState<string[]>([]);
  const [categoriesWithCounts, setCategoriesWithCounts] = useState<{categoria: string; count: number}[]>([]);
  const { categories: userCategories } = useCategories();

  // Carregar categorias com contagens reais do banco e mesclar com categorias do usuário
  useEffect(() => {
    const loadCategories = async () => {
      const categoriesData = await getAllCategoriesWithCounts();
      setCategoriesWithCounts(categoriesData);
      const merged = Array.from(new Set([...(userCategories || []), ...categoriesData.map(c => c.categoria)]));
      setAllCategories(merged);
    };
    loadCategories();
  }, [userCategories]);

  // ✅ Usar cache de categorias independente (não depende do cache de questões limitado)
  const availableCategories = Array.from(
    new Set([
      ...allCategories,
      ...questions.map(q => q.categoria),
    ])
  ).sort();

  // Obter subcategorias disponíveis
  const availableSubcategories = Array.from(
    new Set(questions.filter(q => q.subcategoria).map(q => q.subcategoria!))
  ).sort();

  // ✅ Usar contagens reais do banco (não do array local limitado)
  const getQuestionsByCategory = (categoria: string) => {
    const fromServer = categoriesWithCounts.find(c => c.categoria === categoria);
    if (fromServer) return fromServer.count;
    // Fallback para contagem local
    return questions.filter(q => q.categoria === categoria).length;
  };

  // Obter questões por subcategoria
  const getQuestionsBySubcategory = (subcategoria: string) => {
    return questions.filter(q => q.subcategoria === subcategoria).length;
  };

  const handleCategoryToggle = (categoria: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoria) 
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  const handleSubcategoryToggle = (subcategoria: string) => {
    setSelectedSubcategories(prev => 
      prev.includes(subcategoria) 
        ? prev.filter(s => s !== subcategoria)
        : [...prev, subcategoria]
    );
  };

  const handleLoadMoreQuestions = async (categoria: string) => {
    setLoadingMore(categoria);
    try {
      // Carregar mais questões dessa categoria (buscamos o dobro das atuais para garantir mais diversidade)
      const currentCount = getQuestionsByCategory(categoria);
      const targetCount = Math.max(currentCount * 2, questionCount);
      await loadQuestionsByCategory(categoria, targetCount);
    } catch (error) {
      console.error('Erro ao carregar mais questões:', error);
    } finally {
      setLoadingMore(null);
    }
  };

  // Fisher-Yates shuffle (algoritmo confiável)
  const fisherYatesShuffle = <T,>(array: T[]): T[] => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  const handleStartPractice = async () => {
    try {
      // Modo Revisão do Dia
      if (questionMode === 'daily_review') {
        if (!dailyReview) {
          const generated = await generateDailyReview();
          if (!generated) return;
        }
        
        const reviewQuestions = await getReviewQuestions();
        if (reviewQuestions.length === 0) {
          return;
        }
        
        const shuffled = fisherYatesShuffle(reviewQuestions);
        onStartPractice(shuffled);
        return;
      }

      // ✅ Para questões novas, buscar direto do banco usando os IDs respondidos
      if (questionMode === 'new') {
        const answeredIds = await getAnsweredQuestionIds();
        
        // Construir query do banco para questões não respondidas
        let query = supabase
          .from('questions')
          .select('*');
        
        // Filtro de IDs não respondidos (se houver algum já respondido)
        if (answeredIds.size > 0) {
          const answeredArray = Array.from(answeredIds);
          query = query.not('id', 'in', `(${answeredArray.join(',')})`);
        }
        
        // Aplicar filtros
        if (selectedCategories.length > 0) {
          query = query.in('categoria', selectedCategories);
        }
        if (selectedSubcategories.length > 0) {
          query = query.in('subcategoria', selectedSubcategories);
        }
        if (selectedDifficulty !== 'all') {
          query = query.eq('dificuldade', selectedDifficulty as 'Fácil' | 'Médio' | 'Difícil');
        }
        
        // Buscar questões novas do banco
        const { data: newQuestions, error } = await query.limit(questionCount * 2);
        
        if (error) {
          console.error('Erro ao buscar questões novas:', error);
          toast({
            title: "Erro ao carregar questões",
            description: "Tente novamente em alguns instantes",
            variant: "destructive"
          });
          return;
        }
        
        if (!newQuestions || newQuestions.length === 0) {
          toast({
            title: "Sem questões novas",
            description: "Você já respondeu todas as questões com esses filtros!",
            variant: "default"
          });
          return;
        }
        
        const formattedQuestions = newQuestions.map((q: any) => ({
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
        
        const shuffled = fisherYatesShuffle(formattedQuestions);
        const selectedQuestions = shuffled.slice(0, questionCount);
        onStartPractice(selectedQuestions);
        return;
      }

      // Para outros modos, usar o array local
      let filteredQuestions = [...questions];

      if (questionMode === 'reviewed') {
        const answeredIds = await getAnsweredQuestionIds();
        filteredQuestions = filteredQuestions.filter(q => answeredIds.has(q.id));
      } else if (questionMode === 'most_errors') {
        const mostMissedIds = await getMostMissedQuestionIds();
        if (mostMissedIds.length > 0) {
          filteredQuestions = filteredQuestions.filter(q => mostMissedIds.includes(q.id));
        } else {
          filteredQuestions = filteredQuestions.filter(q => 
            q.dificuldade === 'Difícil' || q.dificuldade === 'Médio'
          );
        }
      }

      // Filtrar por categoria
      if (selectedCategories.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
          selectedCategories.includes(q.categoria as any)
        );
      }

      // Filtrar por subcategoria
      if (selectedSubcategories.length > 0) {
        filteredQuestions = filteredQuestions.filter(q => 
          q.subcategoria && selectedSubcategories.includes(q.subcategoria)
        );
      }

      // Filtrar por dificuldade
      if (selectedDifficulty !== 'all') {
        filteredQuestions = filteredQuestions.filter(q => 
          q.dificuldade === selectedDifficulty
        );
      }

      // Se não há questões suficientes, carregar mais
      if (filteredQuestions.length < questionCount && selectedCategories.length > 0) {
        const allQuestionsFromCategories = [];
        
        for (const categoria of selectedCategories) {
          const questoesNecessarias = Math.ceil(questionCount / selectedCategories.length);
          const questoesDaCategoria = await loadQuestionsByCategory(categoria, questoesNecessarias);
          allQuestionsFromCategories.push(...questoesDaCategoria);
        }
        
        filteredQuestions = allQuestionsFromCategories;
        
        // Aplicar filtros novamente
        if (questionMode === 'reviewed') {
          const answeredIds = await getAnsweredQuestionIds();
          filteredQuestions = filteredQuestions.filter(q => answeredIds.has(q.id));
        } else if (questionMode === 'most_errors') {
          const mostMissedIds = await getMostMissedQuestionIds();
          if (mostMissedIds.length > 0) {
            filteredQuestions = filteredQuestions.filter(q => mostMissedIds.includes(q.id));
          }
        }

        if (selectedSubcategories.length > 0) {
          filteredQuestions = filteredQuestions.filter(q => 
            q.subcategoria && selectedSubcategories.includes(q.subcategoria)
          );
        }

        if (selectedDifficulty !== 'all') {
          filteredQuestions = filteredQuestions.filter(q => 
            q.dificuldade === selectedDifficulty
          );
        }
      }

      // Remover duplicatas
      const uniqueQuestions = Array.from(
        new Map(filteredQuestions.map(q => [q.id, q])).values()
      );

      // Embaralhar
      const shuffled = fisherYatesShuffle(uniqueQuestions);
      const selectedQuestions = shuffled.slice(0, questionCount);

      onStartPractice(selectedQuestions);
    } catch (error) {
      console.error('Erro ao preparar questões para prática:', error);
    }
  };

  const getFilteredCount = () => {
    let filtered = [...questions];
    
    // ⚠️ Nota: Esta contagem é aproximada porque as funções async não podem ser usadas aqui
    // A contagem real será calculada quando o usuário clicar em "Iniciar Prática"
    
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(q => selectedCategories.includes(q.categoria as any));
    }

    if (selectedSubcategories.length > 0) {
      filtered = filtered.filter(q => q.subcategoria && selectedSubcategories.includes(q.subcategoria));
    }
    
    if (selectedDifficulty !== 'all') {
      filtered = filtered.filter(q => q.dificuldade === selectedDifficulty);
    }
    
    return filtered.length;
  };

  const filteredCount = getFilteredCount();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Configurar Prática</h1>
          <p className="text-muted-foreground mt-1">
            Selecione os temas e configure sua sessão de estudo
          </p>
        </div>
        <Button onClick={onBack} variant="ghost" size="sm" className="gap-2">
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Coluna da Esquerda - Seletor de Temas */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="border shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg font-medium">
                <Target className="h-5 w-5 text-primary" />
                Temas e Subtemas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ThemeSelectorPopover
                availableCategories={availableCategories}
                selectedCategories={selectedCategories}
                onCategoryToggle={handleCategoryToggle}
                getCategoryCount={getQuestionsByCategory}
                availableSubcategories={availableSubcategories}
                selectedSubcategories={selectedSubcategories}
                onSubcategoryToggle={handleSubcategoryToggle}
                getSubcategoryCount={getQuestionsBySubcategory}
              />
            </CardContent>
          </Card>

          {/* Botão Carregar Mais Questões */}
          {selectedCategories.length > 0 && (
            <Card className="border shadow-sm">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">{filteredCount}</span> questões disponíveis com os filtros atuais
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {selectedCategories.map(categoria => (
                      <Button
                        key={categoria}
                        variant="outline"
                        size="sm"
                        onClick={() => handleLoadMoreQuestions(categoria)}
                        disabled={loadingMore === categoria}
                        className="text-xs"
                      >
                        <RefreshCw className={`h-3 w-3 mr-1.5 ${loadingMore === categoria ? 'animate-spin' : ''}`} />
                        Carregar mais de {categoria.length > 20 ? categoria.slice(0, 20) + '...' : categoria}
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
                              
        {/* Coluna da Direita - Configurações */}
        <Card className="border shadow-sm h-fit sticky top-6">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg font-medium">Configurações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <label className="text-sm font-medium mb-3 block">
                Quantidade de questões
              </label>
              <Select value={questionCount.toString()} onValueChange={(value) => setQuestionCount(Number(value))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {QUESTION_COUNTS.map(count => (
                    <SelectItem key={count} value={count.toString()}>
                      {count} questões
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">
                Tipo de questões
              </label>
              <Select value={questionMode} onValueChange={(value: 'all' | 'new' | 'reviewed' | 'most_errors' | 'daily_review') => setQuestionMode(value as any)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4" />
                      Todas as questões
                    </div>
                  </SelectItem>
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Apenas novas questões
                    </div>
                  </SelectItem>
                  <SelectItem value="reviewed">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Revisar questões
                    </div>
                  </SelectItem>
                  <SelectItem value="most_errors">
                    <div className="flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Questões que mais erro
                    </div>
                  </SelectItem>
                  <SelectItem value="daily_review">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4" />
                      📅 Revisão do Dia
                      {hasReview && <Badge variant="destructive" className="ml-2 text-xs">Disponível</Badge>}
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">
                Opções Avançadas
              </label>
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <Checkbox
                    id="novas"
                    checked={selectedTypes.novas}
                    onCheckedChange={(checked) => 
                      setSelectedTypes(prev => ({ ...prev, novas: !!checked }))}
                  />
                  <Label htmlFor="novas" className="text-sm font-medium cursor-pointer">
                    Priorizar Questões Novas
                  </Label>
                </div>
                
                <div className="flex flex-wrap gap-2">
                  <Checkbox
                    id="dificuldade"
                    checked={selectedTypes.dificuldade}
                    onCheckedChange={(checked) => 
                      setSelectedTypes(prev => ({ ...prev, dificuldade: !!checked }))}
                  />
                  <Label htmlFor="dificuldade" className="text-sm font-medium cursor-pointer">
                    Focar em Questões com Maior Dificuldade
                  </Label>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-3 block">
                Dificuldade
              </label>
              <Select value={selectedDifficulty} onValueChange={setSelectedDifficulty}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="pt-5 border-t space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Questões disponíveis:</span>
                <span className="font-semibold">{filteredCount}</span>
              </div>
              
              <Button 
                onClick={handleStartPractice}
                disabled={filteredCount === 0 || loading}
                className="w-full h-11"
              >
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Carregando...' : 'Iniciar Prática'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};