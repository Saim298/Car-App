import { Router } from 'express';
import {
  decodeVinController,
  getAllNHTSADataByVinController,
  getAllNHTSADataController,
  getComplaintsByVinController,
  // getComplaintsController,
  getRecallsByVinController,
  // getRecallsController,
  // getSafetyRatingsByMMYController,
  getSafetyRatingsController,
  processVinAndFetchNHTSAData,
} from './nhtsa.controller';

const router = Router();

router.get('/decode/:vin/:user_id', decodeVinController);

router.get('/safety-ratings/:vin/:user_id', getSafetyRatingsController);

// New One
// router.get(
//   '/safety-ratings/:make/:model/:year',
//   getSafetyRatingsByMMYController
// );
router.get('/recalls/:vin/:user_id', getRecallsByVinController);
// New one
// router.get('/recalls/:user_id', getRecallsController);
router.get('/complaints/:vin/:user_id', getComplaintsByVinController);
// New One
// router.get('/complaints', getComplaintsController);

router.get('/nhtsa-data/:vin', getAllNHTSADataByVinController);
// New One
router.get('/nhtsa', getAllNHTSADataController);

router.get('/decode-vin', processVinAndFetchNHTSAData);

export default router;
