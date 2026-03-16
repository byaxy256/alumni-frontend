import { useEffect, useState } from 'react';
import { apiCall } from '../../api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { ImageOff } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock?: number;
}

interface AlumniShopProps {
  title?: string;
}

export function AlumniShop({ title = 'Alumni Shop' }: AlumniShopProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiCall('/merch/products', 'GET');
        setProducts(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Failed to load products', err);
        setError(err?.message || 'Failed to load products');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Browse alumni-branded merchandise and products. Items added by the alumni office are visible to both students
          and alumni here.
        </p>
      </div>

      <Card className="border border-border bg-card shadow-sm">
        <CardHeader>
          <CardTitle>Available products</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading products...</p>
          ) : error ? (
            <p className="text-sm text-destructive">Could not load products: {error}</p>
          ) : products.length === 0 ? (
            <p className="text-sm text-muted-foreground">No products are available yet. Please check back later.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {products.map((product) => (
                <Card key={product.id} className="overflow-hidden border border-border/80 bg-background">
                  <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
                    {product.imageUrl ? (
                      <img
                        src={product.imageUrl}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                        <ImageOff className="w-6 h-6" />
                        No image
                      </div>
                    )}
                  </div>
                  <CardContent className="p-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-semibold text-sm text-foreground">{product.name}</h3>
                      {typeof product.stock === 'number' && (
                        <Badge variant="outline" className="text-xs">
                          {product.stock > 0 ? `${product.stock} in stock` : 'Out of stock'}
                        </Badge>
                      )}
                    </div>
                    {product.description && (
                      <p className="text-xs text-muted-foreground line-clamp-3">{product.description}</p>
                    )}
                    <p className="text-sm font-semibold text-primary">
                      UGX {Number(product.price || 0).toLocaleString()}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

