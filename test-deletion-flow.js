// Test Account Deletion and Recreation
// Run this in the browser console to test the flow

async function testAccountDeletionFlow() {
  const testEmail = 'test.deletion@example.com';
  const testPhone = '+22677799999';
  
  console.log('🧪 Starting Account Deletion Test Flow');
  
  try {
    // Step 1: Check if test email/phone are available
    console.log('1️⃣ Checking initial availability...');
    
    let emailCheck = await fetch('/api/auth/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: testEmail })
    });
    let emailResult = await emailCheck.json();
    console.log('📧 Email availability:', emailResult);
    
    let phoneCheck = await fetch('/api/auth/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: testPhone })
    });
    let phoneResult = await phoneCheck.json();
    console.log('📱 Phone availability:', phoneResult);
    
    // Step 2: If accounts exist, delete them first
    if (!emailResult.available && emailResult.existingUserId) {
      console.log('2️⃣ Deleting existing email account...');
      
      let deleteResponse = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: emailResult.existingUserId,
          confirmation: 'DELETE MY ACCOUNT'
        })
      });
      let deleteResult = await deleteResponse.json();
      console.log('🗑️ Email account deletion result:', deleteResult);
    }
    
    if (!phoneResult.available && phoneResult.existingUserId) {
      console.log('2️⃣ Deleting existing phone account...');
      
      let deleteResponse = await fetch('/api/user/delete-account', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: phoneResult.existingUserId,
          confirmation: 'DELETE MY ACCOUNT'
        })
      });
      let deleteResult = await deleteResponse.json();
      console.log('🗑️ Phone account deletion result:', deleteResult);
    }
    
    // Step 3: Wait a moment for database consistency
    console.log('3️⃣ Waiting for database consistency...');
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Check availability again after deletion
    console.log('4️⃣ Checking availability after deletion...');
    
    emailCheck = await fetch('/api/auth/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: testEmail })
    });
    emailResult = await emailCheck.json();
    console.log('📧 Email availability after deletion:', emailResult);
    
    phoneCheck = await fetch('/api/auth/check-availability', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contact: testPhone })
    });
    phoneResult = await phoneCheck.json();
    console.log('📱 Phone availability after deletion:', phoneResult);
    
    // Step 5: Test results
    console.log('5️⃣ Test Results:');
    
    if (emailResult.available && phoneResult.available) {
      console.log('✅ SUCCESS: Both email and phone are available for reuse after deletion');
    } else {
      console.log('❌ ISSUE: Email or phone still showing as unavailable');
      console.log('- Email available:', emailResult.available);
      console.log('- Phone available:', phoneResult.available);
    }
    
  } catch (error) {
    console.error('🚨 Test failed:', error);
  }
}

// Run the test
testAccountDeletionFlow();