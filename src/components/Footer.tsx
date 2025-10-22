import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, Linkedin, Github, Twitter, Phone, Link as LinkIcon } from 'lucide-react';
import { getContactContent, type ContactContent } from '../lib/content';
import { DEFAULT_CONTACT_CONTENT } from '../data/defaultContent';

export function Footer() {
  const [contactContent, setContactContent] = useState<ContactContent>(DEFAULT_CONTACT_CONTENT);

  useEffect(() => {
    let isMounted = true;

    const loadContact = async () => {
      try {
        const data = await getContactContent();
        if (isMounted && data) {
          setContactContent(data);
        }
      } catch (error) {
        console.error('Failed to load footer contact content', error);
      }
    };

    void loadContact();

    return () => {
      isMounted = false;
    };
  }, []);

  const socialIconMap = useMemo(
    () =>
      ({
        linkedin: Linkedin,
        github: Github,
        twitter: Twitter,
        mail: Mail,
        email: Mail,
        phone: Phone,
      }) as Record<string, typeof Linkedin>,
    []
  );

  const contactLinks = useMemo(() => {
    const primary = [
      {
        key: 'email',
        href: `mailto:${contactContent.email.address}`,
        Icon: Mail,
        label: contactContent.email.label,
        external: false,
      },
      {
        key: 'phone',
        href: `tel:${contactContent.phone.number.replace(/\s+/g, '')}`,
        Icon: Phone,
        label: contactContent.phone.label,
        external: false,
      },
    ];

    const socials = contactContent.socials.map((social) => {
      const Icon = socialIconMap[social.type.toLowerCase()] ?? LinkIcon;
      return {
        key: social.type,
        href: social.url,
        Icon,
        label: social.label,
        external: true,
      };
    });

    return [...primary, ...socials];
  }, [contactContent, socialIconMap]);

  return (
    <footer className="border-t border-border bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2">
            <h3 className="mb-4">Lu Junrong Jarvis</h3>
            <p className="text-muted-foreground mb-4">
              Industrial Designer & UX Researcher creating human-centered products through design and research.
            </p>
            <div className="flex gap-4 flex-wrap">
              {contactLinks.map(({ key, href, Icon, external, label }) => (
                <a
                  key={key}
                  href={href}
                  target={external ? '_blank' : undefined}
                  rel={external ? 'noopener noreferrer' : undefined}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                  title={label}
                >
                  <Icon size={20} />
                </a>
              ))}
            </div>
          </div>
          
          <div>
            <h4 className="mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link to="/projects" className="text-muted-foreground hover:text-foreground transition-colors">
                  Projects
                </Link>
              </li>
              <li>
                <Link to="/stories" className="text-muted-foreground hover:text-foreground transition-colors">
                  Stories
                </Link>
              </li>
              <li>
                <Link to="/about" className="text-muted-foreground hover:text-foreground transition-colors">
                  About
                </Link>
              </li>
              <li>
                <Link to="/contact" className="text-muted-foreground hover:text-foreground transition-colors">
                  Contact
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="mb-4">Services</h4>
            <ul className="space-y-2 text-muted-foreground">
              <li>Industrial Design</li>
              <li>Service Design</li>
              <li>UX Research</li>
              <li>UI Design</li>
            </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-border text-center text-muted-foreground">
          <Link to="/admin/login" className="hover:text-foreground transition-colors inline-block">
            &copy; {new Date().getFullYear()} Lu Junrong Jarvis. All rights reserved.
          </Link>
        </div>
      </div>
    </footer>
  );
}
