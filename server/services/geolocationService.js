const axios = require('axios');

class GeolocationService {
    /**
     * Get geolocation data from IP address
     * Uses ip-api.com (free, no API key required)
     */
    async getLocationFromIP(ipAddress) {
        try {
            // Handle localhost/private IPs
            if (this.isPrivateIP(ipAddress)) {
                return this.getDefaultLocation();
            }

            // Call free IP geolocation API
            const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
                timeout: 5000
            });

            if (response.data.status === 'success') {
                return {
                    success: true,
                    city: response.data.city || 'Unknown',
                    region: response.data.regionName || '',
                    country: response.data.country || 'Unknown',
                    countryCode: response.data.countryCode || '',
                    latitude: response.data.lat || 0,
                    longitude: response.data.lon || 0,
                    timezone: response.data.timezone || 'UTC',
                    isp: response.data.isp || 'Unknown'
                };
            }

            return this.getDefaultLocation();
        } catch (error) {
            console.error('Geolocation service error:', error.message);
            return this.getDefaultLocation();
        }
    }

    /**
     * Check if IP is private/localhost
     */
    isPrivateIP(ip) {
        if (!ip) return true;
        
        // Remove IPv6 prefix if present
        ip = ip.replace('::ffff:', '');
        
        // Localhost
        if (ip === '127.0.0.1' || ip === 'localhost' || ip === '::1') {
            return true;
        }

        // Private IP ranges
        const parts = ip.split('.');
        if (parts.length !== 4) return false;

        const first = parseInt(parts[0]);
        const second = parseInt(parts[1]);

        // 10.0.0.0 - 10.255.255.255
        if (first === 10) return true;

        // 172.16.0.0 - 172.31.255.255
        if (first === 172 && second >= 16 && second <= 31) return true;

        // 192.168.0.0 - 192.168.255.255
        if (first === 192 && second === 168) return true;

        return false;
    }

    /**
     * Get default location for private/localhost IPs
     * Using Melbourne, Australia as default for development
     */
    getDefaultLocation() {
        return {
            success: true,
            city: 'Melbourne',
            region: 'Victoria',
            country: 'Australia',
            countryCode: 'AU',
            latitude: -37.8136,
            longitude: 144.9631,
            timezone: 'Australia/Melbourne',
            isp: 'Local Network'
        };
    }

    /**
     * Parse User-Agent to extract device info
     */
    parseUserAgent(userAgent) {
        if (!userAgent) {
            return {
                type: 'Unknown',
                browser: 'Unknown',
                os: 'Unknown',
                device: 'Unknown'
            };
        }

        const ua = userAgent.toLowerCase();
        
        // Detect OS
        let os = 'Unknown';
        if (ua.includes('windows')) os = 'Windows';
        else if (ua.includes('mac')) os = 'macOS';
        else if (ua.includes('linux')) os = 'Linux';
        else if (ua.includes('android')) os = 'Android';
        else if (ua.includes('ios') || ua.includes('iphone') || ua.includes('ipad')) os = 'iOS';

        // Detect Browser
        let browser = 'Unknown';
        if (ua.includes('edg/')) browser = 'Edge';
        else if (ua.includes('chrome') && !ua.includes('edg')) browser = 'Chrome';
        else if (ua.includes('firefox')) browser = 'Firefox';
        else if (ua.includes('safari') && !ua.includes('chrome')) browser = 'Safari';
        else if (ua.includes('opera')) browser = 'Opera';

        // Detect Device Type
        let device = 'Desktop';
        if (ua.includes('mobile')) device = 'Mobile';
        else if (ua.includes('tablet') || ua.includes('ipad')) device = 'Tablet';

        return {
            type: userAgent,
            browser,
            os,
            device
        };
    }

    /**
     * Get complete location data
     */
    async getCompleteLocationData(req) {
        const ipAddress = this.getClientIP(req);
        const userAgent = req.get('User-Agent') || '';

        const locationData = await this.getLocationFromIP(ipAddress);
        const deviceInfo = this.parseUserAgent(userAgent);

        return {
            ipAddress,
            city: locationData.city,
            region: locationData.region,
            country: locationData.country,
            countryCode: locationData.countryCode,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timezone: locationData.timezone,
            deviceInfo,
            location: {
                type: 'Point',
                coordinates: [locationData.longitude, locationData.latitude]
            }
        };
    }

    /**
     * Extract client IP from request
     */
    getClientIP(req) {
        return (
            req.headers['x-forwarded-for']?.split(',')[0].trim() ||
            req.headers['x-real-ip'] ||
            req.connection.remoteAddress ||
            req.socket.remoteAddress ||
            req.ip ||
            '127.0.0.1'
        );
    }
}

module.exports = new GeolocationService();

