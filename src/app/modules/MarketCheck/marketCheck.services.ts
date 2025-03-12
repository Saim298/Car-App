import axios from 'axios';
import { config } from '../../config/config';
import { VehicleSearchOptions } from '../../utils/types/search.types';
import { API_URLS } from '../../config/config';
import { ErrorCode, MarketCheckError } from '../../utils/types/errors';
import {
  validators,
  ListingResponse,
  DealerResponse,
  MarketStatsResponse,
} from '../../utils/types/responses';
import { safeLog } from '../../utils/safeLogger';
import db from '../../config/db';
import { v4 as uuidv4 } from 'uuid';

// **Helper Function to Generate Authorization Header**
const getAuthHeaders = async () => {
  const token = await generateAccessToken();
  return { Authorization: `Bearer ${token}` };
};

// **Generate API URL**
const API_BASE = config.market_check_base_url;
const API_BASE_1 = config.market_check_base_url_1;

interface SearchResult {
  type: 'private' | 'dealer' | 'auction';
  success: boolean;
  error?: string;
  [key: string]: any;
}

export async function generateAccessToken(): Promise<string> {
  const response = await axios.post(`${API_BASE}/token`, {
    grant_type: 'client_credentials',
    client_id: config.market_check_api,
    client_secret: config.market_check_secret,
  });
  console.log(response.data);

  if (!response.data.access_token)
    throw new Error('Failed to obtain access token');
  return response.data.access_token;
}

/**
 * @deprecated Use fetchActiveCarListings instead which is more flexible
 * This function will be removed in a future version
 */

export async function fetchActiveListings(
  token: string,
  vin: string,
  user_id: string
) {
  try {
    console.log('Step 1: Fetching active listings...');
    console.log('Token:', token);
    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/search/car/active?vin=${vin}`;
    console.log('Step 2: API URL:', apiUrl);
    const response = await axios.get(apiUrl, { headers });
    console.log(
      'Step 3: Active listings response:',
      response.status,
      response.statusText
    );
    console.log('Step 4: Response Data:', response.data);
    console.log(user_id);

    const data = response.data;

    for (const listing of data.listings) {
      const now = new Date();

      if (listing.dealer) {
        const dealerRecordId = uuidv4();
        const dealerValues = [
          dealerRecordId,
          listing.dealer.id,
          listing.dealer.name,
          listing.dealer.city,
          listing.dealer.state,
          listing.dealer.zip,
          listing.dealer.phone,
          listing.dealer.website,
          null,
          now,
          now,
        ];
        const dealerQuery = `INSERT INTO market_place_dealers (id, dealer_id, name, city, state, zip, phone, website, inventory_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        console.log(
          'Step 5: Inserting into market_place_dealers:',
          dealerValues
        );
        await new Promise((resolve, reject) => {
          db.query(dealerQuery, dealerValues, (err, results) => {
            if (err) {
              console.error('Error inserting into market_place_dealers:', err);
              return reject(err);
            }
            console.log('Step 6: Inserted dealer with id:', dealerRecordId);
            resolve(results);
          });
        });

        const dealerSearchId = uuidv4();
        const dealerSearchValues = [
          dealerSearchId,
          user_id,
          listing.dealer.id,
          listing.dealer.name,
          listing.dealer.city,
          listing.dealer.state,
          listing.dealer.zip,
          listing.dealer.phone,
          listing.dealer.website,
          null,
          now,
          now,
        ];
        const dealerSearchQuery = `INSERT INTO market_place_dealer_search (id, user_id, dealer_id, name, city, state, zip, phone, website, inventory_count, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
        console.log(
          'Step 7: Inserting into market_place_dealer_search:',
          dealerSearchValues
        );
        await new Promise((resolve, reject) => {
          db.query(dealerSearchQuery, dealerSearchValues, (err, results) => {
            if (err) {
              console.error(
                'Error inserting into market_place_dealer_search:',
                err
              );
              return reject(err);
            }
            console.log(
              'Step 8: Inserted dealer search with id:',
              dealerSearchId
            );
            resolve(results);
          });
        });
      }

      const listingId = uuidv4();
      const listingValues = [
        listingId,
        user_id,
        listing.vin,
        listing.price,
        listing.miles,
        listing.inventory_type || null,
        listing.is_certified || false,
        listing.carfax_clean_title || false,
        listing.has_accidents || false,
        listing.source,
        listing.dom || 0,
        listing.seller_type,
        listing.vdp_url,
        now,
        now,
      ];
      const listingQuery = `INSERT INTO market_place_listings (id, user_id, vin, price, miles, inventory_type, is_certified, is_clean_title, has_accidents, source, days_on_market, seller_type, vdp_url, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      console.log(
        'Step 9: Inserting into market_place_listings:',
        listingValues
      );
      await new Promise((resolve, reject) => {
        db.query(listingQuery, listingValues, (err, results) => {
          if (err) {
            console.error('Error inserting into market_place_listings:', err);
            return reject(err);
          }
          console.log('Step 10: Inserted listing with id:', listingId);
          resolve(results);
        });
      });

      if (listing.dealer) {
        const listingDealerId = uuidv4();
        const listingDealerValues = [
          listingDealerId,
          listingId,
          listing.dealer.id,
        ];
        const listingDealerQuery = `INSERT INTO market_place_listing_dealers (id, listing_id, dealer_id) VALUES (?, ?, ?)`;
        console.log(
          'Step 11: Inserting into market_place_listing_dealers:',
          listingDealerValues
        );
        await new Promise((resolve, reject) => {
          db.query(listingDealerQuery, listingDealerValues, (err, results) => {
            if (err) {
              console.error(
                'Error inserting into market_place_listing_dealers:',
                err
              );
              return reject(err);
            }
            console.log(
              'Step 12: Inserted listing dealer with id:',
              listingDealerId
            );
            resolve(results);
          });
        });
      }

      if (listing.media && listing.media.photo_links) {
        for (const photoUrl of listing.media.photo_links) {
          const mediaId = uuidv4();
          const mediaValues = [mediaId, listing.vin, 'photo', photoUrl, now];
          const mediaQuery = `INSERT INTO market_place_vehicle_media (id, vin, media_type, media_url, created_at) VALUES (?, ?, ?, ?, ?)`;
          console.log(
            'Step 13: Inserting photo media into market_check_vehicle_specs:',
            mediaValues
          );
          await new Promise((resolve, reject) => {
            db.query(mediaQuery, mediaValues, (err, results) => {
              if (err) {
                console.error('Error inserting photo media:', err);
                return reject(err);
              }
              console.log('Step 14: Inserted photo media with id:', mediaId);
              resolve(results);
            });
          });
        }
      }

      if (listing.media && listing.media.video_links) {
        for (const videoUrl of listing.media.video_links) {
          const mediaId = uuidv4();
          const mediaValues = [mediaId, listing.vin, 'video', videoUrl, now];
          const mediaQuery = `INSERT INTO market_place_vehicle_media (id, vin, media_type, media_url, created_at) VALUES (?, ?, ?, ?, ?)`;
          console.log(
            'Step 15: Inserting video media into market_check_vehicle_specs:',
            mediaValues
          );
          await new Promise((resolve, reject) => {
            db.query(mediaQuery, mediaValues, (err, results) => {
              if (err) {
                console.error('Error inserting video media:', err);
                return reject(err);
              }
              console.log('Step 16: Inserted video media with id:', mediaId);
              resolve(results);
            });
          });
        }
      }

      const detailsId = uuidv4();
      const detailsValues = [
        detailsId,
        user_id,
        listing.vin,
        listing.build.year,
        listing.build.make,
        listing.build.model,
        listing.build.trim,
        listing.build.body_type,
        listing.build.doors,
        listing.build.engine,
        listing.build.engine_size,
        listing.build.cylinders,
        listing.build.transmission,
        listing.build.drivetrain,
        listing.build.fuel_type,
        listing.build.highway_mpg,
        listing.build.city_mpg,
        listing.exterior_color,
        listing.interior_color,
        now,
        now,
      ];
      const detailsQuery = `INSERT INTO market_check_vehicle_specs (id, user_id, vin, year, make, model, trim, body_style, doors, engine, engine_size, cylinders, transmission, drivetrain, fuel_type, highway_miles, city_miles, exterior_color, interior_color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`;
      console.log('Step 17: Inserting into vehicle_details:', detailsValues);
      await new Promise((resolve, reject) => {
        db.query(detailsQuery, detailsValues, (err, results) => {
          if (err) {
            console.error('Error inserting into vehicle_details:', err);
            return reject(err);
          }
          console.log('Step 18: Inserted vehicle details with id:', detailsId);
          resolve(results);
        });
      });
    }
    console.log('Step 19: All listings processed and inserted.');
    return data;
  } catch (error: any) {
    console.error(
      'Error in fetchActiveListings:',
      error.response?.data || error.message
    );
    throw error;
  }
}

async function queryDatabase(query: string, data: any) {
  return new Promise((resolve, reject) => {
    db.query(query, data, (error, results) => {
      if (error) {
        console.error('Query Error:', error);
        reject(error);
      } else {
        resolve(results);
      }
    });
  });
}

// **Dealer Search**

// **Fetch and Insert Dealers**
export async function fetchDealerSearch(token: string, user_id: string): Promise<any[]> {
  try {
    console.log('Fetching dealer search...');
    console.log('Token:', token);
    console.log('User ID:', user_id);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/dealers/car`;

    const response = await axios.get(apiUrl, { headers });
    console.log(
      'Dealer search response:',
      response.status,
      response.statusText
    );

    const dealers = response.data.dealers;
    if (!dealers || dealers.length === 0) {
      console.log('No dealers found.');
      return [];
    }

    const insertedDealers = [];

    for (const dealer of dealers) {
      const dealerData = {
        id: uuidv4(),
        user_id,
        dealer_id: dealer.id,
        name: dealer.seller_name,
        city: dealer.city,
        state: dealer.state,
        zip: dealer.zip,
        phone: dealer.seller_phone,
        website: dealer.inventory_url,
        inventory_count: dealer.listing_count,
        created_at: new Date(),
        updated_at: new Date(),
      };

      try {
        console.log('Inserting dealer:', dealerData);
        await queryDatabase(
          'INSERT INTO market_place_dealer_search SET ?',
          dealerData
        );
        insertedDealers.push(dealerData);
      } catch (error) {
        console.error('Error inserting dealer:', error);
      }
    }

    console.log('Dealer data inserted successfully.');
    return insertedDealers;
  } catch (error: any) {
    console.error(
      'Error fetching dealer search:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Get Listing Extra Details**
// WBA5M4C57FD184182-685d4115-74f0
// Use this as a test api
// Private Party Listing
// /v2/listing/car/fsbo/{id}/extra
// Get available options, features and seller comment of private party listing
export async function fetchListingExtraDetails(token: string, id: string) {
  try {
    console.log('Fetching listing extra details...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/listing/car/fsbo/${id}/extra`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Listing extra details response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching listing extra details:',
      error.response?.data || error.message
    );
    throw error;
  }
}


// **Get All Listing Media**
// test using this id:WBA5M4C57FD184182-685d4115-74f0
export async function fetchAllListingMedia(token: string, id: string) {
  try {
    console.log('Fetching all listing media...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/listing/car/fsbo/${id}/media`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'All listing media response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching all listing media:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Get Full Listing Details**
export async function fetchFullListingDetails(token: string, id: string) {
  try {
    console.log('Fetching full listing details...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/listing/car/fsbo/${id}`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Full listing details response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching full listing details:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Get Active FSBO Listings**
export async function fetchActiveFSBOListings(token: string) {
  try {
    console.log('Fetching active FSBO listings...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/search/car/fsbo/active`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Active FSBO listings response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching active FSBO listings:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Get Auction Listing Extra Details**
// test using this id:1FTFW1ET6EKE81370-c4a9a887-21c7
export async function fetchAuctionListingExtraDetails(
  token: string,
  id: string
) {
  try {
    console.log('Fetching auction listing extra details...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/listing/car/auction/${id}/extra`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Auction listing extra details response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching auction listing extra details:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Get Auction Listing Media**
export async function fetchAuctionListingMedia(token: string, id: string) {
  try {
    console.log('Fetching auction listing media...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/listing/car/auction/${id}/media`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Auction listing media response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching auction listing media:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Get Full Auction Listing Details**
// test using this id:1FTFW1ET6EKE81370-c4a9a887-21c7
export async function fetchFullAuctionListingDetails(
  token: string,
  id: string
) {
  try {
    console.log('Fetching full auction listing details...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/listing/car/auction/${id}`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Full auction listing details response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching full auction listing details:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Get Active Auction Listings**
export async function fetchActiveAuctionListings(token: string) {
  try {
    console.log('Fetching active auction listings...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/search/car/auction/active`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Active auction listings response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching active auction listings:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Get Active Car Listings**
export async function fetchActiveCarListings(
  token: string,
  params?: {
    dealer_id?: string;
    dealer_website?: string;
    source?: string; // dealer's website
    make?: string;
    model?: string;
    year?: string;
    inventory_type?: string;
    price_range?: string; // e.g. "0-50000"
    miles_range?: string; // e.g. "0-100000"
    rows?: string;
    start?: string;
  }
) {
  try {
    console.log('Fetching active car listings...');
    console.log('Token:', token);
    console.log('Query params:', params);

    const headers = { Authorization: `Bearer ${token}` };
    let apiUrl = `${API_BASE_1}/search/car/active`;

    // Add query parameters if provided
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      apiUrl = `${apiUrl}?${queryString}`;
    }

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });
    safeLog('Response Data', response.data);
    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching active car listings:',
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Fetches a list of all car dealerships
 * @param token MarketCheck API token
 * @returns List of dealerships with basic information
 */
export async function fetchCarDealerships(token: string) {
  try {
    console.log('Fetching car dealerships...');
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/dealerships/car`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Car dealerships response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching car dealerships:',
      error.response?.data || error.message
    );
    throw error;
  }
}

/**
 * Fetches detailed information about a specific dealership
 * @param token MarketCheck API token
 * @param params Query parameters including dealer_type, state, etc.
 * @returns Detailed information about matching dealerships
 */
export async function fetchCarDealershipInfo(
  token: string,
  params?: {
    seller_name?: string;
    inventory_url?: string;
    dealer_type?: string;
    state?: string;
  }
) {
  try {
    console.log('Fetching car dealership info...');
    console.log('Token:', token);
    console.log('Query params:', params);

    const headers = { Authorization: `Bearer ${token}` };
    let apiUrl = `${API_BASE_1}/dealerships/car`;

    // Add query parameters if provided
    if (params) {
      const queryString = new URLSearchParams(params).toString();
      apiUrl = `${apiUrl}?${queryString}`;
    }

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Car dealership info response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching car dealership info:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// **Decode VIN Specs**
// /v2/decode/car/{vin}/specs
// Decode a VIN to its specs
export async function fetchVinSpecs(vin: string, token: string) {
  try {
    console.log('Decoding VIN specs...');
    console.log('VIN:', vin);
    console.log('Token:', token);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/decode/car/${vin}/specs`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log('VIN decode response:', response.status, response.statusText);
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error('Error decoding VIN:', error.response?.data || error.message);
    throw error;
  }
}



// New API v2
// Recent Car info
// /v2/search/car/recents
// 	Lookup New / Used dealer cars for sale in US & Canada from last 90 days by various search criteria.
export async function fetchRecentCarListings(
  token: string,
  searchCriteria: any
) {
  try {
    console.log('Fetching recent car listings...');
    console.log('Token:', token);
    console.log('Search Criteria:', searchCriteria);

    // Validate search criteria
    if (
      !searchCriteria.city &&
      !searchCriteria.state &&
      !searchCriteria.zip &&
      !(
        searchCriteria.latitude &&
        searchCriteria.longitude &&
        searchCriteria.radius
      ) &&
      !searchCriteria.dealer_id &&
      !searchCriteria.source &&
      !searchCriteria.mc_website_id
    ) {
      throw new Error(
        'Request validation failed: Parameter (city or state or zip or (latitude & longitude & radius) or dealer_id or source or mc_website_id) is required'
      );
    }

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/search/car/recents`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, {
      headers,
      params: searchCriteria,
    });

    console.log(
      'Recent car listings response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching recent car listings:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// 2. OEM Incentive Search
// Endpoint: /v2/search/car/incentive/{oem}/{zip}
export async function fetchOemIncentives(
  token: string,
  oem: string,
  zip: string
) {
  try {
    console.log('Fetching OEM incentives...');
    console.log('Token:', token);
    console.log('OEM:', oem);
    console.log('ZIP:', zip);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/search/car/incentive/${oem}/${zip}`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'OEM incentives response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching OEM incentives:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// /v2/vindata/generate-report/aamva/1HGCM82633A123456
// This API endpoint is not accessible within your subscribed package
export async function fetchAamvaReport(token: string, vin: string) {
  try {
    console.log('Fetching AAMVA report...');
    console.log('Token:', token);
    console.log('VIN:', vin);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/vindata/generate-report/aamva/${vin}`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log('AAMVA report response:', response.status, response.statusText);
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching AAMVA report:',
      error.response?.data || error.message
    );
    throw error;
  }
}

// Car Listing Extras
// Endpoint: /v2/listing/car/{id}/extra
export async function fetchCarListingExtras(token: string, id: string) {
  try {
    console.log('Fetching car listing extras...');
    console.log('Token:', token);
    console.log('Listing ID:', id);

    const headers = { Authorization: `Bearer ${token}` };
    const apiUrl = `${API_BASE_1}/listing/car/${id}/extra`;

    console.log('API URL:', apiUrl);

    const response = await axios.get(apiUrl, { headers });

    console.log(
      'Car listing extras response:',
      response.status,
      response.statusText
    );
    safeLog('Response Data', response.data);

    return response.data;
  } catch (error: any) {
    console.error(
      'Error fetching car listing extras:',
      error.response?.data || error.message
    );
    throw error;
  }
}
