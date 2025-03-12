import axios from 'axios';
import { safeLog } from '../../utils/safeLogger';

import { v4 as uuidv4 } from 'uuid';
import db from '../../config/db';
const NHTSA_BASE_URL = 'https://vpic.nhtsa.dot.gov/api/vehicles';
const NHTSA_SAFETY_URL = 'https://webapi.nhtsa.gov/api/SafetyRatings';
const NHTSA_SAFETY_URL_1 = 'https://api.nhtsa.gov/SafetyRatings';

const NHTSA_RECALLS_URL = 'https://webapi.nhtsa.gov/api/Recalls/vehicle';
const NHTSA_RECALLS_URL_1 = 'https://api.nhtsa.gov/recalls';
const NHTSA_COMPLAINTS_URL = 'https://webapi.nhtsa.gov/api/Complaints/vehicle';
const NHTSA_COMPLAINTS_URL_1 = 'https://api.nhtsa.gov/complaints';

export async function decodeVin(vin: string, user_id?: string) {
  try {
    if (!vin) {
      return;
    }

    console.log('Decoding VIN with NHTSA API:', vin);
    const response = await axios.get(
      `${NHTSA_BASE_URL}/DecodeVin/${vin}?format=json`
    );
    const results = response.data.Results;

    const requiredVariables: Record<string, string> = {
      Make: 'Make',
      Model: 'Model',
      'Model Year': 'Model_Year',
      'Engine Type': 'Engine_Type',
      'Displacement (L)': 'Displacement_L',
      'Engine Number of Cylinders': 'Engine_Number_Of_Cylinders',
      'Fuel Type - Primary': 'Fuel_Type_Primary',
      'Engine Brake (hp)': 'Engine_Brake_HP',
      'Transmission Style': 'Transmission_Style',
      'Transmission Speeds': 'Transmission_Speeds',
      'Drive Type': 'Drive_Type',
      'Wheelbase (inches)': 'Wheelbase',
      'Overall Length (inches)': 'Overall_Length',
      'Overall Width (inches)': 'Overall_Width',
      'Overall Height (inches)': 'Overall_Height',
      'Gross Vehicle Weight Rating': 'GVWR',
      'Curb Weight (pounds)': 'Curb_Weight_Pounds',
      'Vehicle Type': 'Vehicle_Type',
      'Plant City': 'Plant_City',
      'Manufacturer Name': 'Manufacturer_Name',
      Series: 'Series',
      'Body Class': 'Body_Class',
    };

    const extractedData: Record<string, string | null> = {
      id: uuidv4(),
      vin: vin,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    results.forEach((item: { Variable: string; Value: string }) => {
      if (requiredVariables[item.Variable]) {
        extractedData[requiredVariables[item.Variable]] = item.Value || null;
      }
    });

    if (user_id) {
      extractedData.user_id = user_id;

      console.log('Inserting Data into nhtsa_vin_decode:', extractedData);
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO nhtsa_vin_decode SET ?',
          extractedData,
          (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result);
            }
          }
        );
      });
    }

    return results;
  } catch (error: any) {
    console.error('Error decoding VIN:', error.message);
    throw error;
  }
}

// Get safety ratings by VIN
export async function getSafetyRatingsByVin(vin: string, user_id: string) {
  try {
    console.log('Getting safety ratings by VIN:', vin);
    if (!vin || vin.trim() === '') {
      return;
    }

    // First, get the NHTSA vehicle ID using the VIN
    const vehicleInfo = await decodeVin(vin, '');
    const make = getValueFromResults(vehicleInfo, 'Make');
    const model = getValueFromResults(vehicleInfo, 'Model');
    const year = getValueFromResults(vehicleInfo, 'Model Year');

    console.log(`Extracted MMY: ${year} ${make} ${model}`);

    // Then get safety ratings using make/model/year
    return await getSafetyRatingsByMMY(make, model, year, user_id, vin);
  } catch (error: any) {
    console.error('Error getting safety ratings by VIN:', error.message);
    throw error;
  }
}

export async function getSafetyRatingsByMMY(
  make: string,
  model: string,
  year: string,
  user_id: string,
  vin: string
) {
  try {
    console.log(`Getting safety ratings by MMY: ${year} ${make} ${model}`);

    if (!make || !model || !year || !user_id || !vin) {
      console.error('Missing required parameters');
      return;
    }

    const response = await axios.get(
      `${NHTSA_SAFETY_URL_1}/modelyear/${year}/make/${make}/model/${model}`
    );
    const vehicles = response.data.Results;

    if (!vehicles.length) {
      console.log('No vehicles found.');
      return [];
    }

    const vehicleDetails = await Promise.all(
      vehicles.map(async (vehicle: { VehicleId: number }) => {
        const vehicleResponse = await axios.get(
          `${NHTSA_SAFETY_URL_1}/VehicleId/${vehicle.VehicleId}`
        );
        const data = vehicleResponse.data.Results[0];

        const extractedData = {
          id: uuidv4(),
          user_id,
          vin, // Store the VIN
          vehicle_id: data.VehicleId || null,
          overall_rating: data.OverallRating || null,
          overall_front_crash_rating: data.OverallFrontCrashRating || null,
          front_crash_driverside_rating:
            data.FrontCrashDriversideRating || null,
          front_crash_passengerside_rating:
            data.FrontCrashPassengersideRating || null,
          overall_side_crash_rating: data.OverallSideCrashRating || null,
          side_crash_driverside_rating: data.SideCrashDriversideRating || null,
          side_crash_passengerside_rating:
            data.SideCrashPassengersideRating || null,
          rollover_rating: data.RolloverRating || null,
          side_pole_rating: data.SidePoleCrashRating || null,
          complaints_count: data.ComplaintsCount || 0,
          recalls_count: data.RecallsCount || 0,
          investigation_count: data.InvestigationCount || 0,
        };

        if (user_id) {
          console.log(
            'Inserting Data into nhtsa_safety_rating:',
            extractedData
          );
          await new Promise((resolve, reject) => {
            db.query(
              'INSERT INTO nhtsa_safety_rating SET ?',
              extractedData,
              (err, result) => {
                if (err) {
                  reject(err);
                } else {
                  resolve(result);
                }
              }
            );
          });
        }

        return extractedData;
      })
    );

    return vehicleDetails;
  } catch (error: any) {
    console.error('Error getting safety ratings:', error.message);
    throw error;
  }
}

// Get recalls by VIN
// Through VIN It cannot be called
export async function getRecallsByDecodedVin(vin: string, user_id: string) {
  try {
    console.log('Getting recalls by VIN:', vin);
    if (!vin || vin.trim() === '') return;

    // Decode VIN to extract Make, Model, and Year
    const vehicleInfo = await decodeVin(vin, '');

    const make = getValueFromResults(vehicleInfo, 'Make');
    const model = getValueFromResults(vehicleInfo, 'Model');
    const year = getValueFromResults(vehicleInfo, 'Model Year');

    console.log(`Extracted MMY: ${year} ${make} ${model}`);

    // Fetch recalls using Make, Model, and Year
    return await getRecallsByMMY(make, model, year, vin, user_id);
  } catch (error: any) {
    console.error('Error getting recalls by VIN:', error.message);
    throw error;
  }
}



export async function getRecallsByMMY(
  make: string,
  model: string,
  year: string,
  vin: string,
  user_id: string
) {
  try {
    console.log(
      `Getting recalls for ${year} ${make} ${model} (VIN: ${vin}) by user ${user_id}`
    );
    if (!make || !model || !year || !vin || !user_id) return;

    const response = await axios.get(
      `${NHTSA_RECALLS_URL_1}/recallsByVehicle?make=${make}&model=${model}&modelYear=${year}`
    );

    const recalls = response.data.results;
    if (!recalls || recalls.length === 0) return;

    const formattedRecalls = recalls.map((recall: any) => ({
      id: uuidv4(),
      user_id: user_id,
      vin: vin,
      campaign_number: recall.NHTSACampaignNumber || null,
      report_received_date: recall.ReportReceivedDate || null,
      component: recall.Component || null,
      summary: recall.Summary || null,
      consequence: recall.Consequence || null,
      remedy: recall.Remedy || null,
      notes: recall.Notes || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    for (const recall of formattedRecalls) {
      await new Promise((resolve, reject) => {
        db.query('INSERT INTO nhtsa_recalls SET ?', recall, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }

    console.log(
      `Inserted ${formattedRecalls.length} recalls into nhtsa_recalls`
    );
    return formattedRecalls;
  } catch (error: any) {
    console.error('Error getting recalls:', error.message);
    throw error;
  }
}

export async function insertRecallsIntoDB(user_id: string, recalls: any[]) {
  if (!user_id || !Array.isArray(recalls) || recalls.length === 0) {
    console.error('Invalid user_id or empty recalls data');
    return;
  }

  try {
    const formattedRecalls = recalls.map((recall) => ({
      id: uuidv4(),
      user_id,
      campaign_number: recall.NHTSACampaignNumber || null,
      report_received_date: recall.ReportReceivedDate || null,
      component: recall.Component || null,
      summary: recall.Summary || null,
      consequence: recall.Consequence || null,
      remedy: recall.Remedy || null,
      notes: recall.Notes || null,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    for (const recall of formattedRecalls) {
      await new Promise((resolve, reject) => {
        db.query('INSERT INTO nhtsa_recalls SET ?', recall, (err, result) => {
          if (err) {
            reject(err);
          } else {
            resolve(result);
          }
        });
      });
    }

    console.log('Recalls successfully inserted into nhtsa_recalls');
  } catch (error: any) {
    console.error('Error inserting recalls into database:', error.message);
    throw error;
  }
}

// Get complaints by VIN
export async function getComplaintsByVin(vin: string, user_id: string) {
  try {
    console.log('Getting complaints by VIN:', vin);
    if (!vin || vin.trim() === '') return;

    // Decode VIN to extract Make, Model, and Year
    const vehicleInfo = await decodeVin(vin, '');

    const make = getValueFromResults(vehicleInfo, 'Make');
    const model = getValueFromResults(vehicleInfo, 'Model');
    const year = getValueFromResults(vehicleInfo, 'Model Year');

    console.log(`Extracted MMY: ${year} ${make} ${model}`);

    // Fetch complaints using Make, Model, and Year
    return await getComplaintsByMMY(make, model, year, vin, user_id);
  } catch (error: any) {
    console.error('Error getting complaints by VIN:', error.message);
    throw error;
  }
}

// New One replaced above one

export async function getComplaintsByMMY(
  make: string,
  model: string,
  year: string,
  vin: string,
  user_id: string
) {
  try {
    console.log(
      `Getting complaints for ${year} ${make} ${model} (VIN: ${vin}) by user ${user_id}`
    );
    if (!make || !model || !year || !vin || !user_id) return;

    // Check how many complaints already exist for this VIN
    const existingCount = await new Promise<number>((resolve, reject) => {
      db.query(
        'SELECT COUNT(*) AS count FROM nhtsa_complaints WHERE vin = ?',
        [vin],
        (err, results) => {
          if (err) reject(err);
          else resolve(results[0].count);
        }
      );
    });

    if (existingCount >= 50) {
      console.log(`Skipping insert: VIN ${vin} already has ${existingCount} complaints.`);
      return;
    }

    const response = await axios.get(
      `${NHTSA_COMPLAINTS_URL_1}/complaintsByVehicle?make=${make}&model=${model}&modelYear=${year}`
    );

    const complaints = response.data.results;
    if (!complaints || complaints.length === 0) return;

    const formattedComplaints = complaints.map((complaint: any) => ({
      id: uuidv4(),
      user_id: user_id,
      vin: vin,
      odi_number: complaint.odiNumber,
      incident_date: complaint.dateOfIncident,
      component: complaint.components,
      summary: complaint.summary,
      crash: complaint.crash ? 1 : 0,
      fire: complaint.fire ? 1 : 0,
      injury: complaint.numberOfInjuries > 0 ? 1 : 0,
      fatality: complaint.numberOfDeaths > 0 ? 1 : 0,
      injury_count: complaint.numberOfInjuries,
      fatality_count: complaint.numberOfDeaths,
      failure_mileage: complaint.failureMileage || null,
    }));

    // Ensure total complaints do not exceed 50
    const remainingSlots = 50 - existingCount;
    const batchToInsert = formattedComplaints.slice(0, remainingSlots);

    if (batchToInsert.length === 0) {
      console.log(`No room for new complaints for VIN ${vin}. Skipping insert.`);
      return;
    }

    // Insert complaints into the database
    for (const complaint of batchToInsert) {
      await new Promise((resolve, reject) => {
        db.query(
          'INSERT INTO nhtsa_complaints SET ?',
          complaint,
          (err, result) => {
            if (err) reject(err);
            else resolve(result);
          }
        );
      });
    }

    console.log(
      `Inserted ${batchToInsert.length} complaints for VIN ${vin} (Total now: ${
        existingCount + batchToInsert.length
      })`
    );

    return formattedComplaints;
  } catch (error: any) {
    console.error('Error getting complaints:', error.message);
    throw error;
  }
}

// Helper function to extract values from NHTSA results
function getValueFromResults(results: any[], variableName: string): string {
  const item = results.find((item) => item.Variable === variableName);
  return item ? item.Value : '';
}

// Get all NHTSA data for a VIN in a single call
export async function getAllNHTSADataByVin(vin: string) {
  try {
    console.log('Getting all NHTSA data for VIN:', vin);
    if (!vin) {
      return;
    }
    // Make all API calls in parallel
    const [vinDecodeData, recallData, complaintsData] = await Promise.all([
      decodeVin(vin, '').catch((error) => {
        console.error('Error in VIN decode:', error.message);
        return null;
      }),
      getRecallsByDecodedVin(vin, '').catch((error) => {
        console.error('Error in recalls:', error.message);
        return null;
      }),
      getComplaintsByVin(vin, '').catch((error) => {
        console.error('Error in complaints:', error.message);
        return null;
      }),
    ]);

    // Extract make/model/year from VIN decode
    let safetyData = null;
    if (vinDecodeData) {
      const make = getValueFromResults(vinDecodeData, 'Make');
      const model = getValueFromResults(vinDecodeData, 'Model');
      const year = getValueFromResults(vinDecodeData, 'Model Year');

      if (make && model && year) {
        safetyData = await getSafetyRatingsByMMY(
          make,
          model,
          year,
          '',
          vin
        ).catch((error) => {
          console.error('Error in safety ratings:', error.message);
          return null;
        });
      }
    }

    return {
      specifications: formatSpecifications(vinDecodeData),
      // safety_ratings: formatSafetyRatings(safetyData),
      recalls: formatRecalls(recallData),
      complaints: formatComplaints(complaintsData),
    };
  } catch (error: any) {
    console.error('Error getting all NHTSA data:', error.message);
    throw error;
  }
}

export async function getAllNHTSADataByMMY(
  make: string,
  model: string,
  year: string
) {
  try {
    console.log(
      `Getting all formatted NHTSA data for ${year} ${make} ${model}`
    );
    if (!make || !model || !year) return;

    // Fetch all data in parallel
    const [rawRecalls, rawComplaints, rawSafetyRatings] = await Promise.all([
      getRecallsByMMY(make, model, year, '', '').catch((error) => {
        console.error('Error in recalls:', error.message);
        return null;
      }),
      getComplaintsByMMY(make, model, year, '', '').catch((error) => {
        console.error('Error in complaints:', error.message);
        return null;
      }),
      getSafetyRatingsByMMY(make, model, year, '', '').catch((error) => {
        console.error('Error in safety ratings:', error.message);
        return null;
      }),
    ]);

    // Format the fetched data
    const recalls = formatRecalls(rawRecalls);
    const complaints = formatComplaints(rawComplaints);
    const safetyRatings = formatSafetyRatings(rawSafetyRatings);

    return {
      recalls,
      complaints,
      safetyRatings,
    };
  } catch (error: any) {
    console.error('Error getting all formatted NHTSA data:', error.message);
    throw error;
  }
}

export async function getVehicleDataByVin(vin: string) {
  try {
    const vinData = await decodeVin(vin, '');
    if (!vinData || !Array.isArray(vinData)) {
      throw new Error('Failed to decode VIN');
    }

    const extractedData: Record<string, string> = {};
    vinData.forEach((item: { Variable: string; Value: string }) => {
      extractedData[item.Variable] = item.Value;
    });

    const make = extractedData['Make'];
    const model = extractedData['Model'];
    const year = extractedData['Model Year'];

    if (!make || !model || !year) {
      throw new Error('Failed to extract make, model, or year from VIN');
    }

    console.log('Extracted Data:', { make, model, year });

    const nhtsaData = await getAllNHTSADataByMMY(make, model, year);
    return { make, model, year, nhtsaData };
  } catch (error: any) {
    console.error('Error processing VIN:', error.message);
    throw error;
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
    vehicle_type: getValueFromResults(vinDecodeData, 'Vehicle Type'),
    plant: getValueFromResults(vinDecodeData, 'Plant City'),
    manufacturer: getValueFromResults(vinDecodeData, 'Manufacturer Name'),
    series: getValueFromResults(vinDecodeData, 'Series'),
    body_class: getValueFromResults(vinDecodeData, 'Body Class'),
  };
}

function formatSafetyRatings(safetyData: any[] | null | undefined) {
  if (!safetyData || !Array.isArray(safetyData) || safetyData.length === 0)
    return null;

  // Find the most relevant safety rating (usually the first one)
  const rating = safetyData[0];

  return {
    vehicle_id: rating.VehicleId,
    overall_rating: rating.OverallRating,
    overall_front_crash_rating: rating.OverallFrontCrashRating,
    front_crash_driver_side_rating: rating.FrontCrashDriversideRating,
    front_crash_passenger_side_rating: rating.FrontCrashPassengersideRating,
    overall_side_crash_rating: rating.OverallSideCrashRating,
    side_crash_driver_side_rating: rating.SideCrashDriversideRating,
    side_crash_passenger_side_rating: rating.SideCrashPassengersideRating,
    rollover_rating: rating.RolloverRating,
    side_pole_crash_rating: rating.SidePoleRating,
    complaints_count: rating.ComplaintsCount,
    recalls_count: rating.RecallsCount,
    investigation_count: rating.InvestigationCount,
  };
}

function formatRecalls(recallData: any | null) {
  if (!recallData || !recallData.length) return [];

  return recallData.map((recall: any) => ({
    campaign_number: recall.CampaignNumber,
    date: recall.ReportReceivedDate,
    component: recall.Component,
    summary: recall.Summary,
    consequence: recall.Consequence,
    remedy: recall.Remedy,
    notes: recall.Notes,
  }));
}

function formatComplaints(complaintsData: any | null) {
  if (!complaintsData || !complaintsData.length) return [];

  return complaintsData.map((complaint: any) => ({
    id: complaint.ODINumber,
    date: complaint.IncidentDate,
    component: complaint.Component,
    summary: complaint.Summary,
    crash: complaint.Crash === 'Yes',
    fire: complaint.Fire === 'Yes',
    injury: complaint.Injury === 'Yes',
    fatality: complaint.Fatality === 'Yes',
    injury_count: parseInt(complaint.InjuryCount) || 0,
    fatality_count: parseInt(complaint.FatalityCount) || 0,
    failure_mileage: complaint.FailureMileage,
  }));
}
