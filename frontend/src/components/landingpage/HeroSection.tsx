import InfiniteMenu from '../InfiniteMenu';
import '../InfiniteMenu.css';

const items = [
  {
    image: '/instagram_logo.png',
    link: '/integrations',
    title: 'Instagram',
    description: 'Publish directly via Meta Graph API'
  },
  {
    image: '/facebook_logo.png',
    link: '/integrations',
    title: 'Facebook',
    description: 'Auto-post to Pages & Groups'
  },
  {
    image: '/x_logo.png',
    link: '/integrations',
    title: 'X (Twitter)',
    description: 'AI-optimised tweet threads'
  },
  {
    image: '/brandaura_logo.png',
    link: '/docs',
    title: 'Brand Aura',
    description: 'Your tone & style, injected into every post'
  },
  {
    image: '/schedule_logo.png',
    link: '/docs',
    title: 'Auto Schedule',
    description: 'Posts fire at exact time, every time'
  },
  {
    image: '/x_logo.png',
    link: '/docs',
    title: 'AI Posters',
    description: 'Gemini generates on-brand visuals instantly'
  },
  {
    image: '/aws_logo.png',
    link: '/docs',
    title: 'Batch Pipeline',
    description: 'Generate 10 posts from one prompt'
  },
  {
    image: '/multimodal_logo.png',
    link: '/docs',
    title: 'Multimodal AI',
    description: 'Upload PDFs & images for brand analysis'
  }
];

const HeroSection = () => {

  return (
    <div style={{ height: '100vh', position: 'relative' }}>
      <InfiniteMenu items={items} scale={1} />
    </div>
  );
};

export default HeroSection;