import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Printer, Lightbulb, PenTool } from 'lucide-react';
import { Button } from '../components/ui/button';
import { ProjectCard } from '../components/ProjectCard';
import { Card, CardContent } from '../components/ui/card';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '../components/ui/carousel';
import { getFeaturedProjects, getProjects } from '../lib/projects';
import { getStories } from '../lib/stories';
import { Project } from '../types/project';
import { Story } from '../types/story';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { StoryCard } from '../components/StoryCard';

export function Home() {
  const [featuredProjects, setFeaturedProjects] = useState<Project[]>([]);
  const [recentStories, setRecentStories] = useState<Story[]>([]);
  const scrollToTop = () => {
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  };

  useEffect(() => {
    let isMounted = true;

    const loadContent = async () => {
      try {
        const [projects, stories] = await Promise.all([
          getProjects(),
          getStories(),
        ]);

        if (!isMounted) return;

        const featured = getFeaturedProjects(projects)
          .sort((a, b) => {
            // Sort featured projects by featuredAt timestamp (latest first)
            const featuredAtA = a.featuredAt || 0;
            const featuredAtB = b.featuredAt || 0;
            return featuredAtB - featuredAtA;
          });
        const sortedStories = [...stories].sort(
          (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        setFeaturedProjects(featured);
        setRecentStories(sortedStories.slice(0, 5));
      } catch (error) {
        console.error('Failed to load homepage content', error);
      }
    };

    loadContent();

    return () => {
      isMounted = false;
    };
  }, []);
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
  };
  
  return (
    <div>
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center">
        <div className="absolute inset-0 z-0">
          <ImageWithFallback
            src={import.meta.env.BASE_URL + 'content/home/hero.jpg'}
            alt="Hero background"
            className="w-full h-full object-cover opacity-20"
          />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
          <div className="max-w-3xl">
            <div className="mb-6">
              <span className="text-2xl md:text-3xl text-muted-foreground block">Hi! I am Lu Junrong</span>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-semibold text-primary">JARVIS</h1>
            </div>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              A Industrial Designer, UX Researcher, interested in product system design, UI/UX, design research, and 3D printing solutions.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link to="/projects">
                <Button size="lg">
                  View Projects
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>

              <Link to="/about">
                <Button size="lg" variant="outline">
                  About Me
                </Button>
              </Link>

            </div>
          </div>
        </div>
      </section>
      
      {/* 3D Printing Workshop Section */}
      <section className="py-20 bg-gradient-to-br from-primary/5 via-background to-primary/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl mb-4">My 3D Printing Workshop</h2>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-4">
              <span>From 2023</span>
            </div>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Serving 300+ clients with complex material experience, model modification, post-processing guidance, and product development
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
              <Link
                to="/workshop"
                onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
              >
                <Button size="lg">
                  Explore Workshop
                  <ArrowRight className="ml-2" size={20} />
                </Button>
              </Link>
          </div>
        </div>
      </section>
      
      {/* Featured Projects */}
      {featuredProjects.length > 0 && (
        <section className="py-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="text-4xl mb-4">Featured Work</h2>
                <p className="text-xl text-muted-foreground">
                  Projects that show my design work.
                </p>
              </div>
              <Link to="/projects">
                <Button variant="ghost">
                  View All
                  <ArrowRight className="ml-2" size={18} />
                </Button>
              </Link>
            </div>

            <div className="relative px-12 px-[10px] py-[0px]">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                  dragFree: true,
                }}
                className="w-full"
              >
                <CarouselContent
                  className="-ml-3 cursor-grab active:cursor-grabbing"
                >
                  {featuredProjects.map(project => (
                    <CarouselItem
                      key={project.id}
                      className="pl-3 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/3"
                    >
                      <ProjectCard 
                      project={project} 
                      onNavigate={scrollToTop}
                      />
                    </CarouselItem>
                  ))}
                </CarouselContent>
                <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity -left-6" />
                <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity -right-6" />
              </Carousel>
            </div>
          </div>
        </section>
      )}

      {/* Recent Stories */}
      {recentStories.length > 0 && (
        <section className="py-20 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="mb-12">
              <h2 className="text-4xl mb-4">Recent Stories</h2>
              <p className="text-xl text-muted-foreground">
                Stories from my recent photography.
              </p>
            </div>
            
            <div className="relative px-12 px-[10px] py-[0px]">
              <Carousel
                opts={{
                  align: "start",
                  loop: false,
                  dragFree: true,
                }}
                className="w-full"
              >
                <CarouselContent 
                  className="-ml-3 cursor-grab active:cursor-grabbing"
                >
                  {recentStories.map(story => (
                    <CarouselItem 
                    key={story.id} 
                    className="pl-3 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/3"
                    >
                      <StoryCard
                        story={story}
                        onNavigate={scrollToTop}
                        formatDate={formatDate}
                      />
                    </CarouselItem>
                  ))}
                  
                  {/* View All Stories Card */}
                  <CarouselItem className="pl-3 basis-full sm:basis-1/2 md:basis-1/3 lg:basis-1/4 xl:basis-1/5">
                    <Link to="/stories" onClick={scrollToTop}>
                      <Card className="overflow-hidden hover:shadow-lg transition-shadow h-full group/card border-2 border-dashed border-border hover:border-primary">
                        <div className="aspect-[4/3] bg-muted/50 flex items-center justify-center">
                          <div className="text-center">
                            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 text-primary group-hover/card:bg-primary group-hover/card:text-primary-foreground transition-colors">
                              <ArrowRight size={24} />
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-3">
                          <h3 className="mb-1 text-center group-hover/card:text-primary transition-colors">
                            View All
                          </h3>
                          <p className="text-muted-foreground text-xs text-center">
                            Explore all stories
                          </p>
                        </CardContent>
                      </Card>
                    </Link>
                  </CarouselItem>
                </CarouselContent>
                <CarouselPrevious className="opacity-0 group-hover:opacity-100 transition-opacity -left-6" />
                <CarouselNext className="opacity-0 group-hover:opacity-100 transition-opacity -right-6" />
              </Carousel>
            </div>
          </div>
        </section>
      )}
      
      {/* CTA Section */}
      <section className="py-20 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl mb-6">Let's Create Something Meaningful</h2>
          <p className="text-xl mb-8 opacity-90">
            Whether you're looking to develop a new product, conduct design research, or explore 3D printing solutions, I can help.
          </p>
          <Link
            to="/contact"
            onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'auto' })}
          >
            <Button size="lg" variant="secondary">
              Start a Conversation
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
