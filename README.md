# Simple internet connectivity client

---
This repo features a simple client to test internet speed and connectivity to multiple IPs.
Results are pushed to a remote InfluxDB v2 server.

⚠️ The client is written in very basic terms, but it does it's job fine for me. 
Give it a star or help to improve it by opening a PR.

### Installation

#### Environment
These environment variables need to be set:

- `INFLUX_URL` URL of the InfluxDB server
- `INFLUX_TOKEN` Accesstoken for InfluxDB server
- `INFLUX_ORG` InfluxDB organization
- `INFLUX_BUCKET` InfluxDB bucket name
- `CLIENT_ID` Client identifier (optional, in case you want to run more instances of this client)

### Testing procedure
With default settings this client will do a ping test every 10 seconds and a speed test every 15 minutes.
