interface HeroProps {
  title: string;
  subtitle?: string;
  backgroundImage: string;
  buttonText?: string;
  buttonLink?: string;
  height?: 'full' | 'large' | 'medium' | 'small';
  overlay?: boolean;
}

const Hero = ({
  title,
  subtitle,
  backgroundImage,
  buttonText,
  buttonLink,
  height = 'medium',
  overlay = true
}: HeroProps) => {
  // Height classes
  const heightClasses = {
    full: 'min-h-screen',
    large: 'min-h-[80vh]',
    medium: 'min-h-[60vh]',
    small: 'min-h-[40vh]'
  };

  return (
    <div 
      className={`relative flex items-center justify-center ${heightClasses[height]} bg-cover bg-center px-4`}
      style={{ backgroundImage: `url(${backgroundImage})` }}
    >
      {overlay && (
        <div className="absolute inset-0 bg-secondary-900/50"></div>
      )}
      <div className="relative z-10 text-center max-w-4xl mx-auto">
        <h1 className="fancy-title text-white mb-4 animate-fade-in">{title}</h1>
        {subtitle && (
          <p className="text-white text-xl md:text-2xl font-light mb-8 max-w-2xl mx-auto animate-slide-up">
            {subtitle}
          </p>
        )}
        {buttonText && buttonLink && (
          <a 
            href={buttonLink} 
            className="btn-primary inline-block animate-slide-up animation-delay-300"
          >
            {buttonText}
          </a>
        )}
      </div>
    </div>
  );
};

export default Hero;