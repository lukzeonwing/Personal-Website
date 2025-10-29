import { useEffect, useState } from 'react';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Textarea } from '../../components/ui/textarea';
import { Label } from '../../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { FileUpload } from '../../components/FileUpload';
import {
  getAboutContent,
  updateAboutContent,
  getContactContent,
  updateContactContent,
  type AboutContent,
  type ContactContent,
} from '../../lib/content';
import { DEFAULT_ABOUT_CONTENT, DEFAULT_CONTACT_CONTENT } from '../../data/defaultContent';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

const normalizeLineBreaks = (value: string) => value.replace(/\r\n/g, '\n');

const paragraphsToText = (paragraphs: string[]) =>
  normalizeLineBreaks(paragraphs.join('\n'));

const textToParagraphs = (text: string) =>
  normalizeLineBreaks(text).split('\n');

const listToText = (items: string[]) =>
  normalizeLineBreaks(items.join('\n'));

const textToList = (text: string) =>
  normalizeLineBreaks(text).split('\n');

const sanitizeListEntries = (items: string[]) =>
  items
    .map((item) => normalizeLineBreaks(item).trim())
    .filter((item) => item.length > 0);

const sanitizeTimelineEntries = (entries: { title: string; subtitle: string }[]) =>
  entries.map((entry) => ({
    title: normalizeLineBreaks(entry.title).trim(),
    subtitle: normalizeLineBreaks(entry.subtitle).trim(),
  }));

const sanitizeAboutContentData = (content: AboutContent): AboutContent => ({
  ...content,
  heroParagraphs: content.heroParagraphs
    .map((paragraph) => normalizeLineBreaks(paragraph).trim())
    .filter((paragraph) => paragraph.length > 0),
  skills: content.skills.map((group) => ({
    ...group,
    items: sanitizeListEntries(group.items),
  })),
  tools: content.tools.map((group) => ({
    ...group,
    items: sanitizeListEntries(group.items),
  })),
  workExperience: sanitizeTimelineEntries(content.workExperience),
  publications: sanitizeTimelineEntries(content.publications ?? []),
  education: sanitizeTimelineEntries(content.education),
});

export function SiteContent() {
  const [aboutContent, setAboutContent] = useState<AboutContent>(DEFAULT_ABOUT_CONTENT);
  const [contactContent, setContactContent] = useState<ContactContent>(DEFAULT_CONTACT_CONTENT);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingAbout, setIsSavingAbout] = useState(false);
  const [isSavingContact, setIsSavingContact] = useState(false);

  useEffect(() => {
    let isActive = true;

    const loadContent = async () => {
      try {
        const [about, contact] = await Promise.all([
          getAboutContent(),
          getContactContent(),
        ]);

        if (!isActive) return;

        if (about) {
          setAboutContent(about);
        }
        if (contact) {
          setContactContent(contact);
        }
      } catch (error) {
        console.error('Failed to load site content', error);
        toast.error('Failed to load site content');
      } finally {
        if (isActive) {
          setIsLoading(false);
        }
      }
    };

    void loadContent();

    return () => {
      isActive = false;
    };
  }, []);

  const handleSaveAbout = async () => {
    try {
      setIsSavingAbout(true);
      const sanitized = sanitizeAboutContentData(aboutContent);
      const updated = await updateAboutContent(sanitized);
      setAboutContent(updated);
      toast.success('About content updated');
    } catch (error) {
      console.error('Failed to update about content', error);
      toast.error('Failed to update about content');
    } finally {
      setIsSavingAbout(false);
    }
  };

  const handleSaveContact = async () => {
    try {
      setIsSavingContact(true);
      const updated = await updateContactContent(contactContent);
      setContactContent(updated);
      toast.success('Contact content updated');
    } catch (error) {
      console.error('Failed to update contact content', error);
      toast.error('Failed to update contact content');
    } finally {
      setIsSavingContact(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading content...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-8">
          <h1 className="text-4xl mb-2">Site Content</h1>
          <p className="text-muted-foreground">
            Update the public About and Contact information displayed on your site.
          </p>
        </div>

        <Tabs defaultValue="about" className="mt-6 space-y-6">
          <TabsList>
            <TabsTrigger value="about">About Page</TabsTrigger>
            <TabsTrigger value="contact">Contact Page</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Hero Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="about-title">Title</Label>
                  <Input
                    id="about-title"
                    value={aboutContent.heroTitle}
                    onChange={(e) =>
                      setAboutContent((prev) => ({
                        ...prev,
                        heroTitle: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="about-paragraphs">Intro Paragraphs</Label>
                  <Textarea
                    id="about-paragraphs"
                    rows={8}
                    value={paragraphsToText(aboutContent.heroParagraphs)}
                    onChange={(e) =>
                      setAboutContent((prev) => ({
                        ...prev,
                        heroParagraphs: textToParagraphs(e.target.value),
                      }))
                    }
                    placeholder="Add multiple paragraphs separated by blank lines"
                  />
                </div>
                <div>
                  <Label>Hero Image</Label>
                  <FileUpload
                    value={aboutContent.heroImage}
                    onChange={(value) =>
                      setAboutContent((prev) => ({
                        ...prev,
                        heroImage: value,
                      }))
                    }
                    placeholder="Enter image URL or upload an image"
                    showPreview
                    entityType="site"
                    entityId="about-hero"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Skills & Expertise</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutContent.skills.map((group, index) => (
                  <div key={`skill-${index}`} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`skill-title-${index}`}>Section Title</Label>
                          <Input
                            id={`skill-title-${index}`}
                            value={group.title}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAboutContent((prev) => {
                                const nextSkills = [...prev.skills];
                                nextSkills[index] = { ...nextSkills[index], title: value };
                                return { ...prev, skills: nextSkills };
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`skill-items-${index}`}>Items (one per line)</Label>
                          <Textarea
                            id={`skill-items-${index}`}
                            rows={4}
                            value={listToText(group.items)}
                            onChange={(e) => {
                              const items = textToList(e.target.value);
                              setAboutContent((prev) => {
                                const nextSkills = [...prev.skills];
                                nextSkills[index] = { ...nextSkills[index], items };
                                return { ...prev, skills: nextSkills };
                              });
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-2"
                        onClick={() =>
                          setAboutContent((prev) => ({
                            ...prev,
                            skills: prev.skills.filter((_, i) => i !== index),
                          }))
                        }
                        disabled={aboutContent.skills.length === 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  scrollToTopOnClick={false}
                  onClick={() =>
                    setAboutContent((prev) => ({
                      ...prev,
                      skills: [
                        ...prev.skills,
                        {
                          title: 'New Skill Group',
                          items: [],
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={16} className="mr-2" />
                  Add Skill Group
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Hobbies & Interests</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutContent.tools.map((group, index) => (
                  <div key={`tool-${index}`} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`interest-title-${index}`}>Section Title</Label>
                          <Input
                            id={`interest-title-${index}`}
                            value={group.title}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAboutContent((prev) => {
                                const nextTools = [...prev.tools];
                                nextTools[index] = { ...nextTools[index], title: value };
                                return { ...prev, tools: nextTools };
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`interest-items-${index}`}>Items (one per line)</Label>
                          <Textarea
                            id={`interest-items-${index}`}
                            rows={4}
                            value={listToText(group.items)}
                            onChange={(e) => {
                              const items = textToList(e.target.value);
                              setAboutContent((prev) => {
                                const nextTools = [...prev.tools];
                                nextTools[index] = { ...nextTools[index], items };
                                return { ...prev, tools: nextTools };
                              });
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-2"
                        onClick={() =>
                          setAboutContent((prev) => ({
                            ...prev,
                            tools: prev.tools.filter((_, i) => i !== index),
                          }))
                        }
                        disabled={aboutContent.tools.length === 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  scrollToTopOnClick={false}
                  onClick={() =>
                    setAboutContent((prev) => ({
                      ...prev,
                      tools: [
                        ...prev.tools,
                        {
                          title: 'New Interest Group',
                          items: [],
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={16} className="mr-2" />
                  Add Interest Group
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Education & Certifications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutContent.education.map((entry, index) => (
                  <div key={`education-${index}`} className="rounded-lg border border-border p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`education-title-${index}`}>Title</Label>
                          <Input
                            id={`education-title-${index}`}
                            value={entry.title}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAboutContent((prev) => {
                                const nextEducation = [...prev.education];
                                nextEducation[index] = { ...nextEducation[index], title: value };
                                return { ...prev, education: nextEducation };
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`education-subtitle-${index}`}>Subtitle</Label>
                          <Input
                            id={`education-subtitle-${index}`}
                            value={entry.subtitle}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAboutContent((prev) => {
                                const nextEducation = [...prev.education];
                                nextEducation[index] = { ...nextEducation[index], subtitle: value };
                                return { ...prev, education: nextEducation };
                              });
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-2"
                        onClick={() =>
                          setAboutContent((prev) => ({
                            ...prev,
                            education: prev.education.filter((_, i) => i !== index),
                          }))
                        }
                        disabled={aboutContent.education.length === 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  scrollToTopOnClick={false}
                  onClick={() =>
                    setAboutContent((prev) => ({
                      ...prev,
                      education: [
                        ...prev.education,
                        {
                          title: 'New Entry',
                          subtitle: '',
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={16} className="mr-2" />
                  Add Education Entry
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Work Experience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutContent.workExperience.map((entry, index) => (
                  <div key={`work-${index}`} className="rounded-lg border border-border p-4">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`experience-title-${index}`}>Title</Label>
                          <Input
                            id={`experience-title-${index}`}
                            value={entry.title}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAboutContent((prev) => {
                                const nextExperience = [...prev.workExperience];
                                nextExperience[index] = { ...nextExperience[index], title: value };
                                return { ...prev, workExperience: nextExperience };
                              });
                            }}
                          />
                        </div>
                        <div>
                          <Label htmlFor={`experience-subtitle-${index}`}>Subtitle</Label>
                          <Input
                            id={`experience-subtitle-${index}`}
                            value={entry.subtitle}
                            onChange={(e) => {
                              const value = e.target.value;
                              setAboutContent((prev) => {
                                const nextExperience = [...prev.workExperience];
                                nextExperience[index] = { ...nextExperience[index], subtitle: value };
                                return { ...prev, workExperience: nextExperience };
                              });
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-2"
                        onClick={() =>
                          setAboutContent((prev) => ({
                            ...prev,
                            workExperience: prev.workExperience.filter((_, i) => i !== index),
                          }))
                        }
                        disabled={aboutContent.workExperience.length === 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  scrollToTopOnClick={false}
                  onClick={() =>
                    setAboutContent((prev) => ({
                      ...prev,
                      workExperience: [
                        ...prev.workExperience,
                        {
                          title: 'New Role',
                          subtitle: '',
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={16} className="mr-2" />
                  Add Experience Entry
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Selected Publications</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {aboutContent.publications.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No publications added yet.</p>
                ) : (
                  aboutContent.publications.map((entry, index) => (
                    <div key={`publication-${index}`} className="rounded-lg border border-border p-4">
                      <div className="flex items-start gap-4">
                        <div className="flex-1 space-y-3">
                          <div>
                            <Label htmlFor={`publication-title-${index}`}>Title</Label>
                            <Input
                              id={`publication-title-${index}`}
                              value={entry.title}
                              onChange={(e) => {
                                const value = e.target.value;
                                setAboutContent((prev) => {
                                  const nextPublications = [...prev.publications];
                                  nextPublications[index] = { ...nextPublications[index], title: value };
                                  return { ...prev, publications: nextPublications };
                                });
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`publication-subtitle-${index}`}>Details</Label>
                            <Input
                              id={`publication-subtitle-${index}`}
                              value={entry.subtitle}
                              onChange={(e) => {
                                const value = e.target.value;
                                setAboutContent((prev) => {
                                  const nextPublications = [...prev.publications];
                                  nextPublications[index] = { ...nextPublications[index], subtitle: value };
                                  return { ...prev, publications: nextPublications };
                                });
                              }}
                            />
                          </div>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="mt-2"
                          onClick={() =>
                            setAboutContent((prev) => ({
                              ...prev,
                              publications: prev.publications.filter((_, i) => i !== index),
                            }))
                          }
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
                <Button
                  type="button"
                  variant="outline"
                  scrollToTopOnClick={false}
                  onClick={() =>
                    setAboutContent((prev) => ({
                      ...prev,
                      publications: [
                        ...prev.publications,
                        {
                          title: 'New Publication',
                          subtitle: '',
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={16} className="mr-2" />
                  Add Publication
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveAbout} disabled={isSavingAbout}>
                {isSavingAbout ? 'Saving...' : 'Save About Page'}
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Intro Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contact-title">Title</Label>
                  <Input
                    id="contact-title"
                    value={contactContent.title}
                    onChange={(e) =>
                      setContactContent((prev) => ({
                        ...prev,
                        title: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="contact-subtitle">Subtitle</Label>
                  <Textarea
                    id="contact-subtitle"
                    rows={3}
                    value={contactContent.subtitle}
                    onChange={(e) =>
                      setContactContent((prev) => ({
                        ...prev,
                        subtitle: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Connection Section</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="contact-heading">Heading</Label>
                  <Input
                    id="contact-heading"
                    value={contactContent.connectHeading}
                    onChange={(e) =>
                      setContactContent((prev) => ({
                        ...prev,
                        connectHeading: e.target.value,
                      }))
                    }
                  />
                </div>
                <div>
                  <Label htmlFor="contact-description">Description</Label>
                  <Textarea
                    id="contact-description"
                    rows={4}
                    value={contactContent.connectDescription}
                    onChange={(e) =>
                      setContactContent((prev) => ({
                        ...prev,
                        connectDescription: e.target.value,
                      }))
                    }
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Contact Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-email-label">Email Label</Label>
                    <Input
                      id="contact-email-label"
                      value={contactContent.email.label}
                      onChange={(e) =>
                        setContactContent((prev) => ({
                          ...prev,
                          email: {
                            ...prev.email,
                            label: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-email-address">Email Address</Label>
                    <Input
                      id="contact-email-address"
                      value={contactContent.email.address}
                      onChange={(e) =>
                        setContactContent((prev) => ({
                          ...prev,
                          email: {
                            ...prev.email,
                            address: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact-phone-label">Phone Label</Label>
                    <Input
                      id="contact-phone-label"
                      value={contactContent.phone.label}
                      onChange={(e) =>
                        setContactContent((prev) => ({
                          ...prev,
                          phone: {
                            ...prev.phone,
                            label: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact-phone-number">Phone Number</Label>
                    <Input
                      id="contact-phone-number"
                      value={contactContent.phone.number}
                      onChange={(e) =>
                        setContactContent((prev) => ({
                          ...prev,
                          phone: {
                            ...prev.phone,
                            number: e.target.value,
                          },
                        }))
                      }
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Social Links</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {contactContent.socials.map((social, index) => (
                  <div key={`social-${index}`} className="rounded-lg border border-border p-4 space-y-3">
                    <div className="flex items-start gap-4">
                      <div className="flex-1 space-y-3">
                        <div>
                          <Label htmlFor={`social-type-${index}`}>Type</Label>
                          <Input
                            id={`social-type-${index}`}
                            value={social.type}
                            onChange={(e) => {
                              const value = e.target.value;
                              setContactContent((prev) => {
                                const nextSocials = [...prev.socials];
                                nextSocials[index] = { ...nextSocials[index], type: value };
                                return { ...prev, socials: nextSocials };
                              });
                            }}
                            placeholder="e.g., linkedin"
                          />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor={`social-label-${index}`}>Label</Label>
                            <Input
                              id={`social-label-${index}`}
                              value={social.label}
                              onChange={(e) => {
                                const value = e.target.value;
                                setContactContent((prev) => {
                                  const nextSocials = [...prev.socials];
                                  nextSocials[index] = { ...nextSocials[index], label: value };
                                  return { ...prev, socials: nextSocials };
                                });
                              }}
                            />
                          </div>
                          <div>
                            <Label htmlFor={`social-url-${index}`}>URL</Label>
                            <Input
                              id={`social-url-${index}`}
                              value={social.url}
                              onChange={(e) => {
                                const value = e.target.value;
                                setContactContent((prev) => {
                                  const nextSocials = [...prev.socials];
                                  nextSocials[index] = { ...nextSocials[index], url: value };
                                  return { ...prev, socials: nextSocials };
                                });
                              }}
                            />
                          </div>
                        </div>
                        <div>
                          <Label htmlFor={`social-description-${index}`}>Description</Label>
                          <Input
                            id={`social-description-${index}`}
                            value={social.description}
                            onChange={(e) => {
                              const value = e.target.value;
                              setContactContent((prev) => {
                                const nextSocials = [...prev.socials];
                                nextSocials[index] = { ...nextSocials[index], description: value };
                                return { ...prev, socials: nextSocials };
                              });
                            }}
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="mt-2"
                        onClick={() =>
                          setContactContent((prev) => ({
                            ...prev,
                            socials: prev.socials.filter((_, i) => i !== index),
                          }))
                        }
                        disabled={contactContent.socials.length === 1}
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  scrollToTopOnClick={false}
                  onClick={() =>
                    setContactContent((prev) => ({
                      ...prev,
                      socials: [
                        ...prev.socials,
                        {
                          type: 'link',
                          label: 'New Link',
                          url: '',
                          description: '',
                        },
                      ],
                    }))
                  }
                >
                  <Plus size={16} className="mr-2" />
                  Add Social Link
                </Button>
              </CardContent>
            </Card>

            <div className="flex justify-end">
              <Button onClick={handleSaveContact} disabled={isSavingContact}>
                {isSavingContact ? 'Saving...' : 'Save Contact Page'}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
