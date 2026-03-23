import { useEffect, useState } from 'react';
import { apiCall } from '../../api';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { ImageOff, ShoppingCart, Minus, Plus, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  hasImage?: boolean;
  stock?: number;
}

interface CartItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
}

interface AlumniShopProps {
  title?: string;
}

export function AlumniShop({ title = 'Alumni Shop' }: AlumniShopProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [checkingOut, setCheckingOut] = useState(false);

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

  const addToCart = (product: Product) => {
    if ((product.stock ?? 0) <= 0) {
      toast.error('Out of stock');
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.product_id === product.id);
      if (existing) {
        if (existing.quantity >= (product.stock ?? 0)) {
          toast.error('Cannot add more than available stock');
          return prev;
        }
        return prev.map(i => i.product_id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, { product_id: product.id, name: product.name, price: product.price, quantity: 1 }];
    });
    toast.success(`${product.name} added to cart`);
  };

  const removeFromCart = (product_id: string) => {
    setCart(prev => prev.filter(i => i.product_id !== product_id));
  };

  const updateQuantity = (product_id: string, quantity: number, stock: number) => {
    if (quantity < 1) {
      removeFromCart(product_id);
      return;
    }
    if (quantity > stock) {
      toast.error('Cannot exceed available stock');
      return;
    }
    setCart(prev => prev.map(i => i.product_id === product_id ? { ...i, quantity } : i));
  };

  const cartTotal = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      toast.error('Cart is empty');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('Please log in to checkout');
      return;
    }

    try {
      setCheckingOut(true);
      // For now, create order without payment - user can pay later via mobile money
      await apiCall('/merch/orders', 'POST', {
        items: cart,
        payment_method: 'pending',
        delivery_address: 'TBD',
      });
      toast.success('Order created! Payment details will be sent to your email.');
      setCart([]);
      setShowCart(false);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to create order');
    } finally {
      setCheckingOut(false);
    }
  };

  const getProductImage = (product: Product) => {
    if (product.hasImage) {
      return `${import.meta.env.VITE_API_BASE || 'https://alumni-backend-mupt.onrender.com/api'}/merch/products/${product.id}/image`;
    }
    return product.imageUrl;
  };

  if (showCart) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => setShowCart(false)} variant="ghost">← Back to Shop</Button>
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
        </div>

        {cart.length === 0 ? (
          <Card className="p-12 text-center">
            <ShoppingCart className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">Your cart is empty</p>
            <Button onClick={() => setShowCart(false)}>Continue Shopping</Button>
          </Card>
        ) : (
          <>
            <div className="space-y-4">
              {cart.map(item => {
                const product = products.find(p => p.id === item.product_id);
                const stock = product?.stock ?? 0;
                return (
                  <Card key={item.product_id} className="p-4">
                    <div className="flex gap-4 items-start">
                      <div className="w-24 h-24 bg-muted rounded flex-shrink-0 flex items-center justify-center overflow-hidden">
                        {product && getProductImage(product) ? (
                          <img src={getProductImage(product)!} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <ImageOff className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.name}</h3>
                        <p className="text-sm text-muted-foreground">UGX {item.price.toLocaleString()} each</p>
                        <div className="flex items-center gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product_id, item.quantity - 1, stock)}
                          >
                            <Minus className="w-4 h-4" />
                          </Button>
                          <span className="w-8 text-center font-medium">{item.quantity}</span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateQuantity(item.product_id, item.quantity + 1, stock)}
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">UGX {(item.price * item.quantity).toLocaleString()}</p>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive mt-2"
                          onClick={() => removeFromCart(item.product_id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>

            <Card className="p-6 border-t-2">
              <div className="flex justify-between items-center mb-4">
                <span className="text-lg font-semibold">Order Total:</span>
                <span className="text-2xl font-bold text-primary">UGX {cartTotal.toLocaleString()}</span>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={checkingOut}
                className="w-full"
                size="lg"
              >
                {checkingOut ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-4 h-4 mr-2" />
                    Place Order & Pay
                  </>
                )}
              </Button>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Browse alumni-branded merchandise and products. Items added by the alumni office are visible to both students
            and alumni here.
          </p>
        </div>
        <Button
          onClick={() => setShowCart(true)}
          variant="outline"
          className="relative"
        >
          <ShoppingCart className="w-4 h-4 mr-2" />
          Cart ({cart.length})
        </Button>
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
                <Card key={product.id} className="overflow-hidden border border-border/80 bg-background flex flex-col">
                  <div className="h-40 bg-muted flex items-center justify-center overflow-hidden">
                    {getProductImage(product) ? (
                      <img
                        src={getProductImage(product)!}
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
                  <CardContent className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-sm text-foreground">{product.name}</h3>
                        {typeof product.stock === 'number' && (
                          <Badge variant={product.stock > 0 ? 'outline' : 'destructive'} className="text-xs">
                            {product.stock > 0 ? `${product.stock} left` : 'Out of stock'}
                          </Badge>
                        )}
                      </div>
                      {product.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{product.description}</p>
                      )}
                      <p className="text-sm font-semibold text-primary">
                        UGX {Number(product.price || 0).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      onClick={() => addToCart(product)}
                      disabled={(product.stock ?? 0) <= 0}
                      className="w-full"
                      size="sm"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      Add to Cart
                    </Button>
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

