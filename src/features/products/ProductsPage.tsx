import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Plus, Package, Upload, Download, MoreHorizontal, Pencil, Trash2, Tag, Barcode,
} from 'lucide-react';
import { productService } from '@/lib/services';
import { useActiveBusiness } from '@/hooks/use-active-business';
import { PageHeader } from '@/components/shared/PageHeader';
import { DataTable, type Column } from '@/components/shared/DataTable';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Field } from '@/components/ui/field';
import { Badge } from '@/components/ui/badge';
import { Select, SelectTrigger, SelectItem } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Textarea } from '@/components/ui/textarea';
import { toast } from '@/components/ui/toast';
import { ApiError } from '@/lib/api';
import { formatMoney, majorToMinorString, toMajor } from '@/lib/format';
import { toCsv, downloadFile } from '@/lib/utils';
import type { Product, Category } from '@/lib/types';

const schema = z.object({
  name: z.string().min(2, 'Product name is required'),
  sku: z.string().min(1, 'SKU is required'),
  barcode: z.string().optional(),
  brand: z.string().optional(),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  costPrice: z.coerce.number().min(0, 'Cost must be >= 0'),
  sellingPrice: z.coerce.number().min(0, 'Price must be >= 0'),
  wholesalePrice: z.coerce.number().min(0).optional(),
  minStock: z.coerce.number().min(0).default(0),
  status: z.enum(['ACTIVE', 'INACTIVE', 'ARCHIVED']).default('ACTIVE'),
});
type FormValues = z.infer<typeof schema>;

export default function ProductsPage() {
  const { activeBusiness } = useActiveBusiness();
  const currency = activeBusiness?.currency ?? 'NGN';
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = React.useState(searchParams.get('search') ?? '');
  const [categoryFilter, setCategoryFilter] = React.useState<string>('');
  const [page, setPage] = React.useState(1);
  const [editing, setEditing] = React.useState<Product | null>(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [detail, setDetail] = React.useState<Product | null>(null);
  const [importOpen, setImportOpen] = React.useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['products', { search, categoryId: categoryFilter, page }],
    queryFn: () => productService.list({ search, categoryId: categoryFilter || undefined, page, limit: 12 }),
    enabled: !!activeBusiness,
  });

  const { data: categories } = useQuery({
    queryKey: ['categories'],
    queryFn: productService.listCategories,
    enabled: !!activeBusiness,
  });

  const products = data?.items ?? [];

  React.useEffect(() => {
    setSearchParams(search ? { search } : {});
  }, [search, setSearchParams]);

  const columns: Column<Product>[] = [
    {
      key: 'name', header: 'Product',
      cell: (p) => (
        <button onClick={() => setDetail(p)} className="flex items-center gap-3 text-left">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent/10 text-accent"><Package className="h-4 w-4" /></div>
          <div className="min-w-0">
            <p className="truncate font-medium hover:text-accent">{p.name}</p>
            <p className="text-xs text-muted-foreground">{p.sku}{p.brand ? ` · ${p.brand}` : ''}</p>
          </div>
        </button>
      ),
    },
    {
      key: 'category', header: 'Category',
      cell: (p) => {
        const cat = categories?.find((c) => c.id === p.categoryId);
        return cat ? <Badge variant="secondary">{cat.name}</Badge> : <span className="text-muted-foreground">-</span>;
      },
    },
    { key: 'stock', header: 'Stock', align: 'right', cell: (p) => <StockBadge product={p} /> },
    { key: 'cost', header: 'Cost', align: 'right', cell: (p) => <span className="text-muted-foreground">{formatMoney(p.costPriceMinor, currency)}</span> },
    { key: 'price', header: 'Price', align: 'right', cell: (p) => <span className="font-medium">{formatMoney(p.sellingPriceMinor, currency)}</span> },
    {
      key: 'status', header: 'Status',
      cell: (p) => (
        <Badge variant={p.status === 'ACTIVE' ? 'success' : p.status === 'INACTIVE' ? 'warning' : 'secondary'}>
          {p.status.toLowerCase()}
        </Badge>
      ),
    },
    {
      key: 'actions', header: '', align: 'right',
      cell: (p) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="rounded-md p-1.5 text-muted-foreground hover:bg-muted"><MoreHorizontal className="h-4 w-4" /></button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setDetail(p)}><Package className="h-4 w-4" /> View details</DropdownMenuItem>
            <DropdownMenuItem onClick={() => { setEditing(p); setDialogOpen(true); }}><Pencil className="h-4 w-4" /> Edit</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={() => toast.info('Delete requires confirmation')}><Trash2 className="h-4 w-4" /> Delete</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  const exportCsv = () => {
    const rows = products.map((p) => ({
      name: p.name, sku: p.sku, barcode: p.barcode ?? '', brand: p.brand ?? '',
      cost: toMajor(p.costPriceMinor), price: toMajor(p.sellingPriceMinor), stock: p.stockQuantity ?? 0, status: p.status,
    }));
    downloadFile(`products_${Date.now()}.csv`, toCsv(rows));
    toast.success('Products exported to CSV');
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage your product catalog, prices and stock levels."
        icon={<Package className="h-5 w-5" />}
        actions={
          <>
            <Button variant="outline" onClick={() => setImportOpen(true)}><Upload className="h-4 w-4" /> Import</Button>
            <Button variant="outline" onClick={exportCsv}><Download className="h-4 w-4" /> Export</Button>
            <Button variant="accent" onClick={() => { setEditing(null); setDialogOpen(true); }}><Plus className="h-4 w-4" /> Add product</Button>
          </>
        }
      />

      <DataTable
        columns={columns}
        data={products}
        loading={isLoading}
        rowKey={(p) => p.id}
        searchable
        searchValue={search}
        onSearch={setSearch}
        searchPlaceholder="Search by name, SKU or barcode..."
        emptyTitle="No products yet"
        emptyDescription="Add your first product to start tracking inventory and sales."
        emptyIcon={<Package className="h-6 w-6" />}
        page={page}
        totalPages={data?.totalPages}
        total={data?.total}
        onPageChange={setPage}
        toolbar={
          <Select value={categoryFilter} onValueChange={(v) => { setCategoryFilter(v); setPage(1); }}>
            <SelectTrigger className="w-[160px]"><Tag className="mr-1.5 h-4 w-4 text-muted-foreground" />{categoryFilter ? categories?.find((c) => c.id === categoryFilter)?.name : 'All categories'}</SelectTrigger>
            <SelectItem value="">All categories</SelectItem>
            {categories?.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </Select>
        }
      />

      <ProductFormDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        product={editing}
        categories={categories ?? []}
      />

      <ProductDetailSheet product={detail} onClose={() => setDetail(null)} categories={categories ?? []} currency={currency} onEdit={(p) => { setDetail(null); setEditing(p); setDialogOpen(true); }} />

      <ImportDialog open={importOpen} onOpenChange={setImportOpen} />
    </div>
  );
}

function StockBadge({ product }: { product: Product }) {
  const qty = product.stockQuantity ?? 0;
  if (qty === 0) return <Badge variant="destructive">Out of stock</Badge>;
  if (qty <= product.minStock) return <Badge variant="warning">{qty} (low)</Badge>;
  return <span className="font-medium">{qty}</span>;
}

function ProductFormDialog({ open, onOpenChange, product, categories }: { open: boolean; onOpenChange: (v: boolean) => void; product: Product | null; categories: Category[] }) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, setValue, watch, formState: { errors } } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  React.useEffect(() => {
    if (open) {
      if (product) {
        reset({
          name: product.name, sku: product.sku, barcode: product.barcode ?? '', brand: product.brand ?? '',
          description: product.description ?? '', categoryId: product.categoryId ?? '',
          costPrice: toMajor(product.costPriceMinor), sellingPrice: toMajor(product.sellingPriceMinor),
          wholesalePrice: product.wholesalePriceMinor ? toMajor(product.wholesalePriceMinor) : 0,
          minStock: product.minStock, status: product.status,
        });
      } else {
        reset({ name: '', sku: '', barcode: '', brand: '', description: '', costPrice: 0, sellingPrice: 0, wholesalePrice: 0, minStock: 0, status: 'ACTIVE' });
      }
    }
  }, [open, product, reset]);

  const mutation = useMutation({
    mutationFn: async (values: FormValues) => {
      const payload = {
        name: values.name, sku: values.sku, barcode: values.barcode || null, brand: values.brand || null,
        description: values.description || null, categoryId: values.categoryId || null,
        costPriceMinor: majorToMinorString(values.costPrice), sellingPriceMinor: majorToMinorString(values.sellingPrice),
        wholesalePriceMinor: values.wholesalePrice ? majorToMinorString(values.wholesalePrice) : null,
        minStock: values.minStock, status: values.status,
      };
      if (product) return productService.update(product.id, payload);
      return productService.create(payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(product ? 'Product updated' : 'Product created');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err instanceof ApiError ? err.message : 'Failed to save product'),
  });

  const categoryId = watch('categoryId');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{product ? 'Edit product' : 'New product'}</DialogTitle>
          <DialogDescription>{product ? 'Update product details' : 'Add a new product to your catalog'}</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit((v) => mutation.mutate(v))} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Name" required error={errors.name?.message}><Input {...register('name')} placeholder="Coca-Cola 50cl" /></Field>
            <Field label="SKU" required error={errors.sku?.message}><Input {...register('sku')} placeholder="BEV-CC-50" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Barcode" error={errors.barcode?.message}><div className="relative"><Barcode className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" {...register('barcode')} placeholder="5012345678900" /></div></Field>
            <Field label="Brand" error={errors.brand?.message}><Input {...register('brand')} placeholder="Coca-Cola" /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Category">
              <Select value={categoryId ?? ''} onValueChange={(v) => setValue('categoryId', v)}>
                <SelectTrigger>{categoryId ? categories.find((c) => c.id === categoryId)?.name : 'Select category'}</SelectTrigger>
                <SelectItem value="">None</SelectItem>
                {categories.map((c) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
              </Select>
            </Field>
            <Field label="Min stock" error={errors.minStock?.message}><Input type="number" {...register('minStock')} /></Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Cost price" required error={errors.costPrice?.message}><Input type="number" step="0.01" {...register('costPrice')} placeholder="250" /></Field>
            <Field label="Selling price" required error={errors.sellingPrice?.message}><Input type="number" step="0.01" {...register('sellingPrice')} placeholder="400" /></Field>
            <Field label="Wholesale price" error={errors.wholesalePrice?.message}><Input type="number" step="0.01" {...register('wholesalePrice')} placeholder="360" /></Field>
          </div>
          <Field label="Description"><Textarea rows={2} {...register('description')} /></Field>
          <DialogFooter>
            <Button variant="outline" type="button" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="accent" disabled={mutation.isPending}>{mutation.isPending ? 'Saving...' : 'Save product'}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ProductDetailSheet({ product, onClose, categories, currency, onEdit }: { product: Product | null; onClose: () => void; categories: Category[]; currency: string; onEdit: (p: Product) => void }) {
  return (
    <Sheet open={!!product} onOpenChange={(o) => !o && onClose()}>
      <SheetContent>
        {product && (
          <>
            <SheetHeader>
              <SheetTitle>{product.name}</SheetTitle>
              <SheetDescription>{product.sku}{product.barcode ? ` · ${product.barcode}` : ''}</SheetDescription>
            </SheetHeader>
            <div className="space-y-5">
              <div className="flex items-center gap-3">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-accent/10 text-accent"><Package className="h-8 w-8" /></div>
                <div>
                  <Badge variant={product.status === 'ACTIVE' ? 'success' : 'warning'}>{product.status.toLowerCase()}</Badge>
                  {categories.find((c) => c.id === product.categoryId) && <Badge variant="secondary" className="ml-2">{categories.find((c) => c.id === product.categoryId)?.name}</Badge>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Detail label="Cost price" value={formatMoney(product.costPriceMinor, currency)} />
                <Detail label="Selling price" value={formatMoney(product.sellingPriceMinor, currency)} />
                <Detail label="Wholesale" value={product.wholesalePriceMinor ? formatMoney(product.wholesalePriceMinor, currency) : '-'} />
                <Detail label="Stock" value={String(product.stockQuantity ?? 0)} />
                <Detail label="Min stock" value={String(product.minStock)} />
                <Detail label="Brand" value={product.brand ?? '-'} />
              </div>
              {product.description && <div><p className="mb-1 text-xs text-muted-foreground">Description</p><p className="text-sm">{product.description}</p></div>}
              <Button variant="accent" className="w-full" onClick={() => onEdit(product)}><Pencil className="h-4 w-4" /> Edit product</Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 font-medium">{value}</p>
    </div>
  );
}

function ImportDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const queryClient = useQueryClient();
  const [rows, setRows] = React.useState('');
  const [mutating, setMutating] = React.useState(false);
  const onImport = async () => {
    const lines = rows.trim().split('\n');
    if (lines.length < 2) { toast.error('Add at least a header and one row'); return; }
    const headers = lines[0]!.split(',').map((h) => h.trim());
    const data = lines.slice(1).map((line) => {
      const vals = line.split(',');
      const obj: Record<string, unknown> = {};
      headers.forEach((h, i) => { obj[h] = vals[i]?.trim(); });
      return obj;
    });
    setMutating(true);
    try {
      await productService.import(data);
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success(`${data.length} products imported`);
      setRows('');
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Import failed');
    } finally {
      setMutating(false);
    }
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Import products</DialogTitle>
          <DialogDescription>Paste CSV with headers: name,sku,barcode,brand,costPrice,sellingPrice,minStock</DialogDescription>
        </DialogHeader>
        <Textarea rows={8} value={rows} onChange={(e) => setRows(e.target.value)} placeholder={'name,sku,barcode,brand,costPrice,sellingPrice,minStock\nCoca-Cola 50cl,BEV-CC-50,501234,Generic,250,400,50'} className="font-mono text-xs" />
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="accent" onClick={onImport} disabled={mutating}>{mutating ? 'Importing...' : 'Import'}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
