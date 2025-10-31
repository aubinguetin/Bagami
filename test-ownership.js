// Test script to verify delivery ownership logic
const testDeliveryOwnership = async () => {
  // Get user from localStorage
  const userId = localStorage.getItem('bagami_user_id');
  const userContact = localStorage.getItem('bagami_user_contact');
  
  console.log('🧪 Testing with user:', { userId, userContact });
  
  // Test 1: Regular deliveries (should show all active deliveries with ownership flags)
  console.log('\n📋 Test 1: All deliveries');
  const allResponse = await fetch(`/api/deliveries/search?filter=all&currentUserId=${userId}&currentUserContact=${encodeURIComponent(userContact)}`);
  const allData = await allResponse.json();
  console.log('Total deliveries:', allData.deliveries?.length || 0);
  
  const owned = allData.deliveries?.filter(d => d.isOwnedByCurrentUser);
  const notOwned = allData.deliveries?.filter(d => !d.isOwnedByCurrentUser);
  console.log('Owned by user:', owned?.length || 0);
  console.log('Not owned by user:', notOwned?.length || 0);
  
  // Test 2: My Posts only (should show only user's deliveries)
  console.log('\n📋 Test 2: My posts only');
  const mineResponse = await fetch(`/api/deliveries/search?filter=all&mineOnly=true&currentUserId=${userId}&currentUserContact=${encodeURIComponent(userContact)}`);
  const mineData = await mineResponse.json();
  console.log('My posts:', mineData.deliveries?.length || 0);
  
  const allMine = mineData.deliveries?.every(d => d.isOwnedByCurrentUser);
  console.log('All marked as owned:', allMine);
  
  // Test 3: Check sender IDs match
  if (mineData.deliveries?.length > 0) {
    console.log('\n📋 Test 3: Sender ID verification');
    mineData.deliveries.forEach(d => {
      console.log(`Delivery ${d.id}: senderId=${d.sender?.id}, matches=${d.sender?.id === userId}`);
    });
  }
  
  console.log('\n✅ Test complete');
};

// Run test when page is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', testDeliveryOwnership);
} else {
  testDeliveryOwnership();
}