import Image from "next/image";

interface ProductImagePlaceholderProps {
  src?: string;
  alt?: string;
  className?: string;
  size?: number;
}

export default function ProductImagePlaceholder({
  src,
  alt = "Product image",
  className = "",
  size = 240,
}: ProductImagePlaceholderProps) {
  return (
    <div
      className={`aspect-[3/4] w-full overflow-hidden bg-gray-100 ${className}`}
    >
      <Image
        src={
          src ||
          `/placeholder.svg?height=${size}&width=${Math.floor(size * 0.75)}`
        }
        alt={alt}
        width={Math.floor(size * 0.75)}
        height={size}
        className="w-full h-full object-cover hover:scale-105 transition-transform duration-200"
      />
    </div>
  );
}
