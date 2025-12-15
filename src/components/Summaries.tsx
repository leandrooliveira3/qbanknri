import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Plus, FileText, Edit2, Trash2, Search, X } from 'lucide-react';
import { useSummaries, Summary } from '@/hooks/useSummaries';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface SummariesProps {
  onBack?: () => void;
}

export const Summaries: React.FC<SummariesProps> = ({ onBack }) => {
  const { summaries, loading, addSummary, updateSummary, deleteSummary } = useSummaries();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSummary, setEditingSummary] = useState<Summary | null>(null);
  const [viewingSummary, setViewingSummary] = useState<Summary | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({ title: '', content: '', category: '' });

  const filteredSummaries = summaries.filter(s => 
    s.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
    s.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.content.trim()) return;

    if (editingSummary) {
      await updateSummary(editingSummary.id, formData);
    } else {
      await addSummary(formData);
    }
    
    setFormData({ title: '', content: '', category: '' });
    setEditingSummary(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (summary: Summary) => {
    setEditingSummary(summary);
    setFormData({
      title: summary.title,
      content: summary.content,
      category: summary.category || ''
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    await deleteSummary(id);
  };

  const openNewDialog = () => {
    setEditingSummary(null);
    setFormData({ title: '', content: '', category: '' });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Resumos</h1>
          <p className="text-muted-foreground text-sm">Organize seu material de estudo</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Resumo
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingSummary ? 'Editar Resumo' : 'Novo Resumo'}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="Ex: Doenças Cerebrovasculares"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="category">Categoria (opcional)</Label>
                <Input
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
                  placeholder="Ex: Neurologia Vascular"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                  placeholder="Escreva seu resumo aqui..."
                  className="min-h-[300px]"
                  required
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit">
                  {editingSummary ? 'Salvar' : 'Criar'}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar resumos..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* List */}
      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Carregando...</div>
      ) : filteredSummaries.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
            <p className="text-muted-foreground">
              {searchTerm ? 'Nenhum resumo encontrado' : 'Nenhum resumo criado ainda'}
            </p>
            {!searchTerm && (
              <Button variant="outline" className="mt-4" onClick={openNewDialog}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeiro resumo
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSummaries.map(summary => (
            <Card key={summary.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewingSummary(summary)}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base line-clamp-1">{summary.title}</CardTitle>
                  <div className="flex gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleEdit(summary)}>
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
                          <AlertDialogTitle>Excluir resumo?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Esta ação não pode ser desfeita.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancelar</AlertDialogCancel>
                          <AlertDialogAction onClick={() => handleDelete(summary.id)}>
                            Excluir
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
                {summary.category && (
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full w-fit">
                    {summary.category}
                  </span>
                )}
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3">{summary.content}</p>
                <p className="text-xs text-muted-foreground mt-3">
                  {format(new Date(summary.updated_at), "d 'de' MMM, yyyy", { locale: ptBR })}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* View Dialog */}
      <Dialog open={!!viewingSummary} onOpenChange={() => setViewingSummary(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingSummary && (
            <>
              <DialogHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <DialogTitle className="text-xl">{viewingSummary.title}</DialogTitle>
                    {viewingSummary.category && (
                      <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full mt-2 inline-block">
                        {viewingSummary.category}
                      </span>
                    )}
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setViewingSummary(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </DialogHeader>
              <div className="prose prose-sm max-w-none mt-4">
                <div className="whitespace-pre-wrap text-foreground leading-relaxed">
                  {viewingSummary.content}
                </div>
              </div>
              <div className="flex justify-between items-center mt-6 pt-4 border-t">
                <p className="text-xs text-muted-foreground">
                  Atualizado em {format(new Date(viewingSummary.updated_at), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                </p>
                <Button variant="outline" onClick={() => {
                  handleEdit(viewingSummary);
                  setViewingSummary(null);
                }}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Editar
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
