"use client";

import type React from "react";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
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
  Loader2,
} from "lucide-react";
import DashboardNav from "@/components/dashboard-nav";
import ProductImagePlaceholder from "@/components/product-image-placeholder";
import { useAuth } from "@/context/auth-context";
import { supabase } from "@/lib/supabase";

type Product = {
  id: string;
  name: string;
  stock: number;
  price: number;
  base_price: number; // Harga modal
  image_url?: string;
  created_at?: string;
  updated_at?: string;
  formattedPrice?: string;
  formattedBasePrice?: string; // Format harga modal untuk tampilan
};

// Custom debounce hook
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function StockPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const [isAddStockModalOpen, setIsAddStockModalOpen] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(null);
  const [addStockQuantity, setAddStockQuantity] = useState("");
  const [newProduct, setNewProduct] = useState<
    Omit<Product, "id"> & { formattedPrice: string; formattedBasePrice: string }
  >({
    name: "",
    stock: 0,
    price: 0,
    base_price: 0,
    formattedPrice: "",
    formattedBasePrice: "",
    image_url: "",
  });
  const [imagePreview, setImagePreview] = useState<string>("");
  const [processing, setProcessing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string>('');
  const [isLoadingProducts, setIsLoadingProducts] = useState(false);
  // Image cropping states
  const [cropModalOpen, setCropModalOpen] = useState(false);
  const [tempImage, setTempImage] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
  const [completedCrop, setCompletedCrop] = useState<Crop | null>(null);
  const [isEdit, setIsEdit] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const { user } = useAuth();
  
  // Fetch products from API with caching, retry, and improved timeout handling
  useEffect(() => {
    let isActive = true; // Track if component is still mounted
    
    const fetchProducts = async (retryCount = 0) => {
      const controller = new AbortController();
      const signal = controller.signal;
      let timeoutId: NodeJS.Timeout | null = null;
      
      try {
        if (!isActive) return;
        setLoading(true);
        
        // Set timeout before fetch (longer timeout for better reliability)
        timeoutId = setTimeout(() => controller.abort(), 20000); // 20 seconds timeout
        
        // Add timestamp to prevent browser caching
        const response = await fetch(`/api/products?t=${Date.now()}`, {
          signal,
          cache: 'no-store',
          // Use shorter timeout for initial connection
          headers: {
            'Connection': 'keep-alive'
          }
        });
        
        if (timeoutId) clearTimeout(timeoutId);
        
        if (!response.ok) {
          throw new Error('Gagal mengambil data produk: ' + response.status);
        }
        
        const data = await response.json();
        
        if (!isActive) return;
        setProducts(data.products || []);
        setError(null);
        
        // Store last fetch time
        sessionStorage.setItem('lastProductFetch', Date.now().toString());
        console.log('Berhasil memuat', data.products?.length || 0, 'produk');
      } catch (err: any) {
        console.error('Error mengambil data produk:', err);
        if (timeoutId) clearTimeout(timeoutId);
        
        // If component unmounted, don't update state
        if (!isActive) return;
        
        if (err.name === 'AbortError') {
          // If we haven't retried too many times, try again
          if (retryCount < 2) {
            console.log(`Mencoba ulang (${retryCount + 1}/3)...`);
            setError(`Waktu permintaan habis. Mencoba ulang... (${retryCount + 1}/3)`);
            // Wait a bit before retrying (exponential backoff)
            setTimeout(() => fetchProducts(retryCount + 1), 1000 * (retryCount + 1));
            return;
          }
          setError('Waktu permintaan habis. Coba refresh halaman atau periksa koneksi internet Anda.');
        } else {
          setError('Gagal memuat data produk. Silakan coba lagi.');
        }
      } finally {
        // Only set loading false if this is the final attempt or component is still active
        if (isActive) {
          setLoading(false);
        }
      }
    };
    
    fetchProducts();
    
    // Cleanup function to abort fetch if component unmounts
    return () => {
      isActive = false;
    };
  }, []);

  // Format price with thousands separator
  const formatPrice = (price: number | string): string => {
    // Handle empty strings
    if (typeof price === "string" && price === "") return "";
    
    try {
      // Ensure we're working with clean numeric input
      let numericValue: number;
      
      if (typeof price === "string") {
        // Remove all dots (thousand separators) and replace commas with dots
        numericValue = Number(price.replace(/\./g, "").replace(/,/g, "."));
        if (isNaN(numericValue)) return "0"; // Handle invalid input
      } else {
        numericValue = price;
      }
      
      // Format with thousand separators
      return numericValue.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
    } catch (err) {
      console.error("Price formatting error:", err);
      return typeof price === "string" ? price : price.toString();
    }
  };

  // Get numeric value from formatted price string
  const getNumericValue = (formattedValue: string): number => {
    if (!formattedValue) return 0;
    try {
      // Remove thousand separators (dots)
      const valueWithoutSeparators = formattedValue.replace(/\./g, "");
      // Convert to number
      const numericValue = Number(valueWithoutSeparators);
      return isNaN(numericValue) ? 0 : numericValue;
    } catch (err) {
      console.error("Error converting price to numeric value:", err);
      return 0;
    }
  };

  // Use debounced search term for filtering
  const debouncedSearch = useDebounce(searchTerm, 300); // 300ms debounce delay
  
  // Filter products based on debounced search term for better performance
  const filteredProducts = products.filter((product) =>
    product.name.toLowerCase().includes(debouncedSearch.toLowerCase())
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
  };  const handleImageUpload = async (
    event: React.ChangeEvent<HTMLInputElement>,
    isEditMode = false
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check if the file is an image
      if (!file.type.startsWith('image/')) {
        alert('Silakan pilih file gambar yang valid.');
        return;
      }
      
      // Store whether this is for edit mode
      setIsEdit(isEditMode);
      
      // Read the file and open the crop modal
      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        // Set temporary image for cropping
        setTempImage(imageUrl);
        // Open the crop modal
        setCropModalOpen(true);
        // Reset crop - actual dimension will be set in onImageLoad
        setCrop({ unit: '%', width: 80, height: 80, x: 10, y: 10 });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Convert file to base64
  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };  // Function to optimize image data before saving
  const optimizeImage = async (imageUrl: string | undefined): Promise<string | undefined> => {
    if (!imageUrl) return undefined;
    
    // If image is already small enough, return as is
    if (imageUrl.length < 100000) return imageUrl; // ~100KB is reasonable
    
    return new Promise<string>((resolve) => {
      // Create a new image to load the data URL
      const img = new window.Image();
      
      // Set up onload handler before setting src
      img.onload = () => {
        // Create a canvas element
        const canvas = document.createElement('canvas');
        
        // Set maximum dimensions - smaller for better performance
        const MAX_WIDTH = 280; 
        const MAX_HEIGHT = 280;
        
        // Calculate new dimensions while maintaining aspect ratio
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height = Math.round(height * (MAX_WIDTH / width));
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width = Math.round(width * (MAX_HEIGHT / height));
            height = MAX_HEIGHT;
          }
        }
        
        // Set canvas dimensions
        canvas.width = width;
        canvas.height = height;
        
        // Draw image with resized dimensions
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // Use better image smoothing for quality
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to JPEG with quality 0.6 (more aggressive compression)
          const optimizedUrl = canvas.toDataURL('image/jpeg', 0.6);
          
          console.log(`Optimized image: ${Math.round(optimizedUrl.length / 1024)}KB (${width}x${height})`);
          resolve(optimizedUrl);
        } else {
          console.warn('Could not get 2D context for image optimization');
          resolve(imageUrl);
        }
      };
      
      // Handle errors
      img.onerror = () => {
        console.error('Error loading image for optimization');
        resolve(imageUrl);
      };
      
      // Set the source to begin loading
      img.src = imageUrl;
    }).catch(err => {
      console.error('Image optimization error:', err);
      return imageUrl;
    });
  };

  const handleAddProduct = async () => {
    try {
      setProcessing(true);
      
      // Validasi data sebelum menyimpan
      if (!newProduct.name || newProduct.name.trim() === '') {
        alert('Nama produk tidak boleh kosong');
        setProcessing(false);
        return;
      }
      
      if (newProduct.price <= 0) {
        alert('Harga jual harus lebih dari 0');
        setProcessing(false);
        return;
      }
      
      if (newProduct.base_price <= 0) {
        alert('Harga modal harus lebih dari 0');
        setProcessing(false);
        return;
      }
      
      // Optimize image directly using our function (now awaits the promise)
      let optimizedImageUrl = await optimizeImage(newProduct.image_url);
      
      const { formattedPrice, formattedBasePrice, ...productData } = newProduct;
      
      // Convert to proper types and format
      const productToAdd = {
        name: productData.name.trim(),
        stock: Number(productData.stock),
        price: Number(getNumericValue(formattedPrice)),
        base_price: Number(getNumericValue(formattedBasePrice)),
        image_url: optimizedImageUrl,
      };
      
      setStatusMessage('Menyimpan produk baru...');
      console.log('Menyimpan produk baru...');
      
      // Send to API dengan timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 detik timeout untuk koneksi lambat
      
      try {
        const response = await fetch('/api/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productToAdd),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Gagal menambahkan produk');
        }
        
        const { product } = await response.json();
            setStatusMessage('Produk berhasil disimpan!');
      console.log('Produk berhasil disimpan:', product.id);
      
      // Update products state with new product
      setProducts((prevProducts) => [...prevProducts, product]);
            // Reset form
      setNewProduct({
        name: "",
        stock: 0,
        price: 0,
        base_price: 0,
        formattedPrice: "",
        formattedBasePrice: "",
        image_url: "",
      });
      setImagePreview("");
      setStatusMessage('');
      setIsAddModalOpen(false);
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Waktu permintaan habis. Server mungkin sibuk.');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error('Error adding product:', err);
      setStatusMessage('Gagal! Silakan coba lagi');
      alert(`Gagal menambahkan produk: ${err.message || 'Silakan coba lagi.'}`);
    } finally {
      setProcessing(false);
    }
  };
  const handleEditProduct = async () => {
    if (!currentProduct) return;
    
    try {
      setProcessing(true);
      setStatusMessage('Validasi data produk...');
      
      // Validasi data
      if (!currentProduct.name || currentProduct.name.trim() === '') {
        alert('Nama produk tidak boleh kosong');
        setProcessing(false);
        setStatusMessage('');
        return;
      }
      
      // Ensure price is a valid number
      const priceValue = typeof currentProduct.price === 'string' 
          ? getNumericValue(currentProduct.price) 
          : currentProduct.price;
          
      if (isNaN(Number(priceValue)) || Number(priceValue) <= 0) {
        alert('Harga jual harus lebih dari 0');
        setProcessing(false);
        setStatusMessage('');
        return;
      }
      
      // Ensure base_price is a valid number
      const basePriceValue = typeof currentProduct.base_price === 'string'
          ? getNumericValue(currentProduct.base_price)
          : currentProduct.base_price;
          
      if (isNaN(Number(basePriceValue)) || Number(basePriceValue) <= 0) {
        alert('Harga modal harus lebih dari 0');
        setProcessing(false);
        setStatusMessage('');
        return;
      }
      
      setStatusMessage('Mengoptimalkan gambar...');
      
      // Optimize image with our function (now awaits the promise)
      let optimizedImageUrl = await optimizeImage(
        typeof currentProduct.image_url === 'string' ? currentProduct.image_url : undefined
      );
      
      // Prepare data for API - ensure all values are proper types
      const productToUpdate = {
        name: currentProduct.name.trim(),
        stock: Number(currentProduct.stock),
        price: Number(priceValue),
        base_price: Number(basePriceValue),
        image_url: optimizedImageUrl
      };
      
      // Log what we're sending to help debug
      console.log('Data produk yang akan diupdate:', {
        id: currentProduct.id,
        ...productToUpdate
      });
      
      setStatusMessage('Menyimpan perubahan produk...');
      
      // Send to API dengan timeout dan retry
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 20000); // Extended to 20 seconds for larger images
      
      try {
        // Send to API
        const response = await fetch(`/api/products/${currentProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productToUpdate),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        // Get the raw response text first for debugging
        const responseText = await response.text();
        console.log('API response text:', responseText);
        
        // Parse the response if possible
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch (e) {
          console.error('Failed to parse response as JSON:', e);
          throw new Error('Server returned invalid response format');
        }
        
        if (!response.ok) {
          const errorMessage = responseData?.error || 'Gagal mengubah produk (HTTP ' + response.status + ')';
          const errorCode = responseData?.code || 'unknown';
          throw new Error(`${errorMessage} (Kode: ${errorCode})`);
        }
        
        const { product } = responseData;
        
        if (!product) {
          throw new Error('Data produk tidak ditemukan dalam respons');
        }
        
        setStatusMessage('Produk berhasil diperbarui!');
        console.log('Produk berhasil diperbarui:', product.id);
        
        // Update products state with functional update for reliability
        setProducts((prevProducts) => 
          prevProducts.map((p) => (p.id === currentProduct.id ? product : p))
        );
        
        // Close the modal and reset state
        setIsEditModalOpen(false);
        setImagePreview("");
        setStatusMessage('');
        setCurrentProduct(null);
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Waktu permintaan habis. Server mungkin sibuk atau gambar terlalu besar.');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error('Error updating product:', err);
      setStatusMessage('Gagal! Silakan coba lagi');
      alert(`Gagal mengubah produk: ${err.message || 'Silakan coba lagi.'}`);
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!currentProduct) return;
    
    try {
      setProcessing(true);
      
      // Send delete request to API
      const response = await fetch(`/api/products/${currentProduct.id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Gagal menghapus produk');
      }
      
      // Remove from products state
      setProducts(products.filter((p) => p.id !== currentProduct.id));
      setIsDeleteAlertOpen(false);
    } catch (err) {
      console.error('Error deleting product:', err);
      alert('Gagal menghapus produk. Silakan coba lagi.');
    } finally {
      setProcessing(false);
    }
  };
  const handleAddStock = async () => {
    if (!currentProduct || !addStockQuantity) return;
    
    try {
      setProcessing(true);
      const quantityToAdd = Number.parseInt(addStockQuantity);
      
      if (quantityToAdd <= 0) {
        alert('Silakan masukkan jumlah yang valid');
        setProcessing(false);
        return;
      }
      
      // Get current product data
      const newStock = currentProduct.stock + quantityToAdd;
      
      // Prepare data for API (only send necessary data)
      // TEMPORARY FIX: Exclude base_price as it's not in the database schema yet
      const productToUpdate = {
        name: currentProduct.name,
        stock: newStock,
        price: Number(typeof currentProduct.price === 'string' 
          ? getNumericValue(currentProduct.price) 
          : currentProduct.price),
        // base_price field temporarily removed until database schema is updated
        image_url: currentProduct.image_url
      };
      
      // Send to API with timeout handling
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
      
      try {
        // Send to API
        const response = await fetch(`/api/products/${currentProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productToUpdate),
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Server response:', errorText);
          throw new Error('Gagal mengubah stok');
        }
        
        const { product } = await response.json().catch(() => ({ product: null }));
        
        if (!product) {
          throw new Error('Data produk tidak valid');
        }
        
        console.log('Stok berhasil diperbarui:', product.id, 'stok baru:', product.stock);
        
        // Update products state using functional update for better reliability
        setProducts(prevProducts => 
          prevProducts.map(p => p.id === currentProduct.id ? product : p)
        );
            setIsAddStockModalOpen(false);
      setAddStockQuantity("");
      setStatusMessage('');
      setCurrentProduct(null);
      } catch (fetchErr: any) {
        if (fetchErr.name === 'AbortError') {
          throw new Error('Waktu permintaan habis. Server mungkin sibuk, silakan coba lagi.');
        }
        throw fetchErr;
      }
    } catch (err: any) {
      console.error('Error adding stock:', err);
      setStatusMessage('Gagal! Silakan coba lagi');
      alert(`Gagal mengubah stok: ${err.message || 'Silakan coba lagi.'}`);
    } finally {
      setProcessing(false);
    }
  };  const openEditModal = (product: Product) => {
    // Ensure we have clean numeric values before formatting for display
    const cleanProduct = {
      ...product,
      // Ensure price and base_price are proper numbers
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price,
      base_price: typeof product.base_price === 'string' ? parseFloat(product.base_price) : (product.base_price || 0)
    };
    
    // Now format for display
    const productWithFormattedPrices = {
      ...cleanProduct,
      formattedPrice: formatPrice(cleanProduct.price),
      formattedBasePrice: formatPrice(cleanProduct.base_price),
    };
    
    console.log('Opening edit modal with product:', {
      id: product.id,
      name: product.name,
      original_price: product.price,
      formatted_price: formatPrice(cleanProduct.price),
      original_base_price: product.base_price,
      formatted_base_price: formatPrice(cleanProduct.base_price)
    });
    
    setCurrentProduct(
      productWithFormattedPrices as Product & { formattedPrice: string; formattedBasePrice: string }
    );
    setImagePreview(product.image_url || "");
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
      setCurrentProduct({ ...currentProduct, image_url: "" });
    } else {
      setNewProduct({ ...newProduct, image_url: "" });
    }
  };

  // Function to generate a canvas with the cropped image
  const generateCroppedImage = useCallback(() => {
    if (!completedCrop || !imgRef.current || !previewCanvasRef.current) return;

    const image = imgRef.current;
    const canvas = previewCanvasRef.current;
    const crop = completedCrop;

    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      console.error('No 2d context');
      return;
    }

    // Set maximum dimensions for optimasi ukuran gambar
    const MAX_WIDTH = 400; // ukuran maksimum yang rasional untuk gambar produk
    const MAX_HEIGHT = 400;
    
    // Hitung ukuran canvas yang optimal
    let cropWidth = crop.width * scaleX;
    let cropHeight = crop.height * scaleY;
    
    // Jika ukuran gambar lebih besar dari MAX_WIDTH atau MAX_HEIGHT, resize
    if (cropWidth > MAX_WIDTH || cropHeight > MAX_HEIGHT) {
      const ratio = Math.min(MAX_WIDTH / cropWidth, MAX_HEIGHT / cropHeight);
      cropWidth *= ratio;
      cropHeight *= ratio;
    }
    
    // Set canvas size to the crop size with optimized dimensions
    canvas.width = cropWidth;
    canvas.height = cropHeight;

    // Clear the canvas to ensure transparency
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Create transparent background
    ctx.fillStyle = "rgba(255, 255, 255, 0)"; // Fully transparent
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Set image smoothing untuk gambar berkualitas baik tapi ringan
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'medium'; // 'medium' sebagai kompromi antara kualitas dan performa

    // Draw the cropped image
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const originalCropWidth = crop.width * scaleX;
    const originalCropHeight = crop.height * scaleY;

    ctx.drawImage(
      image,
      cropX, 
      cropY,
      originalCropWidth,
      originalCropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );
    
    console.log(`Gambar dioptimalkan: ${cropWidth}x${cropHeight}`);
    
  }, [completedCrop]);

  // Save the cropped image with optimization
  const handleSaveCrop = async () => {
    if (!completedCrop || !previewCanvasRef.current) return;
    
    try {
      const canvas = previewCanvasRef.current;
      // Use more aggressive compression for JPEG or medium quality for PNG
      // JPEG is smaller but loses transparency, PNG preserves transparency but is larger
      // Choose based on your needs - we'll use PNG with 0.8 quality for better compression
      const croppedImageUrl = canvas.toDataURL('image/png', 0.8);
      
      // Estimate the size of the image (rough calculation)
      const estimatedSize = Math.round(croppedImageUrl.length * 0.75 / 1024);
      console.log(`Estimated image size: ${estimatedSize}KB`);
      
      // Update image preview
      setImagePreview(croppedImageUrl);
      
      // Update product with cropped image
      if (isEdit && currentProduct) {
        setCurrentProduct({ ...currentProduct, image_url: croppedImageUrl });
      } else {
        setNewProduct({ ...newProduct, image_url: croppedImageUrl });
      }
      
      // Close the crop modal
      setCropModalOpen(false);
    } catch (err) {
      console.error('Error saving cropped image:', err);
      alert('Gagal menyimpan gambar. Silakan coba lagi.');
    }
  };
  // Update cropped image whenever crop changes
  useEffect(() => {
    if (completedCrop) {
      generateCroppedImage();
    }
  }, [completedCrop, generateCroppedImage]);
  
  // Set initial crop when image loads
  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget;
    
    // Set initial crop to centered square using at least 80% of the smaller dimension
    const size = Math.min(width, height) * 0.8;
    const x = (width - size) / 2;
    const y = (height - size) / 2;
    
    setCrop({
      unit: 'px',
      width: size,
      height: size,
      x,
      y
    });
  }, []);

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
          </CardHeader>          <CardContent className="p-1 sm:p-2 md:p-4">
            {loading ? (
              <div className="flex flex-col justify-center items-center p-8 gap-3">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
                <div className="text-center">
                  <div className="font-medium">Memuat produk...</div>
                  <div className="text-xs text-muted-foreground mt-1">
                    Mohon tunggu beberapa saat
                  </div>
                </div>
              </div>
            ) : error ? (
              <div className="text-center p-8">
                <div className="text-red-500 mb-3">
                  {error}
                </div>
                <div className="flex justify-center gap-2">
                  <Button 
                    variant="outline" 
                    className="text-xs sm:text-sm h-8"
                    onClick={() => window.location.reload()}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-1">
                      <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                      <path d="M21 3v5h-5"/>
                      <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                      <path d="M3 21v-5h5"/>
                    </svg>
                    Muat Ulang
                  </Button>
                </div>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center p-8 text-gray-500">
                {searchTerm ? "Tidak ada produk yang cocok dengan pencarian Anda" : "Belum ada produk tersedia. Tambahkan produk pertama Anda!"}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Gambar</TableHead>
                    <TableHead>Nama Produk</TableHead>
                    <TableHead className="text-center">Stok</TableHead>
                    <TableHead className="text-center">Harga Modal</TableHead>
                    <TableHead className="text-center">Harga Jual</TableHead>
                    <TableHead className="text-center">Keuntungan</TableHead>
                    <TableHead className="text-center">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {/* Only render a manageable number of products at once for performance */}
                  {filteredProducts.slice(0, 50).map((product) => (
                    <TableRow key={product.id}>
                      <TableCell>
                        <div className="w-16 h-16 overflow-hidden rounded-md bg-gray-100">
                          {product.image_url ? (
                            <Image
                              src={product.image_url}
                              alt={product.name}
                              width={64}
                              height={64}
                              className="w-full h-full object-cover"
                              loading="lazy"
                              onError={(e) => {
                                // Handle image loading errors
                                (e.target as any).src = "/placeholder.svg";
                              }}
                            />
                          ) : (
                            <ProductImagePlaceholder size={64} />
                          )}
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
                        Rp {formatPrice(product.base_price || 0)}
                      </TableCell>
                      <TableCell className="text-center">
                        Rp {formatPrice(product.price)}
                      </TableCell>
                      <TableCell className="text-center">
                        {product.base_price ? (
                          <span className={product.price > product.base_price ? "text-green-600 font-medium" : "text-red-600 font-medium"}>
                            {product.price > product.base_price 
                              ? `Rp ${formatPrice(product.price - product.base_price)} (${Math.round((product.price - product.base_price) / product.base_price * 100)}%)`
                              : "Rugi"}
                          </span>
                        ) : "N/A"}
                      </TableCell>
                      <TableCell className="text-center">
                        <div className="flex justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openAddStockModal(product)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            title="Tambah Stok"
                            disabled={processing}
                          >
                            <PackagePlus className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditModal(product)}
                            title="Edit Produk"
                            disabled={processing}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openDeleteAlert(product)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            title="Hapus Produk"
                            disabled={processing}
                          >
                            <Trash className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredProducts.length > 50 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-2 text-amber-600">
                        Menampilkan 50 dari {filteredProducts.length} produk. Gunakan pencarian untuk menemukan produk lainnya.
                      </TableCell>
                    </TableRow>
                  )}
                  {filteredProducts.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={7}
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
            )}
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
                  !addStockQuantity || Number.parseInt(addStockQuantity) <= 0 || processing
                }
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <PackagePlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                    Tambah Stok
                  </>
                )}
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
                <Label htmlFor="base_price" className="text-xs sm:text-sm">
                  Harga Modal (Rp)
                </Label>
                <Input
                  id="base_price"
                  placeholder="Harga modal produk"
                  value={newProduct.formattedBasePrice}
                  onChange={(e) => {
                    const formattedBasePrice = formatPrice(e.target.value);
                    setNewProduct({
                      ...newProduct,
                      formattedBasePrice,
                      base_price: getNumericValue(formattedBasePrice),
                    });
                  }}
                  className="text-xs sm:text-sm h-8 sm:h-10"
                />
              </div>
              <div className="space-y-1 sm:space-y-2">
                <Label htmlFor="price" className="text-xs sm:text-sm">
                  Harga Jual (Rp)
                </Label>
                <Input
                  id="price"
                  placeholder="Harga jual produk"
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
                {newProduct.base_price > 0 && newProduct.price > 0 && (
                  <div className={`text-xs ${newProduct.price > newProduct.base_price ? "text-green-600" : "text-red-600"}`}>
                    {newProduct.price > newProduct.base_price ? (
                      <>
                        Keuntungan: Rp {formatPrice(getNumericValue(newProduct.formattedPrice) - getNumericValue(newProduct.formattedBasePrice))}
                        <span className="ml-1">
                          ({Math.round((getNumericValue(newProduct.formattedPrice) - getNumericValue(newProduct.formattedBasePrice)) / getNumericValue(newProduct.formattedBasePrice) * 100)}%)
                        </span>
                      </>
                    ) : (
                      "Harga jual lebih rendah dari harga modal!"
                    )}
                  </div>
                )}
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
                disabled={!newProduct.name || newProduct.price <= 0 || newProduct.base_price <= 0 || processing}
                className="bg-violet-500 hover:bg-violet-600 text-xs sm:text-sm h-8 sm:h-10"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {statusMessage || 'Menyimpan...'}
                  </>
                ) : (
                  'Tambah'
                )}
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
                  <Label htmlFor="edit-base-price" className="text-xs sm:text-sm">
                    Harga Modal (Rp)
                  </Label>
                  <Input
                    id="edit-base-price"
                    placeholder="Harga modal produk"
                    value={
                      (currentProduct as any).formattedBasePrice ||
                      formatPrice(currentProduct.base_price || 0)
                    }
                    onChange={(e) => {
                      // Only allow numeric input and dot/comma
                      const inputValue = e.target.value.replace(/[^0-9.,]/g, '');
                      const formattedBasePrice = formatPrice(inputValue);
                      const numericValue = getNumericValue(formattedBasePrice);
                      
                      // Update both formatted and numeric values
                      setCurrentProduct({
                        ...currentProduct,
                        formattedBasePrice,
                        base_price: numericValue,
                      });
                      
                      // Log for debugging
                      console.log('Base price updated:', {
                        input: inputValue,
                        formatted: formattedBasePrice,
                        numeric: numericValue
                      });
                    }}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                </div>
                <div className="space-y-1 sm:space-y-2">
                  <Label htmlFor="edit-price" className="text-xs sm:text-sm">
                    Harga Jual (Rp)
                  </Label>
                  <Input
                    id="edit-price"
                    placeholder="Harga jual produk"
                    value={
                      (currentProduct as any).formattedPrice ||
                      formatPrice(currentProduct.price)
                    }
                    onChange={(e) => {
                      // Only allow numeric input and dot/comma
                      const inputValue = e.target.value.replace(/[^0-9.,]/g, '');
                      const formattedPrice = formatPrice(inputValue);
                      const numericValue = getNumericValue(formattedPrice);
                      
                      // Update both formatted and numeric values
                      setCurrentProduct({
                        ...currentProduct,
                        formattedPrice,
                        price: numericValue,
                      });
                      
                      // Log for debugging
                      console.log('Price updated:', {
                        input: inputValue,
                        formatted: formattedPrice,
                        numeric: numericValue
                      });
                    }}
                    className="text-xs sm:text-sm h-8 sm:h-10"
                  />
                  {currentProduct.base_price > 0 && currentProduct.price > 0 && (
                    <div className={`text-xs ${currentProduct.price > currentProduct.base_price ? "text-green-600" : "text-red-600"}`}>
                      {(() => {
                        // Get current price values, handling both numeric and string formats
                        const currentPrice = typeof currentProduct.price === 'string' 
                          ? getNumericValue(currentProduct.price) 
                          : currentProduct.price;
                        
                        const currentBasePrice = typeof currentProduct.base_price === 'string'
                          ? getNumericValue(currentProduct.base_price)
                          : currentProduct.base_price;
                        
                        // Calculate profit and margin
                        const profit = currentPrice - currentBasePrice;
                        const marginPercent = currentBasePrice > 0 
                          ? Math.round((profit / currentBasePrice) * 100) 
                          : 0;
                          
                        return currentPrice > currentBasePrice ? (
                          <>
                            Keuntungan: Rp {formatPrice(profit)}
                            <span className="ml-1">
                              ({marginPercent}%)
                            </span>
                          </>
                        ) : (
                          "Harga jual lebih rendah dari harga modal!"
                        );
                      })()}
                    </div>
                  )}
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
                  !currentProduct?.name || 
                  (currentProduct?.price || 0) <= 0 ||
                  (currentProduct?.base_price || 0) <= 0 ||
                  processing
                }
                className="bg-violet-500 hover:bg-violet-600 text-xs sm:text-sm h-8 sm:h-10"
              >
                {processing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {statusMessage || 'Menyimpan...'}
                  </>
                ) : (
                  'Simpan'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Crop Image Modal */}
        <Dialog
          open={cropModalOpen}
          onOpenChange={setCropModalOpen}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Sesuaikan Gambar</DialogTitle>
              <DialogDescription>
                Geser dan ubah ukuran kotak untuk mengatur gambar yang akan disimpan.
              </DialogDescription>
            </DialogHeader>
            
            <div className="flex flex-col items-center gap-4 py-4">
              {tempImage && (                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  onComplete={(c) => setCompletedCrop(c)}
                  aspect={1}
                  className="max-h-[350px] max-w-full bg-transparent"
                  ruleOfThirds
                ><img
                    ref={imgRef}
                    alt="Crop"
                    src={tempImage}
                    style={{ maxHeight: '350px', maxWidth: '100%' }}
                    onLoad={onImageLoad}
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              )}
              
              {/* Hidden canvas for cropped image generation */}
              <canvas
                ref={previewCanvasRef}
                style={{ display: 'none' }}
              />
            </div>

            <DialogFooter className="sm:justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCropModalOpen(false)}
                className="text-xs sm:text-sm"
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={handleSaveCrop}
                className="bg-violet-500 hover:bg-violet-600 text-xs sm:text-sm"
              >
                Terapkan
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
}
