import { supabase } from '@/lib/supabase';
import { Product } from '@/types';
import { execFileSync } from 'node:child_process';
import path from 'path';
import { getAllInteractionsForClustering } from './interaction-service';

interface ProductFeatures {
  categoryId: number;
  priceNorm: number;
  popularityNorm: number;
  keywords: number[];
}

// Simple K-means implementation in TypeScript
class SimpleKMeans {
  k: number;
  maxIter: number;

  constructor(k: number, maxIter = 100) {
    this.k = k;
    this.maxIter = maxIter;
  }

  // Euclidean distance
  private distance(a: number[], b: number[]): number {
    let sum = 0;
    for (let i = 0; i < a.length; i++) {
      sum += Math.pow(a[i] - b[i], 2);
    }
    return Math.sqrt(sum);
  }

  // Find nearest center
  private findNearest(point: number[], centers: number[][]): number {
    let minDist = Infinity;
    let nearest = 0;
    for (let i = 0; i < centers.length; i++) {
      const d = this.distance(point, centers[i]);
      if (d < minDist) {
        minDist = d;
        nearest = i;
      }
    }
    return nearest;
  }

  // Initialize centers randomly
  private initCenters(data: number[][]): number[][] {
    const centers: number[][] = [];
    const used = new Set<number>();
    while (centers.length < this.k && centers.length < data.length) {
      const idx = Math.floor(Math.random() * data.length);
      if (!used.has(idx)) {
        centers.push([...data[idx]]);
        used.add(idx);
      }
    }
    return centers;
  }

  // Calculate center of cluster
  private calculateMean(points: number[][]): number[] {
    if (points.length === 0) return [];
    const means = new Array(points[0].length).fill(0);
    for (const point of points) {
      for (let i = 0; i < point.length; i++) {
        means[i] += point[i];
      }
    }
    return means.map(m => m / points.length);
  }

  predict(data: number[][]): number[] {
    if (data.length === 0) return [];

    let centers = this.initCenters(data);
    let assignments = new Array(data.length).fill(0);

    for (let iter = 0; iter < this.maxIter; iter++) {
      // Assign points to nearest center
      const newAssignments = data.map(point => this.findNearest(point, centers));

      // Check convergence
      if (JSON.stringify(newAssignments) === JSON.stringify(assignments)) {
        break;
      }

      assignments = newAssignments;

      // Recalculate centers
      const newCenters: number[][] = [];
      for (let i = 0; i < this.k; i++) {
        const cluster = data.filter((_, idx) => assignments[idx] === i);
        if (cluster.length > 0) {
          newCenters.push(this.calculateMean(cluster));
        } else {
          newCenters.push([...centers[i]]); // Keep old center if empty
        }
      }
      centers = newCenters;
    }

    return assignments;
  }
}

// Extract simple numeric features from products for clustering
function extractFeatures(
  products: Product[], 
  categories: Map<string, number>,
  interactions: any[]
): ProductFeatures[] {
  const maxPrice = Math.max(...products.map(p => p.price), 1);
  
  // Calculate popularity
  const popularityMap = new Map<string, number>();
  interactions.forEach(inter => {
    const current = popularityMap.get(inter.product_id) || 0;
    popularityMap.set(inter.product_id, current + (inter.weight || 1.0));
  });
  const maxPopularity = Math.max(...Array.from(popularityMap.values()), 1.0);
  
  // Simple keyword extraction from description (count common product terms)
  const keywordTerms = ['phone', 'laptop', 'cloth', 'shoe', 'book', 'food', 'home', 'beauty', 'sport', 'tech'];
  
  return products.map(p => {
    const categoryId = categories.get(p.category_id || '') || 0;
    const priceNorm = maxPrice > 0 ? p.price / maxPrice : 0;
    const popularityNorm = (popularityMap.get(p.id) || 0) / maxPopularity;
    
    // Count keywords in description
    const keywords = keywordTerms.map(term => 
      p.description.toLowerCase().includes(term) ? 1 : 0
    );
    
    return { categoryId, priceNorm, popularityNorm, keywords };
  });
}

// Normalize features to 0-1 range
function normalizeFeatures(features: ProductFeatures[]): number[][] {
  if (features.length === 0) return [];
  
  // Build vectors: [categoryId, priceNorm, popularityNorm, ...keywords]
  const vectors = features.map(f => [
    f.categoryId / 10, // rough normalize (categories usually 0-10)
    f.priceNorm,
    f.popularityNorm,
    ...f.keywords.map(k => k / 1), // keywords already 0/1
  ]);
  
  return vectors;
}

function runPythonClusterAssignments(
  products: Product[], 
  numClusters: number,
  interactions: any[]
): Map<string, number> {
  const pythonBinary = process.env.PYTHON || 'python';
  const scriptPath = path.join(/*turbopackIgnore: true*/ process.cwd(), 'python', 'recommendation_cluster.py');
  const payload = {
    products: products.map((product) => ({
      id: product.id,
      category_id: product.category_id || null,
      price: product.price,
      description: product.description || '',
    })),
    interactions: interactions,
    num_clusters: numClusters,
  };

  const output = execFileSync(pythonBinary, [pythonBinary.includes('python') ? scriptPath : scriptPath], {
    input: JSON.stringify(payload),
    encoding: 'utf-8',
    stdio: ['pipe', 'pipe', 'pipe'],
    maxBuffer: 10 * 1024 * 1024,
  });

  const result = JSON.parse(output || '{}');
  return new Map(Object.entries(result.assignments || {}));
}

export async function computeProductClusters(numClusters = 5): Promise<Map<string, number>> {
  try {
    const { data: products } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    if (!products || products.length < numClusters) {
      console.warn('Not enough products to cluster');
      return new Map();
    }

    const interactions = await getAllInteractionsForClustering();

    try {
      const assignments = runPythonClusterAssignments(products as Product[], numClusters, interactions);
      if (assignments.size > 0) {
        return assignments;
      }
    } catch (pythonError) {
      console.warn('Python clustering failed, falling back to local TypeScript K-means.', pythonError);
    }

    const { data: categories } = await supabase
      .from('categories')
      .select('id, name');

    const categoryMap = new Map(
      (categories || []).map((c: any, idx: number) => [c.id, idx])
    );

    const features = extractFeatures(products as Product[], categoryMap, interactions);
    const vectors = normalizeFeatures(features);

    if (vectors.length === 0) return new Map();

    const kmeans = new SimpleKMeans(Math.min(numClusters, products.length), 100);
    const clusters = kmeans.predict(vectors);

    const result = new Map<string, number>();
    (products as Product[]).forEach((p, idx) => {
      result.set(p.id, clusters[idx]);
    });

    return result;
  } catch (err) {
    console.error('Clustering error:', err);
    return new Map();
  }
}

export async function storeClusterAssignments(clusterMap: Map<string, number>): Promise<boolean> {
  if (clusterMap.size === 0) return false;

  // Delete old assignments
  await supabase.from('product_clusters').delete().neq('id', '');

  // Insert new assignments
  const rows = Array.from(clusterMap.entries()).map(([productId, clusterId]) => ({
    product_id: productId,
    cluster_id: clusterId,
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase.from('product_clusters').insert(rows);

  if (error) {
    console.error('Error storing clusters:', error);
    return false;
  }

  return true;
}
