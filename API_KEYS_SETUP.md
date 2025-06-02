# API Keys Configuration Guide

This document explains how to obtain and configure the required API keys for the Driving School Platform.

## Required API Keys

### 1. Daily.co Video Calling API

**Purpose**: Powers online theory course video sessions between teachers and students.

**How to get API keys**:
1. Visit [Daily.co](https://www.daily.co/)
2. Sign up for a free account
3. Go to your Dashboard
4. Navigate to "Developers" → "API Keys"
5. Copy your API key

**Configuration**:
```bash
DAILY_API_KEY="your-daily-api-key-here"
DAILY_API_URL="https://api.daily.co/v1"
```

**Free Tier**: Up to 1000 participant-minutes per month

### 2. Cloudinary File Upload

**Purpose**: Handles document uploads (ID cards, medical certificates, photos, driving licenses).

**How to get API keys**:
1. Visit [Cloudinary](https://cloudinary.com/)
2. Sign up for a free account
3. Go to your Dashboard
4. Find your credentials in the "Account Details" section

**Configuration**:
```bash
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
```

**Free Tier**: 25 credits/month (approximately 25,000 images)

### 3. Baridimob Payment Gateway (Algeria)

**Purpose**: Handles payments for driving school enrollments using Algerian payment methods.

**How to get API keys**:
1. Contact Baridimob directly for merchant account setup
2. Visit their business portal or contact: business@baridimob.dz
3. Complete merchant verification process
4. Receive API credentials

**Configuration**:
```bash
BARIDIMOB_MERCHANT_ID="your-merchant-id"
BARIDIMOB_API_KEY="your-api-key"
BARIDIMOB_API_URL="https://payment.baridimob.dz/api"
BARIDIMOB_RETURN_URL="http://localhost:3000/payment/return"
BARIDIMOB_CANCEL_URL="http://localhost:3000/payment/cancel"
```

## Development/Testing Setup

For development and testing purposes, you can use these configurations:

### Testing Without Real API Keys

1. **Daily.co**: The platform will work without video calling if no API key is provided
2. **Cloudinary**: File uploads will fail gracefully - you can test other features
3. **Baridimob**: Payment simulation is already implemented for testing

### Demo Configuration

For immediate testing, you can leave the API keys as placeholder values. The platform has built-in error handling and will show appropriate messages when services are unavailable.

## Configuration Steps

1. **Copy the .env template**:
   ```bash
   cp backend/.env.example backend/.env
   ```

2. **Edit the .env file**:
   ```bash
   nano backend/.env
   ```

3. **Replace placeholder values with your actual API keys**

4. **Restart the backend**:
   ```bash
   sudo supervisorctl restart backend
   ```

5. **Verify configuration**:
   - Check backend logs: `tail -f /var/log/supervisor/backend.out.log`
   - Test video calling from the dashboard
   - Try uploading a document
   - Attempt a payment flow

## Troubleshooting

### Common Issues

1. **Video calling not working**:
   - Verify DAILY_API_KEY is correct
   - Check Daily.co dashboard for API usage
   - Ensure you haven't exceeded free tier limits

2. **File uploads failing**:
   - Verify all three Cloudinary credentials are correct
   - Check Cloudinary dashboard for usage stats
   - Ensure file types and sizes are within limits

3. **Payment issues**:
   - For development, use the simulation endpoints
   - For production, verify Baridimob merchant account status
   - Check return/cancel URLs are accessible

### Getting Help

- **Daily.co**: Check their [documentation](https://docs.daily.co/) or [support](https://help.daily.co/)
- **Cloudinary**: Visit their [documentation](https://cloudinary.com/documentation) or [support center](https://support.cloudinary.com/)
- **Baridimob**: Contact their business support team

## Security Notes

- Never commit API keys to version control
- Use environment variables for all sensitive configuration
- Rotate API keys regularly
- Monitor API usage to detect unauthorized access
- Use different keys for development and production environments

## Production Deployment

For production deployment:

1. Use a secure secret management service
2. Set up proper SSL certificates
3. Configure proper CORS origins
4. Set up monitoring and alerting for API usage
5. Implement proper backup strategies for uploaded documents