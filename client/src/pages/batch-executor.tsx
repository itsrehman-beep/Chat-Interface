import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Play, 
  ClipboardCheck, 
  Loader2, 
  CheckCircle2, 
  XCircle,
  AlertCircle,
  ArrowLeft,
  FlaskConical,
  RefreshCw
} from "lucide-react";
import { Link } from "wouter";
import { ThemeToggle } from "@/components/theme-toggle";
import { apiRequest } from "@/lib/queryClient";

interface TestCase {
  rowIndex: number;
  TESTCASE_NUMBER?: string;
  MTX_SESSION_ID?: string;
  USER_PROMPT?: string;
  MTX_USER_QUERY?: string;
  EXPECTED_OUTPUT?: string;
  [key: string]: unknown;
}

interface TestCasesResponse {
  sheetName: string;
  headers: string[];
  testCases: TestCase[];
  totalCount: number;
}

interface TestResult {
  TEST_RUN_ID: string;
  TESTCASE_NUMBER: string;
  TEST_RESPONSE: string;
  EXPECTED_OUTPUT: string;
}

interface EvaluationResult {
  grade_score: number;
  grade_pass: boolean;
  grade_reason: string;
  testcase_number: string;
  row_number: number;
}

export default function BatchExecutorPage() {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [manualIds, setManualIds] = useState("");
  const [limit, setLimit] = useState<string>("5");
  const [results, setResults] = useState<TestResult[]>([]);
  const [evaluations, setEvaluations] = useState<EvaluationResult[]>([]);
  const [currentRunId, setCurrentRunId] = useState<string | null>(null);

  const testCasesQuery = useQuery<TestCasesResponse>({
    queryKey: ["/api/test-cases"],
  });

  const runBatchMutation = useMutation({
    mutationFn: async () => {
      const idsFromSelection = Array.from(selectedIds);
      const idsFromManual = manualIds
        .split(",")
        .map((id) => id.trim())
        .filter((id) => id.length > 0);
      
      const combinedIds = [...idsFromSelection, ...idsFromManual];
      const allIds = combinedIds.filter((id, index) => combinedIds.indexOf(id) === index);

      const payload: { limit?: number; specific_ids?: string[] } = {};
      if (allIds.length > 0) {
        payload.specific_ids = allIds;
      }
      if (limit && parseInt(limit) > 0) {
        payload.limit = parseInt(limit);
      }

      const response = await apiRequest("POST", "/api/batch-executor", payload);
      return response.json();
    },
    onSuccess: (data: TestResult[]) => {
      setResults(data);
      setEvaluations([]);
      if (data.length > 0 && data[0].TEST_RUN_ID) {
        setCurrentRunId(data[0].TEST_RUN_ID);
      }
    },
  });

  const evaluateMutation = useMutation({
    mutationFn: async () => {
      if (!currentRunId) throw new Error("No run ID available");
      const response = await apiRequest("POST", "/api/evaluator", { run_id: currentRunId });
      return response.json();
    },
    onSuccess: (data: EvaluationResult[]) => {
      setEvaluations(data);
    },
  });

  const toggleTestCase = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (!testCasesQuery.data) return;
    const allIds = testCasesQuery.data.testCases
      .map((tc) => {
        const rawId = tc.TESTCASE_NUMBER || tc.MTX_SESSION_ID;
        return rawId !== undefined && rawId !== null ? String(rawId) : "";
      })
      .filter((id): id is string => id.length > 0);
    
    if (selectedIds.size === allIds.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(allIds));
    }
  };

  const getEvaluationForTestCase = (testcaseNumber: string): EvaluationResult | undefined => {
    return evaluations.find((e) => e.testcase_number === testcaseNumber);
  };

  const getScoreColor = (score: number): string => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    if (score >= 4) return "text-orange-600 dark:text-orange-400";
    return "text-red-600 dark:text-red-400";
  };

  const testCases = testCasesQuery.data?.testCases || [];

  return (
    <div className="flex flex-col h-full w-full">
      <header className="flex items-center justify-between gap-4 p-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex items-center gap-2">
            <FlaskConical className="h-5 w-5 text-primary" />
            <h1 className="font-semibold text-lg">Batch Executor</h1>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="flex-1 overflow-hidden p-4">
        <div className="h-full flex gap-4">
          <div className="w-80 shrink-0 flex flex-col gap-4">
            <Card className="flex-1 flex flex-col overflow-hidden">
              <CardHeader className="pb-3 shrink-0">
                <div className="flex items-center justify-between gap-2">
                  <CardTitle className="text-base">Test Cases</CardTitle>
                  <div className="flex items-center gap-2">
                    {testCasesQuery.data && (
                      <Badge variant="secondary" data-testid="badge-total-count">
                        {testCasesQuery.data.totalCount} total
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => testCasesQuery.refetch()}
                      disabled={testCasesQuery.isFetching}
                      data-testid="button-refresh-testcases"
                    >
                      <RefreshCw className={`h-4 w-4 ${testCasesQuery.isFetching ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="flex-1 overflow-hidden p-0">
                {testCasesQuery.isLoading && (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                )}
                {testCasesQuery.isError && (
                  <div className="p-4 text-sm text-destructive flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Failed to load test cases
                  </div>
                )}
                {testCasesQuery.isSuccess && testCases.length > 0 && (
                  <>
                    <div className="px-4 py-2 border-b flex items-center gap-2">
                      <Checkbox
                        checked={selectedIds.size === testCases.length && testCases.length > 0}
                        onCheckedChange={toggleAll}
                        data-testid="checkbox-select-all"
                      />
                      <span className="text-sm text-muted-foreground">
                        {selectedIds.size > 0 ? `${selectedIds.size} selected` : "Select all"}
                      </span>
                    </div>
                    <ScrollArea className="h-[calc(100%-40px)]">
                      <div className="p-2 space-y-1">
                        {testCases.map((tc) => {
                          const rawId = tc.TESTCASE_NUMBER || tc.MTX_SESSION_ID;
                          const id = rawId !== undefined && rawId !== null ? String(rawId) : "";
                          const prompt = tc.USER_PROMPT || tc.MTX_USER_QUERY || "";
                          return (
                            <div
                              key={id || tc.rowIndex}
                              className="flex items-start gap-2 p-2 rounded-md hover-elevate cursor-pointer"
                              onClick={() => id && toggleTestCase(id)}
                              data-testid={`testcase-row-${id}`}
                            >
                              <Checkbox
                                checked={selectedIds.has(id)}
                                onCheckedChange={() => toggleTestCase(id)}
                                onClick={(e) => e.stopPropagation()}
                                data-testid={`checkbox-${id}`}
                              />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <Badge variant="outline" className="font-mono text-xs shrink-0">
                                    {id}
                                  </Badge>
                                </div>
                                {prompt && (
                                  <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                    {prompt}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </ScrollArea>
                  </>
                )}
                {testCasesQuery.isSuccess && testCases.length === 0 && (
                  <div className="flex items-center justify-center h-full text-muted-foreground text-sm">
                    No test cases found
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex-1 flex flex-col gap-4 overflow-hidden">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Run Configuration</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-sm text-muted-foreground mb-1.5 block">
                      Additional IDs (comma-separated)
                    </label>
                    <Input
                      placeholder="TC0001, TC0002, TC0003"
                      value={manualIds}
                      onChange={(e) => setManualIds(e.target.value)}
                      data-testid="input-testcase-ids"
                    />
                  </div>
                  <div className="w-24">
                    <label className="text-sm text-muted-foreground mb-1.5 block">
                      Limit
                    </label>
                    <Input
                      type="number"
                      placeholder="5"
                      value={limit}
                      onChange={(e) => setLimit(e.target.value)}
                      min={1}
                      max={100}
                      data-testid="input-limit"
                    />
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    onClick={() => runBatchMutation.mutate()}
                    disabled={runBatchMutation.isPending}
                    data-testid="button-run-batch"
                  >
                    {runBatchMutation.isPending ? (
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Play className="h-4 w-4 mr-2" />
                    )}
                    {selectedIds.size + (manualIds.trim() ? manualIds.split(",").filter(id => id.trim()).length : 0) > 0
                      ? `Run Tests (${selectedIds.size + (manualIds.trim() ? manualIds.split(",").filter(id => id.trim()).length : 0)})`
                      : `Run Tests (limit: ${limit || 5})`}
                  </Button>
                  {results.length > 0 && currentRunId && (
                    <Button
                      variant="secondary"
                      onClick={() => evaluateMutation.mutate()}
                      disabled={evaluateMutation.isPending}
                      data-testid="button-evaluate"
                    >
                      {evaluateMutation.isPending ? (
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      ) : (
                        <ClipboardCheck className="h-4 w-4 mr-2" />
                      )}
                      Evaluate Results
                    </Button>
                  )}
                </div>
                {runBatchMutation.isError && (
                  <div className="text-sm text-destructive flex items-center gap-2" data-testid="error-run-batch">
                    <AlertCircle className="h-4 w-4" />
                    {runBatchMutation.error?.message || "Failed to run tests"}
                  </div>
                )}
                {evaluateMutation.isError && (
                  <div className="text-sm text-destructive flex items-center gap-2" data-testid="error-evaluate">
                    <AlertCircle className="h-4 w-4" />
                    {evaluateMutation.error?.message || "Failed to evaluate"}
                  </div>
                )}
              </CardContent>
            </Card>

            {currentRunId && (
              <div className="text-sm text-muted-foreground" data-testid="run-id-display">
                Run ID: <Badge variant="outline" className="font-mono" data-testid="badge-run-id">{currentRunId}</Badge>
              </div>
            )}

            {results.length > 0 && (
              <Card className="flex-1 overflow-hidden flex flex-col">
                <CardHeader className="pb-3 shrink-0">
                  <CardTitle className="text-base flex items-center justify-between gap-2">
                    <span data-testid="text-results-count">Test Results ({results.length})</span>
                    {evaluations.length > 0 && (
                      <div className="flex items-center gap-2 text-sm font-normal" data-testid="evaluation-summary">
                        <span className="text-green-600 dark:text-green-400" data-testid="text-passed-count">
                          {evaluations.filter((e) => e.grade_pass).length} passed
                        </span>
                        <span className="text-muted-foreground">/</span>
                        <span className="text-red-600 dark:text-red-400" data-testid="text-failed-count">
                          {evaluations.filter((e) => !e.grade_pass).length} failed
                        </span>
                      </div>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 overflow-hidden p-0">
                  <ScrollArea className="h-full">
                    <div className="p-4 pt-0 space-y-4">
                      {results.map((result, idx) => {
                        const evaluation = getEvaluationForTestCase(result.TESTCASE_NUMBER);
                        return (
                          <div
                            key={`${result.TESTCASE_NUMBER}-${idx}`}
                            className="border rounded-md p-4 space-y-3"
                            data-testid={`result-${result.TESTCASE_NUMBER}`}
                          >
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <Badge variant="default" className="font-mono">
                                  {result.TESTCASE_NUMBER}
                                </Badge>
                                {evaluation && (
                                  <>
                                    {evaluation.grade_pass ? (
                                      <Badge variant="outline" className="text-green-600 border-green-600/30 bg-green-50 dark:bg-green-950/30" data-testid={`badge-pass-${result.TESTCASE_NUMBER}`}>
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Pass
                                      </Badge>
                                    ) : (
                                      <Badge variant="outline" className="text-red-600 border-red-600/30 bg-red-50 dark:bg-red-950/30" data-testid={`badge-fail-${result.TESTCASE_NUMBER}`}>
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Fail
                                      </Badge>
                                    )}
                                    <span className={`text-sm font-semibold ${getScoreColor(evaluation.grade_score)}`} data-testid={`text-score-${result.TESTCASE_NUMBER}`}>
                                      Score: {evaluation.grade_score}/10
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div>
                              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                Response
                              </label>
                              <div className="mt-1 bg-muted/30 rounded-md p-3 text-sm whitespace-pre-wrap">
                                {result.TEST_RESPONSE}
                              </div>
                            </div>

                            {result.EXPECTED_OUTPUT && (
                              <div>
                                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                  Expected Output
                                </label>
                                <div className="mt-1 bg-muted/30 rounded-md p-3 text-sm whitespace-pre-wrap font-mono text-xs overflow-x-auto">
                                  {result.EXPECTED_OUTPUT}
                                </div>
                              </div>
                            )}

                            {evaluation && (
                              <>
                                <Separator />
                                <div>
                                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                    Evaluation Reason
                                  </label>
                                  <div className="mt-1 text-sm">
                                    {evaluation.grade_reason}
                                  </div>
                                </div>
                              </>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {results.length === 0 && !runBatchMutation.isPending && (
              <div className="flex-1 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <FlaskConical className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p className="text-sm">Select test cases from the left panel and click Run Tests</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
