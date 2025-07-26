import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { ContactCreateSchema, ContactWithInteractionsSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const contacts = await prisma.contact.findMany({
      include: {
        interactions: {
          orderBy: {
            createdAt: 'desc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error('Error fetching contacts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contacts' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const validatedData = ContactCreateSchema.parse(body);
    
    const contact = await prisma.contact.create({
      data: {
        name: validatedData.name,
        company: validatedData.company,
        role: validatedData.role,
        email: validatedData.email,
        phone: validatedData.phone,
        linkedin: validatedData.linkedin,
        notes: validatedData.notes,
        flagged: validatedData.flagged || false,
      },
      include: {
        interactions: true,
      },
    });

    // Validate response with Zod
    const validatedResponse = ContactWithInteractionsSchema.parse(contact);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error creating contact:', error);
    
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create contact' },
      { status: 500 }
    );
  }
} 