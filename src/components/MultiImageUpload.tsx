import React, { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Upload, X, Image as ImageIcon, Plus, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface MultiImageUploadProps {
  images: string[];
  onImagesChange: (images: string[]) => void;
  label?: string;
  maxImages?: number;
}

export const MultiImageUpload: React.FC<MultiImageUploadProps> = ({
  images,
  onImagesChange,
  label = "Imagens",
  maxImages = 5
}) => {
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [newImageUrl, setNewImageUrl] = useState('');

  const handleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (images.length >= maxImages) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxImages} imagens permitidas`,
        variant: "destructive"
      });
      return;
    }

    // Verificar tipo de arquivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Arquivo inválido",
        description: "Por favor, selecione apenas arquivos de imagem",
        variant: "destructive"
      });
      return;
    }

    // Verificar tamanho (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: "O arquivo deve ter no máximo 5MB",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);
    try {
      // Converter arquivo para base64 para demonstração
      // Em produção, seria enviado para um serviço de storage
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        onImagesChange([...images, base64String]);
        toast({
          title: "Imagem adicionada",
          description: "A imagem foi carregada com sucesso"
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast({
        title: "Erro no upload",
        description: "Não foi possível carregar a imagem",
        variant: "destructive"
      });
    } finally {
      setUploading(false);
    }
  }, [images, maxImages, onImagesChange, toast]);

  const handleUrlAdd = () => {
    if (!newImageUrl.trim()) return;

    if (images.length >= maxImages) {
      toast({
        title: "Limite excedido",
        description: `Máximo de ${maxImages} imagens permitidas`,
        variant: "destructive"
      });
      return;
    }

    // Validar se é uma URL válida
    try {
      new URL(newImageUrl);
    } catch {
      toast({
        title: "URL inválida",
        description: "Por favor, insira uma URL válida",
        variant: "destructive"
      });
      return;
    }

    if (images.includes(newImageUrl)) {
      toast({
        title: "Imagem duplicada",
        description: "Esta imagem já foi adicionada",
        variant: "destructive"
      });
      return;
    }

    onImagesChange([...images, newImageUrl]);
    setNewImageUrl('');
    toast({
      title: "Imagem adicionada",
      description: "A imagem foi adicionada com sucesso"
    });
  };

  const removeImage = (index: number) => {
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange(newImages);
    toast({
      title: "Imagem removida",
      description: "A imagem foi removida da lista"
    });
  };

  const ImagePreview: React.FC<{ src: string; index: number }> = ({ src, index }) => (
    <Dialog>
      <DialogTrigger asChild>
        <div className="relative group cursor-pointer">
          <img
            src={src}
            alt={`Imagem ${index + 1}`}
            className="w-20 h-20 object-cover rounded-lg border-2 border-border hover:border-primary transition-colors"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Eye className="h-5 w-5 text-white" />
          </div>
        </div>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Visualizar Imagem {index + 1}</DialogTitle>
        </DialogHeader>
        <div className="flex justify-center">
          <img
            src={src}
            alt={`Imagem ${index + 1}`}
            className="max-w-full max-h-96 object-contain rounded-lg"
          />
        </div>
      </DialogContent>
    </Dialog>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">{label}</Label>
        <Badge variant="outline">
          {images.length}/{maxImages}
        </Badge>
      </div>

      {/* Área de Upload */}
      <Card>
        <CardContent className="p-4 space-y-4">
          {/* Upload por arquivo */}
          <div className="space-y-2">
            <Label htmlFor="file-upload" className="text-sm">Upload de Arquivo</Label>
            <div className="flex items-center space-x-2">
              <Input
                id="file-upload"
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading || images.length >= maxImages}
                className="file:mr-2 file:px-4 file:py-2 file:rounded file:border-0 file:text-sm file:font-medium file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={uploading || images.length >= maxImages}
              >
                <Upload className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Upload por URL */}
          <div className="space-y-2">
            <Label htmlFor="url-input" className="text-sm">URL da Imagem</Label>
            <div className="flex space-x-2">
              <Input
                id="url-input"
                value={newImageUrl}
                onChange={(e) => setNewImageUrl(e.target.value)}
                placeholder="https://exemplo.com/imagem.jpg"
                disabled={images.length >= maxImages}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleUrlAdd}
                disabled={!newImageUrl.trim() || images.length >= maxImages}
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Galeria de Imagens */}
      {images.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-3">
              <Label className="text-sm font-medium">Imagens Adicionadas</Label>
              <div className="grid grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
                {images.map((image, index) => (
                  <div key={index} className="relative">
                    <ImagePreview src={image} index={index} />
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
                      onClick={() => removeImage(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {images.length === 0 && (
        <div className="text-center p-8 border-2 border-dashed border-border rounded-lg">
          <ImageIcon className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-sm text-muted-foreground">
            Nenhuma imagem adicionada ainda
          </p>
        </div>
      )}
    </div>
  );
};