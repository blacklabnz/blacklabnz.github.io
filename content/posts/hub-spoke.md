---
title: "Azure networking: Hub and spoke topology with terraform"
date: "2022-04-11"
draft: true
tags: ["terraform", "hub and spoke", "private endpoints", "azure firewall", "forced tunneling"]
categories: ["networking", "security"]
---
The hub and spoke topology has been widely adopted for enterprise production deployment.
In this lab, let put on our network engineer hat and get our hand dirty on Azure Hub and spoke topology with one of the popular IaC -- Terraform.
Lets have a look at the high level architecture first.
![hubandspoke]({{< get_image_link image_name="hub-spoke.png" >}})
The essence of the topology is, but the name of it, having all traffic routed to hub network before forwarded to spoke network. In hub network Azure firewall will be deployed, processing and logging all the traffic. 
In spoke user defined route is configured to route the traffic to hub, one the traffic arrives hub and processed by firewall, policy will be applied depending on the requirement to either allow or deny.
We don't have the luxury to have a on-prem VPN device with a VPN connection or express route, hence we are using another vNet and connect that to the hub via vNet gateway to simulate traffic passing through a gateway.
Once we have the network all setup we will manually create some VMs to do some ping tests and the analyze the firewall logs using Azure Log analytics.
Without further ado let dive into each part.

## Part 1 Hub network with firewall
### 1.1 Create vNet and subnets
### 1.2 Deploy firewall instance
## Part 2 Spoke networks and peering to hub
### 2.1 Create vNets and subnets 
### 2.2 Setup peering to vNet
## Part 3 Another virtual network simulating on-prem via VPN
### 3.1 Create vNets and subnets
### 3.2 Create vNet to vNet VPN
## Part 4 Create some VMs to validate the traffic
### 4.1 Create some VMs
### 4.2 Ping tests 
## Part 5 Azure log analytics analysis