/**
 * Data Source Mapping:
 *
 * MarketCheck API:
 * - Basic vehicle info: /decode/car/{vin}/specs
 * - Listing details: /search/car/active
 * - Dealer info: /dealers/car
 * - Media: /listing/car/fsbo/{id}/media
 * - Market data: /search/car/active (with analysis)
 *
 * NHTSA API:
 * - Vehicle specs: /vehicles/DecodeVin/{vin}
 * - Safety ratings: /SafetyRatings/...
 * - Recalls: /Recalls/vehicle/vin/{vin}
 * - Complaints: /Complaints/vehicle/vin/{vin}
 */

import * as marketCheckServices from '../MarketCheck/marketCheck.services';
import * as nhtsaServices from '../NHTSA/nhtsa.services';
import { safeLog } from '../../utils/safeLogger';
import {
  EnrichedVehicleListing,
  NHTSAData,
  UnifiedVehicleData,
} from '../MarketCheck/marketCheck.types';
import { setTimeout } from 'timers/promises';
import { supabase } from '../../config/superbase';

/**
 * Transforms raw vehicle data from MarketCheck and NHTSA into a unified data model
 * with comprehensive derived analytics fields according to VehicleNegotiationInsights
 *
 * @param marketCheckData Raw data from MarketCheck API
 * @param nhtsaData Raw data from NHTSA API
 * @returns Transformed vehicle data with enhanced insights
 */

export const getMarketCheckData = async (userId: string): Promise<any> => {
  console.log('enter');

  try {
    console.log(
      'Step 1: Querying market_check_vehicle_specs for user_id:',
      userId
    );

    // Use Supabase instead of MySQL
    const { data: vehicleSpecs, error: vehicleSpecsError } = await supabase
      .from('vehicle') // Using lowercase 'vehicle' instead of 'Vehicle'
      .select('*')
      .eq('user_id', userId);

    if (vehicleSpecsError) {
      console.error('Step 1 Error: Querying Vehicle table', vehicleSpecsError);
      throw vehicleSpecsError;
    }

    console.log('Step 2: Received Vehicle results:', vehicleSpecs);

    if (!vehicleSpecs || vehicleSpecs.length === 0) {
      console.log('Step 3: No Vehicle records found. Returning null.');
      return null;
    }

    const marketCheckData = vehicleSpecs[0];
    console.log('Step 4: Using first Vehicle record:', marketCheckData);

    // Get listings for this user
    console.log('Step 5: Querying market_place_listings for user_id:', userId);
    const { data: listings, error: listingsError } = await supabase
      .from('market_place_listings')
      .select('*')
      .eq('user_id', userId);

    if (listingsError) {
      console.error(
        'Step 5 Error: Querying market_place_listings',
        listingsError
      );
      throw listingsError;
    }

    console.log('Step 6: Received listings:', listings);
    marketCheckData.listings = listings || [];

    if (!marketCheckData.vin) {
      console.log(
        'Step 7: No VIN found in Vehicle. Resolving with current marketCheckData:',
        marketCheckData
      );
      return marketCheckData;
    }

    // Get listing dealers for this VIN
    console.log(
      'Step 8: Querying market_place_listing_dealers for VIN:',
      marketCheckData.vin
    );

    // First get listing IDs for this VIN
    const { data: listingIds, error: listingIdsError } = await supabase
      .from('market_place_listings')
      .select('id')
      .eq('vin', marketCheckData.vin);

    if (listingIdsError) {
      console.error('Error getting listing IDs:', listingIdsError);
      throw listingIdsError;
    }

    if (!listingIds || listingIds.length === 0) {
      console.log('No listings found for this VIN');
      marketCheckData.listingDealers = [];
    } else {
      const ids = listingIds.map((item) => item.id);

      const { data: listingDealers, error: listingDealersError } =
        await supabase
          .from('market_place_listing_dealers')
          .select('*')
          .in('listing_id', ids);

      if (listingDealersError) {
        console.error(
          'Step 8 Error: Querying market_place_listing_dealers',
          listingDealersError
        );
        throw listingDealersError;
      }

      console.log('Step 9: Received listingDealers:', listingDealers);
      marketCheckData.listingDealers = listingDealers || [];

      // Extract dealer IDs from listingDealers
      const dealerIds = (listingDealers || []).map((ld) => ld.dealer_id);
      console.log('Step 10: Extracted dealer IDs:', dealerIds);

      if (dealerIds.length) {
        console.log(
          'Step 11: Querying market_place_dealers for dealer IDs:',
          dealerIds
        );

        try {
          // Handle non-UUID dealer_ids by using text format
          const { data: dealers, error: dealersError } = await supabase
            .from('market_place_dealers')
            .select('*')
            .or(dealerIds.map((id) => `id.eq.${id}`).join(','));

          if (dealersError) {
            console.error(
              'Step 11 Error: Querying market_place_dealers for dealer IDs',
              dealersError
            );
            throw dealersError;
          }

          console.log('Step 12: Received dealer details:', dealers);

          // Map dealer details to listingDealers
          const dealerMap = new Map();
          (dealers || []).forEach((dealer) => {
            dealerMap.set(dealer.id, dealer);
          });

          // Attach dealer details to listingDealers
          const listingDealersWithDealers = (listingDealers || []).map(
            (ld) => ({
              ...ld,
              dealer: dealerMap.get(ld.dealer_id) || null,
            })
          );

          console.log(
            'Step 14: Listing dealers with dealer details:',
            listingDealersWithDealers
          );

          // Query market_place_vehicle_media for VIN
          console.log(
            'Step 15: Querying market_place_vehicle_media for VIN:',
            marketCheckData.vin
          );

          const { data: mediaResults, error: mediaError } = await supabase
            .from('market_place_vehicle_media')
            .select('*')
            .eq('vin', marketCheckData.vin);

          if (mediaError) {
            console.error(
              'Step 15 Error: Querying market_place_vehicle_media',
              mediaError
            );
            throw mediaError;
          }

          console.log('Step 16: Received media results:', mediaResults);

          // Organize media into photo_links and video_links
          const media = {
            photo_links: (mediaResults || [])
              .filter((m) => m.media_type === 'photo')
              .map((m) => m.media_url),
            video_links: (mediaResults || [])
              .filter((m) => m.media_type === 'video')
              .map((m) => m.media_url),
          };

          // Organize build object
          const build = {
            year: marketCheckData.year,
            make: marketCheckData.make,
            model: marketCheckData.model,
            trim: marketCheckData.trim,
            body_type: marketCheckData.body_type,
            doors: marketCheckData.doors,
            engine: marketCheckData.engine_type,
            engine_size: marketCheckData.displacement,
            cylinders: marketCheckData.cylinders,
            transmission: marketCheckData.transmission,
            drivetrain: marketCheckData.drivetrain,
            fuel_type: marketCheckData.fuel_type,
            highway_mpg: marketCheckData.highway_miles,
            city_mpg: marketCheckData.city_miles,
          };

          // Query NHTSA data
          console.log(
            'Step 19: Querying NHTSA safety rating for user_id:',
            userId
          );

          const { data: safetyRatingResults, error: safetyRatingError } =
            await supabase
              .from('nhtsa_safety_rating')
              .select('*')
              .eq('user_id', userId);

          if (safetyRatingError) {
            console.error(
              'Step 19 Error: Querying nhtsa_safety_rating',
              safetyRatingError
            );
            throw safetyRatingError;
          }

          console.log(
            'Step 20: Received NHTSA safety rating results:',
            safetyRatingResults
          );

          console.log('Step 21: Querying NHTSA recalls for user_id:', userId);

          const { data: recallResults, error: recallsError } = await supabase
            .from('nhtsa_recalls')
            .select('*')
            .eq('user_id', userId);

          if (recallsError) {
            console.error(
              'Step 21 Error: Querying nhtsa_recalls',
              recallsError
            );
            throw recallsError;
          }

          console.log('Step 22: Received NHTSA recall results:', recallResults);

          console.log(
            'Step 23: Querying NHTSA complaints for user_id:',
            userId
          );

          const { data: complaintResults, error: complaintsError } =
            await supabase
              .from('nhtsa_complaints')
              .select('*')
              .eq('user_id', userId);

          if (complaintsError) {
            console.error(
              'Step 23 Error: Querying nhtsa_complaints',
              complaintsError
            );
            throw complaintsError;
          }

          console.log(
            'Step 24: Received NHTSA complaint results:',
            complaintResults
          );

          // Construct NHTSA data object
          const nhtsaData = {
            safety_ratings:
              safetyRatingResults && safetyRatingResults.length > 0
                ? safetyRatingResults[0]
                : null,
            recalls: recallResults || [],
            complaints: complaintResults || [],
          };

          // Construct final response
          const response = {
            marketCheckData: {
              id: marketCheckData.id,
              vin: marketCheckData.vin,
              heading: `${marketCheckData.year} ${marketCheckData.make} ${marketCheckData.model} ${marketCheckData.trim}`,
              price: listings && listings.length > 0 ? listings[0].price : null,
              miles: listings && listings.length > 0 ? listings[0].miles : null,
              exterior_color: marketCheckData.exterior_color,
              interior_color: marketCheckData.interior_color,
              media,
              dealer:
                listingDealersWithDealers.length > 0
                  ? listingDealersWithDealers[0].dealer
                  : null,
              build,
            },
            nhtsaData,
          };

          console.log('Step 27: Final response:', response);
          return response;
        } catch (dealerError) {
          console.error('Error querying dealers:', dealerError);
          console.log('Continuing without dealer information');

          // Continue without dealer information
          const media = {
            photo_links: [],
            video_links: [],
          };

          const build = {
            year: marketCheckData.year,
            make: marketCheckData.make,
            model: marketCheckData.model,
            trim: marketCheckData.trim,
            body_type: marketCheckData.body_type,
            doors: marketCheckData.doors,
            engine: marketCheckData.engine_type,
            engine_size: marketCheckData.displacement,
            cylinders: marketCheckData.cylinders,
            transmission: marketCheckData.transmission,
            drivetrain: marketCheckData.drivetrain,
            fuel_type: marketCheckData.fuel_type,
            highway_mpg: marketCheckData.highway_miles,
            city_mpg: marketCheckData.city_miles,
          };

          // Construct final response without dealer info
          const response = {
            marketCheckData: {
              id: marketCheckData.id,
              vin: marketCheckData.vin,
              heading: `${marketCheckData.year} ${marketCheckData.make} ${marketCheckData.model} ${marketCheckData.trim}`,
              price: listings && listings.length > 0 ? listings[0].price : null,
              miles: listings && listings.length > 0 ? listings[0].miles : null,
              exterior_color: marketCheckData.exterior_color,
              interior_color: marketCheckData.interior_color,
              media,
              dealer: null,
              build,
            },
            nhtsaData: {
              safety_ratings: null,
              recalls: [],
              complaints: [],
            },
          };

          return response;
        }
      } else {
        console.log(
          'Step 11: No dealer IDs found. Skipping dealer details fetch.'
        );
        return marketCheckData;
      }
    }

    return marketCheckData;
  } catch (error) {
    console.error('Error in getMarketCheckData:', error);
    throw error;
  }
};

export const getMarketCheckData_2 = async (
  userId: string,
  vin: string
): Promise<any> => {
  console.log('Enter function');

  try {
    console.log('Step 1: Querying Vehicle for user_id and VIN:', userId, vin);

    // Use Supabase instead of MySQL
    const { data: vehicleSpecs, error: vehicleSpecsError } = await supabase
      .from('vehicle') // Using lowercase 'vehicle' instead of 'Vehicle'
      .select('*')
      .eq('user_id', userId)
      .eq('vin', vin);

    if (vehicleSpecsError) {
      console.error('Step 1 Error: Querying Vehicle', vehicleSpecsError);
      throw vehicleSpecsError;
    }

    console.log('Step 2: Received Vehicle results:', vehicleSpecs);

    if (!vehicleSpecs || vehicleSpecs.length === 0) {
      console.log('Step 3: No Vehicle found for the given user_id and VIN.');
      return null;
    }

    const marketCheckData = vehicleSpecs[0];
    console.log('Step 4: Using Vehicle record:', marketCheckData);

    // Get listings for this user and VIN
    console.log(
      'Step 5: Querying market_place_listings for user_id and VIN:',
      userId,
      vin
    );

    const { data: listings, error: listingsError } = await supabase
      .from('market_place_listings')
      .select('*')
      .eq('user_id', userId)
      .eq('vin', vin);

    if (listingsError) {
      console.error(
        'Step 5 Error: Querying market_place_listings',
        listingsError
      );
      throw listingsError;
    }

    console.log('Step 6: Received listings:', listings);
    marketCheckData.listings = listings || [];

    // Get listing dealers for this VIN
    console.log('Step 7: Querying market_place_listing_dealers for VIN:', vin);

    // First get listing IDs for this VIN
    const { data: listingIds, error: listingIdsError } = await supabase
      .from('market_place_listings')
      .select('id')
      .eq('vin', vin);

    if (listingIdsError) {
      console.error('Error getting listing IDs:', listingIdsError);
      throw listingIdsError;
    }

    if (!listingIds || listingIds.length === 0) {
      console.log('No listings found for this VIN');
      marketCheckData.listingDealers = [];
    } else {
      const ids = listingIds.map((item) => item.id);

      const { data: listingDealers, error: listingDealersError } =
        await supabase
          .from('market_place_listing_dealers')
          .select('*')
          .in('listing_id', ids);

      if (listingDealersError) {
        console.error(
          'Step 7 Error: Querying market_place_listing_dealers',
          listingDealersError
        );
        throw listingDealersError;
      }

      console.log('Step 8: Received listingDealers:', listingDealers);
      marketCheckData.listingDealers = listingDealers || [];

      // Extract dealer IDs from listingDealers
      const dealerIds = (listingDealers || []).map((ld) => ld.dealer_id);
      console.log('Step 9: Extracted dealer IDs:', dealerIds);

      if (dealerIds.length) {
        console.log(
          'Step 10: Querying market_place_dealers for dealer IDs:',
          dealerIds
        );

        try {
          // Handle non-UUID dealer_ids by using text format
          const { data: dealers, error: dealersError } = await supabase
            .from('market_place_dealers')
            .select('*')
            .or(dealerIds.map((id) => `id.eq.${id}`).join(','));

          if (dealersError) {
            console.error(
              'Step 10 Error: Querying market_place_dealers for dealer IDs',
              dealersError
            );
            throw dealersError;
          }

          console.log('Step 11: Received dealer details:', dealers);

          // Map dealer details to listingDealers
          const dealerMap = new Map();
          (dealers || []).forEach((dealer) => {
            dealerMap.set(dealer.id, dealer);
          });

          // Attach dealer details to listingDealers
          const listingDealersWithDealers = (listingDealers || []).map(
            (ld) => ({
              ...ld,
              dealer: dealerMap.get(ld.dealer_id) || null,
            })
          );

          console.log(
            'Step 13: Listing dealers with dealer details:',
            listingDealersWithDealers
          );

          // Query market_place_vehicle_media for VIN
          console.log(
            'Step 14: Querying market_place_vehicle_media for VIN:',
            vin
          );

          const { data: mediaResults, error: mediaError } = await supabase
            .from('market_place_vehicle_media')
            .select('*')
            .eq('vin', vin);

          if (mediaError) {
            console.error(
              'Step 14 Error: Querying market_place_vehicle_media',
              mediaError
            );
            throw mediaError;
          }

          console.log('Step 15: Received media results:', mediaResults);

          // Organize media into photo_links and video_links
          const media = {
            photo_links: (mediaResults || [])
              .filter((m) => m.media_type === 'photo')
              .map((m) => m.media_url),
            video_links: (mediaResults || [])
              .filter((m) => m.media_type === 'video')
              .map((m) => m.media_url),
          };

          // Organize build object
          const build = {
            year: marketCheckData.year,
            make: marketCheckData.make,
            model: marketCheckData.model,
            trim: marketCheckData.trim,
            body_type: marketCheckData.body_type,
            doors: marketCheckData.doors,
            engine: marketCheckData.engine_type,
            engine_size: marketCheckData.displacement,
            cylinders: marketCheckData.cylinders,
            transmission: marketCheckData.transmission,
            drivetrain: marketCheckData.drivetrain,
            fuel_type: marketCheckData.fuel_type,
            highway_mpg: marketCheckData.highway_miles,
            city_mpg: marketCheckData.city_miles,
          };

          // Query NHTSA data
          console.log('Step 18: Querying NHTSA safety rating for vin:', vin);

          const { data: safetyRatingResults, error: safetyRatingError } =
            await supabase
              .from('nhtsa_safety_rating')
              .select('*')
              .eq('vin', vin);

          if (safetyRatingError) {
            console.error(
              'Step 18 Error: Querying nhtsa_safety_rating',
              safetyRatingError
            );
            throw safetyRatingError;
          }

          console.log(
            'Step 19: Received NHTSA safety rating results:',
            safetyRatingResults
          );

          console.log('Step 20: Querying NHTSA recalls for vin:', vin);

          const { data: recallResults, error: recallsError } = await supabase
            .from('nhtsa_recalls')
            .select('*')
            .eq('vin', vin);

          if (recallsError) {
            console.error(
              'Step 20 Error: Querying nhtsa_recalls',
              recallsError
            );
            throw recallsError;
          }

          console.log('Step 21: Received NHTSA recall results:', recallResults);

          console.log('Step 22: Querying NHTSA complaints for vin:', vin);

          const { data: complaintResults, error: complaintsError } =
            await supabase.from('nhtsa_complaints').select('*').eq('vin', vin);

          if (complaintsError) {
            console.error(
              'Step 22 Error: Querying nhtsa_complaints',
              complaintsError
            );
            throw complaintsError;
          }

          console.log(
            'Step 23: Received NHTSA complaint results:',
            complaintResults
          );

          // Construct NHTSA data object
          const nhtsaData = {
            safety_ratings: safetyRatingResults,
            recalls: recallResults || [],
            complaints: complaintResults || [],
          };

          // Construct final response
          const response = {
            marketCheckData: {
              id: marketCheckData.id,
              vin: marketCheckData.vin,
              heading: `${marketCheckData.year} ${marketCheckData.make} ${marketCheckData.model} ${marketCheckData.trim}`,
              price: listings && listings.length > 0 ? listings[0].price : null,
              miles: listings && listings.length > 0 ? listings[0].miles : null,
              exterior_color: marketCheckData.exterior_color,
              interior_color: marketCheckData.interior_color,
              media,
              dealer:
                listingDealersWithDealers.length > 0
                  ? listingDealersWithDealers[0].dealer
                  : null,
              build,
            },
            nhtsaData,
          };

          console.log('Step 26: Final response:', response);
          return response;
        } catch (dealerError) {
          console.error('Error querying dealers:', dealerError);
          console.log('Continuing without dealer information');

          // Continue without dealer information
          const media = {
            photo_links: [],
            video_links: [],
          };

          const build = {
            year: marketCheckData.year,
            make: marketCheckData.make,
            model: marketCheckData.model,
            trim: marketCheckData.trim,
            body_type: marketCheckData.body_type,
            doors: marketCheckData.doors,
            engine: marketCheckData.engine_type,
            engine_size: marketCheckData.displacement,
            cylinders: marketCheckData.cylinders,
            transmission: marketCheckData.transmission,
            drivetrain: marketCheckData.drivetrain,
            fuel_type: marketCheckData.fuel_type,
            highway_mpg: marketCheckData.highway_miles,
            city_mpg: marketCheckData.city_miles,
          };

          // Construct final response without dealer info
          const response = {
            marketCheckData: {
              id: marketCheckData.id,
              vin: marketCheckData.vin,
              heading: `${marketCheckData.year} ${marketCheckData.make} ${marketCheckData.model} ${marketCheckData.trim}`,
              price: listings && listings.length > 0 ? listings[0].price : null,
              miles: listings && listings.length > 0 ? listings[0].miles : null,
              exterior_color: marketCheckData.exterior_color,
              interior_color: marketCheckData.interior_color,
              media,
              dealer: null,
              build,
            },
            nhtsaData: {
              safety_ratings: null,
              recalls: [],
              complaints: [],
            },
          };

          return response;
        }
      } else {
        console.log(
          'Step 10: No dealer IDs found. Skipping dealer details fetch.'
        );
        return marketCheckData;
      }
    }

    return marketCheckData;
  } catch (error) {
    console.error('Error in getMarketCheckData_2:', error);
    throw error;
  }
};

export const getMarketCheckData_1 = async (userId: string): Promise<any> => {
  console.log('eneter');

  try {
    console.log('Step 1: Querying Vehicle for user_id:', userId);

    // Use Supabase instead of MySQL
    const { data: vehicleSpecs, error: vehicleSpecsError } = await supabase
      .from('vehicle') // Using lowercase 'vehicle' instead of 'Vehicle'
      .select('*')
      .eq('user_id', userId);

    if (vehicleSpecsError) {
      console.error('Step 1 Error: Querying Vehicle', vehicleSpecsError);
      throw vehicleSpecsError;
    }

    console.log('Step 2: Received Vehicle results:', vehicleSpecs);

    if (!vehicleSpecs || vehicleSpecs.length === 0) {
      console.log('Step 3: No Vehicle found. Returning null.');
      return null;
    }

    const marketCheckData = vehicleSpecs[0];
    console.log('Step 4: Using first Vehicle record:', marketCheckData);

    // Get listings for this user
    console.log('Step 5: Querying market_place_listings for user_id:', userId);

    const { data: listings, error: listingsError } = await supabase
      .from('market_place_listings')
      .select('*')
      .eq('user_id', userId);

    if (listingsError) {
      console.error(
        'Step 5 Error: Querying market_place_listings',
        listingsError
      );
      throw listingsError;
    }

    console.log('Step 6: Received listings:', listings);
    marketCheckData.listings = listings || [];

    // Get dealers for this user
    console.log('Step 7: Querying market_place_dealers for user_id:', userId);

    const { data: dealerSearchResults, error: dealerSearchError } =
      await supabase
        .from('market_place_dealer_search')
        .select('dealer_id')
        .eq('user_id', userId);

    if (dealerSearchError) {
      console.error(
        'Error querying market_place_dealer_search:',
        dealerSearchError
      );
      throw dealerSearchError;
    }

    if (!dealerSearchResults || dealerSearchResults.length === 0) {
      console.log('No dealer search results found');
      marketCheckData.dealers = [];
    } else {
      const dealerIds = dealerSearchResults.map((item) => item.dealer_id);

      try {
        // Handle non-UUID dealer_ids by using text format
        const { data: dealers, error: dealersError } = await supabase
          .from('market_place_dealers')
          .select('*')
          .or(dealerIds.map((id) => `id.eq.${id}`).join(','));

        if (dealersError) {
          console.error(
            'Step 7 Error: Querying market_place_dealers',
            dealersError
          );
          throw dealersError;
        }

        console.log('Step 8: Received dealers:', dealers);
        marketCheckData.dealers = dealers || [];
      } catch (dealerError) {
        console.error('Error querying dealers:', dealerError);
        console.log('Continuing without dealer information');
        marketCheckData.dealers = [];
      }
    }

    if (!marketCheckData.vin) {
      console.log(
        'Step 9: No VIN found in Vehicle. Resolving with current marketCheckData:',
        marketCheckData
      );
      return marketCheckData;
    }

    // Get listing dealers for this VIN
    console.log(
      'Step 10: Querying market_place_listing_dealers for VIN:',
      marketCheckData.vin
    );

    const { data: listingDealers, error: listingDealersError } = await supabase
      .from('market_place_listing_dealers')
      .select('*')
      .eq('vin', marketCheckData.vin);

    if (listingDealersError) {
      console.error(
        'Step 10 Error: Querying market_place_listing_dealers',
        listingDealersError
      );
      throw listingDealersError;
    }

    console.log('Step 11: Received listingDealers:', listingDealers);
    marketCheckData.listingDealers = listingDealers || [];

    console.log(
      'Step 12: All nested queries complete. Resolving with marketCheckData:',
      marketCheckData
    );
    return marketCheckData;
  } catch (error) {
    console.error('Error in getMarketCheckData_1:', error);
    throw error;
  }
};

// Module-level variable to store the current VIN
let currentVin: string | null = null;

/**
 * Set the current VIN in the context/state.
 * @param vin - The VIN to set.
 */
export const setCurrentVin = (vin: string): void => {
  currentVin = vin;
};

/**
 * Get the current VIN from the context/state.
 * @returns The current VIN or null if not set.
 */
export const getCurrentVin = (): string | null => {
  return currentVin;
};

export const getMarketCheckData_vin = async (userId: string): Promise<any> => {
  console.log('Enter function');

  try {
    console.log('Step 1: Querying Vehicle for user_id:', userId);

    // Use Supabase instead of MySQL
    const { data: vehicleSpecs, error: vehicleSpecsError } = await supabase
      .from('vehicle') // Using lowercase 'vehicle' instead of 'Vehicle'
      .select('vin')
      .eq('user_id', userId);

    if (vehicleSpecsError) {
      console.error('Step 1 Error: Querying Vehicle', vehicleSpecsError);
      throw vehicleSpecsError;
    }

    console.log('Step 2: Received Vehicle results:', vehicleSpecs);

    if (!vehicleSpecs || vehicleSpecs.length === 0) {
      console.log('No VINs found for this user.');
      return [];
    }

    const vinArray = vehicleSpecs.map((row) => row.vin);
    const transformedData: any[] = [];

    for (const vin of vinArray) {
      try {
        // Set the current VIN
        setCurrentVin(vin);

        // Call transformVehicleData_1 (it will use the current VIN)
        const data = await transformVehicleData_1(userId);
        console.log('Data recieve', data);

        transformedData.push(data);
      } catch (error) {
        console.error(`Error transforming data for VIN ${vin}:`, error);
        // If there's an error for a specific VIN, skip it and continue with the next one
        continue;
      }
    }

    return transformedData;
  } catch (error) {
    console.error('Error in getMarketCheckData_vin:', error);
    throw error;
  }
};

// http://localhost:5001/api/market-check-nhtsa/transform-vehicle-data/acbb35cc-eaac-4e61-a749-aa8e3db7c9aa
export async function transformVehicleData_1(
  userId: string
): Promise<UnifiedVehicleData> {
  // Get the current VIN
  const vin = getCurrentVin();
  if (!vin) {
    throw new Error('VIN is not set in the context/state');
  }

  // Fetch market data for the current VIN
  const marketData = await getMarketCheckData_2(userId, vin);
  console.log('Data recieve transform', marketData);

  const marketCheckData = marketData.marketCheckData;
  const nhtsaData = marketData.nhtsaData;
  console.log('Market data for VIN:', vin, marketData);

  // Extract basic identification
  const basics = {
    vin: vin, // Use the VIN from the context/state
    year: marketCheckData.build.year || 0,
    make: marketCheckData.build.make || '',
    model: marketCheckData.build.model || '',
    trim: marketCheckData.build.trim || '',
  };

  // Extract and normalize specifications
  const specifications = {
    body_style:
      marketCheckData.build.body_type ||
      nhtsaData?.specifications?.body_class ||
      '',
    vehicle_type:
      marketCheckData.build.vehicle_type ||
      nhtsaData?.specifications?.vehicle_type ||
      '',
    doors: marketCheckData.build.doors || 0,
    seating_capacity: marketCheckData.build.standard_seating || 0,

    // Engine & powertrain
    engine: {
      type:
        nhtsaData?.specifications?.engine?.type ||
        marketCheckData.build.engine ||
        '',
      size:
        parseFloat(marketCheckData.build.engine_size) ||
        parseFloat(nhtsaData?.specifications?.engine?.size || '0') ||
        0,
      cylinders:
        parseInt(marketCheckData.build.cylinders) ||
        parseInt(nhtsaData?.specifications?.engine?.cylinders || '0') ||
        0,
      fuel_type:
        marketCheckData.build.fuel_type ||
        nhtsaData?.specifications?.engine?.fuel_type ||
        '',
      horsepower: nhtsaData?.specifications?.engine?.horsepower || '',
      torque: nhtsaData?.specifications?.engine?.torque || '',
    },
    transmission: {
      type:
        marketCheckData.build.transmission ||
        nhtsaData?.specifications?.transmission?.type ||
        '',
      speeds:
        parseInt(marketCheckData.transmission_speed) ||
        parseInt(nhtsaData?.specifications?.transmission?.speeds || '0') ||
        0,
    },
    drivetrain:
      marketCheckData.build.drivetrain ||
      nhtsaData?.specifications?.drivetrain ||
      '',

    // Fuel economy
    fuel_economy: {
      city:
        parseInt(marketCheckData.city_miles) ||
        parseInt(nhtsaData?.specifications?.fuel_economy?.city || '0') ||
        0,
      highway:
        parseInt(marketCheckData.highway_miles) ||
        parseInt(nhtsaData?.specifications?.fuel_economy?.highway || '0') ||
        0,
      combined:
        parseInt(nhtsaData?.specifications?.fuel_economy?.combined || '0') || 0,
      fuel_tank_capacity: parseFloat(marketCheckData.fuel_tank_capacity) || 0,
    },

    // Dimensions
    dimensions: {
      wheelbase:
        parseFloat(marketCheckData.wheelbase_length) ||
        parseFloat(nhtsaData?.specifications?.dimensions?.wheelbase || '0') ||
        0,
      length:
        parseFloat(marketCheckData.overall_length) ||
        parseFloat(nhtsaData?.specifications?.dimensions?.length || '0') ||
        0,
      width:
        parseFloat(marketCheckData.overall_width) ||
        parseFloat(nhtsaData?.specifications?.dimensions?.width || '0') ||
        0,
      height:
        parseFloat(marketCheckData.overall_height) ||
        parseFloat(nhtsaData?.specifications?.dimensions?.height || '0') ||
        0,
      curb_weight:
        parseFloat(marketCheckData.curb_weight) ||
        parseFloat(nhtsaData?.specifications?.weight?.curb_weight || '0') ||
        0,
      gross_weight:
        parseFloat(marketCheckData.gross_weight) ||
        parseFloat(nhtsaData?.specifications?.weight?.gvwr || '0') ||
        0,
    },

    // Colors
    colors: {
      exterior: marketCheckData.exterior_color || '',
      interior: marketCheckData.interior_color || '',
    },

    // Manufacturing
    plant: nhtsaData?.specifications?.plant || '',
    manufacturer: nhtsaData?.specifications?.manufacturer || '',
    series: nhtsaData?.specifications?.series || '',
  };

  // Extract safety information
  const safety = {
    ratings: {
      overall: nhtsaData?.safety_ratings?.overall_rating || '',
      front_crash: nhtsaData?.safety_ratings?.overall_front_crash_rating || '',
      side_crash: nhtsaData?.safety_ratings?.overall_side_crash_rating || '',
      rollover: nhtsaData?.safety_ratings?.rollover_rating || '',
      side_pole_crash: nhtsaData?.safety_ratings?.side_pole_crash_rating || '',
    },
    recalls: nhtsaData?.recalls || [],
    complaints: nhtsaData?.complaints || [],
  };

  // Extract listing information if available
  let listing = undefined;
  if (marketCheckData.id || marketCheckData.price) {
    listing = {
      id: marketCheckData.id || '',
      price: parseFloat(marketCheckData.price) || 0,
      miles: parseInt(marketCheckData.miles) || 0,
      days_on_market: parseInt(marketCheckData.dom) || 0,
      seller_type: marketCheckData.seller_type || '',
      inventory_type: marketCheckData.inventory_type || '',
      is_certified: marketCheckData.is_certified || false,
      is_clean_title: marketCheckData.is_clean_title || false,
      has_accidents: marketCheckData.has_accidents || false,
      last_seen_date: marketCheckData.last_seen_at_date || '',
      source: marketCheckData.source || '',
      vdp_url: marketCheckData.vdp_url || '',

      // Dealer information if available
      dealer: marketCheckData.dealer
        ? {
            id: marketCheckData.dealer.id || '',
            name: marketCheckData.dealer.name || '',
            phone: marketCheckData.dealer.phone || '',
            website: marketCheckData.dealer.website || '',
            location: {
              city: marketCheckData.dealer.city || '',
              state: marketCheckData.dealer.state || '',
              zip: marketCheckData.dealer.zip || '',
            },
          }
        : undefined,

      // Media
      media: {
        photos: marketCheckData.media?.photo_links || [],
        videos: marketCheckData.media?.video_links || [],
      },
    };
  }

  // Generate markup analysis first as it's used by other insights
  const markupAnalysis = deriveMarkupAnalysis(marketCheckData);

  // Generate all documented insights
  const analysis = {
    // Tier 1 insights (highest priority)
    markup_analysis: markupAnalysis,
    market_position: deriveMarketPosition(marketCheckData),
    market_timing: deriveMarketTimingInsights(marketCheckData),
    negotiation_intelligence: deriveNegotiationInsights(
      marketCheckData,
      markupAnalysis
    ),

    // Tier 2 insights
    dealer_psychology: deriveDealerPsychologyInsights(marketCheckData),
    cross_shopping: deriveCrossShoppingInsights(marketCheckData),
    financial_intelligence: deriveFinancialIntelligence(marketCheckData),

    // Tier 3 insights
    value_factors: deriveValueFactors(marketCheckData),
    safety_summary: deriveSafetySummary(nhtsaData),

    // Additional insights (newly added)
    historical_price_trends: deriveHistoricalPriceTrends(marketCheckData),
    geographic_price_variations:
      deriveGeographicPriceVariations(marketCheckData),
    dealer_reputation: deriveDealerReputationInsights(marketCheckData),
    inventory_alerts: deriveInventoryAlerts(marketCheckData),
    dealer_incentives: deriveDealerIncentiveIntelligence(marketCheckData),
    add_on_calculator: deriveAddOnValueCalculator(marketCheckData),

    // Note: post_purchase_verification is not included here as it requires the final price
    // which is not available during initial transformation
  };

  // Generate metadata
  const metadata = {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    data_sources: [
      marketCheckData ? 'marketcheck' : null,
      nhtsaData ? 'nhtsa' : null,
    ].filter(Boolean) as string[],
    data_quality: calculateDataQuality(marketCheckData, nhtsaData),
  };

  return {
    ...basics,
    specifications,
    safety,
    listing,
    analysis,
    metadata,
  };
}

export function transformVehicleData(
  marketCheckData: any,
  nhtsaData: NHTSAData
): UnifiedVehicleData {
  // Extract basic identification
  const basics = {
    vin: marketCheckData.vin || '',
    year: marketCheckData.year || 0,
    make: marketCheckData.make || '',
    model: marketCheckData.model || '',
    trim: marketCheckData.trim || '',
  };

  // Extract and normalize specifications
  const specifications = {
    body_style:
      marketCheckData.body_type || nhtsaData?.specifications?.body_class || '',
    vehicle_type:
      marketCheckData.vehicle_type ||
      nhtsaData?.specifications?.vehicle_type ||
      '',
    doors: marketCheckData.doors || 0,
    seating_capacity: marketCheckData.standard_seating || 0,

    // Engine & powertrain
    engine: {
      type:
        nhtsaData?.specifications?.engine?.type || marketCheckData.engine || '',
      size:
        parseFloat(marketCheckData.engine_size) ||
        parseFloat(nhtsaData?.specifications?.engine?.size || '0') ||
        0,
      cylinders:
        parseInt(marketCheckData.cylinders) ||
        parseInt(nhtsaData?.specifications?.engine?.cylinders || '0') ||
        0,
      fuel_type:
        marketCheckData.fuel_type ||
        nhtsaData?.specifications?.engine?.fuel_type ||
        '',
      horsepower: nhtsaData?.specifications?.engine?.horsepower || '',
      torque: nhtsaData?.specifications?.engine?.torque || '',
    },
    transmission: {
      type:
        marketCheckData.transmission ||
        nhtsaData?.specifications?.transmission?.type ||
        '',
      speeds:
        parseInt(marketCheckData.transmission_speed) ||
        parseInt(nhtsaData?.specifications?.transmission?.speeds || '0') ||
        0,
    },
    drivetrain:
      marketCheckData.drivetrain || nhtsaData?.specifications?.drivetrain || '',

    // Fuel economy
    fuel_economy: {
      city:
        parseInt(marketCheckData.city_miles) ||
        parseInt(nhtsaData?.specifications?.fuel_economy?.city || '0') ||
        0,
      highway:
        parseInt(marketCheckData.highway_miles) ||
        parseInt(nhtsaData?.specifications?.fuel_economy?.highway || '0') ||
        0,
      combined:
        parseInt(nhtsaData?.specifications?.fuel_economy?.combined || '0') || 0,
      fuel_tank_capacity: parseFloat(marketCheckData.fuel_tank_capacity) || 0,
    },

    // Dimensions
    dimensions: {
      wheelbase:
        parseFloat(marketCheckData.wheelbase_length) ||
        parseFloat(nhtsaData?.specifications?.dimensions?.wheelbase || '0') ||
        0,
      length:
        parseFloat(marketCheckData.overall_length) ||
        parseFloat(nhtsaData?.specifications?.dimensions?.length || '0') ||
        0,
      width:
        parseFloat(marketCheckData.overall_width) ||
        parseFloat(nhtsaData?.specifications?.dimensions?.width || '0') ||
        0,
      height:
        parseFloat(marketCheckData.overall_height) ||
        parseFloat(nhtsaData?.specifications?.dimensions?.height || '0') ||
        0,
      curb_weight:
        parseFloat(marketCheckData.curb_weight) ||
        parseFloat(nhtsaData?.specifications?.weight?.curb_weight || '0') ||
        0,
      gross_weight:
        parseFloat(marketCheckData.gross_weight) ||
        parseFloat(nhtsaData?.specifications?.weight?.gvwr || '0') ||
        0,
    },

    // Colors
    colors: {
      exterior: marketCheckData.exterior_color || '',
      interior: marketCheckData.interior_color || '',
    },

    // Manufacturing
    plant: nhtsaData?.specifications?.plant || '',
    manufacturer: nhtsaData?.specifications?.manufacturer || '',
    series: nhtsaData?.specifications?.series || '',
  };

  // Extract safety information
  const safety = {
    ratings: {
      overall: nhtsaData?.safety_ratings?.overall_rating || '',
      front_crash: nhtsaData?.safety_ratings?.overall_front_crash_rating || '',
      side_crash: nhtsaData?.safety_ratings?.overall_side_crash_rating || '',
      rollover: nhtsaData?.safety_ratings?.rollover_rating || '',
      side_pole_crash: nhtsaData?.safety_ratings?.side_pole_crash_rating || '',
    },
    recalls: nhtsaData?.recalls || [],
    complaints: nhtsaData?.complaints || [],
  };

  // Extract listing information if available
  let listing = undefined;
  if (marketCheckData.id || marketCheckData.price) {
    listing = {
      id: marketCheckData.id || '',
      price: parseFloat(marketCheckData.price) || 0,
      miles: parseInt(marketCheckData.miles) || 0,
      days_on_market: parseInt(marketCheckData.dom) || 0,
      seller_type: marketCheckData.seller_type || '',
      inventory_type: marketCheckData.inventory_type || '',
      is_certified: marketCheckData.is_certified || false,
      is_clean_title: marketCheckData.is_clean_title || false,
      has_accidents: marketCheckData.has_accidents || false,
      last_seen_date: marketCheckData.last_seen_at_date || '',
      source: marketCheckData.source || '',
      vdp_url: marketCheckData.vdp_url || '',

      // Dealer information if available
      dealer: marketCheckData.dealer
        ? {
            id: marketCheckData.dealer.id || '',
            name: marketCheckData.dealer.name || '',
            phone: marketCheckData.dealer.phone || '',
            website: marketCheckData.dealer.website || '',
            location: {
              city: marketCheckData.dealer.city || '',
              state: marketCheckData.dealer.state || '',
              zip: marketCheckData.dealer.zip || '',
            },
          }
        : undefined,

      // Media
      media: {
        photos: marketCheckData.media?.photo_links || [],
        videos: marketCheckData.media?.video_links || [],
      },
    };
  }

  // Generate markup analysis first as it's used by other insights
  const markupAnalysis = deriveMarkupAnalysis(marketCheckData);

  // Generate all documented insights
  const analysis = {
    // Tier 1 insights (highest priority)
    markup_analysis: markupAnalysis,
    market_position: deriveMarketPosition(marketCheckData),
    market_timing: deriveMarketTimingInsights(marketCheckData),
    negotiation_intelligence: deriveNegotiationInsights(
      marketCheckData,
      markupAnalysis
    ),

    // Tier 2 insights
    dealer_psychology: deriveDealerPsychologyInsights(marketCheckData),
    cross_shopping: deriveCrossShoppingInsights(marketCheckData),
    financial_intelligence: deriveFinancialIntelligence(marketCheckData),

    // Tier 3 insights
    value_factors: deriveValueFactors(marketCheckData),
    safety_summary: deriveSafetySummary(nhtsaData),

    // Additional insights (newly added)
    historical_price_trends: deriveHistoricalPriceTrends(marketCheckData),
    geographic_price_variations:
      deriveGeographicPriceVariations(marketCheckData),
    dealer_reputation: deriveDealerReputationInsights(marketCheckData),
    inventory_alerts: deriveInventoryAlerts(marketCheckData),
    dealer_incentives: deriveDealerIncentiveIntelligence(marketCheckData),
    add_on_calculator: deriveAddOnValueCalculator(marketCheckData),

    // Note: post_purchase_verification is not included here as it requires the final price
    // which is not available during initial transformation
  };

  // Generate metadata
  const metadata = {
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    data_sources: [
      marketCheckData ? 'marketcheck' : null,
      nhtsaData ? 'nhtsa' : null,
    ].filter(Boolean) as string[],
    data_quality: calculateDataQuality(marketCheckData, nhtsaData),
  };

  return {
    ...basics,
    specifications,
    safety,
    listing,
    analysis,
    metadata,
  };
}

/**
 * Derives market position analysis for the vehicle
 * Implements the Market Position Analysis insight category from VehicleNegotiationInsights
 */
function deriveMarketPosition(marketCheckData: any) {
  if (!marketCheckData || !marketCheckData.price) {
    return {
      price_comparison: 'unknown',
      days_on_market_comparison: 'unknown',
      price_delta_from_average: 0,
      price_percentile: 0,
    };
  }

  const price = parseFloat(marketCheckData.price) || 0;
  const averageMarketPrice =
    marketCheckData.similar_vehicles?.average_price || price;
  const daysOnMarket = parseInt(marketCheckData.dom) || 0;
  const avgDaysOnMarket = marketCheckData.similar_vehicles?.average_dom || 30; // Default to 30 days

  // Calculate price delta
  const priceDelta = price - averageMarketPrice;

  // Determine price comparison category
  let priceComparison = 'at_market';
  if (priceDelta >= averageMarketPrice * 0.05) priceComparison = 'above_market';
  else if (priceDelta <= -averageMarketPrice * 0.05)
    priceComparison = 'below_market';

  // Determine days on market comparison
  let daysOnMarketComparison = 'average';
  if (daysOnMarket > avgDaysOnMarket * 1.2)
    daysOnMarketComparison = 'above_average';
  else if (daysOnMarket < avgDaysOnMarket * 0.8)
    daysOnMarketComparison = 'below_average';

  // Calculate price percentile (simplified calculation)
  // In a real implementation, this would use actual distribution data
  let pricePercentile = 50; // Default at median

  if (marketCheckData.similar_vehicles?.price_distribution) {
    // Properly calculate percentile based on distribution
    const distribution = marketCheckData.similar_vehicles.price_distribution;
    const totalVehicles = distribution.reduce(
      (sum: number, range: any) => sum + range.count,
      0
    );
    let vehiclesBelow = 0;

    for (const range of distribution) {
      if (range.max < price) {
        vehiclesBelow += range.count;
      } else if (range.min <= price && range.max >= price) {
        // Approximate position within this range
        const rangeWidth = range.max - range.min;
        const positionInRange = (price - range.min) / rangeWidth;
        vehiclesBelow += range.count * positionInRange;
        break;
      }
    }

    pricePercentile = (vehiclesBelow / totalVehicles) * 100;
  }

  return {
    price_comparison: priceComparison,
    days_on_market_comparison: daysOnMarketComparison,
    price_delta_from_average: Math.round(priceDelta),
    price_percentile: Math.round(pricePercentile),
  };
}

/**
 * Derives markup analysis for the vehicle
 * Implements the Markup Analysis insight category from VehicleNegotiationInsights
 */
function deriveMarkupAnalysis(marketCheckData: any) {
  // Default values if data is insufficient
  if (!marketCheckData || !marketCheckData.price) {
    return {
      estimated_invoice: 0,
      markup_percentage: 0,
      markup_dollars: 0,
      negotiation_margin: 0,
      profit_centers: {
        vehicle_markup: 0,
        financing_potential: 0,
        add_on_potential: 0,
        trade_in_potential: 0,
      },
      power_zone: {
        min: 0,
        target: 0,
        max: 0,
      },
    };
  }

  const msrp =
    parseFloat(marketCheckData.msrp) ||
    parseFloat(marketCheckData.price) * 1.05 ||
    0;
  const price = parseFloat(marketCheckData.price) || 0;

  // Estimate invoice price (typically 3-7% below MSRP for most vehicles)
  const invoicePercentage = 0.94; // Estimated invoice is 94% of MSRP
  const estimatedInvoice = msrp * invoicePercentage;

  // Calculate markup
  const markupDollars = price - estimatedInvoice;
  const markupPercentage = (markupDollars / estimatedInvoice) * 100;

  // Estimate negotiation margin
  const typicalMinimumMargin = 0.02; // Dealers typically want at least 2% profit
  const negotiationMargin = markupPercentage - typicalMinimumMargin * 100;

  // Calculate profit centers
  const vehicleValue = price;
  const financingPotential = vehicleValue * 0.03; // Typical dealer reserve on financing
  const addOnPotential = vehicleValue * 0.05; // Potential profit from add-ons
  const tradeInPotential = vehicleValue * 0.08; // Potential profit from trade-in

  // Calculate power zone
  // Min: 2% over invoice (minimum dealer acceptable)
  // Target: 4% over invoice (good deal for both)
  // Max: 6% over invoice (still ok deal)
  const powerZoneMin = Math.round(estimatedInvoice * 1.02);
  const powerZoneTarget = Math.round(estimatedInvoice * 1.04);
  const powerZoneMax = Math.round(estimatedInvoice * 1.06);

  return {
    estimated_invoice: Math.round(estimatedInvoice),
    markup_percentage: Math.round(markupPercentage * 10) / 10, // One decimal place
    markup_dollars: Math.round(markupDollars),
    negotiation_margin: Math.round(negotiationMargin * 10) / 10,
    profit_centers: {
      vehicle_markup: Math.round(markupDollars),
      financing_potential: Math.round(financingPotential),
      add_on_potential: Math.round(addOnPotential),
      trade_in_potential: Math.round(tradeInPotential),
    },
    power_zone: {
      min: powerZoneMin,
      target: powerZoneTarget,
      max: powerZoneMax,
    },
  };
}

/**
 * Derives financial intelligence insights for the vehicle
 * Implements the Financial Intelligence category from VehicleNegotiationInsights
 */
function deriveFinancialIntelligence(marketCheckData: any) {
  if (!marketCheckData || !marketCheckData.price) {
    return {
      total_cost_of_ownership: {
        three_year: 0,
        five_year: 0,
        components: {},
      },
      financing_options: [],
      monthly_payment_impact: {},
      ownership_costs: {},
    };
  }

  const price = parseFloat(marketCheckData.price) || 0;
  const year = parseInt(marketCheckData.year) || new Date().getFullYear();
  const make = marketCheckData.make || '';
  const model = marketCheckData.model || '';

  // Estimate depreciation rates based on vehicle type
  // These would be refined with actual data from industry sources
  let depreciationRate = 0.15; // Default 15% per year
  if (['Toyota', 'Honda', 'Lexus'].includes(make)) {
    depreciationRate = 0.12; // Lower depreciation for certain brands
  } else if (['BMW', 'Mercedes-Benz', 'Audi'].includes(make)) {
    depreciationRate = 0.18; // Higher depreciation for luxury brands
  }

  // Calculate TCO components
  const depreciation3Year = price * (1 - Math.pow(1 - depreciationRate, 3));
  const depreciation5Year = price * (1 - Math.pow(1 - depreciationRate, 5));

  // Estimate maintenance costs
  const maintenanceCostPerYear = price * 0.04 + 800; // 4% of value plus base cost
  const maintenance3Year = maintenanceCostPerYear * 3;
  const maintenance5Year = maintenanceCostPerYear * 5;

  // Estimate insurance (would be better with actual quotes)
  const insuranceCostPerYear = price * 0.035 + 600;
  const insurance3Year = insuranceCostPerYear * 3;
  const insurance5Year = insuranceCostPerYear * 5;

  // Estimate fuel costs
  const fuelCostPerYear = 1800; // Simplified estimate
  const fuel3Year = fuelCostPerYear * 3;
  const fuel5Year = fuelCostPerYear * 5;

  // Calculate total cost of ownership
  const tco3Year =
    depreciation3Year + maintenance3Year + insurance3Year + fuel3Year;
  const tco5Year =
    depreciation5Year + maintenance5Year + insurance5Year + fuel5Year;

  // Generate financing options
  const financingOptions = [
    {
      term: 36,
      apr: 3.9,
      monthly_payment: calculateMonthlyPayment(price, 3.9, 36),
      total_interest: calculateTotalInterest(price, 3.9, 36),
      recommendation: 'Lowest total cost',
    },
    {
      term: 48,
      apr: 4.2,
      monthly_payment: calculateMonthlyPayment(price, 4.2, 48),
      total_interest: calculateTotalInterest(price, 4.2, 48),
      recommendation: 'Balanced option',
    },
    {
      term: 60,
      apr: 4.5,
      monthly_payment: calculateMonthlyPayment(price, 4.5, 60),
      total_interest: calculateTotalInterest(price, 4.5, 60),
      recommendation: 'Lowest monthly payment',
    },
  ];

  return {
    total_cost_of_ownership: {
      three_year: Math.round(tco3Year),
      five_year: Math.round(tco5Year),
      components: {
        depreciation: {
          three_year: Math.round(depreciation3Year),
          five_year: Math.round(depreciation5Year),
        },
        maintenance: {
          three_year: Math.round(maintenance3Year),
          five_year: Math.round(maintenance5Year),
        },
        insurance: {
          three_year: Math.round(insurance3Year),
          five_year: Math.round(insurance5Year),
        },
        fuel: {
          three_year: Math.round(fuel3Year),
          five_year: Math.round(fuel5Year),
        },
      },
    },
    financing_options: financingOptions,
    monthly_payment_impact: {
      base_payment: financingOptions[1].monthly_payment,
      insurance_impact: Math.round(insuranceCostPerYear / 12),
      total_monthly_cost: Math.round(
        financingOptions[1].monthly_payment + insuranceCostPerYear / 12
      ),
    },
    ownership_costs: {
      annual_maintenance: Math.round(maintenanceCostPerYear),
      annual_insurance: Math.round(insuranceCostPerYear),
      annual_fuel: fuelCostPerYear,
      annual_total: Math.round(
        maintenanceCostPerYear + insuranceCostPerYear + fuelCostPerYear
      ),
    },
  };
}

/**
 * Helper function to calculate monthly payment
 */
function calculateMonthlyPayment(
  principal: number,
  apr: number,
  term: number
): number {
  const monthlyRate = apr / 100 / 12;
  return Math.round(
    (principal * monthlyRate) / (1 - Math.pow(1 + monthlyRate, -term))
  );
}

/**
 * Helper function to calculate total interest
 */
function calculateTotalInterest(
  principal: number,
  apr: number,
  term: number
): number {
  const monthlyPayment = calculateMonthlyPayment(principal, apr, term);
  return Math.round(monthlyPayment * term - principal);
}

/**
 * Derives market timing insights for the vehicle
 * Implements the Timing Intelligence category from VehicleNegotiationInsights
 */
function deriveMarketTimingInsights(marketCheckData: any) {
  if (!marketCheckData) {
    return {
      timing_advantage_score: 0,
      market_timing: {
        month_position: 'unknown',
        quarter_position: 'unknown',
        model_year_timing: 'unknown',
        day_of_week: 'unknown',
      },
      best_time_to_buy: '',
      urgency_level: 'unknown',
      recommendation: '',
    };
  }

  // Get current date info for timing analysis
  const now = new Date();
  const currentDay = now.getDate();
  const currentMonth = now.getMonth() + 1; // JS months are 0-indexed
  const daysInMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0
  ).getDate();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday

  // Determine month position (beginning, middle, end)
  let monthPosition = 'middle';
  if (currentDay <= 5) monthPosition = 'beginning';
  else if (currentDay >= daysInMonth - 5) monthPosition = 'end';

  // Determine quarter position
  let quarterPosition = 'middle';
  const isLastMonthOfQuarter = currentMonth % 3 === 0;

  if (isLastMonthOfQuarter && currentDay >= daysInMonth - 5) {
    quarterPosition = 'end';
  }

  // Determine model year timing
  // New model years typically arrive in late summer/early fall
  let modelYearTiming = 'mid_cycle';
  if (currentMonth >= 8 && currentMonth <= 10) {
    modelYearTiming = 'model_transition';
  } else if (currentMonth >= 11 || currentMonth <= 2) {
    modelYearTiming = 'new_model_year';
  }

  // Determine day of week timing
  let dayOfWeekTiming = 'average';
  if (dayOfWeek === 1 || dayOfWeek === 2) {
    // Monday or Tuesday
    dayOfWeekTiming = 'good';
  } else if (dayOfWeek === 0 || dayOfWeek === 6) {
    // Weekend
    dayOfWeekTiming = 'busy';
  }

  // Calculate overall timing advantage score (0-100)
  let timingAdvantageScore = 50; // Default to neutral

  // End of month/quarter bonus
  if (quarterPosition === 'end') timingAdvantageScore += 20;
  else if (monthPosition === 'end') timingAdvantageScore += 10;

  // Model year transition bonus
  if (modelYearTiming === 'model_transition') timingAdvantageScore += 15;

  // Weekday bonus
  if (dayOfWeekTiming === 'good') timingAdvantageScore += 5;

  // Days on market bonus
  const daysOnMarket = parseInt(marketCheckData.dom) || 0;
  if (daysOnMarket > 60) timingAdvantageScore += 20;
  else if (daysOnMarket > 30) timingAdvantageScore += 10;

  // Cap at 100
  timingAdvantageScore = Math.min(timingAdvantageScore, 100);

  // Determine best time to buy
  let bestTimeToBuy = '';
  let urgencyLevel = 'moderate';

  if (timingAdvantageScore >= 80) {
    bestTimeToBuy = 'now';
    urgencyLevel = 'high';
  } else if (quarterPosition === 'middle' && isLastMonthOfQuarter) {
    bestTimeToBuy = `in ${daysInMonth - currentDay} days (end of quarter)`;
    urgencyLevel = 'low';
  } else if (monthPosition === 'middle') {
    bestTimeToBuy = `in ${daysInMonth - currentDay} days (end of month)`;
    urgencyLevel = 'low';
  }

  // Generate recommendation
  let timingRecommendation = '';
  if (urgencyLevel === 'high') {
    timingRecommendation =
      'Current timing is optimal for negotiation. Act now to maximize leverage.';
  } else if (urgencyLevel === 'moderate') {
    timingRecommendation =
      'Timing is favorable, but could improve. Consider negotiating now with strong tactics.';
  } else {
    timingRecommendation = `Waiting until ${bestTimeToBuy} will give you better leverage, if possible.`;
  }

  return {
    timing_advantage_score: timingAdvantageScore,
    market_timing: {
      month_position: monthPosition,
      quarter_position: quarterPosition,
      model_year_timing: modelYearTiming,
      day_of_week: dayOfWeekTiming,
    },
    best_time_to_buy: bestTimeToBuy,
    urgency_level: urgencyLevel,
    recommendation: timingRecommendation,
  };
}

/**
 * Derives safety summary analysis for the vehicle
 * Implements the Safety Summary insight category from VehicleNegotiationInsights
 */
function deriveSafetySummary(nhtsaData: NHTSAData) {
  if (!nhtsaData) {
    return {
      recall_severity: 'unknown',
      complaint_severity: 'unknown',
      safety_rating_summary: 'unknown',
      critical_issues: [],
    };
  }

  const recalls = nhtsaData.recalls || [];
  const complaints = nhtsaData.complaints || [];
  const safetyRatings = nhtsaData.safety_ratings || null;

  // Analyze recall severity
  let recallSeverity = 'none';
  let criticalIssues: string[] = [];

  // Define keywords that indicate critical recalls
  const criticalKeywords = [
    'fire',
    'crash',
    'brake',
    'airbag',
    'steering',
    'fatal',
    'accident',
    'rollover',
    'explode',
    'explosion',
    'failure',
  ];

  // Fix the type issue with Description property by using a type guard
  const hasCriticalRecalls = recalls.some((recall) => {
    // Access properties safely with type assertion
    const description = ((recall as any).Description || '') as string;
    return criticalKeywords.some((keyword) =>
      description.toLowerCase().includes(keyword)
    );
  });

  if (recalls.length > 5) {
    recallSeverity = 'high';
  } else if (recalls.length > 0) {
    recallSeverity = hasCriticalRecalls ? 'high' : 'moderate';
  }

  // Extract critical recall information
  recalls.forEach((recall) => {
    // Access properties safely with type assertion
    const description = ((recall as any).Description || '') as string;
    if (
      criticalKeywords.some((keyword) =>
        description.toLowerCase().includes(keyword)
      )
    ) {
      criticalIssues.push(
        `Critical Recall: ${description.substring(0, 100)}...`
      );
    }
  });

  // Analyze complaint severity
  let complaintSeverity = 'none';

  if (complaints.length > 10) {
    complaintSeverity = 'high';
  } else if (complaints.length > 3) {
    complaintSeverity = 'moderate';
  } else if (complaints.length > 0) {
    complaintSeverity = 'low';
  }

  // Extract critical complaint information
  complaints.slice(0, 3).forEach((complaint) => {
    // Access properties safely with type assertion
    const description = ((complaint as any).complaint || '') as string;
    criticalIssues.push(`Owner Complaint: ${description.substring(0, 100)}...`);
  });

  // Analyze safety ratings
  let safetyRatingSummary = 'unknown';

  if (safetyRatings) {
    // Fix type comparison issue by ensuring overallRating is a number
    const overallRating =
      typeof safetyRatings.overall_rating === 'string'
        ? parseFloat(safetyRatings.overall_rating)
        : safetyRatings.overall_rating || 0;

    if (overallRating >= 4.5) {
      safetyRatingSummary = 'excellent';
    } else if (overallRating >= 4) {
      safetyRatingSummary = 'very_good';
    } else if (overallRating >= 3) {
      safetyRatingSummary = 'good';
    } else if (overallRating > 0) {
      safetyRatingSummary = 'poor';
    }
  }

  return {
    recall_severity: recallSeverity,
    complaint_severity: complaintSeverity,
    safety_rating_summary: safetyRatingSummary,
    critical_issues: criticalIssues.slice(0, 5), // Limit to top 5 issues
  };
}

/**
 * Derives value factors analysis for the vehicle
 * Implements the Value Factors Analysis category from VehicleNegotiationInsights
 */
function deriveValueFactors(marketCheckData: any) {
  if (!marketCheckData) {
    return {
      condition_impact: 0,
      mileage_impact: 0,
      history_impact: 0,
      total_value_adjustment: 0,
    };
  }

  const price = parseFloat(marketCheckData.price) || 0;
  const miles = parseInt(marketCheckData.miles) || 0;

  // Calculate mileage impact
  let mileageImpact = 0;
  const avgMileage =
    12000 * (new Date().getFullYear() - (marketCheckData.year || 0)); // Estimate average mileage

  if (miles > avgMileage * 1.2) {
    // High mileage penalty
    mileageImpact = -price * 0.05 * ((miles - avgMileage) / avgMileage);
  } else if (miles < avgMileage * 0.8) {
    // Low mileage bonus
    mileageImpact = price * 0.03 * ((avgMileage - miles) / avgMileage);
  }

  // Calculate condition impact
  let conditionImpact = 0;
  const condition = marketCheckData.condition || 'Good'; // Default to 'Good'

  switch (condition.toLowerCase()) {
    case 'excellent':
      conditionImpact = price * 0.05;
      break;
    case 'very good':
      conditionImpact = price * 0.02;
      break;
    case 'good':
      conditionImpact = 0;
      break;
    case 'fair':
      conditionImpact = -price * 0.05;
      break;
    case 'poor':
      conditionImpact = -price * 0.1;
      break;
  }

  // Calculate history impact
  let historyImpact = 0;

  if (marketCheckData.has_accidents) {
    historyImpact -= price * 0.08; // 8% penalty for accidents
  }

  if (!marketCheckData.is_clean_title) {
    historyImpact -= price * 0.15; // 15% penalty for title issues
  }

  if (marketCheckData.is_certified) {
    historyImpact += price * 0.03; // 3% bonus for CPO
  }

  // Calculate total value adjustment
  const totalValueAdjustment = mileageImpact + conditionImpact + historyImpact;

  return {
    condition_impact: Math.round(conditionImpact),
    mileage_impact: Math.round(mileageImpact),
    history_impact: Math.round(historyImpact),
    total_value_adjustment: Math.round(totalValueAdjustment),
  };
}

/**
 * Derives negotiation insights for the vehicle
 * Implements the Negotiation Intelligence category from VehicleNegotiationInsights
 */
function deriveNegotiationInsights(marketCheckData: any, markupAnalysis: any) {
  if (!marketCheckData || !markupAnalysis) {
    return {
      power_moves: [],
      walk_away_threshold: 0,
      anchoring_strategy: {
        initial_offer: 0,
        justification: '',
        fallback_positions: [],
      },
      objection_handling: {},
    };
  }

  const price = parseFloat(marketCheckData.price) || 0;
  const invoice = markupAnalysis.estimated_invoice || price * 0.92;

  // Calculate walk-away threshold (1% above invoice is minimum acceptable dealer profit)
  const walkAwayThreshold = Math.round(invoice * 1.01);

  // Calculate initial offer (around 8-12% below asking depending on market position)
  const discountMultiplier = 0.9; // 10% discount as default
  const initialOffer = Math.round(price * discountMultiplier);

  // Generate appropriate justifications based on market data
  let justification = 'market research';
  const fallbackPositions = [];

  if (marketCheckData.dom > 45) {
    justification = 'extended_listing_time';
    fallbackPositions.push({
      price: Math.round(price * 0.92),
      justification: 'aged_inventory_discount',
    });
  }

  // Add fallback positions in $500 increments
  for (let i = 1; i <= 3; i++) {
    fallbackPositions.push({
      price: Math.round(initialOffer + i * 500),
      justification: i === 3 ? 'final_offer' : 'negotiation_step',
    });
  }

  // Generate power moves based on market conditions
  const powerMoves = [];

  if (marketCheckData.dom > 30) {
    powerMoves.push({
      name: 'days_on_market',
      script: `I notice this vehicle has been on the lot for ${marketCheckData.dom} days, which is well above average. That suggests there's not high demand at this price point.`,
    });
  }

  if (markupAnalysis.markup_percentage > 8) {
    powerMoves.push({
      name: 'high_markup',
      script: `I've researched the typical markup for this model, and this vehicle is priced with above-average markup.`,
    });
  }

  // Add standard power moves
  powerMoves.push({
    name: 'competing_offer',
    script: `I've been offered a similar vehicle at [DEALER_NAME] for [COMPETING_PRICE], but I'd prefer to purchase from you if we can reach an agreement.`,
  });

  // Generate objection handling responses
  const objectionHandling = {
    we_cant_go_that_low: `I understand you need to make a profit, but based on my research the invoice price is around $${Math.round(invoice)}, so my offer of $${initialOffer} still provides a reasonable profit margin.`,
    manager_wont_approve: `I appreciate your position, but I've done extensive research on this model and market. Perhaps we could speak directly with your manager to explain my rationale?`,
    price_already_discounted: `I see that, but when I compare to the current market, there's still room to make this a fair deal for both of us.`,
    what_monthly_payment: `I prefer to discuss the total price rather than monthly payments, as that gives us both clarity on the actual deal value.`,
  };

  return {
    power_moves: powerMoves,
    walk_away_threshold: walkAwayThreshold,
    anchoring_strategy: {
      initial_offer: initialOffer,
      justification: justification,
      fallback_positions: fallbackPositions,
    },
    objection_handling: objectionHandling,
  };
}

/**
 * Derives dealer psychology insights for the vehicle
 * Implements the Dealer Psychology Insights category from VehicleNegotiationInsights
 */
function deriveDealerPsychologyInsights(marketCheckData: any) {
  if (!marketCheckData) {
    return {
      motivation_level: 'unknown',
      inventory_pressure: 'unknown',
      sales_target_pressure: 'unknown',
      psychological_leverage_points: [],
    };
  }

  // Default response with reasonable values
  const response = {
    motivation_level: 'moderate',
    inventory_pressure: 'moderate',
    sales_target_pressure: 'moderate',
    psychological_leverage_points: [
      'general_availability',
      'standard_negotiation',
    ],
  };

  // Calculate dealer motivation based on days on market
  const daysOnMarket = parseInt(marketCheckData.dom) || 0;
  if (daysOnMarket > 60) {
    response.motivation_level = 'high';
    response.inventory_pressure = 'high';
    response.psychological_leverage_points.push('aged_inventory');
  } else if (daysOnMarket > 30) {
    response.motivation_level = 'moderate';
    response.inventory_pressure = 'moderate';
    response.psychological_leverage_points.push('above_average_age');
  } else {
    response.motivation_level = 'low';
    response.inventory_pressure = 'low';
  }

  // Determine month/quarter end pressure
  const currentDate = new Date();
  const dayOfMonth = currentDate.getDate();
  const lastDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate();
  const isEndOfMonth = dayOfMonth >= lastDayOfMonth - 5;
  const monthNumber = currentDate.getMonth() + 1;
  const isEndOfQuarter =
    isEndOfMonth &&
    (monthNumber === 3 ||
      monthNumber === 6 ||
      monthNumber === 9 ||
      monthNumber === 12);

  if (isEndOfQuarter) {
    response.sales_target_pressure = 'very_high';
    response.psychological_leverage_points.push('quarter_end_goals');
  } else if (isEndOfMonth) {
    response.sales_target_pressure = 'high';
    response.psychological_leverage_points.push('month_end_goals');
  }

  // Check for similar inventory
  if (marketCheckData.similar_vehicles?.count > 3) {
    response.psychological_leverage_points.push('similar_inventory_available');
  }

  return response;
}

/**
 * Derives cross-shopping insights for the vehicle
 * Implements the Cross-Shopping Intelligence category from VehicleNegotiationInsights
 */
function deriveCrossShoppingInsights(marketCheckData: any) {
  if (!marketCheckData) {
    return {
      alternative_vehicles: [],
      cross_brand_alternatives: [],
      value_comparison: {
        better_value_options: [],
        feature_comparison: {},
      },
    };
  }

  // This would normally use actual market data for alternatives
  // For now, we're creating a placeholder implementation
  const year = marketCheckData.year || new Date().getFullYear();
  const make = marketCheckData.make || '';
  const model = marketCheckData.model || '';
  const price = parseFloat(marketCheckData.price) || 0;

  // Generate sample alternative vehicles (same make)
  const alternativeVehicles: Array<{
    year: number;
    make: string;
    model: string;
    price: number;
    savings: number;
    value_score: number;
  }> = [];

  if (make && model) {
    alternativeVehicles.push({
      year: year,
      make: make,
      model: model + ' (different trim)',
      price: Math.round(price * 0.95),
      savings: Math.round(price * 0.05),
      value_score: 85,
    });

    alternativeVehicles.push({
      year: year - 1,
      make: make,
      model: model,
      price: Math.round(price * 0.85),
      savings: Math.round(price * 0.15),
      value_score: 90,
    });
  }

  // Generate cross-brand alternatives
  const crossBrandAlternatives: Array<{
    year: number;
    make: string;
    model: string;
    price: number;
    savings: number;
    value_score: number;
  }> = [];

  // Define some common competitor mappings
  const competitorMakes: Record<string, string[]> = {
    honda: ['toyota', 'mazda', 'nissan'],
    toyota: ['honda', 'mazda', 'nissan'],
    ford: ['chevrolet', 'dodge', 'gmc'],
    chevrolet: ['ford', 'dodge', 'gmc'],
    bmw: ['mercedes-benz', 'audi', 'lexus'],
    'mercedes-benz': ['bmw', 'audi', 'lexus'],
    audi: ['bmw', 'mercedes-benz', 'lexus'],
    lexus: ['infiniti', 'acura', 'bmw'],
  };

  const competitors = competitorMakes[make.toLowerCase()] || [
    'toyota',
    'honda',
    'ford',
  ];

  competitors.forEach((altMake) => {
    // This would be based on real competitive model data in production
    const altModel = model + ' competitor';

    crossBrandAlternatives.push({
      year: year,
      make: altMake,
      model: altModel,
      price: Math.round(price * 0.97),
      savings: Math.round(price * 0.03),
      value_score: 80,
    });
  });

  // Generate value comparison
  const betterValueOptions = [
    ...alternativeVehicles.filter((v) => v.value_score > 80),
    ...crossBrandAlternatives.filter((v) => v.value_score > 80),
  ];

  // Generate sample feature comparison
  const featureComparison = {
    pricing: {
      base_price: price,
      alternatives_avg: Math.round(price * 0.96),
    },
    performance: {
      horsepower: 'Similar across alternatives',
      fuel_economy: '2-3 MPG better in some alternatives',
    },
    features: {
      key_advantages: ['Feature 1', 'Feature 2'],
      key_disadvantages: ['Missing Feature 1', 'Higher cost for Feature 2'],
    },
  };

  return {
    alternative_vehicles: alternativeVehicles,
    cross_brand_alternatives: crossBrandAlternatives,
    value_comparison: {
      better_value_options: betterValueOptions,
      feature_comparison: featureComparison,
    },
  };
}

/**
 * Helper function to calculate data quality percentage
 */
function calculateDataQuality(marketCheckData: any, nhtsaData: any): number {
  if (!marketCheckData) return 0;

  // Count key fields with data
  let fieldsPresent = 0;
  let totalFields = 0;

  // Check MarketCheck key fields
  const marketCheckFields = [
    'vin',
    'year',
    'make',
    'model',
    'trim',
    'price',
    'miles',
    'dom',
    'exterior_color',
    'interior_color',
    'engine',
    'transmission',
    'drivetrain',
  ];

  totalFields += marketCheckFields.length;
  fieldsPresent += marketCheckFields.filter(
    (field) => marketCheckData[field]
  ).length;

  // Check NHTSA data if available
  if (nhtsaData) {
    totalFields += 3; // Safety ratings, recalls, complaints
    if (nhtsaData.safety_ratings) fieldsPresent++;
    if (nhtsaData.recalls && nhtsaData.recalls.length > 0) fieldsPresent++;
    if (nhtsaData.complaints && nhtsaData.complaints.length > 0)
      fieldsPresent++;
  }

  // Media data
  if (
    marketCheckData.media &&
    (marketCheckData.media.photo_links || marketCheckData.media.video_links)
  ) {
    fieldsPresent++;
  }
  totalFields++;

  // Calculate percentage
  const qualityPercentage = Math.round((fieldsPresent / totalFields) * 100);
  return qualityPercentage;
}

/**
 * Get complete vehicle information by VIN (MarketCheck + NHTSA)
 * with retry logic and rate limiting to handle API limits.
 */
export async function getCompleteVehicleByVin(
  vin: string,
  token: string,
  maxRetries: number = 3,
  retryDelay: number = 1000
): Promise<UnifiedVehicleData> {
  let retryCount = 0;

  while (retryCount < maxRetries) {
    try {
      console.log('Getting complete vehicle information for VIN:', vin);

      // Get basic vehicle data from MarketCheck
      const marketCheckData = await marketCheckServices.fetchVinSpecs(
        vin,
        token
      );

      // Get NHTSA data
      const nhtsaData = await nhtsaServices.getAllNHTSADataByVin(vin);

      // Ensure NHTSA data has the required structure
      const validatedNHTSAData = ensureNHTSADataStructure(nhtsaData);

      // Use the transformation function to create a unified model
      return transformVehicleData(marketCheckData, validatedNHTSAData);
    } catch (error: any) {
      retryCount++;

      if (retryCount >= maxRetries) {
        console.error(
          'Max retries reached. Failed to get complete vehicle information:',
          error.message
        );
        throw new Error(`Failed after ${maxRetries} retries: ${error.message}`);
      }

      console.warn(
        `Attempt ${retryCount} failed. Retrying in ${retryDelay}ms...`
      );

      // Wait for the specified delay before retrying
      await setTimeout(retryDelay);
    }
  }

  // This line should never be reached, but TypeScript requires a return statement
  throw new Error('Unexpected error in getCompleteVehicleByVin');
}

/**
 * Search for vehicles with complete information (MarketCheck + NHTSA)
 */
export async function searchVehiclesWithCompleteInfo(
  params: Record<string, any>,
  token: string
): Promise<any> {
  try {
    console.log('Searching vehicles with complete info:', params);

    // Get listings from MarketCheck
    const searchResults = await marketCheckServices.fetchActiveCarListings(
      token,
      params
    );

    if (
      !searchResults.listings ||
      !Array.isArray(searchResults.listings) ||
      searchResults.listings.length === 0
    ) {
      console.log('No listings found for the search criteria');
      return { listings: [] };
    }

    console.log(
      `Found ${searchResults.listings.length} listings, enriching with NHTSA data`
    );

    // Process listings in batches to avoid overwhelming the NHTSA API
    const enrichedListings = await Promise.all(
      searchResults.listings.map(async (listing: any) => {
        try {
          const vin = listing.vin;
          if (!vin) {
            console.warn('Listing has no VIN, skipping NHTSA enrichment');
            return listing;
          }

          // Get NHTSA data
          const nhtsaData = await nhtsaServices.getAllNHTSADataByVin(vin);

          // Ensure NHTSA data has the required structure
          const validatedNHTSAData = ensureNHTSADataStructure(nhtsaData);

          // Transform the data
          return transformVehicleData(listing, validatedNHTSAData);
        } catch (error) {
          console.error(`Error processing listing ${listing.id}:`, error);
          // Return basic transformed data without NHTSA
          return transformVehicleData(listing, {
            specifications: null,
            safety_ratings: null,
            recalls: [],
            complaints: [],
          });
        }
      })
    );

    return {
      ...searchResults,
      listings: enrichedListings,
    };
  } catch (error: any) {
    console.error(
      'Error searching vehicles with complete info:',
      error.message
    );
    throw error;
  }
}

/**
 * Enrich a vehicle listing with NHTSA data
 */
export async function enrichVehicleListing(
  listing: any,
  token: string
): Promise<EnrichedVehicleListing> {
  try {
    // Extract VIN from listing
    const vin = listing.vin;

    if (!vin) {
      console.warn('No VIN found in listing, skipping NHTSA enrichment');
      return listing;
    }

    console.log(`Enriching vehicle listing with NHTSA data for VIN: ${vin}`);

    // Get NHTSA data
    const nhtsaData = await nhtsaServices
      .getAllNHTSADataByVin(vin)
      .catch((error) => {
        console.error(
          `Error getting NHTSA data for VIN ${vin}:`,
          error.message
        );
        // Return empty data structure on error
        return {
          specifications: null,
          safety_ratings: null,
          recalls: [],
          complaints: [],
        };
      });

    // Ensure NHTSA data has the required structure
    const validatedNHTSAData = ensureNHTSADataStructure(nhtsaData);

    // Return enriched listing with guaranteed structure
    const enrichedListing: EnrichedVehicleListing = {
      ...listing,
      vin: vin, // Ensure VIN is always present
      nhtsa_data: validatedNHTSAData,
    };

    safeLog(`Enriched listing for VIN ${vin}`, enrichedListing);
    return enrichedListing;
  } catch (error: any) {
    console.error('Error enriching vehicle listing:', error.message);
    // Return listing with empty NHTSA data structure
    return {
      ...listing,
      nhtsa_data: {
        specifications: null,
        safety_ratings: null,
        recalls: [],
        complaints: [],
      },
    };
  }
}

// Helper functions to format NHTSA data
function formatSpecifications(vinDecodeData: any[] | null) {
  if (!vinDecodeData) return null;

  return {
    engine: {
      type: getValueFromResults(vinDecodeData, 'Engine Type'),
      size: getValueFromResults(vinDecodeData, 'Displacement (L)'),
      cylinders:
        parseInt(
          getValueFromResults(vinDecodeData, 'Engine Number of Cylinders')
        ) || null,
      fuel_type: getValueFromResults(vinDecodeData, 'Fuel Type - Primary'),
      horsepower: getValueFromResults(vinDecodeData, 'Engine Brake (hp)'),
    },
    transmission: {
      type: getValueFromResults(vinDecodeData, 'Transmission Style'),
      speeds:
        parseInt(getValueFromResults(vinDecodeData, 'Transmission Speeds')) ||
        null,
    },
    drivetrain: getValueFromResults(vinDecodeData, 'Drive Type'),
    dimensions: {
      wheelbase: getValueFromResults(vinDecodeData, 'Wheelbase (inches)'),
      length: getValueFromResults(vinDecodeData, 'Overall Length (inches)'),
      width: getValueFromResults(vinDecodeData, 'Overall Width (inches)'),
      height: getValueFromResults(vinDecodeData, 'Overall Height (inches)'),
    },
    weight: {
      gvwr: getValueFromResults(vinDecodeData, 'Gross Vehicle Weight Rating'),
      curb_weight: getValueFromResults(vinDecodeData, 'Curb Weight (pounds)'),
    },
    // Add the missing fuel_economy property
    fuel_economy: {
      city: getValueFromResults(vinDecodeData, 'City mileage'),
      highway: getValueFromResults(vinDecodeData, 'Highway mileage'),
      combined: getValueFromResults(vinDecodeData, 'Combined Fuel Economy'),
    },
    vehicle_type: getValueFromResults(vinDecodeData, 'Vehicle Type'),
    plant: getValueFromResults(vinDecodeData, 'Plant City'),
    manufacturer: getValueFromResults(vinDecodeData, 'Manufacturer Name'),
    series: getValueFromResults(vinDecodeData, 'Series'),
    body_class: getValueFromResults(vinDecodeData, 'Body Class'),
  };
}

/**
 * Helper function to extract values from NHTSA API results
 * @param results The NHTSA API results array
 * @param variableName The variable name to look for
 * @returns The value of the variable, or empty string if not found
 */
function getValueFromResults(
  results: any[] | null,
  variableName: string
): string {
  if (!results || !Array.isArray(results)) return '';

  const item = results.find((result) => result.Variable === variableName);
  return item?.Value || '';
}

/**
 * Helper function to modify NHTSA data to ensure it has the required fuel_economy property
 * @param nhtsaData The NHTSA data to modify
 * @returns Modified NHTSA data with fuel_economy property
 */
function ensureNHTSADataStructure(nhtsaData: any): NHTSAData {
  if (!nhtsaData) {
    return {
      specifications: null,
      safety_ratings: null,
      recalls: [],
      complaints: [],
    };
  }

  // If specifications exist but don't have fuel_economy, add it
  if (nhtsaData.specifications && !nhtsaData.specifications.fuel_economy) {
    nhtsaData.specifications.fuel_economy = {
      city: '',
      highway: '',
      combined: '',
    };
  }

  return nhtsaData as NHTSAData;
}

/**
 * Derives historical price trends for a vehicle
 * Provides insights into how prices have changed over time
 */
function deriveHistoricalPriceTrends(marketCheckData: any) {
  if (!marketCheckData) {
    return {
      price_history: [],
      seasonal_trends: [],
      trend_direction: 'unknown',
      predicted_change_30d: 0,
      predicted_change_90d: 0,
    };
  }

  // Extract any existing price history from market check data
  // In a real implementation, this would come from a time-series database
  const rawPriceHistory = marketCheckData.price_history || [];

  // Format the price history into a standardized format
  const priceHistory = rawPriceHistory.map((entry: any) => ({
    date: entry.date,
    price: parseFloat(entry.price) || 0,
    source: entry.source || 'market_data',
  }));

  // Calculate trend direction based on recent price movements
  let trendDirection = 'stable';
  let predictedChange30d = 0;
  let predictedChange90d = 0;

  // If we have sufficient price history, calculate trends
  if (priceHistory.length >= 2) {
    // Sort by date (newest first)
    const sortedHistory = [...priceHistory].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const newestPrice = sortedHistory[0].price;
    const oldestPrice = sortedHistory[sortedHistory.length - 1].price;

    // Calculate overall trend
    const priceDiff = newestPrice - oldestPrice;
    const percentChange = (priceDiff / oldestPrice) * 100;

    if (percentChange < -2) trendDirection = 'declining';
    else if (percentChange > 2) trendDirection = 'increasing';

    // Simple linear projection for future changes
    const dailyChangeRate = priceDiff / sortedHistory.length;
    predictedChange30d = Math.round(dailyChangeRate * 30);
    predictedChange90d = Math.round(dailyChangeRate * 90);
  }

  // Generate seasonal trend data
  // In a real implementation, this would be based on historical model data
  const seasonalTrends = [
    { month: 'January', trend: -2.1, note: 'Post-holiday deals' },
    { month: 'February', trend: -0.5, note: 'Stable prices' },
    { month: 'March', trend: 0.8, note: 'Spring buying season beginning' },
    { month: 'April', trend: 1.5, note: 'Tax refund season' },
    { month: 'May', trend: 0.7, note: 'Spring buying continues' },
    { month: 'June', trend: 0.2, note: 'Early summer plateau' },
    { month: 'July', trend: -0.3, note: 'Mid-summer slowdown' },
    { month: 'August', trend: -1.2, note: 'Model year transitions begin' },
    { month: 'September', trend: -2.5, note: 'Model year clearance' },
    { month: 'October', trend: -1.8, note: 'Fall buying opportunities' },
    { month: 'November', trend: 0.3, note: 'Holiday season beginning' },
    { month: 'December', trend: 1.2, note: 'Year-end sales events' },
  ];

  return {
    price_history: priceHistory,
    seasonal_trends: seasonalTrends,
    trend_direction: trendDirection,
    predicted_change_30d: predictedChange30d,
    predicted_change_90d: predictedChange90d,
  };
}

/**
 * Derives geographic price variations for a vehicle
 * Shows how prices differ across regions
 */
function deriveGeographicPriceVariations(marketCheckData: any) {
  if (!marketCheckData || !marketCheckData.price) {
    return {
      local_comparison: { difference: 0, percentile: 0 },
      regional_comparison: { difference: 0, percentile: 0 },
      national_comparison: { difference: 0, percentile: 0 },
      best_deal_locations: [],
    };
  }

  const price = parseFloat(marketCheckData.price) || 0;

  // In a real implementation, these would come from actual geographic analysis
  // Here we're simulating the data for demonstration

  // Simulate local market comparison (25 mile radius)
  const localAvgPrice =
    marketCheckData.similar_vehicles?.local_price || price * 1.02;
  const localDifference = price - localAvgPrice;
  const localPercentile = Math.round(Math.random() * 100); // This would be calculated from actual distribution

  // Simulate regional market comparison (100 mile radius)
  const regionalAvgPrice =
    marketCheckData.similar_vehicles?.regional_price || price * 0.98;
  const regionalDifference = price - regionalAvgPrice;
  const regionalPercentile = Math.round(Math.random() * 100);

  // Simulate national market comparison
  const nationalAvgPrice =
    marketCheckData.similar_vehicles?.national_price || price * 0.95;
  const nationalDifference = price - nationalAvgPrice;
  const nationalPercentile = Math.round(Math.random() * 100);

  // Generate best deal locations
  // In a real implementation, this would come from actual geographic search
  const bestDealLocations = [
    {
      city: 'Springfield',
      state: 'IL',
      price: Math.round(price * 0.92),
      savings: Math.round(price * 0.08),
      distance: 120,
    },
    {
      city: 'Riverside',
      state: 'CA',
      price: Math.round(price * 0.93),
      savings: Math.round(price * 0.07),
      distance: 185,
    },
    {
      city: 'Austin',
      state: 'TX',
      price: Math.round(price * 0.94),
      savings: Math.round(price * 0.06),
      distance: 230,
    },
  ];

  return {
    local_comparison: {
      difference: Math.round(localDifference),
      percentile: localPercentile,
    },
    regional_comparison: {
      difference: Math.round(regionalDifference),
      percentile: regionalPercentile,
    },
    national_comparison: {
      difference: Math.round(nationalDifference),
      percentile: nationalPercentile,
    },
    best_deal_locations: bestDealLocations,
  };
}

/**
 * Derives dealership reputation insights
 * Factors dealer ratings into negotiation power
 */
function deriveDealerReputationInsights(marketCheckData: any) {
  if (!marketCheckData || !marketCheckData.dealer) {
    return {
      rating: 0,
      review_count: 0,
      sentiment_analysis: {},
      negotiation_flexibility: 'unknown',
      reputation_leverage: [],
    };
  }

  // Extract dealer info and ratings
  const dealer = marketCheckData.dealer;
  const rating = dealer.rating || 0;
  const reviewCount = dealer.review_count || 0;

  // Determine negotiation flexibility based on rating
  let negotiationFlexibility = 'moderate';
  if (rating >= 4.5 && reviewCount > 50) {
    negotiationFlexibility = 'low'; // High-rated dealers may be less flexible
  } else if (rating <= 3.5 || reviewCount < 10) {
    negotiationFlexibility = 'high'; // Lower-rated dealers may be more desperate for good reviews
  }

  // Generate reputation leverage points based on dealer rating
  const reputationLeverage = [];

  if (rating < 4.0) {
    reputationLeverage.push({
      type: 'rating_improvement',
      script:
        "I notice your dealership has some mixed reviews online. I'd be happy to share a positive experience if we can reach a fair deal today.",
    });
  }

  if (reviewCount < 30) {
    reputationLeverage.push({
      type: 'review_volume',
      script:
        "I see you're building your online reputation. I actively share my car buying experiences online and would be glad to add a positive review after a smooth transaction.",
    });
  }

  // Simulate sentiment analysis from reviews
  // In a real implementation, this would come from actual NLP on review text
  const sentimentAnalysis = {
    pricing_fairness: rating >= 4.0 ? 'positive' : 'mixed',
    negotiation_experience: rating >= 4.0 ? 'positive' : 'mixed',
    pressure_tactics: rating >= 4.0 ? 'low' : 'moderate',
    transparency: rating >= 4.0 ? 'high' : 'moderate',
    common_complaints:
      rating < 4.0 ? ['pricing', 'negotiation', 'finance_office'] : [],
  };

  return {
    rating: rating,
    review_count: reviewCount,
    sentiment_analysis: sentimentAnalysis,
    negotiation_flexibility: negotiationFlexibility,
    reputation_leverage: reputationLeverage,
  };
}

/**
 * Derives real-time inventory alerts
 * Identifies market changes that create negotiation opportunities
 */
function deriveInventoryAlerts(marketCheckData: any) {
  if (!marketCheckData) {
    return {
      alerts: [],
      inventory_changes: {},
      opportunity_score: 0,
    };
  }

  const alerts = [];
  let opportunityScore = 50; // Default neutral score

  // Check days on market
  const daysOnMarket = parseInt(marketCheckData.dom) || 0;
  if (daysOnMarket > 60) {
    alerts.push({
      type: 'aging_inventory',
      severity: 'high',
      message: `Vehicle has been on the lot for ${daysOnMarket} days, well above average`,
      action: 'Use as negotiation leverage for substantial discount',
    });
    opportunityScore += 15;
  } else if (daysOnMarket > 30) {
    alerts.push({
      type: 'aging_inventory',
      severity: 'moderate',
      message: `Vehicle has been on the lot for ${daysOnMarket} days`,
      action: 'Mention during negotiation for modest leverage',
    });
    opportunityScore += 8;
  }

  // Check price changes
  if (
    marketCheckData.price_changes &&
    marketCheckData.price_changes.length > 0
  ) {
    const priceChanges = marketCheckData.price_changes;
    const recentPriceDrops = priceChanges.filter(
      (change: any) => change.change < 0
    );

    if (recentPriceDrops.length > 0) {
      const totalDrop = recentPriceDrops.reduce(
        (sum: number, change: any) => sum + change.change,
        0
      );

      alerts.push({
        type: 'price_drops',
        severity: totalDrop < -500 ? 'high' : 'moderate',
        message: `Price has dropped ${Math.abs(totalDrop)} in the last 30 days`,
        action: 'Indicates motivated seller, push for further reductions',
      });

      opportunityScore += Math.min(Math.abs(totalDrop) / 100, 20);
    }
  }

  // Check similar inventory volume
  const similarInventoryCount = marketCheckData.similar_vehicles?.count || 0;
  if (similarInventoryCount > 20) {
    alerts.push({
      type: 'high_inventory',
      severity: 'moderate',
      message: `${similarInventoryCount} similar vehicles available in your area`,
      action: 'Use inventory oversupply as negotiation leverage',
    });
    opportunityScore += 10;
  }

  // Check competitive price changes in market
  const inventoryChanges = {
    new_listings_7d: Math.floor(Math.random() * 10) + 1, // Simulated data
    price_drops_7d: Math.floor(Math.random() * 8) + 1, // Simulated data
    avg_price_change: -Math.floor(Math.random() * 500) - 100, // Simulated data
  };

  if (inventoryChanges.price_drops_7d > 3) {
    alerts.push({
      type: 'market_shifts',
      severity: 'moderate',
      message: `${inventoryChanges.price_drops_7d} similar vehicles have dropped in price recently`,
      action: 'Market is shifting in your favor, negotiate accordingly',
    });
    opportunityScore += 7;
  }

  return {
    alerts: alerts,
    inventory_changes: inventoryChanges,
    opportunity_score: Math.min(opportunityScore, 100), // Cap at 100
  };
}

/**
 * Derives dealer incentive intelligence
 * Uncovers hidden manufacturer-to-dealer incentives
 */
function deriveDealerIncentiveIntelligence(marketCheckData: any) {
  if (!marketCheckData) {
    return {
      estimated_incentives: [],
      total_incentive_value: 0,
      negotiation_tactics: [],
    };
  }

  const make = marketCheckData.make || '';
  const model = marketCheckData.model || '';
  const year = parseInt(marketCheckData.year) || new Date().getFullYear();
  const price = parseFloat(marketCheckData.price) || 0;

  // In a real implementation, this would query a dealer incentive database
  // Here we're simulating the data based on common manufacturer programs

  const estimatedIncentives = [];
  let totalIncentiveValue = 0;

  // Check for potential factory-to-dealer incentives based on make/model/year
  if (year < new Date().getFullYear()) {
    // Prior model year likely has incentives
    const clearanceIncentive = Math.round(price * 0.03); // ~3% dealer incentive for clearing old inventory
    estimatedIncentives.push({
      type: 'model_year_clearance',
      amount: clearanceIncentive,
      description: 'Manufacturer incentive to clear previous model year',
      confidence: 'high',
    });
    totalIncentiveValue += clearanceIncentive;
  }

  // Check for potential volume-based dealer incentives
  const volumeIncentive = Math.round(price * 0.02); // ~2% for volume targets
  estimatedIncentives.push({
    type: 'volume_bonus',
    amount: volumeIncentive,
    description: 'Potential volume-based dealer incentive from manufacturer',
    confidence: 'medium',
  });
  totalIncentiveValue += volumeIncentive;

  // Check for specific makes known for strong dealer incentives
  if (
    ['Buick', 'Chrysler', 'Dodge', 'Ford', 'GMC', 'Chevrolet', 'RAM'].includes(
      make
    )
  ) {
    const domesticIncentive = Math.round(price * 0.04); // Domestic brands often have higher incentives
    estimatedIncentives.push({
      type: 'manufacturer_support',
      amount: domesticIncentive,
      description:
        'Additional manufacturer-to-dealer support common for this brand',
      confidence: 'medium',
    });
    totalIncentiveValue += domesticIncentive;
  }

  // Generate negotiation tactics based on incentives
  const negotiationTactics = [
    {
      name: 'incentive_knowledge',
      script: `I'm aware that ${make} is offering dealer incentives on ${year} ${model}s right now. That gives you additional flexibility beyond what the window sticker shows.`,
    },
    {
      name: 'volume_goals',
      script: `I understand that hitting your monthly sales targets is important, and manufacturers reward that. I'd like a deal that helps us both.`,
    },
  ];

  if (totalIncentiveValue > price * 0.05) {
    negotiationTactics.push({
      name: 'substantial_incentives',
      script: `The factory-to-dealer incentives on this vehicle likely exceed $${Math.round(totalIncentiveValue / 1000) * 1000}, which we should factor into our negotiations.`,
    });
  }

  return {
    estimated_incentives: estimatedIncentives,
    total_incentive_value: totalIncentiveValue,
    negotiation_tactics: negotiationTactics,
  };
}

/**
 * Derives add-on value calculator insights
 * Evaluates dealer add-ons against fair market value
 */
function deriveAddOnValueCalculator(marketCheckData: any) {
  // Common dealer add-ons and their fair market values vs. typical dealer prices
  const commonAddOns = [
    {
      name: 'Extended Warranty',
      dealer_price: 1995,
      fair_value: 1100,
      negotiation_target: 1200,
      value_rating: 'poor',
      alternatives: 'Third-party warranties, manufacturer extensions',
      negotiation_script:
        "I've researched extended warranties and would consider one at $1,200, which still provides good profit margin.",
    },
    {
      name: 'Paint Protection',
      dealer_price: 895,
      fair_value: 300,
      negotiation_target: 400,
      value_rating: 'very_poor',
      alternatives: 'Aftermarket ceramic coating, DIY protection',
      negotiation_script:
        "The paint protection package is significantly overpriced at $895. I'd consider it at $400 maximum.",
    },
    {
      name: 'GAP Insurance',
      dealer_price: 795,
      fair_value: 350,
      negotiation_target: 400,
      value_rating: 'poor',
      alternatives: 'Insurance company GAP coverage, credit union GAP',
      negotiation_script:
        "My research shows the fair market rate for GAP is around $350-400. I'd need to see that pricing to consider it.",
    },
    {
      name: 'Nitrogen Tire Fill',
      dealer_price: 195,
      fair_value: 0,
      negotiation_target: 0,
      value_rating: 'worthless',
      alternatives: 'Regular air (78% nitrogen naturally)',
      negotiation_script:
        'This add-on provides virtually no benefit and should be removed entirely.',
    },
    {
      name: 'Window Tinting',
      dealer_price: 595,
      fair_value: 250,
      negotiation_target: 300,
      value_rating: 'poor',
      alternatives: 'Local tint shops, mobile tinting services',
      negotiation_script:
        "Window tinting from specialty shops costs $250-300 with lifetime warranties. I'd need similar pricing.",
    },
    {
      name: 'Wheel Locks',
      dealer_price: 129,
      fair_value: 50,
      negotiation_target: 60,
      value_rating: 'poor',
      alternatives: 'Auto parts store locks, online retailers',
      negotiation_script:
        "These exact locks retail for $50. I'd pay $60 for your installation.",
    },
    {
      name: 'Fabric Protection',
      dealer_price: 395,
      fair_value: 0,
      negotiation_target: 0,
      value_rating: 'worthless',
      alternatives: 'DIY fabric protector ($10-20)',
      negotiation_script:
        "This coating has no demonstrable value beyond DIY solutions. I'd need this removed from the deal.",
    },
  ];

  // Detect which add-ons might be on the vehicle based on price analysis
  // In a real implementation, this would use actual vehicle data
  const msrp = parseFloat(marketCheckData.msrp) || 0;
  const price = parseFloat(marketCheckData.price) || 0;

  // If price is suspiciously close to or above MSRP, likely has add-ons
  const likelyHasAddOns = price >= msrp * 0.98;

  // Customize the response based on whether add-ons are detected
  if (likelyHasAddOns) {
    // Estimate which add-ons might be present based on price delta
    const priceDelta = price - msrp;
    const estimatedAddOns = commonAddOns
      .filter((addOn) => Math.random() > 0.5) // Randomly select some add-ons for demonstration
      .slice(0, 3); // Limit to 3 for simplicity

    // Calculate total add-on markup
    const totalDealerPrice = estimatedAddOns.reduce(
      (sum, addOn) => sum + addOn.dealer_price,
      0
    );
    const totalFairValue = estimatedAddOns.reduce(
      (sum, addOn) => sum + addOn.fair_value,
      0
    );
    const totalMarkup = totalDealerPrice - totalFairValue;

    return {
      detected_add_ons: estimatedAddOns,
      common_add_ons: commonAddOns,
      analysis: {
        total_dealer_price: totalDealerPrice,
        total_fair_value: totalFairValue,
        markup_percentage: Math.round((totalMarkup / totalFairValue) * 100),
        negotiation_opportunity: totalMarkup,
      },
      negotiation_strategy: {
        primary_approach:
          'Remove all low-value add-ons, negotiate fair pricing on others',
        scripts: [
          "I'd like to review each add-on individually rather than bundled in the price",
          "Let's remove these three add-ons that don't provide real value",
          "For the remaining add-ons, I've researched fair market pricing",
        ],
      },
    };
  } else {
    // Return generic information for future add-on decisions
    return {
      detected_add_ons: [],
      common_add_ons: commonAddOns,
      analysis: {
        total_dealer_price: 0,
        total_fair_value: 0,
        markup_percentage: 0,
        negotiation_opportunity: 0,
      },
      negotiation_strategy: {
        primary_approach: 'Resist add-ons during finance process',
        scripts: [
          "I've done my research on add-ons and their market values",
          "I'm prepared to consider add-ons only at fair market prices",
          "Let's discuss the vehicle price first before any add-ons",
        ],
      },
    };
  }
}

/**
 * Derives post-purchase verification insights
 * Confirms whether the user got a good deal after purchase
 */
function derivePostPurchaseVerification(
  finalPrice: number,
  marketCheckData: any
) {
  if (!marketCheckData || !finalPrice) {
    return {
      deal_rating: 'unknown',
      market_position: 'unknown',
      savings_amount: 0,
      percentile_ranking: 0,
      verification_details: {},
    };
  }

  const msrp = parseFloat(marketCheckData.msrp) || 0;
  const listedPrice = parseFloat(marketCheckData.price) || 0;
  const averageMarketPrice =
    marketCheckData.similar_vehicles?.average_price || listedPrice;

  // Calculate savings from different reference points
  const savingsFromMsrp = msrp > 0 ? msrp - finalPrice : 0;
  const savingsFromListed = listedPrice - finalPrice;
  const savingsFromMarket = averageMarketPrice - finalPrice;

  // Calculate percentile
  let percentileRanking = 50; // Default to median

  if (marketCheckData.similar_vehicles?.price_distribution) {
    // This would use actual distribution data in a real implementation
    const distribution = marketCheckData.similar_vehicles.price_distribution;
    const totalVehicles = distribution.reduce(
      (sum: number, range: any) => sum + range.count,
      0
    );
    let vehiclesBelow = 0;

    for (const range of distribution) {
      if (range.max < finalPrice) {
        vehiclesBelow += range.count;
      } else if (range.min <= finalPrice && range.max >= finalPrice) {
        // Approximate position within this range
        const rangeWidth = range.max - range.min;
        const positionInRange = (finalPrice - range.min) / rangeWidth;
        vehiclesBelow += range.count * positionInRange;
        break;
      }
    }

    percentileRanking = (vehiclesBelow / totalVehicles) * 100;
  }

  // Determine deal rating
  let dealRating = 'good'; // Default

  if (savingsFromMarket > averageMarketPrice * 0.1) {
    dealRating = 'exceptional';
  } else if (savingsFromMarket > 0) {
    dealRating = 'good';
  } else if (savingsFromMarket > -averageMarketPrice * 0.05) {
    dealRating = 'fair';
  } else {
    dealRating = 'poor';
  }

  // Determine market position text
  let marketPosition = 'at market average';

  if (percentileRanking <= 15) {
    marketPosition = 'among the best prices in the market';
  } else if (percentileRanking <= 33) {
    marketPosition = 'better than most in the market';
  } else if (percentileRanking >= 67) {
    marketPosition = 'higher than most in the market';
  }

  return {
    deal_rating: dealRating,
    market_position: marketPosition,
    savings: {
      from_msrp: Math.round(savingsFromMsrp),
      from_listed_price: Math.round(savingsFromListed),
      from_market_average: Math.round(savingsFromMarket),
    },
    percentile_ranking: Math.round(percentileRanking),
    verification_details: {
      similar_vehicles_analyzed: marketCheckData.similar_vehicles?.count || 0,
      price_distribution:
        marketCheckData.similar_vehicles?.price_distribution || [],
      local_sale_examples: [
        // In a real implementation, these would be actual recent sales
        {
          price: Math.round(finalPrice * 0.92),
          distance: '10 miles',
          date: '2 weeks ago',
        },
        {
          price: Math.round(finalPrice * 1.05),
          distance: '15 miles',
          date: '1 week ago',
        },
        {
          price: Math.round(finalPrice * 0.97),
          distance: '25 miles',
          date: '3 days ago',
        },
      ],
    },
  };
}

/**
 * New function to verify a completed purchase
 * This would be called after the user completes a purchase to verify their deal
 */
export async function verifyPurchase(
  vin: string,
  finalPrice: number,
  token: string
): Promise<any> {
  try {
    // Get basic vehicle data from MarketCheck
    const marketCheckData = await marketCheckServices.fetchVinSpecs(vin, token);

    // Generate post-purchase verification
    return derivePostPurchaseVerification(finalPrice, marketCheckData);
  } catch (error: any) {
    console.error('Error verifying purchase:', error.message);
    throw error;
  }
}