import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { Search, Eye, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { apiCall } from '../../api';

interface OrderItem {
  product_id: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

interface Order {
  id: string;
  user_id: string;
  user_name: string;
  user_email?: string;
  user_phone?: string;
  items: OrderItem[];
  total: number;
  payment_method: string;
  transaction_id?: string;
  payment_status: 'pending' | 'completed' | 'failed';
  delivery_status: 'pending' | 'processing' | 'shipped' | 'delivered';
  delivery_address?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [deliveryFilter, setDeliveryFilter] = useState<string>('all');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await apiCall('/merch/orders', 'GET');
      const orderList = Array.isArray(data) ? data : [];
      setOrders(orderList);
      setFilteredOrders(orderList);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let filtered = orders;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        o =>
          o.user_name.toLowerCase().includes(q) ||
          o.user_email?.toLowerCase().includes(q) ||
          o.id.includes(q)
      );
    }

    if (paymentFilter !== 'all') {
      filtered = filtered.filter(o => o.payment_status === paymentFilter);
    }

    if (deliveryFilter !== 'all') {
      filtered = filtered.filter(o => o.delivery_status === deliveryFilter);
    }

    setFilteredOrders(filtered);
  }, [orders, searchQuery, paymentFilter, deliveryFilter]);

  const handleUpdateOrder = async (
    orderId: string,
    deliveryStatus: string,
    paymentStatus: string
  ) => {
    try {
      await apiCall(`/merch/orders/${orderId}`, 'PATCH', {
        delivery_status: deliveryStatus,
        payment_status: paymentStatus,
      });
      toast.success('Order updated');
      await loadOrders();
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update order');
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getDeliveryStatusColor = (status: string) => {
    switch (status) {
      case 'delivered':
        return 'bg-green-100 text-green-800';
      case 'shipped':
        return 'bg-blue-100 text-blue-800';
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const paymentMethodIcon = (method: string) => {
    switch (method) {
      case 'mtn':
        return '📱 MTN';
      case 'airtel':
        return '📱 Airtel';
      case 'bank':
        return '🏦 Bank';
      default:
        return method;
    }
  };

  if (selectedOrder) {
    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center gap-4">
          <Button onClick={() => setSelectedOrder(null)} variant="ghost">← Back</Button>
          <h1 className="text-2xl font-bold">Order #{selectedOrder.id.slice(0, 8)}</h1>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Order Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold mb-2">Customer</h3>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Name:</strong> {selectedOrder.user_name}
                  </p>
                  {selectedOrder.user_email && (
                    <p>
                      <strong>Email:</strong> {selectedOrder.user_email}
                    </p>
                  )}
                  {selectedOrder.user_phone && (
                    <p>
                      <strong>Phone:</strong> {selectedOrder.user_phone}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="font-semibold mb-2">Order Status</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Payment:</span>
                    <Badge className={getPaymentStatusColor(selectedOrder.payment_status)}>
                      {selectedOrder.payment_status}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Delivery:</span>
                    <Badge className={getDeliveryStatusColor(selectedOrder.delivery_status)}>
                      {selectedOrder.delivery_status}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Items</h3>
              <div className="space-y-2">
                {selectedOrder.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between p-3 bg-muted rounded">
                    <div>
                      <p className="font-medium">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {item.quantity} × UGX {item.price.toLocaleString()}
                      </p>
                    </div>
                    <p className="font-semibold">UGX {item.subtotal.toLocaleString()}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 pt-4 border-t flex justify-between text-lg font-bold">
                <span>Total:</span>
                <span>UGX {selectedOrder.total.toLocaleString()}</span>
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-2">Payment & Delivery</h3>
              <div className="space-y-3 text-sm">
                <div>
                  <strong>Method:</strong> {paymentMethodIcon(selectedOrder.payment_method)}
                </div>
                {selectedOrder.transaction_id && (
                  <div>
                    <strong>Transaction:</strong> {selectedOrder.transaction_id}
                  </div>
                )}
                {selectedOrder.delivery_address && (
                  <div>
                    <strong>Address:</strong> {selectedOrder.delivery_address}
                  </div>
                )}
                {selectedOrder.notes && (
                  <div>
                    <strong>Notes:</strong> {selectedOrder.notes}
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-semibold mb-3">Update Order Status</h3>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">Payment Status</label>
                  <Select
                    defaultValue={selectedOrder.payment_status}
                    onValueChange={value =>
                      handleUpdateOrder(
                        selectedOrder.id,
                        selectedOrder.delivery_status,
                        value
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Delivery Status</label>
                  <Select
                    defaultValue={selectedOrder.delivery_status}
                    onValueChange={value =>
                      handleUpdateOrder(
                        selectedOrder.id,
                        value,
                        selectedOrder.payment_status
                      )
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="processing">Processing</SelectItem>
                      <SelectItem value="shipped">Shipped</SelectItem>
                      <SelectItem value="delivered">Delivered</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Shop Orders</h1>
        <p className="text-muted-foreground">Manage orders from merchandise sales</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by name, email, or order ID..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Payment Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Payment Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="failed">Failed</SelectItem>
              </SelectContent>
            </Select>

            <Select value={deliveryFilter} onValueChange={setDeliveryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Delivery Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Delivery Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="shipped">Shipped</SelectItem>
                <SelectItem value="delivered">Delivered</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Orders</CardTitle>
            <Badge variant="secondary">{filteredOrders.length} orders</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : filteredOrders.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No orders found</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order ID</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Delivery</TableHead>
                    <TableHead>Method</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell className="font-mono text-xs">{order.id.slice(0, 8)}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <p className="font-medium">{order.user_name}</p>
                          <p className="text-xs text-muted-foreground">{order.user_email}</p>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">UGX {order.total.toLocaleString()}</TableCell>
                      <TableCell>
                        <Badge className={getPaymentStatusColor(order.payment_status)}>
                          {order.payment_status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getDeliveryStatusColor(order.delivery_status)}>
                          {order.delivery_status}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">{paymentMethodIcon(order.payment_method)}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setSelectedOrder(order)}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
