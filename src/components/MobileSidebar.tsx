import {
  Sheet,
  SheetContent,
} from "@/components/ui/sheet";

import {
  Home,
  FileText,
  Heart,
  StickyNote,
  Layers,
  Plus,
  Upload,
  GraduationCap,
  ClipboardList,
  BarChart3,
  Sparkles,
} from "lucide-react";

const menuItems = [
  { title: "Agenda", url: "dashboard", icon: Home },
  { title: "Questões", url: "questions", icon: FileText },
  { title: "Favoritas", url: "favorites", icon: Heart },
  { title: "Resumos", url: "summaries", icon: StickyNote },
  { title: "Flashcards", url: "flashcards", icon: Layers },

  // ➕ AGORA INCLUÍDOS
  { title: "Adicionar", url: "add-question", icon: Plus },
  { title: "Importar", url: "import", icon: Upload },
  { title: "Prática", url: "practice-config", icon: GraduationCap },
  { title: "Simulados", url: "simulados", icon: ClipboardList },

  { title: "Estatísticas", url: "statistics", icon: BarChart3 },
  { title: "Análise", url: "detailed-statistics", icon: Sparkles },
];

interface MobileSidebarProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
  questionsCount: number;
}

export function MobileSidebar({
  open,
  onOpenChange,
  activeTab,
  onTabChange,
  questionsCount,
}: MobileSidebarProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-64 p-0">

        <div className="p-4 font-bold text-lg border-b">
          NeuroQBank
        </div>

        <nav className="flex flex-col gap-1 p-2">
          {menuItems.map((item) => (
            <button
              key={item.url}
              onClick={() => onTabChange(item.url)}
              className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left ${
                activeTab === item.url
                  ? "bg-accent"
                  : "hover:bg-muted"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>
                {item.title}
                {item.url === "questions" &&
                  ` (${questionsCount})`}
              </span>
            </button>
          ))}
        </nav>

      </SheetContent>
    </Sheet>
  );
}
