import React, { useState } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/AppSidebar";
import { MobileSidebar } from "@/components/MobileSidebar";

import { Button } from "@/components/ui/button";
import { LogOut, Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuestions } from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { questions } = useQuestions();
  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    // 🔑 SEM ISSO → TELA PRETA
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">

        {/* DESKTOP SIDEBAR */}
        <div className="hidden md:block">
          <AppSidebar
            activeTab={activeTab}
            onTabChange={setActiveTab}
            questionsCount={questions.length}
          />
        </div>

        {/* MOBILE SIDEBAR */}
        <MobileSidebar
          open={mobileOpen}
          onOpenChange={setMobileOpen}
          activeTab={activeTab}
          onTabChange={(tab) => {
            setActiveTab(tab);
            setMobileOpen(false);
          }}
          questionsCount={questions.length}
        />

        {/* MAIN */}
        <div className="flex-1 flex flex-col min-w-0">

          <header className="h-14 border-b bg-card sticky top-0 z-40">
            <div className="flex items-center h-full px-4 gap-3">

              <button
                className="md:hidden"
                onClick={() => setMobileOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </button>

              <h1 className="text-lg font-semibold truncate">
                NeuroQBank
              </h1>

              <div className="ml-auto flex items-center gap-2">
                <ThemeToggle />
                <Button variant="ghost" size="sm" onClick={signOut}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>

            </div>
          </header>

          <main className="flex-1 overflow-auto p-4">
            {/* renderContent */}
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
