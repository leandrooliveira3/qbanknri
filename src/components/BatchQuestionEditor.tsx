import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Question, NeuroCategory } from '@/types/question';
import { Edit3, Save, X, Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const CATEGORIAS: string[] = [
  'Anatomia e Fisiologia do Sistema Nervoso',
  'Semiologia Neurológica',
  'Doenças Cerebrovasculares',
  'Epilepsia e Distúrbios Paroxísticos',
  'Demências e Distúrbios Cognitivos',
  'Distúrbios do Movimento',
  'Doenças Desmielinizantes',
  'Neuropatias Periféricas',
  'Miopatias e Distúrbios da Junção Neuromuscular',
  'Distúrbios do Sono',
  'Cefaleia e Dor Facial',
  'Neuro-oncologia',
  'Neurologia de Urgência',
  'Neurologia Pediátrica',
  'Neurogenética',
  'Neurologia Comportamental',
  'Reabilitação Neurológica',
  'Neurorradiologia'
];

interface BatchQuestionEditorProps {
  questions: Question[];
  onUpdate: (updates: { id: string; data: Partial<Question> }[]) => Promise<void>;
  onClose: () => void;
}

export const BatchQuestionEditor: React.FC<BatchQuestionEditorProps> = ({
  questions,
  onUpdate,
  onClose
}) => {
  const { toast } = useToast();
  const [selectedQuestions, setSelectedQuestions] = useState<Set<string>>(new Set());
  const [batchChanges, setBatchChanges] = useState({
    categoria: '',
    subcategoria: '',
    dificuldade: '',
    fonte: '',
    addTag: '',
    removeTag: ''
  });
  const [isUpdating, setIsUpdating] = useState(false);

  const handleQuestionToggle = (questionId: string) => {
    const newSelected = new Set(selectedQuestions);
    if (newSelected.has(questionId)) {
      newSelected.delete(questionId);
    } else {
      newSelected.add(questionId);
    }
    setSelectedQuestions(newSelected);
  };

  const selectAll = () => {
    setSelectedQuestions(new Set(questions.map(q => q.id)));
  };

  const selectNone = () => {
    setSelectedQuestions(new Set());
  };

  const applyBatchChanges = async () => {
    if (selectedQuestions.size === 0) {
      toast({
        title: "Nenhuma questão selecionada",
        description: "Selecione pelo menos uma questão para editar",
        variant: "destructive"
      });
      return;
    }

    setIsUpdating(true);
    try {
      const updates = Array.from(selectedQuestions).map(questionId => {
        const question = questions.find(q => q.id === questionId)!;
        const data: Partial<Question> = {};

        // Aplicar mudanças apenas se foram definidas
        if (batchChanges.categoria) data.categoria = batchChanges.categoria;
        if (batchChanges.subcategoria !== undefined) data.subcategoria = batchChanges.subcategoria;
        if (batchChanges.dificuldade) data.dificuldade = batchChanges.dificuldade as 'Fácil' | 'Médio' | 'Difícil';
        if (batchChanges.fonte !== undefined) data.fonte = batchChanges.fonte;
        
        // Adicionar tag
        if (batchChanges.addTag.trim()) {
          const currentTags = question.tags || [];
          const newTag = batchChanges.addTag.trim();
          if (!currentTags.includes(newTag)) {
            data.tags = [...currentTags, newTag];
          }
        }
        
        // Remover tag
        if (batchChanges.removeTag.trim()) {
          const currentTags = question.tags || [];
          const tagToRemove = batchChanges.removeTag.trim();
          data.tags = currentTags.filter(tag => tag !== tagToRemove);
        }

        return { id: questionId, data };
      }).filter(update => Object.keys(update.data).length > 0);

      if (updates.length === 0) {
        toast({
          title: "Nenhuma alteração detectada",
          description: "Defina pelo menos uma alteração para aplicar",
          variant: "destructive"
        });
        return;
      }

      await onUpdate(updates);
      
      toast({
        title: "Questões atualizadas",
        description: `${updates.length} questões foram atualizadas com sucesso`
      });

      // Reset form
      setBatchChanges({
        categoria: '',
        subcategoria: '',
        dificuldade: '',
        fonte: '',
        addTag: '',
        removeTag: ''
      });
      setSelectedQuestions(new Set());
    } catch (error) {
      toast({
        title: "Erro ao atualizar questões",
        description: "Tente novamente em alguns momentos",
        variant: "destructive"
      });
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Edit3 className="h-6 w-6" />
          Edição em Lote
        </h2>
        <Button variant="outline" onClick={onClose}>
          <X className="h-4 w-4 mr-2" />
          Fechar
        </Button>
      </div>

      {/* Controles de Seleção */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Seleção de Questões
            <Badge variant="outline">
              {selectedQuestions.size} de {questions.length} selecionadas
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={selectAll}>
              Selecionar Todas
            </Button>
            <Button variant="outline" size="sm" onClick={selectNone}>
              Limpar Seleção
            </Button>
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2 border rounded-lg p-2">
            {questions.map(question => (
              <div key={question.id} className="flex items-center space-x-3 p-2 hover:bg-muted/50 rounded">
                <Checkbox
                  checked={selectedQuestions.has(question.id)}
                  onCheckedChange={() => handleQuestionToggle(question.id)}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium truncate">
                    {question.enunciado.substring(0, 80)}...
                  </p>
                  <div className="flex gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {question.categoria}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {question.dificuldade}
                    </Badge>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Campos de Edição */}
      <Card>
        <CardHeader>
          <CardTitle>Alterações em Lote</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Categoria</Label>
              <Select 
                value={batchChanges.categoria} 
                onValueChange={(value) => setBatchChanges(prev => ({ ...prev, categoria: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Manter atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Manter atual</SelectItem>
                  {CATEGORIAS.map(cat => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Dificuldade</Label>
              <Select 
                value={batchChanges.dificuldade} 
                onValueChange={(value) => setBatchChanges(prev => ({ ...prev, dificuldade: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Manter atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Manter atual</SelectItem>
                  <SelectItem value="Fácil">Fácil</SelectItem>
                  <SelectItem value="Médio">Médio</SelectItem>
                  <SelectItem value="Difícil">Difícil</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Subcategoria</Label>
              <Input
                value={batchChanges.subcategoria}
                onChange={(e) => setBatchChanges(prev => ({ ...prev, subcategoria: e.target.value }))}
                placeholder="Deixar em branco para manter atual"
              />
            </div>

            <div className="space-y-2">
              <Label>Fonte</Label>
              <Input
                value={batchChanges.fonte}
                onChange={(e) => setBatchChanges(prev => ({ ...prev, fonte: e.target.value }))}
                placeholder="Deixar em branco para manter atual"
              />
            </div>

            <div className="space-y-2">
              <Label>Adicionar Tag</Label>
              <Input
                value={batchChanges.addTag}
                onChange={(e) => setBatchChanges(prev => ({ ...prev, addTag: e.target.value }))}
                placeholder="Nova tag para adicionar"
              />
            </div>

            <div className="space-y-2">
              <Label>Remover Tag</Label>
              <Input
                value={batchChanges.removeTag}
                onChange={(e) => setBatchChanges(prev => ({ ...prev, removeTag: e.target.value }))}
                placeholder="Tag para remover"
              />
            </div>
          </div>

          <Separator />

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button onClick={applyBatchChanges} disabled={isUpdating}>
              <Save className="h-4 w-4 mr-2" />
              {isUpdating ? 'Salvando...' : 'Aplicar Alterações'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};