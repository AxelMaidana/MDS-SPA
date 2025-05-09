import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

interface ServiceCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: number;
  imageUrl: string;
  linkToBook?: boolean;
}

const ServiceCard = ({
  id,
  name,
  description,
  price,
  duration,
  imageUrl,
  linkToBook = true
}: ServiceCardProps) => {
  return (
    <div className="service-card overflow-hidden group">
      <div className="relative h-48 overflow-hidden rounded-t-xl">
        <img
          src={imageUrl}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-secondary-900/70 to-transparent opacity-50"></div>
      </div>
      <div className="p-5 flex-grow flex flex-col">
        <h3 className="text-xl font-semibold mb-1">{name}</h3>
        <div className="flex justify-between mb-3">
          <span className="text-primary-600 font-medium">${price}</span>
          <span className="text-secondary-500">{duration} min</span>
        </div>
        <p className="text-secondary-600 text-sm flex-grow mb-4">{description}</p>
        {linkToBook && (
          <Link
            to={`/book?service=${id}`}
            className="flex items-center text-primary-600 font-medium hover:text-primary-700 transition-colors"
          >
            Book Now
            <ArrowRight size={16} className="ml-1" />
          </Link>
        )}
      </div>
    </div>
  );
};

export default ServiceCard;