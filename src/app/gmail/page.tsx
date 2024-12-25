"use client";

import { useState } from 'react';
import EmailList from '@/components/EmailList';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card";
import { Loader2 } from "lucide-react";

interface EmailHeader {
  name: string;
  value: string;
}

interface EmailPayload {
  headers: EmailHeader[];
  body?: {
    data: string;
  };
  parts?: Array<{
    mimeType: string;
    body: {
      data: string;
    };
  }>;
}

interface Email {
  id: string;
  payload: EmailPayload;
}

export default function GmailPage() {
  const [emails, setEmails] = useState<Email[]>([]);
  const [isFetching, setIsFetching] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleFetchEmails = async () => {
    setIsFetching(true);
    setError(null);
    try {
      const response = await fetch('/api/gmail/fetch-emails');
      const data = await response.json();

      if (response.ok) {
        if (Array.isArray(data) && data.length > 0) {
          const emailDetailsPromises = data.map(async (message) => {
            const emailResponse = await fetch(`/api/gmail/fetch-email/${message.id}`);
            const emailData = await emailResponse.json();
            if (!emailResponse.ok) {
              throw new Error(emailData.error || 'Failed to fetch email');
            }
            return emailData;
          });
          const emailDetails = await Promise.all(emailDetailsPromises);
          setEmails(emailDetails);
        } else {
          setError('No emails found');
        }
      } else {
        setError(data.error || 'Failed to fetch emails');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setIsFetching(false);
    }
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Gmail Integration</h1>
          <p className="text-muted-foreground mt-2">
            Connect and analyze your Gmail messages
          </p>
        </div>
        <Button
          size="lg"
          onClick={handleFetchEmails}
          disabled={isFetching}
        >
          {isFetching ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Fetching...
            </>
          ) : (
            'Fetch Emails'
          )}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Email Analysis</CardTitle>
          <CardDescription>
            Your fetched emails will appear here for analysis
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-destructive text-sm py-4">{error}</div>
          ) : emails.length > 0 ? (
            <EmailList emails={emails} />
          ) : (
            <div className="text-muted-foreground text-sm py-4">
              No emails fetched yet. Click the button above to start.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 