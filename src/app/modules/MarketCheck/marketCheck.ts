import axios from 'axios';
import { config } from '../../config/config';

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

const generateEndpoint = (type: TEndpointType, vin?: string): string => {
  const endpoints: { [key in TEndpointType]: string } = {
    active_listing: '/search/car/active',
    vehicle_history: `/history/car/${vin}`,
    vin_decode: `/decode/car/${vin}/specs`,
    delear_search: `/dealers/car`,
    market_depth_analysis: `/market/depth/car`,
    market_dtrends: `/market/trends/car`,
    price_prediction: `/predict/car/price/${vin}`,
  };
  return config.market_check_base_url + endpoints[type];
};

const marketCheckApi = async ({
  type,
  vin,
  params = {},
}: {
  type: TEndpointType;
  vin?: string;
  params?: Record<string, any>;
}) => {
  const response = await axios.get(generateEndpoint(type, vin), {
    params: { ...params, api_key: config.market_check_api },
  });
  return response.data;
};

export default marketCheckApi;
