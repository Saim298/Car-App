import { Request, Response } from 'express';
import {
  EnrichedVehicleListing,
  NHTSAData,
  UnifiedVehicleData,
} from '../MarketCheck/marketCheck.types';
import {
  enrichVehicleListing,
  getCompleteVehicleByVin,
  getMarketCheckData,
  getMarketCheckData_vin,
  searchVehiclesWithCompleteInfo,
  transformVehicleData,
  transformVehicleData_1,
  verifyPurchase,
} from './marketCheck.nhtsa.integration';

export const vehicleController = {
  transformVehicleData: (req: Request, res: Response): void => {
    const {
      marketCheckData,
      nhtsaData,
    }: { marketCheckData: any; nhtsaData: NHTSAData } = req.body;

    // Validate input
    if (!marketCheckData || !nhtsaData) {
      res
        .status(400)
        .json({ error: 'marketCheckData and nhtsaData are required' });
      return;
    }

    try {
      // Transform the data
      const unifiedVehicleData: UnifiedVehicleData = transformVehicleData(
        marketCheckData,
        nhtsaData
      );

      // Send the transformed data as a response
      res.status(200).json(unifiedVehicleData);
    } catch (error: any) {
      // Handle errors
      res
        .status(500)
        .json({ error: 'Internal server error', details: error.message });
    }
  },
  transformVehicleData_1: async (req: Request, res: Response): Promise<void> => {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'marketCheckData and nhtsaData are required' });
      return;
    }

    try {
      const unifiedVehicleData = await transformVehicleData_1(user_id);
      console.log(unifiedVehicleData);
      res.status(200).json(unifiedVehicleData);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },
  getMarketCheckData_vin: async (req: Request, res: Response): Promise<void> => {
    const { user_id } = req.params;

    if (!user_id) {
      res.status(400).json({ error: 'user id are required' });
      return;
    }

    try {
      const unifiedVehicleData = await getMarketCheckData_vin(user_id);
      console.log(unifiedVehicleData);
      res.status(200).json(unifiedVehicleData);
    } catch (error: any) {
      res.status(500).json({ error: 'Internal server error', details: error.message });
    }
  },

  getCompleteVehicleByVin: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const token = req.headers.authorization?.split(' ')[1];
    const { vin } = req.params;

    // Validate input
    if (!vin || !token) {
      res.status(400).json({ error: 'VIN and token are required' });
      return;
    }

    try {
      // Fetch complete vehicle data
      const vehicleData: UnifiedVehicleData = await getCompleteVehicleByVin(
        vin,
        token
      );

      // Send the response
      res.status(200).json(vehicleData);
    } catch (error: any) {
      // Handle errors
      console.error('Error in getCompleteVehicleByVin:', error.message);
      res
        .status(500)
        .json({ error: 'Internal server error', details: error.message });
    }
  },
  searchVehiclesWithCompleteInfo: async (
    req: Request,
    res: Response
  ): Promise<void> => {
    const { params }: { params: Record<string, any> } = req.body;
    const token = req.headers.authorization?.split(' ')[1];

    // Validate input
    if (!params || !token) {
      res.status(400).json({ error: 'params and token are required' });
      return;
    }

    try {
      // Search for vehicles with complete info
      const searchResults = await searchVehiclesWithCompleteInfo(params, token);

      // Send the response
      res.status(200).json(searchResults);
    } catch (error: any) {
      // Handle errors
      console.error('Error in searchVehiclesWithCompleteInfo:', error.message);
      res
        .status(500)
        .json({ error: 'Internal server error', details: error.message });
    }
  },
  enrichVehicleListing: async (req: Request, res: Response): Promise<void> => {
    const { listing, token }: { listing: any; token: string } = req.body;

    // Validate input
    if (!listing || !token) {
      res.status(400).json({ error: 'listing and token are required' });
      return;
    }

    try {
      // Enrich the vehicle listing with NHTSA data
      const enrichedListing: EnrichedVehicleListing =
        await enrichVehicleListing(listing, token);

      // Send the response
      res.status(200).json(enrichedListing);
    } catch (error: any) {
      // Handle errors
      console.error('Error in enrichVehicleListing:', error.message);
      res
        .status(500)
        .json({ error: 'Internal server error', details: error.message });
    }
  },
  verifyPurchase: async (req: Request, res: Response): Promise<void> => {
    const {
      vin,
      finalPrice,
    }: { vin: string; finalPrice: number; token: string } = req.body;
    
    const token = req.headers.authorization?.split(' ')[1];
    // Validate input
    if (!vin || !finalPrice || !token) {
      res
        .status(400)
        .json({ error: 'vin, finalPrice, and token are required' });
      return;
    }

    try {
      // Verify the purchase
      const verificationResult = await verifyPurchase(vin, finalPrice, token);

      // Send the response
      res.status(200).json(verificationResult);
    } catch (error: any) {
      // Handle errors
      console.error('Error in verifyPurchase:', error.message);
      res
        .status(500)
        .json({ error: 'Internal server error', details: error.message });
    }
  },

  fetchMarketCheckData: async (req: Request, res: Response) => {
    const { userId } = req.params;
    if (!userId) {
      return;
    }
    console.log(userId);

    try {
      const data = await getMarketCheckData(userId);
      if (!data) {
        return;
      }
      res.json({ marketCheckData: data });
    } catch (error) {
      res.status(500).json({ error: 'Server error', details: error });
    }
  },
};
