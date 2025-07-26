import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { InteractionCreateSchema, InteractionWithContactSchema } from '@/lib/schemas';

export async function GET() {
  try {
    const interactions = await prisma.interaction.findMany({
      include: {
        contact: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json(interactions);
  } catch (error) {
    console.error('Error fetching interactions:', error);
    return NextResponse.json(
      { error: 'Failed to fetch interactions' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate request body with Zod
    const validatedData = InteractionCreateSchema.parse(body);
    
    const interaction = await prisma.interaction.create({
      data: {
        contactId: validatedData.contactId,
        jobId: validatedData.jobId,
        type: validatedData.type,
        summary: validatedData.summary,
        followUpRequired: validatedData.followUpRequired || false,
        followUpDueDate: validatedData.followUpDueDate ? new Date(validatedData.followUpDueDate) : null,
      },
      include: {
        contact: true,
      },
    });

    // Validate response with Zod
    const validatedResponse = InteractionWithContactSchema.parse(interaction);
    return NextResponse.json(validatedResponse);
  } catch (error) {
    console.error('Error creating interaction:', error);
    
    // Handle Zod validation errors
    if (error instanceof Error && error.name === 'ZodError') {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.message },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create interaction' },
      { status: 500 }
    );
  }
} 