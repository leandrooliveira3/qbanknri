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
  onImportQuestions: (
    questions: Omit<Question, 'id' | 'created_at'>[]
  ) => Promise<void>;
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

  const validateQuestion = (q: any): boolean => {
    try {
      const required = [
        'categoria',
        'enunciado',
        'alternativas',
        'gabarito',
        'comentario',
        'dificuldade'
      ];

      const validDifficulties = ['Fácil', 'Médio', 'Difícil'];
      const validGabaritos = ['A', 'B', 'C', 'D', 'E'];

      if (!q || typeof q !== 'object') return false;

      if (!required.every(f => q[f] !== undefined && q[f]?.toString().trim())) {
        return false;
      }

      if (
        !Array.isArray(q.alternativas) ||
        q.alternativas.length < 4 ||
        q.alternativas.length > 5 ||
        q.alternativas.some((a: any) => !a?.toString().trim())
      ) {
        return false;
      }

      if (!validDifficulties.includes(q.dificuldade?.trim())) return false;
      if (!validGabaritos.includes(q.gabarito?.toString().trim().toUpperCase()))
        return false;

      return true;
    } catch {
      return false;
    }
  };

  const processBatch = async (questions: any[], batchSize = 50) => {
    const results: any[] = [];
    const newCategories = new Set<string>();

    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);

      const validBatch = batch.filter(q => {
        const ok = validateQuestion(q);
        if (ok && q.categoria) newCategories.add(q.categoria.trim());
        return ok;
      });

      if (validBatch.length) {
        await onImportQuestions(validBatch);
        results.push(...validBatch);
      }

      if (i + batchSize < questions.length) {
        await new Promise(r => setTimeout(r, 100));
      }
    }

    for (const cat of newCategories) {
      await addCustomCategory(cat);
    }

    return results;
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: 'Erro',
        description: 'Insira um JSON válido',
        variant: 'destructive'
      });
      return;
    }

    setIsProcessing(true);

    try {
      const parsed = JSON.parse(jsonData);
      const questions = Array.isArray(parsed) ? parsed : [parsed];

      const validQuestions =
        questions.length > 100
          ? await processBatch(questions)
          : (() => {
              const cats = new Set<string>();
              const valid = questions.filter(q => {
                const ok = validateQuestion(q);
                if (ok && q.categoria) cats.add(q.categoria.trim());
                return ok;
              });

              cats.forEach(c => addCustomCategory(c));
              return valid;
            })();

      if (!validQuestions.length) {
        toast({
          title: 'Erro',
          description: 'Nenhuma questão válida encontrada',
          variant: 'destructive'
        });
        return;
      }

      if (questions.length <= 100) {
        await onImportQuestions(validQuestions);
      }

      toast({
        title: 'Sucesso',
        description: `${validQuestions.length} questões importadas com sucesso`
      });

      setJsonData('');
    } catch (e) {
      toast({
        title: 'Erro',
        description:
          e instanceof Error ? e.message : 'JSON inválido',
        variant: 'destructive'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Questões em Bloco
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Importação via JSON. Categorias novas são criadas automaticamente.
          </AlertDescription>
        </Alert>

        <div>
          <Label>Arquivo JSON</Label>
          <input
            id="file-upload"
            type="file"
            accept=".json"
            onChange={handleFileUpload}
            className="hidden"
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
            onChange={e => setJsonData(e.target.value)}
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
