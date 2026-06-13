#!/usr/bin/env python3
import json
import math
import random
import sys

KEYWORDS = [
    'phone', 'laptop', 'cloth', 'shoe', 'book', 'food', 'home', 'beauty', 'sport', 'tech'
]


def build_vectors(products, interactions):
    category_ids = sorted({p.get('category_id') for p in products if p.get('category_id') is not None})
    category_index = {category_id: idx for idx, category_id in enumerate(category_ids)}
    max_price = max((p.get('price') or 0) for p in products) or 1
    
    # Calculate popularity from interactions
    popularity_map = {}
    for inter in interactions:
        pid = inter.get('product_id')
        weight = inter.get('weight', 1.0)
        popularity_map[pid] = popularity_map.get(pid, 0.0) + weight
    
    max_popularity = max(popularity_map.values()) if popularity_map else 1.0

    vectors = []
    product_ids = []

    for product in products:
        pid = product.get('id')
        product_ids.append(pid)
        category_value = category_index.get(product.get('category_id'), 0)
        price_norm = (product.get('price') or 0) / max_price
        
        # New popularity feature (behavior-based)
        pop_norm = popularity_map.get(pid, 0.0) / max_popularity
        
        description = (product.get('description') or '').lower()
        keyword_values = [1.0 if keyword in description else 0.0 for keyword in KEYWORDS]

        # Vector: [category, price, popularity, ...keyword_values]
        vectors.append([category_value / max(1, len(category_ids) - 1), price_norm, pop_norm] + keyword_values)

    return product_ids, vectors


def distance(point_a, point_b):
    return math.sqrt(sum((a - b) ** 2 for a, b in zip(point_a, point_b)))


def find_nearest(point, centers):
    nearest, min_distance = 0, float('inf')
    for index, center in enumerate(centers):
        dist = distance(point, center)
        if dist < min_distance:
            nearest = index
            min_distance = dist
    return nearest


def calculate_mean(points):
    if not points:
        return []
    count = len(points)
    dims = len(points[0])
    mean = [0.0] * dims
    for point in points:
        for i in range(dims):
            mean[i] += point[i]
    return [value / count for value in mean]


def kmeans(vectors, k, max_iter=100):
    if not vectors:
        return []

    random.seed(0)
    centers = random.sample(vectors, min(k, len(vectors)))
    assignments = [0] * len(vectors)

    for _ in range(max_iter):
        new_assignments = [find_nearest(point, centers) for point in vectors]
        if new_assignments == assignments:
            break
        assignments = new_assignments
        clusters = [[] for _ in range(len(centers))]
        for idx, assignment in enumerate(assignments):
            clusters[assignment].append(vectors[idx])

        new_centers = []
        for cluster_points, old_center in zip(clusters, centers):
            new_centers.append(calculate_mean(cluster_points) if cluster_points else old_center)
        centers = new_centers

    return assignments


def main():
    payload = json.load(sys.stdin)
    products = payload.get('products', [])
    interactions = payload.get('interactions', [])
    num_clusters = int(payload.get('num_clusters', 5))

    product_ids, vectors = build_vectors(products, interactions)
    assignments = kmeans(vectors, num_clusters)
    result = {product_id: cluster_id for product_id, cluster_id in zip(product_ids, assignments)}
    json.dump({'assignments': result}, sys.stdout)


if __name__ == '__main__':
    main()
