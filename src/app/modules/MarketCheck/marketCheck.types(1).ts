export type TEndpointType =
  | 'active_listing'
  | 'vehicle_history'
  | 'vin_decode'
  | 'delear_search'
  | 'market_depth_analysis'
  | 'market_dtrends'
  | 'price_prediction';

export interface IVehicleSearchFilters {
  car_type?: string;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  vin?: string;
  country: string;
  plot?: boolean;
  dealer_type?: string;
  nodedup?: boolean;
  carfax_1_owner?: boolean;
  carfax_clean_title?: boolean;
  include_non_vin_listings: boolean;
  exclude_certified?: boolean;
  photo_links?: boolean;
  stock_no?: string;
  exclude_sources?: string;
  exclude_dealer_ids?: string;
  in_transit?: boolean;
  exclude_dealer_listings?: boolean;
  exclude_make?: string;
}

export interface CarPricePredictionParams {
  car_type: string;
  year: string;
  make: string;
  model: string;
  trim?: string;
  miles?: string;
  base_exterior_color?: string;
  base_interior_color?: string;
  latitude?: string;
  longitude?: string;
  transmission?: string;
  drivetrain?: string;
  highway_mpg?: string;
  city_mpg?: string;
  engine_block?: string;
  engine_size?: string;
  cylinders?: string;
  doors?: string;
}

export interface CarPricePredictionResponse {
  predicted_price: number;
  predicted_price_range: {
    low: number;
    high: number;
  };
  confidence_score: number;
  similar_vehicles: {
    count: number;
    average_price: number;
    price_distribution: {
      min: number;
      max: number;
      std_dev: number;
    };
  };
  market_factors: {
    supply_demand_score: number;
    market_days_supply: number;
    regional_adjustment: number;
  };
}

export interface DealerSearch {
  endpoints: {
    inventory: '/search/car/active';
  };
}

export interface NHTSASpecifications {
  engine: {
    type: string;
    size: string;
    cylinders: string;
    fuel_type: string;
    horsepower: string;
    torque: string;
  };
  transmission: {
    type: string;
    speeds: string;
  };
  drivetrain: string;
  fuel_economy: {
    city: string;
    highway: string;
    combined: string;
  };
  dimensions: {
    wheelbase: string;
    length: string;
    width: string;
    height: string;
  };
  weight: {
    gvwr: string;
    curb_weight: string;
  };
  vehicle_type: string;
  plant: string;
  manufacturer: string;
  series: string;
  body_class: string;
}

export interface NHTSASafetyRatings {
  vehicle_id: string;
  overall_rating: string;
  overall_front_crash_rating: string;
  front_crash_driver_side_rating: string;
  front_crash_passenger_side_rating: string;
  overall_side_crash_rating: string;
  side_crash_driver_side_rating: string;
  side_crash_passenger_side_rating: string;
  rollover_rating: string;
  side_pole_crash_rating: string;
  complaints_count: number;
  recalls_count: number;
  investigation_count: number;
}

export interface NHTSARecall {
  campaign_number: string;
  date: string;
  component: string;
  summary: string;
  consequence: string;
  remedy: string;
  notes: string;
}

export interface NHTSAComplaint {
  id: string;
  date: string;
  component: string;
  summary: string;
  crash: boolean;
  fire: boolean;
  injury: boolean;
  fatality: boolean;
  injury_count: number;
  fatality_count: number;
  failure_mileage: string;
}

export interface NHTSAData {
  specifications: NHTSASpecifications | null;
  safety_ratings: NHTSASafetyRatings | null;
  recalls: NHTSARecall[];
  complaints: NHTSAComplaint[];
}

export interface EnrichedVehicleListing {
  // MarketCheck data fields
  id?: string;
  vin?: string;
  price?: number;
  miles?: number;
  year?: number;
  make?: string;
  model?: string;
  trim?: string;
  
  // NHTSA data - make sure this property name matches what's used in the code
  nhtsa_data?: NHTSAData;  // This should match the property name in enrichVehicleListing
  
  // Any other fields
  [key: string]: any;
}

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

/**
 * Comprehensive unified vehicle data model that combines MarketCheck and NHTSA data
 * with derived analytics fields
 */
export interface UnifiedVehicleData {
  /** Vehicle Identification Number (from MarketCheck & NHTSA) */
  vin: string;
  
  /** Model year (from MarketCheck) */
    year: number;
  
  /** Vehicle manufacturer (from MarketCheck) */
    make: string;
  
  /** Vehicle model (from MarketCheck) */
    model: string;
  
  /** Vehicle trim level (from MarketCheck) */
  trim: string;
  
  /** Vehicle specifications (combined from MarketCheck & NHTSA) */
  specifications: {
    /** Body style/type (from MarketCheck & NHTSA) */
    body_style: string;
    
    /** Vehicle type classification (from NHTSA) */
    vehicle_type: string;
    
    /** Number of doors (from MarketCheck) */
    doors: number;
    
    /** Seating capacity (from MarketCheck) */
    seating_capacity: number;
    
    /** Engine and powertrain information (combined from MarketCheck & NHTSA) */
    engine: {
      /** Engine type/description (from NHTSA) */
      type: string;
      
      /** Engine displacement in liters (from MarketCheck) */
      size: number;
      
      /** Number of cylinders (from MarketCheck) */
      cylinders: number;
      
      /** Fuel type (from MarketCheck) */
      fuel_type: string;
      
      /** Engine horsepower (from NHTSA) */
      horsepower: string;
      
      /** Engine torque (from NHTSA) */
      torque: string;
    };
    
    /** Transmission information (from MarketCheck & NHTSA) */
    transmission: {
      /** Transmission type (automatic, manual, etc.) (from MarketCheck) */
      type: string;
      
      /** Number of transmission speeds (from MarketCheck) */
      speeds: number;
    };
    
    /** Drivetrain type (FWD, RWD, AWD, 4WD) (from MarketCheck) */
    drivetrain: string;
    
    /** Fuel economy information (from NHTSA & MarketCheck) */
    fuel_economy: {
      /** City fuel economy in MPG (from MarketCheck) */
      city: number;
      
      /** Highway fuel economy in MPG (from MarketCheck) */
      highway: number;
      
      /** Combined fuel economy in MPG (from NHTSA) */
      combined: number;
      
      /** Fuel tank capacity in gallons (from MarketCheck) */
      fuel_tank_capacity: number;
    };
    
    /** Vehicle dimensions (from MarketCheck & NHTSA) */
    dimensions: {
      /** Wheelbase length in inches (from MarketCheck) */
      wheelbase: number;
      
      /** Overall vehicle length in inches (from MarketCheck) */
      length: number;
      
      /** Overall vehicle width in inches (from MarketCheck) */
      width: number;
      
      /** Overall vehicle height in inches (from MarketCheck) */
      height: number;
      
      /** Curb weight in pounds (from MarketCheck) */
      curb_weight: number;
      
      /** Gross vehicle weight in pounds (from MarketCheck) */
      gross_weight: number;
    };
    
    /** Vehicle color information (from MarketCheck) */
    colors: {
      /** Exterior color (from MarketCheck) */
      exterior: string;
      
      /** Interior color (from MarketCheck) */
      interior: string;
    };
    
    /** Manufacturing information (from NHTSA) */
    plant: string;
    
    /** Manufacturer name (from NHTSA) */
    manufacturer: string;
    
    /** Vehicle series (from NHTSA) */
    series: string;
  };
  
  /** Safety information (from NHTSA) */
  safety: {
    /** Safety ratings (from NHTSA) */
    ratings: {
      /** Overall safety rating (from NHTSA) */
      overall: string;
      
      /** Front crash rating (from NHTSA) */
      front_crash: string;
      
      /** Side crash rating (from NHTSA) */
      side_crash: string;
      
      /** Rollover rating (from NHTSA) */
      rollover: string;
      
      /** Side pole crash rating (from NHTSA) */
      side_pole_crash: string;
    };
    
    /** Recall information (from NHTSA) */
    recalls: Array<{
      /** Recall campaign number (from NHTSA) */
      campaign_number: string;
      
      /** Recall date (from NHTSA) */
      date: string;
      
      /** Affected component (from NHTSA) */
      component: string;
      
      /** Recall summary (from NHTSA) */
      summary: string;
      
      /** Potential consequences (from NHTSA) */
      consequence: string;
      
      /** Remedy description (from NHTSA) */
      remedy: string;
    }>;
    
    /** Complaint information (from NHTSA) */
    complaints: Array<{
      /** Complaint ID (from NHTSA) */
      id: string;
      
      /** Complaint date (from NHTSA) */
      date: string;
      
      /** Affected component (from NHTSA) */
      component: string;
      
      /** Complaint summary (from NHTSA) */
      summary: string;
      
      /** Whether the complaint involved a crash (from NHTSA) */
      crash: boolean;
      
      /** Whether the complaint involved an injury (from NHTSA) */
      injury: boolean;
      
      /** Number of injuries reported (from NHTSA) */
      injury_count: number;
    }>;
  };
  
  /** Listing information if from a marketplace listing (from MarketCheck) */
  listing?: {
    /** Listing ID (from MarketCheck) */
    id: string;
    
    /** Asking price (from MarketCheck) */
    price: number;
    
    /** Odometer reading in miles (from MarketCheck) */
    miles: number;
    
    /** Days on market (from MarketCheck) */
    days_on_market: number;
    
    /** Seller type (dealer, private, etc.) (from MarketCheck) */
    seller_type: string;
    
    /** Inventory type (new, used, cpo) (from MarketCheck) */
    inventory_type: string;
    
    /** Whether the vehicle is certified pre-owned (from MarketCheck) */
    is_certified: boolean;
    
    /** Whether the vehicle has a clean title (from MarketCheck) */
    is_clean_title: boolean;
    
    /** Whether the vehicle has accident history (from MarketCheck) */
    has_accidents: boolean;
    
    /** Date the listing was last seen (from MarketCheck) */
    last_seen_date: string;
    
    /** Source of the listing (from MarketCheck) */
    source: string;
    
    /** URL to the vehicle detail page (from MarketCheck) */
    vdp_url: string;
    
    /** Dealer information if from a dealer (from MarketCheck) */
    dealer?: {
      /** Dealer ID (from MarketCheck) */
      id: string;
      
      /** Dealer name (from MarketCheck) */
      name: string;
      
      /** Dealer phone number (from MarketCheck) */
      phone: string;
      
      /** Dealer website (from MarketCheck) */
      website: string;
      
      /** Dealer location information (from MarketCheck) */
      location: {
        /** Dealer city (from MarketCheck) */
        city: string;
        
        /** Dealer state (from MarketCheck) */
        state: string;
        
        /** Dealer zip code (from MarketCheck) */
        zip: string;
      };
    };
    
    /** Media information (from MarketCheck) */
    media: {
      /** Photo URLs (from MarketCheck) */
      photos: string[];
      
      /** Video URLs (from MarketCheck) */
      videos: string[];
    };
  };
  
  /** Derived analytics fields (added by our transformation) */
  analysis?: {
    /** Market position analysis (derived) */
    market_position: {
      /** Price comparison to market (below_market, at_market, above_market) (derived) */
      price_comparison: string;
      
      /** Days on market comparison (faster, average, slower) (derived) */
      days_on_market_comparison: string;
      
      /** Dollar difference from average market price (derived) */
      price_delta_from_average: number;
      
      /** Price percentile in the market (derived) */
      price_percentile: number;
    };
    
    /** Value factors analysis (derived) */
    value_factors: {
      /** Estimated dollar impact of condition (derived) */
      condition_impact: number;
      
      /** Estimated dollar impact of mileage (derived) */
      mileage_impact: number;
      
      /** Estimated dollar impact of vehicle history (derived) */
      history_impact: number;
    };
    
    /** Safety summary analysis (derived) */
    safety_summary: {
      /** Recall severity assessment (none, low, medium, high) (derived) */
      recall_severity: string;
      
      /** Complaint severity assessment (none, low, medium, high) (derived) */
      complaint_severity: string;
      
      /** Safety rating summary (excellent, good, average, poor) (derived) */
      safety_rating_summary: string;
    };
  };
  
  /** Metadata about this data record (derived) */
  metadata: {
    /** When this data was created (derived) */
    created_at: string;
    
    /** When this data was last updated (derived) */
    updated_at: string;
    
    /** Data sources used (marketcheck, nhtsa) (derived) */
    data_sources: string[];
    
    /** Data quality score (0-100) based on completeness (derived) */
    data_quality: number;
  };
}
