import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { FolderTree, Edit2, Trash2, Plus, Save, X } from 'lucide-react';

export const CategoryManager: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [categories, setCategories] = useState<{name: string; count: number}[]>([]);
  const [editingCategory, setEditingCategory] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [deleteCategory, setDeleteCategory] = useState<string | null>(null);
  const { toast } = useToast();

  // Carregar categorias
  const loadCategories = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Buscar categorias e contar questões
    const { data: questions } = await supabase
      .from('questions')
      .select('categoria')
      .eq('user_id', user.id);

    const categoryCounts: Record<string, number> = {};
    questions?.forEach(q => {
      categoryCounts[q.categoria] = (categoryCounts[q.categoria] || 0) + 1;
    });

    const categoriesList = Object.entries(categoryCounts).map(([name, count]) => ({ name, count }));
    setCategories(categoriesList);
  };

  useEffect(() => {
    loadCategories();
  }, []);

  // Adicionar categoria
  const handleAddCategory = async () => {
    if (!newCategory.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('categories')
      .insert({ user_id: user.id, name: newCategory.trim() });

    if (error) {
      toast({ title: "Erro ao adicionar categoria", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Categoria adicionada!", description: `"${newCategory}" foi adicionada.` });
    setNewCategory('');
    loadCategories();
  };

  // Editar categoria (renomear em todas as questões)
  const handleRenameCategory = async (oldName: string, newName: string) => {
    if (!newName.trim() || oldName === newName) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Atualizar questões
    const { error: questionsError } = await supabase
      .from('questions')
      .update({ categoria: newName.trim() })
      .eq('user_id', user.id)
      .eq('categoria', oldName);

    if (questionsError) {
      toast({ title: "Erro ao renomear", description: questionsError.message, variant: "destructive" });
      return;
    }

    // Atualizar tabela de categorias
    await supabase
      .from('categories')
      .update({ name: newName.trim() })
      .eq('user_id', user.id)
      .eq('name', oldName);

    toast({ title: "Categoria renomeada!", description: `"${oldName}" → "${newName}"` });
    setEditingCategory(null);
    loadCategories();
  };

  // Deletar categoria
  const handleDeleteCategory = async (categoryName: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    // Deletar questões da categoria
    const { error: deleteError } = await supabase
      .from('questions')
      .delete()
      .eq('user_id', user.id)
      .eq('categoria', categoryName);

    if (deleteError) {
      toast({ title: "Erro ao deletar", description: deleteError.message, variant: "destructive" });
      return;
    }

    // Deletar categoria
    await supabase
      .from('categories')
      .delete()
      .eq('user_id', user.id)
      .eq('name', categoryName);

    toast({ 
      title: "Categoria deletada", 
      description: `"${categoryName}" e suas questões foram removidas.`,
      variant: "default"
    });
    setDeleteCategory(null);
    loadCategories();
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FolderTree className="h-5 w-5" />
            Gerenciar Categorias
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Adicionar nova categoria */}
        <div className="flex gap-2">
          <Input 
            placeholder="Nome da nova categoria" 
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
          />
          <Button onClick={handleAddCategory}>
            <Plus className="h-4 w-4 mr-2" />
            Adicionar
          </Button>
        </div>

        {/* Lista de categorias */}
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {categories.map(cat => (
            <div key={cat.name} className="flex items-center justify-between p-3 border rounded-lg">
              {editingCategory === cat.name ? (
                <div className="flex gap-2 flex-1">
                  <Input 
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleRenameCategory(cat.name, editValue);
                      if (e.key === 'Escape') setEditingCategory(null);
                    }}
                    autoFocus
                  />
                  <Button size="sm" onClick={() => handleRenameCategory(cat.name, editValue)}>
                    <Save className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{cat.name}</span>
                    <Badge variant="secondary">{cat.count} questões</Badge>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => {
                        setEditingCategory(cat.name);
                        setEditValue(cat.name);
                      }}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => setDeleteCategory(cat.name)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* Dialog de confirmação de delete */}
        <AlertDialog open={!!deleteCategory} onOpenChange={() => setDeleteCategory(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
              <AlertDialogDescription>
                Isso irá deletar a categoria "{deleteCategory}" e TODAS as {categories.find(c => c.name === deleteCategory)?.count || 0} questões associadas.
                Esta ação não pode ser desfeita.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction onClick={() => deleteCategory && handleDeleteCategory(deleteCategory)}>
                Deletar Tudo
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
};