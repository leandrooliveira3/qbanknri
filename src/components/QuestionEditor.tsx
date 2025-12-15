import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, X, Save, ArrowLeft } from 'lucide-react';
import { Question, NeuroCategory } from '@/types/question';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { useToast } from '@/hooks/use-toast';

const CATEGORIAS: NeuroCategory[] = [
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

  const [formData, setFormData] = useState<Partial<Question>>({
    categoria: question.categoria,
    subcategoria: question.subcategoria ?? '',
    enunciado: question.enunciado,
    alternativas: [...question.alternativas],
    gabarito: question.gabarito,
    comentario: question.comentario,
    dificuldade: question.dificuldade,
    fonte: question.fonte ?? '',
    tags: question.tags ?? [],
    referencias: question.referencias ?? [],
    imagem: Array.isArray(question.imagem) ? question.imagem : [],
    comentarioImagem: Array.isArray(question.comentarioImagem)
      ? question.comentarioImagem
      : []
  });

  const [newTag, setNewTag] = useState('');
  const [newReferencia, setNewReferencia] = useState('');

  useEffect(() => {
    setFormData({
      categoria: question.categoria,
      subcategoria: question.subcategoria ?? '',
      enunciado: question.enunciado,
      alternativas: [...question.alternativas],
      gabarito: question.gabarito,
      comentario: question.comentario,
      dificuldade: question.dificuldade,
      fonte: question.fonte ?? '',
      tags: question.tags ?? [],
      referencias: question.referencias ?? [],
      imagem: Array.isArray(question.imagem) ? question.imagem : [],
      comentarioImagem: Array.isArray(question.comentarioImagem)
        ? question.comentarioImagem
        : []
    });
  }, [question]);

  const handleAlternativaChange = (index: number, value: string) => {
    const alternativas = [...(formData.alternativas ?? [])];
    alternativas[index] = value;
    setFormData({ ...formData, alternativas });
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags ?? []), newTag.trim()]
      });
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: (formData.tags ?? []).filter(t => t !== tag)
    });
  };

  const addReferencia = () => {
    if (
      newReferencia.trim() &&
      !formData.referencias?.includes(newReferencia.trim())
    ) {
      setFormData({
        ...formData,
        referencias: [...(formData.referencias ?? []), newReferencia.trim()]
      });
      setNewReferencia('');
    }
  };

  const removeReferencia = (ref: string) => {
    setFormData({
      ...formData,
      referencias: (formData.referencias ?? []).filter(r => r !== ref)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.enunciado?.trim()) {
      toast({
        title: 'Erro',
        description: 'O enunciado é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    if (formData.alternativas?.some(a => !a.trim())) {
      toast({
        title: 'Erro',
        description: 'Todas as alternativas devem ser preenchidas',
        variant: 'destructive'
      });
      return;
    }

    if (!formData.comentario?.trim()) {
      toast({
        title: 'Erro',
        description: 'O comentário é obrigatório',
        variant: 'destructive'
      });
      return;
    }

    onUpdateQuestion(question.id, {
      ...formData,
      subcategoria: formData.subcategoria || undefined,
      fonte: formData.fonte || undefined,
      tags: formData.tags?.length ? formData.tags : undefined,
      referencias: formData.referencias?.length ? formData.referencias : undefined,
      imagem: formData.imagem?.length ? formData.imagem : undefined,
      comentarioImagem: formData.comentarioImagem?.length
        ? formData.comentarioImagem
        : undefined
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Editar Questão</h1>
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

            {/* Categoria */}
            <div>
              <Label>Categoria</Label>
              <Select
                value={formData.categoria}
                onValueChange={(v: NeuroCategory) =>
                  setFormData({ ...formData, categoria: v })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIAS.map(c => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Enunciado */}
            <div>
              <Label>Enunciado</Label>
              <Textarea
                value={formData.enunciado}
                onChange={e =>
                  setFormData({ ...formData, enunciado: e.target.value })
                }
                required
              />
            </div>

            {/* Alternativas */}
            <div className="space-y-2">
              {(formData.alternativas ?? []).map((alt, i) => (
                <Input
                  key={i}
                  value={alt}
                  onChange={e => handleAlternativaChange(i, e.target.value)}
                />
              ))}
            </div>

            {/* Comentário */}
            <Textarea
              value={formData.comentario}
              onChange={e =>
                setFormData({ ...formData, comentario: e.target.value })
              }
              required
            />

            <Button type="submit" className="bg-medical">
              <Save className="h-4 w-4 mr-2" />
              Salvar Alterações
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};
