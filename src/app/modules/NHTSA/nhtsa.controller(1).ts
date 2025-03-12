import { Request, Response } from 'express';
import {
  decodeVin,
  getAllNHTSADataByMMY,
  getAllNHTSADataByVin,
  getComplaintsByMMY,
  getComplaintsByVin,
  getRecallsByMMY,
  getRecallsByDecodedVin,
  getSafetyRatingsByMMY,
  getSafetyRatingsByVin,
  getVehicleDataByVin,
} from './nhtsa.services';

export const decodeVinController = async (req: Request, res: Response) => {
  try {
    const { vin, user_id } = req.params;

    const vehicleData = await decodeVin(vin, user_id);
    res.status(200).json({ success: true, data: vehicleData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getSafetyRatingsController = async (
  req: Request,
  res: Response
) => {
  try {
    const { vin, user_id } = req.params;

    const safetyRatings = await getSafetyRatingsByVin(vin, user_id);
    res.status(200).json({ success: true, data: safetyRatings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// export const getSafetyRatingsByMMYController = async (
//   req: Request,
//   res: Response
// ) => {
//   try {
//     const { make, model, year, user_id } = req.params;

//     const safetyRatings = await getSafetyRatingsByMMY(
//       make,
//       model,
//       year,
//       user_id
//     );
//     res.status(200).json({ success: true, data: safetyRatings });
//   } catch (error: any) {
//     res.status(500).json({ success: false, message: error.message });
//   }
// };

export const getRecallsByVinController = async (
  req: Request,
  res: Response
) => {
  try {
    const { vin, user_id } = req.params;

    const recalls = await getRecallsByDecodedVin(vin, user_id);
    res.status(200).json({ success: true, data: recalls });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// New One
// export async function getRecallsController(req: Request, res: Response) {
//   try {
//     const { make, model, year } = req.query;
//     const { user_id } = req.params;

//     if (!make || !model || !year) {
//       return;
//     }

//     const recalls = await getRecallsByMMY(
//       make as string,
//       model as string,
//       year as string,
//       user_id as string
//     );
//     res.json(recalls);
//   } catch (error: any) {
//     console.error('Error in recall controller:', error.message);
//     res.status(500).json({ message: 'Internal server error' });
//   }
// }

export const getComplaintsByVinController = async (
  req: Request,
  res: Response
) => {
  try {
    const { vin, user_id } = req.params;

    const complaints = await getComplaintsByVin(vin, user_id);
    res.status(200).json({ success: true, data: complaints });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// export async function getComplaintsController(req: Request, res: Response) {
//   try {
//     const { make, model, year } = req.query;
//     if (!make || !model || !year) {
//       return;
//     }

//     const complaints = await getComplaintsByMMY(
//       make as string,
//       model as string,
//       year as string,
//       ""
//     );
//     res.json({ success: true, data: complaints });
//   } catch (error: any) {
//     res.status(500).json({ error: error.message });
//   }
// }

export const getAllNHTSADataByVinController = async (
  req: Request,
  res: Response
) => {
  try {
    const { vin } = req.params;

    const nhtsaData = await getAllNHTSADataByVin(vin);
    res.status(200).json({ success: true, data: nhtsaData });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// New One
export async function getAllNHTSADataController(req: Request, res: Response) {
  try {
    const { make, model, year } = req.query;
    if (!make || !model || !year) {
      return;
    }

    const data = await getAllNHTSADataByMMY(
      make as string,
      model as string,
      year as string
    );
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}

export async function processVinAndFetchNHTSAData(req: Request, res: Response) {
  try {
    const { vin } = req.query;
    if (!vin) {
      return;
    }

    const data = await getVehicleDataByVin(vin as string);
    res.json({ success: true, data });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Internal Server Error' });
  }
}
