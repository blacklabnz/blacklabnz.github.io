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

![websocketvsrest](/assets/blog_images/websocketvsrest.png)

The diagram I took from internet explains it quite well. In simple term, you interact with REST API with a request and response fashion wheraes in websocket there is a two way connection established during interaction lifecycle therefore you dont need to constantly send request to server for retrieving data. At the end of the interaction, the two way connection is close.

### Part 1. Consuming a websocket API

You could easily find some publicly availabel websocket API, the one I used for this blog is from Binance, one of the platform used by coin traders. Though myself is not doing any coin trading nor receiving any sponsorship from them. 
They have very detailed API documentation on their [Spot API](https://github.com/binance/binance-spot-api-docs). 

{% highlight python linenos %}
socket2 = 'wss://stream.binance.com:9443/ws/bnbusdt@kline_1m'

prev=0
current=0
counter=0

def on_message(ws, message):
    data = json.loads(message)
    priceSpread = (float(data['k']['h']) - float(data['k']['l']))
    global current
    global prev 
    current = priceSpread
    delta = current - prev
    global counter
    result={}
    g.set(priceSpread)
    g2.set(abs(delta))
    print(data['s'], priceSpread, delta, abs(delta), counter)
    counter +=1
    prev=current
{% endhighlight %}
