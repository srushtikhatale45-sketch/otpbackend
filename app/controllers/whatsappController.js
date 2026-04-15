const { Op } = require('sequelize');
const OTP = require('../models/OTP');
const User = require('../models/User');
const { sendOTPviaWhatsApp } = require('../services/WhatsappService'); // Fixed: lowercase 'w'
const { generateAccessToken, generateRefreshToken } = require('../config/jwt');

const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

const setTokenCookies = (res, accessToken, refreshToken) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('accessToken', accessToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 15 * 60 * 1000 });
  res.cookie('refreshToken', refreshToken, { httpOnly: true, secure: isProduction, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 });
};

// Send WhatsApp OTP
const sendWhatsAppOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    
    if (!phoneNumber || phoneNumber.length < 10) {
      return res.status(400).json({ success: false, message: 'Valid phone number is required' });
    }

    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    await OTP.destroy({ where: { phoneNumber: cleanPhoneNumber, isVerified: false, channel: 'whatsapp' } });
    
    await OTP.create({
      phoneNumber: cleanPhoneNumber,
      otpCode: otpCode,
      channel: 'whatsapp',
      expiresAt: expiresAt,
      attempts: 0
    });
    
    // Send OTP via WhatsApp
    const result = await sendOTPviaWhatsApp(cleanPhoneNumber, otpCode);
    
    // Return success without OTP in response
    res.status(200).json({ 
      success: true, 
      message: 'WhatsApp OTP sent successfully',
      channel: 'whatsapp',
      simulated: result.simulated || false
    });
  } catch (error) {
    console.error('Send WhatsApp OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to send WhatsApp OTP', error: error.message });
  }
};

// Verify WhatsApp OTP
const verifyWhatsAppOTP = async (req, res) => {
  try {
    const { phoneNumber, otpCode, name } = req.body;
    
    if (!phoneNumber || !otpCode) {
      return res.status(400).json({ success: false, verified: false, message: 'Phone number and OTP code are required' });
    }
    
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    const otpRecord = await OTP.findOne({
      where: {
        phoneNumber: cleanPhoneNumber,
        channel: 'whatsapp',
        isVerified: false,
        expiresAt: { [Op.gt]: new Date() }
      },
      order: [['createdAt', 'DESC']]
    });
    
    if (!otpRecord) {
      return res.status(400).json({ success: false, verified: false, message: 'No valid OTP found. Please request a new OTP.' });
    }
    
    if (otpRecord.attempts >= 5) {
      await otpRecord.destroy();
      return res.status(400).json({ success: false, verified: false, message: 'Too many failed attempts. Please request a new OTP.' });
    }
    
    if (otpRecord.otpCode === otpCode) {
      await otpRecord.update({ isVerified: true });
      
      let user = await User.findOne({ where: { mobileNumber: cleanPhoneNumber } });
      
      if (!user) {
        user = await User.create({
          name: name || 'User',
          mobileNumber: cleanPhoneNumber,
          isVerified: true,
          preferredChannel: 'whatsapp'
        });
      } else {
        await user.update({ isVerified: true, preferredChannel: 'whatsapp' });
      }
      
      const accessToken = generateAccessToken(user);
      const refreshToken = generateRefreshToken(user);
      await user.hashRefreshToken(refreshToken);
      await user.update({ lastLogin: new Date() });
      setTokenCookies(res, accessToken, refreshToken);
      
      return res.status(200).json({
        success: true,
        verified: true,
        message: 'Phone number verified successfully via WhatsApp',
        channel: 'whatsapp',
        user: {
          id: user.id,
          name: user.name,
          mobileNumber: user.mobileNumber,
          isVerified: true,
          preferredChannel: user.preferredChannel
        }
      });
    } else {
      await otpRecord.update({ attempts: otpRecord.attempts + 1 });
      return res.status(400).json({
        success: false,
        verified: false,
        message: `Invalid OTP. ${5 - (otpRecord.attempts + 1)} attempts remaining.`
      });
    }
  } catch (error) {
    console.error('Verify WhatsApp OTP error:', error);
    res.status(500).json({ success: false, verified: false, message: 'Failed to verify OTP', error: error.message });
  }
};

// Resend WhatsApp OTP
const resendWhatsAppOTP = async (req, res) => {
  try {
    const { phoneNumber } = req.body;
    if (!phoneNumber) return res.status(400).json({ success: false, message: 'Phone number is required' });
    
    const cleanPhoneNumber = phoneNumber.replace(/\D/g, '');
    
    const recentOTP = await OTP.findOne({
      where: {
        phoneNumber: cleanPhoneNumber,
        channel: 'whatsapp',
        createdAt: { [Op.gt]: new Date(Date.now() - 30000) }
      }
    });
    
    if (recentOTP) {
      return res.status(429).json({ success: false, message: 'Please wait 30 seconds before requesting another OTP' });
    }
    
    const otpCode = generateOTP();
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    
    await OTP.destroy({ where: { phoneNumber: cleanPhoneNumber, isVerified: false, channel: 'whatsapp' } });
    await OTP.create({
      phoneNumber: cleanPhoneNumber,
      otpCode: otpCode,
      channel: 'whatsapp',
      expiresAt: expiresAt,
      attempts: 0
    });
    
    await sendOTPviaWhatsApp(cleanPhoneNumber, otpCode);
    
    res.status(200).json({ success: true, message: 'WhatsApp OTP resent successfully', channel: 'whatsapp' });
  } catch (error) {
    console.error('Resend WhatsApp OTP error:', error);
    res.status(500).json({ success: false, message: 'Failed to resend OTP', error: error.message });
  }
};

module.exports = { sendWhatsAppOTP, verifyWhatsAppOTP, resendWhatsAppOTP };