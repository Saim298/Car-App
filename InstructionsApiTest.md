The Base url which will be attached to test api is
http://localhost:5000/api/market-routes

Then next all the routes will be used agains Market Routes.

1. To generate the token, first we need to call the api http://localhost:5000/api/market-routes/token. This will be a post request. Result will be something like this :-
   {
   "access_token": "dHc52sAkJlSRK4h4W3MD4MZQJkO5CRhY"
   }

Note: Save this token somewhere. In next all the apis we have to use this token.

Before using the 2nd api attach that token in the Header tab in field write:-

Authorization and against it write Bearer mgQ7LLURYYQvXKGVrQQ9wKl1Ysj4W0eb

2.  To Search the active cars basis on VIN we have to call the api http://localhost:5000/api/market-routes/search/active-listings/{Attach your vin here}. We have this VIN JM3KFBXY3S0598514. The result against this will be:-
    {
    "num_found": 1,
    "listings": [
    {
    "id": "JM3KFBXY3S0598514-3fb20edb-62d4",
    "vin": "JM3KFBXY3S0598514",
    "heading": "2025 Mazda CX-5 2.5 Turbo Signature AWD Sport Utility",
    "price": 41345,
    "miles": 1,
    "msrp": 42445,
    "data_source": "mc",
    "vdp_url": "https://www.wernermazda.com/new/Mazda/2025-Mazda-CX-5-c599bd5eac180919ac8da2c8d097b72d.htm",
    "carfax_1_owner": false,
    "carfax_clean_title": false,
    "exterior_color": "Deep Crystal Blue Mica",
    "interior_color": "Caturra Brown Leather",
    "base_int_color": "Brown",
    "base_ext_color": "Blue",
    "dom": 76,
    "dom_180": 76,
    "dom_active": 76,
    "dos_active": 76,
    "seller_type": "dealer",
    "inventory_type": "new",
    "stock_no": "25M590",
    "last_seen_at": 1740708808,
    "last_seen_at_date": "2025-02-28T02:13:28.000Z",
    "scraped_at": 1735987919,
    "scraped_at_date": "2025-01-04T10:51:59.000Z",
    "first_seen_at": 1735987919,
    "first_seen_at_date": "2025-01-04T10:51:59.000Z",
    "first_seen_at_source": 1734240558,
    "first_seen_at_source_date": "2024-12-15T05:29:18.000Z",
    "first_seen_at_mc": 1734240558,
    "first_seen_at_mc_date": "2024-12-15T05:29:18.000Z",
    "ref_price": 40345,
    "price_change_percent": 2.48,
    "ref_price_dt": 1735895291,
    "ref_miles": 1,
    "ref_miles_dt": 1735895291,
    "source": "wernermazda.com",
    "in_transit": false,
    "media": {
    "photo_links": [
    "https://pictures.dealer.com/d/dvwernermazdallc/1529/1a09d7e2120c50df91092d39df1d6b16x.jpg",
    "https://pictures.dealer.com/d/dvwernermazdallc/1808/9a685e719fd9ccedc4cfe433ea717843x.jpg",
    "https://pictures.dealer.com/d/dvwernermazdallc/1434/aafa2732b35c14b6280bbc6b7eed1926x.jpg",
    "https://pictures.dealer.com/d/dvwernermazdallc/1700/4bd86473ce63a0ef37973a8715cca9d7x.jpg",
    "https://pictures.dealer.com/d/dvwernermazdallc/1403/ddac7c9c3928a1149296b55773c18bc3x.jpg",
    "https://pictures.dealer.com/d/dvwernermazdallc/1251/0148424c10a432a63170e457986dc302x.jpg"
    ]
    },
    "dealer": {
    "id": 1016221,
    "website": "wernermazda.com",
    "name": "Werner Mazda",
    "dealer_type": "franchise",
    "street": "736 Huse Rd",
    "city": "Manchester",
    "state": "NH",
    "country": "US",
    "latitude": "42.949383",
    "longitude": "-71.432453",
    "zip": "03103",
    "msa_code": "4760",
    "phone": "(603) 626-6666",
    "seller_email": "rhammond@wernerauto.com"
    },
    .....

        }

    ]
    }

3.  3rd api will be http://localhost:5000/api/market-routes/search/vehicle-history/{vin}. Its possible result will be like this:-
    [
    {
    "id": "JM3KFBXY3S0598514-3fb20edb-62d4",
    "price": 41345,
    "miles": 1,
    "data_source": "mc",
    "vdp_url": "https://www.wernermazda.com/new/Mazda/2025-Mazda-CX-5-c599bd5eac180919ac8da2c8d097b72d.htm",
    "seller_type": "dealer",
    "inventory_type": "new",
    "last_seen_at": 1740708808,
    "last_seen_at_date": "2025-02-28T02:13:28.000Z",
    "scraped_at": 1735987919,
    "scraped_at_date": "2025-01-04T10:51:59.000Z",
    "first_seen_at": 1735987919,
    "first_seen_at_date": "2025-01-04T10:51:59.000Z",
    "source": "wernermazda.com",
    "seller_name": "Werner Mazda",
    "city": "Manchester",
    "state": "NH",
    "zip": "03103",
    "status_date": 1740708808
    },
    ]

4.  http://localhost:5000/api/market-routes/search/vin-decode/{vin}
    Response:
    {
    "is_valid": true,
    "decode_mode": "fullVIN",
    "year": 2025,
    "make": "Mazda",
    "model": "CX-5",
    "trim": "Turbo Signature",
    "body_type": "SUV",
    "vehicle_type": "Truck",
    "transmission": "Automatic",
    "drivetrain": "4WD",
    "fuel_type": "Unleaded",
    "engine": "2.5L I4",
    "engine_size": 2.5,
    "doors": 5,
    "cylinders": 4,
    "made_in": "USA",
    "overall_height": "66.3",
    "overall_length": "180.1",
    "overall_width": "72.6",
    "std_seating": "5",
    "highway_mpg": 27,
    "city_mpg": 22,
    "powertrain_type": "Combustion"
    }
5.  http://localhost:5000/api/market-routes/search/dealer-search
    {
    "num_found": 82903,
    "dealers": [
    {
    "id": "1000002",
    "seller_name": "Gardena Nissan",
    "inventory_url": "gardenanissan.com",
    "data_source": "mc",
    "status": "active",
    "listing_count": 1508,
    "dealer_type": "franchise",
    "street": "1670 W Redondo Beach Blvd",
    "city": "Gardena",
    "state": "CA",
    "country": "US",
    "zip": "90247",
    "latitude": "33.888716",
    "longitude": "-118.306696",
    "seller_phone": "(310) 532-1600",
    "seller_email": "tom@massautogroup.com",
    "created_at": "2019-08-21T10:38:55.000Z"
    },
    ]
    }
6.  Get available options, features and seller comment of private party listing. Api is
    http://localhost:5000/api/market-routes/search/listing-car-extra/:id
    test id will be WBA5M4C57FD184182-685d4115-74f0
    {
    "id": "WBA5M4C57FD184182-685d4115-74f0",
    "high_value_features": [
    {
    "category": "Engine",
    "description": "Turbo Boost",
    "type": "Standard"
    },
    {
    "category": "Exterior",
    "description": "Upgrade Paint",
    "type": "Standard"
    },
    ]
    }

7.  Get available photos, videos for a private party listing. Api is
    http://localhost:5000/api/market-routes/search/listing-car-media/:id
    {
    "id": "WBA5M4C57FD184182-685d4115-74f0",
    "photo_url": "https://www.listedbuy.com/images/t/6372/2015-bmw-5-series-535i-x-drive-gran-turismo-awd-4dr-hatchback-0-us-w200h150.jpg",
    "photo_links": [
    "https://www.listedbuy.com/images/t/6372/2015-bmw-5-series-535i-x-drive-gran-turismo-awd-4dr-hatchback-0-us-w200h150.jpg"
    ]
    }

8.  Get all available data about a private party listing returned by id.
    http://localhost:5000/api/market-routes/search/listing-car-fsbo/:id
    {
    "id": "WBA5M4C57FD184182-685d4115-74f0",
    "vin": "WBA5M4C57FD184182",
    "heading": "2015 BMW 5 Series 535i x Drive Gran Turismo AWD",
    "price": 12200,
    "price_change_percent": 0,
    "miles": 159350,
    "msrp": 12200,
    "data_source": "mc",
    "vdp_url": "https://www.listedbuy.com/cars/hatchbacks/alabaster-al/2015-bmw-5-series-535i-x-drive-gran-turismo-awd-4dr-hatchback-0",
    "carfax_1_owner": false,
    "carfax_clean_title": false,
    "exterior_color": "Blue",
    "base_ext_color": "Blue",
    "dom": 425,
    "dom_180": 424,
    "dom_active": 424,
    "dos_active": 182,
    "seller_type": "fsbo",
    "inventory_type": "used",
    "last_seen_at": 1740700811,
    "last_seen_at_date": "2025-02-28T00:00:11.000Z",
    "scraped_at": 1740491881,
    "scraped_at_date": "2025-02-25T13:58:01.000Z",
    "first_seen_at": 1740491881,
    "first_seen_at_date": "2025-02-25T13:58:01.000Z",
    "first_seen_at_mc": 1419041664,
    "first_seen_at_mc_date": "2014-12-20T02:14:24.000Z",
    "first_seen_at_source": 1724682786,
    "first_seen_at_source_date": "2024-08-26T14:33:06.000Z",
    "ref_price": 12200,
    "ref_price_dt": 1739978414,
    "ref_miles": 159350,
    "ref_miles_dt": 1739978414,
    "source": "listedbuy.com",
    "in_transit": false,
    "car_location": {
    "mc_car_location_id": "1429906",
    "street": "3099 Ny-2",
    "city": "Cropseyville",
    "zip": "12052",
    "state": "NY",
    "latitude": "42.76585",
    "longitude": "-73.48434"
    },
    }
9.  Lookup private party cars for sale in US
    http://localhost:5000/api/market-routes/search/car-fsbo-active
    {
    "num_found": 52747,
    "listings": [
    {
    "id": "WBA5M4C57FD184182-685d4115-74f0",
    "vin": "WBA5M4C57FD184182",
    "heading": "2015 BMW 5 Series 535i x Drive Gran Turismo AWD",
    "price": 12200,
    "miles": 159350,
    "msrp": 12200,
    "data_source": "mc",
    "vdp_url": "https://www.listedbuy.com/cars/hatchbacks/alabaster-al/2015-bmw-5-series-535i-x-drive-gran-turismo-awd-4dr-hatchback-0",
    }
    ]
    }
10. Get available options, features and seller comment of an auction listing.
    Use this as a test id: 1FTFW1ET6EKE81370-c4a9a887-21c7
    http://localhost:5000/api/market-routessearch/listing-car-auction/:id
    {
    "id": "1FTFW1ET6EKE81370-c4a9a887-21c7"
    }
11. Get available photos, videos for an auction listing.
    http://localhost:5000/api/market-routes/search/listing-car-auction-media/:id
    {
    "id": "1FTFW1ET6EKE81370-c4a9a887-21c7",
    "photo_url": "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/fa89e33b-34d1-4964-82a7-2b588ceb936f.JPG",
    "photo_links": [
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/fa89e33b-34d1-4964-82a7-2b588ceb936f.JPG",
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/84a3bffd-338e-4764-a822-6d561be0a6fc.JPG",
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/05530a9d-8829-4738-9fb2-0a363b08b7b1.JPG",
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/2f996c68-083b-4d1a-9402-1830a2ccb90c.JPG",
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/1378e1e4-c888-4dfe-ad6a-fdb5afa84300.JPG",
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/946c3752-0815-4e0a-91d5-30f3e35770b7.JPG",
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/PIX155/bdd40aec-84b4-46b7-8654-83899a279b59.JPG",
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/5cff78bb-e9a4-42ad-9b69-b20c7903e7d2.JPG",
    "https://cs.copart.com/v1/AUTH_svc.pdoc00001/HPX21/d682c6f5-b144-4909-9a9c-c0ae43bd3bbe.JPG"
    ]
    }
12. Get all available data about an auction listing
    http://localhost:5000/api/market-routes/search/listing-car-auction-listing/:id
    {
    "id": "1FTFW1ET6EKE81370-c4a9a887-21c7",
    "vin": "1FTFW1ET6EKE81370",
    "heading": "2014 Ford F150 Super 3.5L",
    "price": 22239,
    "miles": 96239,
    "vdp_url": "https://www.autobidmaster.com/en/carfinder-online-auto-auctions/lot/38214769/COPART_2014_FORD_F150_SUPER_CERT_OF_TITLE-RECONSTRCTD_COLL_SOUTH_BOSTON_MA/",
    "dom": 224,
    "dom_180": 16,
    "dom_active": 16,
    "dos_active": 15,
    "seller_type": "auction",
    "inventory_type": "used",
    "last_seen_at": 1561332483,
    "last_seen_at_date": "2019-06-23T23:28:03.000Z",
    "scraped_at": 1560064783,
    "scraped_at_date": "2019-06-09T07:19:43.000Z",
    "first_seen_at": 1560064783,
    "first_seen_at_date": "2019-06-09T07:19:43.000Z",
    "first_seen_at_mc": 1559644342,
    "first_seen_at_mc_date": "2019-06-04T10:32:22.000Z",
    "source": "autobidmaster.com",
    "car_location": {
    "city": "South Boston",
    "state": "MA"
    },
    }
13. Lookup auction listings for sale in US
    http://localhost:5000/api/market-routes/search/listing-car-auction-active
    {
    "num_found": 385365,
    "listings": [
    {
    "id": "5NPEB4AC8DH741697-c372816a-4d7f",
    "vin": "5NPEB4AC8DH741697",
    "miles": 168167,
    "data_source": "mc",
    "vdp_url": "https://wsmauctions.com/hyundai-sonata-4dr-sdn-2-4l-auto-gls-other-bakersfield-ca_vid_7707667.html",
    "carfax_1_owner": false,
    "carfax_clean_title": false,
    "exterior_color": "GRAY",
    "interior_color": "OTHER",
    "base_ext_color": "Gray",
    "dom": 1004,
    "dom_180": 914,
    "dom_active": 914,
    "dos_active": 479,
    "seller_type": "auction",
    "inventory_type": "used",
    "stock_no": "553458",
    "last_seen_at": 1740708258,
    "last_seen_at_date": "2025-02-28T02:04:18.000Z",
    }
    ]
    }
14. Get Market Days Supply value for a car
    http://localhost:5000/api/market-routes/search/market-days-supply
    {
    "mds": 80,
    "total_active_cars_for_ymmt": 6179290,
    "total_cars_sold_in_last_45_days": 3476303
    }
15. Get car statistics
    http://localhost:5000/api/market-routes/search/get-car-statistics
    This api don't work
    {
    "error": "Request failed with status code 404"
    }
16. Lookup New / Used / Certified cars for sale in US
    http://localhost:5000/api/market-routes/search/get-car-active-listings
    {
    "num_found": 6179290,
    "listings": [
    {
    "id": "JM3KJDHC1S1109986-c7c253b4-3c9a",
    "vin": "JM3KJDHC1S1109986",
    "heading": "Mazda CX-70 2025",
    "miles": 0,
    "data_source": "mc",
    "vdp_url": "http://tonitokia.com/vehicles/mazda-cx-70-2025-jm3kjdhc1s1109986/",
    "dom": 193,
    "dom_180": 193,
    "dom_active": 193,
    "dos_active": 193,
    "seller_type": "dealer",
    "inventory_type": "new",
    "last_seen_at": 1740708811,
    "last_seen_at_date": "2025-02-28T02:13:31.000Z",
    "scraped_at": 1724129296,
    "scraped_at_date": "2024-08-20T04:48:16.000Z",
    "first_seen_at": 1724129296,
    "first_seen_at_date": "2024-08-20T04:48:16.000Z",
    "first_seen_at_source": 1724129296,
    "first_seen_at_source_date": "2024-08-20T04:48:16.000Z",
    "first_seen_at_mc": 1724129296,
    "first_seen_at_mc_date": "2024-08-20T04:48:16.000Z",
    "source": "tonitokia.com",
    "in_transit": false,
    "media": {
    "photo_links": [
    "https://apicdn2.inventario360.com/1024x768/filters:watermark(inv360,accounts/watermark_90eedbfff73818ea0cc0a92a35edd779.png,-29,-29,0,204,153):quality(77)/vehicles%2Fmedia_66c36e79290a0.png",
    "https://apicdn2.inventario360.com/1024x768/filters:watermark(inv360,accounts/watermark_90eedbfff73818ea0cc0a92a35edd779.png,-29,-29,0,204,153):quality(77)/vehicles%2Fmedia_66c36e7a09896.png",
    "https://apicdn2.inventario360.com/1024x768/filters:watermark(inv360,accounts/watermark_90eedbfff73818ea0cc0a92a35edd779.png,-29,-29,0,204,153):quality(77)/vehicles%2Fmedia_66c36e7dc8c85.png",
    "https://apicdn2.inventario360.com/1024x768/filters:watermark(inv360,accounts/watermark_90eedbfff73818ea0cc0a92a35edd779.png,-29,-29,0,204,153):quality(77)/vehicles%2Fmedia_66c36e7ea3be2.png"
    ]
    },
    }
    ]
    }
17. Get available car dealership info
    http://localhost:5000/api/market-routes/search/get-car-dealership-info
    {
    "num_found": 77120,
    "mc_dealerships": [
    {
    "mc_website_id": "4480",
    "mc_dealer_id": "1094053",
    "mc_location_id": "1485834",
    "mc_rooftop_id": "812061",
    "mc_category": "Dealer",
    "seller_name": "atlas auto sales",
    "inventory_url": "atlasautosales.com",
    "status": "active",
    "dealer_type": "independent",
    "street": "3715 Reynolda Road",
    "city": "Winston-salem",
    "state": "NC",
    "country": "US",
    "zip": "27106",
    "latitude": "36.160235",
    "longitude": "-80.321463",
    "seller_phone": "(336) 924-8995"
    },
    ]
    }

18. Fetch sales stats for cars in last 90 days by year, make, model, trim, taxonomy vin combination on city, state and national level

    http://localhost:5000/api/market-routes/search/get-car-sales-stats?year=2024&make=ford&model=f-150&trim=lariat&country=ca

    {
    "count": 36051,
    "cpo": 2658,
    "non_cpo": 33393,
    "inventory_type": "used",
    "make": "Ford",
    "dom_stats": {
    "geometric_mean": 67,
    "min": 1,
    "median": 78,
    "population_standard_deviation": 155,
    "variance": 23973,
    "max": 2344,
    "mean": 129,
    "trimmed_mean": 100,
    "standard_deviation": 155,
    "iqr": 136
    },
    "price_stats": {
    "geometric_mean": 27280,
    "min": 540,
    "median": 29995,
    "population_standard_deviation": 19977,
    "variance": 399074684,
    "max": 584000,
    "mean": 33086,
    "trimmed_mean": 30993,
    "standard_deviation": 19977,
    "iqr": 24115
    },
    }

19. Market API that will allow you to predict the fair retail price of a car based on it's specifications or VIN number.
    http://localhost:5000/api/market-routes/search/get-car-sales-prediction?car_type=used&year=2018&make=ford&model=f-150&trim=xlt&miles=28741&base_exterior_color=Black&base_interior_color=Brown&latitude=44.71164&longitude=-92.851607&transmission=Automatic&drivetrain=4WD&highway_mpg=23&city_mpg=18&engine_block=V&engine_size=2.7&cylinders=6&doors=4

    Use api in this form. In the dummy data you can use any other data as well.
    {
    "predicted_price": 30926,
    "price_range": {
    "lower_bound": 26685,
    "upper_bound": 35558
    },
    "specs": {
    "year": 2018,
    "make": "ford",
    "model": "f-150",
    "trim": "xlt",
    "base_exterior_color": "Black",
    "base_interior_color": "Brown",
    "is_certified": false,
    "carfax_1_owner": false,
    "carfax_clean_title": false,
    "transmission": "Automatic",
    "drivetrain": "4WD",
    "engine_block": "V",
    "engine_size": 2.7,
    "cylinders": 6,
    "doors": 4,
    "highway_mpg": 23,
    "city_mpg": 18,
    "latitude": 44.71164,
    "longitude": -92.851607,
    "miles": 28741,
    "country": "us"
    }
    }
