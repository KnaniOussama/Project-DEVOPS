import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button'; // Import Button for location update
import Map from '@/components/Map';

// Car Interface matching backend schema
interface Car {
  _id: string; // MongoDB _id
  brand: string;
  model: string;
  year: number;
  specifications: string[]; // Array of strings
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';
  totalKilometers: number;
  kilometersSinceLastMaintenance: number;
  lastMaintenanceDate: string; // ISO string
  image?: string;
  currentLocation?: {
    latitude: number;
    longitude: number;
  };
}

// Report Interface matching backend schema
interface Report {
  _id: string;
  car: string; // Car ID
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string; // ISO string
}

// ActivityLog Interface matching backend schema
interface ActivityLog {
  _id: string;
  car: string; // Car ID
  activityType: string;
  description: string;
  timestamp: string;
}

interface CarDetailsModalProps {
  car: Car | null;
  reports: Report[];
  activityLogs: ActivityLog[];
  isOpen: boolean;
  onClose: () => void;
  onSimulateLocationUpdate: (carId: string) => void; // New prop for location update
}

const CarDetailsModal: React.FC<CarDetailsModalProps> = ({
  car,
  reports,
  activityLogs,
  isOpen,
  onClose,
  onSimulateLocationUpdate,
}) => {
  if (!car) return null;

  const isMaintenanceOverdue = car.kilometersSinceLastMaintenance > 10000;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            Car Details: {car.brand} {car.model}
          </DialogTitle>
          <DialogDescription>Comprehensive information about the selected car.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* General Info */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-semibold">General Information</h3>
            <p>
              <strong>Brand:</strong> {car.brand}
            </p>
            <p>
              <strong>Model:</strong> {car.model}
            </p>
            <p>
              <strong>Year:</strong> {car.year}
            </p>
            <p>
              <strong>Specifications:</strong> {car.specifications.join(', ')}
            </p>
            <p>
              <strong>Status:</strong>{' '}
              <Badge
                variant={
                  car.status === 'AVAILABLE'
                    ? 'default'
                    : car.status === 'RESERVED'
                    ? 'secondary'
                    : 'destructive'
                }
              >
                {car.status}
              </Badge>
            </p>
            {car.image && (
              <div>
                <strong>Image:</strong>
                <img
                  src={car.image}
                  alt={`${car.brand} ${car.model}`}
                  className="mt-2 h-32 w-auto object-cover rounded-md"
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Maintenance & Kilometers */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-semibold">Maintenance & Kilometers</h3>
            <p>
              <strong>Total Kilometers:</strong> {car.totalKilometers} km
            </p>
            <p className={isMaintenanceOverdue ? 'text-red-600 font-bold' : ''}>
              <strong>KM Since Last Maintenance:</strong> {car.kilometersSinceLastMaintenance} km
              {isMaintenanceOverdue && <span className="ml-2">(Maintenance Overdue!)</span>}
            </p>
            <p>
              <strong>Last Maintenance Date:</strong>{' '}
              {new Date(car.lastMaintenanceDate).toLocaleDateString()}
            </p>
          </div>

          <Separator />

          {/* Location Tracking (Simulated) */}
          {car.status === 'RESERVED' && car.currentLocation && (
            <div className="flex flex-col space-y-2">
              <h3 className="text-lg font-semibold">Current Location (Simulated)</h3>
              <p>
                <strong>Latitude:</strong> {car.currentLocation.latitude}
              </p>
              <p>
                <strong>Longitude:</strong> {car.currentLocation.longitude}
              </p>
              <div className=" bg-gray-200 flex items-center justify-center rounded-md">
                <Map  lat={car.currentLocation.latitude} lng={car.currentLocation.longitude} />
              </div>

            </div>
          )}
              <Button onClick={() => onSimulateLocationUpdate(car._id)} className="mt-2">
                Simulate Location Update
              </Button>
          <Separator />

          {/* Reports */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-semibold">Health & Inspection Reports</h3>
            {reports.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1">
                {reports.map((report) => (
                  <li key={report._id}>
                    [{new Date(report.createdAt).toLocaleDateString()}] {report.description} -{' '}
                    <Badge
                      variant={
                        report.severity === 'HIGH'
                          ? 'destructive'
                          : report.severity === 'MEDIUM'
                          ? 'warning'
                          : 'outline'
                      }
                    >
                      {report.severity}
                    </Badge>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No reports found for this car.</p>
            )}
          </div>

          <Separator />

          {/* Activity Logs */}
          <div className="flex flex-col space-y-2">
            <h3 className="text-lg font-semibold">Activity Logs</h3>
            {activityLogs.length > 0 ? (
              <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                {activityLogs.map((log) => (
                  <li key={log._id}>
                    [{new Date(log.timestamp).toLocaleDateString()}{' '}
                    {new Date(log.timestamp).toLocaleTimeString()}] {log.description}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-gray-500">No activity logs found for this car.</p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CarDetailsModal;