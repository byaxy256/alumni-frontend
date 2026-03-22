import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Badge } from '../ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '../ui/dialog';
import {
  Plus,
  ShoppingBag,
  Calendar,
  Users,
  Package,
  Download,
  Loader2,
  Clock,
  Trash2,
  Pencil,
  ImagePlus,
  Link,
} from 'lucide-react';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { API_BASE } from '../../api';

type Product = {
  id: string;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  stock: number;
};

const orders = [
  { id: 1, customer: 'Sarah Nakato', items: 'UCU T-Shirt x2, Cap x1', total: 95000, date: '2024-11-03', status: 'completed' },
  { id: 2, customer: 'John Okello', items: 'Hoodie x1', total: 75000, date: '2024-11-02', status: 'pending' },
  { id: 3, customer: 'Mary Achieng', items: 'Mug x3, T-Shirt x1', total: 80000, date: '2024-11-01', status: 'shipped' },
  { id: 4, customer: 'David Musoke', items: 'Cap x2', total: 50000, date: '2024-10-30', status: 'completed' },
];

export default function MerchEvents() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(true);
  const [showMerchDialog, setShowMerchDialog] = useState(false);
  const [showStockDialog, setShowStockDialog] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [stockValue, setStockValue] = useState('');
  const [savingStock, setSavingStock] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [registrations, setRegistrations] = useState<{ [key: number]: any[] }>({});
  const [loadingReg, setLoadingReg] = useState<number | null>(null);
  const [showRegistrationsModal, setShowRegistrationsModal] = useState(false);
  const [selectedEventForModal, setSelectedEventForModal] = useState<any>(null);

  // Add product form state
  const [addName, setAddName] = useState('');
  const [addPrice, setAddPrice] = useState('');
  const [addStock, setAddStock] = useState('');
  const [addDescription, setAddDescription] = useState('');
  const [addImageUrl, setAddImageUrl] = useState('');
  const [addImageFile, setAddImageFile] = useState<File | null>(null);
  const [addingProduct, setAddingProduct] = useState(false);

  const token = localStorage.getItem('token') || '';

  const fetchProducts = async () => {
    setLoadingProducts(true);
    try {
      const res = await fetch(`${API_BASE}/merch/products`);
      if (res.ok) {
        const data = await res.json();
        setProducts(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
      toast.error('Failed to load products');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const res = await fetch(`${API_BASE}/content/events`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setEvents(Array.isArray(data) ? data : data.content || []);
        }
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, [token]);

  const fetchRegistrations = async (eventId: number) => {
    setLoadingReg(eventId);
    try {
      const res = await fetch(`${API_BASE}/content/events/${eventId}/registrations`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setRegistrations((prev) => ({ ...prev, [eventId]: data.registrations || [] }));
        const event = events.find((e) => e.id === eventId);
        setSelectedEventForModal(event);
        setShowRegistrationsModal(true);
      }
    } catch (err) {
      console.error(`Failed to fetch registrations for event ${eventId}:`, err);
    } finally {
      setLoadingReg(null);
    }
  };

  const exportRegistrations = (eventId: number, eventTitle: string) => {
    const attendees = registrations[eventId] || [];
    if (attendees.length === 0) {
      alert('No registrations to export');
      return;
    }
    const headers = ['Name', 'Email', 'Registration Date'];
    const rows = attendees.map((a: any) => [
      a.full_name || 'Unknown',
      a.email || '',
      a.registered_at ? new Date(a.registered_at).toLocaleDateString() : '',
    ]);
    const csvContent = [
      `Event: ${eventTitle}`,
      `Total Attendees: ${attendees.length}`,
      `Export Date: ${new Date().toLocaleDateString()}`,
      '',
      headers.join(','),
      ...rows.map((r) => r.map((cell: string) => `"${cell}"`).join(',')),
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${eventTitle}-attendees.csv`;
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  };

  const uploadImage = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Upload failed');
    }
    const data = await res.json();
    if (!data.url) throw new Error('No URL returned from upload');
    return data.url;
  };

  const handleAddProduct = async () => {
    const name = addName.trim();
    const price = Number(addPrice);
    if (!name || isNaN(price) || price < 0) {
      toast.error('Name and a valid price are required');
      return;
    }
    setAddingProduct(true);
    try {
      let imageUrl = addImageUrl.trim() || undefined;
      if (addImageFile) {
        imageUrl = await uploadImage(addImageFile);
      }
      const res = await fetch(`${API_BASE}/merch/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          price,
          stock: Math.max(0, parseInt(addStock, 10) || 0),
          description: addDescription.trim() || undefined,
          imageUrl,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to add product');
      }
      toast.success('Product added');
      setShowMerchDialog(false);
      setAddName('');
      setAddPrice('');
      setAddStock('');
      setAddDescription('');
      setAddImageUrl('');
      setAddImageFile(null);
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to add product');
    } finally {
      setAddingProduct(false);
    }
  };

  const openStockDialog = (product: Product) => {
    setEditingProduct(product);
    setStockValue(String(product.stock ?? 0));
    setShowStockDialog(true);
  };

  const handleSaveStock = async () => {
    if (!editingProduct) return;
    const stock = Math.max(0, parseInt(stockValue, 10) || 0);
    setSavingStock(true);
    try {
      const res = await fetch(`${API_BASE}/merch/products/${editingProduct.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ stock }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to update stock');
      }
      toast.success('Stock updated');
      setShowStockDialog(false);
      setEditingProduct(null);
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update stock');
    } finally {
      setSavingStock(false);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Remove this product from the store?')) return;
    setDeletingId(id);
    try {
      const res = await fetch(`${API_BASE}/merch/products/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to remove product');
      }
      toast.success('Product removed');
      fetchProducts();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove product');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (amount: number) => `UGX ${amount.toLocaleString()}`;

  return (
    <div className="p-4 lg:p-8 space-y-6">
      <div>
        <h2>Merchandise & Events</h2>
        <p className="text-muted-foreground">Manage alumni merchandise, events, and registrations</p>
      </div>

      <Tabs defaultValue="merch" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="merch">Merchandise</TabsTrigger>
          <TabsTrigger value="registrations">Event Registrations</TabsTrigger>
          <TabsTrigger value="orders">Orders</TabsTrigger>
        </TabsList>

        <TabsContent value="merch" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={showMerchDialog} onOpenChange={setShowMerchDialog}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add Product</DialogTitle>
                  <DialogDescription>Add a new product to the alumni shop. Image: paste a URL or upload a file.</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="productName">Product Name</Label>
                    <Input
                      id="productName"
                      placeholder="e.g. UCU Alumni T-Shirt"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price (UGX)</Label>
                      <Input
                        id="price"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={addPrice}
                        onChange={(e) => setAddPrice(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="stock">Initial Stock</Label>
                      <Input
                        id="stock"
                        type="number"
                        min="0"
                        placeholder="0"
                        value={addStock}
                        onChange={(e) => setAddStock(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Product description"
                      value={addDescription}
                      onChange={(e) => setAddDescription(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Product Image</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <Link className="w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Image URL (optional)"
                          value={addImageUrl}
                          onChange={(e) => setAddImageUrl(e.target.value)}
                          onFocus={() => setAddImageFile(null)}
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <ImagePlus className="w-4 h-4 text-muted-foreground" />
                        <Input
                          type="file"
                          accept="image/*"
                          className="cursor-pointer"
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            setAddImageFile(f || null);
                            if (f) setAddImageUrl('');
                          }}
                        />
                        {addImageFile && (
                          <span className="text-xs text-muted-foreground truncate max-w-[120px]">{addImageFile.name}</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setShowMerchDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddProduct} disabled={addingProduct}>
                    {addingProduct ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                    Add Product
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {loadingProducts ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
          ) : products.length === 0 ? (
            <Card>
              <CardContent className="py-10 text-center text-muted-foreground">
                No products yet. Add one to get started.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map((item) => (
                <Card key={item.id}>
                  <CardHeader>
                    <div className="w-full h-32 bg-muted rounded-lg flex items-center justify-center mb-4 overflow-hidden">
                      {item.imageUrl ? (
                        <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-12 h-12 text-muted-foreground" />
                      )}
                    </div>
                    <CardTitle className="text-base">{item.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Price:</span>
                      <span className="text-accent">{formatCurrency(item.price)}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Stock:</span>
                      <Badge variant={item.stock < 20 ? 'destructive' : 'secondary'}>{item.stock} units</Badge>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => openStockDialog(item)}
                      >
                        <Pencil className="w-4 h-4 mr-2" />
                        Manage Stock
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:bg-destructive/10"
                        onClick={() => handleDeleteProduct(item.id)}
                        disabled={deletingId === item.id}
                      >
                        {deletingId === item.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="registrations" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Event Registrations</CardTitle>
            </CardHeader>
            <CardContent>
              {loadingEvents ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : events.length === 0 ? (
                <p className="text-muted-foreground text-center py-10">No events found</p>
              ) : (
                <div className="space-y-4">
                  {events.map((event) => (
                    <Card key={event.id}>
                      <CardHeader>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <CardTitle className="text-lg">{event.title}</CardTitle>
                            <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {event.date ? new Date(event.date).toLocaleDateString() : 'TBD'}
                              </div>
                              {event.time && (
                                <div className="flex items-center gap-1">
                                  <Clock className="w-4 h-4" />
                                  {event.time}
                                </div>
                              )}
                            </div>
                          </div>
                          <Badge variant={event.published ? 'default' : 'outline'}>
                            {event.published ? 'Published' : 'Draft'}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Location</p>
                            <p>{event.location || 'Not specified'}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Ticket Price</p>
                            <p className="font-semibold">
                              {event.registrationFee > 0 ? `UGX ${event.registrationFee.toLocaleString()}` : 'Free'}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Registrations</p>
                            <p className="font-semibold text-lg">{registrations[event.id]?.length || 0}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => fetchRegistrations(event.id)}
                            disabled={loadingReg === event.id}
                          >
                            {loadingReg === event.id ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Loading...
                              </>
                            ) : (
                              <>
                                <Users className="w-4 h-4 mr-2" />
                                View Registrations
                              </>
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => exportRegistrations(event.id, event.title)}
                            disabled={!registrations[event.id] || registrations[event.id].length === 0}
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Export
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="orders" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Items</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map((order) => (
                    <TableRow key={order.id}>
                      <TableCell>#{order.id.toString().padStart(4, '0')}</TableCell>
                      <TableCell>{order.customer}</TableCell>
                      <TableCell className="max-w-xs truncate">{order.items}</TableCell>
                      <TableCell>{formatCurrency(order.total)}</TableCell>
                      <TableCell className="text-muted-foreground">{order.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            order.status === 'completed' ? 'default' : order.status === 'shipped' ? 'secondary' : 'outline'
                          }
                        >
                          {order.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Receipt
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Stock edit dialog */}
      <Dialog open={showStockDialog} onOpenChange={setShowStockDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Manage Stock</DialogTitle>
            <DialogDescription>
              {editingProduct?.name} – set the current stock level.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Stock (units)</Label>
              <Input
                type="number"
                min="0"
                value={stockValue}
                onChange={(e) => setStockValue(e.target.value)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowStockDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveStock} disabled={savingStock}>
              {savingStock ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Registrations Modal */}
      <Dialog open={showRegistrationsModal} onOpenChange={setShowRegistrationsModal}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>{selectedEventForModal?.title} – Registrations</DialogTitle>
            <DialogDescription>
              Total Attendees: {registrations[selectedEventForModal?.id]?.length || 0}
            </DialogDescription>
          </DialogHeader>
          <div className="rounded-lg border overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Registration Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {(registrations[selectedEventForModal?.id] || []).length > 0 ? (
                  (registrations[selectedEventForModal?.id] || []).map((reg: any, idx: number) => (
                    <TableRow key={idx}>
                      <TableCell className="font-medium">{reg.full_name || 'Unknown'}</TableCell>
                      <TableCell>{reg.email || '-'}</TableCell>
                      <TableCell>
                        {reg.registered_at ? new Date(reg.registered_at).toLocaleDateString() : '-'}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      No registrations yet
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => {
                if (selectedEventForModal) {
                  exportRegistrations(selectedEventForModal.id, selectedEventForModal.title);
                }
              }}
              disabled={
                !registrations[selectedEventForModal?.id] || registrations[selectedEventForModal?.id].length === 0
              }
            >
              <Download className="w-4 h-4 mr-2" />
              Download CSV
            </Button>
            <Button
              onClick={() => window.print()}
              disabled={
                !registrations[selectedEventForModal?.id] || registrations[selectedEventForModal?.id].length === 0
              }
            >
              Print
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
