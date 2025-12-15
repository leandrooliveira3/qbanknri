import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Checkbox } from '@/components/ui/checkbox';
import { Plus, X, FolderOpen } from 'lucide-react';

interface ThemeSelectorPopoverProps {
  availableCategories: string[];
  selectedCategories: string[];
  onCategoryToggle: (category: string) => void;
  getCategoryCount: (category: string) => number;
  enableRandomMode?: boolean;
  onRandomModeChange?: (enabled: boolean) => void;
  randomMode?: boolean;
  // Subcategories
  availableSubcategories?: string[];
  selectedSubcategories?: string[];
  onSubcategoryToggle?: (subcategory: string) => void;
  getSubcategoryCount?: (subcategory: string) => number;
}

export const ThemeSelectorPopover: React.FC<ThemeSelectorPopoverProps> = ({
  availableCategories,
  selectedCategories,
  onCategoryToggle,
  getCategoryCount,
  availableSubcategories = [],
  selectedSubcategories = [],
  onSubcategoryToggle,
  getSubcategoryCount,
}) => {
  const [openCategories, setOpenCategories] = useState(false);
  const [openSubcategories, setOpenSubcategories] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [subSearchQuery, setSubSearchQuery] = useState('');

  const filteredCategories = useMemo(() => {
    if (!searchQuery.trim()) return availableCategories;
    return availableCategories.filter(cat =>
      cat.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [availableCategories, searchQuery]);

  const filteredSubcategories = useMemo(() => {
    if (!subSearchQuery.trim()) return availableSubcategories;
    return availableSubcategories.filter(sub =>
      sub.toLowerCase().includes(subSearchQuery.toLowerCase())
    );
  }, [availableSubcategories, subSearchQuery]);

  const handleSelectCategory = (category: string) => {
    onCategoryToggle(category);
  };

  const handleRemoveCategory = (category: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onCategoryToggle(category);
  };

  const handleSelectSubcategory = (subcategory: string) => {
    if (onSubcategoryToggle) {
      onSubcategoryToggle(subcategory);
    }
  };

  const handleRemoveSubcategory = (subcategory: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (onSubcategoryToggle) {
      onSubcategoryToggle(subcategory);
    }
  };

  return (
    <div className="space-y-5">
      {/* Categories Section */}
      <div className="space-y-3">
        {selectedCategories.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {selectedCategories.map(category => (
              <Badge
                key={category}
                variant="secondary"
                className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-2"
              >
                {category}
                <span className="text-xs text-muted-foreground">({getCategoryCount(category)})</span>
                <button
                  onClick={(e) => handleRemoveCategory(category, e)}
                  className="ml-1 p-1 rounded-full hover:bg-destructive/20 transition-colors"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <Popover open={openCategories} onOpenChange={setOpenCategories}>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto justify-start gap-2">
              <Plus className="h-4 w-4" />
              Adicionar tema
              {selectedCategories.length > 0 && (
                <Badge variant="secondary" className="ml-2">{selectedCategories.length}</Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-[300px] sm:w-[400px] p-0 z-50 bg-popover" align="start">
            <Command>
              <CommandInput
                placeholder="Buscar tema..."
                value={searchQuery}
                onValueChange={setSearchQuery}
                className="h-11"
              />
              <CommandList className="max-h-[300px]">
                <CommandEmpty>Nenhum tema encontrado.</CommandEmpty>
                <CommandGroup>
                  {filteredCategories.map(category => {
                    const isSelected = selectedCategories.includes(category);
                    const count = getCategoryCount(category);

                    return (
                      <CommandItem
                        key={category}
                        value={category}
                        onSelect={() => handleSelectCategory(category)}
                        className="flex items-center gap-3 py-2.5 px-3 cursor-pointer"
                      >
                        <Checkbox
                          checked={isSelected}
                          className="h-4 w-4"
                        />
                        <div className="flex-1 min-w-0">
                          <span className="text-sm truncate block">{category}</span>
                        </div>
                        <span className="text-xs text-muted-foreground">{count}</span>
                      </CommandItem>
                    );
                  })}
                </CommandGroup>
              </CommandList>
            </Command>
          </PopoverContent>
        </Popover>

        {selectedCategories.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Selecione os temas que deseja estudar
          </p>
        )}
      </div>

      {/* Subcategories Section */}
      {availableSubcategories.length > 0 && onSubcategoryToggle && (
        <div className="space-y-3 pt-4 border-t">
          <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
            <FolderOpen className="h-4 w-4" />
            Subtemas
          </div>

          {selectedSubcategories.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {selectedSubcategories.map(subcategory => (
                <Badge
                  key={subcategory}
                  variant="outline"
                  className="pl-3 pr-1 py-1.5 text-sm flex items-center gap-2"
                >
                  {subcategory}
                  {getSubcategoryCount && (
                    <span className="text-xs text-muted-foreground">({getSubcategoryCount(subcategory)})</span>
                  )}
                  <button
                    onClick={(e) => handleRemoveSubcategory(subcategory, e)}
                    className="ml-1 p-1 rounded-full hover:bg-destructive/20 transition-colors"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          )}

          <Popover open={openSubcategories} onOpenChange={setOpenSubcategories}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="justify-start gap-2">
                <Plus className="h-4 w-4" />
                Adicionar subtema
                {selectedSubcategories.length > 0 && (
                  <Badge variant="secondary" className="ml-2">{selectedSubcategories.length}</Badge>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] sm:w-[400px] p-0 z-50 bg-popover" align="start">
              <Command>
                <CommandInput
                  placeholder="Buscar subtema..."
                  value={subSearchQuery}
                  onValueChange={setSubSearchQuery}
                  className="h-11"
                />
                <CommandList className="max-h-[300px]">
                  <CommandEmpty>Nenhum subtema encontrado.</CommandEmpty>
                  <CommandGroup>
                    {filteredSubcategories.map(subcategory => {
                      const isSelected = selectedSubcategories.includes(subcategory);
                      const count = getSubcategoryCount ? getSubcategoryCount(subcategory) : 0;

                      return (
                        <CommandItem
                          key={subcategory}
                          value={subcategory}
                          onSelect={() => handleSelectSubcategory(subcategory)}
                          className="flex items-center gap-3 py-2.5 px-3 cursor-pointer"
                        >
                          <Checkbox
                            checked={isSelected}
                            className="h-4 w-4"
                          />
                          <div className="flex-1 min-w-0">
                            <span className="text-sm truncate block">{subcategory}</span>
                          </div>
                          <span className="text-xs text-muted-foreground">{count}</span>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>
        </div>
      )}
    </div>
  );
};
