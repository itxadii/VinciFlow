import InfiniteMenu from '../InfiniteMenu';
import '../InfiniteMenu.css';

const items = [
  {
    image: '/instagram_logo.png',
    link: '/integrations',
    title: 'Instagram',
    description: 'Publish via Meta Graph API'
  },
  {
    image: '/facebook_logo.png',
    link: '/integrations',
    title: 'Facebook',
    description: 'Auto-post to Pages & Groups'
  },
  {
    image: '/twitter_logo.png',
    link: '/integrations',
    title: 'X (Twitter)',
    description: 'AI-optimised tweet threads'
  },
  {
    image: '/aws_logo.png',
    link: '/docs',
    title: 'AWS',
    description: 'Step Functions orchestration'
  },
  {
    image: '/gemini_logo.png',
    link: '/docs',
    title: 'Gemini AI',
    description: 'AI-powered poster synthesis'
  },
  {
    image: '/lambda_logo.png',
    link: '/docs',
    title: 'Lambda',
    description: 'Serverless compute engine'
  },
  {
    image: '/dynamo_logo.png',
    link: '/docs',
    title: 'DynamoDB',
    description: 'Brand & content storage'
  },
  {
    image: '/s3_logo.png',
    link: '/docs',
    title: 'Amazon S3',
    description: 'Media asset storage'
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