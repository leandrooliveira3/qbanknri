import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Question } from '@/types/question';
import { useToast } from '@/hooks/use-toast';
import { useCategories } from '@/hooks/useCategories';

interface ImportQuestionsProps {
  onImportQuestions: (questions: Omit<Question, 'id' | 'createdAt'>[]) => void;
  onCancel?: () => void;
}

export const ImportQuestions: React.FC<ImportQuestionsProps> = ({
  onImportQuestions,
  onCancel
}) => {
  const { toast } = useToast();
  const { addCustomCategory } = useCategories();

  const [jsonData, setJsonData] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      setJsonData(event.target?.result as string);
    };
    reader.readAsText(file);
  };

  const validateQuestion = (question: any): boolean => {
    try {
      const required = ['categoria', 'enunciado', 'alternativas', 'gabarito', 'comentario', 'dificuldade'];
      const validDifficulties = ['Fácil', 'Médio', 'Difícil'];
      const validGabaritos = ['A', 'B', 'C', 'D', 'E'];

      if (!question || typeof question !== 'object') return false;

      const hasRequiredFields = required.every(field => {
        const value = question[field];
        return value !== undefined && value !== null && value.toString().trim() !== '';
      });

      const hasValidAlternatives =
        Array.isArray(question.alternativas) &&
        question.alternativas.length >= 4 &&
        question.alternativas.length <= 5 &&
        question.alternativas.every((alt: any) => alt?.toString().trim() !== '');

      const hasValidCategory =
        typeof question.categoria === 'string' &&
        question.categoria.trim().length > 0;

      const hasValidDifficulty = validDifficulties.includes(question.dificuldade?.trim());
      const hasValidGabarito = validGabaritos.includes(
        question.gabarito?.toString().trim().toUpperCase()
      );

      return (
        hasRequiredFields &&
        hasValidAlternatives &&
        hasValidCategory &&
        hasValidDifficulty &&
        hasValidGabarito
      );
    } catch {
      return false;
    }
  };

  const processBatch = async (questions: any[], batchSize = 50) => {
    const results: any[] = [];
    const newCategories = new Set<string>();

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);

      const validBatch = batch.filter((q) => {
        const isValid = validateQuestion(q);
        if (isValid && q.categoria) {
          newCategories.add(q.categoria.trim());
        }
        return isValid;
      });

      if (validBatch.length > 0) {
        onImportQuestions(validBatch);
        results.push(...validBatch);
      }

      if (i + batchSize < questions.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    for (const categoria of newCategories) {
      await addCustomCategory(categoria);
    }

    return results;
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: 'Erro',
        description: 'Insira os dados JSON ou carregue um arquivo',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const data = JSON.parse(jsonData);
      const questionsArray = Array.isArray(data) ? data : [data];

      const validQuestions =
        questionsArray.length > 100
          ? await processBatch(questionsArray)
          : (() => {
              const newCategories = new Set<string>();
              const valid = questionsArray.filter(q => {
                const isValid = validateQuestion(q);
                if (isValid && q.categoria) {
                  newCategories.add(q.categoria.trim());
                }
                return isValid;
              });

              newCategories.forEach(c => addCustomCategory(c));
              return valid;
            })();

      const invalidCount = questionsArray.length - validQuestions.length;

      if (validQuestions.length === 0) {
        toast({
          title: 'Erro',
          description: 'Nenhuma questão válida encontrada no arquivo.',
          variant: 'destructive'
        });
        setIsProcessing(false);
        return;
      }

      if (questionsArray.length <= 100) {
        onImportQuestions(validQuestions);
      }

      toast({
        title: 'Sucesso',
        description: `${validQuestions.length} questões importadas com sucesso${
          invalidCount > 0 ? `. ${invalidCount} inválidas ignoradas` : ''
        }`
      });

      setJsonData('');
    } catch (error) {
      toast({
        title: 'Erro',
        description: `Erro durante a importação: ${
          error instanceof Error ? error.message : 'JSON inválido'
        }`,
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-medical flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Questões em Bloco
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Importe questões em JSON. Categorias novas serão criadas automaticamente.
          </AlertDescription>
        </Alert>

        <div>
          <Label>Arquivo JSON</Label>
          <input
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
            id="file-upload"
          />
          <Label
            htmlFor="file-upload"
            className="flex items-center gap-2 cursor-pointer bg-secondary px-4 py-2 rounded-md w-fit mt-2"
          >
            <FileText className="h-4 w-4" />
            Selecionar arquivo
          </Label>
        </div>

        <div>
          <Label>Ou cole o JSON</Label>
          <Textarea
            value={jsonData}
            onChange={(e) => setJsonData(e.target.value)}
            className="min-h-[200px] font-mono text-sm"
          />
        </div>

        <div className="flex justify-end gap-3">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            onClick={handleImport}
            disabled={isProcessing || !jsonData.trim()}
            className="bg-medical"
          >
            <Check className="h-4 w-4 mr-2" />
            {isProcessing ? 'Importando…' : 'Importar'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
