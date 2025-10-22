import { useEffect, useMemo, useState } from 'react';
import {
  Mail,
  Linkedin,
  Github,
  Twitter,
  Phone,
  Link as LinkIcon,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { addMessage } from '../lib/messages';
import { getContactContent, type ContactContent } from '../lib/content';
import { DEFAULT_CONTACT_CONTENT } from '../data/defaultContent';
import { toast } from 'sonner';

export function Contact() {
  const [content, setContent] = useState<ContactContent>(DEFAULT_CONTACT_CONTENT);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadContent = async () => {
      try {
        const data = await getContactContent();
        if (isActive && data) {
          setContent(data);
        }
      } catch (error) {
        console.error('Failed to load contact content', error);
      }
    };

    void loadContent();

    return () => {
      isActive = false;
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

  const normalizedPhoneLink = content.phone.number.replace(/\s+/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      await addMessage({
        name: formData.name,
        email: formData.email,
        subject: formData.subject,
        message: formData.message,
      });

      toast.success('Message sent successfully!', {
        description: "I'll get back to you as soon as possible.",
      });

      setFormData({
        name: '',
        email: '',
        subject: '',
        message: '',
      });
    } catch (error) {
      console.error(error);
      toast.error('Failed to send message. Please try again later.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen py-20">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl mb-4">{content.title}</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {content.subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div>
                    <Label htmlFor="name">Name</Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          email: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      value={formData.subject}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          subject: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <div>
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      rows={6}
                      value={formData.message}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          message: e.target.value,
                        })
                      }
                      required
                    />
                  </div>

                  <Button
                    type="submit"
                    size="lg"
                    className="w-full"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Sending...' : 'Send Message'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-8">
            <div>
              <h2 className="text-3xl mb-6">{content.connectHeading}</h2>
              <p className="text-lg text-muted-foreground mb-6">
                {content.connectDescription}
              </p>
            </div>

            <div className="space-y-4">
              <a
                href={`mailto:${content.email.address}`}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Mail size={24} />
                </div>
                <div>
                  <h3>{content.email.label}</h3>
                  <p className="text-muted-foreground">{content.email.address}</p>
                </div>
              </a>

              <a
                href={`tel:${normalizedPhoneLink}`}
                className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                  <Phone size={24} />
                </div>
                <div>
                  <h3>{content.phone.label}</h3>
                  <p className="text-muted-foreground">{content.phone.number}</p>
                </div>
              </a>

              {content.socials.map((social) => {
                const Icon =
                  socialIconMap[social.type.toLowerCase()] ?? LinkIcon;
                return (
                  <a
                    key={social.type}
                    href={social.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-4 border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="w-12 h-12 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Icon size={24} />
                    </div>
                    <div>
                      <h3>{social.label}</h3>
                      <p className="text-muted-foreground">{social.description}</p>
                    </div>
                  </a>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
