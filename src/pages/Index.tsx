import React, { useState } from "react";
import {
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

import { AppSidebar } from "@/components/AppSidebar";
import { Dashboard } from "@/components/Dashboard";
import { QuestionBank } from "@/components/QuestionBank";
import { FavoriteQuestions } from "@/components/FavoriteQuestions";
import { Summaries } from "@/components/Summaries";
import { Flashcards } from "@/components/Flashcards";
import { Statistics } from "@/components/Statistics";
import { DetailedStatistics } from "@/components/DetailedStatistics";

import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useQuestions } from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";

const Index = () => {
  const { questions, loading, hasMore, loadMore } = useQuestions();
  const { signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const closeSidebar = () => setSidebarOpen(false);

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <Dashboard questions={questions} />;
      case "questions":
        return (
          <QuestionBank
            questions={questions}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
          />
        );
      case "favorites":
        return <FavoriteQuestions questions={questions} />;
      case "summaries":
        return <Summaries />;
      case "flashcards":
        return <Flashcards />;
      case "statistics":
        return <Statistics />;
      case "detailed-statistics":
        return <DetailedStatistics />;
      default:
        return null;
    }
  };

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="min-h-screen w-full flex bg-background">

        <AppSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          closeSidebar={closeSidebar}
          questionsCount={questions.length}
        />

        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-14 border-b bg-card sticky top-0 z-40">
            <div className="flex items-center h-full px-4 gap-3">

              <div className="md:hidden">
                <SidebarTrigger />
              </div>

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

          <main className="flex-1 overflow-auto bg-muted/30 p-4">
            {renderContent()}
          </main>
        </div>

      </div>
    </SidebarProvider>
  );
};

export default Index;
