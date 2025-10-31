-- Fix phone numbers that are still in the old combined format
-- This handles cases where phone field still contains full international number

-- Fix specific cases I see in the database:
-- Case 1: phone="+22866554311" countryCode="+226" -> phone="66554311" countryCode="+226"
UPDATE User 
SET phone = SUBSTR(phone, 5)  -- Remove +226 prefix (4 chars)
WHERE phone LIKE '+226%' AND countryCode = '+226' AND LENGTH(phone) > 4;

-- Case 2: phone="+233236888822" countryCode="+226" -> phone="236888822" countryCode="+233" 
UPDATE User 
SET phone = SUBSTR(phone, 5), countryCode = '+233'  -- Remove +233 prefix and fix country code
WHERE phone LIKE '+233%' AND phone != countryCode;

-- Case 3: Any other full international numbers that need separation
UPDATE User 
SET phone = CASE 
    WHEN phone LIKE '+1%' AND LENGTH(phone) > 2 THEN SUBSTR(phone, 3)
    WHEN phone LIKE '+33%' AND LENGTH(phone) > 3 THEN SUBSTR(phone, 4) 
    WHEN phone LIKE '+44%' AND LENGTH(phone) > 3 THEN SUBSTR(phone, 4)
    WHEN phone LIKE '+7%' AND LENGTH(phone) > 2 THEN SUBSTR(phone, 3)
    WHEN phone LIKE '+213%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Algeria
    WHEN phone LIKE '+216%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Tunisia
    WHEN phone LIKE '+220%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Gambia
    WHEN phone LIKE '+221%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Senegal
    WHEN phone LIKE '+222%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Mauritania
    WHEN phone LIKE '+223%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Mali
    WHEN phone LIKE '+224%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Guinea
    WHEN phone LIKE '+225%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Ivory Coast
    WHEN phone LIKE '+227%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Niger
    WHEN phone LIKE '+228%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Togo
    WHEN phone LIKE '+229%' AND LENGTH(phone) > 4 THEN SUBSTR(phone, 5)  -- Benin
    ELSE phone  -- Keep as is if already separated
END,
countryCode = CASE
    WHEN phone LIKE '+1%' AND LENGTH(phone) > 2 THEN '+1'
    WHEN phone LIKE '+33%' AND LENGTH(phone) > 3 THEN '+33'
    WHEN phone LIKE '+44%' AND LENGTH(phone) > 3 THEN '+44'
    WHEN phone LIKE '+7%' AND LENGTH(phone) > 2 THEN '+7'
    WHEN phone LIKE '+213%' AND LENGTH(phone) > 4 THEN '+213'
    WHEN phone LIKE '+216%' AND LENGTH(phone) > 4 THEN '+216'
    WHEN phone LIKE '+220%' AND LENGTH(phone) > 4 THEN '+220'
    WHEN phone LIKE '+221%' AND LENGTH(phone) > 4 THEN '+221'
    WHEN phone LIKE '+222%' AND LENGTH(phone) > 4 THEN '+222'
    WHEN phone LIKE '+223%' AND LENGTH(phone) > 4 THEN '+223'
    WHEN phone LIKE '+224%' AND LENGTH(phone) > 4 THEN '+224'
    WHEN phone LIKE '+225%' AND LENGTH(phone) > 4 THEN '+225'
    WHEN phone LIKE '+227%' AND LENGTH(phone) > 4 THEN '+227'
    WHEN phone LIKE '+228%' AND LENGTH(phone) > 4 THEN '+228'
    WHEN phone LIKE '+229%' AND LENGTH(phone) > 4 THEN '+229'
    ELSE countryCode  -- Keep existing country code
END
WHERE phone LIKE '+%' AND phone != countryCode;