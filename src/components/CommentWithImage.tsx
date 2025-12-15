import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { MultiImageUpload } from '@/components/MultiImageUpload';
import { RichText } from '@/components/RichText';
import { ChevronDown, ChevronUp, Image as ImageIcon, Save, BookOpen } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageLightbox, useLightbox } from '@/components/ImageLightbox';
import { ClickableImage } from '@/components/ClickableImage';

interface CommentWithImageProps {
  comment: string;
  commentImages?: string[];
  tags?: string[];
  fonte?: string;
  referencias?: string[];
  questionId: string;
  onUpdateComment?: (questionId: string, comment: string, images?: string[]) => void;
  isEditable?: boolean;
}

export const CommentWithImage: React.FC<CommentWithImageProps> = ({
  comment,
  commentImages,
  tags,
  fonte,
  referencias,
  questionId,
  onUpdateComment,
  isEditable = false
}) => {
  const { toast } = useToast();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedComment, setEditedComment] = useState(comment);
  const [editedImages, setEditedImages] = useState<string[]>(commentImages || []);
  const { isOpen, images: lightboxImages, initialIndex, openLightbox, closeLightbox } = useLightbox();

  const handleSaveEdit = () => {
    if (onUpdateComment) {
      onUpdateComment(questionId, editedComment, editedImages);
      setIsEditing(false);
      toast({
        title: "Comentário atualizado",
        description: "As alterações foram salvas com sucesso"
      });
    }
  };

  const handleCancelEdit = () => {
    setEditedComment(comment);
    setEditedImages(commentImages || []);
    setIsEditing(false);
  };

  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Lightbox Modal */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={initialIndex}
        isOpen={isOpen}
        onClose={closeLightbox}
      />
      
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <div className="bg-blue-50 dark:bg-blue-950/10 border-l-4 border-blue-500 p-3 sm:p-4 md:p-5 rounded-r-xl space-y-2 sm:space-y-3">
          <div className="flex items-start sm:items-center justify-between gap-2">
            <h4 className="font-bold text-blue-900 dark:text-blue-300 flex items-center gap-1 sm:gap-2 text-sm sm:text-base">
              💡 <span className="hidden xs:inline">Explicação da Resposta</span><span className="xs:hidden">Explicação</span>
              {(commentImages && commentImages.length > 0 || isEditing) && (
                <ImageIcon className="h-3 w-3 sm:h-4 sm:w-4" />
              )}
            </h4>
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {isEditable && !isEditing && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                  className="text-xs sm:text-sm px-2 sm:px-3"
                >
                  Editar
                </Button>
              )}
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="p-1 sm:p-2">
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </CollapsibleTrigger>
            </div>
          </div>

          {!isEditing ? (
            <div className="comment-content text-sm sm:text-base break-words overflow-hidden">
              <RichText content={comment} />
            </div>
          ) : (
            <div className="space-y-3">
              <textarea
                value={editedComment}
                onChange={(e) => setEditedComment(e.target.value)}
                className="w-full p-2 sm:p-3 border rounded-md text-sm sm:text-base min-h-[100px] sm:min-h-[120px] resize-y"
                placeholder="Digite a explicação..."
              />
            </div>
          )}

          <CollapsibleContent className="space-y-3">
            {!isEditing && commentImages && commentImages.length > 0 && (
              <div className="mt-2 sm:mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {commentImages.map((image, index) => (
                  <ClickableImage
                    key={index}
                    src={image}
                    alt={`Imagem explicativa ${index + 1}`}
                    onClick={() => openLightbox(commentImages, index)}
                    className="max-h-48 sm:max-h-60 md:max-h-72 border border-border shadow-sm"
                  />
                ))}
              </div>
            )}

            {isEditing && (
              <div className="space-y-3">
                <MultiImageUpload
                  images={editedImages}
                  onImagesChange={setEditedImages}
                  label="Imagens explicativas (opcional)"
                  maxImages={5}
                />
                <div className="flex flex-wrap gap-2">
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    className="bg-medical hover:bg-medical/90 text-xs sm:text-sm"
                  >
                    <Save className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                    Salvar
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCancelEdit}
                    className="text-xs sm:text-sm"
                  >
                    Cancelar
                  </Button>
                </div>
              </div>
            )}

            {tags && tags.length > 0 && (
              <div className="flex flex-wrap gap-1 pt-2">
                {tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-[10px] sm:text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
            )}

            {fonte && (
              <div className="flex items-start sm:items-center gap-2 mt-2 sm:mt-3 p-2 sm:p-3 bg-amber-50 dark:bg-amber-950/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 text-amber-700 dark:text-amber-400 shrink-0 mt-0.5 sm:mt-0" />
                <span className="text-xs sm:text-sm text-amber-900 dark:text-amber-200 break-words">
                  <span className="font-semibold">Fonte:</span> {fonte}
                </span>
              </div>
            )}

            {referencias && referencias.length > 0 && (
              <div className="mt-2 sm:mt-3 p-2 sm:p-3 md:p-4 bg-slate-50 dark:bg-slate-950/20 rounded-lg border border-slate-200 dark:border-slate-800">
                <h5 className="font-semibold text-xs sm:text-sm mb-2 flex items-center gap-2 text-slate-900 dark:text-slate-200">
                  <BookOpen className="h-3 w-3 sm:h-4 sm:w-4 shrink-0" />
                  <span className="hidden sm:inline">Referências Bibliográficas:</span>
                  <span className="sm:hidden">Referências:</span>
                </h5>
                <div className="space-y-1">
                  {referencias.map((ref, index) => (
                    <div key={index} className="text-[10px] sm:text-xs text-slate-700 dark:text-slate-400 pl-1 break-words">
                      {index + 1}. {ref}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CollapsibleContent>
        </div>
      </Collapsible>
    </div>
  );
};