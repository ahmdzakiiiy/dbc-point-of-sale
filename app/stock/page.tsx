"use client";

import type React from "react";

import { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Pencil,
  Plus,
  Trash,
  PackagePlus,
  Search,
  Upload,
  X,
} from "lucide-react";
import DashboardNav from "@/components/dashboard-nav";

// Initial product data with images
const initialProducts = [
  {
    id: 1,
    name: "Daster Anaya Pink",
    stock: 15,
    price: 120000,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 2,
    name: "Daster Busui Kuning",
    stock: 8,
    price: 135000,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 3,
    name: "Gamis Putih",
    stock: 3,
    price: 185000,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 4,
    name: "Dress Hitam",
    stock: 12,
    price: 150000,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 5,
    name: "Kemeja Navy",
    stock: 4,
    price: 110000,
    image: "/placeholder.svg?height=200&width=200",
  },
  {
    id: 6,
    name: "Kaftan Coklat",
    stock: 7,
    price: 165000,
    image: "/placeholder.svg?height=200&width=200",
  },
];

type Product = {
  id: number;
  name: string;
  stock: number;
  price: number;
  image?: string;
  formattedPrice?: string;
};

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [addStockQuantity, setAddStockQuantity] = useState("");
  const [newProduct, setNewProduct] = useState<
    Omit<Product, "id"> & { formattedPrice: string }
  >({
    name: "",
    stock: 0,
    price: 0,
    formattedPrice: "",
    image: "",
  });
  const [imagePreview, setImagePreview] = useState<string>("");

  // Format price with thousands separator
  const formatPrice = (price: number | string): string => {
    if (typeof price === "string" && price === "") return "";
    const numericValue =
      typeof price === "string" ? Number(price.replace(/\./g, "")) : price;
    return numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  };

  // Get numeric value from formatted price string
  const getNumericValue = (formattedValue: string): number => {
    return Number(formattedValue.replace(/\./g, "")) || 0;
  };

  // Filter products based on search term
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Handle product name input - only allow text characters
  const handleProductNameChange = (value: string, isEdit = false) => {
    // Remove any numeric characters and special characters except spaces and common punctuation
    const textOnlyValue = value
      .replace(/[0-9]/g, "")
      .replace(/[^\w\s\-.]/g, "");

    if (isEdit && currentProduct) {
      setCurrentProduct({ ...currentProduct, name: textOnlyValue });
    } else {
      setNewProduct({ ...newProduct, name: textOnlyValue });
    }
  };

  // Handle product name key press validation
  const handleProductNameKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>
  ) => {
    // Prevent numeric input
    if (/[0-9]/.test(e.key)) {
      e.preventDefault();
    }
  };

  const handleImageUpload = (
    event: React.ChangeEvent<HTMLInputElement>,
    isEdit = false
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setImagePreview(imageUrl);

        if (isEdit && currentProduct) {
          setCurrentProduct({ ...currentProduct, image: imageUrl });
        } else {
          setNewProduct({ ...newProduct, image: imageUrl });
        }
      };
      reader.readAsDataURL(file);
    }
  };
  const handleAddProduct = () => {
    const id = Math.max(0, ...products.map((p) => p.id)) + 1;
    const { formattedPrice, ...productData } = newProduct;
    setProducts([...products, { id, ...productData }]);
    setNewProduct({
      name: "",
      stock: 0,
      price: 0,
      formattedPrice: "",
      image: "",
    });
    setImagePreview("");
    setIsAddModalOpen(false);
  };

  const handleEditProduct = () => {
    if (currentProduct) {
      setProducts(
        products.map((p) => (p.id === currentProduct.id ? currentProduct : p))
      );
      setIsEditModalOpen(false);
      setImagePreview("");
    }
  };

  const handleDeleteProduct = () => {
    if (currentProduct) {
      setProducts(products.filter((p) => p.id !== currentProduct.id));
      setIsDeleteAlertOpen(false);
    }
  };

  const handleAddStock = () => {
    if (currentProduct && addStockQuantity) {
      const quantityToAdd = Number.parseInt(addStockQuantity);
      if (quantityToAdd > 0) {
        setProducts(
          products.map((p) =>
            p.id === currentProduct.id
              ? { ...p, stock: p.stock + quantityToAdd }
              : p
          )
        );
        setIsAddStockModalOpen(false);
        setAddStockQuantity("");
        setCurrentProduct(null);
      }
    }
  };
  const openEditModal = (product: Product) => {
    const productWithFormattedPrice = {
      ...product,
      formattedPrice: formatPrice(product.price),
    };
    setCurrentProduct(
      productWithFormattedPrice as Product & { formattedPrice: string }
    );
    setImagePreview(product.image || "");
    setIsEditModalOpen(true);
  };

  const openDeleteAlert = (product: Product) => {
    setCurrentProduct(product);
    setIsDeleteAlertOpen(true);
  };

  const openAddStockModal = (product: Product) => {
    setCurrentProduct(product);
    setIsAddStockModalOpen(true);
  };

  const removeImage = (isEdit = false) => {
    setImagePreview("");
    if (isEdit && currentProduct) {
      setCurrentProduct({ ...currentProduct, image: "" });
    } else {
      setNewProduct({ ...newProduct, image: "" });
    }
  };

  return (
    <div className="flex min-h-screen flex-col">
      <DashboardNav />{" "}
      <main className="flex-1 p-3 sm:p-4 md:p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-3 sm:mb-4 md:mb-6 gap-2 sm:gap-3 md:gap-4">
          <h1 className="text-xl sm:text-2xl font-bold">Manajemen Stok</h1>
          <div className="flex flex-col md:flex-row gap-2 sm:gap-3 md:gap-4 w-full md:w-auto">
            <div className="relative flex-1 md:w-64">
              <Search className="absolute left-2.5 top-2.5 h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Cari produk..."
                className="pl-7 sm:pl-8 text-xs sm:text-sm h-8 sm:h-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Button
              onClick={() => setIsAddModalOpen(true)}
              className="bg-violet-500 hover:bg-violet-600 text-xs sm:text-sm h-8 sm:h-10"
            >
              <Plus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" /> Tambah
              Produk
            </Button>
          </div>
        </div>

        <Card className="p-2 sm:p-3 md:p-4 shadow-sm">
          <CardHeader className="p-2 sm:p-4">
            <CardTitle className="text-sm sm:text-base md:text-lg">
              Daftar Produk
            </CardTitle>
          </CardHeader>
          <CardContent className="p-1 sm:p-2 md:p-4">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Gambar</TableHead>
                  <TableHead>Nama Produk</TableHead>
                  <TableHead className="text-center">Stok</TableHead>
                  <TableHead className="text-center">Harga</TableHead>
                  <TableHead className="text-center">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredProducts.map((product) => (
                  <TableRow key={product.id}>
                    <TableCell>
                      <div className="w-16 h-16 overflow-hidden rounded-md bg-gray-100">
                        <Image
                          src={
                            product.image ||
                            "/placeholder.svg?height=64&width=64"
                          }
                          alt={product.name}
                          width={64}
                          height={64}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </TableCell>
                    <TableCell className="font-medium">
                      {product.name}
                    </TableCell>
                    <TableCell className="text-center">
                      <span
                        className={
                          product.stock < 5 ? "text-red-500 font-medium" : ""
                        }
                      >
                        {product.stock}
                      </span>
                    </TableCell>
                    <TableCell className="text-center">
                      Rp {product.price.toLocaleString("id-ID")}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openAddStockModal(product)}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          title="Tambah Stok"
                        >
                          <PackagePlus className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditModal(product)}
                          title="Edit Produk"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteAlert(product)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          title="Hapus Produk"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredProducts.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={5}
                      className="text-center py-8 text-muted-foreground"
                    >
                      {searchTerm
                        ? "Tidak ada produk yang ditemukan"
                        : "Belum ada produk"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Delete Product Alert */}
        <AlertDialog
          open={isDeleteAlertOpen}
          onOpenChange={setIsDeleteAlertOpen}
        >
          <AlertDialogContent className="max-w-sm">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-sm sm:text-base md:text-lg">
                Hapus Produk
              </AlertDialogTitle>
              <AlertDialogDescription className="text-xs sm:text-sm">
                Apakah Anda yakin ingin menghapus produk{" "}
                <span className="font-medium">{currentProduct?.name}</span>?
                Tindakan ini tidak dapat dibatalkan.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="mt-2 sm:mt-4">
              <AlertDialogCancel className="text-xs sm:text-sm h-8 sm:h-10">
                Batal
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeleteProduct}
                className="bg-red-500 hover:bg-red-600 text-xs sm:text-sm h-8 sm:h-10"
              >
                Hapus
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Stock Modal */}
        <Dialog
          open={isAddStockModalOpen}
          onOpenChange={setIsAddStockModalOpen}
        >
          <DialogContent className="max-w-sm">
            <DialogHeader className="p-2 sm:p-4">
              <DialogTitle className="text-sm sm:text-base md:text-lg">
                Tambah Stok
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Tambah stok untuk produk:{" "}
                <span className="font-medium">{currentProduct?.name}</span>
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 sm:space-y-4">
              <div className="p-2 sm:p-4 bg-gray-50 rounded-lg">
                <div className="text-xs sm:text-sm text-muted-foreground">
                  Stok saat ini:
                </div>
                <div className="text-lg sm:text-xl md:text-2xl font-bold">
                  {currentProduct?.stock}
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label
                  htmlFor="add-stock-quantity"
                  className="text-xs sm:text-sm"
                >
                  Jumlah Stok yang Ditambahkan
                </Label>{" "}
                <Input
                  id="add-stock-quantity"
                  type="number"
                  min="1"
                  placeholder="Masukkan jumlah stok"
                  value={addStockQuantity}
                  onChange={(e) => {
                    // Only allow positive numbers
                    const value = e.target.value;
                    if (value === "" || parseInt(value) > 0) {
                      setAddStockQuantity(value);
                    }
                  }}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              {addStockQuantity && Number.parseInt(addStockQuantity) > 0 && (
                <div className="p-2 sm:p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="text-xs sm:text-sm text-green-700">
                    Stok setelah penambahan:
                  </div>
                  <div className="text-base sm:text-lg md:text-xl font-bold text-green-800">
                    {(currentProduct?.stock || 0) +
                      Number.parseInt(addStockQuantity)}
                  </div>
                </div>
              )}
            </div>
            <DialogFooter className="mt-2 sm:mt-4">
              <Button
                onClick={handleAddStock}
                className="bg-green-500 hover:bg-green-600 text-xs sm:text-sm h-8 sm:h-10"
                disabled={
                  !addStockQuantity || Number.parseInt(addStockQuantity) <= 0
                }
              >
                <PackagePlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                Tambah Stok
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Product Modal */}
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader className="p-2 sm:p-4">
              <DialogTitle className="text-sm sm:text-base md:text-lg">
                Tambah Produk Baru
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Masukkan detail produk baru di bawah ini.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2 sm:space-y-4">
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="product-image" className="text-xs sm:text-sm">
                  Gambar Produk
                </Label>
                <div className="space-y-2">
                  {imagePreview ? (
                    <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                      <Image
                        src={imagePreview || "/placeholder.svg"}
                        alt="Preview"
                        width={128}
                        height={128}
                        className="w-full h-full object-cover rounded-md border"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 p-0"
                        onClick={() => removeImage(false)}
                      >
                        <X className="h-2 w-2 sm:h-3 sm:w-3" />
                      </Button>
                    </div>
                  ) : (
                    <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                      <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                    </div>
                  )}
                  <Input
                    id="product-image"
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleImageUpload(e, false)}
                    className="text-xs sm:text-sm cursor-pointer h-8 sm:h-10"
                  />
                </div>
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="name" className="text-xs sm:text-sm">
                  Nama Produk
                </Label>
                <Input
                  id="name"
                  placeholder="Nama produk"
                  value={newProduct.name}
                  onChange={(e) => handleProductNameChange(e.target.value)}
                  onKeyDown={handleProductNameKeyPress}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="stock" className="text-xs sm:text-sm">
                  Stok Awal
                </Label>
                <Input
                  id="stock"
                  type="number"
                  placeholder="Jumlah stok"
                  min="0"
                  value={newProduct.stock || ""}
                  onChange={(e) =>
                    setNewProduct({
                      ...newProduct,
                      stock: parseInt(e.target.value) || 0,
                    })
                  }
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="price" className="text-xs sm:text-sm">
                  Harga (Rp)
                </Label>
                <Input
                  id="price"
                  placeholder="Harga produk"
                  value={newProduct.formattedPrice}
                  onChange={(e) => {
                    const formattedPrice = formatPrice(e.target.value);
                    setNewProduct({
                      ...newProduct,
                      formattedPrice,
                      price: getNumericValue(formattedPrice),
                    });
                  }}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
            </div>
            <DialogFooter className="mt-2 sm:mt-4">
              <Button
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="text-xs sm:text-sm h-8 sm:h-10"
              >
                Batal
              </Button>
              <Button
                onClick={handleAddProduct}
                disabled={!newProduct.name || newProduct.price <= 0}
                className="bg-violet-500 hover:bg-violet-600 text-xs sm:text-sm h-8 sm:h-10"
              >
                Tambah
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Edit Product Modal */}
        <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader className="p-2 sm:p-4">
              <DialogTitle className="text-sm sm:text-base md:text-lg">
                Edit Produk
              </DialogTitle>
              <DialogDescription className="text-xs sm:text-sm">
                Edit detail produk di bawah ini.
              </DialogDescription>
            </DialogHeader>
            {currentProduct && (
              <div className="space-y-2 sm:space-y-4">
                <div className="space-y-1 sm:space-y-2">
                  <Label
                    htmlFor="edit-product-image"
                    className="text-xs sm:text-sm"
                  >
                    Gambar Produk
                  </Label>
                  <div className="space-y-2">
                    {imagePreview ? (
                      <div className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                        <Image
                          src={imagePreview || "/placeholder.svg"}
                          alt="Preview"
                          width={128}
                          height={128}
                          className="w-full h-full object-cover rounded-md border"
                        />
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          className="absolute -top-2 -right-2 h-5 w-5 sm:h-6 sm:w-6 p-0"
                          onClick={() => removeImage(true)}
                        >
                          <X className="h-2 w-2 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto border-2 border-dashed border-gray-300 rounded-md flex items-center justify-center">
                        <Upload className="h-6 w-6 sm:h-8 sm:w-8 text-gray-400" />
                      </div>
                    )}
                    <Input
                      id="edit-product-image"
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleImageUpload(e, true)}
                      className="text-xs sm:text-sm cursor-pointer h-8 sm:h-10"
                    />
                  </div>
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="edit-name" className="text-xs sm:text-sm">
                    Nama Produk
                  </Label>
                  <Input
                    id="edit-name"
                    placeholder="Nama produk"
                    value={currentProduct.name}
                    onChange={(e) =>
                      handleProductNameChange(e.target.value, true)
                    }
                    onKeyDown={handleProductNameKeyPress}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="edit-stock" className="text-xs sm:text-sm">
                    Stok
                  </Label>
                  <Input
                    id="edit-stock"
                    type="number"
                    placeholder="Jumlah stok"
                    min="0"
                    value={currentProduct.stock || ""}
                    onChange={(e) =>
                      setCurrentProduct({
                        ...currentProduct,
                        stock: parseInt(e.target.value) || 0,
                      })
                    }
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="edit-price" className="text-xs sm:text-sm">
                    Harga (Rp)
                  </Label>
                  <Input
                    id="edit-price"
                    placeholder="Harga produk"
                    value={
                      (currentProduct as any).formattedPrice ||
                      formatPrice(currentProduct.price)
                    }
                    onChange={(e) => {
                      const formattedPrice = formatPrice(e.target.value);
                      setCurrentProduct({
                        ...currentProduct,
                        formattedPrice,
                        price: getNumericValue(formattedPrice),
                      });
                    }}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
              </div>
            )}
            <DialogFooter className="mt-2 sm:mt-4">
              <Button
                variant="outline"
                onClick={() => setIsEditModalOpen(false)}
                className="text-xs sm:text-sm h-8 sm:h-10"
              >
                Batal
              </Button>
              <Button
                onClick={handleEditProduct}
                disabled={
                  !currentProduct?.name || (currentProduct?.price || 0) <= 0
                }
                className="bg-violet-500 hover:bg-violet-600 text-xs sm:text-sm h-8 sm:h-10"
              >
                Simpan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
