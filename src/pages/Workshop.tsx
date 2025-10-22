import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Printer, Lightbulb, PenTool, Check, ArrowRight, Store, ExternalLink } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { fetchWorkshopGalleryImages } from '../lib/uploads';

export function Workshop() {
  const { hash } = useLocation();
  const [galleryPhotos, setGalleryPhotos] = useState<{ src: string; alt: string }[]>([]);

  useEffect(() => {
    let isMounted = true;

    const loadGallery = async () => {
      try {
        const files = await fetchWorkshopGalleryImages();
        if (!isMounted) {
          return;
        }

        const photos = files.map(({ filename, url }) => {
          const altTextBase = filename.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ').trim();
          const alt = altTextBase ? `Workshop gallery image ${altTextBase}` : 'Workshop gallery image';

          return {
            src: url,
            alt,
          };
        });

        setGalleryPhotos(photos);
      } catch (error) {
        console.error('Failed to load workshop gallery images', error);
        if (isMounted) {
          setGalleryPhotos([]);
        }
      }
    };

    loadGallery();

    return () => {
      isMounted = false;
    };
  }, []);

  const services = [
    {
      icon: Printer,
      title: 'Multi-Material Manufacturing',
      description: 'Engineering-grade plastics, flexible media, and composite builds with reliable quality control and finishing options.',
      features: [
        'Engineering plastics, flexible and composite materials',
        'Functional + aesthetic finishing options',
        'Rapid prototyping to small-batch production',
        'Dimensional accuracy and tolerance checks',
        'Assembly fit verification',
      ],
      image: import.meta.env.BASE_URL + 'content/workshop/service-1.svg',
    },
    {
      icon: Lightbulb,
      title: 'Expert Consulting',
      description: 'Practical guidance on product feasibility, DFM, and print strategy—grounded in real-world manufacturing experience.',
      features: [
        'Design for manufacture (DFM) reviews',
        'Process selection and tuning',
        'Cost and lead-time estimation',
        'Material and tolerance guidance',
        'Workflow and handoff best practices',
      ],
      image: import.meta.env.BASE_URL + 'content/workshop/service-2.svg',
    },
    {
      icon: PenTool,
      title: 'Model Modification',
      description: 'Clean-up, repair, and prepare files for reliable prints—plus custom modeling when needed.',
      features: [
        'Custom 3D model creation',
        'STL file modification and repair',
        'File optimization for printing',
        'Reverse engineering from photos/sketches',
        'Technical drawings to 3D conversion',
      ],
      image: import.meta.env.BASE_URL + 'content/workshop/service-3.svg',
    },
  ];

  return (
    <div>
      {/* Hero Section */}
      <section id="top" className="relative min-h-[80vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={import.meta.env.BASE_URL + 'content/workshop/IMG_4595.jpeg'}
            alt="Workshop background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <span>From 2023</span>
            </div>
            <h1 className="text-5xl md:text-6xl lg:text-7xl mb-6">
              3D Printing Workshop
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              3D printing services that cater to your unique needs. Whether you're a designer, engineer, or hobbyist, my workshop is equipped to help you bring your ideas to life with precision and quality.
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Link to="/contact">
                <Button size="lg">
                  Get a Quote
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
              <Button
                size="lg"
                variant="outline"
                asChild
                scrollToTopOnClick={false}
                onClick={(event) => {
                  event.preventDefault();
                  const gallerySection = document.querySelector('#gallery');
                  gallerySection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                  if (typeof window !== 'undefined') {
                    window.history.replaceState(null, '', '#gallery');
                  }
                }}
              >
                <a href="#gallery">View Gallery</a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Workshop Overview Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
             Serving 300+ clients with professional 3D model modification, post-processing guidance, and product development.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            {[
              {
                icon: Printer,
                title: 'Multi-Material Manufacturing',
                description: 'Extensive experience in multi-material 3D printing processes (e.g. engineering plastic, cloth & soft material).',
              },
              {
                icon: Lightbulb,
                title: 'Expert Consulting',
                description: 'Professional guidance on 3D printing product development, served over 300+ clients.',
              },
              {
                icon: PenTool,
                title: 'Model Modification',
                description: '3D model modification and design for maunfacture skills for best results.',
              },
            ].map((service) => {
              const Icon = service.icon;
              return (
                <Card key={service.title} className="border-2 hover:border-primary/50 transition-colors">
                  <CardContent className="pt-6">
                    <div className="inline-flex items-center justify-center w-12 h-12 rounded-lg bg-primary/10 text-primary mb-4">
                      <Icon size={24} />
                    </div>
                    <h3 className="text-xl mb-2">{service.title}</h3>
                    <p className="text-muted-foreground">
                      {service.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
          
          <div className="text-center">
          </div>
        </div>
      </section>

      {/* Gallery Section */}
      <section id="gallery" className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">Workshop Gallery</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              3D printing workshop gallery, showcasing a variety of projects and materials I've worked with.
            </p>
          </div>
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {galleryPhotos.length > 0 ? (
              galleryPhotos.map((image) => (
                <div key={image.src} className="overflow-hidden rounded-lg bg-muted">
                  <div className="aspect-[4/3]">
                    <ImageWithFallback
                      src={image.src}
                      alt={image.alt}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              ))
            ) : (
              <p className="col-span-full text-center text-muted-foreground">
                Gallery images coming soon.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6">Ready to Start Your Project?</h2>
          <p className="text-xl mb-8 opacity-90">
            Get in touch with us today to discuss your 3D printing needs. I'm here to help turn your ideas into reality.
          </p>
          <Link to="/contact">
            <Button size="lg" variant="secondary">
              Contact Us Now
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
