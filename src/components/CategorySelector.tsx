import React, { useState } from 'react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Plus, Check, X } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { Badge } from '@/components/ui/badge';

interface CategorySelectorProps {
  value: string;
  onChange: (value: string) => void;
  label?: string;
  required?: boolean;
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({ 
  value, 
  onChange, 
  label = "Categoria",
  required = false 
}) => {
  const { categories, loading, addCustomCategory, categoryExists } = useCategories();
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [customCategory, setCustomCategory] = useState('');
  const [customMessage, setCustomMessage] = useState('');

  const handleSelectChange = (selectedValue: string) => {
    if (selectedValue === '__custom__') {
      setShowCustomInput(true);
      return;
    }
    onChange(selectedValue);
  };

  const handleAddCustomCategory = async () => {
    const trimmed = customCategory.trim();
    
    if (!trimmed) {
      setCustomMessage('Digite o nome da categoria');
      return;
    }

    if (categoryExists(trimmed)) {
      setCustomMessage('Esta categoria já existe');
      return;
    }

    // Adicionar categoria e selecioná-la
    const added = await addCustomCategory(trimmed);
    if (added) {
      onChange(trimmed);
      setCustomCategory('');
      setShowCustomInput(false);
      setCustomMessage('');
    }
  };

  const handleCancelCustom = () => {
    setShowCustomInput(false);
    setCustomCategory('');
    setCustomMessage('');
  };

  const handleKeyPress = async (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      await handleAddCustomCategory();
    } else if (e.key === 'Escape') {
      handleCancelCustom();
    }
  };

  if (loading) {
    return (
      <div>
        <Label>{label} {required && '*'}</Label>
        <div className="h-10 bg-muted animate-pulse rounded-md" />
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <Label>{label} {required && '*'}</Label>
      
      {!showCustomInput ? (
        <Select value={value} onValueChange={handleSelectChange}>
          <SelectTrigger>
            <SelectValue placeholder="Selecione ou crie uma categoria" />
          </SelectTrigger>
          <SelectContent>
            {categories.map(cat => (
              <SelectItem key={cat} value={cat}>
                {cat}
              </SelectItem>
            ))}
            <SelectItem value="__custom__" className="border-t mt-2 pt-2">
              <div className="flex items-center gap-2 text-primary">
                <Plus className="h-4 w-4" />
                <span>Criar nova categoria</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      ) : (
        <div className="space-y-2">
          <div className="flex gap-2">
            <Input
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder="Digite o nome da nova categoria..."
              className="flex-1"
              autoFocus
            />
            <Button 
              type="button" 
              onClick={handleAddCustomCategory}
              size="sm"
              variant="default"
            >
              <Check className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              onClick={handleCancelCustom}
              size="sm"
              variant="outline"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {customMessage && (
            <div className="text-sm text-muted-foreground">
              {customMessage}
            </div>
          )}
          
          <div className="text-xs text-muted-foreground">
            Press Enter para adicionar, Escape para cancelar
          </div>
        </div>
      )}

      {value && !showCustomInput && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>Categoria selecionada:</span>
          <Badge variant="secondary">{value}</Badge>
        </div>
      )}
    </div>
  );
};