import { NextResponse } from 'next/server';
import { computeProductClusters, storeClusterAssignments } from '@/services/clustering-compute';

export async function POST(req: Request) {
  try {
    // Optional: Add basic auth check (for now, open for testing)
    const numClusters = 5; // Default cluster count

    // Compute clusters
    const clusterMap = await computeProductClusters(numClusters);

    if (clusterMap.size === 0) {
      return NextResponse.json({ error: 'No products to cluster' }, { status: 400 });
    }

    // Store in database
    const stored = await storeClusterAssignments(clusterMap);

    if (!stored) {
      return NextResponse.json({ error: 'Failed to store clusters' }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      clustersCreated: clusterMap.size,
      message: `Clustered ${clusterMap.size} products into ${numClusters} clusters`,
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
