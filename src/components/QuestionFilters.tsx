import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Filter, ArrowUpDown, Star, AlertCircle, Shuffle } from 'lucide-react';

export type QuestionFilterType = 'all' | 'new' | 'most_errors' | 'favorites' | 'recent';
export type SortType = 'newest' | 'oldest' | 'difficulty' | 'category' | 'random';

interface QuestionFiltersProps {
  activeFilter: QuestionFilterType;
  sortBy: SortType;
  onFilterChange: (filter: QuestionFilterType) => void;
  onSortChange: (sort: SortType) => void;
  totalQuestions: number;
  filteredCount: number;
}

export const QuestionFilters: React.FC<QuestionFiltersProps> = ({
  activeFilter,
  sortBy,
  onFilterChange,
  onSortChange,
  totalQuestions,
  filteredCount
}) => {
  const filters = [
    { 
      key: 'all' as QuestionFilterType, 
      label: 'Todas', 
      icon: Filter,
      description: 'Todas as questões disponíveis'
    },
    { 
      key: 'new' as QuestionFilterType, 
      label: 'Novas', 
      icon: Shuffle,
      description: 'Questões nunca respondidas'
    },
    { 
      key: 'most_errors' as QuestionFilterType, 
      label: 'Mais Erro', 
      icon: AlertCircle,
      description: 'Questões com maior taxa de erro'
    },
    { 
      key: 'favorites' as QuestionFilterType, 
      label: 'Favoritas', 
      icon: Star,
      description: 'Questões marcadas como favoritas'
    },
    { 
      key: 'recent' as QuestionFilterType, 
      label: 'Recentes', 
      icon: ArrowUpDown,
      description: 'Últimas 5 questões adicionadas'
    }
  ];

  const sortOptions = [
    { value: 'newest', label: 'Mais Recentes' },
    { value: 'oldest', label: 'Mais Antigas' },
    { value: 'difficulty', label: 'Por Dificuldade' },
    { value: 'category', label: 'Por Categoria' },
    { value: 'random', label: 'Aleatório' }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros e Ordenação
          <Badge variant="outline" className="ml-auto">
            {filteredCount} de {totalQuestions}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filtros */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Tipo de Questões</label>
          <div className="flex flex-wrap gap-2">
            {filters.map(filter => {
              const Icon = filter.icon;
              return (
                <Button
                  key={filter.key}
                  variant={activeFilter === filter.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => onFilterChange(filter.key)}
                  className="flex items-center gap-2"
                  title={filter.description}
                >
                  <Icon className="h-4 w-4" />
                  {filter.label}
                </Button>
              );
            })}
          </div>
        </div>

        {/* Ordenação */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Ordenar por</label>
          <Select value={sortBy} onValueChange={(value: SortType) => onSortChange(value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a ordenação" />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Descrição do filtro ativo */}
        <div className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
          {filters.find(f => f.key === activeFilter)?.description}
        </div>
      </CardContent>
    </Card>
  );
};