import express from 'express';
import {
  getAccessToken,
  handleActiveListings,
  handleDealerSearch,
  handleGetListingExtraDetails,
  handleGetAllListingMedia,
  handleGetFullListingDetails,
  handleGetActiveFSBOListings,
  handleGetAuctionListingExtraDetails,
  handleGetAuctionListingMedia,
  handleGetFullAuctionListingDetails,
  handleGetActiveAuctionListings,
  handleGetActiveCarListings,
  handleGetCarDealershipInfo,
  // Search
  getRecentCarListings,
  getOemIncentives,
  getAamvaReport,
  getCarListingExtras,
} from './marketCheck.controller';

const router = express.Router();

// **Auth Token**
router.post('/token', getAccessToken);

// **Market Check APIs**
router.get('/search/active-listings/:vin/:user_id', handleActiveListings);
router.get('/search/dealer-search/:user_id', handleDealerSearch);
// New APIs
  
router.get('/search/listing-car-extra/:id', handleGetListingExtraDetails);
router.get('/search/listing-car-media/:id', handleGetAllListingMedia);
router.get('/search/listing-car-fsbo/:id', handleGetFullListingDetails);
router.get('/search/car-fsbo-active', handleGetActiveFSBOListings);
router.get(
  '/search/listing-car-auction/:id',
  handleGetAuctionListingExtraDetails
);
router.get(
  '/search/listing-car-auction-media/:id',
  handleGetAuctionListingMedia
);
router.get(
  '/search/listing-car-auction-listing/:id',
  handleGetFullAuctionListingDetails
);
router.get(
  '/search/listing-car-auction-active',
  handleGetActiveAuctionListings
);

router.get('/search/get-car-active-listings', handleGetActiveCarListings);
router.get('/search/get-car-dealership-info', handleGetCarDealershipInfo);

// New v2 APIs
router.get('/search/active90days', getRecentCarListings);
router.get('/search/car/incentive/:oem/:zip', getOemIncentives);
router.get('/vindata/generate-report/aamva/:vin', getAamvaReport);
router.get('/listing/car/:id/extra', getCarListingExtras);

export default router;
