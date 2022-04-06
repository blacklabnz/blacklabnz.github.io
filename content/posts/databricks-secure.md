---
title: "Secure Databrick cluser with vNet injection and access resources via Azure private endponit"
date: 2022-03-28T23:39:13+13:00
draft: false
tags: ["terraform", "databricks", "private endpoints", "databrick secure connectivity", "databrick vNet injection", "keyvault backed secret scope"]
categories: ["databricks", "infrastructure as code", "security"]
author: "Neil Xu"
---

What an interesting topic I had recently regarding on seucrity hardening Databricks using Secure cluster connectivity + vNet injection.

This configuration will allow the cluster to access Azure Datalake Storage (I know right ?! what a popular combination!) and keyvault with private endpoint.

In this post, in a lab environment, we will find out how we can put Databrick cluster inside existing Azure virtual network and access private endpoint deployed inside it. 
For all infra related deployment I am going to use Terraform as much as possible to avoid any "ClickOps" efforts. Once Infra is done, we will run a quick notebook to validate the connectivity as well as DNS resolution


## Part 1 Overall Architecture of the lab
![architecture]({{< get_image_link image_name="dbr-secure.png" >}})
In this lab we will use databricks with [secured connectivity and vNet injection](https://docs.microsoft.com/en-us/azure/databricks/security/secure-cluster-connectivity) to access some data residing in the ADLS with [private endpiont](https://docs.microsoft.com/en-us/azure/storage/common/storage-private-endpoints) configuration.
We will also create keyvault for keeping the secrets invovled using private endpoint. 
In the end we will use a simply python notebook to validate two things agains the private Ip of the private endpoint:
1. the network connectivity 
2. DNS resolution 

As revealed on the diagram, we are simulating a well adopted hub and spoke topology. In our case we dont have any hub for this lab, but two spokes that connects to each other via vNet peering.
For the storage account private endpoint, well, we could have deployed that into the databricks vNet and they would naturally have connectivity(and secured by NSG if needed). But that removes the fun of dealing with Networking and sometime there are enough reason on the design to keep the private endpoint virtual network separate from other virtual network. We will also create keyvault with private enpoint and use that for a [KV backed secret scope](https://docs.microsoft.com/en-us/azure/databricks/security/secrets/secret-scopes) in databricks. In a nutshell a secret scope is a way to securely store secrets suchs as service principal key or a storage account key or any other type of secrets as such, so that we do hard code and secrets but are able to use "dbutil" to retrieve the secrets in a notebook run. Simple but yet important principle right ? no hard coded secret in your source code !!!!

## Part 2 Virtual networks and peering
### 2.1 Spoke databricks
Pretty standard configuration here, one thing to note is that the subnets name is dictated to be private and public. There are also requirements to the minimum size of the subnets, please refere to this [doc](https://docs.microsoft.com/en-us/azure/databricks/administration-guide/cloud-configurations/azure/vnet-inject#:~:text=Region%3A%20The%20VNet%20must%20reside,subnet%20and%20a%20host%20subnet.) for more details.
### 2.2 Spoke storage account and keyvault
Nothing complicated here, just need a separate subnets for storage account and keyvault private endpoints.
### 2.3 vNet peering
Virutal network peering ensures the connectivity between two virtual networks.

## Part 3 Databricks workspace and cluster
Lets create Databrick workspace and clusters in this part.
### 3.1 Databricks secure connectivity + vNet injection
To remove the exposure to public internet traffic, clusters can be deployed into pre-defined vNet.
### 3.2 Cluster creation
We will use terraform to create clusters, note we will need to add [databricks provider](https://registry.terraform.io/providers/databrickslabs/databricks/latest/docs) to terraform.

## Part 4 ADLS + Keyvault with Private endpoint
Lets create ADLS accoutn and Keyvault in this part.
### 4.1 Storage account with private endpoint
This should be a simple one, a storage account with private endpoint deployed to the spoke network.
### 4.2 Keyvault with private endpoint
This one is not too bad either, keyvualt with private endpoint deployed to the same spoke network.
One thing to note is the keyvault access policy, the service pricipal used to access the keyvault need to have the right secret policy set.
### 4.3 Azure private DNS zone
One the private enpoint is deployed, [private DNS zone](https://docs.microsoft.com/en-us/azure/private-link/private-endpoint-dns) is required so that a Azure private link DNS address could be resolved to the private IP address for the private endpoint.

## Part 5 Databricks configuration - Keyvault backed secret scope
Some configurations are required to create the keyvault backed secret scope, so that we dont need to hard code and secret in our notebooks.

## Part 6 Run notebook to validate
Let put some python code in and test the connectivity and DNS resolutions.