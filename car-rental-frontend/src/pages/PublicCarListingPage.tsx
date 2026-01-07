import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import api from '@/services/api';

// Car Interface matching backend schema
interface Car {
  _id: string;
  brand: string;
  model: string;
  year: number;
  specifications: string[];
  totalKilometers: number;
  image?: string;
}

const PublicCarListingPage: React.FC = () => {
  const [cars, setCars] = useState<Car[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAvailableCars = async () => {
      setIsLoading(true);
      try {
        const response = await api.get('/cars');
        setCars(response.data);
      } catch (error) {
        console.error('Error fetching available cars:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAvailableCars();
  }, []);

  return (
    <div className="bg-background min-h-screen">
      <header className="text-center py-10 bg-card border-b">
        <h1 className="text-4xl font-bold">Available Cars</h1>
        <p className="text-muted-foreground mt-2">Browse our selection of cars currently available for rent.</p>
      </header>
      <main className="py-10 px-4">
        {isLoading ? (
          <p className="text-center">Loading cars...</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {cars.map((car) => (
              <Card key={car._id} className="overflow-hidden flex flex-col">
                {car.image ? (
                  <img
                    src={car.image}
                    alt={`${car.brand} ${car.model}`}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-muted flex items-center justify-center">
                    <span className="text-muted-foreground">No Image</span>
                  </div>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{car.brand} {car.model}</CardTitle>
                  <p className="text-sm text-muted-foreground">{car.year}</p>
                </CardHeader>
                <CardContent className="space-y-2 flex-grow">
                  <p><strong>Specifications:</strong> {car.specifications.join(', ')}</p>
                  <p><strong>Total Kilometers:</strong> {car.totalKilometers} km</p>
                </CardContent>

              </Card>
            ))}
            {cars.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground">No available cars found.</p>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicCarListingPage;
