import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

interface CarFormValues {
  _id?: string; // Optional for new cars
  brand: string;
  model: string;
  year: number;
  specifications: string[];
  totalKilometers: number;
  kilometersSinceLastMaintenance?: number;
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';
  image?: string;
}

interface CarFormProps {
  initialValues?: CarFormValues;
  onSubmit: (values: CarFormValues) => void;
  onCancel: () => void;
  isEditMode: boolean;
}

const CarForm: React.FC<CarFormProps> = ({ initialValues, onSubmit, onCancel, isEditMode }) => {
  const [formValues, setFormValues] = useState<CarFormValues>({
    brand: '',
    model: '',
    year: new Date().getFullYear(),
    specifications: [],
    totalKilometers: 0,
    status: 'AVAILABLE',
    ...(initialValues || {}), // Merge initial values if provided
    specifications: initialValues?.specifications ? initialValues.specifications.join(', ') : '', // Convert array to string for display
  } as CarFormValues); // Cast to CarFormValues to satisfy TypeScript

  useEffect(() => {
    if (initialValues) {
      setFormValues({
        ...initialValues,
        specifications: initialValues.specifications.join(', '), // Convert array to string for display
      });
    } else {
      setFormValues({ // Reset for new car
        brand: '',
        model: '',
        year: new Date().getFullYear(),
        specifications: [],
        totalKilometers: 0,
        status: 'AVAILABLE',
      });
    }
  }, [initialValues]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormValues((prev) => ({
      ...prev,
      [id]: id === 'year' || id === 'totalKilometers' || id === 'kilometersSinceLastMaintenance'
        ? Number(value)
        : value,
    }));
  };

  const handleSelectChange = (value: string) => {
    setFormValues((prev) => ({
      ...prev,
      status: value as 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE',
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const submitValues = {
      ...formValues,
      specifications: (formValues.specifications as unknown as string) // Treat as string for split
        .split(',')
        .map((s) => s.trim())
        .filter((s) => s.length > 0),
    };
    onSubmit(submitValues);
  };

  return (
    <form onSubmit={handleSubmit} className="grid gap-4 py-4">
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="brand" className="text-right">
          Brand
        </Label>
        <Input id="brand" value={formValues.brand} onChange={handleChange} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="model" className="text-right">
          Model
        </Label>
        <Input id="model" value={formValues.model} onChange={handleChange} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="year" className="text-right">
          Year
        </Label>
        <Input id="year" type="number" value={formValues.year} onChange={handleChange} className="col-span-3" required />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="specifications" className="text-right">
          Specifications (comma-separated)
        </Label>
        <Textarea id="specifications" value={formValues.specifications} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="totalKilometers" className="text-right">
          Total Kilometers
        </Label>
        <Input id="totalKilometers" type="number" value={formValues.totalKilometers} onChange={handleChange} className="col-span-3" required />
      </div>
      {isEditMode && (
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="kilometersSinceLastMaintenance" className="text-right">
            KM Since Last Maint.
          </Label>
          <Input id="kilometersSinceLastMaintenance" type="number" value={formValues.kilometersSinceLastMaintenance} onChange={handleChange} className="col-span-3" />
        </div>
      )}
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="status" className="text-right">
          Status
        </Label>
        <Select value={formValues.status} onValueChange={handleSelectChange}>
          <SelectTrigger className="col-span-3">
            <SelectValue placeholder="Select a status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="AVAILABLE">Available</SelectItem>
            <SelectItem value="RESERVED">Reserved</SelectItem>
            <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-4 items-center gap-4">
        <Label htmlFor="image" className="text-right">
          Image URL
        </Label>
        <Input id="image" value={formValues.image} onChange={handleChange} className="col-span-3" />
      </div>
      <div className="flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {isEditMode ? 'Save Changes' : 'Add Car'}
        </Button>
      </div>
    </form>
  );
};

export default CarForm;