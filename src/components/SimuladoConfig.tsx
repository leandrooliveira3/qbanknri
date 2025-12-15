import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Question, SimuladoConfig as SimuladoConfigType } from '@/types/question';
import { Target, Play, Settings, Clock, Download, RefreshCw } from 'lucide-react';

interface SimuladoConfigProps {
  questions: Question[];
  loading: boolean;
  loadQuestionsByCategory: (categoria: string, quantidade: number) => Promise<Question[]>;
  onStartSimulado: (config: SimuladoConfigType, selectedQuestions: Question[]) => void;
  onBack: () => void;
}

const QUESTION_COUNTS = [10, 15, 20, 25, 30, 40, 50];
const TIME_OPTIONS = [30, 45, 60, 90, 120]; // em minutos

export const SimuladoConfig: React.FC<SimuladoConfigProps> = ({
  questions, 
  loading,
  loadQuestionsByCategory,
  onStartSimulado, 
  onBack 
}) => {
  const [nome, setNome] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [numQuestoes, setNumQuestoes] = useState<number>(20);
  const [dificuldade, setDificuldade] = useState<'all' | 'Fácil' | 'Médio' | 'Difícil'>('all');
  const [hasTimeLimit, setHasTimeLimit] = useState(false);
  const [tempo, setTempo] = useState<number>(60);
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);

  // Obter categorias disponíveis
  const availableCategories = Array.from(
    new Set(questions.map(q => q.categoria))
  ).sort();

  // Obter questões por categoria
  const getQuestionsByCategory = (categoria: string) => {
    return questions.filter(q => q.categoria === categoria).length;
  };

  const handleCategoryToggle = (categoria: string) => {
    setSelectedCategories(prev => 
      prev.includes(categoria) 
        ? prev.filter(c => c !== categoria)
        : [...prev, categoria]
    );
  };

  const handleLoadMoreQuestions = async (categoria: string) => {
    setLoadingCategory(categoria);
    try {
      // Carregar mais questões dessa categoria (buscamos o dobro das atuais para garantir mais diversidade)
      const currentCount = getQuestionsByCategory(categoria);
      const targetCount = Math.max(currentCount * 2, numQuestoes);
      await loadQuestionsByCategory(categoria, targetCount);
    } catch (error) {
      console.error('Erro ao carregar mais questões:', error);
    } finally {
      setLoadingCategory(null);
    }
  };

  const getFilteredQuestions = () => {
    let filtered = [...questions];

    // Filtrar por categoria
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(q => selectedCategories.includes(q.categoria as any));
    }

    // Filtrar por dificuldade
    if (dificuldade !== 'all') {
      filtered = filtered.filter(q => q.dificuldade === dificuldade);
    }

    return filtered;
  };

  const handleStartSimulado = async () => {
    try {
      let filteredQuestions = getFilteredQuestions();
      
      // Se não há questões suficientes nas categorias selecionadas, carregar mais
      if (selectedCategories.length > 0 && filteredQuestions.length < numQuestoes) {
        const allQuestionsFromCategories = [];
        
        for (const categoria of selectedCategories) {
          const questoesNecessarias = Math.ceil(numQuestoes / selectedCategories.length);
          const questoesDaCategoria = await loadQuestionsByCategory(categoria, questoesNecessarias);
          allQuestionsFromCategories.push(...questoesDaCategoria);
        }
        
        // Aplicar filtros de dificuldade nas novas questões
        filteredQuestions = allQuestionsFromCategories;
        if (dificuldade !== 'all') {
          filteredQuestions = filteredQuestions.filter(q => q.dificuldade === dificuldade);
        }
      }
      
      // Embaralhar e selecionar questões
      const shuffled = filteredQuestions.sort(() => Math.random() - 0.5);
      const selectedQuestions = shuffled.slice(0, numQuestoes);

      const config: SimuladoConfigType = {
        nome: nome || 'Simulado Personalizado',
        categorias: selectedCategories,
        numQuestoes,
        dificuldade: dificuldade === 'all' ? undefined : dificuldade,
        tempo: hasTimeLimit ? tempo : undefined
      };

      onStartSimulado(config, selectedQuestions);
    } catch (error) {
      console.error('Erro ao preparar questões para simulado:', error);
    }
  };

  const filteredCount = getFilteredQuestions().length;
  const canStart = filteredCount >= numQuestoes && nome.trim();

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-medical">Criar Simulado</h1>
          <p className="text-muted-foreground mt-1">
            Configure um simulado personalizado
          </p>
        </div>
        <Button onClick={onBack} variant="outline">
          Voltar
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configurações Básicas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="nome">Nome do Simulado</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Simulado de Neurologia - Módulo 1"
                className="mt-2"
              />
            </div>

            <div>
              <Label className="text-sm font-medium mb-3 block">
                Número de questões
              </Label>
              <Select value={numQuestoes.toString()} onValueChange={(value) => setNumQuestoes(Number(value))}>
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
              <Label className="text-sm font-medium mb-3 block">
                Dificuldade
              </Label>
              <Select value={dificuldade} onValueChange={(value: any) => setDificuldade(value)}>
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

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Switch
                  id="time-limit"
                  checked={hasTimeLimit}
                  onCheckedChange={setHasTimeLimit}
                />
                <Label htmlFor="time-limit" className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Limite de tempo
                </Label>
              </div>
              
              {hasTimeLimit && (
                <Select value={tempo.toString()} onValueChange={(value) => setTempo(Number(value))}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {TIME_OPTIONS.map(time => (
                      <SelectItem key={time} value={time.toString()}>
                        {time} minutos
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between text-sm mb-4">
                <span>Questões disponíveis:</span>
                <Badge variant={filteredCount >= numQuestoes ? "default" : "destructive"}>
                  {filteredCount}
                </Badge>
              </div>
              
              <Button 
                onClick={handleStartSimulado}
                disabled={!canStart || loading}
                className="w-full bg-medical hover:bg-medical/90"
              >
                <Target className="h-4 w-4 mr-2" />
                {loading ? 'Carregando...' : 'Iniciar Simulado'}
              </Button>
              
              {!canStart && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  {!nome.trim() && "Informe o nome do simulado. "}
                  {filteredCount < numQuestoes && `Necessário pelo menos ${numQuestoes} questões.`}
                </p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categorias ({selectedCategories.length} selecionadas)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              <div className="flex items-center space-x-2 pb-2 border-b">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCategories(availableCategories as any)}
                  className="text-xs"
                >
                  Selecionar Todas
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setSelectedCategories([])}
                  className="text-xs"
                >
                  Limpar
                </Button>
              </div>
              
              {availableCategories.map(categoria => {
                const count = getQuestionsByCategory(categoria as any);
                const isSelected = selectedCategories.includes(categoria as any);
                
                return (
                  <div key={categoria} className="flex items-start space-x-3">
                    <Checkbox
                      id={categoria}
                      checked={isSelected}
                      onCheckedChange={() => handleCategoryToggle(categoria as any)}
                    />
                    <div className="flex-1 min-w-0">
                      <label 
                        htmlFor={categoria}
                        className="text-sm font-medium cursor-pointer block"
                      >
                        {categoria}
                      </label>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {count} questões
                        </Badge>
                        {isSelected && (
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => {
                              e.preventDefault();
                              handleLoadMoreQuestions(categoria as any);
                            }}
                            disabled={loadingCategory === categoria}
                            className="h-6 px-2 text-xs text-primary hover:text-primary/80"
                          >
                            {loadingCategory === categoria ? (
                              <RefreshCw className="h-3 w-3 animate-spin" />
                            ) : (
                              <>
                                <Download className="h-3 w-3 mr-1" />
                                +
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};