import { NextResponse } from 'next/server';
import { getProjectCountsBySector } from '@/lib/directus';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const service = searchParams.get('service') || undefined;

    const counts = await getProjectCountsBySector(service);
    return NextResponse.json(counts);
  } catch (error) {
    console.error('Error fetching sector counts:', error);
    return NextResponse.json({}, { status: 500 });
  }
}
