import { Request, Response } from 'express';
import {
  generateAccessToken,
  fetchActiveListings,
  // fetchVehicleHistory,
  // fetchVinDecode,
  fetchDealerSearch,
  fetchListingExtraDetails,
  fetchAllListingMedia,
  fetchFullListingDetails,
  fetchActiveFSBOListings,
  fetchAuctionListingExtraDetails,
  fetchAuctionListingMedia,
  fetchFullAuctionListingDetails,
  fetchActiveAuctionListings,
  // fetchMarketDaysSupply,
  // fetchCarStatistics,
  fetchActiveCarListings,
  fetchCarDealershipInfo,
  // fetchCarSalesStats,
  // fetchCarPricePrediction,
  fetchCarDealerships,
  fetchVinSpecs,
  fetchRecentCarListings,
  fetchOemIncentives,
  fetchAamvaReport,
  fetchCarListingExtras,
} from './marketCheck.services';

// **Generate Access Token**
export async function getAccessToken(req: Request, res: Response) {
  try {
    console.log('Generating access token');

    const token = await generateAccessToken();
    console.log(token?.toString() || '');

    res.status(200).json({ access_token: token });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Active Listings**
export async function handleActiveListings(req: Request, res: Response) {
  try {
    const { vin, user_id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchActiveListings(
      token?.toString() || '',
      vin,
      user_id
    );

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Vehicle History**
// export async function handleVehicleHistory(req: Request, res: Response) {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     const { vin } = req.params;
//     const data = await fetchVehicleHistory(vin, token?.toString() || '');
//     res.status(200).json(data);
//   } catch (error) {
//     res.status(500).json({
//       error: error instanceof Error ? error.message : 'Internal Server Error',
//     });
//   }
// }

// **Dealer Search**
export async function handleDealerSearch(req: Request, res: Response) {
  try {
    const { user_id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchDealerSearch(token?.toString() || '', user_id);
    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Listing Extra Details**
// GET	/v2/listing/car/fsbo/{id}/extra
// Get available options, features and seller comment of private party listing
export async function handleGetListingExtraDetails(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchListingExtraDetails(token?.toString() || '', id);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}


// **Get All Listing Media**
// GET	/v2/listing/car/fsbo/{id}/media
// Get available photos, videos for a private party listing
export async function handleGetAllListingMedia(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchAllListingMedia(token?.toString() || '', id);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Full Listing Details**
// GET	/v2/listing/car/fsbo/{id}
// Get all available data about a private party listing returned by
export async function handleGetFullListingDetails(req: Request, res: Response) {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchFullListingDetails(token?.toString() || '', id);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Active FSBO Listings**
// GET	/v2/search/car/fsbo/active
// Lookup private party cars for sale in US
export async function handleGetActiveFSBOListings(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchActiveFSBOListings(token?.toString() || '');

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Auction Listing Extra Details**
// GET	/v2/listing/car/auction/{id}/extra
// Get available options, features and seller comment of an auction listing
export async function handleGetAuctionListingExtraDetails(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchAuctionListingExtraDetails(
      token?.toString() || '',
      id
    );

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Auction Listing Media**
// GET	/v2/listing/car/auction/{id}/media
// Get available photos, videos for an auction listing
export async function handleGetAuctionListingMedia(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchAuctionListingMedia(token?.toString() || '', id);

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Full Auction Listing Details**
// GET	/v2/listing/car/auction/{id}
// Get all available data about an auction listing
export async function handleGetFullAuctionListingDetails(
  req: Request,
  res: Response
) {
  try {
    const { id } = req.params;
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchFullAuctionListingDetails(
      token?.toString() || '',
      id
    );

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Active Auction Listings**
// GET	/v2/search/car/auction/active
// Lookup auction listings for sale in US
export async function handleGetActiveAuctionListings(
  req: Request,
  res: Response
) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchActiveAuctionListings(token?.toString() || '');

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Market Days Supply (MDS) Value**
// GET	/v2/mds/car
// Get Market Days Supply value for a car
// export async function handleGetMarketDaysSupply(req: Request, res: Response) {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     const data = await fetchMarketDaysSupply(token?.toString() || '');

//     res.status(200).json(data);
//   } catch (error) {
//     res.status(500).json({
//       error: error instanceof Error ? error.message : 'Internal Server Error',
//     });
//   }
// }

// **Get Car Statistics**
// GET	/v2/stats/car
// Get car statistics
// export async function handleGetCarStatistics(req: Request, res: Response) {
//   try {
//     const token = req.headers.authorization?.split(' ')[1];
//     const data = await fetchCarStatistics(token?.toString() || '');

//     res.status(200).json(data);
//   } catch (error) {
//     res.status(500).json({
//       error: error instanceof Error ? error.message : 'Internal Server Error',
//     });
//   }
// }

// **Get Active Car Listings**
// GET	/v2/search/car/active
// Lookup New / Used / Certified cars for sale in US
export async function handleGetActiveCarListings(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchActiveCarListings(
      token?.toString() || '',
      req.query
    );

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Car Dealership Info**
// GET	/v2/dealerships/car
// Get available car dealership info
export async function handleGetCarDealershipInfo(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const data = await fetchCarDealershipInfo(
      token?.toString() || '',
      req.query
    );

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Decode VIN Specs**
export async function handleDecodeVinSpecs(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    const { vin } = req.params;

    const data = await fetchVinSpecs(vin, token?.toString() || '');

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}

// **Get Available Car Dealership Info**
export async function handleGetCarDealerships(req: Request, res: Response) {
  try {
    const token = req.headers.authorization?.split(' ')[1];

    const data = await fetchCarDealerships(token || '');

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Internal Server Error',
    });
  }
}



// New v2 APIs
// **Get Listing Extra Details**
// GET	/v2/search/car/recents
// Lookup New / Used dealer cars for sale in US & Canada from last 90 days by various search criteria.

export const getRecentCarListings = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from headers
  const searchCriteria = req.query; // Extract search criteria from query parameters

  if (!token) {
    return;
  }

  try {
    const recentListings = await fetchRecentCarListings(token, searchCriteria);
    res.status(200).json(recentListings);
  } catch (error: any) {
    if (error.message.includes('Request validation failed')) {
      res.status(400).json({
        error: 'Bad Request',
        details: error.message,
      });
    } else {
      res.status(500).json({
        error: 'Failed to fetch recent car listings',
        details: error.message,
      });
    }
  }
};

// 2. OEM Incentive Search
// Endpoint: /v2/search/car/incentive/{oem}/{zip}
export const getOemIncentives = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from headers
  const { oem, zip } = req.params; // Extract OEM and ZIP from route parameters

  if (!token) {
    return;
  }

  if (!oem || !zip) {
    return;
  }

  try {
    const incentives = await fetchOemIncentives(token, oem, zip);
    res.status(200).json(incentives);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch OEM incentives',
      details: error.message,
    });
  }
};

// 3. VINData AAMVA Report
// Endpoint: /v2/vindata/generate-report/aamva/{vin}
export const getAamvaReport = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from headers
  const { vin } = req.params; // Extract VIN from route parameters

  if (!token) {
    return;
  }

  if (!vin) {
    return;
  }

  try {
    const aamvaReport = await fetchAamvaReport(token, vin);
    res.status(200).json(aamvaReport);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch AAMVA report',
      details: error.message,
    });
  }
};

// 6. Car Listing Extras
// Endpoint: /v2/listing/car/{id}/extra
export const getCarListingExtras = async (req: Request, res: Response) => {
  const token = req.headers.authorization?.split(' ')[1]; // Extract token from headers
  const { id } = req.params; // Extract listing ID from route parameters

  if (!token) {
    return 
  }

  if (!id) {
    return 
  }

  try {
    const listingExtras = await fetchCarListingExtras(token, id);
    res.status(200).json(listingExtras);
  } catch (error: any) {
    res.status(500).json({
      error: 'Failed to fetch car listing extras',
      details: error.message,
    });
  }
};
