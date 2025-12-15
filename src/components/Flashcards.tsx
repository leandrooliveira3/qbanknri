import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, Layers, Edit2, Trash2, Search, Play, RotateCcw } from 'lucide-react';
import { useFlashcards, Flashcard } from '@/hooks/useFlashcards';
import { FlashcardPractice } from './FlashcardPractice';

interface FlashcardsProps {
  onBack?: () => void;
}

export const Flashcards: React.FC<FlashcardsProps> = ({ onBack }) => {
  const { flashcards, loading, getDueFlashcards, addFlashcard, updateFlashcard, deleteFlashcard, reviewFlashcard } = useFlashcards();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isPracticing, setIsPracticing] = useState(false);
  const [practiceCards, setPracticeCards] = useState<Flashcard[]>([]);
  const [formData, setFormData] = useState({ front: '', back: '', category: '' });

  const filteredFlashcards = flashcards.filter(fc => 
    fc.front.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fc.back.toLowerCase().includes(searchTerm.toLowerCase()) ||
    fc.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const dueCount = getDueFlashcards().length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.front.trim() || !formData.back.trim()) return;

    if (editingFlashcard) {
      await updateFlashcard(editingFlashcard.id, formData);
    } else {
      await addFlashcard(formData);
    }
    
    setFormData({ front: '', back: '', category: '' });
    setEditingFlashcard(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (flashcard: Flashcard) => {
    setEditingFlashcard(flashcard);
    setFormData({
      front: flashcard.front,
      back: flashcard.back,
      category: flashcard.category || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteFlashcard(id);
  };

  const openNewDialog = () => {
    setEditingFlashcard(null);
    setFormData({ front: '', back: '', category: '' });
    setIsDialogOpen(true);
  };

  const startPractice = (cards: Flashcard[]) => {
    if (cards.length === 0) return;
    setPracticeCards(cards);
    setIsPracticing(true);
  };

  if (isPracticing && practiceCards.length > 0) {
    return (
      <FlashcardPractice
        flashcards={practiceCards}
        onReview={reviewFlashcard}
        onFinish={() => {
          setIsPracticing(false);
          setPracticeCards([]);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Flashcards</h1>
          <p className="text-muted-foreground text-sm">Memorize conceitos com repetição espaçada</p>
        </div>
        <div className="flex gap-2">
          {dueCount > 0 && (
            <Button onClick={() => startPractice(getDueFlashcards())} variant="default">
              <Play className="h-4 w-4 mr-2" />
              Revisar ({dueCount})
            </Button>
          )}
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Novo
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingFlashcard ? 'Editar Flashcard' : 'Novo Flashcard'}</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="front">Frente (pergunta)</Label>
                  <Textarea
                    id="front"
                    value={formData.front}
                    onChange={(e) => setFormData(prev => ({ ...prev, front: e.target.value }))}
                    placeholder="O que é a Escala de Glasgow?"
                    className="min-h-[80px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="back">Verso (resposta)</Label>
                  <Textarea
                    id="back"
                    value={formData.back}
                    onChange={(e) => setFormData(prev => ({ ...prev, back: e.target.value }))}
                    placeholder="Escala para avaliar nível de consciência..."
                    className="min-h-[80px]"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Categoria (opcional)</Label>
                  <Input
                    id="category"
                    value={formData.category}
                    onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                    placeholder="Ex: Semiologia"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button type="submit">
                    {editingFlashcard ? 'Salvar' : 'Criar'}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-foreground">{flashcards.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card className={dueCount > 0 ? 'border-primary' : ''}>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-primary">{dueCount}</p>
            <p className="text-sm text-muted-foreground">Para revisar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-success">{flashcards.filter(fc => fc.repetitions >= 3).length}</p>
            <p className="text-sm text-muted-foreground">Aprendidos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-2xl font-bold text-foreground">{flashcards.filter(fc => fc.repetitions === 0).length}</p>
            <p className="text-sm text-muted-foreground">Novos</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar flashcards..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Practice All Button */}
      {flashcards.length > 0 && (
        <Button variant="outline" className="w-full" onClick={() => startPractice(flashcards)}>
          <RotateCcw className="h-4 w-4 mr-2" />
          Praticar todos ({flashcards.length} cards)
        </Button>
      )}

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : filteredFlashcards.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <Layers className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum flashcard encontrado' : 'Nenhum flashcard criado ainda'}
            </p>
            {!searchTerm && (
              <Button variant="outline" className="mt-4" onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro flashcard
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredFlashcards.map(flashcard => (
            <Card key={flashcard.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-sm font-medium line-clamp-2">{flashcard.front}</CardTitle>
                  <div className="flex gap-1 shrink-0">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(flashcard)}>
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Excluir flashcard?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(flashcard.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-2">{flashcard.back}</p>
                <div className="flex items-center justify-between mt-3">
                  {flashcard.category && (
                    <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                      {flashcard.category}
                    </span>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    flashcard.repetitions === 0 ? 'bg-muted text-muted-foreground' :
                    flashcard.repetitions >= 3 ? 'bg-success/10 text-success' :
                    'bg-warning/10 text-warning'
                  }`}>
                    {flashcard.repetitions === 0 ? 'Novo' : 
                     flashcard.repetitions >= 3 ? 'Aprendido' : 
                     `${flashcard.repetitions}x revisado`}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
