import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, X, Image as ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  onImageSelect: (imageUrl: string) => void;
  onImageRemove: () => void;
  currentImage?: string;
  label?: string;
  className?: string;
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageSelect,
  onImageRemove,
  currentImage,
  label = "Imagem",
  className = ""
}) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Erro",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive"
      });
      return;
    }

    // Validar tamanho (máximo 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Erro",
        description: "A imagem deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    setIsUploading(true);

    try {
      // Converter para base64 (temporário - em produção usaria um serviço de upload)
      const reader = new FileReader();
      reader.onload = (event) => {
        const result = event.target?.result as string;
        onImageSelect(result);
        setIsUploading(false);
        toast({
          title: "Sucesso",
          description: "Imagem carregada com sucesso"
        });
      };
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Erro",
          description: "Erro ao carregar a imagem",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      setIsUploading(false);
      toast({
        title: "Erro",
        description: "Erro ao processar a imagem",
        variant: "destructive"
      });
    }
  };

  const handleRemoveImage = () => {
    onImageRemove();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className={className}>
      <Label className="text-sm font-medium mb-2 block">{label}</Label>
      
      {currentImage ? (
        <Card>
          <CardContent className="p-4">
            <div className="relative">
              <img
                src={currentImage}
                alt="Imagem selecionada"
                className="max-w-full max-h-48 rounded-md mx-auto border"
              />
              <Button
                size="sm"
                variant="destructive"
                onClick={handleRemoveImage}
                className="absolute top-2 right-2"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
            ref={fileInputRef}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="w-full h-32 border-dashed border-2 hover:border-primary/50"
          >
            <div className="flex flex-col items-center gap-2">
              {isUploading ? (
                <div className="animate-spin">
                  <Upload className="h-6 w-6" />
                </div>
              ) : (
                <ImageIcon className="h-6 w-6" />
              )}
              <span className="text-sm">
                {isUploading ? 'Carregando...' : 'Clique para selecionar imagem'}
              </span>
              <span className="text-xs text-muted-foreground">
                PNG, JPG, GIF até 5MB
              </span>
            </div>
          </Button>
        </>
      )}
    </div>
  );
};