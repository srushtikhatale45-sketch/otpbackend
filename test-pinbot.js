const { sendOTPviaWhatsApp } = require('./services/whatsappService');

async function testPinBot() {
  console.log('Testing PinBot WhatsApp Integration...\n');
  
  const phoneNumber = '8412005368'; // Replace with your test number
  const otpCode = '123456';
  
  console.log(`Sending OTP to: ${phoneNumber}`);
  console.log(`OTP Code: ${otpCode}`);
  
  const result = await sendOTPviaWhatsApp(phoneNumber, otpCode);
  
  if (result.success) {
    console.log('\n✅ WhatsApp OTP sent successfully!');
    if (result.simulated) {
      console.log('⚠️ Note: This was a simulated message (API not configured)');
    } else {
      console.log('📱 Real WhatsApp message sent via PinBot!');
    }
  } else {
    console.log('\n❌ Failed to send WhatsApp OTP');
  }
}

// Run the test
testPinBot();