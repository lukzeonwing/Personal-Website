import { useEffect, useState } from 'react';
import { ImageWithFallback } from '../components/figma/ImageWithFallback';
import { getAboutContent, type AboutContent } from '../lib/content';
import { DEFAULT_ABOUT_CONTENT } from '../data/defaultContent';

export function About() {
  const [content, setContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);

  useEffect(() => {
    let isActive = true;

    const loadContent = async () => {
      try {
        const data = await getAboutContent();
        if (isActive && data) {
          setContent(data);
        }
      } catch (error) {
        console.error('Failed to load about content', error);
      }
    };

    void loadContent();

    return () => {
      isActive = false;
    };
  }, []);

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20">
          <div>
            <h1 className="text-5xl mb-6">{content.heroTitle}</h1>
            <div className="space-y-4 text-lg leading-relaxed">
              {content.heroParagraphs.map((paragraph, index) => (
                <p key={index}>{paragraph}</p>
              ))}
            </div>
          </div>
          <div className="aspect-square rounded-lg overflow-hidden bg-muted">
            <ImageWithFallback
              src={content.heroImage}
              alt="About me"
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl mb-6">Skills & Expertise</h2>
            <div className="space-y-6">
              {content.skills.map((group, index) => (
                <div key={group.title + index}>
                  <h3 className="mb-3">{group.title}</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    {group.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-3xl mb-6">Tools & Software</h2>
            <div className="space-y-6">
              {content.tools.map((group, index) => (
                <div key={group.title + index}>
                  <h3 className="mb-3">{group.title}</h3>
                  <ul className="space-y-2 text-muted-foreground">
                    {group.items.map((item) => (
                      <li key={item}>• {item}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-20">
          <h2 className="text-3xl mb-6">Education & Certifications</h2>
          <div className="space-y-4">
            {content.education.map((entry) => (
              <div key={entry.title} className="border-l-2 border-primary pl-6 py-2">
                <h3 className="mb-1">{entry.title}</h3>
                <p className="text-muted-foreground">{entry.subtitle}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
