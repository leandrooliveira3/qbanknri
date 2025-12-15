import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Info } from 'lucide-react';

export const TextFormattingGuide: React.FC = () => {
  const formats = [
    { label: 'Negrito', syntax: '**texto** ou __texto__', example: '**importante**' },
    { label: 'Itálico', syntax: '*texto* ou _texto_', example: '_enfatizado_' },
    { label: 'Sublinhado', syntax: '^^texto^^', example: '^^sublinhado^^' },
    { label: 'Tachado', syntax: '~~texto~~', example: '~~removido~~' },
    { label: 'Destaque', syntax: '==texto==', example: '==marcado==' },
    { label: 'Superscrito', syntax: '^texto^', example: 'CO^2^' },
    { label: 'Subscrito', syntax: '~texto~', example: 'H~2~O' },
  ];

  return (
    <Card className="mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <Info className="h-4 w-4" />
          Formatação de Texto
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-xs text-muted-foreground">
          Use estes códigos para formatar o texto nos comentários e enunciados:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {formats.map((format) => (
            <div key={format.label} className="flex items-center justify-between p-2 bg-secondary/30 rounded text-xs">
              <div>
                <Badge variant="outline" className="text-xs">
                  {format.label}
                </Badge>
                <div className="mt-1 font-mono text-xs text-muted-foreground">
                  {format.syntax}
                </div>
              </div>
              <div className="font-mono text-xs bg-background px-2 py-1 rounded border">
                {format.example}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};