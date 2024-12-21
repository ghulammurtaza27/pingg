// src/components/EmailList.tsx
import React from 'react';

interface Email {
  id: string;
  threadId: string;
}

interface EmailListProps {
  emails: Email[];
}

const EmailList: React.FC<EmailListProps> = ({ emails }) => {
  if (emails.length === 0) {
    return <p>No emails to display.</p>; // Optional: Message when no emails are available
  }

  return (
    <div>
      <h2>Your Emails</h2>
      <ul>
        {emails.map(email => (
          <li key={email.id}>
            Email ID: {email.id}, Thread ID: {email.threadId}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EmailList;
