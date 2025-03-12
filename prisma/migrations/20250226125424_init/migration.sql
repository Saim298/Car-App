-- CreateTable
CREATE TABLE "Vehicle" (
    "vin" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "trim" TEXT NOT NULL,
    "body_type" TEXT NOT NULL,
    "engine_type" TEXT NOT NULL,
    "transmission" TEXT NOT NULL,
    "drivetrain" TEXT NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "cylinders" INTEGER NOT NULL,
    "horsepower" INTEGER NOT NULL,
    "torque" INTEGER NOT NULL,
    "displacement" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("vin")
);

-- CreateTable
CREATE TABLE "Listing" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "msrp" DOUBLE PRECISION NOT NULL,
    "miles" INTEGER NOT NULL,
    "condition" TEXT NOT NULL,
    "exterior_color" TEXT NOT NULL,
    "interior_color" TEXT NOT NULL,
    "listing_date" TIMESTAMP(3) NOT NULL,
    "source_url" TEXT NOT NULL,
    "first_seen_date" TIMESTAMP(3),
    "last_seen_date" TIMESTAMP(3),
    "status" TEXT NOT NULL,
    "certified_pre_owned" BOOLEAN NOT NULL,
    "listing_title" TEXT NOT NULL,
    "description" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Listing_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Dealer" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "dealer_type" TEXT NOT NULL,
    "franchise_dealer" BOOLEAN NOT NULL,
    "address" TEXT NOT NULL,
    "city" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "zip" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "phone" TEXT NOT NULL,
    "website" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Dealer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketMetric" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "avg_market_price" DOUBLE PRECISION NOT NULL,
    "median_market_price" DOUBLE PRECISION NOT NULL,
    "price_std_dev" DOUBLE PRECISION NOT NULL,
    "avg_miles" INTEGER NOT NULL,
    "days_on_market" INTEGER NOT NULL,
    "total_inventory" INTEGER NOT NULL,
    "similar_vehicles" INTEGER NOT NULL,
    "market_condition" TEXT NOT NULL,
    "price_trend" DOUBLE PRECISION NOT NULL,
    "supply_demand_ratio" DOUBLE PRECISION NOT NULL,
    "region" TEXT NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MarketMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricePrediction" (
    "id" TEXT NOT NULL,
    "vin" TEXT NOT NULL,
    "predicted_price" DOUBLE PRECISION NOT NULL,
    "confidence_score" DOUBLE PRECISION NOT NULL,
    "price_range_low" DOUBLE PRECISION NOT NULL,
    "price_range_high" DOUBLE PRECISION NOT NULL,
    "similar_vehicles" INTEGER NOT NULL,
    "market_condition" TEXT NOT NULL,
    "prediction_date" TIMESTAMP(3) NOT NULL,
    "region" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PricePrediction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMedia" (
    "id" TEXT NOT NULL,
    "listing_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "photo_type" TEXT NOT NULL,
    "sequence_number" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleVin" TEXT,

    CONSTRAINT "VehicleMedia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MarketTrend" (
    "id" TEXT NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "avg_price" DOUBLE PRECISION NOT NULL,
    "median_price" DOUBLE PRECISION NOT NULL,
    "inventory_count" INTEGER NOT NULL,
    "days_to_sell" INTEGER NOT NULL,
    "price_trend" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "vehicleVin" TEXT,

    CONSTRAINT "MarketTrend_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DealerMetric" (
    "id" TEXT NOT NULL,
    "dealer_id" TEXT NOT NULL,
    "inventory_count" INTEGER NOT NULL,
    "avg_days_on_lot" INTEGER NOT NULL,
    "sales_velocity" DOUBLE PRECISION NOT NULL,
    "price_competitiveness" DOUBLE PRECISION NOT NULL,
    "market_share" DOUBLE PRECISION NOT NULL,
    "measured_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DealerMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NhtsVehicle" (
    "vin" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "make" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "body_type" TEXT NOT NULL,
    "annual_miles" INTEGER NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "purchase_price" DOUBLE PRECISION NOT NULL,
    "purchase_type" TEXT NOT NULL,
    "purchase_date" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "vehicleVin" TEXT,

    CONSTRAINT "NhtsVehicle_pkey" PRIMARY KEY ("vin")
);

-- CreateTable
CREATE TABLE "Household" (
    "id" TEXT NOT NULL,
    "survey_year" INTEGER NOT NULL,
    "state_fips" TEXT NOT NULL,
    "msa_code" TEXT NOT NULL,
    "income_group" INTEGER NOT NULL,
    "vehicles_owned" INTEGER NOT NULL,
    "household_size" INTEGER NOT NULL,
    "urbanization" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Household_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TripData" (
    "id" TEXT NOT NULL,
    "vehicle_vin" TEXT NOT NULL,
    "household_id" TEXT NOT NULL,
    "trip_date" TIMESTAMP(3) NOT NULL,
    "trip_miles" DOUBLE PRECISION NOT NULL,
    "trip_duration" INTEGER NOT NULL,
    "trip_purpose" TEXT NOT NULL,
    "start_location_type" TEXT NOT NULL,
    "end_location_type" TEXT NOT NULL,
    "occupants" INTEGER NOT NULL,
    "time_of_day" TEXT NOT NULL,
    "day_of_week" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TripData_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FuelConsumption" (
    "id" TEXT NOT NULL,
    "vehicle_vin" TEXT NOT NULL,
    "gallons" DOUBLE PRECISION NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "fill_date" TIMESTAMP(3) NOT NULL,
    "odometer" INTEGER NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FuelConsumption_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MaintenanceRecord" (
    "id" TEXT NOT NULL,
    "vehicle_vin" TEXT NOT NULL,
    "service_type" TEXT NOT NULL,
    "cost" DOUBLE PRECISION NOT NULL,
    "service_date" TIMESTAMP(3) NOT NULL,
    "odometer" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceRecord_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleMarketNhts" (
    "vehicle_vin" TEXT NOT NULL,
    "nhts_vehicle_vin" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VehicleMarketNhts_pkey" PRIMARY KEY ("vehicle_vin","nhts_vehicle_vin")
);

-- CreateIndex
CREATE INDEX "Vehicle_make_model_idx" ON "Vehicle"("make", "model");

-- CreateIndex
CREATE INDEX "Listing_price_listing_date_idx" ON "Listing"("price", "listing_date");

-- CreateIndex
CREATE INDEX "Dealer_state_city_idx" ON "Dealer"("state", "city");

-- CreateIndex
CREATE INDEX "MarketMetric_measured_at_idx" ON "MarketMetric"("measured_at");

-- CreateIndex
CREATE INDEX "PricePrediction_prediction_date_idx" ON "PricePrediction"("prediction_date");

-- CreateIndex
CREATE INDEX "NhtsVehicle_make_model_idx" ON "NhtsVehicle"("make", "model");

-- CreateIndex
CREATE INDEX "Household_state_fips_msa_code_idx" ON "Household"("state_fips", "msa_code");

-- CreateIndex
CREATE INDEX "TripData_trip_date_idx" ON "TripData"("trip_date");

-- CreateIndex
CREATE INDEX "FuelConsumption_fill_date_idx" ON "FuelConsumption"("fill_date");

-- CreateIndex
CREATE INDEX "MaintenanceRecord_service_date_idx" ON "MaintenanceRecord"("service_date");

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_vin_fkey" FOREIGN KEY ("vin") REFERENCES "Vehicle"("vin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Listing" ADD CONSTRAINT "Listing_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketMetric" ADD CONSTRAINT "MarketMetric_vin_fkey" FOREIGN KEY ("vin") REFERENCES "Vehicle"("vin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricePrediction" ADD CONSTRAINT "PricePrediction_vin_fkey" FOREIGN KEY ("vin") REFERENCES "Vehicle"("vin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMedia" ADD CONSTRAINT "VehicleMedia_listing_id_fkey" FOREIGN KEY ("listing_id") REFERENCES "Listing"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMedia" ADD CONSTRAINT "VehicleMedia_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle"("vin") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MarketTrend" ADD CONSTRAINT "MarketTrend_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle"("vin") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DealerMetric" ADD CONSTRAINT "DealerMetric_dealer_id_fkey" FOREIGN KEY ("dealer_id") REFERENCES "Dealer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhtsVehicle" ADD CONSTRAINT "NhtsVehicle_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NhtsVehicle" ADD CONSTRAINT "NhtsVehicle_vehicleVin_fkey" FOREIGN KEY ("vehicleVin") REFERENCES "Vehicle"("vin") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripData" ADD CONSTRAINT "TripData_vehicle_vin_fkey" FOREIGN KEY ("vehicle_vin") REFERENCES "NhtsVehicle"("vin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TripData" ADD CONSTRAINT "TripData_household_id_fkey" FOREIGN KEY ("household_id") REFERENCES "Household"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FuelConsumption" ADD CONSTRAINT "FuelConsumption_vehicle_vin_fkey" FOREIGN KEY ("vehicle_vin") REFERENCES "NhtsVehicle"("vin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MaintenanceRecord" ADD CONSTRAINT "MaintenanceRecord_vehicle_vin_fkey" FOREIGN KEY ("vehicle_vin") REFERENCES "NhtsVehicle"("vin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMarketNhts" ADD CONSTRAINT "VehicleMarketNhts_vehicle_vin_fkey" FOREIGN KEY ("vehicle_vin") REFERENCES "Vehicle"("vin") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleMarketNhts" ADD CONSTRAINT "VehicleMarketNhts_nhts_vehicle_vin_fkey" FOREIGN KEY ("nhts_vehicle_vin") REFERENCES "NhtsVehicle"("vin") ON DELETE RESTRICT ON UPDATE CASCADE;
