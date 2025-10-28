import type { AboutContent, ContactContent } from '../lib/content';

export const DEFAULT_ABOUT_CONTENT: AboutContent = {
  heroTitle: 'About Me',
  heroParagraphs: [
    "I'm a passionate industrial designer and UX researcher with over 8 years of experience creating products that balance aesthetics, functionality, and user needs.",
    'My work spans from physical product design to digital experiences, always with a focus on human-centered design principles. I believe that great design emerges from deep understanding of user needs, thoughtful iteration, and attention to detail.',
    'With a background in both industrial design and user experience research, I bring a unique perspective that bridges the physical and digital worlds. I’m particularly interested in sustainable design, accessibility, and creating products that make a positive impact on people’s lives.',
  ],
  heroImage:
    'https://images.unsplash.com/photo-1609921212029-bb5a28e60960?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZGVzaWduJTIwd29ya3NwYWNlfGVufDF8fHx8MTc2MDY2Nzk4Mnww&ixlib=rb-4.1.0&q=80&w=1080',
  skills: [
    {
      title: 'Industrial Design',
      items: [
        'Product Design & Development',
        '3D Modeling & Rendering',
        'Prototyping & Manufacturing',
        'Material Selection',
      ],
    },
    {
      title: 'UX Research',
      items: [
        'User Interviews & Testing',
        'Journey Mapping',
        'Persona Development',
        'Usability Analysis',
      ],
    },
  ],
  tools: [
    {
      title: 'Creative Pursuits',
      items: [
        'Travel sketching & watercolor journaling',
        'Street and landscape photography',
        'Hands-on prototyping with reclaimed materials',
      ],
    },
    {
      title: 'Wellbeing & Community',
      items: [
        'Weekend trail running and rock climbing',
        'Hosting design critique meetups',
        'Volunteering at local makerspaces',
      ],
    },
  ],
  workExperience: [
    {
      title: 'Lead Industrial Designer',
      subtitle: 'Studio Form - 2019 to Present',
    },
    {
      title: 'UX Research Fellow',
      subtitle: 'Human-Centered Design Lab - 2016 to 2019',
    },
    {
      title: 'Product Design Intern',
      subtitle: 'BrightWorks Innovation - Summer 2015',
    },
  ],
  education: [
    {
      title: 'Master of Industrial Design',
      subtitle: 'Design University, 2018',
    },
    {
      title: 'UX Research Certification',
      subtitle: 'Nielsen Norman Group, 2020',
    },
    {
      title: 'Sustainable Design Certificate',
      subtitle: 'IDSA, 2021',
    },
  ],
};

export const DEFAULT_CONTACT_CONTENT: ContactContent = {
  title: 'Get in Touch',
  subtitle: "Have a project in mind or want to collaborate? I'd love to hear from you.",
  connectHeading: "Let's Connect",
  connectDescription:
    "I'm always open to discussing new projects, creative ideas, or opportunities to be part of your visions. Feel free to reach out through any of the channels below.",
  email: {
    label: 'Email',
    address: 'lu_junrong@outlook.com',
  },
  phone: {
    label: 'Phone',
    number: '+852 84969514',
  },
  socials: [
    {
      type: 'linkedin',
      label: 'LinkedIn',
      url: 'https://linkedin.com',
      description: 'Connect with me',
    },
    {
      type: 'github',
      label: 'GitHub',
      url: 'https://github.com',
      description: 'See my code',
    },
    {
      type: 'twitter',
      label: 'Twitter',
      url: 'https://twitter.com',
      description: 'Follow me',
    },
  ],
};
