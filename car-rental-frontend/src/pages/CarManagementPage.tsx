import React, { useState, useEffect, useMemo } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { MoreHorizontal } from 'lucide-react';
import CarForm from './CarForm';
import CarDetailsModal from './CarDetailsModal';
import AddReportForm from './AddReportForm';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import api from '@/services/api';

// Interfaces... (assuming they are defined as before)
interface Car {
  _id: string;
  brand: string;
  model: string;
  year: number;
  specifications: string[];
  status: 'AVAILABLE' | 'RESERVED' | 'MAINTENANCE';
  totalKilometers: number;
  kilometersSinceLastMaintenance: number;
  lastMaintenanceDate: string;
  image?: string;
  currentLocation?: { latitude: number; longitude: number };
}
interface Report {
  _id: string;
  car: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH';
  createdAt: string;
}
interface ActivityLog {
  _id: string;
  car: string;
  activityType: string;
  description: string;
  timestamp: string;
}

const CarManagementPage: React.FC = () => {
  // All state declarations... (assuming they are defined as before)
  const [cars, setCars] = useState<Car[]>([]);
  const [isFormDialogOpen, setIsFormDialogOpen] = useState(false);
  const [selectedCar, setSelectedCar] = useState<Car | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [carToDeleteId, setCarToDeleteId] = useState<string | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [detailsReports, setDetailsReports] = useState<Report[]>([]);
  const [detailsActivityLogs, setDetailsActivityLogs] = useState<ActivityLog[]>([]);
  const [isAddReportModalOpen, setIsAddReportModalOpen] = useState(false);
  const [carForReportId, setCarForReportId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<Car['status'] | 'ALL'>('ALL');

  // All functions... (assuming they are defined as before)
  const fetchCars = async () => {
    try {
      const response = await api.get('/cars/admin');
      setCars(response.data);
    } catch (error) {
      console.error('Error fetching cars:', error);
    }
  };
  useEffect(() => {
    fetchCars();
  }, []);
  const filteredCars = useMemo(() => {
    let filtered = cars;
    if (filterStatus !== 'ALL') {
      filtered = filtered.filter((car) => car.status === filterStatus);
    }
    if (searchTerm) {
      filtered = filtered.filter(
        (car) =>
          car.brand.toLowerCase().includes(searchTerm.toLowerCase()) ||
          car.model.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }
    return filtered;
  }, [cars, searchTerm, filterStatus]);
  const handleAddCar = async (newCarValues: any) => {
    try {
      await api.post('/cars', {
        ...newCarValues,
        specifications: newCarValues.specifications.split(',').map((s: string) => s.trim()),
      });
      fetchCars();
      setIsFormDialogOpen(false);
    } catch (error) {
      console.error('Error adding car:', error);
    }
  };
  const handleUpdateCar = async (updatedCarValues: any) => {
    if (!selectedCar) return;
    try {
      await api.put(`/cars/${selectedCar._id}`, {
        ...updatedCarValues,
        specifications: updatedCarValues.specifications.split(',').map((s: string) => s.trim()),
      });
      fetchCars();
      setIsFormDialogOpen(false);
      setSelectedCar(null);
    } catch (error) {
      console.error('Error updating car:', error);
    }
  };
  const openDeleteDialog = (id: string) => {
    setCarToDeleteId(id);
    setIsDeleteDialogOpen(true);
  };
  const handleConfirmDelete = async () => {
    if (carToDeleteId) {
      try {
        await api.delete(`/cars/${carToDeleteId}`);
        fetchCars();
        setCarToDeleteId(null);
        setIsDeleteDialogOpen(false);
      } catch (error) {
        console.error('Error deleting car:', error);
      }
    }
  };
  const handleChangeStatus = async (carId: string, newStatus: Car['status']) => {
    try {
      await api.put(`/cars/${carId}/status`, { status: newStatus });
      fetchCars();
    } catch (error) {
      console.error(`Error changing status for car ${carId} to ${newStatus}:`, error);
    }
  };
  const openAddDialog = () => {
    setSelectedCar(null);
    setIsFormDialogOpen(true);
  };
  const openEditDialog = (car: Car) => {
    setSelectedCar(car);
    setIsFormDialogOpen(true);
  };
  const handleSimulateLocationUpdate = async (carId: string) => {
    try {
      await api.put(`/cars/${carId}/simulate-location`);
      const response = await api.get(`/cars/${carId}`);
      setSelectedCar(response.data);
    } catch (error) {
      console.error(`Error simulating location for car ${carId}:`, error);
    }
  };
  const openDetailsModal = async (car: Car) => {
    try {
      const carResponse = await api.get(`/cars/${car._id}`);
      setSelectedCar(carResponse.data);
      const reportsResponse = await api.get(`/cars/${car._id}/reports`);
      setDetailsReports(reportsResponse.data);
      const activityLogsResponse = await api.get(`/cars/${car._id}/activity-logs`);
      setDetailsActivityLogs(activityLogsResponse.data);
      setIsDetailsModalOpen(true);
    } catch (error) {
      console.error(`Error fetching details for car ${car._id}:`, error);
    }
  };
  const openAddReportModal = (carId: string) => {
    setCarForReportId(carId);
    setIsAddReportModalOpen(true);
  };
  const handleAddReportSubmit = async (
    carId: string,
    description: string,
    severity: 'LOW' | 'MEDIUM' | 'HIGH',
  ) => {
    try {
      await api.post(`/cars/${carId}/reports`, { description, severity });
      setIsAddReportModalOpen(false);
      setCarForReportId(null);
      if (selectedCar && selectedCar._id === carId) {
        openDetailsModal(selectedCar);
      }
    } catch (error) {
      console.error(`Error adding report for car ${carId}:`, error);
    }
  };

  return (
    <div className="flex flex-col w-full">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-4">
        <h1 className="text-2xl font-bold">Car Management</h1>
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
          <Input
            placeholder="Search by brand or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full sm:w-auto"
          />
          <Select
            value={filterStatus}
            onValueChange={(value: Car['status'] | 'ALL') => setFilterStatus(value)}
          >
            <SelectTrigger className="w-full sm:w-auto">
              <SelectValue placeholder="Filter by Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="AVAILABLE">Available</SelectItem>
              <SelectItem value="RESERVED">Reserved</SelectItem>
              <SelectItem value="MAINTENANCE">Maintenance</SelectItem>
            </SelectContent>
          </Select>
          <Dialog open={isFormDialogOpen} onOpenChange={setIsFormDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={openAddDialog}>Add New Car</Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>{selectedCar ? 'Edit Car' : 'Add New Car'}</DialogTitle>
                <DialogDescription>
                  {selectedCar ? 'Make changes to car details.' : 'Add a new car to the inventory.'}
                </DialogDescription>
              </DialogHeader>
              <CarForm
                initialValues={
                  selectedCar
                    ? { ...selectedCar, specifications: selectedCar.specifications }
                    : undefined
                }
                onSubmit={selectedCar ? handleUpdateCar : handleAddCar}
                onCancel={() => setIsFormDialogOpen(false)}
                isEditMode={!!selectedCar}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Brand</TableHead>
                <TableHead className="hidden md:table-cell">Model</TableHead>
                <TableHead className="hidden lg:table-cell">Year</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden lg:table-cell">Total KM</TableHead>
                <TableHead className="hidden md:table-cell">KM Since Maint.</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredCars.map((car) => (
                <TableRow key={car._id}>
                  <TableCell className="font-medium">{car.brand}</TableCell>
                  <TableCell className="hidden md:table-cell">{car.model}</TableCell>
                  <TableCell className="hidden lg:table-cell">{car.year}</TableCell>
                  <TableCell>{car.status}</TableCell>
                  <TableCell className="hidden lg:table-cell">{car.totalKilometers}</TableCell>
                  <TableCell
                    className={`hidden md:table-cell ${
                      car.kilometersSinceLastMaintenance > 10000 ? 'text-red-500 font-bold' : ''
                    }`}
                  >
                    {car.kilometersSinceLastMaintenance}
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => openEditDialog(car)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-red-500" onClick={() => openDeleteDialog(car._id)}>
                          Delete
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openDetailsModal(car)}>
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuSub>
                          <DropdownMenuSubTrigger>Change Status</DropdownMenuSubTrigger>
                          <DropdownMenuPortal>
                            <DropdownMenuSubContent>
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(car._id, 'AVAILABLE')}
                              >
                                Available
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(car._id, 'RESERVED')}
                              >
                                Reserved
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleChangeStatus(car._id, 'MAINTENANCE')}
                              >
                                Maintenance
                              </DropdownMenuItem>
                            </DropdownMenuSubContent>
                          </DropdownMenuPortal>
                        </DropdownMenuSub>
                        <DropdownMenuItem onClick={() => openAddReportModal(car._id)}>
                          Add Report
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Modals and Dialogs */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>This action cannot be undone.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDelete}>Continue</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <CarDetailsModal
        car={selectedCar}
        reports={detailsReports}
        activityLogs={detailsActivityLogs}
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        onSimulateLocationUpdate={handleSimulateLocationUpdate}
      />
      <Dialog open={isAddReportModalOpen} onOpenChange={setIsAddReportModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              Add Report for {cars.find((c) => c._id === carForReportId)?.brand}{' '}
              {cars.find((c) => c._id === carForReportId)?.model}
            </DialogTitle>
            <DialogDescription>
              Submit a new health or inspection report for this car.
            </DialogDescription>
          </DialogHeader>
          {carForReportId && (
            <AddReportForm
              carId={carForReportId}
              onSubmit={handleAddReportSubmit}
              onCancel={() => setIsAddReportModalOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CarManagementPage;
