"use client";

import React, { memo, useState } from 'react';
import { decode } from 'html-entities';
import { ChevronDown, ChevronUp } from 'lucide-react';

// Utility functions remain the same
const getHeader = (headers, name) => 
  headers.find(header => header.name === name)?.value || '';

const cleanEmailContent = (content) => {
  if (!content) return '';
  try {
    let cleanText = decode(content);
    cleanText = cleanText
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return cleanText;
  } catch (error) {
    console.error('Error cleaning content:', error);
    return 'Error processing email content';
  }
};

const decodeBase64 = (str) => {
  if (!str) return '';
  try {
    const base64 = str
      .replace(/-/g, '+')
      .replace(/_/g, '/')
      .padEnd(str.length + (4 - str.length % 4) % 4, '=');
    
    if (base64.length === 0) {
      console.warn('Empty Base64 string');
      return '';
    }
    
    const decoded = atob(base64);
    return decodeURIComponent(escape(decoded));
  } catch (error) {
    console.error("Detailed Base64 decoding error:", {
      error,
      inputString: str,
      inputLength: str?.length
    });
    return '';
  }
};

// Integrate Button Component
const IntegrateButton = memo(({ email }) => {
  const [statusMessage, setStatusMessage] = useState('');

  const handleIntegrateEmail = async () => {
    try {
      if (!email || !email.payload) {
        console.error('Invalid email object:', email);
        setStatusMessage('Error: Invalid email data');
        return;
      }

      let rawBody;
      if (email.payload.body?.data) {
        rawBody = decodeBase64(email.payload.body.data);
      } else if (email.payload.parts) {
        const htmlPart = email.payload.parts.find(part => part.mimeType === 'text/html');
        const textPart = email.payload.parts.find(part => part.mimeType === 'text/plain');
        rawBody = htmlPart 
          ? decodeBase64(htmlPart.body.data) 
          : (textPart ? decodeBase64(textPart.body.data) : '');
      }

      const emailData = {
        subject: getHeader(email.payload.headers, 'Subject'),
        body: cleanEmailContent(rawBody || ''), 
        from: getHeader(email.payload.headers, 'From'),
      };

      if (!emailData.body || emailData.body.trim() === '') {
        console.error('Email body is empty or contains only whitespace.', { emailData }); 
        setStatusMessage('Error: Email body is required.');
        return;
      }

      const response = await fetch('/api/email-integration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: emailData }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });
        setStatusMessage(`Error: ${errorText}`);
        return;
      }

      const result = await response.json();
      console.log('Integration result:', result);
      setStatusMessage('Email integrated successfully!');
    } catch (error) {
      console.error('Detailed integration error:', {
        error,
        emailObject: email,
        payload: email?.payload
      });
      setStatusMessage('Error integrating email.');
    }
  };

  return (
    <div className="mt-4">
      <button 
        onClick={handleIntegrateEmail} 
        className="bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700 transition-colors"
      >
        Integrate Email
      </button>
      {statusMessage && <p className="text-green-500 mt-2">{statusMessage}</p>}
    </div>
  );
});

IntegrateButton.displayName = 'IntegrateButton';

// Email content component
const EmailContent = memo(({ email, isExpanded }) => {
  if (!email?.payload || !isExpanded) {
    return null;
  }

  const getContent = (payload) => {
    try {
      if (!payload) {
        return '';
      }

      if (payload.parts) {
        const textPart = payload.parts.find(part => part.mimeType === 'text/plain');
        const htmlPart = payload.parts.find(part => part.mimeType === 'text/html');

        if (textPart?.body?.data) {
          return cleanEmailContent(decodeBase64(textPart.body.data));
        }
        
        if (htmlPart?.body?.data) {
          return cleanEmailContent(decodeBase64(htmlPart.body.data));
        }
      }
      
      if (payload.body?.data) {
        return cleanEmailContent(decodeBase64(payload.body.data));
      }

      return '';
    } catch (error) {
      console.error('Error processing email:', error);
      return 'Error processing email content';
    }
  };

  const content = getContent(email.payload);
  if (!content) return null;

  return (
    <div className="mt-4 bg-gray-900 p-4 rounded-lg">
      <pre className="whitespace-pre-wrap break-words font-sans text-base text-gray-300">
        {content}
      </pre>
    </div>
  );
});

EmailContent.displayName = 'EmailContent';

// Header component
const EmailHeader = memo(({ headers, isExpanded, onToggle }) => (
  <div 
    className="cursor-pointer space-y-2" 
    onClick={onToggle}
  >
    <div className="flex justify-between items-start">
      <div className="space-y-2 flex-grow">
        <div className="text-gray-300">
          <strong className="text-gray-100">From:</strong> {getHeader(headers, 'From')}
        </div>
        <div className="text-gray-300">
          <strong className="text-gray-100">Subject:</strong> {getHeader(headers, 'Subject')}
        </div>
        {isExpanded && (
          <>
            <div className="text-gray-300">
              <strong className="text-gray-100">To:</strong> {getHeader(headers, 'To')}
            </div>
            <div className="text-gray-300">
              <strong className="text-gray-100">Date:</strong> {getHeader(headers, 'Date')}
            </div>
          </>
        )}
      </div>
      <div className="ml-4 mt-1">
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-gray-400" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-400" />
        )}
      </div>
    </div>
  </div>
));

EmailHeader.displayName = 'EmailHeader';

// Main EmailList component
const EmailList = ({ emails }) => {
  const [expandedEmailId, setExpandedEmailId] = useState(null);

  if (!emails?.length) {
    return <p className="text-center text-gray-400">No emails to display.</p>;
  }

  const toggleEmail = (emailId) => {
    setExpandedEmailId(expandedEmailId === emailId ? null : emailId);
  };

  return (
    <div className="space-y-4 bg-black min-h-screen">
      {emails.map((email) => {
        const isExpanded = expandedEmailId === email.id;
        return (
          <div 
            key={email.id} 
            className={`bg-gray-800 p-4 rounded-lg shadow-lg border border-gray-700 transition-all duration-200 ${
              isExpanded ? 'ring-2 ring-blue-500' : 'hover:border-gray-600'
            }`}
          >
            <EmailHeader 
              headers={email.payload.headers} 
              isExpanded={isExpanded}
              onToggle={() => toggleEmail(email.id)}
            />
            <EmailContent email={email} isExpanded={isExpanded} />
            <IntegrateButton email={email} />
          </div>
        );
      })}
    </div>
  );
};

export default EmailList;