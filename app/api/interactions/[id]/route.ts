import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: 'Interaction ID is required' },
        { status: 400 }
      );
    }

    // Check if interaction exists
    const existingInteraction = await prisma.interaction.findUnique({
      where: { id },
    });

    if (!existingInteraction) {
      return NextResponse.json(
        { error: 'Interaction not found' },
        { status: 404 }
      );
    }

    // Delete the interaction
    await prisma.interaction.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: 'Interaction deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting interaction:', error);
    return NextResponse.json(
      { error: 'Failed to delete interaction' },
      { status: 500 }
    );
  }
} 