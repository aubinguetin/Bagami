-- Migration script to fix existing users with old phone number format
-- This will extract country codes from existing phone numbers and populate the new countryCode field

-- First, update users who have phone numbers starting with country codes
-- This covers the main cases where phone numbers were stored with country codes

-- Burkina Faso (+226)
UPDATE User 
SET countryCode = '+226', 
    phone = SUBSTRING(phone, 5)
WHERE phone LIKE '+226%' AND countryCode IS NULL;

-- France (+33)
UPDATE User 
SET countryCode = '+33', 
    phone = SUBSTRING(phone, 4)
WHERE phone LIKE '+33%' AND countryCode IS NULL;

-- United States/Canada (+1)
UPDATE User 
SET countryCode = '+1', 
    phone = SUBSTRING(phone, 3)
WHERE phone LIKE '+1%' AND countryCode IS NULL;

-- United Kingdom (+44)
UPDATE User 
SET countryCode = '+44', 
    phone = SUBSTRING(phone, 4)
WHERE phone LIKE '+44%' AND countryCode IS NULL;

-- Germany (+49)
UPDATE User 
SET countryCode = '+49', 
    phone = SUBSTRING(phone, 4)
WHERE phone LIKE '+49%' AND countryCode IS NULL;

-- Spain (+34)
UPDATE User 
SET countryCode = '+34', 
    phone = SUBSTRING(phone, 4)
WHERE phone LIKE '+34%' AND countryCode IS NULL;

-- Italy (+39)
UPDATE User 
SET countryCode = '+39', 
    phone = SUBSTRING(phone, 4)
WHERE phone LIKE '+39%' AND countryCode IS NULL;

-- Add more country codes as needed...

-- For users with 00 international format (00226, 0033, etc)
-- Burkina Faso (00226)
UPDATE User 
SET countryCode = '+226', 
    phone = SUBSTRING(phone, 6)
WHERE phone LIKE '00226%' AND countryCode IS NULL;

-- France (0033)
UPDATE User 
SET countryCode = '+33', 
    phone = SUBSTRING(phone, 5)
WHERE phone LIKE '0033%' AND countryCode IS NULL;

-- Any remaining users without countryCode (assume they are Burkina Faso local numbers)
UPDATE User 
SET countryCode = '+226'
WHERE phone IS NOT NULL 
  AND phone != '' 
  AND email IS NULL 
  AND countryCode IS NULL;

-- Verification: Show the results
SELECT 
  id,
  name,
  email,
  countryCode,
  phone,
  phoneVerified,
  createdAt
FROM User 
WHERE phone IS NOT NULL OR email IS NOT NULL
ORDER BY createdAt DESC;