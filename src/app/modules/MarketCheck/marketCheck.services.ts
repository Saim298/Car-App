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

import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../config/superbase';

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
    console.log('User ID:', user_id);

    const data = response.data;

    for (const listing of data.listings) {
      const now = new Date();

      // Handle dealer data
      if (listing.dealer) {
        // Insert into market_place_dealers
        console.log('Step 5: Inserting into market_place_dealers');
        const dealerData = {
          id: uuidv4(),
          dealer_id: listing.dealer.id.toString(),
          name: listing.dealer.name,
          city: listing.dealer.city,
          state: listing.dealer.state,
          zip: listing.dealer.zip,
          phone: listing.dealer.phone,
          website: listing.dealer.website,
          inventory_count: null,
          created_at: now,
          updated_at: now,
          user_id: user_id
        };

        console.log('Dealer data to insert:', dealerData);

        const { data: insertedDealer, error: dealerError } = await supabase
          .from('market_place_dealers')
          .insert([dealerData])
          .select();

        if (dealerError) {
          console.error('Error inserting into market_place_dealers:', dealerError);
          if (dealerError.code === '22P02') {
            console.error('Invalid data type. Please check if the table schema matches the data types being inserted.');
            console.error('Dealer ID type:', typeof listing.dealer.id);
            console.error('Dealer ID value:', listing.dealer.id);
          }
          throw dealerError;
        }
        console.log('Step 6: Successfully inserted dealer');

        // Insert into market_place_dealer_search
        console.log('Step 7: Inserting into market_place_dealer_search');
        const dealerSearchData = {
          id: uuidv4(),
          dealer_id: listing.dealer.id.toString(),
          name: listing.dealer.name,
          city: listing.dealer.city,
          state: listing.dealer.state,
          zip: listing.dealer.zip,
          phone: listing.dealer.phone,
          website: listing.dealer.website,
          inventory_count: null,
          created_at: now,
          updated_at: now,
          user_id: user_id
        };

        console.log('Dealer search data to insert:', dealerSearchData);

        const { data: insertedDealerSearch, error: dealerSearchError } = await supabase
          .from('market_place_dealer_search')
          .insert([dealerSearchData])
          .select();

        if (dealerSearchError) {
          console.error('Error inserting into market_place_dealer_search:', dealerSearchError);
          if (dealerSearchError.code === '22P02') {
            console.error('Invalid data type. Please check if the table schema matches the data types being inserted.');
          }
          throw dealerSearchError;
        }
        console.log('Step 8: Successfully inserted dealer search');
      }

      // Insert into market_place_listings
      console.log('Step 9: Inserting into market_place_listings');
      const listingData = {
        id: uuidv4(),
        user_id: user_id,
        vin: listing.vin,
        price: listing.price,
        miles: listing.miles,
        inventory_type: listing.inventory_type || null,
        is_certified: listing.is_certified || false,
        is_clean_title: listing.carfax_clean_title || false,
        has_accidents: listing.has_accidents || false,
        source: listing.source,
        days_on_market: listing.dom || 0,
        seller_type: listing.seller_type,
        vdp_url: listing.vdp_url,
        created_at: now,
        updated_at: now
      };

      const { data: insertedListing, error: listingError } = await supabase
        .from('market_place_listings')
        .insert([listingData])
        .select();

      if (listingError) {
        console.error('Error inserting into market_place_listings:', listingError);
        throw listingError;
      }
      console.log('Step 10: Successfully inserted listing');

      // Insert into market_place_listing_dealers if dealer exists
      if (listing.dealer && insertedListing) {
        console.log('Step 11: Inserting into market_place_listing_dealers');
        const listingDealerData = {
          id: uuidv4(),
          listing_id: insertedListing[0].id,
          dealer_id: listing.dealer.id.toString(),
          user_id: user_id
        };

        const { error: listingDealerError } = await supabase
          .from('market_place_listing_dealers')
          .insert([listingDealerData]);

        if (listingDealerError) {
          console.error('Error inserting into market_place_listing_dealers:', listingDealerError);
          throw listingDealerError;
        }
        console.log('Step 12: Successfully inserted listing dealer');
      }

      // Handle media data
      if (listing.media) {
        // Handle photo links
        if (listing.media.photo_links) {
          console.log('Step 13: Inserting photo media');
        for (const photoUrl of listing.media.photo_links) {
            const mediaData = {
              id: uuidv4(),
              vin: listing.vin,
              media_type: 'photo',
              media_url: photoUrl,
              created_at: now,
              user_id: user_id
            };

            const { error: photoError } = await supabase
              .from('market_place_vehicle_media')
              .insert([mediaData]);

            if (photoError) {
              console.error('Error inserting photo media:', photoError);
              throw photoError;
            }
          }
          console.log('Step 14: Successfully inserted photo media');
        }

        // Handle video links
        if (listing.media.video_links) {
          console.log('Step 15: Inserting video media');
        for (const videoUrl of listing.media.video_links) {
            const mediaData = {
              id: uuidv4(),
              vin: listing.vin,
              media_type: 'video',
              media_url: videoUrl,
              created_at: now,
              user_id: user_id
            };

            const { error: videoError } = await supabase
              .from('market_place_vehicle_media')
              .insert([mediaData]);

            if (videoError) {
              console.error('Error inserting video media:', videoError);
              throw videoError;
            }
          }
          console.log('Step 16: Successfully inserted video media');
        }
      }

      // Insert into Vehicle table (already migrated to Supabase)
      console.log('Step 17: Inserting vehicle data into Supabase Vehicle table');
      
      // Calculate horsepower and torque if available
      const horsepower = null;
      const torque = null;
      
      // Calculate displacement from engine_size if possible
      
let displacement = null;
if (listing.build.engine_size) {
  console.log('Listing is: ', listing.build.engine_size);
  console.log('Type of listing.build.engine_size is: ', typeof listing.build.engine_size);

  if (typeof listing.build.engine_size === 'string') {
    const match = listing.build.engine_size.match(/(\d+(\.\d+)?)/);
    if (match) {
      displacement = parseFloat(match[1]);
    }
  } else if (typeof listing.build.engine_size === 'number') {
    displacement = listing.build.engine_size;
  }
} else {
  displacement = null;
}
      
      // Prepare vehicle data for Supabase
      const vehicleData = {
        id: uuidv4(),
        vin: listing.vin,
        year: listing.build && listing.build.year ? 
          (typeof listing.build.year === 'string' ? parseInt(listing.build.year) : listing.build.year) : 
          null,
        make: listing.build && listing.build.make ? listing.build.make : null,
        model: listing.build && listing.build.model ? listing.build.model : null,
        trim: listing.build && listing.build.trim ? listing.build.trim : null,
        body_type: listing.build && listing.build.body_type ? listing.build.body_type : null,
        engine_type: listing.build && listing.build.engine ? listing.build.engine : null,
        transmission: listing.build && listing.build.transmission ? listing.build.transmission : null,
        drivetrain: listing.build && listing.build.drivetrain ? listing.build.drivetrain : null,
        fuel_type: listing.build && listing.build.fuel_type ? listing.build.fuel_type : null,
        cylinders: listing.build && listing.build.cylinders ? 
          (typeof listing.build.cylinders === 'string' ? parseInt(listing.build.cylinders) : listing.build.cylinders) : 
          null,
        horsepower: horsepower,
        torque: torque,
        displacement: displacement,
        user_id: user_id
      };
      
      const { data: insertedVehicle, error: vehicleError } = await supabase
        .from('vehicle')
        .insert([vehicleData])
        .select();
      
      if (vehicleError) {
        console.error('Error inserting into Supabase Vehicle table:', vehicleError);
        if (vehicleError.code === '23505') {
          console.log('Duplicate entry detected. Vehicle with this VIN may already exist.');
        } else if (vehicleError.code === '23503') {
          console.error('Foreign key constraint failed. Make sure the user_id exists in the users table.');
        } else if (vehicleError.code === '22P02') {
          console.error('Invalid UUID format for user_id. Make sure it\'s a valid UUID.');
        }
        throw vehicleError;
      }
      
      console.log('Step 18: Successfully inserted vehicle data into Supabase', insertedVehicle);
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
        dealer_id: dealer.id.toString(), // Convert to string to ensure compatibility
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
        console.log('Inserting dealer into Supabase:', dealerData);
        
        // Use Supabase instead of MySQL
        const { data: insertedDealer, error } = await supabase
          .from('market_place_dealer_search')
          .insert([dealerData]);
        
        if (error) {
          console.error('Error inserting dealer into Supabase:', error);
          console.error('Error code:', error.code);
          console.error('Error message:', error.message);
          
          // Check for specific error codes
          if (error.code === '42501') {
            console.error('Permission denied error. Make sure RLS is disabled for the market_place_dealer_search table.');
            console.error('Run this SQL: ALTER TABLE market_place_dealer_search DISABLE ROW LEVEL SECURITY;');
            console.error('Also run: GRANT ALL PRIVILEGES ON TABLE market_place_dealer_search TO anon, authenticated;');
          }
        } else {
          console.log('Dealer inserted successfully into Supabase');
        insertedDealers.push(dealerData);
        }
      } catch (error) {
        console.error('Exception inserting dealer:', error);
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










