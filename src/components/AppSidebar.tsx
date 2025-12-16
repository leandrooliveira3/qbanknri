import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

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
  { title: "Adicionar", url: "add-question", icon: Plus },
  { title: "Importar", url: "import", icon: Upload },
  { title: "Prática", url: "practice-config", icon: GraduationCap },
  { title: "Simulados", url: "simulados", icon: ClipboardList },
  { title: "Estatísticas", url: "statistics", icon: BarChart3 },
  { title: "Análise", url: "detailed-statistics", icon: Sparkles },
];

interface AppSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  questionsCount: number;
}

export function AppSidebar({
  activeTab,
  onTabChange,
  questionsCount,
}: AppSidebarProps) {
  function handleClick(tab: string) {
    onTabChange(tab);
  }

  return (
    <Sidebar collapsible={false} className="border-r h-full w-64">
      <SidebarContent className="bg-sidebar flex flex-col h-full">

        {/* HEADER */}
        <div className="p-4 font-bold text-lg">
          NeuroQBank
        </div>

        {/* MENU */}
        <SidebarGroup className="flex-1 px-2 py-2">
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.url}>
                  <SidebarMenuButton
                    onClick={() => handleClick(item.url)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-left ${
                      activeTab === item.url
                        ? "bg-accent text-white"
                        : "hover:bg-muted"
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    <span>
                      {item.title}
                      {item.url === "questions" &&
                        ` (${questionsCount})`}
                    </span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

      </SidebarContent>
    </Sidebar>
  );
}
