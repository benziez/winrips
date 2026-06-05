import { usePackCover, MYSTERY_PACK_COVER } from "../../hooks/usePackCover";
import { ObsidianImage } from "./ObsidianImage";
import { GlassSurface } from "./GlassSurface";

interface PackCatalogImageProps {
  packId: string;
  src?: string | null;
  alt: string;
  priority?: boolean;
  className?: string;
  framed?: boolean;
}

export function PackCatalogImage({
  packId,
  src,
  alt,
  priority = false,
  className = "",
  framed = false,
}: PackCatalogImageProps) {
  const { imgSrc, onError } = usePackCover(packId, src);

  const image = (
    <ObsidianImage
      imgSrc={imgSrc}
      fallbackSrc={MYSTERY_PACK_COVER}
      alt={alt}
      onError={onError}
      priority={priority}
      className="h-full w-full"
      imgClassName="absolute inset-0 h-full w-full object-cover object-center"
    />
  );

  if (!framed) {
    return <div className={`relative h-full w-full overflow-hidden bg-transparent ${className}`}>{image}</div>;
  }

  return (
    <GlassSurface
      variant="solid"
      className={`relative h-full w-full overflow-hidden rounded-2xl ${className}`}
    >
      {image}
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(125deg,transparent_42%,rgba(242,214,128,0.06)_50%,transparent_58%)]"
        aria-hidden
      />
    </GlassSurface>
  );
}

export { MYSTERY_PACK_COVER };
