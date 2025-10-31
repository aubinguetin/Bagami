#!/usr/bin/env node

// Delivery Types Validation Script
const { PrismaClient } = require('@prisma/client');

async function validateDeliveryTypes() {
  const prisma = new PrismaClient();
  
  try {
    console.log('🔍 Validating Delivery Types in Database...\n');
    
    // Check total count
    const total = await prisma.delivery.count();
    console.log(`📊 Total Deliveries: ${total}`);
    
    // Check type distribution
    const requests = await prisma.delivery.count({ where: { type: 'request' } });
    const offers = await prisma.delivery.count({ where: { type: 'offer' } });
    const invalid = await prisma.delivery.count({ 
      where: { type: { notIn: ['request', 'offer'] } } 
    });
    
    console.log(`📦 Delivery Requests: ${requests}`);
    console.log(`✈️  Travel Offers: ${offers}`);
    console.log(`❌ Invalid Types: ${invalid}`);
    
    if (invalid > 0) {
      console.log('\n⚠️  Warning: Found records with invalid types!');
      const invalidRecords = await prisma.delivery.findMany({
        where: { type: { notIn: ['request', 'offer'] } },
        select: { id: true, title: true, type: true }
      });
      invalidRecords.forEach(record => {
        console.log(`  - ${record.title} (type: "${record.type}")`);
      });
    }
    
    // Detailed breakdown
    console.log('\n📋 Detailed Breakdown:');
    
    const allDeliveries = await prisma.delivery.findMany({
      select: { 
        id: true, 
        title: true, 
        type: true, 
        fromCity: true, 
        toCity: true,
        createdAt: true
      },
      orderBy: { createdAt: 'desc' }
    });
    
    allDeliveries.forEach((delivery, index) => {
      const icon = delivery.type === 'request' ? '📦' : '✈️';
      const typeLabel = delivery.type === 'request' ? 'REQUEST' : 'OFFER';
      console.log(`${index + 1}. ${icon} [${typeLabel}] ${delivery.title}`);
      console.log(`   📍 ${delivery.fromCity} → ${delivery.toCity}`);
    });
    
    // Validation result
    const isValid = invalid === 0 && total === (requests + offers);
    console.log(`\n✅ Validation Result: ${isValid ? 'PASSED' : 'FAILED'}`);
    
    if (isValid) {
      console.log('🎉 All delivery types are properly configured!');
    }
    
    await prisma.$disconnect();
    
  } catch (error) {
    console.error('❌ Error during validation:', error.message);
    await prisma.$disconnect();
    process.exit(1);
  }
}

// Run validation if this script is executed directly
if (require.main === module) {
  validateDeliveryTypes();
}

module.exports = { validateDeliveryTypes };