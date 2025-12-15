import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";
import { 
  Brain, 
  FileText, 
  Plus, 
  Upload, 
  BarChart3,
  Home,
  Heart,
  ClipboardList,
  GraduationCap,
  Sparkles,
  Moon,
  Sun,
  Layers,
  StickyNote
} from "lucide-react";
import { useTheme } from "next-themes";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

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
  userEmail?: string;
}

export function AppSidebar({ activeTab, onTabChange, questionsCount, userEmail }: AppSidebarProps) {
  const { state } = useSidebar();
  const { theme, setTheme } = useTheme();
  const isCollapsed = state === "collapsed";

  const isActive = (tab: string) => activeTab === tab;

  return (
    <Sidebar collapsible="icon" className="border-r-0">
      <SidebarContent className="bg-sidebar flex flex-col">
        {/* Logo Header - Aristo Style */}
        <div className="p-4 flex items-center gap-3">
          <SidebarTrigger className="text-sidebar-foreground hover:bg-sidebar-accent p-2 rounded-lg">
            <div className="flex h-8 w-8 items-center justify-center">
              <Brain className="h-6 w-6" />
            </div>
          </SidebarTrigger>
          {!isCollapsed && (
            <span className="text-lg font-bold text-sidebar-foreground">NeuroQBank</span>
          )}
        </div>

        {/* Navigation - Icon focused like Aristo */}
        <SidebarGroup className="flex-1 px-2 py-4">
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              <TooltipProvider delayDuration={0}>
                {menuItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => onTabChange(item.url)}
                          className={`
                            w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                            ${isActive(item.url) 
                              ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                              : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                            }
                          `}
                        >
                          <item.icon className={`h-5 w-5 shrink-0 ${isCollapsed ? "mx-auto" : ""}`} />
                          {!isCollapsed && (
                            <span className="text-sm font-medium truncate">
                              {item.title}
                            </span>
                          )}
                        </SidebarMenuButton>
                      </TooltipTrigger>
                      {isCollapsed && (
                        <TooltipContent side="right" className="bg-sidebar-accent text-sidebar-foreground border-sidebar-border">
                          {item.title}
                          {item.url === "questions" && ` (${questionsCount})`}
                        </TooltipContent>
                      )}
                    </Tooltip>
                  </SidebarMenuItem>
                ))}
              </TooltipProvider>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Footer with theme toggle */}
        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center justify-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
              title={theme === "dark" ? "Modo claro" : "Modo escuro"}
            >
              {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
            {!isCollapsed && (
              <span className="text-xs text-sidebar-foreground/50">v2.0</span>
            )}
          </div>
        </div>
      </SidebarContent>
    </Sidebar>
  );
}