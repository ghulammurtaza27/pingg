import { Button } from "./ui/button";
import { Card, CardContent, CardTitle, CardHeader } from "./ui/card";

interface CoalescedSummaryData {
    summary: string;
    capabilities: string[];
    useCases: string[];
    limitations: string[];
    additionalContext?: string;
  }
  
  interface CoalescedSummaryProps {
    data: CoalescedSummaryData | null;
    onGenerateSummary?: () => void;
  }
  
  export function CoalescedSummary({ 
    data,
    onGenerateSummary
  }: CoalescedSummaryProps) {
    if (!data) {
      return (
        <Card>
          <CardHeader>
            <CardTitle>Knowledge Base Summary</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No summary available yet. Generate a summary from your knowledge base entries.
              </p>
              {onGenerateSummary && (
                <Button onClick={onGenerateSummary} variant="outline">
                  Generate Summary
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )
    }
  
    return (
      <Card>
        <CardHeader>
          <CardTitle>Knowledge Base Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">Summary</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {data.summary}
            </p>
          </div>
          
          <div>
            <h3 className="text-lg font-semibold mb-2">Capabilities</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {data.capabilities?.map((cap, i) => (
                <li key={i} className="leading-relaxed">{cap}</li>
              ))}
            </ul>
          </div>
  
          <div>
            <h3 className="text-lg font-semibold mb-2">Use Cases</h3>
            <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
              {data.useCases?.map((use, i) => (
                <li key={i} className="leading-relaxed">{use}</li>
              ))}
            </ul>
          </div>
  
          {data.limitations?.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Limitations</h3>
              <ul className="list-disc pl-5 text-sm text-muted-foreground space-y-1">
                {data.limitations.map((limit, i) => (
                  <li key={i} className="leading-relaxed">{limit}</li>
                ))}
              </ul>
            </div>
          )}
  
          {data.additionalContext && (
            <div>
              <h3 className="text-lg font-semibold mb-2">Additional Context</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {data.additionalContext}
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }