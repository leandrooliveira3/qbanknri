import React, { useState } from "react";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

import { Dashboard } from "@/components/Dashboard";
import { QuestionForm } from "@/components/QuestionForm";
import { QuestionEditor } from "@/components/QuestionEditor";
import { QuestionBank } from "@/components/QuestionBank";
import { FavoriteQuestions } from "@/components/FavoriteQuestions";
import { ImportQuestions } from "@/components/ImportQuestions";
import { PracticeMode } from "@/components/PracticeMode";
import { PracticeConfig } from "@/components/PracticeConfig";
import { SimuladoMode } from "@/components/SimuladoMode";
import { SimuladoConfig } from "@/components/SimuladoConfig";
import { Statistics } from "@/components/Statistics";
import { DetailedStatistics } from "@/components/DetailedStatistics";
import { Summaries } from "@/components/Summaries";
import { Flashcards } from "@/components/Flashcards";

import {
  Question,
  SimuladoConfig as SimuladoConfigType,
  SimuladoResult,
} from "@/types/question";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LogOut } from "lucide-react";
import ErrorBoundary from "@/components/ErrorBoundary";
import { useQuestions } from "@/hooks/useQuestions";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";

const Index = () => {
  const {
    questions,
    loading,
    hasMore,
    loadMore,
    loadQuestionsByCategory,
    getAllCategories,
    getAllCategoriesWithCounts,
    addQuestion,
    importQuestions,
    updateQuestion,
    deleteQuestion,
    refetch,
  } = useQuestions();

  const { user, signOut } = useAuth();

  const [activeTab, setActiveTab] = useState("dashboard");
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [practiceQuestions, setPracticeQuestions] = useState<Question[]>([]);
  const [simuladoConfig, setSimuladoConfig] =
    useState<SimuladoConfigType | null>(null);
  const [simuladoQuestions, setSimuladoQuestions] = useState<Question[]>([]);

  /* ================= HANDLERS ================= */

  const handleAddQuestion = async (
    questionData: Omit<Question, "id" | "createdAt">
  ) => {
    await addQuestion(questionData);
    setActiveTab("questions");
  };

  const handleImportQuestions = async (
    questionsData: Omit<Question, "id" | "createdAt">[]
  ) => {
    await importQuestions(questionsData);
    await refetch();
    setActiveTab("questions");
  };

  const handleEditQuestion = (question: Question) => {
    setEditingQuestion(question);
    setActiveTab("edit-question");
  };

  const handleUpdateQuestion = async (
    id: string,
    questionData: Partial<Question>
  ) => {
    await updateQuestion(id, questionData);
    setEditingQuestion(null);
    setActiveTab("questions");
  };

  const handleStartPracticeWithQuestions = (selectedQuestions: Question[]) => {
    setPracticeQuestions(selectedQuestions);
    setActiveTab("practice");
  };

  const handleStartSmartReview = (smartQuestions: Question[]) => {
    setPracticeQuestions(smartQuestions);
    setActiveTab("practice");
  };

  const handleStartSimulado = (
    config: SimuladoConfigType,
    selectedQuestions: Question[]
  ) => {
    setSimuladoConfig(config);
    setSimuladoQuestions(selectedQuestions);
    setActiveTab("simulado-active");
  };

  const handleFinishSimulado = (result: SimuladoResult) => {
    console.log("Simulado finalizado:", result);
    setActiveTab("simulados");
  };

  /* ================= CONTENT ================= */

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <Dashboard
            questions={questions}
            onCreateSimulado={() => setActiveTab("simulados")}
            onAddQuestion={() => setActiveTab("add-question")}
            onStartPractice={() => setActiveTab("practice-config")}
            onImportQuestions={() => setActiveTab("import")}
            onStartSmartReview={handleStartSmartReview}
          />
        );

      case "questions":
        return (
          <QuestionBank
            questions={questions}
            loading={loading}
            hasMore={hasMore}
            onLoadMore={loadMore}
            onEdit={handleEditQuestion}
            onDelete={deleteQuestion}
          />
        );

      case "favorites":
        return (
          <FavoriteQuestions
            questions={questions}
            onEditQuestion={handleEditQuestion}
          />
        );

      case "summaries":
        return <Summaries />;

      case "flashcards":
        return <Flashcards />;

      case "add-question":
        return (
          <QuestionForm
            onAddQuestion={handleAddQuestion}
            onCancel={() => setActiveTab("questions")}
          />
        );

      case "edit-question":
        return editingQuestion ? (
          <QuestionEditor
            question={editingQuestion}
            onUpdateQuestion={handleUpdateQuestion}
            onCancel={() => {
              setEditingQuestion(null);
              setActiveTab("questions");
            }}
          />
        ) : null;

      case "import":
        return (
          <ImportQuestions
            onImportQuestions={handleImportQuestions}
            onCancel={() => setActiveTab("dashboard")}
          />
        );

      case "practice-config":
        return (
          <PracticeConfig
            questions={questions}
            loading={loading}
            loadQuestionsByCategory={loadQuestionsByCategory}
            getAllCategories={getAllCategories}
            getAllCategoriesWithCounts={getAllCategoriesWithCounts}
            onStartPractice={handleStartPracticeWithQuestions}
            onBack={() => setActiveTab("dashboard")}
          />
        );

      case "practice":
        return (
          <PracticeMode
            questions={
              practiceQuestions.length > 0 ? practiceQuestions : questions
            }
            onBack={() => setActiveTab("practice-config")}
            onUpdateQuestion={updateQuestion}
          />
        );

      case "simulados":
        return (
          <SimuladoConfig
            questions={questions}
            loading={loading}
            loadQuestionsByCategory={loadQuestionsByCategory}
            onStartSimulado={handleStartSimulado}
            onBack={() => setActiveTab("dashboard")}
          />
        );

      case "simulado-active":
        return simuladoConfig ? (
          <SimuladoMode
            questions={simuladoQuestions}
            config={simuladoConfig}
            onFinish={handleFinishSimulado}
            onBack={() => setActiveTab("simulados")}
          />
        ) : null;

      case "statistics":
        return (
          <ErrorBoundary
            fallback={
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="font-semibold">
                    Não foi possível carregar as estatísticas
                  </p>
                </CardContent>
              </Card>
            }
          >
            <Statistics />
          </ErrorBoundary>
        );

      case "detailed-statistics":
        return (
          <ErrorBoundary
            fallback={
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="font-semibold">
                    Não foi possível carregar as estatísticas detalhadas
                  </p>
                </CardContent>
              </Card>
            }
          >
            <DetailedStatistics />
          </ErrorBoundary>
        );

      default:
        return null;
    }
  };

  /* ================= LAYOUT ================= */

  return (
    <SidebarProvider>
      <div className="min-h-screen w-full flex bg-background">

        {/* SIDEBAR */}
        <AppSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          questionsCount={questions.length}
          userEmail={user?.email}
        />

        {/* MAIN AREA */}
        <div className="flex-1 flex flex-col min-w-0">

          {/* HEADER */}
          <header className="h-14 border-b bg-card sticky top-0 z-40">
            <div className="flex items-center justify-between h-full px-4">

              <div className="flex items-center gap-3">
                {/* HAMBURGER (MOBILE) */}
                <div className="md:hidden">
                  <SidebarTrigger />
                </div>

                <h1 className="text-lg font-semibold truncate">
                  NeuroQBank
                </h1>
              </div>

              <div className="flex items-center gap-3">
                <ThemeToggle />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={signOut}
                  className="flex items-center gap-2 text-muted-foreground hover:text-foreground"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </Button>
              </div>

            </div>
          </header>

          {/* CONTENT */}
          <main className="flex-1 overflow-auto bg-muted/30">
            <div className="container mx-auto p-4 sm:p-6 max-w-7xl">
              {renderContent()}
            </div>
          </main>

        </div>
      </div>
    </SidebarProvider>
  );
};

export default Index;
