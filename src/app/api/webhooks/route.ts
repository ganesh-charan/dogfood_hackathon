import { NextRequest, NextResponse } from 'next/server';
import { getUserSession } from '@/lib/auth';
import { db } from '@/lib/db';

interface WebhookRegistration {
  id: string;
  url: string;
  event: string;
  createdAt: string;
}

// In-memory webhook registry (persists across runtime lifecycle)
const webhooks: WebhookRegistration[] = [
  {
    id: 'wh_default_01',
    url: 'https://example.org/webhook/dogfood-events',
    event: 'PROJECT_SUBMITTED',
    createdAt: new Date().toISOString()
  }
];

// GET /api/webhooks
// Organizers/admins can list registered webhooks
export async function GET() {
  const user = await getUserSession();
  if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
  }

  return NextResponse.json({
    success: true,
    count: webhooks.length,
    webhooks
  });
}

// POST /api/webhooks
// Register a new webhook endpoint
export async function POST(req: NextRequest) {
  try {
    const user = await getUserSession();
    if (!user || (user.role !== 'ORGANIZER' && user.role !== 'ADMIN')) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 403 });
    }

    const body = await req.json();
    const { url, event } = body;

    if (!url || !event) {
      return NextResponse.json({ success: false, error: 'url and event are required' }, { status: 400 });
    }

    const newHook: WebhookRegistration = {
      id: `wh_${Date.now()}`,
      url,
      event,
      createdAt: new Date().toISOString()
    };

    webhooks.push(newHook);

    await db.auditLog.create({
      data: {
        action: 'WEBHOOK_REGISTERED',
        userId: user.id,
        details: `Webhook ${newHook.id} registered for event ${event} pointing to ${url}`
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Webhook registered successfully',
      webhook: newHook
    });
  } catch (error) {
    console.error('Webhook registration error:', error);
    return NextResponse.json({ success: false, error: 'Internal server error' }, { status: 500 });
  }
}
