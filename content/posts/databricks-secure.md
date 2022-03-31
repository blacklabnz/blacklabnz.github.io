---
title: "Secure Databrick cluser with vNet injection and access resources via Azure private endponit"
date: 2022-03-28T23:39:13+13:00
draft: false
tags: ["terraform", "databricks", "private endpoints", "databrick secure connectivity", "databrick vNet injection", "keyvault backed secret scope"]
categories: ["databricks", "infrastructure as code", "security"]
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
For the storage account private endpoint, well, we could have deployed that into the databricks vNet and they would naturally have connectivity(and secured by NSG if needed). But that removes the fun of dealing with Networking and sometime there are enough reason on the design to keep the private endpoint virtual network separate from other virtual network. We will also create keyvault with private enpoint and use that for a ["KV backed secret scope"](https://docs.microsoft.com/en-us/azure/databricks/security/secrets/secret-scopes) in databricks. In a nutshell a secret scope is a way to securely store secrets suchs as service principal key or a storage account key or any other type of secrets as such, so that we do hard code and secrets but are able to use "dbutil" to retrieve the secrets in a notebook run. Simple but yet important principle right ? no hard coded secret in your source code !!!!

## Part 2 Virtual networks and peering
### 2.1 Spoke databricks
Pretty standard configuration here, one thing to note is that the subnets name is dictated to be private and public.
### 2.2 Spoke storage account and keyvault
Nothing complicated here, just need a separate subnets for storage account and keyvault private endpoints.
### 2.3 vNet peering
Virutal network peering ensures the connectivity between two virtual networks.

## Part 3 Databricks workspace and cluster
### 3.1 Databricks secure connectivity + vNet injection
### 3.2 Cluster creation

## Part 4 ADLS + Keyvault with Private endpoint
### 4.1 Storage account with private endpoint
### 4.2 Keyvault with private endpoint
### 4.3 Azure private DNS zone

## Part 5 Databricks configuration
### 5.1 Keyvault backed secret scope

## Part 6 Run notebook to validate