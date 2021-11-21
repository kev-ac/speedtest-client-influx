const speedTest = require('speedtest-net');
const ping = require('ping');
const cron = require('node-cron');
const {InfluxDB, Point} = require('@influxdata/influxdb-client');
const {hostname} = require('os');

const url = process.env.INFLUX_URL;
const token = process.env.INFLUX_TOKEN;
const org = process.env.INFLUX_ORG;
const bucket = process.env.INFLUX_BUCKET;

const writeApi = new InfluxDB({url, token}).getWriteApi(org, bucket, 's')
writeApi.useDefaultTags({location: hostname()})

/* Schedule cron tasks */
cron.schedule('*/10 * * * * *', () => {
    console.log('Running ping task');
    testPing()
        .then((r) => {

        })
});
cron.schedule('*/15 * * * * *', () => {
    console.log('Running speedtest task');
    testSpeed()
        .then((r) => {

        })

});

/* Ping test */
const testPing = async () =>  {
    const hosts = ['1.1.1.1', '8.8.8.8', '1.0.0.1'];
    let hostsUp = 0;

    let res;
    for(let host of hosts){
        res = await ping.promise.probe(host, {
            timeout: 2
        });

        if(res.alive) {
            hostsUp++;
        }

    }

    const hostsUpRatio = hostsUp / hosts.length;
    let point;
    if(hostsUpRatio > 0.5) {
        console.log("Internet seems to be up.");
        point = new Point('ping')
            .tag('client_id', process.env.CLIENT_ID ?? "default_client")
            .booleanField('internet_up', true)
            .stringField('internet_state', "UP")
            .intField('internet_state_int', 2)
            .floatField('ping_ms', res.avg)

        ;
    }
    else if(hostsUpRatio <= 0.5 && hostsUpRatio > 0) {
        console.log("Internet seems to be degraded.");
        point = new Point('ping')
            .tag('client_id', process.env.CLIENT_ID ?? "default_client")
            .booleanField('internet_up', true)
            .stringField('internet_state', "DEGRADED")
            .intField('internet_state_int', 1)
        ;
    }
    else {
        console.log("Internet seems to be down.");
        point = new Point('ping')
            .tag('client_id', process.env.CLIENT_ID ?? "default_client")
            .booleanField('internet_up', false)
            .stringField('internet_state', "DOWN")
            .intField('internet_state_int', 0)
        ;
    }
    console.debug("HostsUpRatio", hostsUpRatio);

    writeDatapoint(point);
};

/* Speed test */
const testSpeed = async () => {

    try {
        const result = await speedTest({
            acceptLicense: process.env.ACCEPT_LICENSE ?? false,
            acceptGdpr: process.env.ACCEPT_GDPR ?? false,
        });

        console.log(result);
        const point = new Point('speedtest')
            .tag('client_id', process.env.CLIENT_ID ?? "default_client")
            /* See Issue https://github.com/ddsol/speedtest.net/issues/125#issuecomment-964461980 */
            .floatField('upstream_bandwidth', result.upload.bandwidth / 125004)
            .floatField('downstream_bandwidth', result.download.bandwidth / 125004)
            .intField('ping_jitter', result.ping.jitter)
            .intField('ping_latency', result.ping.latency)
            .intField('packet_loss', result.packetLoss)
            .tag('internal_ip', result.interface.internalIp)
            .tag('external_ip', result.interface.externalIp)
            .tag('speedtest_server_id', result.server.id)
        ;
        writeDatapoint(point);

    } catch (err) {
        console.log(err.message);
        return false;
    }
};

/* Handling of writing data points to Influx */
const writeDatapoint = (point) => {

    writeApi.writePoint(point)
    console.log(` ${point}`)

    writeApi
        .flush()
        .then(() => {
            console.log('Finished writing.')
        })
        .catch(e => {
            console.error(e)
            console.log('\nGot an error while writing.')
        })
};
