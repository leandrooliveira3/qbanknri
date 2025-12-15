import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Upload, FileText, Check, AlertCircle } from 'lucide-react';
import { Question, NeuroCategory } from '@/types/question';
import { useToast } from '@/hooks/use-toast';
import useCategories from '@/hooks/useCategories';


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
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setJsonData(event.target?.result as string);
      };
      reader.readAsText(file);
    }
  };

  const validateQuestion = (question: any): boolean => {
    try {
      // Campos obrigatórios
      const required = ['categoria', 'enunciado', 'alternativas', 'gabarito', 'comentario', 'dificuldade'];
      const validDifficulties = ['Fácil', 'Médio', 'Difícil'];
      const validGabaritos = ['A', 'B', 'C', 'D', 'E'];

      // Verifica se é um objeto válido
      if (!question || typeof question !== 'object') {
        console.log('Invalid question object:', question);
        return false;
      }

      // Verifica campos obrigatórios
      const hasRequiredFields = required.every(field => {
        const value = question[field];
        const isValid = value !== undefined && 
                       value !== null && 
                       value.toString().trim() !== '';
        if (!isValid) {
          console.log(`Missing or invalid field ${field}:`, value);
        }
        return isValid;
      });

      // Verifica alternativas
      const hasValidAlternatives = Array.isArray(question.alternativas) && 
             question.alternativas.length >= 4 && 
             question.alternativas.length <= 5 &&
             question.alternativas.every((alt: any, index: number) => {
               const isValid = alt !== undefined && alt !== null && alt.toString().trim() !== '';
               if (!isValid) {
                 console.log(`Invalid alternative at index ${index}:`, alt);
               }
               return isValid;
             });

      // Validação flexível para categoria - aceita qualquer string válida
      const hasValidCategory = typeof question.categoria === 'string' && 
                              question.categoria.trim().length > 0 &&
                              question.categoria.trim().length <= 100; // Limite razoável
      
      const hasValidDifficulty = validDifficulties.includes(question.dificuldade?.trim());
      const hasValidGabarito = validGabaritos.includes(question.gabarito?.toString()?.trim()?.toUpperCase());

      if (!hasValidCategory) {
        console.log('Invalid category (must be non-empty string):', question.categoria);
      }
      if (!hasValidDifficulty) {
        console.log('Invalid difficulty:', question.dificuldade);
      }
      if (!hasValidGabarito) {
        console.log('Invalid gabarito:', question.gabarito);
      }

      const isValid = hasRequiredFields && hasValidAlternatives && hasValidCategory && hasValidDifficulty && hasValidGabarito;
      
      if (!isValid) {
        console.log('Question validation failed for:', {
          categoria: question.categoria,
          enunciado: question.enunciado?.substring(0, 50) + '...',
          alternativas: question.alternativas?.length,
          gabarito: question.gabarito,
          dificuldade: question.dificuldade
        });
      }

      return isValid;
    } catch (error) {
      console.error('Error validating question:', error, question);
      return false;
    }
  };

  const processBatch = async (questions: any[], batchSize: number = 50) => {
    const results = [];
    const newCategories = new Set<string>();
    
    for (let i = 0; i < questions.length; i += batchSize) {
      const batch = questions.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}, questions ${i + 1} to ${Math.min(i + batchSize, questions.length)}`);
      
      const validBatch = batch.filter((question, index) => {
        console.log(`Validating question ${i + index + 1}:`, {
          categoria: question.categoria,
          enunciado: question.enunciado?.substring(0, 50) + '...'
        });
        const isValid = validateQuestion(question);
        console.log(`Question ${i + index + 1} is ${isValid ? 'valid' : 'invalid'}`);
        
        // Coletar novas categorias para adicionar depois
        if (isValid && question.categoria) {
          newCategories.add(question.categoria.trim());
        }
        
        return isValid;
      });
      
      if (validBatch.length > 0) {
        console.log(`Importing batch of ${validBatch.length} questions...`);
        await onImportQuestions(validBatch);
        results.push(...validBatch);
        
        // Pequena pausa entre batches para não sobrecarregar
        if (i + batchSize < questions.length) {
          await new Promise(resolve => setTimeout(resolve, 100));
        }
      }
    }
    
    // Adicionar novas categorias encontradas
    for (const categoria of newCategories) {
      await addCustomCategory(categoria);
    }
    
    return results;
  };

  const handleImport = async () => {
    if (!jsonData.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira os dados JSON ou carregue um arquivo",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting import process...');
      const data = JSON.parse(jsonData);
      console.log('Parsed JSON data, total items:', Array.isArray(data) ? data.length : 1);
      
      const questionsArray = Array.isArray(data) ? data : [data];
      console.log(`Processing ${questionsArray.length} questions...`);
      
      // Processa em lotes para questões grandes
      const validQuestions = questionsArray.length > 100 
        ? await processBatch(questionsArray)
        : await (async () => {
            const newCategories = new Set<string>();
            const valid = questionsArray.filter((question, index) => {
              console.log(`Validating question ${index + 1}:`, {
                categoria: question.categoria,
                enunciado: question.enunciado?.substring(0, 50) + '...'
              });
              const isValid = validateQuestion(question);
              console.log(`Question ${index + 1} is ${isValid ? 'valid' : 'invalid'}`);
              
              // Coletar novas categorias
              if (isValid && question.categoria) {
                newCategories.add(question.categoria.trim());
              }
              
              return isValid;
            });
            
            // Adicionar novas categorias encontradas
            for (const categoria of newCategories) {
              await addCustomCategory(categoria);
            }
            
            return valid;
          })();
      
      const invalidCount = questionsArray.length - validQuestions.length;
      console.log(`Valid questions: ${validQuestions.length}, Invalid: ${invalidCount}`);

      if (validQuestions.length === 0) {
        toast({
          title: "Erro",
          description: "Nenhuma questão válida encontrada no arquivo. Verifique o console para detalhes dos erros.",
          variant: "destructive"
        });
        setIsProcessing(false);
        return;
      }

      // Para quantidades menores, importa normalmente
      if (questionsArray.length <= 100) {
        console.log('Calling onImportQuestions with:', validQuestions.length, 'questions');
        await onImportQuestions(validQuestions);
      }
      
      toast({
        title: "Sucesso",
        description: `${validQuestions.length} questões importadas com sucesso${invalidCount > 0 ? `. ${invalidCount} questões inválidas foram ignoradas` : ''}`,
        variant: "default"
      });
      
      setJsonData('');
      
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: "Erro",
        description: `Erro durante a importação: ${error instanceof Error ? error.message : 'Formato JSON inválido'}. Verifique os dados e o console para mais detalhes.`,
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const exampleFormat = `[
  {
    "categoria": "Doenças Cerebrovasculares",
    "subcategoria": "AVC Isquêmico",
    "enunciado": "Qual é o principal mecanismo fisiopatológico do AVC isquêmico?",
    "alternativas": [
      "Ruptura de vaso sanguíneo",
      "Oclusão arterial com redução do fluxo sanguíneo",
      "Vasoespasmo cerebral",
      "Hemorragia subaracnóidea",
      "Edema cerebral primário"
    ],
    "gabarito": "B",
    "comentario": "O AVC isquêmico é causado pela oclusão arterial...",
    "dificuldade": "Médio",
    "tags": ["AVC", "isquemia"],
    "fonte": "Adams & Victor's, 11ª ed",
    "imagem": "",
    "comentarioImagem": ""
  }
]`;

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="text-medical flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Importar Questões em Bloco
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 md:space-y-6">
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Importe múltiplas questões de uma vez usando formato JSON. 
            Novas categorias serão criadas automaticamente durante a importação.
            Questões inválidas serão ignoradas automaticamente.
          </AlertDescription>
        </Alert>

        <div className="space-y-4">
          <div>
            <Label htmlFor="file-upload">Carregar arquivo JSON</Label>
            <div className="mt-2">
              <input
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Label
                htmlFor="file-upload"
                className="flex items-center gap-2 cursor-pointer bg-secondary hover:bg-secondary/80 px-4 py-2 rounded-md text-sm border border-dashed border-border w-fit"
              >
                <FileText className="h-4 w-4" />
                Selecionar arquivo JSON
              </Label>
            </div>
          </div>

          <div>
            <Label htmlFor="json-data">Ou cole o JSON diretamente:</Label>
            <Textarea
              id="json-data"
              value={jsonData}
              onChange={(e) => setJsonData(e.target.value)}
              placeholder="Cole seus dados JSON aqui..."
              className="min-h-[200px] font-mono text-sm"
            />
          </div>
        </div>

        <div className="bg-muted p-4 rounded-md">
          <h4 className="font-medium mb-2">Formato esperado (categorias criadas automaticamente):</h4>
          <pre className="text-xs overflow-x-auto whitespace-pre-wrap bg-background p-3 rounded border">
{`[
  {
    "categoria": "Nova Categoria Personalizada",
    "subcategoria": "Subtópico específico",
    "enunciado": "Pergunta da questão aqui...",
    "alternativas": [
      "Alternativa A",
      "Alternativa B",
      "Alternativa C", 
      "Alternativa D",
      "Alternativa E"
    ],
    "gabarito": "B",
    "comentario": "Explicação detalhada da resposta...",
    "dificuldade": "Médio",
    "tags": ["tag1", "tag2"],
    "fonte": "Fonte da questão",
    "imagem": [],
    "comentarioImagem": []
  }
]`}
          </pre>
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-2 sm:space-y-0 sm:space-x-3">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel} className="w-full sm:w-auto">
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleImport}
            disabled={isProcessing || !jsonData.trim()}
            className="bg-medical hover:bg-medical/90 w-full sm:w-auto"
          >
            <Check className="h-4 w-4 mr-2" />
            {isProcessing ? 'Importando...' : 'Importar Questões'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
