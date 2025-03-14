export interface ListingResponse {
  id: string;
  vin: string;
  price: number;
  miles: number;
  dealer_id?: string;
  seller_type: 'private' | 'dealer' | 'auction';
  media?: {
    photo_links: string[];
    video_links?: string[];
  };
}

export interface DealerResponse {
  id: string;
  name: string;
  address: string;
  phone: string;
  rating?: number;
  inventory_count?: number;
}

export interface MarketStatsResponse {
  average_price: number;
  price_range: {
    low: number;
    high: number;
  };
  days_on_market: number;
  similar_listings_count: number;
}

export interface BaseResponse {
  success: boolean;
  data?: any;
  error?: string;
}

// Response validators
export const validators = {
  listing: (data: any): data is ListingResponse => {
    return Boolean(
      data &&
      typeof data.id === 'string' &&
      typeof data.vin === 'string' &&
      typeof data.price === 'number' &&
      typeof data.miles === 'number' &&
      ['private', 'dealer', 'auction'].includes(data.seller_type)
    );
  },

  dealer: (data: any): data is DealerResponse => {
    return Boolean(
      data &&
      typeof data.id === 'string' &&
      typeof data.name === 'string' &&
      typeof data.address === 'string' &&
      typeof data.phone === 'string'
    );
  },

  marketStats: (data: any): data is MarketStatsResponse => {
    return Boolean(
      data &&
      typeof data.average_price === 'number' &&
      data.price_range &&
      typeof data.price_range.low === 'number' &&
      typeof data.price_range.high === 'number' &&
      typeof data.days_on_market === 'number'
    );
  }
};

export const validateResponse = (data: any): data is BaseResponse => {
  return data && typeof data.success === 'boolean';
}; 