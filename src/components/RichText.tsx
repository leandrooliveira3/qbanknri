import React from 'react';

interface RichTextProps {
  content: string;
  className?: string;
}

export const RichText: React.FC<RichTextProps> = ({ content, className = '' }) => {
  // Converte texto simples em HTML com formatação básica
  const formatText = (text: string) => {
    return text
      // Negrito: **texto** ou __texto__
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/__(.*?)__/g, '<strong>$1</strong>')
      // Itálico: *texto* ou _texto_
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/(?<!_)_([^_]+?)_(?!_)/g, '<em>$1</em>')
      // Sublinhado: ^^texto^^
      .replace(/\^\^(.*?)\^\^/g, '<u>$1</u>')
      // Tachado: ~~texto~~
      .replace(/~~(.*?)~~/g, '<s>$1</s>')
      // Destaque/marcação: ==texto==
      .replace(/==(.*?)==/g, '<mark>$1</mark>')
      // Superscrito: ^texto^
      .replace(/\^([^\^]+?)\^/g, '<sup>$1</sup>')
      // Subscrito: ~texto~
      .replace(/~([^~]+?)~/g, '<sub>$1</sub>')
      // Quebras de linha duplas para parágrafos
      .replace(/\n\n/g, '</p><p>')
      // Quebras de linha simples
      .replace(/\n/g, '<br />')
      // Lista com marcadores: - item
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      // Envolver listas
      .replace(/(<li>.*<\/li>)/gs, '<ul>$1</ul>')
      // Títulos: ### Título
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^# (.+)$/gm, '<h1>$1</h1>');
  };

  const formattedContent = `<p>${formatText(content)}</p>`;

  return (
    <div 
      className={`rich-text ${className}`}
      dangerouslySetInnerHTML={{ __html: formattedContent }}
    />
  );
};