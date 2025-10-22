"use client";

import * as React from "react";
import useEmblaCarousel, {
  type UseEmblaCarouselType,
} from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

import { cn } from "./utils";
import { Button } from "./button";

type CarouselApi = UseEmblaCarouselType[1];
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>;
type CarouselOptions = UseCarouselParameters[0];
type CarouselPlugin = UseCarouselParameters[1];

type CarouselProps = {
  opts?: CarouselOptions;
  plugins?: CarouselPlugin;
  orientation?: "horizontal" | "vertical";
  setApi?: (api: CarouselApi) => void;
  showControls?: "auto" | "always" | "hover";
};

type CarouselContextProps = {
  carouselRef: ReturnType<typeof useEmblaCarousel>[0];
  api: ReturnType<typeof useEmblaCarousel>[1];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  isScrollable: boolean;
  hasMultipleSlides: boolean;
  showControls: "auto" | "always" | "hover";
  viewportId: string;
} & CarouselProps;

const CarouselContext = React.createContext<CarouselContextProps | null>(null);

function useCarousel() {
  const context = React.useContext(CarouselContext);

  if (!context) {
    throw new Error("useCarousel must be used within a <Carousel />");
  }

  return context;
}

function Carousel({
  orientation,
  opts,
  setApi,
  plugins,
  showControls = "auto",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & CarouselProps) {
  const resolvedOrientation =
    orientation ?? (opts?.axis === "y" ? "vertical" : "horizontal");
  const [carouselRef, api] = useEmblaCarousel(
    {
      ...opts,
      axis: resolvedOrientation === "horizontal" ? "x" : "y",
    },
    plugins,
  );
  const [canScrollPrev, setCanScrollPrev] = React.useState(false);
  const [canScrollNext, setCanScrollNext] = React.useState(false);
  const [hasMultipleSlides, setHasMultipleSlides] = React.useState(false);
  const baseId = React.useId();
  const viewportId = `${baseId.replace(/:/g, "")}-viewport`;
  const isScrollable = hasMultipleSlides;

  const onSelect = React.useCallback((emblaApi: CarouselApi) => {
    if (!emblaApi) return;
    const slideNodes = emblaApi.slideNodes();
    const multipleSlides = slideNodes.length > 1;

    setHasMultipleSlides(multipleSlides);
    setCanScrollPrev(multipleSlides && emblaApi.canScrollPrev());
    setCanScrollNext(multipleSlides && emblaApi.canScrollNext());
  }, []);

  const scrollPrev = React.useCallback(() => {
    api?.scrollPrev();
  }, [api]);

  const scrollNext = React.useCallback(() => {
    api?.scrollNext();
  }, [api]);

  const handleKeyDown = React.useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  React.useEffect(() => {
    if (!api || !setApi) return;
    setApi(api);
  }, [api, setApi]);

  React.useEffect(() => {
    if (!api) return;
    onSelect(api);
    api.on("select", onSelect);
    api.on("reInit", onSelect);
    api.on("resize", onSelect);

    return () => {
      api.off("select", onSelect);
      api.off("reInit", onSelect);
      api.off("resize", onSelect);
    };
  }, [api, onSelect]);

  return (
    <CarouselContext.Provider
      value={{
        carouselRef,
        api,
        opts,
        orientation: resolvedOrientation,
        scrollPrev,
        scrollNext,
        canScrollPrev,
        canScrollNext,
        isScrollable,
        hasMultipleSlides,
        showControls,
        viewportId,
      }}
    >
      <div
        onKeyDownCapture={handleKeyDown}
        className={cn("relative group", className)}
        role="region"
        aria-roledescription="carousel"
        data-slot="carousel"
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

function CarouselContent({ className, ...props }: React.ComponentProps<"div">) {
  const { carouselRef, orientation, viewportId } = useCarousel();

  return (
    <div
      ref={carouselRef}
      id={viewportId}
      className="overflow-hidden"
      data-slot="carousel-content"
      role="group"
      aria-live="polite"
    >
      <div
        className={cn(
          "flex",
          orientation === "horizontal" ? "-ml-4" : "-mt-4 flex-col",
          className,
        )}
        {...props}
      />
    </div>
  );
}

function CarouselItem({ className, ...props }: React.ComponentProps<"div">) {
  const { orientation } = useCarousel();

  return (
    <div
      role="group"
      aria-roledescription="slide"
      data-slot="carousel-item"
      className={cn(
        "min-w-0 shrink-0 grow-0 basis-full",
        orientation === "horizontal" ? "pl-4" : "pt-4",
        className,
      )}
      {...props}
    />
  );
}

function CarouselPrevious({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const {
    orientation,
    scrollPrev,
    canScrollPrev,
    hasMultipleSlides,
    showControls,
    viewportId,
  } = useCarousel();

  const visibilityClasses =
    showControls === "always"
      ? "opacity-100 pointer-events-auto"
      : showControls === "hover"
        ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
        : "opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto md:focus-visible:opacity-100 md:focus-visible:pointer-events-auto";
  const shouldHide = !hasMultipleSlides || !canScrollPrev;

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size={size}
      type="button"
      className={cn(
        "absolute z-10 size-8 rounded-full transition-opacity",
        visibilityClasses,
        orientation === "horizontal"
          ? "top-1/2 -left-12 -translate-y-1/2"
          : "-top-12 left-1/2 -translate-x-1/2 rotate-90",
        shouldHide && "hidden",
        className,
      )}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      aria-label="Previous slide"
      aria-controls={viewportId}
      scrollToTopOnClick={false}
      {...props}
    >
      <ArrowLeft aria-hidden="true" />
      <span className="sr-only">Previous slide</span>
    </Button>
  );
}

function CarouselNext({
  className,
  variant = "outline",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  const {
    orientation,
    scrollNext,
    canScrollNext,
    hasMultipleSlides,
    showControls,
    viewportId,
  } = useCarousel();

  const visibilityClasses =
    showControls === "always"
      ? "opacity-100 pointer-events-auto"
      : showControls === "hover"
        ? "opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto group-focus-within:opacity-100 group-focus-within:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto"
        : "opacity-100 pointer-events-auto md:opacity-0 md:pointer-events-none md:group-hover:opacity-100 md:group-hover:pointer-events-auto md:group-focus-within:opacity-100 md:group-focus-within:pointer-events-auto focus-visible:opacity-100 focus-visible:pointer-events-auto md:focus-visible:opacity-100 md:focus-visible:pointer-events-auto";
  const shouldHide = !hasMultipleSlides || !canScrollNext;

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size={size}
      type="button"
      className={cn(
        "absolute z-10 size-8 rounded-full transition-opacity",
        visibilityClasses,
        orientation === "horizontal"
          ? "top-1/2 -right-12 -translate-y-1/2"
          : "-bottom-12 left-1/2 -translate-x-1/2 rotate-90",
        shouldHide && "hidden",
        className,
      )}
      disabled={!canScrollNext}
      onClick={scrollNext}
      aria-label="Next slide"
      aria-controls={viewportId}
      scrollToTopOnClick={false}
      {...props}
    >
      <ArrowRight aria-hidden="true" />
      <span className="sr-only">Next slide</span>
    </Button>
  );
}

export {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselPrevious,
  CarouselNext,
};
