const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

// PinBot API Configuration
const PINBOT_BASE_URL = 'https://partnersv1.pinbot.ai/v3';
const PINBOT_API_KEY = process.env.PINBOT_API_KEY;
const PHONE_NUMBER_ID = process.env.PHONE_NUMBER_ID;

// Get the correct API endpoint with actual phone number ID
const getPinBotUrl = () => {
  if (!PHONE_NUMBER_ID || PHONE_NUMBER_ID === 'your_phone_number_id_here') {
    console.log('⚠️ PHONE_NUMBER_ID not configured properly');
    return null;
  }
  return `https://partnersv1.pinbot.ai/v3/${PHONE_NUMBER_ID}/messages`;
};

/**
 * Send OTP via WhatsApp using PinBot API
 */
const sendOTPviaWhatsApp = async (phoneNumber, otpCode) => {
  try {
    // Check if PinBot API is configured
    if (!PINBOT_API_KEY || PINBOT_API_KEY === 'your_pinbot_api_key_here') {
      console.log('⚠️ PinBot API not configured. Using fallback mode.');
      return sendSimulatedWhatsApp(phoneNumber, otpCode);
    }

    if (!PHONE_NUMBER_ID || PHONE_NUMBER_ID === 'your_phone_number_id_here') {
      console.log('⚠️ Phone Number ID not configured. Using fallback mode.');
      return sendSimulatedWhatsApp(phoneNumber, otpCode);
    }

    const apiUrl = getPinBotUrl();
    if (!apiUrl) {
      console.log('⚠️ Invalid API URL configuration. Using fallback mode.');
      return sendSimulatedWhatsApp(phoneNumber, otpCode);
    }

    // Format phone number - remove any non-digit characters
    const cleanNumber = phoneNumber.replace(/\D/g, '');
    // Ensure it starts with country code (91 for India)
    const formattedNumber = cleanNumber.length === 10 ? `91${cleanNumber}` : cleanNumber;
    // Convert to number as integer (as in your curl example)
    const toNumber = parseInt(formattedNumber);

    // Prepare the request body matching your curl EXACTLY
    const requestBody = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: toNumber,
      type: "template",
      template: {
        name: "auth_template_001",
        language: {
          code: "en"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: otpCode
              }
            ]
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [
              {
                type: "payload",
                payload: ""
              }
            ]
          }
        ]
      }
    };

    console.log('\n📤 Sending OTP via PinBot WhatsApp API...');
    console.log(`API URL: ${apiUrl}`);
    console.log(`Phone: ${toNumber}`);
    console.log(`OTP: ${otpCode}`);
    console.log(`Template: otp_messages`);

    const response = await axios.post(
      apiUrl,
      requestBody,
      {
        headers: {
          'Content-Type': 'application/json',
          'apikey': PINBOT_API_KEY
        },
        timeout: 30000
      }
    );

    console.log('✅ PinBot API Response:', JSON.stringify(response.data, null, 2));
    console.log('✅ WhatsApp OTP sent successfully to:', toNumber);
    
    return { 
      success: true, 
      channel: 'whatsapp', 
      messageId: response.data?.messages?.[0]?.id || 'sent',
      apiResponse: response.data
    };
    
  } catch (error) {
    console.error('❌ PinBot API Error:', error.response?.data || error.message);
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', JSON.stringify(error.response.data, null, 2));
      
      // Check for specific error types
      if (error.response.status === 401) {
        console.error('⚠️ Invalid API Key. Please check your PINBOT_API_KEY');
      } else if (error.response.status === 404) {
        console.error('⚠️ API endpoint not found. Please check PHONE_NUMBER_ID');
      } else if (error.response.status === 400) {
        console.error('⚠️ Bad request. Check phone number format or template name');
      }
    }
    
    // Fallback to simulated mode
    console.log('Falling back to simulated WhatsApp mode...');
    return sendSimulatedWhatsApp(phoneNumber, otpCode);
  }
};

/**
 * Simulated WhatsApp (for development when API not configured)
 */
const sendSimulatedWhatsApp = (phoneNumber, otpCode) => {
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║              📱 SIMULATED WHATSAPP MESSAGE                      ║');
  console.log('╠════════════════════════════════════════════════════════════════╣');
  console.log(`║ To:      ${phoneNumber.padEnd(44)}║`);
  console.log(`║ OTP:     ${otpCode.padEnd(44)}║`);
  console.log(`║ Template: otp_messages${' '.padEnd(32)}║`);
  console.log(`║ Message: Your OTP is: ${otpCode}. Valid for 5 minutes.${' '.padEnd(44 - (34 + otpCode.length))}║`);
  console.log('╚════════════════════════════════════════════════════════════════╝\n');
  
  return { success: true, channel: 'whatsapp', simulated: true };
};

/**
 * Test PinBot API connection
 */
const testPinBotConnection = async () => {
  try {
    console.log('=== Testing PinBot API Connection ===\n');
    
    if (!PINBOT_API_KEY || PINBOT_API_KEY === 'your_pinbot_api_key_here') {
      console.log('❌ PINBOT_API_KEY not configured in .env file');
      console.log('   Please add: PINBOT_API_KEY=your_actual_key');
      return false;
    }
    
    if (!PHONE_NUMBER_ID || PHONE_NUMBER_ID === 'your_phone_number_id_here') {
      console.log('❌ PHONE_NUMBER_ID not configured in .env file');
      console.log('   Please add: PHONE_NUMBER_ID=your_actual_id');
      return false;
    }
    
    const apiUrl = getPinBotUrl();
    console.log(`✓ API URL: ${apiUrl}`);
    console.log(`✓ API Key: ${PINBOT_API_KEY.substring(0, 10)}...`);
    console.log(`✓ Phone Number ID: ${PHONE_NUMBER_ID}`);
    
    return true;
  } catch (error) {
    console.error('❌ PinBot API test failed:', error.message);
    return false;
  }
};

module.exports = {
  sendOTPviaWhatsApp,
  sendSimulatedWhatsApp,
  testPinBotConnection
};