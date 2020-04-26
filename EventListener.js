const {
        Message,
        EventFilter,
        EventList,
        EventSubscription,
        ClientEventsSubscribeRequest,
        ClientEventsSubscribeResponse
} = require('sawtooth-sdk/protobuf');
const { TextDecoder } = require('text-encoding/lib/encoding');
const { Stream } = require('sawtooth-sdk/messaging/stream');
var decoder = new TextDecoder('utf8');
const uuid = require('uuid');
const request = require('request');
const { config } = require('./config');


function addDatatoContextBroker(body) {
        request.post({
                url: config.CONTEXT_BROKER + '/v2/entities',
                body: body,
                headers: { 'Content-Type': 'application/json', 'fiware-service': 'cattlechain', 'fiware-servicepath': '/CattleChainService' },
                json: true
        }, (err, response) => {
                if (err) {
                        console.log('error in adding data', err);
                }
        console.log('data added'. response);
        });
}

function getEventsMessage(message) {
        let Eventlist = EventList.decode(message.content).events
        Eventlist.map(function (event) {
                if (event.eventType === 'cattlechain/add-animal') {
                        console.log("add animal event: ", event.data.toString());
                }
                if (event.eventType === 'sawtooth/block-commit') {
                        console.log("new block event : ", event);
                }
                if (event.eventType === 'cattlechain/add-animal-event') {
                        let attribut = event.attributes;
                        let payload = {};
                        attribut.forEach(element => {
                                payload['id'] = 'urn:ngsi-ld:Event:' + uuid.v4();
                                payload['type'] = 'add-animal-event';
                                if (element.key === 'payload') {
                                        let iotEvent = JSON.parse(element.value);
                                        for (var key in iotEvent) {
                                                payload[key] = {
                                                        type: 'String',
                                                        value: iotEvent[key]
                                                }
                                        }
                                } else {
                                        payload[element.key] = {
                                                type: 'String',
                                                value: element.value
                                        }
                                }
                                console.log('payload', payload);
                                addDatatoContextBroker(payload);
                        });
                }
        })
}

function checkStatus(response) {
        let msg = ""
        if (response.status === 0) {
                msg = ' S U B S C R I P T I O N : O K'
        } if (response.status === 1) {
                msg = ' S U B S C R I P T I O N : G O O D '
        } else {
                msg = ' S U B S C R I P T I O N     F A I L E D     ! ! ! ! ! '
        }
        return msg
}

function EventSubscribe(URL) {
        let stream = new Stream(URL)
        const blockCommitSubscription = EventSubscription.create({
                eventType: 'sawtooth/block-commit'
        })
        const wordLengthSubscription = EventSubscription.create({
                eventType: 'cattlechain/add-animal',
        })
        const wordLengthSubscription1 = EventSubscription.create({
                eventType: 'cattlechain/add-animal-event',
        })
        const subscription_request = ClientEventsSubscribeRequest.encode({
                subscriptions: [wordLengthSubscription1, wordLengthSubscription]
        }).finish()

        stream.connect(() => {
                stream.send(Message.MessageType.CLIENT_EVENTS_SUBSCRIBE_REQUEST, subscription_request)
                        .then(function (response) {
                                return ClientEventsSubscribeResponse.decode(response)
                        })
                        .then(function (decoded_Response) {
                                console.log(checkStatus(decoded_Response))
                        })

                stream.onReceive(getEventsMessage)
        })

}

EventSubscribe(config.VALIDATOR_URL);