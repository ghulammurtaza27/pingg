import { getServerSession } from "next-auth/next";
import { nextAuthConfig } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { calculateRelevanceScore } from '@/lib/relevance';
import { pusherServer } from '@/lib/pusher';

// Utility function to sanitize and validate input
const sanitizeInput = (input: string, maxLength: number = 10000): string => {
  if (!input) return '';
  return input.trim().slice(0, maxLength);
};

export async function POST(request: Request) {
  // Consistent CORS and response headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  };

  // Enhanced response handler with comprehensive error logging
  const respond = (data: any, status: number = 200) => {
    try {
      return new Response(JSON.stringify(data), { status, headers });
    } catch (stringifyError) {
      console.error('Response stringify error:', {
        error: stringifyError,
        originalData: data
      });
      return new Response(JSON.stringify({ 
        error: 'Internal Server Error', 
        details: 'Failed to stringify response' 
      }), {
        status: 500,
        headers
      });
    }
  };

  // Handle CORS preflight
  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers });
  }

  // Comprehensive request validation
  if (request.method !== 'POST') {
    return respond({ 
      error: 'Method Not Allowed', 
      details: `Received ${request.method}, expected POST` 
    }, 405);
  }

  let rawBody: string | null = null;
  let data: any = null;

  try {
    // Clone request to allow multiple reads
    const requestClone = request.clone();
    rawBody = await requestClone.text();
    
    console.log('Raw Request Received:', {
      method: request.method,
      url: request.url,
      bodyLength: rawBody?.length,
      contentType: request.headers.get('content-type')
    });

    if (!rawBody) {
      throw new Error('Empty request body');
    }

    data = JSON.parse(rawBody);
  } catch (error) {
    console.error('Request Processing Error', {
      errorName: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage: error instanceof Error ? error.message : 'No message',
      rawBodyLength: rawBody?.length,
      rawBodyType: typeof rawBody
    });

    return respond({ 
      error: 'Invalid Request', 
      details: 'Unable to process request body'
    }, 400);
  }

  // Validate email object structure
  const { email } = data;
  if (!email || typeof email !== 'object') {
    return respond({ 
      error: 'Invalid Email Data',
      details: 'Email must be a valid object'
    }, 400);
  }

  // Comprehensive field validation
  const requiredFields = [
    { name: 'subject', maxLength: 500 },
    { name: 'body', maxLength: 10000 },
    { name: 'from', maxLength: 255 }
  ];

  const validationErrors = requiredFields.filter(field => {
    const value = email[field.name];
    return !value || 
           typeof value !== 'string' || 
           value.trim() === '' || 
           value.length > field.maxLength;
  });

  if (validationErrors.length > 0) {
    return respond({ 
      error: 'Validation Failed',
      details: validationErrors.map(field => `Invalid ${field.name} field`)
    }, 400);
  }

  try {
    const session = await getServerSession(nextAuthConfig);
    
    if (!session?.user?.email) {
      return respond({ 
        error: 'Authentication Required',
        details: 'No valid user session found'
      }, 401);
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return respond({ 
        error: 'User Not Found',
        details: `No user found for email: ${session.user.email}`
      }, 404);
    }

    // Create or get email agent
    const emailAgent = await prisma.agent.upsert({
      where: {
        userIdType: {
          userId: user.id,
          type: 'email'
        }
      },
      create: {
        name: 'Email Agent',
        type: 'email',
        userId: user.id
      },
      update: {}
    });

    // Find default agent first
    const defaultAgent = await prisma.agent.findFirst({
      where: {
        userId: user.id,
        isDefault: true,
        type: { not: 'email' } // Exclude email agents
      }
    });

    // If no default agent exists, create or get system agent
    const recipientAgent = defaultAgent || await prisma.agent.upsert({
      where: {
        userIdType: {
          userId: user.id,
          type: 'system'
        }
      },
      create: {
        name: 'System Agent',
        type: 'system',
        userId: user.id
      },
      update: {}
    });

    // Get recipient knowledge base for relevance checking
    const recipientKnowledgeBase = await prisma.knowledgeBase.findFirst({
      where: { agentId: recipientAgent.id },
      select: {
        id: true,
        industry: true,
        useCase: true,
        mainGoals: true,
        coalesced: true,
        entries: {
          select: { 
            id: true,
            question: true,
            answer: true 
          }
        },
        coalescedSummary: {
          select: {
            id: true,
            summary: true,
            capabilities: true,
            useCases: true,
            limitations: true,
            additionalContext: true
          }
        }
      }
    });

    // Format knowledge base for relevance calculation
    const formattedKnowledgeBase = recipientKnowledgeBase ? {
      ...recipientKnowledgeBase,
      entries: recipientKnowledgeBase.entries.map(entry => ({
        content: `Q: ${entry.question}\nA: ${entry.answer}`
      })),
      coalescedSummary: recipientKnowledgeBase.coalescedSummary ? {
        content: [
          recipientKnowledgeBase.coalescedSummary.summary,
          `Capabilities: ${recipientKnowledgeBase.coalescedSummary.capabilities.join(', ')}`,
          `Use Cases: ${recipientKnowledgeBase.coalescedSummary.useCases.join(', ')}`,
          `Limitations: ${recipientKnowledgeBase.coalescedSummary.limitations.join(', ')}`,
          recipientKnowledgeBase.coalescedSummary.additionalContext
        ].filter(Boolean).join('\n')
      } : null
    } : null;

    // Calculate relevance score
    const relevanceScore = formattedKnowledgeBase ? 
      await calculateRelevanceScore(
        email.subject,
        email.body,
        formattedKnowledgeBase
      ) : 1; // Default to 1 if no knowledge base exists

    // Create request and notification in a transaction
    const newRequest = await prisma.$transaction(async (tx) => {
      const request = await tx.request.create({
        data: {
          summary: sanitizeInput(email.subject, 500),
          considerations: sanitizeInput(email.body, 10000),
          relevanceScore,
          status: 'pending',
          senderAgentId: emailAgent.id,
          recipientAgentId: recipientAgent.id,
          userId: user.id
        },
        include: {
          senderAgent: true,
          recipientAgent: true
        }
      });

      // Create notification
      await tx.notification.create({
        data: {
          requestId: request.id,
          userId: user.id,
          message: `New ${relevanceScore >= 0.8 ? 'highly' : 'moderately'} relevant email request (${(relevanceScore * 100).toFixed(0)}%) from ${request.senderAgent.name}`,
        }
      });

      // Trigger Pusher notification
      await pusherServer.trigger('requests', 'new-request', {
        id: request.id,
        title: `New Email Request from ${request.senderAgent.name}`,
        message: request.summary,
        url: `/requests/${request.id}`
      });

      return request;
    });

    console.log('Request Created Successfully', {
      requestId: newRequest.id,
      summary: newRequest.summary,
      relevanceScore
    });

    return respond({ 
      success: true,
      requestId: newRequest.id,
      message: 'Email integrated successfully',
      relevanceScore
    });

  } catch (error) {
    console.error('Request Creation Error', {
      errorName: error instanceof Error ? error.name : 'Unknown Error',
      errorMessage: error instanceof Error ? error.message : 'No message',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });

    return respond({ 
      error: 'Internal Server Error',
      details: 'Failed to process email request'
    }, 500);
  }
}