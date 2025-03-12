import express from 'express';
import { vehicleController } from './marketCheck.nhtsa.controller';

const router = express.Router();

router.get('/market-check/:userId', vehicleController.fetchMarketCheckData);

// POST route for transforming vehicle data
router.get('/transform-vehicle-data/:user_id', vehicleController.transformVehicleData_1);
router.get('/vehicle-data/:user_id', vehicleController.getMarketCheckData_vin);
router.post('/transform-vehicle-data', vehicleController.transformVehicleData);
// POST route to get complete vehicle information by VIN
router.get('/complete-vehicle/:vin', vehicleController.getCompleteVehicleByVin);
// POST route to search for vehicles with complete info
router.post(
  '/search-vehicles',
  vehicleController.searchVehiclesWithCompleteInfo
);
// POST route to enrich a vehicle listing with NHTSA data
router.post('/enrich-listing', vehicleController.enrichVehicleListing);
// POST route to verify a purchase
router.post('/verify-purchase', vehicleController.verifyPurchase);

export default router;
