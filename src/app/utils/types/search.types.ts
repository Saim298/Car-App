// Search Types
export interface VehicleSearchOptions {
  vin: string;
  searchTypes: SearchType[];
  includeMedia?: boolean;
  includeMarketData?: boolean;
}

export type SearchType = 'private' | 'dealer' | 'auction';

// Private Party Search
export interface PrivatePartySearch {
  endpoints: {
    listings: '/search/car-fsbo-active';
    details: '/search/listing-car-fsbo/:id';
    media: '/search/listing-car-media/:id';
    extraDetails: '/search/listing-car-extra/:id';
  };
  params: {
    vin: string;
    radius?: number;
    zip?: string;
    include_price_history?: boolean;
  };
}

// Dealer Search
export interface DealerSearch {
  endpoints: {
    inventory: '/search/active-listings/:vin';
    dealerInfo: '/search/get-car-dealership-info';
    marketStats: '/search/get-car-statistics';
    daysSupply: '/search/market-days-supply';
    salesStats: '/search/get-car-sales-stats';
  };
  params: {
    vin: string;
    radius?: number;
    include_dealer_info?: boolean;
    include_market_stats?: boolean;
  };
}

// Auction Search
export interface AuctionSearch {
  endpoints: {
    activeAuctions: '/search/listing-car-auction-active';
    auctionDetails: '/search/listing-car-auction-listing/:id';
    auctionMedia: '/search/listing-car-auction-media/:id';
    extraDetails: '/search/listing-car-auction/:id';
  };
  params: {
    vin: string;
    auction_type?: 'live' | 'online' | 'both';
    include_ended?: boolean;
  };
} 