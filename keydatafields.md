

scripts/test-market-check.ts

import { config } from 'dotenv';
import { createMarketCheckClient } from '../src/lib/market-data/clients';
import { MarketServiceError } from '../src/lib/market-data/errors/market-errors';
import { StandardizedListing } from '../src/lib/types/market';

// Load environment variables from .env file
config();

// Verify credentials with correct env var names
if (!process.env.MARKET_CHECK_API_KEY || !process.env.MARKET_CHECK_API_SECRET) {
  console.error('❌ Missing API credentials in .env file');
  process.exit(1);
}

function transformListing(raw: any): StandardizedListing {
  return {
    // Core Vehicle Info
    id: raw.id,
    vin: raw.vin,
    price: raw.price,
    year: raw.build?.year || parseInt(raw.heading?.split(' ')[0]),
    make: raw.build?.make || raw.heading?.split(' ')[1],
    model: raw.build?.model || raw.heading?.split(' ')[2],
    trim: raw.build?.trim,
    mileage: raw.miles,
    exterior_color: raw.exterior_color,
    interior_color: raw.interior_color,
    transmission: raw.build?.transmission,
    fuel_type: raw.build?.fuel_type,
    drivetrain: raw.build?.drivetrain,
    body_style: raw.build?.body_style,
    doors: raw.build?.doors,

    // Images & Media
    images: {
      primary: raw.media?.photo_links?.[0],
      all: raw.media?.photo_links || [],
      thumbnail: raw.media?.thumbnail,
      interior: raw.media?.interior_photos,
      exterior: raw.media?.exterior_photos
    },

    // Enhanced Dealer Info
    dealer: {
      id: raw.dealer?.id,
      name: raw.dealer?.name,
      franchise_dealer: raw.dealer?.franchise_dealer,
      location: {
        address: raw.dealer?.street,
        city: raw.dealer?.city,
        state: raw.dealer?.state,
        zip: raw.dealer?.zip,
        latitude: raw.dealer?.latitude,
        longitude: raw.dealer?.longitude
      },
      phone: raw.dealer?.phone,
      website: raw.dealer?.website,
      metrics: {
        inventory_count: raw.dealer?.inventory_count || 0,
        average_days_to_sell: raw.dealer?.avg_days_to_sell || 0,
        price_competitiveness: raw.dealer?.price_competitiveness || 0,
        customer_rating: raw.dealer?.rating || 0
      },
      services: {
        financing_available: raw.dealer?.financing_available || false,
        trade_in: raw.dealer?.trade_in_offered || false,
        home_delivery: raw.dealer?.home_delivery || false,
        virtual_appointments: raw.dealer?.virtual_appointments || false
      }
    },

    // Enhanced Market Data
    market_data: {
      dom: raw.dom,
      price_stats: {
        mean: raw.price_stats?.mean,
        median: raw.price_stats?.median,
        standard_deviation: raw.price_stats?.standard_deviation
      },
      similar_vehicles: raw.similar_vehicles,
      market_value: raw.market_value,
      price_rating: raw.price_rating,
      inventory_metrics: {
        total_similar: raw.market_metrics?.total_similar || 0,
        days_supply: raw.market_metrics?.days_supply || 0,
        market_share: raw.market_metrics?.market_share || 0,
        turnover_rate: raw.market_metrics?.turnover_rate || 0
      },
      price_metrics: {
        msrp: raw.build?.msrp || 0,
        invoice: raw.build?.invoice || 0,
        market_average: raw.market_metrics?.average || 0,
        price_delta_msrp: raw.price_delta_msrp || 0,
        percentile_rank: raw.price_percentile || 0
      },
      regional_metrics: {
        local_price_range: raw.regional_metrics?.local_range || [0, 0],
        state_price_range: raw.regional_metrics?.state_range || [0, 0],
        national_price_range: raw.regional_metrics?.national_range || [0, 0]
      }
    },

    // Vehicle History
    history: {
      owners: raw.history?.owners,
      accidents: raw.history?.accidents,
      title_issues: raw.history?.title_issues,
      service_records: raw.history?.service_records,
      last_seen_date: raw.first_seen_date,
      last_seen_price: raw.ref_price
    },

    // Listing Details
    listing_details: {
      status: raw.inventory_type,
      seller_type: raw.seller_type,
      certification: raw.is_certified,
      warranty_included: raw.warranty,
      finance_available: raw.finance_available,
      posted_date: raw.listed_date,
      last_updated_date: raw.last_seen_at_date,
      vdp_url: raw.vdp_url,
      source_url: raw.source_url
    },

    // Technical Specs
    specs: {
      engine: {
        type: raw.build?.engine,
        displacement: raw.build?.engine_size,
        cylinders: raw.build?.cylinders,
        horsepower: raw.build?.horsepower,
        torque: raw.build?.torque
      },
      dimensions: {
        length: raw.build?.length,
        width: raw.build?.width,
        height: raw.build?.height,
        wheelbase: raw.build?.wheelbase,
        cargo_volume: raw.build?.cargo_volume
      },
      performance: {
        mpg_city: raw.build?.city_mpg,
        mpg_highway: raw.build?.highway_mpg,
        mpg_combined: raw.build?.combined_mpg,
        acceleration: raw.build?.acceleration
      },
      features: raw.features || [],
      options: raw.options || []
    },

    // Enhanced Vehicle Details
    vehicle_details: {
      style_info: {
        body_style: raw.build?.body_style || '',
        doors: raw.build?.doors || 0,
        size_class: raw.build?.size_class || '',
        vehicle_type: raw.build?.vehicle_type || '',
        cargo_capacity: raw.build?.cargo_capacity || ''
      },
      powertrain: {
        engine_type: raw.build?.engine_type || '',
        engine_size: raw.build?.engine_size || '',
        fuel_economy: {
          city: raw.build?.city_mpg || 0,
          highway: raw.build?.highway_mpg || 0,
          combined: raw.build?.combined_mpg || 0
        },
        transmission: {
          type: raw.build?.transmission_type || '',
          speeds: raw.build?.transmission_speeds || 0,
          description: raw.build?.transmission_description || ''
        }
      },
      safety: {
        airbags: raw.build?.airbags || [],
        safety_features: raw.build?.safety_features || [],
        crash_ratings: raw.build?.crash_ratings || {}
      }
    },

    // Competitive Analysis
    competition: {
      similar_models: (raw.competition?.similar_models || []).map((model: any) => ({
        make: model.make || '',
        model: model.model || '',
        avg_price: model.avg_price || 0,
        market_share: model.market_share || 0
      })),
      price_position: {
        rank: raw.competition?.rank || 0,
        percentile: raw.competition?.percentile || 0,
        versus_market: raw.competition?.versus_market || 'at'
      }
    },

    // Raw Data
    raw_data: raw
  };
}

async function runTests() {
  console.log('\n🔍 Testing MarketCheck Integration\n');

  try {
    // Create and initialize client
    const client = createMarketCheckClient({
      apiKey: process.env.MARKET_CHECK_API_KEY!,
      apiSecret: process.env.MARKET_CHECK_API_SECRET!,
      mode: 'production'
    });

    await client.init();

    // Test Market Analysis
    console.log('\nTesting Market Analysis...');
    const marketStats = await client.getMarketStats({
      make: 'Honda',
      model: 'Accord'
    });
    console.log('✅ Market Stats:', marketStats);

    const marketDaysSupply = await client.getMarketDaysSupply({
      make: 'Honda',
      model: 'Accord'
    });
    console.log('✅ Market Days Supply:', marketDaysSupply);

    // Test Price Analysis
    console.log('\nTesting Price Analysis...');
    const pricePrediction = await client.getPricePrediction({
      vin: '1HGCV1F34MA002618',
      miles: 50000,
      zip: '01606'
    });
    console.log('✅ Price Prediction:', pricePrediction);

    // Test Search
    console.log('\nTesting Search...');
    const searchResults = await client.searchActive({
      make: 'Honda',
      model: 'Accord',
      year: 2024
    });
    console.log('✅ Search Results:', {
      total: searchResults.listings?.length,
      sample: searchResults.listings?.[0]
    });

    // Test VIN Decode
    console.log('\nTesting VIN Decode...');
    const vinDecode = await client.decodeVin('1HGCV1F34MA002618');
    console.log('✅ VIN Decode:', vinDecode);

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

// Run tests
runTests()
  .then(() => console.log('\n✨ All tests completed successfully'))
  .catch(error => {
    console.error('\n💥 Test suite failed:', error);
    process.exit(1);
  }); 




/**
 * Unified Market Service
 * 
 * Single entry point for:
 * - Market data retrieval
 * - Caching
 * - Analysis
 */

import { IMarketCheckClient, createMarketCheckClient } from '../clients';
import { CacheSystem } from '../../cache/cache-system';
import { ChartDatasets } from '../analysis/visualization';
import { processMarketData } from '../analysis/market-analysis';
import { MarketDataValidator } from '../validation/market-validator';
import { MarketAnalysis as MarketAnalysisImpl } from '../analysis/market-analysis';
import { MarketMonitor } from '../monitoring/market-monitor';
import { MockMetricsService } from '../monitoring/mock-metrics-service';
import { ScenarioSelector } from '../monitoring/metrics-scenarios';
import { scenarios } from '../monitoring/metrics-scenarios';
import { MarketCheckConfig } from '../../types/market';

// Types
import type { MarketData as RawMarketData } from '../types';  // API response type
import { 
  MarketData,
  MarketAnalysis,
  MetricsStore,
  MetricValue,
  MetricSummary,
  MetricCategory,
  MetricsReport
} from '../../types/market';  // Remove ProcessedMarketData since it doesn't exist

// Add missing interfaces and types
interface MarketServiceConfig {
  apiKey: string;
  apiSecret?: string;
  cacheTTL: number;
  cacheSize: number;
  cacheStorage: 'memory' | 'redis' | 'hybrid';
  testData?: any;
}

interface AnalysisParams {
  vin: string;
  zip?: string;
  radius?: number;
}

interface RetryConfig {
  maxAttempts: number;
  delayMs: number;
  backoffFactor: number;
}

class MarketServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public retryable: boolean
  ) {
    super(message);
    this.name = 'MarketServiceError';
  }
}

// Convert interface to class
class ServiceMetrics {
  requestCount = 0;
  errorCount = 0;
  cacheHits = 0;
  avgResponseTime = 0;
}

class ServiceMonitor {
  private metrics: ServiceMetrics = {
    requestCount: 0,
    errorCount: 0,
    cacheHits: 0,
    avgResponseTime: 0
  };

  logRequest(duration: number, cached: boolean, error?: Error) {
    this.metrics.requestCount++;
    if (error) this.metrics.errorCount++;
    if (cached) this.metrics.cacheHits++;
    
    // Update average response time
    this.metrics.avgResponseTime = (
      (this.metrics.avgResponseTime * (this.metrics.requestCount - 1) + duration) /
      this.metrics.requestCount
    );
  }

  getMetrics() {
    return this.metrics;
  }
}

class BaseMarketService {
  protected async withRetry<T>(
    operation: () => Promise<T>,
    config: RetryConfig
  ): Promise<T> {
    let lastError: Error = new Error('Operation failed');  // Initialize
    let delay = config.delayMs;

    for (let attempt = 1; attempt <= config.maxAttempts; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (attempt === config.maxAttempts) break;
        
        console.warn(`Attempt ${attempt} failed, retrying in ${delay}ms...`);
        await new Promise(resolve => setTimeout(resolve, delay));
        delay *= config.backoffFactor;
      }
    }

    throw new MarketServiceError(
      `Operation failed after ${config.maxAttempts} attempts: ${lastError.message}`,
      'RETRY_EXHAUSTED',
      false
    );
  }
}

// Update RawMarketResponse to extend MarketData
interface RawMarketResponse extends MarketData {
  price?: number;
  mileage?: number;
  location?: { 
    zip: string;
    state: string;
  };
}

/**
 * Market Analysis Service
 * 
 * What this does:
 * - Coordinates getting and analyzing vehicle market data
 * - Combines data from different sources
 * - Provides market insights and price analysis
 * 
 * Think of this as our "market expert" that:
 * 1. Gets raw data about cars
 * 2. Analyzes the data to understand market trends
 * 3. Provides insights about whether it's a good time to buy/sell
 * 
 * Example Usage:
 * - When a user looks up a car
 * - This service gets the price data
 * - Analyzes market conditions
 * - Tells user if price is good/bad
 */

export class MarketService extends BaseMarketService {
  private client: IMarketCheckClient;
  private cache: CacheSystem;
  private metrics: MetricsStore = {
    performance: {
      request_rate: [],
      api_latency: [],
      active_models: [],
      active_rules: [],
      error_rate: []
    },
    quality: {},
    intelligence: {}
  };
  private marketAnalysis: MarketAnalysisImpl;
  public validator: MarketDataValidator;

  constructor(config: MarketServiceConfig) {
    super();
    
    const mode = process.env.NODE_ENV === 'test' ? 'test' : 
                 process.env.NODE_ENV === 'production' ? 'production' : 
                 'development';

    this.client = createMarketCheckClient({
      mode,
      apiKey: config.apiKey,
      apiSecret: config.apiSecret,
      testData: config.testData
    });
    
    this.cache = new CacheSystem({
      ttl: config.cacheTTL,
      maxSize: config.cacheSize,
      storage: config.cacheStorage
    });

    this.marketAnalysis = new MarketAnalysisImpl();
    this.validator = new MarketDataValidator();
  }

  async getMarketData(vin: string): Promise<MarketData> {
    try {
      const rawData = await this.client.getMarketData(vin);
      
      const transformedData: RawMarketResponse = {
        ...rawData,
        price: rawData.activeListings?.stats?.price?.median,
        mileage: 0,
        location: {
          zip: '00000',
          state: 'XX'
        }
      };

      return this.transformMarketData(transformedData);
    } catch (error) {
      console.error('Market data fetch failed:', error);
      throw error;  // Add proper error handling
    }
  }

  async analyzeMarket(params: AnalysisParams): Promise<MarketAnalysis> {
    const data = await this.getMarketData(params.vin);
    const analysis = await this.marketAnalysis.analyze(data);
    
    const isValid = await MarketDataValidator.validateAnalysisAsync(analysis);
    
    if (!isValid) {
      throw new Error('Market analysis validation failed');
    }
    
    return analysis;
  }

  private transformMarketData(rawData: RawMarketResponse): MarketData {
    const price = rawData.activeListings?.stats?.price?.median || 0;
    
    return {
      vin: rawData.vin,
      make: rawData.make,
      model: rawData.model,
      year: rawData.year,
      activeListings: {
        total_found: rawData.activeListings?.total_found || 0,
        stats: {
          price: {
            min: price * 0.9,
            max: price * 1.1,
            median: price
          },
          dom: { average: rawData.activeListings?.stats?.dom?.average || 30 }
        }
      },
      salesHistory: rawData.salesHistory || {
        trends: {
          price_trend: 'Stable',
          volume: { last_30_days: 0, previous_30_days: 0 }
        }
      }
    };
  }

  private summarizeMetrics(metrics: Record<string, any[]> | undefined): MetricSummary {
    const summary: MetricSummary = {};
    
    if (!metrics) {
      return summary;
    }
    
    Object.entries(metrics).forEach(([key, values]) => {
      const numbers = values.map(v => v.value);
      summary[key] = {
        current: numbers[numbers.length - 1] || 0,
        average: numbers.reduce((a, b) => a + b, 0) / numbers.length || 0,
        min: Math.min(...numbers) || 0,
        max: Math.max(...numbers) || 0
      };
    });
    
    return summary;
  }

  async getMetrics(): Promise<MetricsReport> {
    return {
      performance: {
        'request_rate': {
          current: this.metrics.performance['request_rate']?.[0]?.value || 0,
          threshold: 200
        },
        'api_latency': {
          current: this.metrics.performance['api_latency']?.[0]?.value || 0,
          threshold: 300
        },
        'active_models': {
          current: this.metrics.performance['active_models']?.[0]?.value || 0,
          threshold: 5
        },
        'active_rules': {
          current: this.metrics.performance['active_rules']?.[0]?.value || 0,
          threshold: 10
        },
        'error_rate': {
          current: this.metrics.performance['error_rate']?.[0]?.value || 0,
          threshold: 0.1
        }
      },
      quality: this.summarizeMetrics(this.metrics.quality),
      intelligence: this.summarizeMetrics(this.metrics.intelligence)
    };
  }
}

// Mock and Real service implementations
class MockMarketService extends MarketService {
  private mockMetrics: MockMetricsService;

  constructor() {
    super({
      apiKey: 'mock-key',
      cacheTTL: 3600,
      cacheSize: 1000,
      cacheStorage: 'memory'
    });
    
    this.mockMetrics = new MockMetricsService(MarketMonitor.getInstance());
    this.mockMetrics.setupHealthyMetrics();
  }

  async getMarketData(vin: string): Promise<MarketData> {
    // Record mock API latency for this request
    const monitor = MarketMonitor.getInstance();
    monitor.recordApiLatency('request', 150);
    
    return {
      vin,
      make: 'Toyota',
      model: 'Camry',
      year: 2020,
      activeListings: {
        total_found: 10,
        stats: {
          price: { min: 20000, max: 30000, median: 25000 },
          dom: { average: 30 }
        }
      },
      salesHistory: {
        trends: {
          price_trend: 'Stable',  // Capital S to match enum
          volume: { last_30_days: 100, previous_30_days: 95 }
        }
      }
    };
  }
}

class RealMarketService extends MarketService {
  constructor() {
    const apiKey = process.env.MARKETCHECK_API_KEY;
    const apiSecret = process.env.MARKETCHECK_API_SECRET;

    if (process.env.NODE_ENV === 'production' && (!apiKey || !apiSecret)) {
      throw new Error('MarketCheck API key and secret are required for production mode');
    }

    super({
      apiKey: apiKey || 'development-key',
      apiSecret: apiSecret || 'development-secret',
      cacheTTL: 3600,
      cacheSize: 1000,
      cacheStorage: 'memory'
    });
  }
}

// Export factory function
export async function createMarketService(): Promise<MarketService> {
  const monitor = MarketMonitor.getInstance();
  const metrics = await monitor.getMetrics();

  const context = {
    currentTime: new Date(),
    requestRate: metrics.performance.request_rate?.current || 0,
    errorRate: metrics.performance.error_rate?.current || 0,
    environment: process.env.NODE_ENV || 'development',
    maintenanceMode: process.env.MAINTENANCE_MODE === 'true'
  };

  const scenario = ScenarioSelector.determineScenario(context);

  console.log('\n=== Factory Debug ===');
  console.log('Creating service with:', {
    environment: process.env.NODE_ENV,
    mockData: process.env.USE_MOCK_DATA,
    scenario
  });

  // Check both credentials
  const hasCredentials = process.env.MARKETCHECK_API_KEY && process.env.MARKETCHECK_API_SECRET;

  console.log('Creating Market Service:', {
    scenario,
    useMockData: scenarios[scenario].serviceConfig.useMockData,
    cacheTTL: scenarios[scenario].serviceConfig.cacheTTL,
    useRealAPI: scenarios[scenario].serviceConfig.useRealAPI,
    credentials: {
      apiKey: process.env.MARKETCHECK_API_KEY ? '✓' : '✗',
      apiSecret: process.env.MARKETCHECK_API_SECRET ? '✓' : '✗'
    }
  });

  // Simplify the logic - use mock service if either:
  // 1. useMockData is true, or
  // 2. useRealAPI is true but we don't have credentials
  if (scenarios[scenario].serviceConfig.useMockData || (scenarios[scenario].serviceConfig.useRealAPI && !hasCredentials)) {
    return new MockMarketService();
  }

  return new RealMarketService();
}

// Verification function
export const verifyServiceIntegration = async () => {
  const testVIN = '1HGCM82633A123456';
  
  try {
    const service = await createMarketService();  // Now awaits the factory
    const marketData = await service.getMarketData(testVIN);
    const analysis = await service.analyzeMarket({ vin: testVIN });
    const isValid = await MarketDataValidator.validateAnalysisAsync(analysis);
    
    return {
      dataFetch: !!marketData,
      analysis: !!analysis,
      validation: !!isValid
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      throw new Error(`Service integration failed: ${error.message}`);
    }
    throw new Error('Service integration failed with unknown error');
  }
}; 



/**
 * Market Data Analysis
 * Transforms raw API data into actionable insights
 */

import { 
  MarketAnalysis as MarketAnalysisType, 
  PowerMetrics, 
  PriceAnalysis,
  MarketData
} from '../../types/market';
import { mockMarketData } from '../../test-utils/market-test-utils';

function calculatePowerMetrics(rawData: typeof mockMarketData.detailed): PowerMetrics {
  const { activeListings, salesHistory } = rawData;
  
  // Calculate position strength based on inventory and price trends
  const strength = salesHistory.trends.price_trend === 'falling' && 
    activeListings.stats.dom.average > 45 ? 'Strong' : 'Moderate';

  return {
    score: 85, // Example calculation
    position: {
      strength,
      percentile: 15,  // Top 15%
      leverage: 85     // High leverage due to market conditions
    },
    timing: {
      score: 90,
      indicator: 'Perfect',
      factors: [
        'End of month',
        'High inventory',
        'Price trending down'
      ]
    }
  };
}

function analyzePricing(rawData: typeof mockMarketData.detailed): PriceAnalysis {
  const { activeListings } = rawData;
  const { min, max, median } = activeListings.stats.price;

  return {
    current: 30995,
    target: {
      value: 28595,
      savings: 2400,
      confidence: 85
    },
    distribution: {
      min,
      max,
      median,
      ranges: {
        good: [median * 1.05, max],           // Above median
        great: [median, median * 1.05],       // At median
        perfect: [min, median]                // Below median
      }
    }
  };
}

function analyzeMarketConditions(rawData: typeof mockMarketData.detailed) {
  const { activeListings, salesHistory } = rawData;

  return {
    trend: salesHistory.trends.price_trend,
    supply: activeListings.total_found,
    demand: calculateDemandScore(activeListings, salesHistory),
    daysListed: activeListings.stats.dom.average
  };
}

// Helper function for demand calculation
function calculateDemandScore(listings: any, history: any): number {
  // Example demand score calculation
  const volumeChange = history.trends.volume.last_30_days - 
    history.trends.volume.previous_30_days;
  
  return volumeChange > 0 ? 85 : 65;
}

export function processMarketData(rawData: typeof mockMarketData.detailed): MarketAnalysisType {
  const powerMetrics = calculatePowerMetrics(rawData);
  const priceAnalysis = analyzePricing(rawData);
  const marketConditions = analyzeMarketConditions(rawData);

  return {
    power: powerMetrics,
    pricing: priceAnalysis,
    market: {
      trend: marketConditions.trend as 'Rising' | 'Falling' | 'Stable',
      supply: marketConditions.supply,
      demand: marketConditions.demand,
      daysListed: marketConditions.daysListed
    }
  };
}

export class MarketAnalysis {
  async analyze(data: MarketData): Promise<MarketAnalysisType> {
    return {
      power: {
        score: 85,
        position: {
          strength: 'Strong',
          percentile: 0.85,
          leverage: 85
        },
        timing: {
          score: 90,
          indicator: 'Perfect',
          factors: ['End of month', 'High inventory']
        }
      },
      pricing: {
        current: 30995,
        target: {
          value: 28595,
          savings: 2400,
          confidence: 85
        },
        distribution: {
          min: 25000,
          max: 35000,
          median: 30000,
          ranges: {
            good: [31500, 35000],
            great: [30000, 31500],
            perfect: [25000, 30000]
          }
        }
      },
      market: {
        trend: 'Stable' as const,
        supply: 100,
        demand: 85,
        daysListed: 30
      }
    };
  }

  // Update helper methods to use MarketData type
  private calculatePowerMetrics(data: MarketData): PowerMetrics {
    const strength = data.salesHistory.trends.price_trend === 'falling' && 
      data.activeListings.stats.dom.average > 45 ? 'Strong' : 'Moderate';

    return {
      score: 85,
      position: {
        strength,
        percentile: 15,
        leverage: 85
      },
      timing: {
        score: 90,
        indicator: 'Perfect',
        factors: [
          'End of month',
          'High inventory',
          'Price trending down'
        ]
      }
    };
  }

  private analyzePricing(data: MarketData): PriceAnalysis {
    const { min, max, median } = data.activeListings.stats.price;

    return {
      current: median,
      target: {
        value: min + (median - min) * 0.2, // 20% above minimum
        savings: median - min,
        confidence: 85
      },
      distribution: {
        min,
        max,
        median,
        ranges: {
          good: [median * 1.05, max],
          great: [median, median * 1.05],
          perfect: [min, median]
        }
      }
    };
  }

  private analyzeMarketConditions(data: MarketData) {
    return {
      trend: data.salesHistory.trends.price_trend as 'Rising' | 'Falling' | 'Stable',
      supply: data.activeListings.total_found,
      demand: this.calculateDemandScore(data),
      daysListed: data.activeListings.stats.dom.average
    };
  }

  private calculateDemandScore(data: MarketData): number {
    const volumeChange = data.salesHistory.trends.volume.last_30_days - 
      data.salesHistory.trends.volume.previous_30_days;
    return volumeChange > 0 ? 85 : 65;
  }
} 








          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1856/ffc91e3f599b5e4c5565191ed56ae01bx.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0587/5d56243928cabaf3dd615e2bf3a873d2x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1139/934b3abf0013a2dd51099b7b097157b9x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1427/2ba3adda8e7245847b825199aab20a0bx.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1327/fdb9c1b2ac8225dbe117c6d4d81ca323x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0465/e11ac852d450fbf8fe246d42eafb4f78x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1133/d76e5b20b7e99fc194f3c5ea21aca251x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0102/860c317494c4143b2cc0ca27c755e132x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0395/12edecf819ad2a05074dc9f8fe11aa02x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1045/82387c17eb40c71cef14935b84f3cba4x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0683/a9e8779eb4c9565404358d9996a602a1x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0493/3e93b8544cd48c07ff3b095ab1b87d83x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0318/2b6714546c6cf57c81664130c0b05333x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1159/0edc6f28189b909d46f8f40cbc24a953x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0252/22cedda3b6e0f36209f7f8f6f943dbd9x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1080/8e272b1eb2db4cc1a511e8a60c970f7ax.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0336/541b1e9b870ad6cda782ceba6b8b742cx.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0139/caadf3c94aa13bc7881d4fa486b5aea4x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1692/e16743ee72ee1028272ec8a536c03af2x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1591/9228b644f03b098278742e9b7edd2385x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0677/8cab3e297f6a10cb3c60ba8e2a3d7f07x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0494/d79005e2d3f1cec5adcc31d9baa46f3bx.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1490/bc3c56cedd9be5d5b7d7bdb86bb22413x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1853/e17ad8040f483a8ed7c7220a6f2306f5x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1765/ab582a4a711f90dc64a7101b08ded7ebx.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0425/e6d7b274c5e27b55878e0b3544c3f35dx.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/0324/2dcd3f0110336497b9ddffb4600190e4x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1587/23b40f848d94d144781184956a54153dx.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1005/c56276d2048280c556b1e1a822161e73x.jpg",
          "https://pictures.dealer.com/s/suburbanchryslerdodgejeepramofgcllc/1953/7bba9f3e19688c2c0a4b7737d23747ddx.jpg"
        ]
      },
      "dealer": {
        "id": 1007610,
        "website": "suburbanchryslerdodgejeepramofgardencity.com",
        "name": "Suburban Chrysler Dodge Jeep Ram Of Garden City",
        "dealer_type": "franchise",
        "dealership_group_name": "Lithia Motors Inc.",
        "street": "32850 Ford Rd",
        "city": "Garden City",
        "state": "MI",
        "country": "US",
        "latitude": "42.325695",
        "longitude": "-83.36433",
        "zip": "48135",
        "msa_code": "2160",
        "phone": "(734) 338-8824",
        "seller_email": "migrdchr_leads@lithia.com"
      },
      "mc_dealership": {
        "mc_website_id": 1007610,
        "mc_dealer_id": 1125928,
        "mc_location_id": 1378262,
        "mc_rooftop_id": 774937,
        "mc_dealership_group_id": 161,
        "mc_dealership_group_name": "Lithia Motors Inc.",
        "mc_sub_dealership_group_id": 115,
        "mc_sub_dealership_group_name": "Suburban Collection",
        "mc_category": "Dealer",
        "website": "suburbanchryslerdodgejeepramofgardencity.com",
        "name": "Suburban Chrysler Dodge Jeep Ram Of Garden City",
        "dealer_type": "franchise",
        "street": "32850 Ford Rd",
        "city": "Garden City",
        "state": "MI",
        "country": "US",
        "latitude": "42.325695",
        "longitude": "-83.36433",
        "zip": "48135",
        "msa_code": "2160",
        "phone": "(734) 338-8824",
        "seller_email": "migrdchr_leads@lithia.com"
      },
      "build": {
        "year": 2025,
        "make": "Jeep",
        "model": "Compass",
        "trim": "Limited",
        "version": "Limited 4X4",
        "body_type": "SUV",
        "vehicle_type": "Truck",
        "transmission": "Automatic",
        "drivetrain": "4WD",
        "fuel_type": "Unleaded",
        "engine": "2.0L I4",
        "engine_size": 2,
        "engine_block": "I",
        "doors": 5,
        "cylinders": 4,
        "made_in": "USA",
        "overall_height": "64.8",
        "overall_length": "173.4",
        "overall_width": "73.8",
        "std_seating": "5",
        "highway_mpg": 32,
        "city_mpg": 24,
        "powertrain_type": "Combustion"
      }
    },
    {
      "id": "3C4NJDCN6ST534899-2bcc838e-1c49",
      "vin": "3C4NJDCN6ST534899",
      "heading": "2025 Jeep Compass Limited Sport Utility",
      "price": 30605,
      "miles": 13,
      "msrp": 34435,
      "data_source": "mc",
      "vdp_url": "https://www.suburbanchryslerdodgejeepramofgardencity.com/new/Jeep/2025-Jeep-Compass-garden-city-mi-9c5b10f3ac183148c620504776aa5ba7.htm",
      "carfax_1_owner": false,
      "carfax_clean_title": false,
      "exterior_color": "Red Hot Pearlcoat",
      "interior_color": "Black",
      "base_int_color": "Black",
      "base_ext_color": "Red",
      "dom": 93,
      "dom_180": 93,
      "dom_active": 38,
      "dos_active": 37,
      "seller_type": "dealer",
      "inventory_type": "new",
      "stock_no": "ST534899",
      "last_seen_at": 1740363560,
      "last_seen_at_date": "2025-02-24T02:19:20.000Z",
      "scraped_at": 1738718884,
      "scraped_at_date": "2025-02-05T01:28:04.000Z",
      "first_seen_at": 1738718884,
      "first_seen_at_date": "2025-02-05T01:28:04.000Z",
      "first_seen_at_source": 1737263058,
      "first_seen_at_source_date": "2025-01-19T05:04:18.000Z",
      "first_seen_at_mc": 1729227396,
      "first_seen_at_mc_date": "2024-10-18T04:56:36.000Z",
      "ref_price": 30105,
      "price_change_percent": 1.66,
      "ref_price_dt": 1738633416,
      "ref_miles": 13,
      "ref_miles_dt": 1738633416,
      "source": "suburbanchryslerdodgejeepramofgardencity.com",
      "in_transit": false,
      "availability_status": "In Stock",
      "media": {
        "photo_links": [
          "https://images.dealer.com/ddc/vehicles/2025/Jeep/Compass/SUV/trim_Limited_5fedf4/color/Red%20Hot%20Pearlcoat-PR6-173,54,52-640-en_US.jpg"
        ]
      },
      "dealer": {
        "id": 1007610,
        "website": "suburbanchryslerdodgejeepramofgardencity.com",
        "name": "Suburban Chrysler Dodge Jeep Ram Of Garden City",
        "dealer_type": "franchise",
        "dealership_group_name": "Lithia Motors Inc.",
        "street": "32850 Ford Rd",
        "city": "Garden City",
        "state": "MI",
        "country": "US",
        "latitude": "42.325695",
        "longitude": "-83.36433",
        "zip": "48135",
        "msa_code": "2160",
        "phone": "(734) 338-8824",
        "seller_email": "migrdchr_leads@lithia.com"
      },
      "mc_dealership": {
        "mc_website_id": 1007610,
        "mc_dealer_id": 1125928,
        "mc_location_id": 1378262,
        "mc_rooftop_id": 774937,
        "mc_dealership_group_id": 161,
        "mc_dealership_group_name": "Lithia Motors Inc.",
        "mc_sub_dealership_group_id": 115,
        "mc_sub_dealership_group_name": "Suburban Collection",
        "mc_category": "Dealer",
        "website": "suburbanchryslerdodgejeepramofgardencity.com",
        "name": "Suburban Chrysler Dodge Jeep Ram Of Garden City",
        "dealer_type": "franchise",
        "street": "32850 Ford Rd",
        "city": "Garden City",
        "state": "MI",
        "country": "US",
        "latitude": "42.325695",
        "longitude": "-83.36433",
        "zip": "48135",
        "msa_code": "2160",
        "phone": "(734) 338-8824",
        "seller_email": "migrdchr_leads@lithia.com"
      },
      "build": {
        "year": 2025,
        "make": "Jeep",
        "model": "Compass",
        "trim": "Limited",
        "version": "Limited 4X4",
        "body_type": "SUV",
        "vehicle_type": "Truck",
        "transmission": "Automatic",
        "drivetrain": "4WD",
        "fuel_type": "Unleaded",
        "engine": "2.0L I4",
        "engine_size": 2,
        "engine_block": "I",
        "doors": 5,
        "cylinders": 4,
        "made_in": "USA",
        "overall_height": "64.8",
        "overall_length": "173.4",
        "overall_width": "73.8",
        "std_seating": "5",
        "highway_mpg": 32,
        "city_mpg": 24,
        "powertrain_type": "Combustion"
      }
    },
    {
      "id": "1FT8W2BT8REE85220-dbbf3cb8-d21f",
      "vin": "1FT8W2BT8REE85220",
      "heading": "2024 Ford Super Duty F-250 SRW XL",
      "price": 73610,
      "miles": 3,
      "msrp": 71615,
      "data_source": "mc",
      "vdp_url": "https://www.futurefordofconcord.com/viewdetails/new/1ft8w2bt8ree85220/2024-ford-super-duty-f-250-srw-crew-cab-pickup?type=lease",
      "exterior_color": "Gray Metallic",
      "interior_color": "Medium Dark Slate",
      "base_int_color": "Black",
      "base_ext_color": "Gray",
      "dom": 207,
      "dom_180": 207,
      "dom_active": 207,
      "dos_active": 185,
      "seller_type": "dealer",
      "inventory_type": "new",
      "stock_no": "F29796",
      "last_seen_at": 1740363551,
      "last_seen_at_date": "2025-02-24T02:19:11.000Z",
      "scraped_at": 1740363551,
      "scraped_at_date": "2025-02-24T02:19:11.000Z",
      "first_seen_at": 1740363551,
      "first_seen_at_date": "2025-02-24T02:19:11.000Z",
      "first_seen_at_source": 1722656490,
      "first_seen_at_source_date": "2024-08-03T03:41:30.000Z",
      "first_seen_at_mc": 1722589849,
      "first_seen_at_mc_date": "2024-08-02T09:10:49.000Z",
      "ref_price": 73610,
      "price_change_percent": 0,
      "ref_price_dt": 1740276602,
      "ref_miles": 3,
      "ref_miles_dt": 1740276602,
      "source": "futurefordofconcord.com",
      "in_transit": false,
      "media": {
        "photo_links": [
          "https://content.homenetiol.com/2000157/2065512/1920x1440/731a34a5ad6e45b483eeec1d371f272b.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/562fe2f5d6234e109a4d3ebda8413f9e.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/cd12454f5890419d9b27cb5c5e8ea1d7.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/17079d6ef60e4a9b9aa4c563e8812722.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/7b36785b99d3487692789a9bdd455fd6.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/e2984238732f4451a6d874e3bca52d57.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/9fe63e89eec74592a37b4fd64066f855.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/298218a8da7c418a9b9807622b9578e6.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/02ec00fe637a494c8a101b6cb34dfe77.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/749e284a6b0341f084b6bcee5bf40688.jpg"
        ]
      },
      "dealer": {
        "id": 1009433,
        "website": "futurefordofconcord.com",
        "name": "Future Ford Of Concord",
        "dealer_type": "franchise",
        "dealership_group_name": "Future Automotive Group",
        "street": "2285 Diamond Blvd",
        "city": "Concord",
        "state": "CA",
        "country": "US",
        "latitude": "37.977166",
        "longitude": "-122.061461",
        "zip": "94520",
        "msa_code": "5775",
        "phone": "9252484935",
        "seller_email": "sehsan@futurefordofconcord.com"
      },
      "mc_dealership": {
        "mc_website_id": 1009433,
        "mc_dealer_id": 1193364,
        "mc_location_id": 1330836,
        "mc_rooftop_id": 212718,
        "mc_dealership_group_id": 149,
        "mc_dealership_group_name": "Future Automotive Group",
        "mc_sub_dealership_group_id": 149,
        "mc_sub_dealership_group_name": "Future Automotive Group",
        "mc_category": "Dealer",
        "website": "futurefordofconcord.com",
        "name": "Future Ford Of Concord",
        "dealer_type": "franchise",
        "street": "2285 Diamond Blvd",
        "city": "Concord",
        "state": "CA",
        "country": "US",
        "latitude": "37.977166",
        "longitude": "-122.061461",
        "zip": "94520",
        "msa_code": "5775",
        "phone": "9252484935",
        "seller_email": "sehsan@futurefordofconcord.com"
      },
      "build": {
        "year": 2024,
        "make": "Ford",
        "model": "F-250 Super Duty",
        "trim": "XL",
        "version": "XL 4x4 Crew Cab 8' Box",
        "body_type": "Pickup",
        "body_subtype": "Crew",
        "vehicle_type": "Truck",
        "transmission": "Automatic",
        "drivetrain": "4WD",
        "fuel_type": "Diesel",
        "engine": "6.7L V8",
        "engine_size": 6.7,
        "engine_block": "V",
        "doors": 4,
        "cylinders": 8,
        "made_in": "USA",
        "overall_height": "81.4",
        "overall_length": "266.2",
        "overall_width": "80.0",
        "std_seating": "6",
        "powertrain_type": "Combustion"
      }
    },
    {
      "id": "1FT8W3BA6PED38346-8e3c82f6-9c48",
      "vin": "1FT8W3BA6PED38346",
      "heading": "2023 Ford Super Duty F-350 SRW XL",
      "price": 67905,
      "miles": 15,
      "msrp": 62910,
      "data_source": "mc",
      "vdp_url": "https://www.futurefordofconcord.com/viewdetails/new/1ft8w3ba6ped38346/2023-ford-super-duty-f-350-srw-crew-cab-pickup?type=lease",
      "exterior_color": "Carbonized Gray Metallic",
      "interior_color": "Medium Dark Slate",
      "base_int_color": "Black",
      "base_ext_color": "Gray",
      "dom": 578,
      "dom_180": 578,
      "dom_active": 578,
      "dos_active": 107,
      "seller_type": "dealer",
      "inventory_type": "new",
      "stock_no": "F28334",
      "last_seen_at": 1740363551,
      "last_seen_at_date": "2025-02-24T02:19:11.000Z",
      "scraped_at": 1740363551,
      "scraped_at_date": "2025-02-24T02:19:11.000Z",
      "first_seen_at": 1740363551,
      "first_seen_at_date": "2025-02-24T02:19:11.000Z",
      "first_seen_at_source": 1730836558,
      "first_seen_at_source_date": "2024-11-05T19:55:58.000Z",
      "first_seen_at_mc": 1690523496,
      "first_seen_at_mc_date": "2023-07-28T05:51:36.000Z",
      "ref_price": 67905,
      "price_change_percent": 0,
      "ref_price_dt": 1740276593,
      "ref_miles": 15,
      "ref_miles_dt": 1740276593,
      "source": "futurefordofconcord.com",
      "in_transit": false,
      "media": {
        "photo_links": [
          "https://content.homenetiol.com/2000157/2065512/1920x1440/95bf606a5ee44001870ae4d2f6b037ed.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/45fb4893907046e79ab219669294d37c.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/ed776d4484824d2a82745f258a391d16.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/ff85da7f98884a41bf5db4104da41456.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/2d028b8c6e604c3b9f8092470f7925e4.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/085219652a6b41cd95e746da3fa24452.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/0ff4337d9a5440dbaa725f375512206e.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/aac43cc2c48e40e2b842f9e489ea3ff5.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/6ed7ac5dccb7433587f35aea304369ab.jpg",
          "https://content.homenetiol.com/2000157/2065512/1920x1440/c9ad0f77ef8e42348ad87c592e880776.jpg"
        ]
      },
      "dealer": {
        "id": 1009433,
        "website": "futurefordofconcord.com",
        "name": "Future Ford Of Concord",
        "dealer_type": "franchise",
        "dealership_group_name": "Future Automotive Group",
        "street": "2285 Diamond Blvd",
        "city": "Concord",
        "state": "CA",
        "country": "US",
        "latitude": "37.977166",
        "longitude": "-122.061461",
        "zip": "94520",
        "msa_code": "5775",
        "phone": "9252484935",
        "seller_email": "sehsan@futurefordofconcord.com"
      },
      "mc_dealership": {
        "mc_website_id": 1009433,
        "mc_dealer_id": 1193364,
        "mc_location_id": 1330836,
        "mc_rooftop_id": 212718,
        "mc_dealership_group_id": 149,
        "mc_dealership_group_name": "Future Automotive Group",
        "mc_sub_dealership_group_id": 149,
        "mc_sub_dealership_group_name": "Future Automotive Group",
        "mc_category": "Dealer",
        "website": "futurefordofconcord.com",
        "name": "Future Ford Of Concord",
        "dealer_type": "franchise",
        "street": "2285 Diamond Blvd",
        "city": "Concord",
        "state": "CA",
        "country": "US",
        "latitude": "37.977166",
        "longitude": "-122.061461",
        "zip": "94520",
        "msa_code": "5775",
        "phone": "9252484935",
        "seller_email": "sehsan@futurefordofconcord.com"
      },
      "build": {
        "year": 2023,
        "make": "Ford",
        "model": "F-350 Super Duty",
        "trim": "XL",
        "version": "XL 4x4 Crew Cab 6-1/2' Box SRW",
        "body_type": "Pickup",
        "body_subtype": "Crew",
        "vehicle_type": "Truck",
        "transmission": "Automatic",
        "drivetrain": "4WD",
        "fuel_type": "Unleaded",
        "engine": "6.8L V8",
        "engine_size": 6.8,
        "engine_block": "V",
        "doors": 4,
        "cylinders": 8,
        "made_in": "USA",
        "overall_height": "81.4",
        "overall_length": "250.0",
        "overall_width": "80.0",
        "std_seating": "6",
        "powertrain_type": "Combustion"
      }
    },
    {
      "id": "KNDCR3LE6S5251641-9dc22ecc-fd71",
      "vin": "KNDCR3LE6S5251641",
      "heading": "2025 Kia Niro EX Touring SUV",
      "price": 33263,
      "miles": 7,
      "msrp": 33640,
      "data_source": "mc",
      "vdp_url": "https://www.gollingkia.com/new/Kia/2025-Kia-Niro-755e0387ac18286ba70fa0b0342a4997.htm",
      "carfax_1_owner": false,
      "carfax_clean_title": false,
      "exterior_color": "Interstellar Gray",
      "interior_color": "Medium Gray",
      "base_int_color": "Gray",
      "base_ext_color": "Gray",
      "dom": 39,
      "dom_180": 39,
      "dom_active": 39,
      "dos_active": 37,
      "seller_type": "dealer",
      "inventory_type": "new",
      "stock_no": "25466",
      "last_seen_at": 1740363542,
      "last_seen_at_date": "2025-02-24T02:19:02.000Z",
      "scraped_at": 1740363542,
      "scraped_at_date": "2025-02-24T02:19:02.000Z",
      "first_seen_at": 1740363542,
      "first_seen_at_date": "2025-02-24T02:19:02.000Z",
      "first_seen_at_source": 1737156068,
      "first_seen_at_source_date": "2025-01-17T23:21:08.000Z",
      "first_seen_at_mc": 1737156068,
      "first_seen_at_mc_date": "2025-01-17T23:21:08.000Z",
      "ref_price": 33363,
      "price_change_percent": -0.3,
      "ref_price_dt": 1740274295,
      "ref_miles": 7,
      "ref_miles_dt": 1740274295,
      "source": "gollingkia.com",
      "in_transit": false,
      "availability_status": "In Stock",
      "media": {
        "photo_links": [
          "https://pictures.dealer.com/g/gollingkia/0194/c415b6a5a2f927f8ed79384be05000ccx.jpg",
          "https://pictures.dealer.com/g/gollingkia/0736/b1556d821a5112656ad85f93d458e856x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0542/bc968741bc9cf2345e55219c722fc622x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0452/30a7faa7e28137b894826a4a36fc8f9cx.jpg",
          "https://pictures.dealer.com/g/gollingkia/0073/f9c9cacf86e0078ed1c9993207f7c7fbx.jpg",
          "https://pictures.dealer.com/g/gollingkia/0579/1cc9aceee9c4d2fca33c02d90d91305ax.jpg",
          "https://pictures.dealer.com/g/gollingkia/1046/8a7fec2af70e9ad0f4898c858914ffb7x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0207/3fa97b49a0046275dca1445749de0f79x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0766/5ba1c413264a4119d13f9b2c7f8012f8x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0022/1bf547173c82581d1b299da0aed441c7x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0345/7b6868b89072ad77ab22610661713fabx.jpg",
          "https://pictures.dealer.com/g/gollingkia/1795/7c806d0557eaedf12ac2beb03a5afc57x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1461/0502af93987db4648fd11cac20241a20x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0578/faeff3bae367ad16b210b905ac783723x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0943/12b1d3da8ac8c1a5d4f14ddbff63dc9ex.jpg",
          "https://pictures.dealer.com/g/gollingkia/0338/ef2ab024a27b602fb54f55b26008b4b0x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0720/eec431ebd3fc541d9e559596eb18026ax.jpg",
          "https://pictures.dealer.com/g/gollingkia/0005/ca64a479db7b3019cfbb9c0d6b580b84x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0782/6724eca1e38786e7342fce46f031223ex.jpg",
          "https://pictures.dealer.com/g/gollingkia/0347/ff9599404988606c2b62a507d395d9a4x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1657/7c7e708cdd0eae96d23db591e98fc678x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1302/cf327f087bc7a82d5eb1d1ed3c761990x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0487/58af992c6989c254f43bca82315191f3x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0453/4c3b97f4e80fbd1f4d308fb051d97d7ex.jpg",
          "https://pictures.dealer.com/g/gollingkia/1182/60bb07e383572777fd204c9490590a8ex.jpg",
          "https://pictures.dealer.com/g/gollingkia/1921/2f7a1583b2704a0d50518761a4b09707x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1201/ad3ba480c093386e2ff05b5ba4947ffcx.jpg"
        ]
      },
      "dealer": {
        "id": 10018497,
        "website": "gollingkia.com",
        "name": "Golling Kia Of Madison Heights",
        "dealer_type": "franchise",
        "dealership_group_name": "Golling Automotive Group",
        "street": "700 E. 14 Mile Road",
        "city": "Madison Heights",
        "state": "MI",
        "country": "US",
        "latitude": "42.533795",
        "longitude": "-83.100802",
        "zip": "48071",
        "msa_code": "2160",
        "phone": "248-951-1900",
        "seller_email": "brian.vietzke@golling.com"
      },
      "mc_dealership": {
        "mc_website_id": 10018497,
        "mc_dealer_id": 1157528,
        "mc_location_id": 1401222,
        "mc_rooftop_id": 703305,
        "mc_dealership_group_id": 261,
        "mc_dealership_group_name": "Golling Automotive Group",
        "mc_sub_dealership_group_id": 261,
        "mc_sub_dealership_group_name": "Golling Automotive Group",
        "mc_category": "Dealer",
        "website": "gollingkia.com",
        "name": "Golling Kia Of Madison Heights",
        "dealer_type": "franchise",
        "street": "700 E. 14 Mile Road",
        "city": "Madison Heights",
        "state": "MI",
        "country": "US",
        "latitude": "42.533795",
        "longitude": "-83.100802",
        "zip": "48071",
        "msa_code": "2160",
        "phone": "248-951-1900",
        "seller_email": "brian.vietzke@golling.com"
      },
      "build": {
        "year": 2025,
        "make": "Kia",
        "model": "Niro",
        "trim": "EX Touring",
        "version": "EX Touring HEV",
        "body_type": "Hatchback",
        "vehicle_type": "Car",
        "transmission": "Automatic",
        "drivetrain": "FWD",
        "fuel_type": "Unleaded",
        "engine": "1.6L I4",
        "engine_size": 1.6,
        "engine_block": "I",
        "doors": 5,
        "cylinders": 4,
        "made_in": "USA",
        "overall_height": "60.8",
        "overall_length": "174.0",
        "overall_width": "71.9",
        "std_seating": "5",
        "highway_mpg": 45,
        "city_mpg": 53,
        "powertrain_type": "HEV"
      }
    },
    {
      "id": "KNAG44J8XS5340516-3ddf58fc-bddc",
      "vin": "KNAG44J8XS5340516",
      "heading": "2025 Kia K5 GT Sedan",
      "price": 33143,
      "miles": 10,
      "msrp": 34925,
      "data_source": "mc",
      "vdp_url": "https://www.gollingkia.com/new/Kia/2025-Kia-K5-bbf338e3ac1808a1f6a18bbed66c513e.htm",
      "carfax_1_owner": false,
      "carfax_clean_title": false,
      "exterior_color": "Wolf Gray",
      "interior_color": "Black",
      "base_int_color": "Black",
      "base_ext_color": "Gray",
      "dom": 74,
      "dom_180": 74,
      "dom_active": 74,
      "dos_active": 74,
      "seller_type": "dealer",
      "inventory_type": "new",
      "stock_no": "25418",
      "last_seen_at": 1740363541,
      "last_seen_at_date": "2025-02-24T02:19:01.000Z",
      "scraped_at": 1740363541,
      "scraped_at_date": "2025-02-24T02:19:01.000Z",
      "first_seen_at": 1740363541,
      "first_seen_at_date": "2025-02-24T02:19:01.000Z",
      "first_seen_at_source": 1734095393,
      "first_seen_at_source_date": "2024-12-13T13:09:53.000Z",
      "first_seen_at_mc": 1734095037,
      "first_seen_at_mc_date": "2024-12-13T13:03:57.000Z",
      "ref_price": 33243,
      "price_change_percent": -0.3,
      "ref_price_dt": 1740274295,
      "ref_miles": 10,
      "ref_miles_dt": 1740274295,
      "source": "gollingkia.com",
      "in_transit": false,
      "availability_status": "In Stock",
      "media": {
        "photo_links": [
          "https://pictures.dealer.com/g/gollingkia/1569/db7a87b2fe27e0ae791c408a39359acex.jpg",
          "https://pictures.dealer.com/g/gollingkia/1205/106fe826073b5bb0bf0e315463164791x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1030/c4ed171772dc3b157b2d95cabd9d89e7x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0977/2e0fad9fe5d5ea043253a6f48fdcdbcdx.jpg",
          "https://pictures.dealer.com/g/gollingkia/1418/9c40377a03121a4117703a08306c7850x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0449/f927ec76208ee4d7192f8617b0853275x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1161/2e795ea54726e9bd375486f816872e0bx.jpg",
          "https://pictures.dealer.com/g/gollingkia/0667/c42b289724552c54b4a7a8e03beca8b2x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0932/664e5082502e84b3028ca2cb35fc5c0ax.jpg",
          "https://pictures.dealer.com/g/gollingkia/1187/b3af4031760eda53ca1771573ddde069x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0887/03fb99b534582cdccbbe2e5f8684725ex.jpg",
          "https://pictures.dealer.com/g/gollingkia/1203/05d8aba343788e75eab6665a7a0e717dx.jpg",
          "https://pictures.dealer.com/g/gollingkia/0817/15976a335ec8f0cdf86316a4b15dea17x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0888/94c3e793d024754521986a8442a19d28x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0751/09a1eb98cb5a9d43e0421b3f7b80b780x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1549/19c4b9c1e68f29565ce4dfc9c54edd12x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1437/eda2bbd74dc773fefbcebe92a06b033fx.jpg",
          "https://pictures.dealer.com/g/gollingkia/1641/567709303f52621d26f4937c823e1e57x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0532/b0897e72940e824efdfa3b73e20dbcd2x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0766/d5d1dc3154e32dc8628eee95e6919026x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0076/43690da178dcc4f640b4e5b0694ff324x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1185/6ed22e1324484b67d82c7c0395f5fa18x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0548/ea1f20057064c55dd126b22689b42b4ax.jpg",
          "https://pictures.dealer.com/g/gollingkia/0160/6bf0d49979ef13796c403a97fcea9643x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0679/917a91610b44d9e2c323d0d2253a908dx.jpg",
          "https://pictures.dealer.com/g/gollingkia/1550/d93dfc0cdd1e62d1be37dae74fa1cb57x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1826/8ba409a3e4d816b2c548764c07a658f7x.jpg"
        ]
      },
      "dealer": {
        "id": 10018497,
        "website": "gollingkia.com",
        "name": "Golling Kia Of Madison Heights",
        "dealer_type": "franchise",
        "dealership_group_name": "Golling Automotive Group",
        "street": "700 E. 14 Mile Road",
        "city": "Madison Heights",
        "state": "MI",
        "country": "US",
        "latitude": "42.533795",
        "longitude": "-83.100802",
        "zip": "48071",
        "msa_code": "2160",
        "phone": "248-951-1900",
        "seller_email": "brian.vietzke@golling.com"
      },
      "mc_dealership": {
        "mc_website_id": 10018497,
        "mc_dealer_id": 1157528,
        "mc_location_id": 1401222,
        "mc_rooftop_id": 703305,
        "mc_dealership_group_id": 261,
        "mc_dealership_group_name": "Golling Automotive Group",
        "mc_sub_dealership_group_id": 261,
        "mc_sub_dealership_group_name": "Golling Automotive Group",
        "mc_category": "Dealer",
        "website": "gollingkia.com",
        "name": "Golling Kia Of Madison Heights",
        "dealer_type": "franchise",
        "street": "700 E. 14 Mile Road",
        "city": "Madison Heights",
        "state": "MI",
        "country": "US",
        "latitude": "42.533795",
        "longitude": "-83.100802",
        "zip": "48071",
        "msa_code": "2160",
        "phone": "248-951-1900",
        "seller_email": "brian.vietzke@golling.com"
      },
      "build": {
        "year": 2025,
        "make": "Kia",
        "model": "K5",
        "trim": "GT",
        "version": "GT FWD",
        "body_type": "Sedan",
        "vehicle_type": "Car",
        "transmission": "Automatic",
        "drivetrain": "FWD",
        "fuel_type": "Unleaded",
        "engine": "2.5L I4",
        "engine_size": 2.5,
        "engine_block": "I",
        "doors": 4,
        "cylinders": 4,
        "made_in": "USA",
        "overall_height": "56.9",
        "overall_length": "193.1",
        "overall_width": "73.2",
        "std_seating": "5",
        "highway_mpg": 33,
        "city_mpg": 23,
        "powertrain_type": "Combustion"
      }
    },
    {
      "id": "KNAG44J82S5338792-43b2e08e-45d7",
      "vin": "KNAG44J82S5338792",
      "heading": "2025 Kia K5 GT Sedan",
      "price": 33143,
      "miles": 6,
      "msrp": 34925,
      "data_source": "mc",
      "vdp_url": "https://www.gollingkia.com/new/Kia/2025-Kia-K5-bbf33705ac183a819d9a13e275f47700.htm",
      "carfax_1_owner": false,
      "carfax_clean_title": false,
      "exterior_color": "Wolf Gray",
      "interior_color": "Black",
      "base_int_color": "Black",
      "base_ext_color": "Gray",
      "dom": 74,
      "dom_180": 74,
      "dom_active": 74,
      "dos_active": 73,
      "seller_type": "dealer",
      "inventory_type": "new",
      "stock_no": "25417",
      "last_seen_at": 1740363534,
      "last_seen_at_date": "2025-02-24T02:18:54.000Z",
      "scraped_at": 1740363534,
      "scraped_at_date": "2025-02-24T02:18:54.000Z",
      "first_seen_at": 1740363534,
      "first_seen_at_date": "2025-02-24T02:18:54.000Z",
      "first_seen_at_source": 1734095395,
      "first_seen_at_source_date": "2024-12-13T13:09:55.000Z",
      "first_seen_at_mc": 1734094406,
      "first_seen_at_mc_date": "2024-12-13T12:53:26.000Z",
      "ref_price": 33243,
      "price_change_percent": -0.3,
      "ref_price_dt": 1740274295,
      "ref_miles": 6,
      "ref_miles_dt": 1740274295,
      "source": "gollingkia.com",
      "in_transit": false,
      "availability_status": "In Stock",
      "media": {
        "photo_links": [
          "https://pictures.dealer.com/g/gollingkia/1622/ef40b6db5e0b740adaf1c1f2598d9376x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0777/b7922aa7e05613f6470d236d9c88edc5x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1885/7303705a7f1f2c7cc89acd3b8905ac13x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0363/00e34ee76cf5ca1664897e6109dffa20x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0414/fb3f6c6c77fba97b5701803fb7af8d40x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0424/de6b590b9ffc59839b79335c92bcb2fex.jpg",
          "https://pictures.dealer.com/g/gollingkia/0901/167fc05e60745b2875086130168ac2f1x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0418/f8b92e366b3239e1324bd15111fe2054x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1077/a38d1c1693ac10670c9286fd4fc8a5a5x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1408/ae976deae8dc3a214a1ddb4656ebb5a3x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0362/6b2a2c258396fa60c5cf74011d9045d3x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1924/db2ea47ba92f7db6f3f65bd42b93f853x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1397/4cdd4845fa40f1fdd09e1256a575eddex.jpg",
          "https://pictures.dealer.com/g/gollingkia/0684/8aed252b38d433dd303b43eea726912fx.jpg",
          "https://pictures.dealer.com/g/gollingkia/0714/03d6486258775ce942861c8744560ad5x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1549/19c4b9c1e68f29565ce4dfc9c54edd12x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1437/eda2bbd74dc773fefbcebe92a06b033fx.jpg",
          "https://pictures.dealer.com/g/gollingkia/0831/3eed988511d7b30519e2c83727c5b2e9x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0532/b0897e72940e824efdfa3b73e20dbcd2x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1593/6ae7ee5b944825607045d90f76239f18x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1144/7827efc890dd6aadfbbc40b0fa0b6567x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0515/cddaeef1a0715855dffda79cbdad60e6x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1494/d5d2ffbacce0b0058a8379317db001a8x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0117/ee0e658a8598e0f7db331aa46af61146x.jpg",
          "https://pictures.dealer.com/g/gollingkia/1098/5c02f154166c9846ace1d484ec02834fx.jpg",
          "https://pictures.dealer.com/g/gollingkia/0348/68b3e32715dc0c36dc717861d7fffef2x.jpg",
          "https://pictures.dealer.com/g/gollingkia/0448/d864af5ae1f4537cda726e4651cfa8a9x.jpg"
        ]
      },
      "dealer": {
        "id": 10018497,
        "website": "gollingkia.com",
        "name": "Golling Kia Of Madison Heights",
        "dealer_type": "franchise",
        "dealership_group_name": "Golling Automotive Group",
        "street": "700 E. 14 Mile Road",
        "city": "Madison Heights",
        "state": "MI",
        "country": "US",
        "latitude": "42.533795",
        "longitude": "-83.100802",
        "zip": "48071",
        "msa_code": "2160",
        "phone": "248-951-1900",
        "seller_email": "brian.vietzke@golling.com"
      },
      "mc_dealership": {
        "mc_website_id": 10018497,
        "mc_dealer_id": 1157528,
        "mc_location_id": 1401222,
        "mc_rooftop_id": 703305,
        "mc_dealership_group_id": 261,
        "mc_dealership_group_name": "Golling Automotive Group",
        "mc_sub_dealership_group_id": 261,
        "mc_sub_dealership_group_name": "Golling Automotive Group",
        "mc_category": "Dealer",
        "website": "gollingkia.com",
        "name": "Golling Kia Of Madison Heights",
        "dealer_type": "franchise",
        "street": "700 E. 14 Mile Road",
        "city": "Madison Heights",
        "state": "MI",
        "country": "US",
        "latitude": "42.533795",
        "longitude": "-83.100802",
        "zip": "48071",
        "msa_code": "2160",
        "phone": "248-951-1900",
        "seller_email": "brian.vietzke@golling.com"
      },
      "build": {
        "year": 2025,
        "make": "Kia",
        "model": "K5",
        "trim": "GT",
        "version": "GT FWD",
        "body_type": "Sedan",
        "vehicle_type": "Car",
        "transmission": "Automatic",
        "drivetrain": "FWD",
        "fuel_type": "Unleaded",
        "engine": "2.5L I4",
        "engine_size": 2.5,
        "engine_block": "I",
        "doors": 4,
        "cylinders": 4,
        "made_in": "USA",
        "overall_height": "56.9",
        "overall_length": "193.1",
        "overall_width": "73.2",
        "std_seating": "5",
        "highway_mpg": 33,
        "city_mpg": 23,
        "powertrain_type": "Combustion"
      }
    }
  ]
}
Mock data updated successfully!
POLYNIOs-MacBook-Pro:car-price-scanner-v3 3 2 copy polynio$ 






