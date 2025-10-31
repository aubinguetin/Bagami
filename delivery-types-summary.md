# Delivery Types Documentation

## Overview
The Bagami app now properly differentiates between two types of postings:

### 1. Delivery Requests (`type = "request"`)
- **Purpose**: Someone needs to send an item from one location to another
- **User Role**: Sender (person who needs something delivered)
- **Example**: "I need to send documents from Paris to Ouagadougou"
- **Icon**: 📦 Orange Package Icon

### 2. Travel Offers (`type = "offer"`)  
- **Purpose**: Someone is traveling and offers to carry items for others
- **User Role**: Traveler (person who can carry items during their journey)
- **Example**: "I'm traveling from Algiers to Dakar and can carry small items"
- **Icon**: ✈️ Blue Airplane Icon

## Current Database State

### Distribution:
- **Travel Offers**: 3 records
  - Travel offer: Djelfa, DZ to Perth, AU
  - Travel offer: Durrës, AL to Dakar, SN
  - Travel offer: Oran, DZ to Vlorë, AL

- **Delivery Requests**: 2 records
  - clothing delivery
  - electronics delivery

### Database Schema:
```prisma
model Delivery {
  // ... other fields
  type String @default("request") // "request" (delivery request) or "offer" (travel offer)
  // ... other fields
}
```

## API Integration

### Filtering by Type:
- **All**: Returns both requests and offers
- **Requests Only**: `WHERE type = 'request'`
- **Offers Only**: `WHERE type = 'offer'`

### Updated API Endpoints:
- `/api/deliveries/search?filter=requests` - Returns only delivery requests
- `/api/deliveries/search?filter=offers` - Returns only travel offers  
- `/api/deliveries/search?filter=all` - Returns all types

## Visual Differentiation

### In Conversations List:
- Delivery requests show: 🟠 Orange package icon
- Travel offers show: 🔵 Blue airplane icon

### In Delivery Cards:
- Color coding and icons distinguish between the two types
- Clear labeling and terminology

## Business Logic

### For Delivery Requests:
- User posts what they want to send
- Travelers can "accept" the request
- Button text: "Accept Request"

### For Travel Offers:
- Traveler posts their journey details
- Senders can "contact" the traveler
- Button text: "Contact Traveler"

This system ensures clear differentiation and proper business flow for both use cases.