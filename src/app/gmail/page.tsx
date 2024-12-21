"use client";

import { useState } from 'react';
import EmailList from '@/components/EmailList'; // Adjust the import path as necessary

interface Email {
  id: string;
  threadId: string;
  subject: string;
  body: string;
}

export default function GmailPage() {
  const [emails, setEmails] = useState<Email[]>([]); // State for emails
  const [isFetching, setIsFetching] = useState<boolean>(false); // State to manage fetching status

  const handleFetchEmails = async () => {
    setIsFetching(true); // Set fetching state to true
    try {
      const response = await fetch('/api/gmail/fetch-emails');
      const data = await response.json(); // Parse the response
      console.log('API Response:', data); // Log the response

      if (response.ok) {
        // Check if the data is an array of messages
        if (Array.isArray(data) && data.length > 0) {
          const emailDetailsPromises = data.map(async (message) => {
            const emailResponse = await fetch(`/api/gmail/fetch-email/${message.id}`);
            const emailData = await emailResponse.json();
            if (!emailResponse.ok) {
              console.error('Error fetching email:', emailData.error);
              throw new Error(emailData.error || 'Failed to fetch email');
            }
            return emailData;
          });
          const emailDetails = await Promise.all(emailDetailsPromises);
          setEmails(emailDetails);
        } else {
          console.error('No messages found or error occurred:', data.error);
        }
      } else {
        console.error('Failed to fetch emails:', response.statusText);
      }
    } catch (error) {
      console.error('Error in handleFetchEmails:', error);
    } finally {
      setIsFetching(false); // Reset fetching state
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Gmail Integration</h1>
      <button 
        className={`bg-blue-500 text-white font-semibold py-2 px-4 rounded ${isFetching ? 'opacity-50 cursor-not-allowed' : ''}`} 
        onClick={handleFetchEmails} 
        disabled={isFetching}
      >
        {isFetching ? 'Fetching...' : 'Fetch Emails'}
      </button>

      {/* Render EmailList component if emails are fetched */}
      <EmailList emails={emails} />
    </div>
  );
} 