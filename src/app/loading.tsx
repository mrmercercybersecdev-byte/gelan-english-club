import Image from "next/image";

export default function Loading() {
  return (
    <div className="grid min-h-[60vh] place-items-center" role="status" aria-label="Loading">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-14 w-14">
          <span className="absolute inset-0 animate-ping rounded-2xl bg-brand/30" />
          <Image
            src="/images/gelan-english-club-logo.jpeg"
            alt=""
            width={56}
            height={56}
            className="relative h-14 w-14 rounded-2xl bg-white object-contain shadow-lg"
          />
        </div>
        <div className="flex gap-1.5">
          {[0, 1, 2].map((i) => <span key={i} className="h-2 w-2 animate-bounce rounded-full bg-gold" style={{ animationDelay: `${i * 0.15}s` }} />)}
        </div>
      </div>
    </div>
  );
}
