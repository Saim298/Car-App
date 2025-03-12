

website: https://universe.marketcheck.com/api-endpoints


API & Endpoints

Cars - Inventory Search API
GET	/v2/search/car/auto-complete	Enables auto-complete feature based on taxonomy terms of Cars vertical	
GET	/v2/listing/car/{id}/media	Get available photos, videos for a car listing	
GET	/v2/listing/car/{id}/extra	Get available options, features and seller comment	
GET	/v2/listing/car/fsbo/{id}/extra	Get available options, features and seller comment of private party listing	
GET	/v2/listing/car/auction/{id}/extra	Get available options, features and seller comment of an auction listing	
GET	/v2/listing/car/auction/{id}/media	Get available photos, videos for an auction listing	
GET	/v2/listing/car/{id}	Get all available data about a car listing returned by	
GET	/v2/listing/car/fsbo/{id}/media	Get available photos, videos for a private party listing	
GET	/v2/listing/car/fsbo/{id}	Get all available data about a private party listing returned by	
GET	/v2/search/car/active	Lookup New / Used / Certified cars for sale in US	
GET	/v2/listing/car/auction/{id}	Get all available data about an auction listing	
Cars - VIN History API
GET	/v2/history/car/{vin}	Lookup online car listing history for a VIN	
Cars - Dealer API
GET	/v2/dealer/car/{id}	Get available car dealer info by id	
GET	/v2/dealers/car	Search car dealers around a location	
GET	/v2/dealerships/car	Get available car dealership info	
Cars - Basic VIN Decoder API
GET	/v2/specs/car/auto-complete	Allows auto-complete on unique taxonomy terms for car vertical	
GET	/v2/specs/car/terms	Get unique taxonomy tokens for a field in cars vertical	
GET	/v2/decode/car/{vin}/specs	Decode a VIN to its specs	
Cars - NeoVIN Enhanced Decode API
GET	/v2/decode/car/neovin/{vin}/specs	NeoVIN Enhanced VIN Decode	
Cars - Enhanced VIN Decoder API
GET	/v2/decode/car/epi/{vin}/specs	Enhanced VIN Decoder	
Cars - CRM Cleanse API
GET	/v2/crm_check/car/{vin}	Perform a CRM cleanse check on a VIN	
Cars - Market APIs
GET	/v2/mds	Get Market Days Supply value for a car	
GET	/v2/stats/car 
Deprecated
Fetch stats on listings currently active on the market on year, make, model, trim level	
GET	/v2/popular/cars	Fetch most popular cars in US and Canada on national, state and city level	
GET	/v2/sales/car	Fetch sales stats for cars in last 90 days by year, make, model, trim, taxonomy vin combination on city, state and national level	
Cars - Private Party Inventory Search API
GET	/v2/search/car/fsbo/active	Lookup private party cars for sale in US	
Cars - Auction Inventory Search API
GET	/v2/search/car/auction/active	Lookup auction listings for sale in US	
Cars - Dealer Recent Inventory Search API
GET	/v2/search/car/recents	Lookup New / Used dealer cars for sale in US & Canada from last 90 days by various search criteria.	
Heavy Equipments - Inventory Search API
GET	/v2/listing/heavy-equipment/{id}	Get all available data about a Heavy Equipment listing	
GET	/v2/search/heavy-equipment/auto-complete	Enables auto-complete feature based on taxonomy terms of heavy equipment vertical	
GET	/v2/listing/heavy-equipment/{id}/media	Get available photos, videos for a Heavy Equipment listing	
GET	/v2/listing/heavy-equipment/{id}/extra	Get available options, features and seller comments for a Heavy Equipment listing	
GET	/v2/search/heavy-equipment/active	Lookup Used Heavy Equipments for sale in US by various search criteria	
Heavy Equipments - Dealer API
GET	/v2/dealers/heavy-equipment	Search heavy equipment dealers using various filters	
GET	/v2/dealer/heavy-equipment/{id}	Get available heavy equipment dealer info by id	
Motorcycles - Inventory Search API
GET	/v2/search/motorcycle/auto-complete	Enables auto-complete feature based on taxonomy terms of motorcycle vertical	
GET	/v2/listing/motorcycle/{id}/extra	Get available options, features and seller comments for a motorcycle listing	
GET	/v2/listing/motorcycle/{id}/media	Get available photos, videos for a motorcycle listing.	
GET	/v2/listing/motorcycle/{id}	Get all available data about motorcycle listing returned by /search/motorcycle/active endpoint.	
GET	/v2/search/motorcycle/active	Lookup New / Used Motorcycles for sale in US by various search criteria.	
Motorcycles - Dealer API
GET	/v2/dealer/motorcycle/{id}	Get available motorcycle dealer info by id	
GET	/v2/dealers/motorcycle	Search motorcycle dealers around a location	
Recreational Vehicles - Inventory Search API
GET	/v2/search/rv/auto-complete	Enables auto-complete feature based on taxonomy terms of Recreational Vehicles vertical	
GET	/v2/listing/rv/{id}/extra	Get available options, features and seller comments for a RV listing	
GET	/v2/listing/rv/{id}/media	Get available photos, videos for a RV listing	
GET	/v2/listing/rv/{id}	Get all available data about RV listing returned by /search/rv endpoint	
GET	/v2/search/rv	Lookup New / Used Recreational Vehicles for sale in US by various search criteria.	
Recreational Vehicles - Dealer API
GET	/v2/dealer/rv/{id}	Get available RV dealer info by id.	
GET	/v2/dealers/rv	Search RV dealers around a location	
Cars - Dealer Active Inventory Search API
GET	/v2/search/car/dealer/inventory/active	Search car dealers active inventory	
Cars - OEM Incentive Search API
GET	/v2/search/car/incentive/oem [Deprecated]	Search Incentive programs for 30+ car manufacturer	
Cars - Cached Images
GET	/v2/image/cache/car/{listingID}/{imageID}	Get a cached version of the car images of the photos listed on the VDP on the dealer's website.	
Cars - Car Price Prediction
GET	/v2/predict/car/price	Market API that will allow you to predict the fair retail price of a car based on it's specifications or VIN number	
Cars - Marketcheck Price US USED Base API
GET	/v2/predict/car/us/marketcheck_price	Cars - Marketcheck Price US USED Base API	
Cars - Marketcheck Price US USED Premium API
GET	/v2/predict/car/us/marketcheck_price/comparables	Cars - Marketcheck Price US USED Premium API	
Cars - Marketcheck Price US USED Premium Plus API
GET	/v2/predict/car/us/marketcheck_price/comparables/decode	Cars - Marketcheck Price US USED Premium Plus API	
Cars - AutoRecalls API
GET	/v2/car/autorecalls/{vin}	Get recall information for a VIN from AutoRecalls API	
Cars - OEM MSA Incentives Search API
GET	/v2/search/car/incentive/{oem}/{zip}	Search Incentive programs for 30+ car manufacturer	
GET	/v2/search/car/incentive/oem	Search Incentive programs for 30+ car manufacturer	
Cars - VINData Report API
GET	/v2/vindata/generate-report/aamva/{vin}	Generate VINData AAMVA Report	
Cars - Access VINData Report API
GET	/v2/vindata/access-report/aamva/{vin}	Access previously generated VINData AAMVA report	
