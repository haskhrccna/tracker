# WhatsApp Integration Setup & Troubleshooting

## ✅ Setup Complete!

Your `.env` file has been created with your Twilio credentials.

## 🚀 Next Steps

### 1. **CRITICAL: Restart Development Server**

After creating the `.env` file, you **MUST** restart your development server for Vite to load the environment variables:

```bash
# Stop the current server (Ctrl+C)
# Then start it again:
npm run dev
```

### 2. **Test WhatsApp Integration**

Open the test page in your browser:
```
http://localhost:5173/test-whatsapp.html
```

This page will:
- Show if your credentials are loaded ✅ or ❌
- Allow you to send a test message
- Display detailed error messages if something fails

### 3. **Add WhatsApp Number in App**

For students to receive notifications:
1. Student logs in
2. Clicks Settings (⚙️ icon)
3. Enters WhatsApp number (format: `+966xxxxxxxxx`)
4. Number is saved automatically

### 4. **Test in Production**

Create a review as teacher:
1. Login as teacher
2. Select a student
3. Go to "Reviews" tab
4. Click "Create New Review"
5. Select surahs and date
6. Click "Create & Notify Student"
7. Check the WhatsApp status in the expanded review card

---

## 🔧 Troubleshooting

### Issue: "WhatsApp not configured" Error

**Solution:**
1. Check that `.env` file exists in project root
2. Verify it contains all three variables:
   - `VITE_TWILIO_ACCOUNT_SID`
   - `VITE_TWILIO_AUTH_TOKEN`
   - `VITE_TWILIO_WHATSAPP_NUMBER`
3. **Restart the dev server** (this is the most common fix!)

```bash
# Check if .env exists:
ls -la .env

# View contents (don't share these publicly!):
cat .env

# Restart server:
npm run dev
```

### Issue: Message Fails with "Forbidden" or 403

**Possible Causes:**
1. **Invalid Twilio credentials** - Double-check Account SID and Auth Token
2. **WhatsApp Sender not approved** - Your Twilio WhatsApp sender needs to be activated
3. **Recipient hasn't opted in** - For sandbox mode, recipients must send a code first

**Solution:**
1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: Messaging → Try it out → Send a WhatsApp message
3. Follow the sandbox setup instructions:
   - Recipients must send "join [your-code]" to the sandbox number first
   - Example: Send "join happy-dog" to +1 415 523 8886
4. For production: Apply for WhatsApp Business API approval

### Issue: Message Fails with "Invalid Phone Number"

**Causes:**
- Wrong phone number format
- Country code missing

**Solution:**
- Use international format: `+[country code][number]`
- Examples:
  - Saudi Arabia: `+966512345678`
  - USA: `+14155551234`
  - Egypt: `+201234567890`
- **Remove any spaces, dashes, or parentheses**

### Issue: Environment Variables Not Loading

**Symptoms:**
- Test page shows "❌ Not configured"
- Console shows "WhatsApp not configured" warning

**Solution:**
```bash
# 1. Verify .env file exists and has correct format
cat .env

# Should show:
# VITE_TWILIO_ACCOUNT_SID=ACxxxxxxxxx
# VITE_TWILIO_AUTH_TOKEN=xxxxxxxxx
# VITE_TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886

# 2. No quotes around values (Vite doesn't need them)
# ❌ Wrong: VITE_TWILIO_ACCOUNT_SID="ACxxx"
# ✅ Right: VITE_TWILIO_ACCOUNT_SID=ACxxx

# 3. MUST restart dev server
# Ctrl+C to stop
npm run dev
```

### Issue: CORS Error in Browser

**Cause:**
Browser blocking Twilio API calls due to CORS policy

**Solutions:**
1. **For Testing:** Use the test page or browser extension to disable CORS temporarily
2. **For Production:** Set up a backend proxy:
   - Create a serverless function (Netlify/Vercel)
   - Proxy WhatsApp API calls through your backend
   - Example in `notificationService.js` uses direct API calls (works in most cases)

### Issue: "Certificate Verification Failed"

**Cause:**
SSL certificate issues with Twilio API

**Solution:**
```bash
# Update Node.js to latest version
node -v  # Should be v16 or higher
```

---

## 📱 Twilio Sandbox vs Production

### Sandbox Mode (Testing)

**Limitations:**
- Recipients must opt-in by sending a code first
- Limited to pre-approved templates
- Has "sandbox" watermark

**How to use:**
1. Recipients send "join [code]" to Twilio sandbox number
2. Code is shown in Twilio Console → WhatsApp → Sandbox
3. Valid for 24 hours, then must rejoin

### Production Mode

**Benefits:**
- No opt-in required (after approval)
- Custom sender name
- Custom message templates
- Higher rate limits

**How to get approved:**
1. Apply for WhatsApp Business API access in Twilio Console
2. Provide business details and use case
3. Wait for approval (can take 1-2 weeks)
4. Update `.env` with your production number

---

## 🔍 Debugging Tips

### Enable Detailed Logging

The notification service logs all WhatsApp attempts to console:

```javascript
// Open browser console (F12)
// You'll see:
📱 WhatsApp Notification: { to: "+966...", message: "...", timestamp: "..." }
✅ WhatsApp message sent: sid_xxxxx
// OR
❌ WhatsApp send failed: { error details }
```

### Check Twilio Logs

1. Go to [Twilio Console](https://console.twilio.com/)
2. Navigate to: Monitor → Logs → Messaging
3. See real-time delivery status for all messages
4. Check error codes and details

### Common Twilio Error Codes

- **21211:** Invalid 'To' phone number
- **21408:** Permission to send not enabled
- **21606:** Phone number not verified
- **20003:** Authentication error (wrong credentials)
- **30007:** Message blocked by carrier
- **30008:** Unknown destination handset

Full list: https://www.twilio.com/docs/api/errors

---

## ✅ Verification Checklist

Before going live, verify:

- [ ] `.env` file created with all credentials
- [ ] Dev server restarted after creating `.env`
- [ ] Test page shows all ✅ green checkmarks
- [ ] Test message sent successfully
- [ ] Student can add WhatsApp number in settings
- [ ] Teacher can create review
- [ ] WhatsApp status shows "Delivered" ✓
- [ ] Student receives message on WhatsApp
- [ ] Retry button works for failed messages

---

## 🆘 Still Not Working?

1. **Check test page first:** `http://localhost:5173/test-whatsapp.html`
2. **View browser console:** Press F12, check for errors
3. **Check Twilio Console:** See actual API responses
4. **Try direct API call:** Use Postman or curl to test Twilio directly

### Direct API Test (curl):
```bash
curl -X POST https://api.twilio.com/2010-04-01/Accounts/ACce2427b5cbfceddc5ebb38d2f2e10bc6/Messages.json \
  --data-urlencode "From=whatsapp:+13632132883" \
  --data-urlencode "To=whatsapp:+966512345678" \
  --data-urlencode "Body=Test message" \
  -u ACce2427b5cbfceddc5ebb38d2f2e10bc6:3a1b35c92af35f57c176e3f5d0b7a47d
```

If this works but the app doesn't, the issue is in the frontend code.
If this fails, the issue is with Twilio configuration.

---

## 📚 Additional Resources

- [Twilio WhatsApp Documentation](https://www.twilio.com/docs/whatsapp)
- [Twilio WhatsApp Sandbox](https://www.twilio.com/docs/whatsapp/sandbox)
- [WhatsApp Business API](https://www.twilio.com/docs/whatsapp/api)
- [Twilio Error Codes](https://www.twilio.com/docs/api/errors)

---

**Need Help?** Check the browser console for detailed error messages and review the Twilio Console logs.
