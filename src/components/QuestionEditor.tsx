import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Check, X, Save, ArrowLeft } from 'lucide-react';
import { Question, NeuroCategory } from '@/types/question';
import { MultiImageUpload } from '@/components/MultiImageUpload';
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

interface QuestionEditorProps {
  question: Question;
  onUpdateQuestion: (id: string, question: Partial<Question>) => void;
  onCancel: () => void;
}

export const QuestionEditor: React.FC<QuestionEditorProps> = ({ 
  question, 
  onUpdateQuestion, 
  onCancel 
}) => {
  const { toast } = useToast();
  const [formData, setFormData] = useState<Omit<Question, 'id' | 'createdAt'>>({
    categoria: question.categoria,
    subcategoria: question.subcategoria || '',
    enunciado: question.enunciado,
    alternativas: [...question.alternativas],
    gabarito: question.gabarito,
    comentario: question.comentario,
    dificuldade: question.dificuldade,
    imagem: Array.isArray(question.imagem) ? question.imagem : (question.imagem ? [question.imagem] : []),
    comentarioImagem: Array.isArray(question.comentarioImagem) ? question.comentarioImagem : (question.comentarioImagem ? [question.comentarioImagem] : []),
    tags: question.tags || [],
    referencias: question.referencias || []
  });

  const [newTag, setNewTag] = useState('');
  const [newReferencia, setNewReferencia] = useState('');

  // Atualizar formulário quando a questão mudar
  useEffect(() => {
    setFormData({
      categoria: question.categoria,
      subcategoria: question.subcategoria || '',
      enunciado: question.enunciado,
      alternativas: [...question.alternativas],
      gabarito: question.gabarito,
      comentario: question.comentario,
      dificuldade: question.dificuldade,
      tags: question.tags || [],
      fonte: question.fonte || '',
      imagem: Array.isArray(question.imagem) ? question.imagem : (question.imagem ? [question.imagem] : []),
      comentarioImagem: Array.isArray(question.comentarioImagem) ? question.comentarioImagem : (question.comentarioImagem ? [question.comentarioImagem] : []),
      referencias: question.referencias || []
    });
  }, [question]);

  const handleAlternativaChange = (index: number, value: string) => {
    const newAlternativas = [...formData.alternativas];
    newAlternativas[index] = value;
    setFormData({ ...formData, alternativas: newAlternativas });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(tag => tag !== tagToRemove)
    });
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
    setFormData({ ...formData, imagem: images });
  };

  const handleEnunciadoImageRemove = () => {
    setFormData({ ...formData, imagem: [] });
  };

  const handleComentarioImageSelect = (images: string[]) => {
    setFormData({ ...formData, comentarioImagem: images });
  };

  const handleComentarioImageRemove = () => {
    setFormData({ ...formData, comentarioImagem: [] });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validações
    if (!formData.enunciado.trim()) {
      toast({
        title: "Erro de validação",
        description: "O enunciado da questão é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    if (formData.alternativas.some(alt => !alt.trim())) {
      toast({
        title: "Erro de validação",
        description: "Todas as alternativas devem ser preenchidas.",
        variant: "destructive"
      });
      return;
    }

    if (!formData.comentario.trim()) {
      toast({
        title: "Erro de validação",
        description: "O comentário é obrigatório.",
        variant: "destructive"
      });
      return;
    }

    // Limpar campos opcionais vazios
    const questionData = {
      ...formData,
      subcategoria: formData.subcategoria.trim() || undefined,
      fonte: formData.fonte.trim() || undefined,
      imagem: formData.imagem && formData.imagem.length > 0 ? formData.imagem : undefined,
      comentarioImagem: formData.comentarioImagem && formData.comentarioImagem.length > 0 ? formData.comentarioImagem : undefined,
      tags: formData.tags.length > 0 ? formData.tags : undefined,
      referencias: formData.referencias && formData.referencias.length > 0 ? formData.referencias : undefined
    };

    onUpdateQuestion(question.id, questionData);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-medical">Editar Questão</h1>
          <p className="text-muted-foreground mt-1">
            Modifique os dados da questão selecionada
          </p>
        </div>
        <Button onClick={onCancel} variant="outline">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Dados da Questão</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="categoria">Categoria</Label>
                <Select 
                  value={formData.categoria} 
                  onValueChange={(value: NeuroCategory) => setFormData({ ...formData, categoria: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIAS.map(cat => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="subcategoria">Subcategoria (opcional)</Label>
                <Input
                  id="subcategoria"
                  value={formData.subcategoria}
                  onChange={(e) => setFormData({ ...formData, subcategoria: e.target.value })}
                  placeholder="Ex: AVC Isquêmico"
                  className="mt-2"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="enunciado">Enunciado da Questão</Label>
              <Textarea
                id="enunciado"
                value={formData.enunciado}
                onChange={(e) => setFormData({ ...formData, enunciado: e.target.value })}
                placeholder="Digite o enunciado da questão..."
                className="mt-2 min-h-[100px]"
                required
              />
            </div>

            <div>
              <Label>Imagem do Enunciado (opcional)</Label>
              <div className="space-y-4">
                <MultiImageUpload
                  images={formData.imagem || []}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, imagem: images }))}
                  label="Imagens do enunciado"
                  maxImages={5}
                />
              </div>
            </div>

            <div>
              <Label>Alternativas</Label>
              <div className="grid gap-3 mt-2">
                {formData.alternativas.map((alt, index) => {
                  const letter = String.fromCharCode(65 + index);
                  return (
                    <div key={index} className="flex items-center gap-3">
                      <span className="font-medium text-sm w-6">{letter})</span>
                      <Input
                        value={alt}
                        onChange={(e) => handleAlternativaChange(index, e.target.value)}
                        placeholder={`Alternativa ${letter}`}
                        required
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Gabarito (Resposta Correta)</Label>
                <Select 
                  value={formData.gabarito} 
                  onValueChange={(value: 'A' | 'B' | 'C' | 'D' | 'E') => setFormData({ ...formData, gabarito: value })}
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {['A', 'B', 'C', 'D', 'E'].map(letter => (
                      <SelectItem key={letter} value={letter}>{letter}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Dificuldade</Label>
                <Select 
                  value={formData.dificuldade} 
                  onValueChange={(value: 'Fácil' | 'Médio' | 'Difícil') => setFormData({ ...formData, dificuldade: value })}
                >
                  <SelectTrigger className="mt-2">
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

            <div>
              <Label htmlFor="comentario">Comentário/Explicação</Label>
              <Textarea
                id="comentario"
                value={formData.comentario}
                onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
                placeholder="Explique a resposta correta e forneça informações adicionais..."
                className="mt-2 min-h-[100px]"
                required
              />
            </div>

            <div>
              <Label>Imagem do Comentário (opcional)</Label>
              <div className="space-y-4">
                <MultiImageUpload
                  images={formData.comentarioImagem || []}
                  onImagesChange={(images) => setFormData(prev => ({ ...prev, comentarioImagem: images }))}
                  label="Imagens do comentário"
                  maxImages={5}
                />
              </div>
            </div>

            <div>
              <Label>Tags (opcional)</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  placeholder="Adicionar tag"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                />
                <Button type="button" onClick={addTag} variant="outline" size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <X 
                        className="h-3 w-3 cursor-pointer" 
                        onClick={() => removeTag(tag)}
                      />
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div>
              <Label htmlFor="fonte">Fonte (opcional)</Label>
              <Input
                id="fonte"
                value={formData.fonte}
                onChange={(e) => setFormData({ ...formData, fonte: e.target.value })}
                placeholder="Ex: Livro de Neurologia - Capítulo 5"
                className="mt-2"
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

            <div className="flex gap-3 pt-4">
              <Button type="submit" className="bg-medical hover:bg-medical/90">
                <Save className="h-4 w-4 mr-2" />
                Salvar Alterações
              </Button>
              <Button type="button" onClick={onCancel} variant="outline">
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};