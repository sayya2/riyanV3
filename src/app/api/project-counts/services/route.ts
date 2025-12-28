import { NextResponse } from 'next/server';
import { getProjectCountsByService } from '@/lib/directus';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const sector = searchParams.get('sector') || undefined;

    const counts = await getProjectCountsByService(sector);
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching service counts:', error);
    return NextResponse.json({}, { status: 500 });
  }
}
