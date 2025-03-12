

Exact API Endpoints & Data Attributes
NHTSA API Endpoints and Attributes

1. VIN Decode Endpoint
URL: https://vpic.nhtsa.dot.gov/api/vehicles/DecodeVin/{vin}?format=json

Key Attributes Used:

    Results[].Variable                  // Field name
    Results[].Value                  // Field value

    Specific variables extracted:
    "Make"                           // Vehicle manufacturer
    "Model"                          // Vehicle model
    "Model Year"                    // Manufacturing year
    "Engine Type"                    // Engine description
    "Displacement (L)"               // Engine size
    "Engine Number of Cylinders"    // Number of cylinders
    "Fuel Type - Primary"           // Fuel type
    "Engine Brake (hp)"             // Horsepower
    "Transmission Style"            // Transmission type
    "Transmission Speeds"            // Number of gears
    "Drive Type"                     // Drivetrain configuration
    "Wheelbase (inches)"             // Wheelbase length
    "Overall Length (inches)"       // Vehicle length
    "Overall Width (inches)"        // Vehicle width
    "Overall Height (inches)"        // Vehicle height
    "Gross Vehicle Weight Rating"   // GVWR
    "Curb Weight (pounds)"          // Vehicle weight
    "Vehicle Type"                  // Vehicle classification
    "Plant City"                      // Manufacturing location
    "Manufacturer Name"             // Full manufacturer name
    "Series"                        // Vehicle series
    "Body Class"                     // Body style

-------------------------------------------

2. Safety Ratings Endpoint
URL: https://api.nhtsa.gov/SafetyRatings/modelyear/{year}/make/{make}/model/{model}

    Key Attributes Used:

    Results[].VehicleId                             // NHTSA vehicle identifier
    Results[].OverallRating                         // Overall safety score (stars)
    Results[].OverallFrontCrashRating               // Front crash rating
    Results[].FrontCrashDriversideRating            // Driver-side front crash
    Results[].FrontCrashPassengersideRating         // Passenger-side front crash
    Results[].OverallSideCrashRating                // Side crash rating
    Results[].SideCrashDriversideRating             // Driver-side impact 
    Results[].SideCrashPassengersideRating          // Passenger-side impact
    Results[].RolloverRating                        // Rollover resistance rating
    Results[].SidePoleRating                        // Side pole crash rating
    Results[].ComplaintsCount                       // Number of complaints
    Results[].RecallsCount                          // Number of recalls
    Results[].InvestigationCount                    // Number of investigations

-------------------------------------------

3. Recalls Endpoint
URL: https://api.nhtsa.gov/recalls/recallsByVehicle?make={make}&model={model}&modelYear={year}

Key Attributes Used:

    results[].CampaignNumber        // Recall identifier
    results[].ReportReceivedDate    // Date reported
    results[].Component             // Affected component
    results[].Summary               // Issue description
    results[].Consequence           // Potential consequences
    results[].Remedy                // Fix details
    results[].Notes                 // Additional information

-------------------------------------------

4. Complaints Endpoint
URL: https://api.nhtsa.gov/complaints/complaintsByVehicle?make={make}&model={model}&modelYear={year}

Key Attributes Used:

    results[].ODINumber             // Complaint identifier
    results[].IncidentDate          // Date of incident
    results[].Component             // Affected component
    results[].Summary               // Issue description
    results[].Crash                 // Crash involvement (Yes/No)
    results[].Fire                  // Fire involvement (Yes/No)
    results[].Injury                // Injury involvement (Yes/No)
    results[].Fatality              // Fatality involvement (Yes/No)
    results[].InjuryCount           // Number of injuries
    results[].FatalityCount         // Number of fatalities
    results[].FailureMileage        // Mileage at failure

-------------------------------------------

Potentially Valuable Unused Attributes

NHTSA API Unused Fields

VIN Decode Endpoint

"Seat Belt Type"                             // Seat belt configuration
"Front Airbag Locations"                     // Airbag positioning
"Side Airbag Locations"                      // Side airbag locations
"Knee Airbag Locations"                      // Knee airbag presence
"Curtain Airbag Locations"                  // Curtain airbag coverage
"Active Safety System Features"             // Active safety systems
"NCSA Note"                                  // Safety authority notes
"TPMS Type"                                  // Tire pressure monitoring
"Antilock Brake System (ABS)"                 // ABS type
"ESC Type"                                   // Electronic stability control
"Battery Information"                     // For electric vehicles
"Battery Type"                            // Battery technology
"Traction Control Type"                   // Traction control system
"Blind Spot Monitoring"                   // Blind spot detection
"Lane Departure Warning"                 // Lane departure system
"Forward Collision Warning"              // Collision warning system
"Pedestrian Automatic Emergency Braking" // Pedestrian detection

-------------------------------------------

Safety Ratings Additional Fields

VehicleDescription              // Test vehicle description
VehiclePicture                  // Test vehicle image
NHTSACampaignNumber             // Related campaign numbers
PrimaryRating                   // Primary safety rating
SecondaryRating                 // Secondary safety rating

-------------------------------------------
-------------------------------------------


MarketCheck API Endpoints and Attributes

1. Vehicle Specifications Endpoint
URL: {API_BASE_1}/decode/car/{vin}/specs (where API_BASE_1 is the base URL)

Key Attributes Used:

    vin             // Vehicle identification number
    year            // Model year
    make            // Manufacturer
    model           // Vehicle model
    trim            // Trim level
    body_style      // Body style
    doors           // Number of doors
    engine          // Engine details
    engine_size     // Engine displacement
    cylinders       // Number of cylinders
    transmission    // Transmission details
    drivetrain      // Drive configuration
    fuel_type       // Fuel type used
    highway_miles   // Highway fuel economy
    city_miles      // City fuel economy
    exterior_color  // Exterior paint color
    interior_color  // Interior color

-------------------------------------------

2. Active Listings Search Endpoint

URL: {API_BASE_1}/search/car/active?vin={vin} or
{API_BASE_1}/search/car/active (with query parameters)

Key Attributes Used:

listings[].id                     // Listing identifier
listings[].vin                    // Vehicle identification number
listings[].price                  // Asking price
listings[].miles                 // Odometer reading
listings[].inventory_type        // New/used/CPO
listings[].is_certified         // CPO status
listings[].is_clean_title        // Title status
listings[].has_accidents         // Accident history
listings[].source                // Listing source
listings[].days_on_market       // Listing duration
listings[].seller_type           // Dealer/private/auction
listings[].vdp_url               // Vehicle detail page URL
listings[].media.photo_links    // Photo URLs
listings[].media.video_links    // Video URLs
listings[].dealer.id            // Dealer identifier
listings[].dealer.name           // Dealer name
listings[].dealer.phone         // Contact number
listings[].dealer.city          // City location
listings[].dealer.state          // State location
listings[].dealer.zip            // ZIP code
listings[].dealer.website       // Website URL

-------------------------------------------

3. Dealer Search Endpoint

URL: {API_BASE_1}/dealers/car

Key Attributes Used:

dealers[].id                 // Dealer identifier
dealers[].name                // Dealer name
dealers[].city               // City location
dealers[].state              // State location
dealers[].zip                // ZIP code
dealers[].phone               // Contact number
dealers[].website           // Website URL
dealers[].inventory_count   // Number of listings

-------------------------------------------


MarketCheck API Unused Fields

Active Listings Additional Fields

price_changes[]                          // Price change history
carfax_1_owner                            // One-owner status
carfax_clean_title                       // Carfax title status
dom_active                               // Days on market active
dom_180                                  // 180-day history
inventory_metrics.market_turnover_rate   // Turnover metrics
geo_price_comparison[]                   // Geographic price differences
feature_count                            // Number of features
options_count                            // Number of options
build_data.plant_code                    // Manufacturing plant code
build_data.region                        // Manufacturing region
owner_count                              // Number of previous owners
predicted_value.current                   // Current predicted value
predicted_value.30day                     // 30-day predicted value
predicted_value.90day                    // 90-day predicted value
predicted_value.percentage_trend        // Predicted trend percentage
sale_history[]                          // Previous sale records

-------------------------------------------
-------------------------------------------


-------------------------------------------
5. Market Statistics Endpoint (Used in validators)
URL: Not directly visible but referenced

Key Attributes Used:

similar_vehicles.count                  // Number of similar vehicles
similar_vehicles.average_price          // Average price of similar vehicles
similar_vehicles.price_distribution[]   // Price distribution data
price_trends[]                          // Historical price data (time series)
inventory_metrics.market_days_supply    // Market inventory supply
price_compare_avg                       // Comparison to average price
-------------------------------------------

/v2/sales/car

/v2/search/car/recents












can we add this endpont

	/v2/search/car/recents	Lookup New / Used dealer cars for sale in US & Canada from last 90 days by various search criteria.



2. OEM Incentive Search
Endpoint: /v2/search/car/incentive/{oem}/{zip}
What it provides: Manufacturer incentives, rebates, and special financing offers
Value for scenarios:
Alex's Journey - Could reveal thousands in available incentives he wasn't aware of
Teen's First Car - Might include student/first-time buyer incentives
Car Payment Shock - Could reveal refinancing incentives from manufacturers
Why it's valuable: Manufacturer incentives can reduce vehicle costs by $1,000-$5,000 but are often poorly advertised by dealers. This data would provide significant negotiation leverage.


3. VINData AAMVA Report
Endpoint: /v2/vindata/generate-report/aamva/{vin}
What it provides: Official vehicle history data from the American Association of Motor Vehicle Administrators
Value for scenarios:
Sophia (immigrant buyer) - Provides authoritative vehicle history to avoid scams
Teen's First Car - Ensures vehicle has clean history with no hidden issues
Trade-In Shock - Helps validate true vehicle condition for trade valuation


Why it's valuable: This provides authoritative vehicle history data that can validate or contradict dealer claims about vehicle history, preventing costly mistakes.


6. Car Listing Extras
Endpoint: /v2/listing/car/{id}/extra
What it provides: Detailed options, features, and seller comments not included in basic listings
Value for scenarios:
Exotic Car Enthusiast - Reveals valuable factory options that affect resale
First-Time Parent - Shows detailed safety features beyond basic listing
Teen's First Car - Identifies important safety technology presence/absence
Why it's valuable: This provides the detailed feature information that significantly affects both vehicle value and suitability for specific needs (safety, luxury, etc.)