import Image from "next/image";
import { isSafeCoverImage } from "@/lib/image-url";

type BlogCoverProps = {
  src: string;
  alt: string;
  sizes: string;
  className: string;
  priority?: boolean;
};

export default function BlogCover({ src, alt, sizes, className, priority = false }: BlogCoverProps) {
  if (!isSafeCoverImage(src)) return null;

  if (src.startsWith("/images/")) {
    return <Image src={src} alt={alt} fill sizes={sizes} priority={priority} className={className} />;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding="async"
      referrerPolicy="no-referrer"
      className={`absolute inset-0 h-full w-full ${className}`}
    />
  );
}
