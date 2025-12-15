import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, X } from 'lucide-react';
import { Question } from '@/types/question';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { CategorySelector } from '@/components/CategorySelector';
import { TextFormattingGuide } from '@/components/TextFormattingGuide';
import { useToast } from '@/hooks/use-toast';

interface QuestionFormProps {
  onAddQuestion: (question: Omit<Question, 'id' | 'createdAt'>) => void;
  onCancel?: () => void;
}

export const QuestionForm: React.FC<QuestionFormProps> = ({ onAddQuestion, onCancel }) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<Question, 'id' | 'createdAt'>>({
    categoria: 'Anatomia e Fisiologia do Sistema Nervoso' as any,
    subcategoria: '',
    enunciado: '',
    alternativas: ['', '', '', '', ''],
    gabarito: 'A',
      comentario: '',
      comentarioImagem: [],
      dificuldade: 'Médio',
      tags: [],
      fonte: '',
      imagem: [],
    referencias: []
  });

  const [newTag, setNewTag] = useState('');
  const [newReferencia, setNewReferencia] = useState('');

  const handleAlternativaChange = (index: number, value: string) => {
    const newAlternativas = [...formData.alternativas];
    newAlternativas[index] = value;
    setFormData({ ...formData, alternativas: newAlternativas });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({ ...formData, tags: [...(formData.tags || []), newTag.trim()] });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({ ...formData, tags: formData.tags?.filter(tag => tag !== tagToRemove) || [] });
  };

  const addReferencia = () => {
    if (newReferencia.trim() && !formData.referencias?.includes(newReferencia.trim())) {
      setFormData({ ...formData, referencias: [...(formData.referencias || []), newReferencia.trim()] });
      setNewReferencia('');
    }
  };

  const removeReferencia = (refToRemove: string) => {
    setFormData({ ...formData, referencias: formData.referencias?.filter(ref => ref !== refToRemove) || [] });
  };

  const handleEnunciadoImageSelect = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      imagem: images
    }));
  };

  const handleEnunciadoImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      imagem: []
    }));
  };

  const handleComentarioImageSelect = (images: string[]) => {
    setFormData(prev => ({
      ...prev,
      comentarioImagem: images
    }));
  };

  const handleComentarioImageRemove = () => {
    setFormData(prev => ({
      ...prev,
      comentarioImagem: []
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.categoria || !formData.enunciado || !formData.gabarito) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    if (formData.alternativas.some(alt => !alt.trim())) {
      toast({
        title: "Erro", 
        description: "Todas as alternativas devem ser preenchidas",
        variant: "destructive"
      });
      return;
    }

    onAddQuestion(formData);
    
    // Reset form
    setFormData({
      categoria: 'Anatomia e Fisiologia do Sistema Nervoso' as any,
      subcategoria: '',
      enunciado: '',
      alternativas: ['', '', '', '', ''],
      gabarito: 'A',
      comentario: '',
      comentarioImagem: [],
      dificuldade: 'Médio',
      tags: [],
      fonte: '',
      imagem: [],
      referencias: []
    });

    toast({
      title: "Sucesso",
      description: "Questão adicionada com sucesso!",
      variant: "default"
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-medical">Adicionar Nova Questão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Categoria e Dificuldade */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <CategorySelector
                value={formData.categoria}
                onChange={(value) => setFormData({ ...formData, categoria: value as any })}
                label="Categoria"
                required
              />
              
              <div>
                <Label htmlFor="subcategoria">Subcategoria</Label>
                <Input
                  value={formData.subcategoria}
                  onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                  placeholder="Ex: AVC Isquêmico"
                />
              </div>

              <div>
                <Label htmlFor="dificuldade">Dificuldade</Label>
                <Select value={formData.dificuldade} onValueChange={(value) => setFormData({ ...formData, dificuldade: value as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fácil">Fácil</SelectItem>
                    <SelectItem value="Médio">Médio</SelectItem>
                    <SelectItem value="Difícil">Difícil</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Enunciado */}
            <div>
              <Label htmlFor="enunciado">Enunciado *</Label>
              <Textarea
                value={formData.enunciado}
                onChange={(e) => setFormData({ ...formData, enunciado: e.target.value })}
                placeholder="Digite o enunciado da questão..."
                className="min-h-[100px]"
                required
              />
               <div className="mt-2">
                <MultiImageUpload
                  images={formData.imagem || []}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, imagem: images }))}
                  label="Imagens do enunciado (opcional)"
                  maxImages={5}
                />
              </div>
            </div>

            {/* Alternativas */}
            <div>
              <Label>Alternativas *</Label>
              <div className="space-y-3 mt-2">
                {['A', 'B', 'C', 'D', 'E'].map((letra, index) => (
                  <div key={letra} className="flex items-center space-x-3">
                    <div className="flex items-center">
                      <input
                        type="radio"
                        name="gabarito"
                        value={letra}
                        checked={formData.gabarito === letra}
                        onChange={(e) => setFormData({ ...formData, gabarito: e.target.value as any })}
                        className="mr-2"
                      />
                      <Label className="font-bold min-w-[20px]">{letra})</Label>
                    </div>
                    <Input
                      value={formData.alternativas[index]}
                      onChange={(e) => handleAlternativaChange(index, e.target.value)}
                      placeholder={`Alternativa ${letra}`}
                      className="flex-1"
                      required
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Comentário */}
            <div>
              <Label htmlFor="comentario">Comentário/Explicação *</Label>
              <Textarea
                value={formData.comentario}
                onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                placeholder="Explique a resposta correta e o raciocínio..."
                className="min-h-[100px]"
                required
              />
              <div className="mt-2">
                <MultiImageUpload
                  images={formData.comentarioImagem || []}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, comentarioImagem: images }))}
                  label="Imagens do comentário (opcional)"
                  maxImages={5}
                />
              </div>
            </div>

            {/* Tags */}
            <div>
              <Label>Tags</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Adicionar tag..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.tags?.map(tag => (
                  <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                    {tag} <X className="h-3 w-3 ml-1" />
                  </Badge>
                ))}
              </div>
            </div>

            {/* Fonte */}
            <div>
              <Label htmlFor="fonte">Fonte (opcional)</Label>
              <Input
                value={formData.fonte}
                onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
                placeholder="Ex: Harrison's, 20ª ed., Cap. 15"
              />
            </div>

            {/* Referências */}
            <div>
              <Label>Referências (opcional)</Label>
              <div className="flex items-center space-x-2 mt-2">
                <Input
                  value={newReferencia}
                  onChange={(e) => setNewReferencia(e.target.value)}
                  placeholder="Adicionar referência bibliográfica..."
                  className="flex-1"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addReferencia())}
                />
                <Button type="button" onClick={addReferencia} size="sm" variant="outline">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2 mt-2">
                {formData.referencias?.map((ref, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 bg-secondary/30 rounded border">
                    <span className="text-xs font-medium text-muted-foreground mt-0.5">{index + 1}.</span>
                    <span className="text-sm flex-1">{ref}</span>
                    <Button
                      type="button"
                      onClick={() => removeReferencia(ref)}
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {/* Botões */}
            <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
              {onCancel && (
                <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
                  Cancelar
                </Button>
              )}
              <Button type="submit" className="bg-medical hover:bg-medical/90 w-full sm:w-auto">
                <Check className="h-4 w-4 mr-2" />
                Adicionar Questão
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};