---
layout: post
title:  "Consume Websocket stream and send to Prometheus in Python"
category: Technology
tag: ['websocket', 'Prometheus', 'python' ]
excerpt_separator: <!--more-->
---
Recently I was tasked with consuming data from websocket, analyse it and then send data to Prometheus.
The theory is pretty straight forward: getting data from websocket API in a stream and analyse and take the data points and send it to prometheus for visulization.
In this blog you will have all the steps and code needed to reporduce this flow.
<!--more-->
With this in mind, I decided using python to achieve all these.

Before we start, I would like to have a bit of revision on Websocket API and how it is different from REST API

![websocketvsrest](/assets/blog_images/{{ page.slug }}/websocketvsrest.png)

The diagram I took from internet explains it quite well. In simple term, you interact with REST API with a request and response fashion wheraes in websocket there is a two way connection established during interaction lifecycle therefore you dont need to constantly send request to server for retrieving data. At the end of the interaction, the two way connection is close.

### Part 1. Consuming a websocket API

You could easily find some publicly availabel websocket API, the one I used for this blog is from Binance, one of the platform used by coin traders. Though myself is not doing any coin trading nor receiving any sponsorship from them. 
They have very detailed API documentation on their [Spot API](https://github.com/binance/binance-spot-api-docs). 

The following code snippet can be used to connect to websocket API:

{% highlight python linenos %}
import json
import websocket

socket = 'wss://stream.binance.com:9443/ws/bnbusdt@kline_1m'

def on_message(ws, message):
    data = json.loads(message)
    print(data)

def on_error(ws, error):
    print(error)

def on_close(ws, close_status_code, close_msg):
    print("Connection closed")

def on_open(ws):
    print("Opened connection")

ws = websocket.WebSocketApp(
    socket, 
    on_open=on_open, 
    on_message=on_message, 
    on_error=on_error, 
    on_close=on_close )
ws.run_forever()
{% endhighlight %}

Run the above python code will give you this console output:

![pyoutput](/assets/blog_images/{{ page.slug }}/pyoutput.png)

#### Quick explain

Line 4 defines the websocket url, the details of this endpoint can be found [here](https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#klinecandlestick-streams).
"/bnbusdt@kline_1m" means retrieving data from the kline stream for bnb vs usdt, what is so called a symbol, these are cyrypto coin terminologies which you can fine richer explanations else where. 

Line 6 to line 17 defines the callback function with minimal functionality when message is received from the server.
More details can be found in [websocket-client](https://websocket-client.readthedocs.io/en/latest/) official documentation.

Line 19 and 10 creates a websocket instance and start connection and run forever.

### Futher explore the API

Previous step works fine with a single symbol, what if in the websocket I need data from more symbol or even in any websockets ?? 
The websockert API kindly offers subscription mode, with which you can subscribe multiple symbols and get the data back within the same websocket connection. refer to the following code for this:

{% highlight python linenos %}
import json
import websocket

socket = "wss://stream.binance.com:9443/ws"

ws = websocket.create_connection(socket)
ws.send(json.dumps({
  "method": "SUBSCRIBE",
  "params": [
    "btcusdt@kline_1m",
    "bnbusdt@kline_1m",
    "ethusdt@kline_1m",
    "dogeusdt@kline_1m",
    "xrpusdt@kline_1m"
  ],
  "id": 1
}))

def on_message(message):
    data = json.loads(message)
    print(data)

while True:
    result = ws.recv()
    on_message(result)

ws.close()
{% endhighlight %}

#### Quick explanation

Line 6-17 creates a websocket connection, the first action is to send a message to endpoint to subscribe to steams that are of interests. 
The playload of the subscription is like this:

{% highlight json linenos %}
{
  "method": "SUBSCRIBE",
  "params": [
    "btcusdt@kline_1m",
    "bnbusdt@kline_1m",
    "ethusdt@kline_1m",
    "dogeusdt@kline_1m",
    "xrpusdt@kline_1m"
  ],
  "id": 1
}
{% endhighlight %}

According to the [API doc](https://github.com/binance/binance-spot-api-docs/blob/master/web-socket-streams.md#live-subscribingunsubscribing-to-streams), the response of the first ws.sent(payload) call is 

{% highlight json linenos %}
{
  "result": null,
  "id": 1
}
{% endhighlight %}

When we inspect the console output when running the above python code we also get the following which indicates we are NOT doing something crazy !

![pyoutput2](/assets/blog_images/websocket-prometheus/pyoutput2.png)

Getting little tired now, to be continued! 