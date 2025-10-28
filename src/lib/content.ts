import { api } from './api';

export interface ListGroup {
  title: string;
  items: string[];
}

export interface EducationEntry {
  title: string;
  subtitle: string;
}

export interface AboutContent {
  heroTitle: string;
  heroParagraphs: string[];
  heroImage: string;
  skills: ListGroup[];
  tools: ListGroup[];
  workExperience: EducationEntry[];
  education: EducationEntry[];
}

export interface ContactLink {
  type: string;
  label: string;
  url: string;
  description: string;
}

export interface ContactContent {
  title: string;
  subtitle: string;
  connectHeading: string;
  connectDescription: string;
  email: {
    label: string;
    address: string;
  };
  phone: {
    label: string;
    number: string;
  };
  socials: ContactLink[];
}

export const getAboutContent = async (): Promise<AboutContent> => {
  return api.get<AboutContent>('/content/about');
};

export const updateAboutContent = async (content: AboutContent): Promise<AboutContent> => {
  return api.put<AboutContent>('/content/about', content, { auth: true });
};

export const getContactContent = async (): Promise<ContactContent> => {
  return api.get<ContactContent>('/content/contact');
};

export const updateContactContent = async (content: ContactContent): Promise<ContactContent> => {
  return api.put<ContactContent>('/content/contact', content, { auth: true });
};
