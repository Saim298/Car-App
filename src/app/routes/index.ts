import { Router } from 'express';
// import VehicleRouter from '../modules/Vehicle/vehicle.routes';
import MarketRouter from '../modules/MarketCheck/marketCheck.routes';
import NhtsaRoutes from '../modules/NHTSA/nhtsa.routes';
import PlaidRoutes from '../modules/PlaidWorking/plaid.routes';
import authRoutes from '../modules/Authentication/authRoutes';
import MarketCheckNhtsaIntegrationRoutes from '../modules/MarketCheckNhtsaIntegration/marketCheck.nhtsa.routes';

const router = Router();

// router.use('/vehicle', VehicleRouter);
router.use('/market-routes', MarketRouter);
router.use('/nhtsa-routes', NhtsaRoutes);
router.use('/plaid', PlaidRoutes);
router.use('/market-check-nhtsa', MarketCheckNhtsaIntegrationRoutes);
router.use('/auth', authRoutes);

export default router;
